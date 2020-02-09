from app import db, app
from flask_user import UserMixin
import os


class User(db.Model, UserMixin):
	id = db.Column(db.Integer, primary_key = True)
	username = db.Column(db.String(64), index=True, unique=True)
	email = db.Column(db.String(120), index=True, unique=True)
	password = db.Column(db.String(128), nullable=False)
	active = db.Column('is_active', db.Boolean(), nullable=False, server_default='1')
	
	def __init__(self, **kwargs):
		print(kwargs['username'])
		#super().__init__(**kwargs)
		#self.path = app.config['USER_HOME_DIR'] + self.username
		#os.mkdir(self.path)
		return        

	def __repr__(self):
		return f'<User {self.username}>'	





class Base(object):
    def __init__(self, arg1=1, arg2=2):
        self.arg1 = arg1
        self.arg2 = arg2

class Child(object):
    def __init__(self, arg1=1, arg2=2, arg3=3):
        super(Child, self).__init__(arg1, arg2)
        self.arg3 = arg3