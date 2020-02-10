from app import db, app
from flask_user import UserMixin, UserManager
from flask_login import current_user
import os


class User(db.Model, UserMixin):

	id = db.Column(db.Integer, primary_key = True)
	username = db.Column(db.String(64), index=True, unique=True)
	email = db.Column(db.String(120), index=True, unique=True)
	password = db.Column(db.String(128), nullable=False)
	active = db.Column('is_active', db.Boolean(), nullable=False, server_default='1')
	
	def __repr__(self):
		return f'<User {self.username}>'	


	#def __init__(self):
		