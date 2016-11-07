
import * as getContext from 'get-canvas-context';
import { mat4, mat3, vec3 } from 'gl-matrix';



var gl, vertices = [], normals = [], Tr_colors = [], Tr_indices = [], L_indices = [];
var _canvas;

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

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

    mat3.fromMat4(normalMatrix, mvMatrix)
    mat3.invert(normalMatrix, normalMatrix)
    //mat4.toInverseMat3(mvMatrix, normalMatrix);


    mat3.transpose(normalMatrix, normalMatrix);
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
    else if (event.detail) {
        delta = -event.detail / 3;
        if (event.detail > 0)
            Sign1 = +1.0;
        else
            Sign1 = -1.0;
    }

    Current_View.PowerDX_1 = Current_View.PowerDX_1 - E_X1 * Sign1 * Math.abs(delta / 100);
    Current_View.PowerDY_1 = Current_View.PowerDY_1 - E_Y1 * Sign1 * Math.abs(delta / 100);
    Current_View.PowerS = Current_View.PowerS + delta;

    if (anim == false) {
        drawScene();
    }

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

        if (SelectMode == true) {
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
                    if (anim == false) {
                        //drawScene();
                    }
                }
            }
        }
        else {
            var Prev = Selected_Part;
            Selected_Part = "";
            Selected_Assembly = "";
            if (Prev != "") {

                initColorBuffers();
                if (anim == false) {
                    //drawScene();
                }
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
            //rotate = true;
        }
        else {
            Current_View.DistX = Current_View.DistX - EDX + event.clientX;
            Current_View.DistY = Current_View.DistY + EDY - event.clientY;
        }

        EX = event.clientX;
        EY = event.clientY;
        EDX = event.clientX;
        EDY = event.clientY;

        if (anim == false) {
            drawScene();
        }
    }
    else {
        if (SelectMode == true) {
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
                    //drawScene();
                }
            }
        }
        else {
            var Prev = Active_Part;
            Active_Part = "";
            Active_Assembly = "";
            if (Prev != "") {

                initColorBuffers();
                //drawScene();
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
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Tr_colors_1), gl.STREAM_DRAW);

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
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Tr_colors_2), gl.STREAM_DRAW);

    }

}


function normalize(v)
        {
            var d = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
            var v1 = new Array( v[0] /= d, v[1] /= d, v[2] /= d);
            return v1;

        }

        /* normalized cross product of non-parallel vectors */
        function normCrossProd(u, v)
        {
            var n1 = new Array(u[1] * v[2] - v[1] * u[2],
                              u[2] * v[0] - v[2] * u[0],
                              u[0] * v[1] - v[0] * u[1]
                             );

            return normalize(n1);
        }
        function normFace(v1, v2, v3)
        {
            var d1 = new Array(), d2 = new Array();
            var k;
            for (k = 0; k <= 2; k++)
            {
                d1[k] = v2[k] - v1[k];
                d2[k] = v3[k] - v2[k];
            }

            return normCrossProd(d1, d2);
        }

        function Vector_Median( u, v)
        {
            if (u == null && v == null)
                return null;
            if (u == null)
                return v;
            if (v == null)
                return u;


            var l_u = Math.sqrt(u[0] * u[0] + u[1] * u[1] + u[2] * u[2]);
            var l_v = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);

            var n1 =  new Array(u[0] * l_v + l_u * v[0],
                                u[1] * l_v + l_u * v[1],
                                u[2] * l_v + l_u * v[2]
                                );

            var l_n = Math.sqrt(n1[0] * n1[0] + n1[1] * n1[1] + n1[2] * n1[2]);
            n1[0] = n1[0] / l_n;
            n1[1] = n1[1] / l_n;
            n1[2] = n1[2] / l_n;

            return n1;
        }



var waveHeightA = 3; //265;
var waveSpeedA = 1.5;
var waveOffsetA = 4; // 1.2834448552536923;

