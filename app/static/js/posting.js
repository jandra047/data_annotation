function getCookie(name) {
	var cookieValue = null;
	if (document.cookie && document.cookie !== '') {
		var cookies = document.cookie.split(';');
		for (var i = 0; i < cookies.length; i++) {
			var cookie = cookies[i].trim();
			// Does this cookie string begin with the name we want?
			if (cookie.substring(0, name.length + 1) === (name + '=')) {
				cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
				break;
			}
		}
	}
	return cookieValue;
	}
	
function sender(data) {
	
	var csrftoken = getCookie('csrftoken')
	var xhttp = new XMLHttpRequest();
	var method = 'POST';
	var asynchronous = true;

	xhttp.open(method, data.url + data.project_name, asynchronous);
	xhttp.setRequestHeader('X-CSRFToken', csrftoken);

	xhttp.onreadystatechange = function() {

		if (this.readyState === XMLHttpRequest.DONE) {
			// try parse json response
			try {
				response = JSON.parse(this.responseText);
			} catch (e) {
				// not json
			}
			
			switch (data.url) {
				case '/segment_calc':
					segments = response;
					loadingSpinner.style.display = 'none';
					break;
				case '/app/':
					if (!data.isCheckpoint) {
						image.src = response['src'];
						image.name = response['img_name'];
						image.style.width = response['img_width'] + "px";
						image.style.height = response['img_height'] + "px";
						break;
					}
			}
		}
	};
	// send request
	// when data has to be sent
	   // set json headers
	xhttp.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
		// format data into json and send request
	switch (data.url) {
		case '/app/':
			xhttp.send(
				JSON.stringify({
					'img_name' : data.imageName,
					'checkpoint' : data.isCheckpoint,
					'img_width' : data.imageWidth,
					'img_height' : data.imageHeight,
					'mask' : data.imgdata
				}));
			break;
		case '/segment_calc':
			xhttp.send(
				JSON.stringify({
					'project_name': data.project_name,
					'segmentNumber' : data.segmentNumber,
					'img_name' :data.imageName,
					'algorithm' : data.algorithm,
					'compactness' : data.compactness
				}));
			break;
		}
	
 	
}