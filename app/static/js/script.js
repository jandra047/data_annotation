$( document ).ready(function () {
	

	var checkpoint = false;
	var canvas = document.getElementById('inputCanvas');
	var ctx = canvas.getContext('2d');
	ctx.globalAlpha = 0.5;
	var rect = canvas.getBoundingClientRect();


	var layer1 = document.createElement("canvas");
	layer1.width = canvas.width;
	layer1.height = canvas.height;
	layer1.ctx = layer1.getContext('2d');
	layer1.ctx.globalAlpha = 1;
	layer1.ctx.fillStyle = 'rgb(255,255,255)';


	var layer2 = document.createElement("canvas");
	layer2.width = canvas.width;
	layer2.height = canvas.height;
	layer2.ctx = layer1.getContext('2d');
	layer2.ctx.globalAlpha = 1;
	layer2.ctx.fillStyle = 'rgb(255,255,255)';


	if (mask) {
		drawMask(mask)
	}

	

	var clearBtn = document.getElementById('clearButton');
	var sendBtn = document.getElementById('sendButton');
	var checkpointBtn = document.getElementById('checkpointButton')

	var brushRadius = new Slider('#ex1', {
		formatter: function(value) {
			return 'Current value: ' + value;
		}
	});

	
	function drawMask(mask) {
		mask_imageData = ctx.createImageData(width=canvas.width, height=canvas.height);
		mask_imageData.data.set(mask);
		layer1.ctx.putImageData(mask_imageData, 0, 0);
		ctx.drawImage(layer1, 0, 0);
	}

	function getMousePos(canvas, evt) {
		var rect = canvas.getBoundingClientRect();
		return {
			x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
			y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
		};
	}

	function drawCircle(e) {		
		clearCanvas(ctx);
		mouse_pos = getMousePos(canvas, e);
		var x = mouse_pos['x'];
		var y = mouse_pos['y'];
		var radius = brushRadius.getValue();
				
		layer1.ctx.beginPath();
		layer1.ctx.arc(x, y, radius, 0, 2*Math.PI);
		layer1.ctx.fill();
		ctx.drawImage(layer1, 0, 0);
	}

	function clearCanvas(context) {
		context.clearRect(0, 0, canvas.width, canvas.height);
	}

	function sendData() {
		image_data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
		data = [];
		for (var i = 3; i <= image_data.length; i = i+4) {
			data.push(image_data[i]);
		}
		img_name = document.getElementById('coveredImage').name;
		img_width = canvas.width;
		img_height = canvas.height;
		sender(data, url = '/receiver', img_name, img_width, img_height, checkpoint);
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

			//clearCanvas(ctx);
			ctx.globalCompositeOperation = "source-out";
			mouse_pos = getMousePos(canvas, e);
			var x = mouse_pos['x'];
			var y = mouse_pos['y'];
			var radius = brushRadius.getValue();
			
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, 2*Math.PI);
			ctx.fill();
			ctx.drawImage(layer1, 0, 0);

			return;		
		}
		drawCircle(e);		
	}


	checkpointBtn.addEventListener('click', function (){
		checkpoint = true;
		sendData();
		});
	clearBtn.addEventListener('click', function (){
		clearCanvas(layer1.ctx)
		clearCanvas(ctx)
	});
	sendBtn.addEventListener('click', function (){
		checkpoint = false;
		sendData();
	});
	
	
})