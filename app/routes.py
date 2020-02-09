from app import app
from flask import render_template, request, redirect, url_for
from app.functions import save_mask
from PIL import Image
from flask_user import login_required
import os

APP_ROOT = os.path.dirname(os.path.abspath(__file__))



@app.route('/')
@login_required
def index():
	title = 'DataAnnotation'
	
	img = Image.open(APP_ROOT + '/static/' + 'testimage.jpg')
	return render_template('index.html', title = title, img=img)


@app.route('/receiver', methods=['GET', 'POST'])
@login_required
def receive():
	mask = request.json['mask']
	name = 'test'
	save_mask(mask, name)
	return ""


