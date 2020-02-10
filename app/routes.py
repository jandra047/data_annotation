from app import app
from flask import render_template, request, redirect, url_for, send_from_directory
from app.functions import save_mask
from PIL import Image
from flask_user import login_required
import os






@app.route('/')
@login_required
def index():
	title = 'DataAnnotation'
	
	img = Image.open(app.config['IMAGES_DIR']+ 'testimage.jpg')
	return render_template('index.html', title = title, img=img)


@app.route('/receiver', methods=['GET', 'POST'])
@login_required
def receive():
	mask = request.json['mask']
	name = 'test'
	save_mask(mask, name)
	return ""

@app.route('/images/<path:filename>')
def images(filename):
    return send_from_directory(app.config['IMAGES_DIR'], filename)






