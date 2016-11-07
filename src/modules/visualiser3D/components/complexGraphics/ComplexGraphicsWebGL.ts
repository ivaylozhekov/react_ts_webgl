import * as getContext from 'get-canvas-context';
import { mat4, mat3, vec3 } from 'gl-matrix';

var gl;
let _canvas;
let vertices;
function initGL(canvas) {
    _canvas = canvas
    try {
        gl = canvas.getContext("webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL!");
    }
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


var shaderProgram;

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

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
    shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
    shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
    shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");
    shaderProgram.alphaUniform = gl.getUniformLocation(shaderProgram, "uAlpha");
}


var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}


function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}


function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function Get3DRay(x2D, y2D) {
    var P0 = new Array();
    var P1 = new Array();

    var x = x2D;
    var y = y2D;
    var viewportArray = new Array(0, 0, gl.viewportWidth, gl.viewportHeight);

    var winX, winY;
    var winZ0 = 0; var winZ1 = 1;

    var posX0, posY0, posZ0;
    var posX1, posY1, posZ1;

    winX = x;
    winY = viewportArray[3] - y;

    //gl.readBuffer(gl.BACK);

    var modelPointArrayResults_0 = new Array();
    var modelPointArrayResults_1 = new Array();

    var success0 = GLU.unProject(winX, winY, winZ0, mvMatrix, pMatrix, viewportArray, modelPointArrayResults_0);
    var success1 = GLU.unProject(winX, winY, winZ1, mvMatrix, pMatrix, viewportArray, modelPointArrayResults_1);

    P0[0] = modelPointArrayResults_0[0];
    P0[1] = modelPointArrayResults_0[1];
    P0[2] = modelPointArrayResults_0[2];
    //
    P1[0] = modelPointArrayResults_1[0];
    P1[1] = modelPointArrayResults_1[1];
    P1[2] = modelPointArrayResults_1[2];

    var Mouse_Ray = {
        Near_PNT: P0,
        Far_PNT: P1
    }

    return Mouse_Ray;
}

var RotationMatrix = mat4.create();
mat4.identity(RotationMatrix);

var E_X1, E_Y1;

function MouseWheelHandler(event) {
    
    
    
    var Sign1;
    var delta;
    if (event.wheelDelta) {
        //alert(event.clientX);
        delta = event.wheelDelta;
        if (event.wheelDelta < 0)
            Sign1 = +1.0;
        else
            Sign1 = -1.0;
    }
    else if(event.detail)
    {
        delta = -event.detail/3;
        if (event.detail > 0)
            Sign1 = +1.0;
        else
            Sign1 = -1.0;
    }

    Current_View.PowerDX_1 = Current_View.PowerDX_1 - E_X1 * Sign1 * Math.abs(delta /100);
    Current_View.PowerDY_1 = Current_View.PowerDY_1 - E_Y1 * Sign1 * Math.abs(delta /100);
    
    Current_View.PowerS = Current_View.PowerS + delta;

    

    drawScene();
}

var Mid_X, Mid_Y;

function handleMouseDown(event) {

    if (event.which == 2) {

        EX = event.clientX;
        EY = event.clientY;

        EDX = event.clientX;
        EDY = event.clientY;
    }
    if (event.which == 1) {
        var Mouse_Ray = Get3DRay(event.clientX - 362, event.clientY - 116);

        /* -------------------------------------------------  Display Mouse Ray  --------------------------------------------------
        Temp_Lines_vertices[0] = Mouse_Ray.Near_PNT[0];
        Temp_Lines_vertices[1] = Mouse_Ray.Near_PNT[1];
        Temp_Lines_vertices[2] = Mouse_Ray.Near_PNT[2];
        Temp_Lines_indices[0] = 0;
        Temp_Lines_vertices[3] = Mouse_Ray.Far_PNT[0];
        Temp_Lines_vertices[4] = Mouse_Ray.Far_PNT[1];
        Temp_Lines_vertices[5] = Mouse_Ray.Far_PNT[2];
        Temp_Lines_indices[1] = 1;

        initTempBuffers();
        */

        //alert(Mouse_Ray.Far_PNT);

        var Hit_List = new Array();

        for (var i_vert = 0; i_vert < vertices.length; i_vert = i_vert + 9) {

            var Vc0 = new Array(vertices[i_vert + 0], vertices[i_vert + 1], vertices[i_vert + 2]);
            var Vc1 = new Array(vertices[i_vert + 3], vertices[i_vert + 4], vertices[i_vert + 5]);
            var Vc2 = new Array(vertices[i_vert + 6], vertices[i_vert + 7], vertices[i_vert + 8]);

            var Hit_Val = { t: 0, u: 0, v: 0 }

            if (Intersect_Triangle(Mouse_Ray.Near_PNT, Mouse_Ray.Far_PNT, Vc0, Vc1, Vc2, false, Hit_Val) == 1) {

                var HE = { Part: parts[i_vert / 9], Dist: Hit_Val.t }
                Hit_List[Hit_List.length] = HE;

            }

        }


        for (var BO in Bolt_Objects) {
            var BDist1 = 0;
            var alph_XZ = Bolt_Objects[BO].Angle_XZ;
            for (var BDB in Bolt_Objects[BO].Bolt_Dist) {
                BDist1 = BDist1 + Bolt_Objects[BO].Bolt_Dist[BDB] / 100;

                var Dx = BDist1 * Math.sin(alph_XZ);
                var Dz = -BDist1 * Math.cos(alph_XZ);

                for (var ka = 0; ka <= 1; ka++) {

                    for (var i_vert_b = 0; i_vert_b < Bolt_Objects[BO].Bolt_vertices.length; i_vert_b = i_vert_b + 9) {

                        var Dx1a = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 0] * Math.cos(alph_XZ);
                        var Dz1a = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 0] * Math.sin(alph_XZ);

                        var Dx1b = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 1] * Math.sin(alph_XZ);
                        var Dz1b = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 1] * Math.cos(alph_XZ);

                        var Dx2a = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 3] * Math.cos(alph_XZ);
                        var Dz2a = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 3] * Math.sin(alph_XZ);

                        var Dx2b = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 4] * Math.sin(alph_XZ);
                        var Dz2b = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 4] * Math.cos(alph_XZ);

                        var Dx3a = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 6] * Math.cos(alph_XZ);
                        var Dz3a = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 6] * Math.sin(alph_XZ);

                        var Dx3b = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 7] * Math.sin(alph_XZ);
                        var Dz3b = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 7] * Math.cos(alph_XZ);

                        var Vc0_b = new Array(Dx + Dx1a + Dx1b + Bolt_Objects[BO].Start_Point[0] / 100, Dz + Dz1a + Dz1b + Bolt_Objects[BO].Start_Point[2] / 100, Bolt_Objects[BO].Bolt_vertices[i_vert_b + 2] - Bolt_Objects[BO].Bolt_Y / 100 * ka + Bolt_Objects[BO].Start_Point[1] / 100 + Bolt_Objects[BO].Bolt_Y / 100 / 2);
                        var Vc1_b = new Array(Dx + Dx2a + Dx2b + Bolt_Objects[BO].Start_Point[0] / 100, Dz + Dz2a + Dz2b + Bolt_Objects[BO].Start_Point[2] / 100, Bolt_Objects[BO].Bolt_vertices[i_vert_b + 5] - Bolt_Objects[BO].Bolt_Y / 100 * ka + Bolt_Objects[BO].Start_Point[1] / 100 + Bolt_Objects[BO].Bolt_Y / 100 / 2);
                        var Vc2_b = new Array(Dx + Dx3a + Dx3b + Bolt_Objects[BO].Start_Point[0] / 100, Dz + Dz3a + Dz3b + Bolt_Objects[BO].Start_Point[2] / 100, Bolt_Objects[BO].Bolt_vertices[i_vert_b + 8] - Bolt_Objects[BO].Bolt_Y / 100 * ka + Bolt_Objects[BO].Start_Point[1] / 100 + Bolt_Objects[BO].Bolt_Y / 100 / 2);

                        var Hit_Val_b = { t: 0, u: 0, v: 0 }

                        if (Intersect_Triangle(Mouse_Ray.Near_PNT, Mouse_Ray.Far_PNT, Vc0_b, Vc1_b, Vc2_b, false, Hit_Val_b) == 1) {

                            var HE_b = { Part: Bolt_Objects[BO].Bolt_parts[0], Dist: Hit_Val_b.t }
                            Hit_List[Hit_List.length] = HE_b;

                        }

                    }
                }
            }
        }
       
        if (Hit_List.length > 0) {
            var HE1 = Hit_List[0];
            var S1 = HE1.Part;
            var S2 = HE1.Dist;
            for (var min_ind = 1; min_ind <= Hit_List.length - 1; min_ind++) {
                if (Hit_List[min_ind].Dist < S2) {
                    S2 = Hit_List[min_ind].Dist;
                    S1 = Hit_List[min_ind].Part;
                }
            }
            var Prev_0 = Selected_Part;

            Selected_Part = S1;

            if (Prev_0 != S1) {

                initColorBuffers();
                drawScene();
            }
        }
        else {
            var Prev = Selected_Part;
            Selected_Part = "";
            Selected_Assembly = "";
            if (Prev != "") {

                initColorBuffers();
                drawScene();
            }

        }
    }
    
}


