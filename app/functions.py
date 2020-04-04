from app import app
import numpy as np
import matplotlib.pyplot as plt
from flask import url_for
import os
from skimage.segmentation import slic, watershed, quickshift, felzenszwalb
from skimage.color import rgb2gray
from skimage.filters import sobel
from PIL import Image

def save_mask(data, user, img_name, img_height,  img_width, checkpoint):
	mask = np.array(data)
	mask = 255*(mask>0).astype(np.uint8)
	mask = np.reshape(mask, (img_height, img_width))
	mask = np.expand_dims(mask, axis=-1)
	mask = np.repeat(mask, 3, axis=-1)
	if not checkpoint:
		plt.imsave(user.home_path + '/groundtruth' + f'/{img_name}'[:-4] + '.png', mask)
		remove_checkpoint(user)
	else:
		plt.imsave(user.home_path + f'/checkpoint/{img_name}'[:-4], mask, format='png')
	return 0

def load_image(user):
	mask = None
	all_images = os.listdir(app.config['IMAGES_DIR'])
	try:
		if not os.listdir(user.home_path + '/checkpoint'):
			with open(user.home_path + '/done_images.txt', 'r') as file:
				done_images = file.read().splitlines()
				for image_name in all_images:
					if image_name not in done_images:
						img = Image.open(app.config['IMAGES_DIR'] + image_name)
						return img, image_name, mask
		else:
			img_name = os.listdir(user.home_path + '/checkpoint')[0] + '.jpg'
			img = Image.open(app.config['IMAGES_DIR'] +  img_name)
			mask_path = user.home_path + '/checkpoint/' + img_name[:-4]
			mask = create_mask_from_png(mask_path)
			return img, img_name, mask
	except:
		img = None
		img_name = None
		mask = None
		print(img, img_name, mask)
		return img, img_name, mask

def add_to_done(img_name, user):
	with open(user.home_path + '/done_images.txt', 'a') as file:
		file.write(img_name + '\n')


def create_user_files(user):
	os.mkdir(user.home_path)
	os.mkdir(user.home_path + '/checkpoint')
	os.mkdir(user.home_path + '/groundtruth')
	os.mknod(user.home_path + '/done_images.txt')


def remove_checkpoint(user):
	try:
		img_name = os.listdir(user.home_path + '/checkpoint')[0]
		os.remove(user.home_path + '/checkpoint/' + img_name)
	except:
		print('No checkpoints to delete')

def create_mask_from_png(path):
	mask = plt.imread(path).copy()
	mask[:,:,3] = 255*(mask[:,:,2]>0)
	mask = np.ravel(mask).tolist()
	return mask

def create_segments(image_path, algorithm='Slic', n_segments=200, compactness=10):
	image = Image.open(image_path)
	if algorithm == 'Slic':
		segments = slic(image, n_segments=n_segments, compactness=compactness, sigma=0, multichannel=True).ravel()
		segments = np.repeat(segments, 4).tolist()
	elif algorithm == 'Watershed':
		gradient = sobel(rgb2gray(np.array(image)))
		segments = watershed(gradient, markers=250, compactness=0.001).ravel()
		segments = np.repeat(segments, 4).tolist()
	elif algorithm == 'Felzenszwalb':
		segments = felzenszwalb(image, scale=100, sigma=0.5, min_size=50).ravel()
		segments = np.repeat(segments, 4).tolist()
	else:
		segments = quickshift(image, kernel_size=3, max_dist=6, ratio=0.5).ravel()
		segments = np.repeat(segments, 4).tolist()
	return segments