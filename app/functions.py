import numpy as np
import matplotlib.pyplot as plt


def save_mask(data, name):
	mask = np.array(data)
	mask = 255*(mask>0).astype(np.uint8)
	mask = np.reshape(mask, (1037, 1388))
	mask = np.expand_dims(mask, axis=-1)
	mask = np.repeat(mask, 3, axis=-1)
	plt.imsave(name + '.png', mask)
	return 0