var xDeg, yDeg;
var EX, EY;
var EDX, EDY;
var E_X, E_Y;

var Active_Part;
var Active_Assembly;
var Selected_Part;
var Selected_Assembly;

function handleMouseMove(event) {

    E_X1 = Mid_X - (event.clientX - 362);
    E_Y1 = -Mid_Y + (event.clientY - 116);

    if (event.which == 2) {
        E_X = event.clientX;
        E_Y = event.clientY;

        if (event.shiftKey == 1) {
            Current_View.xDeg = Current_View.xDeg - EY + event.clientY;
            Current_View.yDeg = Current_View.yDeg - EX + event.clientX;
        }
        else {
            Current_View.DistX = Current_View.DistX - EDX + event.clientX;
            Current_View.DistY = Current_View.DistY + EDY - event.clientY;
        }

        EX = event.clientX;
        EY = event.clientY;
        EDX = event.clientX;
        EDY = event.clientY;
        
        drawScene();
    }
    else {
       
        var Mouse_Ray = Get3DRay(event.clientX - 362, event.clientY - 116);

        /* -------------------------------------------------  Display Mouse Ray  --------------------------------------------------
        Temp_Lines_vertices[0] = Mouse_Ray.Near_PNT[0];
        Temp_Lines_vertices[1] = Mouse_Ray.Near_PNT[1];
        Temp_Lines_vertices[2] = Mouse_Ray.Near_PNT[2];
        Temp_Lines_indices[0] = 0;
        Temp_Lines_vertices[3] = Mouse_Ray.Far_PNT[0];
        Temp_Lines_vertices[4] = Mouse_Ray.Far_PNT[1];
        Temp_Lines_vertices[5] = Mouse_Ray.Far_PNT[2];
        Temp_Lines_indices[1] = 1;

        initTempBuffers();
        */


        var Hit_List = new Array();

        for (var i_vert = 0; i_vert < vertices.length; i_vert = i_vert + 9) {

            var Vc0 = new Array(vertices[i_vert + 0], vertices[i_vert + 1], vertices[i_vert + 2]);
            var Vc1 = new Array(vertices[i_vert + 3], vertices[i_vert + 4], vertices[i_vert + 5]);
            var Vc2 = new Array(vertices[i_vert + 6], vertices[i_vert + 7], vertices[i_vert + 8]);

            var Hit_Val = { t: 0, u: 0, v: 0 }

            if (Intersect_Triangle(Mouse_Ray.Near_PNT, Mouse_Ray.Far_PNT, Vc0, Vc1, Vc2, false, Hit_Val) == 1) {

                var HE = { Part: parts[i_vert / 9], Dist: Hit_Val.t }
                Hit_List[Hit_List.length] = HE;

            }

        }

       

        for (var BO in Bolt_Objects) {
            var BDist1 = 0;
            var alph_XZ = Bolt_Objects[BO].Angle_XZ;
            for (var BDB in Bolt_Objects[BO].Bolt_Dist) {
                BDist1 = BDist1 + Bolt_Objects[BO].Bolt_Dist[BDB] / 100;

                var Dx = BDist1 * Math.sin(alph_XZ);
                var Dz = -BDist1 * Math.cos(alph_XZ);

                for (var ka = 0; ka <= 1; ka++) {

                    for (var i_vert_b = 0; i_vert_b < Bolt_Objects[BO].Bolt_vertices.length; i_vert_b = i_vert_b + 9) {

                        var Dx1a = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 0] * Math.cos(alph_XZ);
                        var Dz1a = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 0] * Math.sin(alph_XZ);

                        var Dx1b = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 1] * Math.sin(alph_XZ);
                        var Dz1b = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 1] * Math.cos(alph_XZ);

                        var Dx2a = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 3] * Math.cos(alph_XZ);
                        var Dz2a = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 3] * Math.sin(alph_XZ);

                        var Dx2b = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 4] * Math.sin(alph_XZ);
                        var Dz2b = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 4] * Math.cos(alph_XZ);

                        var Dx3a = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 6] * Math.cos(alph_XZ);
                        var Dz3a = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 6] * Math.sin(alph_XZ);

                        var Dx3b = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 7] * Math.sin(alph_XZ);
                        var Dz3b = Bolt_Objects[BO].Bolt_vertices[i_vert_b + 7] * Math.cos(alph_XZ);

                        var Vc0_b = new Array(Dx + Dx1a + Dx1b + Bolt_Objects[BO].Start_Point[0] / 100, Dz + Dz1a + Dz1b + Bolt_Objects[BO].Start_Point[2] / 100, Bolt_Objects[BO].Bolt_vertices[i_vert_b + 2] - Bolt_Objects[BO].Bolt_Y / 100 * ka + Bolt_Objects[BO].Start_Point[1] / 100 + Bolt_Objects[BO].Bolt_Y / 100 / 2);
                        var Vc1_b = new Array(Dx + Dx2a + Dx2b + Bolt_Objects[BO].Start_Point[0] / 100, Dz + Dz2a + Dz2b + Bolt_Objects[BO].Start_Point[2] / 100, Bolt_Objects[BO].Bolt_vertices[i_vert_b + 5] - Bolt_Objects[BO].Bolt_Y / 100 * ka + Bolt_Objects[BO].Start_Point[1] / 100 + Bolt_Objects[BO].Bolt_Y / 100 / 2);
                        var Vc2_b = new Array(Dx + Dx3a + Dx3b + Bolt_Objects[BO].Start_Point[0] / 100, Dz + Dz3a + Dz3b + Bolt_Objects[BO].Start_Point[2] / 100, Bolt_Objects[BO].Bolt_vertices[i_vert_b + 8] - Bolt_Objects[BO].Bolt_Y / 100 * ka + Bolt_Objects[BO].Start_Point[1] / 100 + Bolt_Objects[BO].Bolt_Y / 100 / 2);

                        var Hit_Val_b = { t: 0, u: 0, v: 0 }

                        if (Intersect_Triangle(Mouse_Ray.Near_PNT, Mouse_Ray.Far_PNT, Vc0_b, Vc1_b, Vc2_b, false, Hit_Val_b) == 1) {

                            var HE_b = { Part: Bolt_Objects[BO].Bolt_parts[0], Dist: Hit_Val_b.t }
                            Hit_List[Hit_List.length] = HE_b;

                        }

                    }
                }
            }


        }
        
        if (Hit_List.length > 0) {
            var HE1 = Hit_List[0];
            var S1 = HE1.Part;
            var S2 = HE1.Dist;
            for (var min_ind = 1; min_ind <= Hit_List.length - 1; min_ind++) {
                if (Hit_List[min_ind].Dist < S2) {
                    S2 = Hit_List[min_ind].Dist;
                    S1 = Hit_List[min_ind].Part;
                }
            }
            var Prev_0 = Active_Part;

            Active_Part = S1;

            if (Prev_0 != S1) {

                initColorBuffers();
                drawScene();
            }
        }
        else {
            var Prev = Active_Part;
            Active_Part = "";
            Active_Assembly = "";
            if (Prev != "") {

                initColorBuffers();
                drawScene();
            }

        }

    }
}

