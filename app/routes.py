import zipstream
from flask import jsonify, Response
from app import app, db
from app.forms import LoginForm, RegistrationForm, NewProjectForm
from flask import render_template, request, redirect, url_for, send_from_directory, flash, make_response
from app.functions import save_mask, load_image, add_to_done, create_user_files, create_mask_from_png, create_segments
from flask_login import login_user, logout_user, current_user, login_required
from app.models import User, Project, Image, User2Project, Mask
from werkzeug.utils import secure_filename
from werkzeug.urls import url_parse
import os
import json
import shutil


@app.route('/', methods=['GET', 'POST'])
@login_required
def home():
    projects = current_user.projects.all()
    form = NewProjectForm()
    if form.validate_on_submit():
        project_name = secure_filename(form.name.data)
        project = Project(name=project_name)
        User2Project(user=current_user, project=project, role='admin')
        for image in form.images.data:
            filename = secure_filename(image.filename)
            img_path = os.path.join(project.home_path, 'images', filename)
            image.save(img_path)
            img = Image(name=filename, path=img_path, project=project)
            project.images.append(img)
        db.session.commit()
        flash(f'Project {project.name} created successfully!', 'success')
        return redirect(url_for('home'))
    return render_template('home.html', title='Home', projects=projects, form=form)


@app.route('/app/<uuid:id>', methods=['GET', 'POST'])
@login_required
def index(id):
    if request.method == 'POST':
        mask = request.json['mask']
        img_name = request.json['img_name']
        checkpoint = request.json['checkpoint']
        img_height = request.json['img_height']
        img_width = request.json['img_width']
        if not checkpoint:
            try:
                project = current_user.projects.filter(Project.id == id).one()
                image = project.images.filter(Image.name == img_name).one()
                user2project = current_user.user2project.filter(
                    User2Project.project_id == id).one()
                user2project.done_images.append(image)
                Mask(image=image, user2project=user2project)
                db.session.commit()
                save_mask(mask, user2project, img_name,
                          img_height, img_width, checkpoint=False)
            except:
                pass
            try:
                image = user2project.next_image()
                segments = create_segments(image.path)
                response = {
                    'src': url_for('images', id=image.id),
                    'img_name': image.name,
                    'img_width': image.width,
                    'img_height': image.height,
                    'segments': segments,
                    'mask': mask
                }
                res_obj = make_response(jsonify(response))
            except:
                return redirect(url_for('home'))
            return res_obj
        else:
            print('Sejvaj mi masku')
            save_mask(mask, current_user, img_name,
                      img_height, img_width, checkpoint=True)
            return '#'
    else:
        title = 'DataAnnotation'
        project = current_user.projects.filter(Project.id == id).one()
        user2project = project.user2project.filter(
            User2Project.user == current_user).one()
        img = user2project.next_image()
        return render_template('index.html', title=title, img=img, mask=None)


@app.route('/add_user/<project_name>', methods=['POST'])
@login_required
def add_user(project_name):
    if request.method == 'POST':
        project = current_user.projects.filter(
            User2Project.role == 'admin', Project.name == project_name).one_or_none()
        if project:
            username = request.form['username']
            user = User.query.filter_by(username=username).one_or_none()
            if user:
                if project not in user.projects.all():
                    User2Project(user=user, project=project, role='non_admin')
                    db.session.commit()
                    flash(
                        f'User {username} successfully added to project {project.name}!', 'success')
                else:
                    flash(f'User {username} is already in the project', 'info')
            else:
                flash(f'No user named {username}', 'danger')
        else:
            flash('Permission denied', 'danger')
        return redirect(url_for('home'))


@app.route('/remove_user/<project_name>', methods=['POST'])
@login_required
def remove_user(project_name):
    if request.method == 'POST':
        project = current_user.projects.filter(
            User2Project.role == 'admin', Project.name == project_name).one_or_none()
        if project:
            username = request.form['username']
            user = User.query.filter_by(username=username).one_or_none()
            if user:
                u2p = project.user2project.filter(
                    User2Project.user == user).one()
                db.session.delete(u2p)
                db.session.commit()
                shutil.rmtree(u2p.home_path)
                flash(
                    f'User {username} successfully removed from project {project.name}!', 'success')
            else:
                flash(f'No user named {username}', 'danger')
    return redirect(url_for('home'))


@app.route('/images/<int:id>')
def images(id):
    img = Image.query.get(id)
    project = img.project
    return send_from_directory(os.path.join(project.home_path, 'images'), img.name)


@app.route('/segment_calc', methods=['GET', 'POST'])
def calculateSegments():
    segment_num = request.json['segmentNumber']
    project_name = request.json['project_name']
    img_name = request.json['img_name']
    algorithm = request.json['algorithm']
    img_path = os.path.join(Project.query.filter_by(
        name=project_name).first().home_path, 'images', img_name)
    compactness = request.json['compactness']
    segments = create_segments(img_path, algorithm, segment_num, compactness)
    res_obj = make_response(jsonify(segments))
    return res_obj


@app.route('/delete/<name>', methods=['POST'])
@login_required
def delete(name):
    if current_user.check_password(request.form['password']):
        project = current_user.projects.filter(
            Project.name == name, User2Project.role == 'admin').one_or_none()
        if project is not None:
            db.session.delete(project)
            db.session.commit()
            shutil.rmtree(project.home_path)
            flash(f"Project {project.name} deleted successfully", "info")
        else:
            flash(f"No project found named {name}", "danger")
    else:
        flash('Invalid password', 'danger')
    return redirect(url_for('home'))


@app.route('/download/<project_name>', methods=['GET'], endpoint='zipball')
@login_required
def zipball(project_name):
    z = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)
    project = current_user.projects.filter(
        User2Project.role == 'admin', Project.name == project_name).one_or_none()

    if project:
        path = os.path.join(project.home_path, 'users')
        for r, d, f in os.walk(path):
            for file in f:
                z.write(os.path.join(r, file), os.path.join(
                    project_name, r.split('/')[-1], file))
        response = Response(z, mimetype='application/zip')
        response.headers['Content-Disposition'] = f'attachment; filename={project_name}.zip'
        return response
    else:
        return redirect(url_for('home'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user is None or not user.check_password(form.password.data):
            flash('Invalid username or password', 'danger')
            return redirect(url_for('login'))
        login_user(user, remember=form.remember_me.data)
        next_page = request.args.get('next')
        if not next_page or url_parse(next_page).netloc != '':
            next_page = url_for('home')
        return redirect(next_page)
    return render_template('login.html', title='DataAnnotation - Log in', form=form)


@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash('Congratulations, you are now a registered user!', 'success')
        return redirect(url_for('login'))
    return render_template('register.html', title='DataAnnotation - Register', form=form)


@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('home'))
