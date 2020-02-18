$( document ).ready(function () {
	

	var checkpoint = false;
	var main_canvas = document.getElementById('inputCanvas');
	main_canvas.ctx = main_canvas.getContext('2d');
	main_canvas.ctx.globalAlpha = 0.5;
	var segs = new Uint8ClampedArray(segments.length)
	


	var offscreenLayer = document.createElement("canvas");
	offscreenLayer.width = main_canvas.width;
	offscreenLayer.height = main_canvas.height;
	offscreenLayer.ctx = offscreenLayer.getContext('2d');
	offscreenLayer.ctx.globalAlpha = 1;
	offscreenLayer.ctx.fillStyle = 'rgb(255,255,255)';

	var layer2 = document.getElementById('layer2');
	layer2.ctx = layer2.getContext('2d');
	layer2.ctx.globalAlpha = 0.5;
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
	function drawSegment(event) {
		mouse_pos = getMousePos(main_canvas, event);
		mouse_x = Math.round(mouse_pos['x']);
		mouse_y = Math.round(mouse_pos['y']);
		segment = segments[(main_canvas.width * (mouse_y-1) + mouse_x)*4];
		var segment_imagedata = new ImageData(width = main_canvas.width, height=main_canvas.height)
		console.log(mouse_x, mouse_y)
		for (let i = 0; i < segments.length; i++) {
		  if (segments[i] !== segment) {
		  	segs[i] = 0
		  } else {
		  	segs[i] = 255
		  }
		}

		segment_imagedata.data.set(segs);
		clearCanvas(main_canvas.ctx);
		combinedImageData = combineImageData(offscreenLayer.ctx.getImageData(0,0,layer2.width, layer2.height), segment_imagedata);
		offscreenLayer.ctx.putImageData(combinedImageData, 0, 0);
		main_canvas.ctx.drawImage(offscreenLayer, 0, 0)
		
	}
	
	function drawMask(mask) {
		mask_imageData = main_canvas.ctx.createImageData(width=main_canvas.width, height=main_canvas.height);
		mask_imageData.data.set(mask);
		offscreenLayer.ctx.putImageData(mask_imageData, 0, 0);
		main_canvas.ctx.drawImage(offscreenLayer, 0, 0);
	}

	function getMousePos(canvas, evt) {
		var rect = main_canvas.getBoundingClientRect();
		return {
			x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
			y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
		};
	}

	function drawCircle(e) {		
		clearCanvas(main_canvas.ctx);
		mouse_pos = getMousePos(main_canvas, e);
		var x = mouse_pos['x'];
		var y = mouse_pos['y'];
		var radius = brushRadius.getValue();
		//ctx.globalCompositeOperation = "source-out";
		
		offscreenLayer.ctx.beginPath();
		offscreenLayer.ctx.arc(x, y, radius, 0, 2*Math.PI);
		offscreenLayer.ctx.fill();
		main_canvas.ctx.drawImage(offscreenLayer, 0, 0);
	}

	function clearCanvas(context) {
		context.clearRect(0, 0, main_canvas.width, main_canvas.height);
	}

	function sendData() {
		image_data = main_canvas.ctx.getImageData(0, 0, main_canvas.width, main_canvas.height).data;
		data = [];
		for (var i = 3; i <= image_data.length; i = i+4) {
			data.push(image_data[i]);
		}
		img_name = document.getElementById('coveredImage').name;
		img_width = main_canvas.width;
		img_height = main_canvas.height;
		sender(data, url = '/receiver', img_name, img_width, img_height, checkpoint);
	}

	main_canvas.onmousedown = function(e) {
		main_canvas.isDrawing = true;
		
		if (document.querySelector('input[name="optradio"]:checked').value == 'brush') {
				clearCanvas(layer2.ctx)
				drawCircle(e);
				} else if (document.querySelector('input[name="optradio"]:checked').value == 'superpixel') {
					drawSegment(e)
					
				}
	}

	window.onmouseup = function(e) {
		main_canvas.isDrawing = false;
		}
	
	main_canvas.onmousemove = function(e) {
		if (!main_canvas.isDrawing) {
			if (document.querySelector('input[name="optradio"]:checked').value == 'brush') {
				clearCanvas(layer2.ctx);
				mouse_pos = getMousePos(main_canvas, e);
				var x = mouse_pos['x'];
				var y = mouse_pos['y'];
				var radius = brushRadius.getValue();
						
				layer2.ctx.beginPath();
				layer2.ctx.arc(x, y, radius, 0, 2*Math.PI);
				layer2.ctx.fill();
				} else if (document.querySelector('input[name="optradio"]:checked').value == 'superpixel') {
					//drawSegment(e)
				}


			
			return;		
		} else if (document.querySelector('input[name="optradio"]:checked').value == 'brush') {
			drawCircle(e);
		}
	}


	checkpointBtn.addEventListener('click', function (){
		checkpoint = true;
		sendData();
		});
	clearBtn.addEventListener('click', function (){
		clearCanvas(offscreenLayer.ctx)
		clearCanvas(main_canvas.ctx)
	});
	sendBtn.addEventListener('click', function (){
		checkpoint = false;
		sendData();
	});
	
	function combineImageData (imgdata1, imgdata2) {
		var canvas = document.getElementById('inputCanvas');
		imageData_1_data = imgdata1.data;
		imageData_2_data = imgdata2.data;
		var combinedImageData = new Uint8ClampedArray(imageData_1_data.length);

		var newImageData = new ImageData(canvas.width, canvas.height);
		for (var i = 0; i <= imageData_1_data.length; i++ ) {
			combinedImageData[i] = imageData_1_data[i] + imageData_2_data[i];
			
		}
		newImageData.data.set(combinedImageData);
		return newImageData;
	}



})



