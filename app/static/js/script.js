$( document ).ready(function () {
	
	var canvas = document.getElementById('inputCanvas')
	var ctx = canvas.getContext('2d')
	var clearBtn = document.getElementById('clearButton')
	var sendBtn = document.getElementById('sendButton')

	function drawCircle(e) {
		var x = e.pageX - canvas.offsetLeft;
		var y = e.pageY - canvas.offsetTop;
		var radius = brushRadius.getValue();
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, 2*Math.PI);
		ctx.fill()
	}

	function clearCanvas() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}

	function sendData() {
		image_data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
		data = []
		for (var i = 3; i <= image_data.length; i = i+4) {
			data.push(image_data[i])
		}
		sender(data, url = '/receiver')		
	}


	canvas.onmousedown = function(e) {
		canvas.isDrawing = true;
		drawCircle(e);
	}
	canvas.onmouseup = function(e) {
		canvas.isDrawing = false;
	}
	canvas.onmousemove = function(e) {
		if (!canvas.isDrawing) {
			return;
		}
		drawCircle(e);
	}

	var brushRadius = new Slider('#ex1', {
	formatter: function(value) {
		return 'Current value: ' + value;
		}
	});


	clearBtn.addEventListener('click', clearCanvas);
	sendBtn.addEventListener('click', sendData)

})