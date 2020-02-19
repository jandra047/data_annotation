$( document ).ready(function () {
	

	var isCheckpoint = false;

	/* Setting up main canvas from which data is eventually sent to server */
	var mainCanvas = document.getElementById('inputCanvas');
	mainCanvas.ctx = mainCanvas.getContext('2d');
	mainCanvas.ctx.globalAlpha = 0.4;
	
	/* Offscreen canvas is used to draw to main canvas with transparency */
	var offscreenCanvas = document.createElement("canvas");
	offscreenCanvas.width = mainCanvas.width;
	offscreenCanvas.height = mainCanvas.height;
	offscreenCanvas.ctx = offscreenCanvas.getContext('2d');
	offscreenCanvas.ctx.globalAlpha = 1;
	offscreenCanvas.ctx.fillStyle = 'rgb(255,255,255)';

	/* Canvas for visualising brush or superpixel area */
	var hoverCanvas = document.getElementById('layer2');
	hoverCanvas.ctx = hoverCanvas.getContext('2d');
	hoverCanvas.ctx.globalAlpha = 0.5;
	hoverCanvas.ctx.fillStyle = 'rgb(255,255,255)';
	
	/* Buttons and sliders  */
	var calculateSegmentsBtn = document.getElementById('calculateSegments');
	var clearBtn = document.getElementById('clearButton');
	var sendBtn = document.getElementById('sendButton');
	var checkpointBtn = document.getElementById('checkpointButton')
	var brushRadius = new Slider('#ex1', {
		formatter: function(value) {
			return 'Brush radius: ' + value;
		}
	});
	var segmentNumber = new Slider('.segments', {
		formatter: function(value) {
			return 'Number of segments: ' + value;
		}
	});

	/* If a mask is provided from checkpoint folder */
	if (mask) {
		drawMask(mask)
	}

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

	function changeAlphaValue(imageData, alpha) {
		for (let i=3; i<imageData.data.length; i=i+4) {
			imageData.data[i] = imageData.data[i] * alpha;
		}
		return imageData;
	}
	function drawSegment(event, isHover=false) {
		if (isHover) {
			clearCanvas(hoverCanvas.ctx);
			segmentImageData = calculateSegment(event);
			segmentImageData = changeAlphaValue(segmentImageData, alpha=0.5);
			hoverCanvas.ctx.putImageData(segmentImageData, 0, 0);

			}
		else {
			clearCanvas(mainCanvas.ctx, hoverCanvas.ctx);
			segmentImageData = calculateSegment(event);
			offscreenCanvasImageData = offscreenCanvas.ctx.getImageData(0,0,hoverCanvas.width, hoverCanvas.height);
			combinedImageData = combineImageData(offscreenCanvasImageData, segmentImageData);
			offscreenCanvas.ctx.putImageData(combinedImageData, 0, 0);
			mainCanvas.ctx.drawImage(offscreenCanvas, 0, 0)
		}		
	}

	function calculateSegment(event) {
		var segs = new Uint8ClampedArray(segments.length);
		mouse = getMousePos(mainCanvas, event);
		segment = segments[(mainCanvas.width * (Math.round(mouse.y)-1) + Math.round(mouse.x))*4];
		var segment_imagedata = new ImageData(width = mainCanvas.width, height=mainCanvas.height)
		
		for (let i = 0; i < segments.length; i++) {
		  if (segments[i] !== segment) {
		  	segs[i] = 0
		  } 
		  else {
		  	segs[i] = 255
		  }
		}
		segment_imagedata.data.set(segs);
		return segment_imagedata;
	}
	
	function drawMask(mask) {
		maskImageData = mainCanvas.ctx.createImageData(width=mainCanvas.width, height=mainCanvas.height);
		maskImageData.data.set(mask);
		offscreenCanvas.ctx.putImageData(maskImageData, 0, 0);
		mainCanvas.ctx.drawImage(offscreenCanvas, 0, 0);
	}

	function getMousePos(canvas, event) {
		var rect = mainCanvas.getBoundingClientRect();
		return {
			x: (event.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
			y: (event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
		};
	}

	function drawCircle(event, isHover=false) {
		if (isHover) {
			clearCanvas(hoverCanvas.ctx);
			mouse = getMousePos(mainCanvas, event);
			var radius = brushRadius.getValue();
					
			hoverCanvas.ctx.beginPath();
			hoverCanvas.ctx.arc(mouse.x, mouse.y, radius, 0, 2*Math.PI);
			hoverCanvas.ctx.fill();
		}
		else {
			clearCanvas(mainCanvas.ctx, hoverCanvas.ctx);
			mouse = getMousePos(mainCanvas, event);
			var radius = brushRadius.getValue();
					
			offscreenCanvas.ctx.beginPath();
			offscreenCanvas.ctx.arc(mouse.x, mouse.y, radius, 0, 2*Math.PI);
			offscreenCanvas.ctx.fill();
			mainCanvas.ctx.drawImage(offscreenCanvas, 0, 0);
		}		
	}

	function clearCanvas() {
		for (var i = 0; i < arguments.length; i++) {
		arguments[i].clearRect(0, 0, arguments[i].canvas.width, arguments[i].canvas.height);
		}

	}

	function sendData() {
		imageData = mainCanvas.ctx.getImageData(0, 0, mainCanvas.width, mainCanvas.height).data;
		data = [];
		for (var i = 3; i <= imageData.length; i = i+4) {
			data.push(imageData[i]);
		}
		imageName = document.getElementById('coveredImage').name;
		imageWidth = mainCanvas.width;
		imageHeight = mainCanvas.height;
		sender({'url':'/receiver', 'data':data, 'imageName':imageName, 'imageWidth':imageWidth, 'imageHeight':imageHeight, 'isCheckpoint':isCheckpoint});
	}

	mainCanvas.onmousedown = function(event) {
		mainCanvas.isDrawing = true;
		
		if (document.querySelector('input[name="optradio"]:checked').value == 'brush') {
				drawCircle(event, isHover=false);
				} else if (document.querySelector('input[name="optradio"]:checked').value == 'superpixel') {
					drawSegment(event, isHover=false);
					
				}
	}

	window.onmouseup = function(e) {
		mainCanvas.isDrawing = false;
		}
	
	mainCanvas.onmousemove = function(event) {
		if (!mainCanvas.isDrawing) {
			if (document.querySelector('input[name="optradio"]:checked').value == 'brush') {
				drawCircle(event, isHover=true);
				} else if (document.querySelector('input[name="optradio"]:checked').value == 'superpixel') {
					drawSegment(event, isHover=true);
					}
		} else if (document.querySelector('input[name="optradio"]:checked').value == 'brush') {
			drawCircle(event, isHover=false);
		} else {
			drawSegment(event, isHover=false);
		}
	}


	checkpointBtn.addEventListener('click', function (){
		isCheckpoint = true;
		sendData();
		});
	clearBtn.addEventListener('click', function (){
		clearCanvas(offscreenCanvas.ctx, mainCanvas.ctx, hoverCanvas.ctx)
	});
	sendBtn.addEventListener('click', function (){
		isCheckpoint = false;
		sendData();
	});
	calculateSegmentsBtn.addEventListener('click', function (){
		var numSegments = segmentNumber.getValue();
		imageName = document.getElementById('coveredImage').name;
		sender({'url':'/segment_calc', 'segmentNumber':numSegments, 'imageName':imageName});
	});
	
	
})



