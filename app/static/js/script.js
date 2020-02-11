$( document ).ready(function () {
	
	var canvas = document.getElementById('inputCanvas')
	var ctx = canvas.getContext('2d')
	var clearBtn = document.getElementById('clearButton')
	var sendBtn = document.getElementById('sendButton')
	var rect = canvas.getBoundingClientRect();
	var brushRadius = new Slider('#ex1', {
	formatter: function(value) {
		return 'Current value: ' + value;
		}
	});


	function getMousePos(canvas, evt) {
    	var rect = canvas.getBoundingClientRect();
	    return {
	        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
	        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
	    };
	}

	function drawCircle(e) {		
		mouse_pos = getMousePos(canvas, e);
		var x = mouse_pos['x']
		var y = mouse_pos['y']
		//var x = e.pageX - rect.left;
		//var y = e.pageY - rect.top;
		var radius = brushRadius.getValue();
		//ctx.globalCompositeOperation = "source-out";
		ctx.globalAlpha = 0.8
		ctx.fillStyle = 'rgb(0,255,255)'
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
		img_name = document.getElementById('coveredImage').name
		sender(data, url = '/receiver', img_name)		
	}

	canvas.onmousedown = function(e) {
		canvas.isDrawing = true;
		
		drawCircle(e);
	}
	window.onmouseup = function(e) {
		ctx.canvas.isDrawing = false;
		
	}
	canvas.onmousemove = function(e) {
		if (!canvas.isDrawing) {
			return;		
			
		}
		drawCircle(e);		
		
	}

	clearBtn.addEventListener('click', clearCanvas);
	sendBtn.addEventListener('click', sendData)

})