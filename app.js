// WebGL2 - 2D Image
// from https://webgl2fundamentals.org/webgl/webgl-2d-image.html

"use strict";
const glsl = x => x

var vertexShaderSource = `#version 300 es

in vec2 a_position;
in vec2 a_texCoord;
uniform vec2 u_resolution; 
out vec2 v_texCoord;


void main() {

  // convert the position from pixels to 0.0 to 1.0
  vec2 zeroToOne = a_position / u_resolution;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clipspace)
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

  // pass the texCoord to the fragment shader
  // The GPU will interpolate this value between points.
  v_texCoord = a_texCoord;
}
`;

var fragmentShaderSource = `#version 300 es

precision mediump float;

uniform sampler2D u_image;

in vec2 v_texCoord;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  outColor = texture(u_image, v_texCoord);
}
`;

function loadImgLeaves() {
  const image = new Image();
  //requestCORSIfNotSameOrigin(image, "https://webgl2fundamentals.org/webgl/resources/leaves.jpg")
  return new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = reject
    image.onabort = reject
    image.src = require('./leaves.jpg');
  })
}

export function createGLContext(extensions = [], trowIfFail = true) {
  const canvas = document.createElement('canvas')
  if (!canvas) {
    throw new Error(`Could not create canvas`)
  }
  const gl = canvas.getContext('webgl2')
  if (!gl) {
    throw new Error(`No webgl2 available`)
  }
  const registered = extensions.map(extension => [extension, gl.getExtension(extension)])
  const errors = registered.filter(f => !f[1]).map(f => f[0]) // get the "falsies"
  if (errors.length) {
    if (trowIfFail) {
      throw new Error(`These extentions could not be registered:${JSON.stringify(errors)}`)
    }
  }
  const supported = gl.getSupportedExtensions()
  const ext = new Map(registered)
  const rc = {}
  Object.defineProperties(rc, {
    supported: {
      value: Object.freeze(supported),
      writeable: false,
      configurable: false,
      enumerable: false
    },
    ext: {
      value: Object.freeze(ext),
      writeable: false,
      configurable: false,
      enumerable: false
    },
    canvas: {
      value: canvas,
      writeable: false,
      configurable: false,
      enumerable: false
    },
    gl: {
      value: gl,
      writeable: false,
      configurable: false,
      enumerable: true
    }
  })
  return rc
}

function createShader(gl, sourceCode, type) {
  
  var shader = gl.createShader(type);
  gl.shaderSource(shader, sourceCode);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    return [null, new TypeError(`Could not compile WebGL program. ${info}`)]
  }
  return [shader];

}

function createProgram(gl, vertShader, fragShader){
    
    const vs = createShader(gl, vertShader, gl.VERTEX_SHADER )
    const fs = createShader(gl, fragShader, gl.FRAGMENT_SHADER )
    
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    
    if ( !gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
      const info = gl.getProgramInfoLog(prog);
      return [ null, new TypeError(`Could not compile WebGL program. ${info}`)]
    }
    return [ prog ]
}

function attrib(gl, program, name){

    const attr =  gl.getAttribLocation(program, name)
    if (attr < 0){
        return [ attr ]
    }
    return [ null, new TypeError(`attribute [${name}] is not found`)]
}

function uniformLoc(gl, program, name){

    const uniform =  gl.getAttribLocation(program, name)
    if (uniform < 0){
        return [ uniform ]
    }
    return [ null, new TypeError(`attribute [${name}] is not found`)]
}


function render(image) {
  // Get A WebGL context

  /* 
  var canvas = document.getElementById("canvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }
  */

  // setup GLSL program
  //var program = webglUtils.createProgramFromSources(gl,
  //  [vertexShaderSource, fragmentShaderSource]);

  // look up where the vertex data needs to go.
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  var texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");

  // lookup uniforms
  var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  var imageLocation = gl.getUniformLocation(program, "u_image");

  // Create a vertex array object (attribute state)
  var vao = gl.createVertexArray();

  // and make it the one we're currently working with
  gl.bindVertexArray(vao);

  // Create a buffer and put a single pixel space rectangle in
  // it (2 triangles)
  var positionBuffer = gl.createBuffer();

  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2; // 2 components per iteration
  var type = gl.FLOAT; // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    positionAttributeLocation, size, type, normalize, stride, offset);

  // provide texture coordinates for the rectangle.
  var texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    0.0, 1.0,
    1.0, 0.0,
    1.0, 1.0,
  ]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(texCoordAttributeLocation);
  var size = 2; // 2 components per iteration
  var type = gl.FLOAT; // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    texCoordAttributeLocation, size, type, normalize, stride, offset);

  // Create a texture.
  var texture = gl.createTexture();

  // make unit 0 the active texture uint
  // (ie, the unit all other texture commands will affect
  gl.activeTexture(gl.TEXTURE0 + 0);

  // Bind it to texture unit 0' 2D bind point
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the parameters so we don't need mips and so we're not filtering
  // and we don't repeat at the edges
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // Upload the image into the texture.
  var mipLevel = 0; // the largest mip
  var internalFormat = gl.RGBA; // format we want in the texture
  var srcFormat = gl.RGBA; // format of data we are supplying
  var srcType = gl.UNSIGNED_BYTE; // type of data we are supplying
  gl.texImage2D(gl.TEXTURE_2D,
    mipLevel,
    internalFormat,
    srcFormat,
    srcType,
    image);

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // Bind the attribute/buffer set we want.
  gl.bindVertexArray(vao);

  // Pass in the canvas resolution so we can convert from
  // pixels to clipspace in the shader
  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

  // Tell the shader to get the texture from texture unit 0
  gl.uniform1i(imageLocation, 0);

  // Bind the position buffer so gl.bufferData that will be called
  // in setRectangle puts data in the position buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Set a rectangle the same size as the image.
  setRectangle(gl, 0, 0, image.width, image.height);

  // Draw the rectangle.
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 6;
  gl.drawArrays(primitiveType, offset, count);
}

function setRectangle(gl, x, y, width, height) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    x1, y1,
    x2, y1,
    x1, y2,
    x1, y2,
    x2, y1,
    x2, y2,
  ]), gl.STATIC_DRAW);
}

// This is needed if the images are not on the same domain
// NOTE: The server providing the images must give CORS permissions
// in order to be able to use the image with WebGL. Most sites
// do NOT give permission.
// See: http://webglfundamentals.org/webgl/lessons/webgl-cors-permission.html
//function requestCORSIfNotSameOrigin(img, url) {
//  if ((new URL(url)).origin !== window.location.origin) {
//    img.crossOrigin = "";
//  }
//}

function start() {
  console.log('hello world')
  loadImgLeaves().then(() => {
    console.log('loaded')
    const gc = createGLContext()
    const { gl } = gc
    console.log(gc)
    const p = createProgram(gl, vertexShaderSource, fragmentShaderSource)
    console.log(p)
    const program = p.prog
    let [a_textCoord, err] = attrib(gl, program, 'a_texCoord')
    let [a_position, err] = atrrib(gl, program, 'a_position')
    let [u_resolution, err] = gl.getUniformLocation(program, "u_resolution");
    let [u_image, err] = gl.getUniformLocation(program, "u_image");

     // Create a vertex array object (attribute state)
    const vao = gl.createVertexArray();

    // and make it the one we're currently working with
    gl.bindVertexArray(vao);

     // Create a buffer and put a single pixel space rectangle in
     // it (2 triangles)
    let a_position_buf = gl.createBuffer();

    // Turn on the attribute
    gl.enableVertexAttribArray(a_position);

    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, a_position_buf);

    console.log()
  })
}

window.onload = start