var VertexPositionBuffer;
var FacesVertexNormalBuffer;
var FacesVertexColorBuffer;
var LinesVertexColorBuffer;
var FacesVertexIndexBuffer;
var LinesVertexIndexBuffer;

var VertexPositionBufferB;
var FacesVertexNormalBufferB;
var FacesVertexColorBufferB;
var LinesVertexColorBufferB;
var FacesVertexIndexBufferB;
var LinesVertexIndexBufferB;

var Bolt_VertexPositionBuffer = new Array();
var Bolt_FacesVertexNormalBuffer = new Array();
var Bolt_FacesVertexColorBuffer = new Array();
var A_Bolt_FacesVertexColorBuffer = new Array();
var S_Bolt_FacesVertexColorBuffer = new Array();
var Bolt_FacesVertexIndexBuffer = new Array();
var Bolt_LinesVertexIndexBuffer = new Array();
var Bolt_LinesVertexColorBuffer = new Array();

var Temp_LinesVertexPositionBuffer;
var Temp_LinesVertexIndexBuffer;

function initTempBuffers() {

    Temp_LinesVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Temp_LinesVertexPositionBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Temp_Lines_vertices), gl.DYNAMIC_DRAW);
    Temp_LinesVertexPositionBuffer.itemSize = 3;
    Temp_LinesVertexPositionBuffer.numItems = Temp_Lines_vertices.length / 3;

    Temp_LinesVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Temp_LinesVertexIndexBuffer);

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Temp_Lines_indices), gl.DYNAMIC_DRAW);
    Temp_LinesVertexIndexBuffer.itemSize = 1;
    Temp_LinesVertexIndexBuffer.numItems = Temp_Lines_indices.length;

}

var Selected_Part_Color = new Array(1, 0, 0, 1);
var Active_Part_Color = new Array(1, 1, 0, 1);