var waveHeightB = 0.01;
var waveSpeedB = 2.96;
var waveOffsetB = 2.3;
var elapsed;
function animate() {

    //var timeNow = new Date().getTime();
    //if (lastTime != 0) {
    //var elapsed = timeNow - lastTime;

    //if(splashClock != undefined){
    //var t = splashClock.getElapsedTime();


    //change vertices and normal array here -------------------------------
    /*
    var t = splashClock.getElapsedTime();

    waves(waveTime * 0.012);

    renderer.clear();
    renderer.render( splashScene, camera );


    waveTime++;
    window.requestAnimationFrame(animate, renderer.domElement);
    */
    //alert(vertices.length);



    for (var i = 0; i < vertices.length; i = i + 3) {

        var x = vertices[i + 0];
        var y = vertices[i + 2];
        //alert("lalal");
        vertices[i + 1] = waveA(x, y, elapsed * 0.012);
        vertices[i + 1] = vertices[i + 1] + waveB(x, y, elapsed * 0.012);
    }
    if (show_faces) {
        if (elapsed % 3 == 0) {
            var Sa_Num = Math.sqrt(vertices.length / 3);
            var RS_Count = Sa_Num;
            var N1 = new Array();
            var N2 = new Array();
            var N3 = new Array();
            var N4 = new Array();

            var N_Mid = new Array();

            for (var i = 0; i < normals.length; i = i + 3) {

                var Row = parseInt(i / 3 / Sa_Num); //first is 0
                var Column = parseInt(i / 3 - Row * Sa_Num); //first is 0

                if (Column < Sa_Num - 2 && Row < RS_Count - 2) {
                    var v1 = new Array(vertices[i], vertices[i + 1], vertices[i + 2]);
                    var v2 = new Array(vertices[i + 3], vertices[(i + 3) + 1], vertices[(i + 3) + 2]);
                    var v3 = new Array(vertices[((Row + 1) * Sa_Num + Column) * 3], vertices[((Row + 1) * Sa_Num + Column) * 3 + 1], vertices[((Row + 1) * Sa_Num + Column) * 3 + 2]);
                    N1 = normFace(v1, v2, v3);
                }
                else {
                    N1 = null; // ??????????????
                }

                if (Column < Sa_Num - 2 && Row > 0) {
                    var v4 = new Array(vertices[i], vertices[i + 1], vertices[i + 2]);
                    var v5 = new Array(vertices[((Row - 1) * Sa_Num + Column) * 3], vertices[((Row - 1) * Sa_Num + Column) * 3 + 1], vertices[((Row - 1) * Sa_Num + Column) * 3 + 2]);
                    var v6 = new Array(vertices[i + 3], vertices[(i + 3) + 1], vertices[(i + 3) + 2]);
                    N2 = normFace(v4, v5, v6);
                }
                else {
                    N2 = null; // ??????????????
                }

                if (Column > 0 && Row > 0) {
                    var v7 = new Array(vertices[i], vertices[i + 1], vertices[i + 2]);
                    var v8 = new Array(vertices[i - 3], vertices[(i - 3) + 1], vertices[(i - 3) + 2]);
                    var v9 = new Array(vertices[((Row - 1) * Sa_Num + Column) * 3], vertices[((Row - 1) * Sa_Num + Column) * 3 + 1], vertices[((Row - 1) * Sa_Num + Column) * 3 + 2]);
                    N3 = normFace(v7, v8, v9);
                }
                else {
                    N3 = null; // ??????????????
                }

                if (Column > 0 && Row < RS_Count - 2) {
                    var v10 = new Array(vertices[i], vertices[i + 1], vertices[i + 2]);
                    var v11 = new Array(vertices[((Row + 1) * Sa_Num + Column) * 3], vertices[((Row + 1) * Sa_Num + Column) * 3 + 1], vertices[((Row + 1) * Sa_Num + Column) * 3 + 2]);
                    var v12 = new Array(vertices[i - 3], vertices[(i - 3) + 1], vertices[(i - 3) + 2]);
                    N4 = normFace(v10, v11, v12);
                }
                else {
                    N4 = null; // ??????????????
                }
                N_Mid = Vector_Median(N1, N2);
                N_Mid = Vector_Median(N_Mid, N3);
                N_Mid = Vector_Median(N_Mid, N4);

                if (N1 == null)
                    N1 = new Array(0, 0, 0);
                if (N2 == null)
                    N2 = new Array(0, 0, 0);
                if (N3 == null)
                    N3 = new Array(0, 0, 0);
                if (N4 == null)
                    N4 = new Array(0, 0, 0);
                if (N_Mid == null)
                    N_Mid = new Array(0, 0, 0);
                //alert(N_Mid);
                normals[i] = N_Mid[0];
                normals[i + 1] = N_Mid[1];
                normals[i + 2] = N_Mid[2];

                //alert(normals);
            }
        }
    }
    //}
    elapsed++;
    UpdateBuffers();
    //rPyramid += (90 * elapsed) / 1000.0;
    //rCube -= (75 * elapsed) / 1000.0;
    //}
    //lastTime = timeNow;
    //}


    //drawScene();
}

