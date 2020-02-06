from app import app
from flask import render_template, request, redirect, url_for
from app.functions import save_mask

@app.route('/')
def index():
	title = 'DataAnnotation'
	return render_template('index.html', title = title)

@app.route('/receiver', methods=['GET', 'POST'])
def receive():
	mask = request.json['mask']
	save_mask(mask)
	return ""

@app.route('/results')
def results():
	return render_template('index.html')