function initColorBuffers() {

    if (Active_Part != "") {
        var Tr_colors_1 = new Array();

        for (var p_num = 0; p_num < parts.length; p_num++) {

            Tr_colors_1[p_num * 12 + 0] = Tr_colors[p_num * 12 + 0];
            Tr_colors_1[p_num * 12 + 1] = Tr_colors[p_num * 12 + 1];
            Tr_colors_1[p_num * 12 + 2] = Tr_colors[p_num * 12 + 2];
            Tr_colors_1[p_num * 12 + 3] = Tr_colors[p_num * 12 + 3];
            Tr_colors_1[p_num * 12 + 4] = Tr_colors[p_num * 12 + 4];
            Tr_colors_1[p_num * 12 + 5] = Tr_colors[p_num * 12 + 5];
            Tr_colors_1[p_num * 12 + 6] = Tr_colors[p_num * 12 + 6];
            Tr_colors_1[p_num * 12 + 7] = Tr_colors[p_num * 12 + 7];
            Tr_colors_1[p_num * 12 + 8] = Tr_colors[p_num * 12 + 8];
            Tr_colors_1[p_num * 12 + 9] = Tr_colors[p_num * 12 + 9];
            Tr_colors_1[p_num * 12 + 10] = Tr_colors[p_num * 12 + 10];
            Tr_colors_1[p_num * 12 + 11] = Tr_colors[p_num * 12 + 11];

            if (parts[p_num] == Active_Part) {
                Tr_colors_1[p_num * 12 + 0] = Active_Part_Color[0];
                Tr_colors_1[p_num * 12 + 1] = Active_Part_Color[1];
                Tr_colors_1[p_num * 12 + 2] = Active_Part_Color[2];
                Tr_colors_1[p_num * 12 + 3] = Active_Part_Color[3];
                Tr_colors_1[p_num * 12 + 4] = Active_Part_Color[0];
                Tr_colors_1[p_num * 12 + 5] = Active_Part_Color[1];
                Tr_colors_1[p_num * 12 + 6] = Active_Part_Color[2];
                Tr_colors_1[p_num * 12 + 7] = Active_Part_Color[3];
                Tr_colors_1[p_num * 12 + 8] = Active_Part_Color[0];
                Tr_colors_1[p_num * 12 + 9] = Active_Part_Color[1];
                Tr_colors_1[p_num * 12 + 10] = Active_Part_Color[2];
                Tr_colors_1[p_num * 12 + 11] = Active_Part_Color[3];
            }

            if (parts[p_num] == Selected_Part) {
                Tr_colors_1[p_num * 12 + 0] = Selected_Part_Color[0];
                Tr_colors_1[p_num * 12 + 1] = Selected_Part_Color[1];
                Tr_colors_1[p_num * 12 + 2] = Selected_Part_Color[2];
                Tr_colors_1[p_num * 12 + 3] = Selected_Part_Color[3];
                Tr_colors_1[p_num * 12 + 4] = Selected_Part_Color[0];
                Tr_colors_1[p_num * 12 + 5] = Selected_Part_Color[1];
                Tr_colors_1[p_num * 12 + 6] = Selected_Part_Color[2];
                Tr_colors_1[p_num * 12 + 7] = Selected_Part_Color[3];
                Tr_colors_1[p_num * 12 + 8] = Selected_Part_Color[0];
                Tr_colors_1[p_num * 12 + 9] = Selected_Part_Color[1];
                Tr_colors_1[p_num * 12 + 10] = Selected_Part_Color[2];
                Tr_colors_1[p_num * 12 + 11] = Selected_Part_Color[3];
            }

        }
                
        gl.bindBuffer(gl.ARRAY_BUFFER, FacesVertexColorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Tr_colors_1), gl.DYNAMIC_DRAW);

    }
    else {
        var Tr_colors_2 = new Array();

        for (var p_num_2 = 0; p_num_2 < parts.length; p_num_2++) {

            if (parts[p_num_2] == Selected_Part) {
                Tr_colors_2[p_num_2 * 12 + 0] = Selected_Part_Color[0];
                Tr_colors_2[p_num_2 * 12 + 1] = Selected_Part_Color[1];
                Tr_colors_2[p_num_2 * 12 + 2] = Selected_Part_Color[2];
                Tr_colors_2[p_num_2 * 12 + 3] = Selected_Part_Color[3];
                Tr_colors_2[p_num_2 * 12 + 4] = Selected_Part_Color[0];
                Tr_colors_2[p_num_2 * 12 + 5] = Selected_Part_Color[1];
                Tr_colors_2[p_num_2 * 12 + 6] = Selected_Part_Color[2];
                Tr_colors_2[p_num_2 * 12 + 7] = Selected_Part_Color[3];
                Tr_colors_2[p_num_2 * 12 + 8] = Selected_Part_Color[0];
                Tr_colors_2[p_num_2 * 12 + 9] = Selected_Part_Color[1];
                Tr_colors_2[p_num_2 * 12 + 10] = Selected_Part_Color[2];
                Tr_colors_2[p_num_2 * 12 + 11] = Selected_Part_Color[3];
            }
            else {
                Tr_colors_2[p_num_2 * 12 + 0] = Tr_colors[p_num_2 * 12 + 0];
                Tr_colors_2[p_num_2 * 12 + 1] = Tr_colors[p_num_2 * 12 + 1];
                Tr_colors_2[p_num_2 * 12 + 2] = Tr_colors[p_num_2 * 12 + 2];
                Tr_colors_2[p_num_2 * 12 + 3] = Tr_colors[p_num_2 * 12 + 3];
                Tr_colors_2[p_num_2 * 12 + 4] = Tr_colors[p_num_2 * 12 + 4];
                Tr_colors_2[p_num_2 * 12 + 5] = Tr_colors[p_num_2 * 12 + 5];
                Tr_colors_2[p_num_2 * 12 + 6] = Tr_colors[p_num_2 * 12 + 6];
                Tr_colors_2[p_num_2 * 12 + 7] = Tr_colors[p_num_2 * 12 + 7];
                Tr_colors_2[p_num_2 * 12 + 8] = Tr_colors[p_num_2 * 12 + 8];
                Tr_colors_2[p_num_2 * 12 + 9] = Tr_colors[p_num_2 * 12 + 9];
                Tr_colors_2[p_num_2 * 12 + 10] = Tr_colors[p_num_2 * 12 + 10];
                Tr_colors_2[p_num_2 * 12 + 11] = Tr_colors[p_num_2 * 12 + 11];
            }

        }
        
        gl.bindBuffer(gl.ARRAY_BUFFER, FacesVertexColorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Tr_colors_2), gl.DYNAMIC_DRAW);

    }

}

