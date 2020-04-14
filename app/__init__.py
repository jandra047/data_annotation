from flask import Flask
from config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager


app = Flask(__name__)
app.config.from_object(Config)
db = SQLAlchemy(app)
migrate = Migrate(app, db)
login = LoginManager(app)
login.login_view = 'login'
login.login_message_category = 'info'


from app import routes, models

@app.shell_context_processor
def make_shell_context():
    return {'db': db, 'User': models.User, 'Project': models.Project, 'Image': models.Image, 'User2Project': models.User2Project, 'Mask': models.Mask}