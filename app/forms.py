from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField, MultipleFileField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo
from app.models import User, Project, User2Project
from flask_login import current_user
import imghdr

class ImageFileRequired(object):
	"""
	Validates that files uploaded from flask_wtf MultipleFileField are images.
	"""

	def __init__(self, message=None):
		if not message:
			message = 'Only image files accepted'
		self.message = message

	def __call__(self, form, field):
		if not all([imghdr.what('unused', img.read()) for img in field.data]):
			raise ValidationError(self.message)
		for img in field.data:
			img.seek(0)



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
	images = MultipleFileField('Photos', validators=[DataRequired(), ImageFileRequired()])

	def validate_name(self, name):
		project = current_user.projects.join(User2Project).filter(User2Project.role == 'admin', Project.name == name.data).one_or_none()
		if project is not None:
			raise ValidationError('Project with the same name already exists.')