function initBuffers() {
    
    VertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    VertexPositionBuffer.itemSize = 3;
    VertexPositionBuffer.numItems = vertices.length / 3;

    FacesVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, FacesVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    FacesVertexNormalBuffer.itemSize = 3;
    FacesVertexNormalBuffer.numItems = normals.length / 3;

    FacesVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, FacesVertexColorBuffer);
        
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Tr_colors), gl.DYNAMIC_DRAW);
    FacesVertexColorBuffer.itemSize = 4;
    FacesVertexColorBuffer.numItems = Tr_colors.length;
    
    LinesVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, LinesVertexColorBuffer);
       
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(L_colors), gl.STATIC_DRAW);
    LinesVertexColorBuffer.itemSize = 4;
    LinesVertexColorBuffer.numItems = L_colors.length;

    FacesVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, FacesVertexIndexBuffer);

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Tr_indices), gl.STATIC_DRAW);
    FacesVertexIndexBuffer.itemSize = 1;
    FacesVertexIndexBuffer.numItems = Tr_indices.length;
    
    LinesVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, LinesVertexIndexBuffer);

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(L_indices), gl.STATIC_DRAW);
    LinesVertexIndexBuffer.itemSize = 1;
    LinesVertexIndexBuffer.numItems = L_indices.length;

    //alert(verticesB);

    // --------------------------
    if (verticesB.length > 0) {
        VertexPositionBufferB = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, VertexPositionBufferB);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesB), gl.STATIC_DRAW);
        VertexPositionBufferB.itemSize = 3;
        VertexPositionBufferB.numItems = verticesB.length / 3;

        FacesVertexNormalBufferB = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, FacesVertexNormalBufferB);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalsB), gl.STATIC_DRAW);
        FacesVertexNormalBufferB.itemSize = 3;
        FacesVertexNormalBufferB.numItems = normalsB.length / 3;

        FacesVertexColorBufferB = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, FacesVertexColorBufferB);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Tr_colorsB), gl.DYNAMIC_DRAW);
        FacesVertexColorBufferB.itemSize = 4;
        FacesVertexColorBufferB.numItems = Tr_colorsB.length;

        LinesVertexColorBufferB = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, LinesVertexColorBufferB);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(L_colorsB), gl.STATIC_DRAW);
        LinesVertexColorBufferB.itemSize = 4;
        LinesVertexColorBufferB.numItems = L_colorsB.length;

        FacesVertexIndexBufferB = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, FacesVertexIndexBufferB);

        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Tr_indicesB), gl.STATIC_DRAW);
        FacesVertexIndexBufferB.itemSize = 1;
        FacesVertexIndexBufferB.numItems = Tr_indicesB.length;

        LinesVertexIndexBufferB = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, LinesVertexIndexBufferB);

        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(L_indicesB), gl.STATIC_DRAW);
        LinesVertexIndexBufferB.itemSize = 1;
        LinesVertexIndexBufferB.numItems = L_indicesB.length;
    }
    //alert(BObj1.Start_Point);

    for (var BO in Bolt_Objects) {

        Bolt_VertexPositionBuffer[BO] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, Bolt_VertexPositionBuffer[BO]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Bolt_Objects[BO].Bolt_vertices), gl.STATIC_DRAW);
        Bolt_VertexPositionBuffer[BO].itemSize = 3;
        Bolt_VertexPositionBuffer[BO].numItems = Bolt_Objects[BO].Bolt_vertices.length / 3;

        Bolt_FacesVertexNormalBuffer[BO] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, Bolt_FacesVertexNormalBuffer[BO]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Bolt_Objects[BO].Bolt_normals), gl.STATIC_DRAW);
        Bolt_FacesVertexNormalBuffer[BO].itemSize = 3;
        Bolt_FacesVertexNormalBuffer[BO].numItems = Bolt_Objects[BO].Bolt_normals.length / 3;

        Bolt_FacesVertexColorBuffer[BO] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, Bolt_FacesVertexColorBuffer[BO]);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Bolt_Objects[BO].Bolt_colors), gl.STATIC_DRAW);
        Bolt_FacesVertexColorBuffer[BO].itemSize = 4;
        Bolt_FacesVertexColorBuffer[BO].numItems = Bolt_Objects[BO].Bolt_colors.length;

        // Active Bolt Colors

        A_Bolt_FacesVertexColorBuffer[BO] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, A_Bolt_FacesVertexColorBuffer[BO]);


        var A_Colors_b = [];
        for (var A_i_b = 0; A_i_b < Bolt_Objects[BO].Bolt_colors.length; A_i_b += 4) {
            A_Colors_b[A_Colors_b.length] = Active_Part_Color[0];
            A_Colors_b[A_Colors_b.length] = Active_Part_Color[1];
            A_Colors_b[A_Colors_b.length] = Active_Part_Color[2];
            A_Colors_b[A_Colors_b.length] = Active_Part_Color[3];
        }


        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(A_Colors_b), gl.STATIC_DRAW);
        A_Bolt_FacesVertexColorBuffer[BO].itemSize = 4;
        A_Bolt_FacesVertexColorBuffer[BO].numItems = Bolt_Objects[BO].Bolt_colors.length;

        // Selected Bolt Colors

        S_Bolt_FacesVertexColorBuffer[BO] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, S_Bolt_FacesVertexColorBuffer[BO]);

        var S_Colors_b = [];
        for (var S_i_b = 0; S_i_b < Bolt_Objects[BO].Bolt_colors.length; S_i_b += 4) {
            S_Colors_b[S_Colors_b.length] = Selected_Part_Color[0];
            S_Colors_b[S_Colors_b.length] = Selected_Part_Color[1];
            S_Colors_b[S_Colors_b.length] = Selected_Part_Color[2];
            S_Colors_b[S_Colors_b.length] = Selected_Part_Color[3];
        }

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(S_Colors_b), gl.STATIC_DRAW);
        S_Bolt_FacesVertexColorBuffer[BO].itemSize = 4;
        S_Bolt_FacesVertexColorBuffer[BO].numItems = Bolt_Objects[BO].Bolt_colors.length;

        Bolt_LinesVertexColorBuffer[BO] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, Bolt_LinesVertexColorBuffer[BO]);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Bolt_Objects[BO].Bolt_L_colors), gl.STATIC_DRAW);
        Bolt_LinesVertexColorBuffer[BO].itemSize = 4;
        Bolt_LinesVertexColorBuffer[BO].numItems = Bolt_Objects[BO].Bolt_L_colors.length;

        Bolt_FacesVertexIndexBuffer[BO] = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Bolt_FacesVertexIndexBuffer[BO]);

        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Bolt_Objects[BO].Bolt_indices), gl.STATIC_DRAW);
        Bolt_FacesVertexIndexBuffer[BO].itemSize = 1;
        Bolt_FacesVertexIndexBuffer[BO].numItems = Bolt_Objects[BO].Bolt_indices.length;

        Bolt_LinesVertexIndexBuffer[BO] = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Bolt_LinesVertexIndexBuffer[BO]);

        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Bolt_Objects[BO].Bolt_L_indices), gl.STATIC_DRAW);
        Bolt_LinesVertexIndexBuffer[BO].itemSize = 1;
        Bolt_LinesVertexIndexBuffer[BO].numItems = Bolt_Objects[BO].Bolt_L_indices.length;
    }
}

var rJoint = 0;

