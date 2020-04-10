from flask import jsonify
from app import app, db
from app.forms import LoginForm, RegistrationForm, NewProjectForm
from flask import render_template, request, redirect, url_for, send_from_directory, flash, make_response
from app.functions import save_mask, load_image, add_to_done, create_user_files, create_mask_from_png, create_segments
from flask_login import login_user, logout_user, current_user, login_required
from app.models import User, Project, Image, User2Project
from werkzeug import secure_filename
from werkzeug.urls import url_parse
import os
import json
import shutil
from PIL import Image as IMAGE



@app.route('/manage')
def manage():
	return render_template('manage.html')

@app.route('/home', methods=['GET', 'POST'])
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
	return render_template('home.html', title='Home', projects = projects, form=form)


@app.route('/app/<project_name>', methods=['GET', 'POST'])
@login_required
def index(project_name):
	if request.method == 'POST':
		mask = request.json['mask']
		img_name = request.json['img_name']
		checkpoint = request.json['checkpoint']
		img_height = request.json['img_height']
		img_width = request.json['img_width']
		if not checkpoint:
			# Save groundtruth as .png and add image name to done images
			project = current_user.projects.filter(Project.name == project_name).one()
			user2project = User2Project.query.filter(User2Project.user == current_user, User2Project.project == project).one()
			save_mask(mask, user2project, img_name, img_height, img_width, checkpoint=False)
			image = project.images.filter(Image.name == img_name).one()
			DoneImage(project=project, user=current_user, image=image, user2project=user2project)
			# Return next image to client as a response
			db.session.commit()
			image = Image.query.filter(Image.project == project, Image.done == None).first()
			img = IMAGE.open(image.path)
			# img, img_name, mask = load_image(current_user)
			# img_path = app.config['IMAGES_DIR'] + img_name
			segments = create_segments(image.path)
			response = {
				'src' : url_for('images', id=image.id),
				'img_name' : image.name,
				'img_width' : img.size[0],
				'img_height' : img.size[1],
				'segments' : segments,
				'mask' : mask
			}
			res_obj = make_response(jsonify(response))
			return res_obj
		else:
			save_mask(mask, current_user, img_name, img_height, img_width, checkpoint = True)
			return '#'
	else:
		title = 'DataAnnotation'
		project = Project.query.join(User2Project).filter(Project.name == project_name, User2Project.role == 'admin', User2Project.user_id == current_user.id).one()
		img = Image.query.filter(Image.project == project, Image.done == None).first()
		return render_template('index.html', title = title, img=img, mask=None)

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
	img_path = os.path.join(Project.query.filter_by(name=project_name).first().home_path, 'images', img_name)
	compactness = request.json['compactness']
	segments = create_segments(img_path, algorithm, segment_num, compactness)
	res_obj = make_response(jsonify(segments))
	return res_obj

@app.route('/delete/<name>', methods=['POST'])
@login_required
def delete(name):
	project = current_user.projects.join(User2Project).filter(Project.name == name, User2Project.role == 'admin').one_or_none()
	if project is not None:
		shutil.rmtree(project.home_path)
		db.session.delete(project)
		db.session.commit()
		flash(f"Project {project.name} deleted successfully", "info")
		return redirect(url_for('home'))
	else:
		flash(f"No project with name {name} found", "danger")
		return redirect(url_for('home'))

@app.route('/login', methods = ['GET', 'POST'])
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