/*
function waves(t) {

    //big waves
    opVerts = oceanPlane.vertices;


    var len = opVerts.length;
    for (var i = 0; i < len; i++) {
        opVerts[i].z = this.waveA(opVerts[i].x, opVerts[i].y, t);
    }


    var waveVar;
    var colorWave;

    //small waves
    for (var j = 0, l = this.oceanPlane.vertices.length; j < l; j++) {
        oceanPlane.vertices[j].z = oceanPlane.vertices[j].z + waveB(this.oceanPlane.vertices[j].x, oceanPlane.vertices[j].z, t);
    }

    ocean.geometry.__dirtyVertices = true;
    ocean.geometry.verticesNeedUpdate = true;
}
*/



function waveA(x, y, t) {
    return Math.sin((x / 20) * waveOffsetA + (t / waveSpeedA)) * Math.cos((y / 20) * waveOffsetA + (t / waveSpeedA)) * waveHeightA;
}

function waveB(x, y, t) {
    return Math.sin((x / 2) * waveOffsetB + (t / waveSpeedB)) * Math.cos((y / 2) * waveOffsetB + (t / waveSpeedB)) * waveHeightB;
}

var lastTime = 0;


function tick() {
    if(anim){
        //requestAnimFrame(tick);
        window.requestAnimationFrame(tick);
    }
    animate();
    drawScene();
}


