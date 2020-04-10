import pathlib
from app import db, login, app
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import os
from flask_login import current_user
from sqlalchemy.schema import UniqueConstraint

class User(db.Model, UserMixin):

	__tablename__ = 'users'
	id = db.Column(db.Integer, primary_key = True)
	username = db.Column(db.String(64), index=True, unique=True)
	email = db.Column(db.String(120), index=True, unique=True)
	password_hash = db.Column(db.String(128), nullable=False)
	active = db.Column('is_active', db.Boolean(), nullable=False, server_default='1')
	
	projects = db.relationship('Project', secondary='user2project', lazy='dynamic')

	def __repr__(self):
		return f'<User {self.username}>'	

	def set_password(self, password):
		self.password_hash = generate_password_hash(password)

	def check_password(self, password):
		return check_password_hash(self.password_hash, password)

class Project(db.Model, UserMixin):

	__tablename__ = 'projects'
	id = db.Column(db.Integer, primary_key = True)
	name = db.Column(db.String(64), index=True)
	home_path = db.Column(db.String(128), unique=True)
	
	images = db.relationship('Image', backref='project', lazy='dynamic', cascade= 'all, delete-orphan')
	users = db.relationship('User', secondary='user2project', lazy='dynamic')

	def __init__(self, **kwargs):
		super(Project, self).__init__(**kwargs)
		self.home_path = os.path.join(app.config['PROJECTS_DIR'], f'{current_user.username}_{self.name}')
		pathlib.Path(os.path.join(self.home_path, 'images')).mkdir(parents=True, exist_ok=True)

	def __repr__(self):
		return f'<Project {self.name}>'

class Image(db.Model, UserMixin):

	__tablename__ = 'images'
	id = db.Column(db.Integer, primary_key = True)
	name = db.Column(db.String(64), index=True)
	path = db.Column(db.String(128), unique=True)
	project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))

	def __repr__(self):
		return f'<Image {self.name}>'

# class DoneImage(db.Model, UserMixin):
# 	__tablename__ = 'done_images'
# 	id = db.Column(db.Integer, primary_key=True)
# 	# user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
# 	image_id = db.Column(db.Integer, db.ForeignKey('images.id'))
# 	# project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
# 	mask_path = db.Column(db.String(400))
# 	# user = db.relationship('User', backref='done')
# 	image = db.relationship('Image', backref='done')
# 	# project = db.relationship('Project', backref='done')
	
# 	user2project_id = db.Column(db.Integer, db.ForeignKey('user2project.id'))
# 	# user2project = db.relationship('User2Project', backref=db.backref("done_images", cascade="all,delete"))
# 	def __init__(self, **kwargs):
# 		super(DoneImage, self).__init__(**kwargs)
# 		print(os.path.join(self.user2project.home_path, self.image.name))
# 		self.mask_path = os.path.join(self.user2project.home_path, self.image.name)

# 	def __repr__(self):
# 		return f'<{self.image} from {self.project} by {self.user}>'

class User2Project(db.Model, UserMixin):

	__tablename__ = 'user2project'
	__table_args__ = (UniqueConstraint('user_id', 'project_id', name='user_project_uc'),)
	id = db.Column(db.Integer, primary_key=True)
	user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
	project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
	role = db.Column(db.String(50), default='admin')
	home_path = db.Column(db.String, nullable=False, unique=True)

	# done_images = db.relationship('DoneImage', backref=db.backref("user2project", cascade="all,delete"), lazy='dynamic')
	user = db.relationship('User', backref=db.backref("user2project", cascade="all, delete-orphan", lazy='dynamic'))
	project = db.relationship('Project', backref=db.backref("user2project", cascade="all, delete-orphan", lazy='dynamic'))

	def __init__(self, **kwargs):
		super(User2Project, self).__init__(**kwargs)
		self.home_path = os.path.join(self.project.home_path, 'users', self.user.username)
		pathlib.Path(self.home_path).mkdir(parents=True, exist_ok=True)


@login.user_loader
def load_user(id):
	return User.query.get(int(id))
		