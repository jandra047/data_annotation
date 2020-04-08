from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField, MultipleFileField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo
from app.models import User, Project
from flask_login import current_user

class LoginForm(FlaskForm):
	username = StringField('Username', validators=[DataRequired()], render_kw={'placeholder': 'Username'})
	password = PasswordField('Password', validators=[DataRequired()], render_kw={'placeholder': 'Password'})
	remember_me = BooleanField('Remember Me')

class RegistrationForm(FlaskForm):
	username = StringField('Username', validators=[DataRequired()], render_kw={'placeholder': 'Username'})
	email = StringField('Email', validators=[DataRequired(), Email()], render_kw={'placeholder': 'Email'})
	password = PasswordField('Password', validators=[DataRequired()], render_kw={'placeholder': 'Password'})
	password2 = PasswordField('Repeat Password', validators=[DataRequired(), EqualTo('password')], render_kw={'placeholder': 'Confirm password'})

	def validate_username(self, username):
		user = User.query.filter_by(username=username.data).first()
		if user is not None:
			raise ValidationError('Please use a different username.')

	def validate_email(self, email):
		user = User.query.filter_by(email=email.data).first()
		if user is not None:
			raise ValidationError('Please use a different email address.')

class NewProjectForm(FlaskForm):
	name = StringField('Project name', validators=[DataRequired()], render_kw={'placeholder': 'Project name'})
	images = MultipleFileField('Photos', validators=[DataRequired()])

	# def validate_name(self, name):
	# 	#project = Project.query.filter_by(name=name.data).first()
	# 	if project is not None:
	# 		raise ValidationError('Project with the same name already exists.')