function UpdateBuffers() {



    gl.bindBuffer(gl.ARRAY_BUFFER, VertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

    //gl.bindBuffer(gl.ARRAY_BUFFER, FacesVertexNormalBuffer);
    //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.DYNAMIC_DRAW);

}

function Surface_Strip() {
    this.vertices = new Array();
    this.Tr_colors = new Array();
    this.Tr_indices = new Array();
    this.normals = new Array();
}

function init_Surface_Geom() {
    var end_for = 5;//5
    var step_for = 0.02;
    var step = 0.02;
    var RS_Count = parseInt(end_for / step_for) + 1;
    var DDist = 0;
    var m = 0;
    var n = 0;

    var ACC_Len = RS_3D[0].length;
    var Sa_Num = ACC_Len;

    //var a = 3000 / (ACC_Len - 1) + 1;
    //var b = (RS_Count-1)/a;

    for (var i = 0; i < RS_3D.length; i++) {
        m++;
        //var ACC_Len = RS_3D[i].length;

        for (var f = 0; f < ACC_Len; f++) {

            var Geom = true;

            if (Geom) {

                //var R1 = 0;
                //var G1 = 1;
                //var B1 = 0;

                vertices[(f + (m - 1) * ACC_Len) * 3 + 0] = DDist;
                vertices[(f + (m - 1) * ACC_Len) * 3 + 1] = RS_3D[i][f];
                vertices[(f + (m - 1) * ACC_Len) * 3 + 2] = (f * step);

                Tr_colors[(f + (m - 1) * ACC_Len) * 4 + 0] = 0;
                Tr_colors[(f + (m - 1) * ACC_Len) * 4 + 1] = 1;
                Tr_colors[(f + (m - 1) * ACC_Len) * 4 + 2] = 0;
                Tr_colors[(f + (m - 1) * ACC_Len) * 4 + 3] = 1;

                if (m < RS_Count) {
                    if (f < ACC_Len - 1) {

                        Tr_indices[n] = f + (m - 1) * ACC_Len;
                        n++;
                        Tr_indices[n] = (f + 1) + (m - 1) * ACC_Len;
                        n++;
                        Tr_indices[n] = f + m * ACC_Len;
                        n++;
                        Tr_indices[n] = f + m * ACC_Len;
                        n++;
                        Tr_indices[n] = (f + 1) + (m - 1) * ACC_Len;
                        n++;
                        Tr_indices[n] = (f + 1) + m * ACC_Len;
                        n++;
                    }
                }
            }
        }
        DDist = DDist + step * 10;
    }


    var N1 = new Array();
    var N2 = new Array();
    var N3 = new Array();
    var N4 = new Array();

    var N_Mid = new Array();

    for (var i = 0; i < vertices.length; i = i + 3) {

        var Row = parseInt(i / 3 / Sa_Num); //first is 0
        var Column = parseInt(i / 3 - Row * Sa_Num); //first is 0

        if (Column < Sa_Num - 2 && Row < RS_Count - 2) {
            var v1 = new Array(vertices[i], vertices[i + 1], vertices[i + 2]);
            var v2 = new Array(vertices[i + 3], vertices[(i + 3) + 1], vertices[(i + 3) + 2]);
            var v3 = new Array(vertices[((Row + 1) * Sa_Num + Column) * 3], vertices[((Row + 1) * Sa_Num + Column) * 3 + 1], vertices[((Row + 1) * Sa_Num + Column) * 3 + 2]);
            N1 = normFace(v1, v2, v3);
        }
        else {
            N1 = null; // ??????????????
        }

        if (Column < Sa_Num - 2 && Row > 0) {
            var v4 = new Array(vertices[i], vertices[i + 1], vertices[i + 2]);
            var v5 = new Array(vertices[((Row - 1) * Sa_Num + Column) * 3], vertices[((Row - 1) * Sa_Num + Column) * 3 + 1], vertices[((Row - 1) * Sa_Num + Column) * 3 + 2]);
            var v6 = new Array(vertices[i + 3], vertices[(i + 3) + 1], vertices[(i + 3) + 2]);
            N2 = normFace(v4, v5, v6);
        }
        else {
            N2 = null; // ??????????????
        }

        if (Column > 0 && Row > 0) {
            var v7 = new Array(vertices[i], vertices[i + 1], vertices[i + 2]);
            var v8 = new Array(vertices[i - 3], vertices[(i - 3) + 1], vertices[(i - 3) + 2]);
            var v9 = new Array(vertices[((Row - 1) * Sa_Num + Column) * 3], vertices[((Row - 1) * Sa_Num + Column) * 3 + 1], vertices[((Row - 1) * Sa_Num + Column) * 3 + 2]);
            N3 = normFace(v7, v8, v9);
        }
        else {
            N3 = null; // ??????????????
        }

        if (Column > 0 && Row < RS_Count - 2) {
            var v10 = new Array(vertices[i], vertices[i + 1], vertices[i + 2]);
            var v11 = new Array(vertices[((Row + 1) * Sa_Num + Column) * 3], vertices[((Row + 1) * Sa_Num + Column) * 3 + 1], vertices[((Row + 1) * Sa_Num + Column) * 3 + 2]);
            var v12 = new Array(vertices[i - 3], vertices[(i - 3) + 1], vertices[(i - 3) + 2]);
            N4 = normFace(v10, v11, v12);
        }
        else {
            N4 = null; // ??????????????
        }
        N_Mid = Vector_Median(N1, N2);
        N_Mid = Vector_Median(N_Mid, N3);
        N_Mid = Vector_Median(N_Mid, N4);

        if (N1 == null)
            N1 = new Array(0, 0, 0);
        if (N2 == null)
            N2 = new Array(0, 0, 0);
        if (N3 == null)
            N3 = new Array(0, 0, 0);
        if (N4 == null)
            N4 = new Array(0, 0, 0);
        if (N_Mid == null)
            N_Mid = new Array(0, 0, 0);
        //alert(N_Mid);
        normals[i] = N_Mid[0];
        normals[i + 1] = N_Mid[1];
        normals[i + 2] = N_Mid[2];



    }
}

function initBuffers() {

    VertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
    VertexPositionBuffer.itemSize = 3;
    VertexPositionBuffer.numItems = vertices.length / 3;


    FacesVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, FacesVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STREAM_DRAW);
    FacesVertexNormalBuffer.itemSize = 3;
    FacesVertexNormalBuffer.numItems = normals.length / 3;

    FacesVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, FacesVertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Tr_colors), gl.STATIC_DRAW);
    FacesVertexColorBuffer.itemSize = 4;
    FacesVertexColorBuffer.numItems = Tr_colors.length / 4;

    FacesVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, FacesVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Tr_indices), gl.STATIC_DRAW);
    FacesVertexIndexBuffer.itemSize = 1;
    FacesVertexIndexBuffer.numItems = Tr_indices.length;
    //alert(Tr_indices.length);
    if (anim == true) {
        LinesVertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, LinesVertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(L_indices), gl.STATIC_DRAW);
        LinesVertexIndexBuffer.itemSize = 1;
        LinesVertexIndexBuffer.numItems = L_indices.length;
    }

    // --------------------------

}
var rJoint = 0;

