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
    var colorAttributeLocation = gl.getUniformLocation(program, "a_color");
    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

    // initial conditions
    var idxNowShape = 0;
    var mode = 0; // default mode = pen (0)
    var positions = [];
    var colorRGB = [0.3, 0.4, 0.9, 1.0];

    // event listeners
    var mouseClicked = false;

    canvas.addEventListener("mousedown", function(e){
      mouseClicked = true;
      if(mode == 0){ // pen
        positions.push([mode,[]]);
      }
      else if(mode == 1){ // line
        var x = e.pageX - this.offsetLeft; 
        var y = e.pageY - this.offsetTop;
        positions.push([mode,[x,y,x,y]]);
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
        }
        else if(mode == 1){ // line
          positions[idxNowShape][1].pop();
          positions[idxNowShape][1].pop();
          positions[idxNowShape][1].push(x, y);
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

    //COLOR PICKER
    const cpicker = document.getElementById("colorBtn");
    cpicker.addEventListener("change", function(e){
      console.log(e.target.value);
    });

    drawToScreen();
    function drawToScreen(){
      // Clear the canvas
      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Tell it to use our program (pair of shaders)
      gl.useProgram(program);

      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
      gl.uniform4fv(colorAttributeLocation, colorRGB);

      for(var i = 0; i < positions.length; i++){
        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions[i][1]), gl.STATIC_DRAW);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        
        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

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

main();