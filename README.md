# data_annotation

Flask web server for categorical pixel labeling

## Getting started

1. Install requirements
```
pip install -r requirements.txt
```
2. Create a database
```
flask db init
flask db migrate -m 'User table'
flask db upgrade
```
3. Add images to `images` folder with images you want to label 
4. `flask run`
