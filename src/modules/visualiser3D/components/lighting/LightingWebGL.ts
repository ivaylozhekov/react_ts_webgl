
import * as getContext from 'get-canvas-context';
import { mat4, mat3, vec3 } from 'gl-matrix';

let triangleVertexPositionBuffer;
let triangleVertexColorBuffer;
let squareVertexPositionBuffer;
let squareVertexColorBuffer;

let pMatrix;
let mvMatrix;

let gl;

function initGL(canvas) {
    try {
        gl = getContext('webgl', {
            canvas: canvas,
            width: canvas.width,
            height: canvas.height,
            antialias: true
        })
    } catch(e) {
    }
    if (!gl) {
      alert("Could not initialise WebGL, sorry :-( ");
    }
  }


export function webGLStart(canvas) {
    initGL(canvas);

    initShaders()
    initBuffers();
    initMatrices();

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    //gl.clearColor(0.67843, 0.84706, 0.90196, 1.0);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    gl.depthFunc(gl.LEQUAL);

    gl.hint(gl.PERSPECTIVE_CORRECTION_HINT, gl.NICEST);

    gl.polygonOffset(2, 1);

    drawScene();

}

function getShader(gl, type) {
    let shaderStr = "";
    if (type == "x-fragment") {
        shaderStr = require('webpack-glsl!./shaders/x-fragment.glsl').slice(18, -1);
    } else if (type == "x-vertex") {
        shaderStr = require('webpack-glsl!./shaders/x-vertex.glsl').slice(18, -1);
    } else {
        return null;
    }

    let str = shaderStr.replace(/(\\r\\n|\\n|\\r)/gm," ");

    let shader;
    if (type == "x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == "x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

let shaderProgram;
  function initShaders() {
    let fragmentShader = getShader(gl, "x-fragment");
    let vertexShader = getShader(gl, "x-vertex");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  }

function initMatrices() {
    pMatrix = mat4.create();
    mvMatrix = mat4.create();

}

function drawScene() {

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(pMatrix, 45, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100.0);

    mat4.identity(mvMatrix);

    mat4.translate(mvMatrix, mvMatrix, [-1.5, 0.0, -7.0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, triangleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);

    mat4.translate(mvMatrix, mvMatrix, [3.0, 0.0, 0.0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);

}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function initBuffers() {
    triangleVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    let vertices = [
         0.0,  1.0,  0.0,
        -1.0, -1.0,  0.0,
         1.0, -1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    triangleVertexPositionBuffer.itemSize = 3;
    triangleVertexPositionBuffer.numItems = 3;

    triangleVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
    let colors = [
        0.5, 0.0, 0.0, 1.0,
        0.0, 0.5, 0.0, 1.0,
        0.0, 0.0, 0.5, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    triangleVertexColorBuffer.itemSize = 4;
    triangleVertexColorBuffer.numItems = 3;

    squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    vertices = [
         1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0,
         1.0, -1.0,  0.0,
        -1.0, -1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 3;
    squareVertexPositionBuffer.numItems = 4;

    squareVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
    colors = []
    for (let i=0; i < 4; i++) {
      colors = colors.concat([0.5, 0.5, 1.0, 1.0]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    squareVertexColorBuffer.itemSize = 4;
    squareVertexColorBuffer.numItems = 4;
}


