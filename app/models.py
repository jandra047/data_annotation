import pathlib
from app import db, login, app
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import os
from flask_login import current_user
from sqlalchemy.schema import UniqueConstraint
from PIL import Image as Img
from sqlalchemy.dialects.postgresql import UUID
import uuid

done_images = db.Table('done_images', db.Model.metadata,
	db.Column('user2project_id', db.Integer, db.ForeignKey('user2project.id', ondelete="CASCADE")),
	db.Column('image_id', db.Integer, db.ForeignKey('images.id', ondelete="CASCADE"))
)

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
	id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
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
	project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('projects.id'))
	height = db.Column(db.Integer)
	width = db.Column(db.Integer)

	done = db.relationship('Mask', backref='image', lazy='dynamic', cascade='all, delete-orphan')

	def __init__(self, **kwargs):
		super(Image, self).__init__(**kwargs)
		img = Img.open(self.path)
		self.height = img.height
		self.width = img.width

	def __repr__(self):
		return f'<Image {self.name}>'

class User2Project(db.Model, UserMixin):

	__tablename__ = 'user2project'
	__table_args__ = (UniqueConstraint('user_id', 'project_id', name='user_project_uc'),)
	id = db.Column(db.Integer, primary_key=True)
	user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
	project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('projects.id'))
	role = db.Column(db.String(50), default='admin')
	home_path = db.Column(db.String, nullable=False, unique=True)

	masks = db.relationship('Mask', backref='user2project', lazy='dynamic')
	user = db.relationship('User', backref=db.backref("user2project", cascade="all, delete-orphan", lazy='dynamic'))
	project = db.relationship('Project', backref=db.backref("user2project", cascade="all, delete-orphan", lazy='dynamic'))
	done_images = db.relationship("Image", secondary=done_images, backref="user2project")

	def __init__(self, **kwargs):
		super(User2Project, self).__init__(**kwargs)
		self.home_path = os.path.join(self.project.home_path, 'users', self.user.username)
		pathlib.Path(self.home_path).mkdir(parents=True, exist_ok=True)

	def __repr__(self):
		return f'<{self.project.name} --- {self.user.username}>'

	def next_image(self):
		next_image = None
		for image in self.project.images:
			if image not in self.done_images:
				next_image = image
				break
		return next_image

class Mask(db.Model, UserMixin):
	__tablename__ = 'masks'
	__table_args__ = (UniqueConstraint('image_id', 'user2project_id', name='user_project_image_uc'),)
	id = db.Column(db.Integer, primary_key=True)
	image_id = db.Column(db.Integer, db.ForeignKey('images.id', ondelete='CASCADE'))
	user2project_id = db.Column(db.Integer, db.ForeignKey('user2project.id', ondelete='CASCADE'))
	path = db.Column(db.String)

	def __init__(self, **kwargs):
		super(Mask, self).__init__(**kwargs)
		self.path = os.path.join(self.user2project.home_path, self.image.name)

	def __repr__(self):
		return f'<{self.image} by {self.user2project}>'


@login.user_loader
def load_user(id):
	return User.query.get(int(id))
		