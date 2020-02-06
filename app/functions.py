import numpy as np
import matplotlib.pyplot as plt


def save_mask(data):
	mask = np.array(data) 
	mask = (mask>0).astype(np.uint8)
	mask = np.reshape(mask, (256,256))
	plt.imsave('testicak', mask, format='png')
	return 0
