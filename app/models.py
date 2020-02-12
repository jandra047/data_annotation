from app import db, login, app
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model, UserMixin):

	id = db.Column(db.Integer, primary_key = True)
	username = db.Column(db.String(64), index=True, unique=True)
	email = db.Column(db.String(120), index=True, unique=True)
	password_hash = db.Column(db.String(128), nullable=False)
	active = db.Column('is_active', db.Boolean(), nullable=False, server_default='1')
	home_path = db.Column(db.String(120), unique=True)


	def __repr__(self):
		return f'<User {self.username}>'	

	def set_password(self, password):
		self.password_hash = generate_password_hash(password)

	def check_password(self, password):
		return check_password_hash(self.password_hash, password)

	def set_homedir(self):
		self.home_path = app.config['USERS_HOME_DIR'] + f'{self.username}'
		
		

@login.user_loader
def load_user(id):
	return User.query.get(int(id))
		