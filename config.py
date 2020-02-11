import os

class Config(object):
	SECRET_KEY = 'Lec'
	APP_ROOT = os.path.dirname(os.path.abspath(__file__))
	SQLALCHEMY_DATABASE_URI = \
		os.environ.get('DATABASE_URL') or 'sqlite:///' + APP_ROOT + '/app.db'
	USER_APP_NAME = 'DataAnnotation'
	USER_ENABLE_USERNAME = True
	USER_ENABLE_EMAIL = False
	USER_ENABLE_REGISTRATION = False
	TESTING = False
	SQLALCHEMY_TRACK_MODIFICATIONS = False
	USERS_HOME_DIR = APP_ROOT + '/users/'
	IMAGES_DIR = APP_ROOT + '/images/'