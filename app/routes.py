from flask import jsonify
from app import app, db
from app.forms import LoginForm, RegistrationForm
from flask import render_template, request, redirect, url_for, send_from_directory, flash, make_response
from app.functions import save_mask, load_image, add_to_done, create_user_files, create_mask_from_png, create_segments
from flask_login import login_user, logout_user, current_user, login_required
from app.models import User
from werkzeug.urls import url_parse
import os
import json

@app.route('/', methods=['GET', 'POST'])
@login_required
def index():
	if request.method == 'POST':
		mask = request.json['mask']
		img_name = request.json['img_name']
		checkpoint = request.json['checkpoint']
		img_height = request.json['img_height']
		img_width = request.json['img_width']
		if not checkpoint:
			# Save groundtruth as .png and add image name to done images
			save_mask(mask, current_user, img_name, img_height, img_width, checkpoint=False)
			add_to_done(img_name, current_user)
			# Return next image to client as a response
			img, img_name, mask = load_image(current_user)
			img_path = app.config['IMAGES_DIR'] + img_name
			segments = create_segments(img_path)
			response = {
				'img_path' : url_for('images', filename = img_name),
				'img_name' : img_name,
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
		img, img_name, mask = load_image(current_user)
		return render_template('index.html', title = title, img=img, filename=img_name, mask = mask)


@app.route('/receiver', methods=['GET', 'POST'])
def receive():
	mask = request.json['mask']
	img_name = request.json['img_name']
	checkpoint = request.json['checkpoint']
	img_height = request.json['img_height']
	img_width = request.json['img_width']
	if not checkpoint:
		# Save groundtruth as .png and add image name to done images
		save_mask(mask, current_user, img_name, img_height, img_width, checkpoint=False)
		add_to_done(img_name, current_user)
		# Return next image to client as a response
		img, img_name, mask = load_image(current_user)
		img_path = app.config['IMAGES_DIR'] + img_name
		segments = create_segments(img_path)
		response = {
			'img_path' : url_for('images', filename = img_name),
			'img_name' : img_name,
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

@app.route('/images/<path:filename>')
def images(filename):
	return send_from_directory(app.config['IMAGES_DIR'], filename)

@app.route('/segment_calc', methods=['GET', 'POST'])
def calculateSegments():
	segment_num = request.json['segmentNumber']
	img_name = request.json['img_name']
	algorithm = request.json['algorithm']
	img_path = app.config['IMAGES_DIR'] + img_name
	compactness = request.json['compactness']
	segments = create_segments(img_path, algorithm, segment_num, compactness)
	res_obj = make_response(jsonify(segments))
	return res_obj


@app.route('/users/<path:username>')
def user_dir(username):
	return f'/users/{username}'

@app.route('/login', methods = ['GET', 'POST'])
def login():
	if current_user.is_authenticated:
		return redirect(url_for('index'))
	form = LoginForm()
	if form.validate_on_submit():
		user = User.query.filter_by(username=form.username.data).first()
		if user is None or not user.check_password(form.password.data):
			flash('Invalid username or password')
			return redirect(url_for('login'))
		login_user(user, remember=form.remember_me.data)
		next_page = request.args.get('next')
		if not next_page or url_parse(next_page).netloc != '':
			next_page = url_for('index')
		return redirect(next_page)
	return render_template('login.html', title='DataAnnotation - Log in', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
	if current_user.is_authenticated:
		return redirect(url_for('index'))
	form = RegistrationForm()
	if form.validate_on_submit():
		user = User(username=form.username.data, email=form.email.data)
		user.set_password(form.password.data)
		user.set_homedir()
		db.session.add(user)
		db.session.commit()
		create_user_files(user)
		flash('Congratulations, you are now a registered user!')
		return redirect(url_for('login'))
	return render_template('register.html', title='DataAnnotation - Register', form=form)

@app.route('/logout')
def logout():
	logout_user()
	return redirect(url_for('index'))