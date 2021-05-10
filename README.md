A simple Flask webapp for categorical pixel labeling of histological slides. Written in Python (Flask), JavaScript.



# Installation

## Python Version
The latest version of Python 3 is recommended.
## PostgreSQL
This application was built and tested with PostgreSQL 13.2. After installing PostgreSQL package, a new database needs to be created.
For more information on how to setup a new PostgreSQL database visit https://wiki.archlinux.org/title/PostgreSQL.
## Virtual environment and Python requirements
Using virtual environments for managing dependencies for a project is always recommended. 
### Create an environment
```
$ python -m venv path/to/your/virtualenvironment
```
### Activate a virtual environment
```
$ source path/to/your/virtualenvironment/bin/activate
```
### Installing required Python modules from `requirements.txt`
```
$ pip install -r requirements.txt
```
## Linking your PostgreSQL database to the Flask application
In `.flaskenv` file, a variable `DATABASE_URL` needs to be correctly declared depending on the name of your newly created database.
### Creating a database migration repository
Each time a change is made to the database schema (app/models.py), a migration script is added to the repository with the details of the change. To apply the migrations to a database, these migration scripts are executed in the sequence they were created.
```
$ flask db init # only run when first creating a migration repository
$ flask db migrate 
$ flask db upgrade
```
## Running the application
From the folder you cloned the repository into run `flask run`.

# Using the application
## User roles
- This application is based on the idea that a user creates a new project by adding images to be annotated by themselves or other other users who are added to a project by the creator of it.
- Project creator can add other users by specifying their username.
- After a new user is added to a project, it will show up in their list of projects and they can start labeling.
## Main user interface
- When logged in, user is redirected to their home page where they can see projects they created or projects they were added to by choosing the corresponding tab (**Not implemented**)
## Tools and labeling
- In the current version, a brush tool with adjustable radius or one of provided superpixel algorithms with some adjustable parameters are supported.
	### Superpixels
	- 4 algorithms are currently implemented
	- For SLIC, a number of segments for a picture to be divided into can be set and compactness, ie. higher value makes superpixel shapes more cubic.
	- After making changes to either one of these parameters or choosing a different superpixel algorithm, `Calculate segments` applies it.

- Right clicking with either brush tool or a superpixel tool, deletes selected area of the mask.
- `Clear` button clears whole image mask.
- Image order cannot be changed. Only after a loaded image is finished labeling by clicking on the `Save groundtruth and next image` button, next one will be loaded.
- If a user cannot finish an image in a session, they can choose to `Save checkpoint` and logout, which will load current progress when a user logs back in and continues labeling.

## Getting labelled masks
Project creator can see the progress of all other participants by clicking on the `+` button and can download all masks by clicking the download masks icon.

# Code structure
## Backend
### Database
Database tables are defined in `models.py` and SQLAlchemy is used for object-relational mapping between classes and PostgreSQL database entities.
### Flask
Endpoints of the Flask app are defined in `routes.py`.
The Flask-WTF extension uses Python classes to represent web forms. A form class simply defines the fields of the form as class variables. These are stored in `forms.py`
## Frontend
### JavaScript
Main logic for drawing on HTML5 Canvas element which is overlaying the photo, is stored in `app/static/js/drawing.js`.
Sending and recieving data via POST method is implemented in `posting.js`.
### HTML, CSS
# TODO
- Implement save checkpoint
- Superpixel segments do not get received by frontend
- New user registration should be approved by IRB staff
- Database needs refactoring because of some cascading issues
- Different layouts on home screen for projects created by user and shared with them
- Add some kind of waiting indicator when an image is finished
- When user labels the last image of a project, redirect to home
- When creating a new project, modal box closes even if there are errors in the name of the project
- Fix background image on login screen