from app import app
import numpy as np
import matplotlib.pyplot as plt
from flask import url_for
import os


def save_mask(data, user, img_name):
	mask = np.array(data)
	mask = 255*(mask>0).astype(np.uint8)
	mask = np.reshape(mask, (1037, 1388))
	mask = np.expand_dims(mask, axis=-1)
	mask = np.repeat(mask, 3, axis=-1)
	plt.imsave(url_for('user_dir', username=user.username)[1:] + f'/{img_name}'[:-4] + '.png', mask)
	return 0

def load_image(user):
	all_images = os.listdir(app.config['IMAGES_DIR'])
	path = app.config['APP_ROOT'] + url_for('user_dir', username=user.username) + '/done_images.txt'
	if not os.path.isfile(path):
		os.mknod(path)
	with open(path, 'r') as file:
		done_images = file.read().splitlines()
		for image in all_images:
			if image not in done_images:
				return app.config['IMAGES_DIR'] + image	, image

def add_to_done(img_name, user):
	with open(app.config['USERS_HOME_DIR'] + f'/{user.username}' + '/done_images.txt', 'a') as file:
		file.write(img_name + '\n')