function drawScene() {
    
    if (Current_View.Rotate_Incr == 0)
        RI = 0.5;
    else
        RI = Current_View.Rotate_Incr;

    if (Current_View.Zoom_Incr == 0)
        ZI = 0.002;
    else
        ZI = Current_View.Zoom_Incr;

    if (Current_View.Translate_Incr == 0)
        TI = 0.0002;
    else
        TI = Current_View.Translate_Incr;

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100000.0, pMatrix);

    mat4.identity(mvMatrix);

    mat4.translate(mvMatrix, mvMatrix, [(Current_View.DistX * TI + Current_View.PowerDX_1 * ZI * 1.05 / 10), (Current_View.DistY * TI + Current_View.PowerDY_1 * ZI * 1.05 / 10), (Current_View.DistZ + Current_View.PowerS * ZI)]);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(Current_View.xDeg * Current_View.Rotate_Incr), [1, 0, 0]);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(Current_View.yDeg * Current_View.Rotate_Incr), [0, 1, 0]);


    var lighting = true;
    gl.uniform1i(shaderProgram.useLightingUniform, lighting);
    if (lighting) {

        gl.uniform3f(shaderProgram.ambientColorUniform, parseFloat(0.3), parseFloat(0.3), parseFloat(0.3));

        var lightingDirection = [parseFloat(0), parseFloat(0), parseFloat(-1)];
        var adjustedLD = vec3.create();
        vec3.normalize(lightingDirection, adjustedLD);
        vec3.scale(adjustedLD, -1);
        gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);

        gl.uniform3f(shaderProgram.directionalColorUniform, parseFloat(0.6), parseFloat(0.6), parseFloat(0.6));

    }


    if (verticesB.length > 0) {
        gl.blendFunc(gl.DST_ALPHA, gl.GL_ONE);
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.uniform1f(shaderProgram.alphaUniform, 1); // parseFloat(document.getElementById("alpha").value));


        gl.bindBuffer(gl.ARRAY_BUFFER, VertexPositionBufferB);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, VertexPositionBufferB.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, FacesVertexNormalBufferB);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, FacesVertexNormalBufferB.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, FacesVertexColorBufferB);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, FacesVertexColorBufferB.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, FacesVertexIndexBufferB);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, FacesVertexIndexBufferB.numItems, gl.UNSIGNED_SHORT, 0);
                
    }

    gl.disable(gl.BLEND);
    gl.uniform1f(shaderProgram.alphaUniform, 1)
    gl.enable(gl.DEPTH_TEST);

    //---------------------------- blend lines
    if (verticesB.length > 0) {
        //gl.bindBuffer(gl.ARRAY_BUFFER, VertexPositionBufferB);
        //gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, VertexPositionBufferB.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, LinesVertexColorBufferB);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, LinesVertexColorBufferB.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, LinesVertexIndexBufferB);
        setMatrixUniforms();
        gl.drawElements(gl.LINES, LinesVertexIndexBufferB.numItems, gl.UNSIGNED_SHORT, 0);
    }
    //----------------------------------------

    gl.bindBuffer(gl.ARRAY_BUFFER, VertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, VertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, FacesVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, FacesVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, FacesVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, FacesVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, FacesVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, FacesVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, LinesVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, LinesVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, LinesVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.LINES, LinesVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    gl.lineWidth(3.0);
    // ------------------------------------------------  Draw Bolts

    //alert(Bolt_Objects.length);
    for (var BO in Bolt_Objects) {
        //alert(Bolt_Objects[BO].Start_Point[2]);


        mvPushMatrix();
        

        mat4.translate(mvMatrix, [Bolt_Objects[BO].Start_Point[0] / 100, 0, 0]);
        mat4.translate(mvMatrix, [0, Bolt_Objects[BO].Start_Point[2] / 100, 0]);
        mat4.translate(mvMatrix, [0, 0, Bolt_Objects[BO].Start_Point[1] / 100]);
        
        if (Bolt_Objects[BO].Angle_XZ != 0)
            mat4.rotate(mvMatrix, Bolt_Objects[BO].Angle_XZ, [0, 0, 1]);

        for (var BDt in Bolt_Objects[BO].Bolt_Dist) {

            if (BDt != 0)
                mat4.translate(mvMatrix, [0, 0, Bolt_Objects[BO].Bolt_Y / 100]);
            else
                mat4.translate(mvMatrix, [0, 0, Bolt_Objects[BO].Bolt_Y / 100 / 2]);

            mat4.translate(mvMatrix, [0, -Bolt_Objects[BO].Bolt_Dist[BDt] / 100, 0]);
            gl.bindBuffer(gl.ARRAY_BUFFER, Bolt_VertexPositionBuffer[BO]);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, Bolt_VertexPositionBuffer[BO].itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, Bolt_FacesVertexNormalBuffer[BO]);
            gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, Bolt_FacesVertexNormalBuffer[BO].itemSize, gl.FLOAT, false, 0, 0);

            if (Active_Part == Bolt_Objects[BO].Bolt_parts[0] || Selected_Part == Bolt_Objects[BO].Bolt_parts[0]) {
                if (Active_Part == Bolt_Objects[BO].Bolt_parts[0]) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, A_Bolt_FacesVertexColorBuffer[BO]);
                    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, A_Bolt_FacesVertexColorBuffer[BO].itemSize, gl.FLOAT, false, 0, 0);
                }
                if (Selected_Part == Bolt_Objects[BO].Bolt_parts[0]) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, S_Bolt_FacesVertexColorBuffer[BO]);
                    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, S_Bolt_FacesVertexColorBuffer[BO].itemSize, gl.FLOAT, false, 0, 0);
                }
            }
            else {
                gl.bindBuffer(gl.ARRAY_BUFFER, Bolt_FacesVertexColorBuffer[BO]);
                gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, Bolt_FacesVertexColorBuffer[BO].itemSize, gl.FLOAT, false, 0, 0);
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Bolt_FacesVertexIndexBuffer[BO]);
            setMatrixUniforms();
            gl.drawElements(gl.TRIANGLES, Bolt_FacesVertexIndexBuffer[BO].numItems, gl.UNSIGNED_SHORT, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, Bolt_LinesVertexColorBuffer[BO]);
            gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, Bolt_LinesVertexColorBuffer[BO].itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Bolt_LinesVertexIndexBuffer[BO]);
            setMatrixUniforms();
            gl.drawElements(gl.LINES, Bolt_LinesVertexIndexBuffer[BO].numItems, gl.UNSIGNED_SHORT, 0);


            mat4.translate(mvMatrix, [0, 0, -Bolt_Objects[BO].Bolt_Y / 100]);

            gl.bindBuffer(gl.ARRAY_BUFFER, Bolt_VertexPositionBuffer[BO]);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, Bolt_VertexPositionBuffer[BO].itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, Bolt_FacesVertexNormalBuffer[BO]);
            gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, Bolt_FacesVertexNormalBuffer[BO].itemSize, gl.FLOAT, false, 0, 0);

            if (Active_Part == Bolt_Objects[BO].Bolt_parts[0] || Selected_Part == Bolt_Objects[BO].Bolt_parts[0]) {
                if (Active_Part == Bolt_Objects[BO].Bolt_parts[0]) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, A_Bolt_FacesVertexColorBuffer[BO]);
                    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, A_Bolt_FacesVertexColorBuffer[BO].itemSize, gl.FLOAT, false, 0, 0);
                }
                if (Selected_Part == Bolt_Objects[BO].Bolt_parts[0]) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, S_Bolt_FacesVertexColorBuffer[BO]);
                    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, S_Bolt_FacesVertexColorBuffer[BO].itemSize, gl.FLOAT, false, 0, 0);
                }
            }
            else {
                gl.bindBuffer(gl.ARRAY_BUFFER, Bolt_FacesVertexColorBuffer[BO]);
                gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, Bolt_FacesVertexColorBuffer[BO].itemSize, gl.FLOAT, false, 0, 0);
            }

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Bolt_FacesVertexIndexBuffer[BO]);
            setMatrixUniforms();
            gl.drawElements(gl.TRIANGLES, Bolt_FacesVertexIndexBuffer[BO].numItems, gl.UNSIGNED_SHORT, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, Bolt_LinesVertexColorBuffer[BO]);
            gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, Bolt_LinesVertexColorBuffer[BO].itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Bolt_LinesVertexIndexBuffer[BO]);
            setMatrixUniforms();
            gl.drawElements(gl.LINES, Bolt_LinesVertexIndexBuffer[BO].numItems, gl.UNSIGNED_SHORT, 0);
        }

        mvPopMatrix();
    }
    /* -------------------------------------------------  Display Mouse Ray  --------------------------------------------------
    gl.bindBuffer(gl.ARRAY_BUFFER, Temp_LinesVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, Temp_LinesVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Temp_LinesVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.LINES, Temp_LinesVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    */

}
var canv_Width;
var canv_Height;
    function resizeCanvas() {
        // var canvas = document.getElementById("worldmap_canvas1");

        if(_canvas) {
            canv_Width = _canvas.clientWidth;
            canv_Height = _canvas.clientHeight
            // only change the size of the canvas if the size it's being displayed
            // has changed.
            if (_canvas.width != _canvas.clientWidth ||
        _canvas.height != _canvas.clientHeight) {
                // Change the size of the canvas to match the size it's being displayed
                _canvas.width = _canvas.clientWidth;
                _canvas.height = _canvas.clientHeight;
            }

            Mid_X = _canvas.width / 2.0;
            Mid_Y = _canvas.height / 2.0;

            try {
                gl.viewportWidth = _canvas.width;
                gl.viewportHeight = _canvas.height;
                drawScene();
            }
            catch (e) { }
        }

    }

    export function webGLStart(canvas) {

        
        Load_Current_View();

        resizeCanvas();
        initGL(canvas);
        initShaders()
        initBuffers();

        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        gl.clearColor(0.67843, 0.84706, 0.90196, 1.0);
        gl.enable(gl.DEPTH_TEST);

        gl.depthFunc(gl.LEQUAL);

        gl.hint(gl.PERSPECTIVE_CORRECTION_HINT, gl.NICEST);

        gl.polygonOffset(2, 1);

        Active_Part = "";
        Active_Assembly = "";
        Selected_Part = "";
        Selected_Assembly = "";

        try {
            canvas.addEventListener('DOMMouseScroll', wheel, false);
        }
        catch (e) {
        }
        try {
            canvas.addEventListener("mousewheel", MouseWheelHandler, false);
        }
        catch (e) {
        }

        window.onresize = function () { resizeCanvas() };
        //document.addEventListener('resize', resizeCanvas);

        canvas.onmousedown = handleMouseDown;
        canvas.onmousemove = handleMouseMove;

        drawScene();

    }