var RI, ZI, TI;

function drawScene() {


    show_faces = false;

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

    mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100000.0);

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

    gl.disable(gl.BLEND);
    gl.uniform1f(shaderProgram.alphaUniform, 1)
    gl.enable(gl.DEPTH_TEST);

    gl.bindBuffer(gl.ARRAY_BUFFER, VertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, VertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, FacesVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, FacesVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, FacesVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, FacesVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    if (anim == true) {
        if (show_faces) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, FacesVertexIndexBuffer);
            setMatrixUniforms();
            //gl.drawArrays(gl.TRIANGLES, 0, FacesVertexIndexBuffer.numItems);
            gl.drawElements(gl.TRIANGLES, FacesVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        }
    }
    else {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, FacesVertexIndexBuffer);
        setMatrixUniforms();
        //gl.drawArrays(gl.TRIANGLES, 0, FacesVertexIndexBuffer.numItems);
        gl.drawElements(gl.TRIANGLES, FacesVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        //alert(FacesVertexIndexBuffer.numItems);

    }
    //gl.bindBuffer(gl.ARRAY_BUFFER, LinesVertexColorBuffer);
    //gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, LinesVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    if (anim == true) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, LinesVertexIndexBuffer);
        setMatrixUniforms();
        gl.drawElements(gl.LINES, LinesVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        var a = 0;
    }
    //gl.lineWidth(3.0);
    // ------------------------------------------------  Draw Bolts

    //alert("LALALLALA 8");

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
    //var canvas = document.getElementById("worldmap_canvas1");
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
var show_faces;
var SelectMode;
var anim;

export function webGLStop(){
    anim = false;
}

