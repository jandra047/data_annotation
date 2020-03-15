$( document ).ready(function () {
	


	var currentMaskSaved = false;
	var isCheckpoint = false;
	var isClear = false;
	var tool = 'brush'

	var image = document.getElementById('coveredImage');
	var originalImageWidth = image.width;
	var originalImageHeight = image.height;
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

	/* Canvas for visualising brush or superpixel area on mouse hover */
	var hoverCanvas = document.getElementById('layer2');
	hoverCanvas.ctx = hoverCanvas.getContext('2d');
	hoverCanvas.ctx.globalAlpha = 0.5;
	hoverCanvas.ctx.fillStyle = 'rgb(255,255,255)';
	
	/* Buttons and sliders  */
	var calculateSegmentsBtn = document.getElementById('calculateSegments');
	var clearBtn = document.getElementById('clearButton');
	var sendBtn = document.getElementById('sendButton');
	var checkpointBtn = document.getElementById('checkpointButton')
	var brushRadius = new Slider('#brushRadius', {
		formatter: function(value) {
			return 'Brush radius: ' + value;
		}
	});
	var segmentNumber = new Slider('#segmentNumber', {
		formatter: function(value) {
			return 'Number of segments: ' + value;
		}
	});
	var slicCompactness = new Slider('#slicCompactness', {
		formatter: function(value) {
			return 'Compactness: ' + value;
		}
	});
	var zoomSlider = new Slider('#zoomSlider', {
		formatter: function(value) {
			return 'Zoom: ' + value + ' %';
		}
	});

	
	/* If a mask is provided from checkpoint folder */
	if (mask) {
		drawMask(mask)
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

	function clearCanvas() {
		for (var i = 0; i < arguments.length; i++) {
		arguments[i].clearRect(0, 0, arguments[i].canvas.width, arguments[i].canvas.height);
		}
	}

	function combineImageData (imgdata1, imgdata2, isClear=false) {
		var canvas = document.getElementById('inputCanvas');
		imageData_1_data = imgdata1.data;
		imageData_2_data = imgdata2.data;
		var combinedImageData = new Uint8ClampedArray(imageData_1_data.length);
		var newImageData = new ImageData(canvas.width, canvas.height);
		for (var i = 0; i <= imageData_1_data.length; i++ ) {
			if (!isClear) {
				combinedImageData[i] = imageData_1_data[i] + imageData_2_data[i];	
			}
			else {
				combinedImageData[i] = imageData_1_data[i] * imageData_2_data[i];
			}	
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

	function drawSegment(event, isHover=false, isClear=false) {
		if (isHover) {
			clearCanvas(hoverCanvas.ctx);
			segmentImageData = calculateSegment(event);
			segmentImageData = changeAlphaValue(segmentImageData, alpha=0.5);
			hoverCanvas.ctx.putImageData(segmentImageData, 0, 0);

			}
		else {
			if (!isClear) {
				clearCanvas(mainCanvas.ctx, hoverCanvas.ctx);
				segmentImageData = calculateSegment(event);
				offscreenCanvasImageData = offscreenCanvas.ctx.getImageData(0,0,hoverCanvas.width, hoverCanvas.height);
				combinedImageData = combineImageData(offscreenCanvasImageData, segmentImageData);
				offscreenCanvas.ctx.putImageData(combinedImageData, 0, 0);
				mainCanvas.ctx.drawImage(offscreenCanvas, 0, 0);
			}
			else {
				clearCanvas(mainCanvas.ctx, hoverCanvas.ctx);
				segmentImageData = calculateSegment(event, isClear=true);
				offscreenCanvasImageData = offscreenCanvas.ctx.getImageData(0,0,hoverCanvas.width, hoverCanvas.height);
				combinedImageData = combineImageData(offscreenCanvasImageData, segmentImageData, isClear=true);
				offscreenCanvas.ctx.putImageData(combinedImageData, 0, 0);
				mainCanvas.ctx.drawImage(offscreenCanvas, 0, 0);			
			}
		}		
	}

	function calculateSegment(event, isClear=false) {
		var segs = new Uint8ClampedArray(segments.length);
		mouse = getMousePos(mainCanvas, event);
		segment = segments[(mainCanvas.width * (Math.round(mouse.y)-1) + Math.round(mouse.x))*4];
		var segment_imagedata = new ImageData(width = mainCanvas.width, height=mainCanvas.height)
		
		for (let i = 0; i < segments.length; i++) {
				if (segments[i] !== segment) {
					if (!isClear) {
						segs[i] = 0;
					} else {
						segs[i] = 1;
					}
				} 
				else {
					if (!isClear) {
					segs[i] = 255;
					} else {
						segs[i] = 0;
					}
				}
		}
		segment_imagedata.data.set(segs);
		return segment_imagedata;
	}
	
	function drawCircle(event, isHover=false, isClear=false) {
		if (isClear) {
			offscreenCanvas.ctx.globalCompositeOperation = 'destination-out'
		} else {
			offscreenCanvas.ctx.globalCompositeOperation = 'source-over'	
		}	
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

	function sendData() {
		imageData = mainCanvas.ctx.getImageData(0, 0, mainCanvas.width, mainCanvas.height).data;
		data = [];
		for (var i = 3; i <= imageData.length; i = i+4) {
			data.push(imageData[i]);
		}
		imageName = image.name;
		imageWidth = mainCanvas.width;
		imageHeight = mainCanvas.height;
		sender({'url':'/receiver', 'data':data, 'imageName':imageName, 'imageWidth':imageWidth, 'imageHeight':imageHeight, 'isCheckpoint':isCheckpoint});
	}
	
	window.onmouseup = function(e) {
		mainCanvas.isDrawing = false;
		}
	
	mainCanvas.onmousedown = function(event) {
		currentMaskSaved = true;
		if (event.button === 0) {
			isClear = false;
			mainCanvas.isDrawing = true;
			if (tool == 'brush') {
					drawCircle(event, isHover=false, isClear);
					} else if (tool == 'superpixel') {
						drawSegment(event, isHover=false);
					}
		}
		if (event.button === 2) {
			mainCanvas.isDrawing = true;
			isClear = true;
			if (tool == 'brush') {
					drawCircle(event, isHover=false, isClear);
					} else if (tool == 'superpixel') {
						drawSegment(event, isHover=false, isClear);
					}
		}
	}

	mainCanvas.onmousemove = function(event) {
		if (!mainCanvas.isDrawing) {
			if (tool == 'brush') {
				drawCircle(event, isHover=true, isClear);
				} else if (tool == 'superpixel') {
					drawSegment(event, isHover=true);
					}
		} else if (tool == 'brush') {
			if (!isClear) {
				drawCircle(event, isHover=false, isClear);
			} else {
				drawCircle(event, isHover=false, isClear);
			}
		} else {
			drawSegment(event, isHover=false);
		}
	}

	mainCanvas.onmouseout = function(event) {
		clearCanvas(hoverCanvas.ctx);
	}

	checkpointBtn.addEventListener('click', function (){
		isCheckpoint = true;
		currentMaskSaved = false;
		sendData();
	});

	clearBtn.addEventListener('click', function (){
		clearCanvas(offscreenCanvas.ctx, mainCanvas.ctx, hoverCanvas.ctx)
	});

	sendBtn.addEventListener('click', function (){
		isCheckpoint = false;
		currentMaskSaved = false;
		sendData();
	});

	calculateSegmentsBtn.addEventListener('click', function (){
		var loadingSpinner = document.getElementById('loadingSpinner');
		loadingSpinner.style.display = 'inline-block';
		var numSegments = segmentNumber.getValue();
		imageName = image.name;
		var algorithm = document.getElementById('dropdownMenuButton').innerHTML;
		var compactness = slicCompactness.getValue();
		sender({'url':'/segment_calc', 'segmentNumber':numSegments, 'imageName':imageName, 'algorithm':algorithm, 'compactness':compactness});
	});

	$('#zoomSlider').on('change', function () {
		zoom = this.value;
		image.style.width = String(originalImageWidth*zoom ) + "px";
		outsideWrapper.style.width = String(originalImageWidth*zoom) + "px";
		outsideWrapper.style.height = String(originalImageHeight*zoom) + "px";	
	});

	$('#sidebarCollapse').on('click', function () {
		$('#sidebar').toggleClass('active');
	});
	
	// Cancel default right-click menu
	window.oncontextmenu = function () {
		return false;     
	}

	$('a[data-toggle="pill"]').on('shown.bs.tab', function (e) {
		tool = $(e.target).attr("value") // activated tab
	});

	$(".dropdown-menu a").click(function(){
		var selText = $(this).text();
		$("#dropdownMenuButton").html(selText);
		if (selText == "Slic") {
			$("#slicParams").show();
		} else {
			$("#slicParams").hide();
		}
	});

	window.onbeforeunload = function() {
		if (currentMaskSaved) {
			return "Do you really want to leave our brilliant application?";
		} else {
			return;
		}
	};

})