var Current_View;
function Load_Current_View() {
    try {

            Current_View = {
                DistX: -250,
                DistY: 234,
                DistZ: -35,
                PowerS: 720,
                PowerDX_1: -1144,
                PowerDY_1: 218,
                xDeg: -25,
                yDeg: -152,
                Zoom_Incr: 0.01,
                Translate_Incr: 0.02,
                Rotate_Incr: 0.2

            }
       
        }
    }
    catch (e) {
    }
}
 var Epsilon = 0.000001;

    function _Cross(dest, v1, v2) {
        dest.X = v1[1] * v2[2] - v1[2] * v2[1];
        dest.Y = v1[2] * v2[0] - v1[0] * v2[2];
        dest.Z = v1[0] * v2[1] - v1[1] * v2[0];
    }

    function _Cross1(dest, v1, v2) {
        dest.X = v1.Y * v2.Z - v1.Z * v2.Y;
        dest.Y = v1.Z * v2.X - v1.X * v2.Z;
        dest.Z = v1.X * v2.Y - v1.Y * v2.X;
    }

    function _Cross2(dest, v1, v2) {
        dest.X = v1[1] * v2.Z - v1[2] * v2.Y;
        dest.Y = v1[2] * v2.X - v1[0] * v2.Z;
        dest.Z = v1[0] * v2.Y - v1[1] * v2.X;
    }

    function _DOT(v1, v2){
        return v1.X * v2.X + v1.Y * v2.Y + v1.Z * v2.Z;
    }
    function _DOT2(v1, v2) {
        return v1[0] * v2.X + v1[1] * v2.Y + v1[2] * v2.Z;
    }
    function _SUB(dest, v1, v2) {
        dest.X = v1[0] - v2[0];
        dest.Y = v1[1] - v2[1];
        dest.Z = v1[2] - v2[2];

    }

    function Intersect_Triangle(orig, dir, vert0, vert1, vert2, TEST_CULL, Hit_Obj) {
        
        var edge1 = { X: 0, Y: 0, Z: 0 }
        var edge2 = { X: 0, Y: 0, Z: 0 }
        var tvec = { X: 0, Y: 0, Z: 0 }
        var pvec = { X: 0, Y: 0, Z: 0 }
        var qvec = { X: 0, Y: 0, Z: 0 }
        var det, inv_det;
        
        _SUB(edge1, vert1, vert0);
        _SUB(edge2, vert2, vert0);

        _Cross2(pvec, dir, edge2);

        det = _DOT(edge1, pvec);

        if (TEST_CULL) {

            if (det < Epsilon)
                return 0;

            _SUB(tvec, orig, vert0);

            Hit_Obj.u = _DOT(tvec, pvec);
            if (Hit_Obj.u < 0 || Hit_Obj.u > det)
                return 0;

            _Cross1(qvec, tvec, edge1);

            Hit_Obj.v = _DOT2(dir, qvec);
            if (Hit_Obj.v < 0 || Hit_Obj.u + Hit_Obj.v > det)
                return 0;

            Hit_Obj.t = _DOT(edge2, qvec);
            inv_det = 1 / det;
            Hit_Obj.t *= inv_det;
            Hit_Obj.u *= inv_det;
            Hit_Obj.v *= inv_det;
        }
        else {
            if (det > -Epsilon && det < Epsilon)
                return 0;
            
            inv_det = 1 / det;
            _SUB(tvec, orig, vert0);

            Hit_Obj.u = _DOT(tvec, pvec) * inv_det;

            if (Hit_Obj.u < 0 || Hit_Obj.u > 1)
                return 0;

            
            _Cross1(qvec, tvec, edge1);
            Hit_Obj.v = _DOT2(dir, qvec) * inv_det;

            if (Hit_Obj.v < 0 || Hit_Obj.u + Hit_Obj.v > 1)
                return 0;
            
            Hit_Obj.t = _DOT(edge2, qvec) * inv_det;
        }

        return 1;

    }