export function webGLStart(canvas, ANIME) {
    initGL(canvas);
    anim = ANIME;

    elapsed = 0;
    show_faces = false;
    SelectMode = false;

    Load_Current_View();

    //var canvas = document.getElementById("worldmap_canvas1");
    resizeCanvas();

    initShaders();


    var i, f;
    for(i = 0; i<10800;i++){
        vertices.push(0);
        normals.push(0);
    }

    for(i = 0; i<14400;i++){
        Tr_colors.push(0);
    }

    if (vertices.length == 0) {

        init_Surface_Geom();
    }

    for(i = 0; i<20886;i++){
        Tr_indices.push(0);
    }

    for(i = 0; i<14160;i++){
        L_indices.push(0);
    }

    var m = 0, n = 0, n_L = 0, n_col=0;
    var DDist = -60;
    var step = 2;

    for (i = 0; i < 60; i ++)
    {
        m++;
        for (f = 0; f < 60; f++)
        {
            vertices[(f + (m - 1) * 60) * 3 + 0] = DDist;
            vertices[(f + (m - 1) * 60) * 3 + 1] = 0;
            vertices[(f + (m - 1) * 60) * 3 + 2] = (f * step - 60);

            vertices[(f + (m - 1) * 60) * 3 + 0] = DDist;
            vertices[(f + (m - 1) * 60) * 3 + 1] = 0;
            vertices[(f + (m - 1) * 60) * 3 + 2] = (f * step - 60);

            Tr_colors[n_col++] = 0;
            Tr_colors[n_col++] = 1;
            Tr_colors[n_col++] = 0;
            Tr_colors[n_col++] = 0.9;
            if (m < 60)
            {
                if (f < 60 - 1)
                {
                    Tr_indices[n] = f + (m - 1) * 60;
                    L_indices[n_L] = f + (m - 1) * 60;
                    n++;
                    n_L++;
                    Tr_indices[n] = (f + 1) + (m - 1) * 60;
                    L_indices[n_L] = (f + 1) + (m - 1) * 60;
                    n++;
                    n_L++;
                    Tr_indices[n] = f + m * 60;
                    n++;
                    Tr_indices[n] = f + m * 60;
                    n++;
                    Tr_indices[n] = (f + 1) + (m - 1) * 60;
                    L_indices[n_L] = (f + 1) + (m - 1) * 60;
                    n++;
                    n_L++;
                    Tr_indices[n] = (f + 1) + m * 60;
                    L_indices[n_L] = (f + 1) + m * 60;
                    n++;
                    n_L++;
                }
                else
                {
                    L_indices[n_L] = (m - 1) * 60;
                    n_L++;
                    L_indices[n_L] = m * 60;
                    n_L++;
                }
            }
            else
            {
                if (f < 60 - 1)
                {
                    L_indices[n_L] = (f + 1) + (m - 1) * 60;
                    n_L++;
                    L_indices[n_L] = f + (m - 1) * 60;
                    n_L++;
                }
            }
        }
        DDist = DDist + step;
    }

    var max = 0;
    for(i = 0; i<14160;i++){
        if(L_indices[i]>max) max = L_indices[i];
    }


    initBuffers(); // <---------- error here!

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    gl.clearColor(0, 0, 0, 1.0);
    //gl.clearColor(0.67843, 0.84706, 0.90196, 1.0);
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

    canvas.onmousedown = handleMouseDown;
    canvas.onmousemove = handleMouseMove;


    if (ANIME == true) {
        tick();
    }
    else {
        drawScene();
    }
}


var Current_View;
function Load_Current_View() {
    try {
        Current_View = {
            DistX: 756,
            DistY: -97,
            DistZ: -35,
            PowerS: -3110,
            PowerDX_1: -20116,
            PowerDY_1: 1671,
            xDeg: 0,
            yDeg: 317,
            Zoom_Incr: 0.01,
            Translate_Incr: 0.02,
            Rotate_Incr: 0.2
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

function _DOT(v1, v2) {
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

var GLU = {};

(function ($) {

    $.unProject = function (winX, winY, winZ, model, proj, view, objPos) {

        var inp = [
            winX,
            winY,
            winZ,
            1.0
        ];

        var finalMatrix = [];

        $.multMatrices(model, proj, finalMatrix);
        if (!$.invertMatrix(finalMatrix, finalMatrix)) {
            return (false);
        }

        inp[0] = (inp[0] - view[0]) / view[2];
        inp[1] = (inp[1] - view[1]) / view[3];

        inp[0] = inp[0] * 2 - 1;
        inp[1] = inp[1] * 2 - 1;
        inp[2] = inp[2] * 2 - 1;

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

    $.multMatrixVec = function (matrix, inp, out) {
        for (var i = 0; i < 4; i = i + 1) {
            out[i] =
                inp[0] * matrix[0 * 4 + i] +
                inp[1] * matrix[1 * 4 + i] +
                inp[2] * matrix[2 * 4 + i] +
                inp[3] * matrix[3 * 4 + i];
        }
    };

    $.multMatrices = function (a, b, r) {
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

    $.invertMatrix = function (m, invOut) {

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

} (GLU));