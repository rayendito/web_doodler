"use strict";

function main(){
    // get canvas and webgl context
    const canvas = document.getElementById("canvas");
    const gl = canvas.getContext("webgl");

    if (gl === null) {
        alert("Browser mnh tida support WebGL ;(");
        return;
    }

    // resizing canvas spy jelas
    canvas.width  = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // viewport
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // STEP 1 : CREATE SHADERS AND THE PROGRAM
    // locate tempat di GLSL to *bikin shader*
    const vertexShaderSource = document.getElementById("vertex-shader").text;
    const fragmentShaderSource = document.getElementById("fragment-shader").text;

    // *bikin shader*
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    // create program
    const program = createProgram(gl, vertexShader, fragmentShader);

    //att and uniform locaitons
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var colorAttributeLocation = gl.getAttribLocation(program, "a_color");
    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

    // initial conditions
    var idxNowShape = 0;
    var mode = 0; // default mode = pen (0)
    var positions = [];
    var colorRGB = [0, 0, 0]; // default color black

    // event listeners
    var mouseClicked = false;

    canvas.addEventListener("mousedown", function(e){
      mouseClicked = true;
      var x = e.pageX - this.offsetLeft; 
      var y = e.pageY - this.offsetTop;
      if(mode == 0){ // pen
        positions.push([mode,[],[]]);
      }
      else if(mode == 1){ // line
        const colorTwice = colorRGB.concat(colorRGB);
        positions.push([mode,[x,y,x,y],colorTwice]);
      }
      else if(mode == 2){ // square
        const colorTwice = colorRGB.concat(colorRGB);
        const colorFour = colorTwice.concat(colorTwice);
        positions.push([mode,[x,y, x,y, x,y, x,y],colorFour]);
      }
    });

    canvas.addEventListener("mouseup", function(e){
      mouseClicked = false;
      idxNowShape++;
    });

    canvas.addEventListener("mousemove", function(e){
      if(mouseClicked){
        var x = e.pageX - this.offsetLeft; 
        var y = e.pageY - this.offsetTop;
        if(mode == 0){
          positions[idxNowShape][1].push(x, y);
          positions[idxNowShape][2].push(colorRGB[0], colorRGB[1], colorRGB[2]);
        }
        else if(mode == 1){ // line
          for(var i = 0; i < 2; i++){
            positions[idxNowShape][1].pop();
          }
          positions[idxNowShape][1].push(x, y);
        }
        else if(mode == 2){//square
          for(var i = 0; i < 6; i++){
            positions[idxNowShape][1].pop();
          }
          
        }
        drawToScreen();
      }
    });

    // CLEAR BUTTON
    const clr = document.getElementById("clearBtn");
    clr.addEventListener("click", function(e){
      idxNowShape = 0;
      positions = [];
      drawToScreen();
    });

    //CHANGE MODES
    const pen = document.getElementById("penBtn");
    pen.addEventListener("click", function(e){
      mode = 0;
    });

    const line = document.getElementById("lineBtn");
    line.addEventListener("click", function(e){
      mode = 1;
    });
    
    const sqr = document.getElementById("squareBtn");
    sqr.addEventListener("click", function(e){
      mode = 2;
    });

    const rect = document.getElementById("rectangleBtn");
    rect.addEventListener("click", function(e){
      mode = 3;
    });

    //COLOR PICKER
    const cpicker = document.getElementById("colorBtn");
    cpicker.addEventListener("change", function(e){
      const RGBval = hexToRGB(e.target.value);
      colorRGB[0] = RGBval[0];
      colorRGB[1] = RGBval[1];
      colorRGB[2] = RGBval[2];
    });

    drawToScreen();
    function drawToScreen(){
      // Clear the canvas
      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Tell it to use our program (pair of shaders)
      gl.useProgram(program);
      gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

      for(var i = 0; i < positions.length; i++){
        // bind the position buffer
        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions[i][1]), gl.STATIC_DRAW);
        // bind the color buffer
        var colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(positions[i][2]), gl.STATIC_DRAW);
        
        // POSITION Attribute
        //enable bind
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // how to get
        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

        // COLOR Attribute
        //enable bind
        gl.enableVertexAttribArray(colorAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

        // how to get
        size = 3;                 // 3 components per iteration soalnya 3d, ada x y z
        type = gl.UNSIGNED_BYTE;  // the data is 8bit unsigned values
        normalize = true;         // normalize the data (convert from 0-255 to 0-1)
        stride = 0;               // 0 = move forward size * sizeof(type) each iteration to get the next position
        offset = 0;               // start at the beginning of the buffer
        gl.vertexAttribPointer(colorAttributeLocation, size, type, normalize, stride, offset);

        var offset = 0;
        var count = positions[i][1].length/2;
        if(positions[i][0] == 0){
          var primitiveType = gl.LINE_STRIP;
        }
        else if(positions[i][0] == 1){
          var primitiveType = gl.LINES;
        }
        gl.drawArrays(primitiveType, offset, count);
      }
    }
}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      return program;
    }
   
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
  }

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }
   
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
  }

function hexToRGB(hex){
  var r = parseInt(hex[1]+hex[2], 16);
  var g = parseInt(hex[3]+hex[4], 16);
  var b = parseInt(hex[5]+hex[6], 16);
  return [r,g,b];//return 23,14,45 -> reformat if needed 
}

main();