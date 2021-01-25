import os


class Config(object):
    SECRET_KEY = 'A-very-secret-key'
    APP_ROOT = os.path.dirname(os.path.abspath(__file__))
    SQLALCHEMY_DATABASE_URI = \
        os.environ.get('DATABASE_URL') or 'sqlite:///' + \
        os.path.join(APP_ROOT, 'app.db')
    USER_APP_NAME = 'DataAnnotation'
    USER_ENABLE_USERNAME = True
    USER_ENABLE_EMAIL = False
    USER_ENABLE_REGISTRATION = False
    TESTING = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    USERS_HOME_DIR = APP_ROOT + '/users/'
    IMAGES_DIR = APP_ROOT + '/images/'
    PROJECTS_DIR = APP_ROOT + '/projects'
    SQLALCHEMY_ECHO = False
