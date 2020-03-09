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
	
function sender(context) {
	
	var csrftoken = getCookie('csrftoken')
	var xhttp = new XMLHttpRequest();
	// set params
	var method = 'POST';
	var asynchronous = true;

	xhttp.open(method, context.url, asynchronous);

	xhttp.setRequestHeader('X-CSRFToken', csrftoken);
	//xhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	//xhttp.setRequestHeader('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');

	xhttp.onreadystatechange = function() {

		if (this.readyState === XMLHttpRequest.DONE) {
			var response = this.responseText;
			// try parse json response
			try {
				response = JSON.parse(this.responseText);
			} catch (e) {
				// not json
			}
			// switch http status code
			switch (this.status) {
				case 200:
					window.location = response
					break;
				case 201:
					segments = response;
					var loadingSpinner = document.getElementById('loadingSpinner');
					loadingSpinner.style.display = 'none';
					break;
				case 400:
					console.log(response);
					break;
				case 404:
					console.log(response);
					break;
				case 500:
					console.log(response);
					break;
				default:
					// do nothing
					break;
			}
		}
	};
	// send request
	// when data has to be sent
	   // set json headers
	xhttp.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
		// format data into json and send request
	switch (context.url) {
		case '/receiver':
			xhttp.send(JSON.stringify({'img_name': context.imageName, 'checkpoint': context.isCheckpoint, 'img_width': context.imageWidth, 'img_height': context.imageHeight, 'mask' :context.data}));
			break;
		case '/segment_calc':
			xhttp.send(JSON.stringify({'segmentNumber': context.segmentNumber, 'img_name':context.imageName, 'algorithm':context.algorithm}));
			break;
		}
	
 	
}