var vertices = new Array(3.95,-7.4668,0.05,33.80112,-4.48169,0.05,33.80112,3.75921,0.05);
var normals = new Array(0,0,1,0,0,1,0,0,1);
var Tr_colors = new Array(0.4314,0.7843,0.1569,1,0.4314,0.7843,0.1569,1,0.4314);
var L_colors = new Array(0,0,0,1,0,0,0,1,0);
var Tr_indices = new Array(0,1,2,3,4,5,6,7,8);
var L_indices = new Array(0,1,1,2,4,5,5,0,6);
var parts = new Array("Beam.Stem","Beam.Stem","Beam.Stem");
var assemblies = new Array("Beam","Beam","Beam");
var verticesB = new Array();
function Bolt_Object() { this.Bolt_vertices = new Array();this.Bolt_normals = new Array();this.Bolt_colors = new Array();this.Bolt_L_colors = new Array();this.Bolt_indices = new Array();this.Bolt_L_indices = new Array();this.Bolt_parts = new Array();this.Bolt_assemblies = new Array();this.Bolt_Dist = new Array();this.Start_Point = new Array ();this.Bolt_Y = 0;this.Angle_XZ = 0;} 
var BObj0 = new Bolt_Object(); BObj0.Bolt_vertices = new Array(0.0501,0,0.24,0.0501,0.20785,0.12,0.0501,0.20785,-0.12,0.0501,0,0.24,0.0501,0.20785,-0.12,0.0501,0,-0.24,0.0501,0,0.2);
var Bolt_Objects = new Array(); Bolt_Objects[0] = BObj0; 

var GLU = {};

(function($) {
    /**
     * Unproject a screen point.
     *
     * @param {number} winX the window point for the x value.
     * @param {number} winY the window point for the y value.
     * @param {number} winZ the window point for the z value.
     * @param {Array.<number>} model the model-view matrix.
     * @param {Array.<number>} proj the projection matrix.
     * @param {Array.<number>} view the viewport coordinate array.
     * @param {Array.<number>} objPos the model point result.
     * @return {boolean} true if the unproject operation was successful, false otherwise.
     */
    $.unProject = function(winX, winY, winZ, model, proj, view, objPos) {

        /** @type {Array.<number>} */
        var inp = [
            winX,
            winY,
            winZ,
            1.0
        ];

        /** @type {Array.<number>} */
        var finalMatrix = [];

        $.multMatrices(model, proj, finalMatrix);
        if (!$.invertMatrix(finalMatrix, finalMatrix)) {
            return (false);
        }

        /* Map x and y from window coordinates */
        inp[0] = (inp[0] - view[0]) / view[2];
        inp[1] = (inp[1] - view[1]) / view[3];

        /* Map to range -1 to 1 */
        inp[0] = inp[0] * 2 - 1;
        inp[1] = inp[1] * 2 - 1;
        inp[2] = inp[2] * 2 - 1;

        /** @type {Array.<number>} */
        var out = [];

        $.multMatrixVec(finalMatrix, inp, out);

        if (out[3] === 0.0) {
            return false;
        }

        out[0] /= out[3];
        out[1] /= out[3];
        out[2] /= out[3];

        objPos[0] = out[0];
        objPos[1] = out[1];
        objPos[2] = out[2];

        return true;
    };

    /**
     * Multiply the matrix by the specified vector.
     *
     * @param {Array.<number>} matrix the matrix.
     * @param {Array.<number>} inp the vector.
     * @param {Array.<number>} out the output.
     */
    $.multMatrixVec = function(matrix, inp, out) {
        for (var i = 0; i < 4; i = i + 1) {
            out[i] =
                inp[0] * matrix[0 * 4 + i] +
                inp[1] * matrix[1 * 4 + i] +
                inp[2] * matrix[2 * 4 + i] +
                inp[3] * matrix[3 * 4 + i];
        }
    };

    /**
     * Multiply the specified matrices.
     *
     * @param {Array.<number>} a the first matrix.
     * @param {Array.<number>} b the second matrix.
     * @param {Array.<number>} r the result.
     */
    $.multMatrices = function(a, b, r) {
        for (var i = 0; i < 4; i = i + 1) {
            for (var j = 0; j < 4; j = j + 1) {
                r[i * 4 + j] =
                    a[i * 4 + 0] * b[0 * 4 + j] +
                    a[i * 4 + 1] * b[1 * 4 + j] +
                    a[i * 4 + 2] * b[2 * 4 + j] +
                    a[i * 4 + 3] * b[3 * 4 + j];
            }
        }
    };

    /**
     * Invert a matrix.
     *
     * @param {Array.<number>} m the matrix.
     * @param {Array.<number>} invOut the inverted output.
     * @return {boolean} true if successful, false otherwise.
     */
    $.invertMatrix = function(m, invOut) {
        /** @type {Array.<number>} */
        var inv = [];

        inv[0] = m[5] * m[10] * m[15] - m[5] * m[11] * m[14] - m[9] * m[6] * m[15] +
            m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
        inv[4] = -m[4] * m[10] * m[15] + m[4] * m[11] * m[14] + m[8] * m[6] * m[15] -
            m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
        inv[8] = m[4] * m[9] * m[15] - m[4] * m[11] * m[13] - m[8] * m[5] * m[15] +
            m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
        inv[12] = -m[4] * m[9] * m[14] + m[4] * m[10] * m[13] + m[8] * m[5] * m[14] -
            m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
        inv[1] = -m[1] * m[10] * m[15] + m[1] * m[11] * m[14] + m[9] * m[2] * m[15] -
            m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
        inv[5] = m[0] * m[10] * m[15] - m[0] * m[11] * m[14] - m[8] * m[2] * m[15] +
            m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
        inv[9] = -m[0] * m[9] * m[15] + m[0] * m[11] * m[13] + m[8] * m[1] * m[15] -
            m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
        inv[13] = m[0] * m[9] * m[14] - m[0] * m[10] * m[13] - m[8] * m[1] * m[14] +
            m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
        inv[2] = m[1] * m[6] * m[15] - m[1] * m[7] * m[14] - m[5] * m[2] * m[15] +
            m[5] * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
        inv[6] = -m[0] * m[6] * m[15] + m[0] * m[7] * m[14] + m[4] * m[2] * m[15] -
            m[4] * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
        inv[10] = m[0] * m[5] * m[15] - m[0] * m[7] * m[13] - m[4] * m[1] * m[15] +
            m[4] * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
        inv[14] = -m[0] * m[5] * m[14] + m[0] * m[6] * m[13] + m[4] * m[1] * m[14] -
            m[4] * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
        inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] -
            m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
        inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] +
            m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
        inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] -
            m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
        inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] +
            m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];

        /** @type {number} */
        var det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];

        if (det === 0) {
            return false;
        }

        det = 1.0 / det;

        for (var i = 0; i < 16; i = i + 1) {
            invOut[i] = inv[i] * det;
        }

        return true;
    };

}(GLU));