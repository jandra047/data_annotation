// get canvas set up mouse and do the other things
var canvas = document.getElementById("canV"); 
var ctx = canvas.getContext("2d");
var w = canvas.width;
var h = canvas.height;

// create off screen layer that we will draw to
var layer1 = document.createElement("canvas");  
layer1.width = w;   // same size as the onscreen canvas
layer1.height = h; 
layer1.ctx = layer1.getContext("2d"); 
// set up drawing settings
layer1.ctx.lineCap = "round";
layer1.ctx.lineJoin = "round";
layer1.ctx.lineWidth = 16;
layer1.ctx.globalAlpha = 1;  // draw to this layer with alpha set to 1;

// set up onscreen canvas
ctx.globalAlpha = 1;
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.font = "24px Arial black";
var instructions = true;

// colours to show that different layer are overwriting each other
var colours = "#F00,#FF0,#0F0,#0FF,#00F,#F0F".split(",");
var currentCol = 0;


var mouse = {
    x:0,
    y:0,
    buttonLastRaw:0, // user modified value 
    buttonRaw:0,
    over:false,
};
function mouseMove(event){
    mouse.x = event.offsetX;  mouse.y = event.offsetY; 
    if(mouse.x === undefined){ mouse.x = event.clientX;  mouse.y = event.clientY;}    
    if(event.type === "mousedown"){ mouse.buttonRaw = 1;
    }else if(event.type === "mouseup"){mouse.buttonRaw = 0;
    }else if(event.type === "mouseout"){ mouse.buttonRaw = 0; mouse.over = false;
    }else if(event.type === "mouseover"){ mouse.over = true; }
    event.preventDefault();
}

canvas.addEventListener('mousemove',mouseMove);
canvas.addEventListener('mousedown',mouseMove);
canvas.addEventListener('mouseup'  ,mouseMove); 
canvas.addEventListener('mouseout'  ,mouseMove); 
canvas.addEventListener('mouseover'  ,mouseMove); 
canvas.addEventListener("contextmenu", function(e){      canvas.preventDefault();}, false);

// update on animation frame
function update(){
    ctx.clearRect(0,0,w,h);  // clear onscreen
    var c = layer1.ctx;      // short cut to the later1 context
    if(mouse.buttonRaw){    // if mouse down 
        if(mouse.lastx === undefined){   // is this start of drawing stroke
            mouse.lastx = mouse.x;   // set up drawing stroke
            mouse.lasty = mouse.y;
	        c.strokeStyle = colours[currentCol % colours.length];
            currentCol += 1;
            instructions = false;   // tuen of the instructions as they have worked it out
            ctx.globalAlpha = 0.6;  // should do this near layering but lasy
        }
        // draw the dragged stroke to the offscreen layer
        c.beginPath();
        c.moveTo(mouse.lastx,mouse.lasty);
        c.lineTo(mouse.x,mouse.y);
        c.stroke();
        mouse.lastx = mouse.x;
        mouse.lasty = mouse.y;        
    }else{  // if the mouse button up show drawing brush and instructions if
            // nothing has happened yet
        mouse.lastx = undefined;    // using this as a semaphore for drag start
        ctx.fillStyle = colours[currentCol%colours.length];
        ctx.globalAlpha = 0.6;    // the brush will compound the alpha 
                                   // this can be avoided by drawing it onto
                                   // the offscreen layer, but you will need 
                                   // another layer or some temp store to 
                                   // protect the offscreen layer. Again I am
                                   // to lazy to implement that right now.
        ctx.beginPath();
        ctx.arc(mouse.x,mouse.y,8,0,Math.PI*2);
        ctx.fill();
        if(instructions){         // show instructions if needed
          ctx.fillStyle = "blue";
          ctx.globalAlpha = 1;
          ctx.fillText("Click drag mouse to draw",250,60);
        }
    }
    
    // draw the offscreen layer onto the onscreen canvas at the alpha wanted
    ctx.drawImage(layer1,0,0);
    requestAnimationFrame(update);  // do it all again.
}
mouse.lastx;  // needed to draw lines.
mouse.lasty;
update()