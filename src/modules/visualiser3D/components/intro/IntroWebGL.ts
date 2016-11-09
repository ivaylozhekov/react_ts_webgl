import * as getContext from 'get-canvas-context';
import { mat4, mat3, vec3 } from 'gl-matrix';

Array.prototype.max = function () {
    return Math.max.apply(null, this);
};

export default class Visualiser {

    private gl;
    private vertices;
    private normals;
    private trColors;
    private trIndices;
    private lineIndices;
    private canvas;
    private shaderProgram;
    private mvMatrix;
    private mvMatrixStack;
    private pMatrix;
    private rotationMatrix;

    private eX1;
    private eY1;

    private midX;
    private midY;

    private vertexPositionBuffer;
    private facesVertexNormalBuffer;
    private facesVertexColorBuffer;
    private linesVertexColorBuffer;
    private facesVertexIndexBuffer;
    private linesVertexIndexBuffer;

    private selectedPartColor;
    private activePartColor;

    private waveHeightA;
    private waveSpeedA;
    private waveOffsetA;

    private waveHeightB;
    private waveSpeedB;
    private waveOffsetB;
    private elapsed;
    private lastTime;

    private rJoint;

    private RI;
    private ZI;
    private TI;

    private canvasWidth;
    private canvasHeight;
    private currentView;
    private Epsilon;

    private parts;

    private RS_3D;

    private showFaces;
    private SelectMode;
    private anim;

    private xDeg;
    private yDeg;
    private EX;
    private EY;
    private EDX;
    private EDY;
    private E_X;
    private E_Y;

    private activePart;
    private activeAssembly;
    private selectedPart;
    private selectedAssembly;

    constructor(canvas, animate) {
        this.vertices = [];
        this.normals = [];
        this.trColors = [];
        this.trIndices = [];
        this.lineIndices = [];
        this.parts = [];
        this.RS_3D = [];
        this.mvMatrixStack = [];
        this.mvMatrix = mat4.create();
        this.pMatrix = mat4.create();
        this.rotationMatrix = mat4.create();
        mat4.identity(this.rotationMatrix);
        this.selectedPartColor = new Array(1, 0, 0, 1);
        this.activePartColor = new Array(1, 1, 0, 1);
        this.waveHeightA = 3;
        this.waveSpeedA = 1.5;
        this.waveOffsetA = 4;

        this.waveHeightB = 0.01;
        this.waveSpeedB = 2.96;
        this.waveOffsetB = 2.3;
        this.lastTime = 0;
        this.rJoint = 0
        this.Epsilon = 0.000001;

        this.webGLStart(canvas, animate);
    }

    private initGL(canvas) {
        this.canvas = canvas;
        try {
            this.gl = canvas.getContext('webgl');
            this.gl.viewportWidth = canvas.width;
            this.gl.viewportHeight = canvas.height;
        } catch (e) {
        }
        if (!this.gl) {
            alert('Could not initialise WebGL!');
        }
    }

    private getShader(gl, type) {
        let shaderStr = '';
        if (type === 'x-fragment') {
            shaderStr = require('webpack-glsl!./shaders/x-fragment.glsl').slice(18, -1);
        } else if (type === 'x-vertex') {
            shaderStr = require('webpack-glsl!./shaders/x-vertex.glsl').slice(18, -1);
        } else {
            return null;
        }

        let str = shaderStr.replace(/(\\r\\n|\\n|\\r)/gm, ' ');

        let shader;
        if (type == 'x-fragment') {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (type == 'x-vertex') {
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



    private initShaders() {
        let fragmentShader = this.getShader(this.gl, 'x-fragment');
        let vertexShader = this.getShader(this.gl, 'x-vertex');

        this.shaderProgram = this.gl.createProgram();
        this.gl.attachShader(this.shaderProgram, vertexShader);
        this.gl.attachShader(this.shaderProgram, fragmentShader);
        this.gl.linkProgram(this.shaderProgram);

        if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }

        this.gl.useProgram(this.shaderProgram);

        this.shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, 'aVertexPosition');
        this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);

        this.shaderProgram.vertexNormalAttribute = this.gl.getAttribLocation(this.shaderProgram, 'aVertexNormal');
        this.gl.enableVertexAttribArray(this.shaderProgram.vertexNormalAttribute);

        this.shaderProgram.vertexColorAttribute = this.gl.getAttribLocation(this.shaderProgram, 'aVertexColor');
        this.gl.enableVertexAttribArray(this.shaderProgram.vertexColorAttribute);

        this.shaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, 'uPMatrix');
        this.shaderProgram.mvMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, 'uMVMatrix');
        this.shaderProgram.nMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, 'uNMatrix');
        this.shaderProgram.samplerUniform = this.gl.getUniformLocation(this.shaderProgram, 'uSampler');
        this.shaderProgram.useLightingUniform = this.gl.getUniformLocation(this.shaderProgram, 'uUseLighting');
        this.shaderProgram.ambientColorUniform = this.gl.getUniformLocation(this.shaderProgram, 'uAmbientColor');
        this.shaderProgram.lightingDirectionUniform = this.gl.getUniformLocation(this.shaderProgram, 'uLightingDirection');
        this.shaderProgram.directionalColorUniform = this.gl.getUniformLocation(this.shaderProgram, 'uDirectionalColor');
        this.shaderProgram.alphaUniform = this.gl.getUniformLocation(this.shaderProgram, 'uAlpha');
    }




    private mvPushMatrix() {
        let copy = mat4.create();
        mat4.set(this.mvMatrix, copy);
        this.mvMatrixStack.push(copy);
    }

    private mvPopMatrix() {
        if (this.mvMatrixStack.length == 0) {
            throw 'Invalid popMatrix!';
        }
        this.mvMatrix = this.mvMatrixStack.pop();
    }


    private setMatrixUniforms() {
        this.gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix);
        this.gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.mvMatrix);

        let normalMatrix = mat3.create();

        mat3.fromMat4(normalMatrix, this.mvMatrix)
        mat3.invert(normalMatrix, normalMatrix)
        //mat4.toInverseMat3(mvMatrix, normalMatrix);


        mat3.transpose(normalMatrix, normalMatrix);
        this.gl.uniformMatrix3fv(this.shaderProgram.nMatrixUniform, false, normalMatrix);
    }


    private degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    private Get3DRay(x2D, y2D) {
        let P0 = new Array();
        let P1 = new Array();

        let x = x2D;
        let y = y2D;
        let viewportArray = new Array(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);

        let winX, winY;
        let winZ0 = 0; let winZ1 = 1;

        let posX0, posY0, posZ0;
        let posX1, posY1, posZ1;

        winX = x;
        winY = viewportArray[3] - y;

        //gl.readBuffer(gl.BACK);

        let modelPointArrayResults_0 = new Array();
        let modelPointArrayResults_1 = new Array();

        let success0 = GLU.unProject(winX, winY, winZ0, this.mvMatrix, this.pMatrix, viewportArray, modelPointArrayResults_0);
        let success1 = GLU.unProject(winX, winY, winZ1, this.mvMatrix, this.pMatrix, viewportArray, modelPointArrayResults_1);

        P0[0] = modelPointArrayResults_0[0];
        P0[1] = modelPointArrayResults_0[1];
        P0[2] = modelPointArrayResults_0[2];
        //
        P1[0] = modelPointArrayResults_1[0];
        P1[1] = modelPointArrayResults_1[1];
        P1[2] = modelPointArrayResults_1[2];

        let Mouse_Ray = {
            Near_PNT: P0,
            Far_PNT: P1
        }

        return Mouse_Ray;
    }


private MouseWheelHandler(event) {



    let Sign1;
    let delta;
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

    this.currentView.PowerDX_1 = this.currentView.PowerDX_1 - this.eX1 * Sign1 * Math.abs(delta / 100);
    this.currentView.PowerDY_1 = this.currentView.PowerDY_1 - this.eY1 * Sign1 * Math.abs(delta / 100);
    this.currentView.PowerS = this.currentView.PowerS + delta;

    if (this.anim === false) {
        this.drawScene();
    }

}



private handleMouseDown(event) {

    if (event.which === 2) {

        this.EX = event.clientX;
        this.EY = event.clientY;

        this.EDX = event.clientX;
        this.EDY = event.clientY;
    }
    if (event.which === 1) {

        if (this.SelectMode) {
            let Mouse_Ray = this.Get3DRay(event.clientX - 362, event.clientY - 116);


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

            let Hit_List = new Array();

            for (let i_vert = 0; i_vert < this.vertices.length; i_vert = i_vert + 9) {

                let Vc0 = new Array(this.vertices[i_vert + 0], this.vertices[i_vert + 1], this.vertices[i_vert + 2]);
                let Vc1 = new Array(this.vertices[i_vert + 3], this.vertices[i_vert + 4], this.vertices[i_vert + 5]);
                let Vc2 = new Array(this.vertices[i_vert + 6], this.vertices[i_vert + 7], this.vertices[i_vert + 8]);

                let Hit_Val = { t: 0, u: 0, v: 0 }

                if (this.Intersect_Triangle(Mouse_Ray.Near_PNT, Mouse_Ray.Far_PNT, Vc0, Vc1, Vc2, false, Hit_Val) == 1) {

                    // let HE = { Part: this.parts[i_vert / 9], Dist: Hit_Val.t }
                    // Hit_List[Hit_List.length] = HE;

                }

            }



            if (Hit_List.length > 0) {
                let HE1 = Hit_List[0];
                let S1 = HE1.Part;
                let S2 = HE1.Dist;
                for (let min_ind = 1; min_ind <= Hit_List.length - 1; min_ind++) {
                    if (Hit_List[min_ind].Dist < S2) {
                        S2 = Hit_List[min_ind].Dist;
                        S1 = Hit_List[min_ind].Part;
                    }
                }
                let Prev_0 = this.selectedPart;

                this.selectedPart = S1;

                if (Prev_0 != S1) {

                    this.initColorBuffers();
                    if (this.anim == false) {
                        //drawScene();
                    }
                }
            }
        }
        else {
            let Prev = this.selectedPart;
            this.selectedPart = '';
            this.selectedAssembly = '';
            if (Prev != '') {

                this.initColorBuffers();
                if (this.anim == false) {
                    //drawScene();
                }
            }

        }
    }

}

private handleMouseMove(event) {

    this.eX1 = this.midX - (event.clientX - 362);
    this.eY1 = -this.midY + (event.clientY - 116);

    if (event.which == 2) {
        this.E_X = event.clientX;
        this.E_Y = event.clientY;

        if (event.shiftKey == 1) {
            this.currentView.xDeg = this.currentView.xDeg - this.EY + event.clientY;
            this.currentView.yDeg = this.currentView.yDeg - this.EX + event.clientX;
            //rotate = true;
        }
        else {
            this.currentView.DistX = this.currentView.DistX - this.EDX + event.clientX;
            this.currentView.DistY = this.currentView.DistY + this.EDY - event.clientY;
        }

        this.EX = event.clientX;
        this.EY = event.clientY;
        this.EDX = event.clientX;
        this.EDY = event.clientY;

        if (this.anim == false) {
            this.drawScene();
        }
    }
    else {
        if (this.SelectMode == true) {
            let Mouse_Ray = this.Get3DRay(event.clientX - 362, event.clientY - 116);

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


            let Hit_List = new Array();

            for (let i_vert = 0; i_vert < this.vertices.length; i_vert = i_vert + 9) {

                let Vc0 = new Array(this.vertices[i_vert + 0], this.vertices[i_vert + 1], this.vertices[i_vert + 2]);
                let Vc1 = new Array(this.vertices[i_vert + 3], this.vertices[i_vert + 4], this.vertices[i_vert + 5]);
                let Vc2 = new Array(this.vertices[i_vert + 6], this.vertices[i_vert + 7], this.vertices[i_vert + 8]);

                let Hit_Val = { t: 0, u: 0, v: 0 }

                if (this.Intersect_Triangle(Mouse_Ray.Near_PNT, Mouse_Ray.Far_PNT, Vc0, Vc1, Vc2, false, Hit_Val) == 1) {

                    // let HE = { Part: this.parts[i_vert / 9], Dist: Hit_Val.t }
                    // Hit_List[Hit_List.length] = HE;

                }

            }


            if (Hit_List.length > 0) {
                let HE1 = Hit_List[0];
                let S1 = HE1.Part;
                let S2 = HE1.Dist;
                for (let min_ind = 1; min_ind <= Hit_List.length - 1; min_ind++) {
                    if (Hit_List[min_ind].Dist < S2) {
                        S2 = Hit_List[min_ind].Dist;
                        S1 = Hit_List[min_ind].Part;
                    }
                }
                let Prev_0 = this.activePart;

                this.activePart = S1;

                if (Prev_0 != S1) {

                    this.initColorBuffers();
                    //drawScene();
                }
            }
        }
        else {
            let Prev = this.activePart;
            this.activePart = '';
            this.activeAssembly = '';
            if (Prev != '') {

                this.initColorBuffers();
                //drawScene();
            }

        }

    }
}



private initColorBuffers() {

    if (this.activePart != '') {
        let trColors_1 = new Array();

        for (let p_num = 0; p_num < this.parts.length; p_num++) {

            trColors_1[p_num * 12 + 0] = this.trColors[p_num * 12 + 0];
            trColors_1[p_num * 12 + 1] = this.trColors[p_num * 12 + 1];
            trColors_1[p_num * 12 + 2] = this.trColors[p_num * 12 + 2];
            trColors_1[p_num * 12 + 3] = this.trColors[p_num * 12 + 3];
            trColors_1[p_num * 12 + 4] = this.trColors[p_num * 12 + 4];
            trColors_1[p_num * 12 + 5] = this.trColors[p_num * 12 + 5];
            trColors_1[p_num * 12 + 6] = this.trColors[p_num * 12 + 6];
            trColors_1[p_num * 12 + 7] = this.trColors[p_num * 12 + 7];
            trColors_1[p_num * 12 + 8] = this.trColors[p_num * 12 + 8];
            trColors_1[p_num * 12 + 9] = this.trColors[p_num * 12 + 9];
            trColors_1[p_num * 12 + 10] = this.trColors[p_num * 12 + 10];
            trColors_1[p_num * 12 + 11] = this.trColors[p_num * 12 + 11];

            if (this.parts[p_num] == this.activePart) {
                trColors_1[p_num * 12 + 0] = this.activePartColor[0];
                trColors_1[p_num * 12 + 1] = this.activePartColor[1];
                trColors_1[p_num * 12 + 2] = this.activePartColor[2];
                trColors_1[p_num * 12 + 3] = this.activePartColor[3];
                trColors_1[p_num * 12 + 4] = this.activePartColor[0];
                trColors_1[p_num * 12 + 5] = this.activePartColor[1];
                trColors_1[p_num * 12 + 6] = this.activePartColor[2];
                trColors_1[p_num * 12 + 7] = this.activePartColor[3];
                trColors_1[p_num * 12 + 8] = this.activePartColor[0];
                trColors_1[p_num * 12 + 9] = this.activePartColor[1];
                trColors_1[p_num * 12 + 10] = this.activePartColor[2];
                trColors_1[p_num * 12 + 11] = this.activePartColor[3];
            }

            if (this.parts[p_num] == this.selectedPart) {
                trColors_1[p_num * 12 + 0] = this.selectedPartColor[0];
                trColors_1[p_num * 12 + 1] = this.selectedPartColor[1];
                trColors_1[p_num * 12 + 2] = this.selectedPartColor[2];
                trColors_1[p_num * 12 + 3] = this.selectedPartColor[3];
                trColors_1[p_num * 12 + 4] = this.selectedPartColor[0];
                trColors_1[p_num * 12 + 5] = this.selectedPartColor[1];
                trColors_1[p_num * 12 + 6] = this.selectedPartColor[2];
                trColors_1[p_num * 12 + 7] = this.selectedPartColor[3];
                trColors_1[p_num * 12 + 8] = this.selectedPartColor[0];
                trColors_1[p_num * 12 + 9] = this.selectedPartColor[1];
                trColors_1[p_num * 12 + 10] = this.selectedPartColor[2];
                trColors_1[p_num * 12 + 11] = this.selectedPartColor[3];
            }

        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.facesVertexColorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(trColors_1), this.gl.STREAM_DRAW);

    }
    else {
        let trColors_2 = new Array();

        for (let p_num_2 = 0; p_num_2 < this.parts.length; p_num_2++) {

            if (this.parts[p_num_2] === this.selectedPart) {
                trColors_2[p_num_2 * 12 + 0] = this.selectedPartColor[0];
                trColors_2[p_num_2 * 12 + 1] = this.selectedPartColor[1];
                trColors_2[p_num_2 * 12 + 2] = this.selectedPartColor[2];
                trColors_2[p_num_2 * 12 + 3] = this.selectedPartColor[3];
                trColors_2[p_num_2 * 12 + 4] = this.selectedPartColor[0];
                trColors_2[p_num_2 * 12 + 5] = this.selectedPartColor[1];
                trColors_2[p_num_2 * 12 + 6] = this.selectedPartColor[2];
                trColors_2[p_num_2 * 12 + 7] = this.selectedPartColor[3];
                trColors_2[p_num_2 * 12 + 8] = this.selectedPartColor[0];
                trColors_2[p_num_2 * 12 + 9] = this.selectedPartColor[1];
                trColors_2[p_num_2 * 12 + 10] = this.selectedPartColor[2];
                trColors_2[p_num_2 * 12 + 11] = this.selectedPartColor[3];
            }
            else {
                trColors_2[p_num_2 * 12 + 0] = this.trColors[p_num_2 * 12 + 0];
                trColors_2[p_num_2 * 12 + 1] = this.trColors[p_num_2 * 12 + 1];
                trColors_2[p_num_2 * 12 + 2] = this.trColors[p_num_2 * 12 + 2];
                trColors_2[p_num_2 * 12 + 3] = this.trColors[p_num_2 * 12 + 3];
                trColors_2[p_num_2 * 12 + 4] = this.trColors[p_num_2 * 12 + 4];
                trColors_2[p_num_2 * 12 + 5] = this.trColors[p_num_2 * 12 + 5];
                trColors_2[p_num_2 * 12 + 6] = this.trColors[p_num_2 * 12 + 6];
                trColors_2[p_num_2 * 12 + 7] = this.trColors[p_num_2 * 12 + 7];
                trColors_2[p_num_2 * 12 + 8] = this.trColors[p_num_2 * 12 + 8];
                trColors_2[p_num_2 * 12 + 9] = this.trColors[p_num_2 * 12 + 9];
                trColors_2[p_num_2 * 12 + 10] = this.trColors[p_num_2 * 12 + 10];
                trColors_2[p_num_2 * 12 + 11] = this.trColors[p_num_2 * 12 + 11];
            }

        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.facesVertexColorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(trColors_2), this.gl.STREAM_DRAW);

    }

}


private normalize(v) {
    let d = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    let v1 = new Array(v[0] /= d, v[1] /= d, v[2] /= d);
    return v1;

}

/* normalized cross product of non-parallel vectors */
private normCrossProd(u, v) {
    let n1 = new Array(u[1] * v[2] - v[1] * u[2],
        u[2] * v[0] - v[2] * u[0],
        u[0] * v[1] - v[0] * u[1]
    );

    return this.normalize(n1);
}
private normFace(v1, v2, v3) {
    let d1 = new Array(), d2 = new Array();
    let k;
    for (k = 0; k <= 2; k++) {
        d1[k] = v2[k] - v1[k];
        d2[k] = v3[k] - v2[k];
    }

    return this.normCrossProd(d1, d2);
}

private Vector_Median(u, v) {
    if (u == null && v == null)
        return null;
    if (u == null)
        return v;
    if (v == null)
        return u;


    let l_u = Math.sqrt(u[0] * u[0] + u[1] * u[1] + u[2] * u[2]);
    let l_v = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);

    let n1 = new Array(u[0] * l_v + l_u * v[0],
        u[1] * l_v + l_u * v[1],
        u[2] * l_v + l_u * v[2]
    );

    let l_n = Math.sqrt(n1[0] * n1[0] + n1[1] * n1[1] + n1[2] * n1[2]);
    n1[0] = n1[0] / l_n;
    n1[1] = n1[1] / l_n;
    n1[2] = n1[2] / l_n;

    return n1;
}

private animate() {

    //let timeNow = new Date().getTime();
    //if (lastTime != 0) {
    //let elapsed = timeNow - lastTime;

    //if(splashClock != undefined){
    //let t = splashClock.getElapsedTime();


    //change vertices and normal array here -------------------------------
    /*
    let t = splashClock.getElapsedTime();

    waves(waveTime * 0.012);

    renderer.clear();
    renderer.render( splashScene, camera );


    waveTime++;
    window.requestAnimationFrame(animate, renderer.domElement);
    */
    //alert(vertices.length);



    for (let i = 0; i < this.vertices.length; i = i + 3) {

        let x = this.vertices[i + 0];
        let y = this.vertices[i + 2];
        //alert('lalal');
        this.vertices[i + 1] = this.waveA(x, y, this.elapsed * 0.012);
        this.vertices[i + 1] = this.vertices[i + 1] + this.waveB(x, y, this.elapsed * 0.012);
    }
    if (this.showFaces) {
        if (this.elapsed % 3 === 0) {
            let Sa_Num = Math.sqrt(this.vertices.length / 3);
            let RS_Count = Sa_Num;
            let N1 = new Array();
            let N2 = new Array();
            let N3 = new Array();
            let N4 = new Array();

            let N_Mid = new Array();

            for (let i = 0; i < this.normals.length; i = i + 3) {

                let Row = parseInt((i / 3 / Sa_Num).toString());
                let Column = parseInt((i / 3 - Row * Sa_Num).toString());

                if (Column < Sa_Num - 2 && Row < RS_Count - 2) {
                    let v1 = new Array(this.vertices[i], this.vertices[i + 1], this.vertices[i + 2]);
                    let v2 = new Array(this.vertices[i + 3], this.vertices[(i + 3) + 1], this.vertices[(i + 3) + 2]);
                    let v3 = new Array(this.vertices[((Row + 1) * Sa_Num + Column) * 3], this.vertices[((Row + 1) * Sa_Num + Column) * 3 + 1], this.vertices[((Row + 1) * Sa_Num + Column) * 3 + 2]);
                    N1 = this.normFace(v1, v2, v3);
                }
                else {
                    N1 = null; // ??????????????
                }

                if (Column < Sa_Num - 2 && Row > 0) {
                    let v4 = new Array(this.vertices[i], this.vertices[i + 1], this.vertices[i + 2]);
                    let v5 = new Array(this.vertices[((Row - 1) * Sa_Num + Column) * 3], this.vertices[((Row - 1) * Sa_Num + Column) * 3 + 1], this.vertices[((Row - 1) * Sa_Num + Column) * 3 + 2]);
                    let v6 = new Array(this.vertices[i + 3], this.vertices[(i + 3) + 1], this.vertices[(i + 3) + 2]);
                    N2 = this.normFace(v4, v5, v6);
                }
                else {
                    N2 = null; // ??????????????
                }

                if (Column > 0 && Row > 0) {
                    let v7 = new Array(this.vertices[i], this.vertices[i + 1], this.vertices[i + 2]);
                    let v8 = new Array(this.vertices[i - 3], this.vertices[(i - 3) + 1], this.vertices[(i - 3) + 2]);
                    let v9 = new Array(this.vertices[((Row - 1) * Sa_Num + Column) * 3], this.vertices[((Row - 1) * Sa_Num + Column) * 3 + 1], this.vertices[((Row - 1) * Sa_Num + Column) * 3 + 2]);
                    N3 = this.normFace(v7, v8, v9);
                }
                else {
                    N3 = null; // ??????????????`
                }

                if (Column > 0 && Row < RS_Count - 2) {
                    let v10 = new Array(this.vertices[i], this.vertices[i + 1], this.vertices[i + 2]);
                    let v11 = new Array(this.vertices[((Row + 1) * Sa_Num + Column) * 3], this.vertices[((Row + 1) * Sa_Num + Column) * 3 + 1], this.vertices[((Row + 1) * Sa_Num + Column) * 3 + 2]);
                    let v12 = new Array(this.vertices[i - 3], this.vertices[(i - 3) + 1], this.vertices[(i - 3) + 2]);
                    N4 = this.normFace(v10, v11, v12);
                }
                else {
                    N4 = null; // ??????????????
                }
                N_Mid = this.Vector_Median(N1, N2);
                N_Mid = this.Vector_Median(N_Mid, N3);
                N_Mid = this.Vector_Median(N_Mid, N4);

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
                this.normals[i] = N_Mid[0];
                this.normals[i + 1] = N_Mid[1];
                this.normals[i + 2] = N_Mid[2];

                //alert(this.normals);
            }
        }
    }
    //}
    this.elapsed++;
    this.UpdateBuffers();
    //rPyramid += (90 * this.elapsed) / 1000.0;
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


    let len = opVerts.length;
    for (let i = 0; i < len; i++) {
        opVerts[i].z = this.waveA(opVerts[i].x, opVerts[i].y, t);
    }


    let wavelet;
    let colorWave;

    //small waves
    for (let j = 0, l = this.oceanPlane.vertices.length; j < l; j++) {
        oceanPlane.vertices[j].z = oceanPlane.vertices[j].z + waveB(this.oceanPlane.vertices[j].x, oceanPlane.vertices[j].z, t);
    }

    ocean.geometry.__dirtyVertices = true;
    ocean.geometry.verticesNeedUpdate = true;
}
*/



private waveA(x, y, t) {
    return Math.sin((x / 20) * this.waveOffsetA + (t / this.waveSpeedA)) * Math.cos((y / 20) * this.waveOffsetA + (t / this.waveSpeedA)) * this.waveHeightA;
}

private waveB(x, y, t) {
    return Math.sin((x / 2) * this.waveOffsetB + (t / this.waveSpeedB)) * Math.cos((y / 2) * this.waveOffsetB + (t / this.waveSpeedB)) * this.waveHeightB;
}

private tick() {
    debugger;
    if (this.anim) {
        //requestAnimFrame(tick);
        window.requestAnimationFrame(() => this.tick());
    }
    this.animate();
    this.drawScene();
}


private UpdateBuffers() {



    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STREAM_DRAW);

    //gl.bindBuffer(gl.ARRAY_BUFFER, facesVertexNormalBuffer);
    //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.DYNAMIC_DRAW);

}

private Surface_Strip() {
    this.vertices = new Array();
    this.trColors = new Array();
    this.trIndices = new Array();
    this.normals = new Array();
}

private init_Surface_Geom() {
    let end_for = 5;//5
    let step_for = 0.02;
    let step = 0.02;
    let RS_Count = parseInt((end_for / step_for).toString()) + 1;
    let DDist = 0;
    let m = 0;
    let n = 0;

    let ACC_Len = this.RS_3D[0].length;
    let Sa_Num = ACC_Len;

    //let a = 3000 / (ACC_Len - 1) + 1;
    //let b = (RS_Count-1)/a;

    for (let i = 0; i < this.RS_3D.length; i++) {
        m++;
        //let ACC_Len = RS_3D[i].length;

        for (let f = 0; f < ACC_Len; f++) {

            let Geom = true;

            if (Geom) {

                //let R1 = 0;
                //let G1 = 1;
                //let B1 = 0;

                this.vertices[(f + (m - 1) * ACC_Len) * 3 + 0] = DDist;
                this.vertices[(f + (m - 1) * ACC_Len) * 3 + 1] = this.RS_3D[i][f];
                this.vertices[(f + (m - 1) * ACC_Len) * 3 + 2] = (f * step);

                this.trColors[(f + (m - 1) * ACC_Len) * 4 + 0] = 0;
                this.trColors[(f + (m - 1) * ACC_Len) * 4 + 1] = 1;
                this.trColors[(f + (m - 1) * ACC_Len) * 4 + 2] = 0;
                this.trColors[(f + (m - 1) * ACC_Len) * 4 + 3] = 1;

                if (m < RS_Count) {
                    if (f < ACC_Len - 1) {

                        this.trIndices[n] = f + (m - 1) * ACC_Len;
                        n++;
                        this.trIndices[n] = (f + 1) + (m - 1) * ACC_Len;
                        n++;
                        this.trIndices[n] = f + m * ACC_Len;
                        n++;
                        this.trIndices[n] = f + m * ACC_Len;
                        n++;
                        this.trIndices[n] = (f + 1) + (m - 1) * ACC_Len;
                        n++;
                        this.trIndices[n] = (f + 1) + m * ACC_Len;
                        n++;
                    }
                }
            }
        }
        DDist = DDist + step * 10;
    }


    let N1 = new Array();
    let N2 = new Array();
    let N3 = new Array();
    let N4 = new Array();

    let N_Mid = new Array();

    for (let i = 0; i < this.vertices.length; i = i + 3) {

        let Row = parseInt((i / 3 / Sa_Num).toString()); //first is 0
        let Column = parseInt((i / 3 - Row * Sa_Num).toString()); //first is 0

        if (Column < Sa_Num - 2 && Row < RS_Count - 2) {
            let v1 = new Array(this.vertices[i], this.vertices[i + 1], this.vertices[i + 2]);
            let v2 = new Array(this.vertices[i + 3], this.vertices[(i + 3) + 1], this.vertices[(i + 3) + 2]);
            let v3 = new Array(this.vertices[((Row + 1) * Sa_Num + Column) * 3], this.vertices[((Row + 1) * Sa_Num + Column) * 3 + 1], this.vertices[((Row + 1) * Sa_Num + Column) * 3 + 2]);
            N1 = this.normFace(v1, v2, v3);
        }
        else {
            N1 = null; // ??????????????
        }

        if (Column < Sa_Num - 2 && Row > 0) {
            let v4 = new Array(this.vertices[i], this.vertices[i + 1], this.vertices[i + 2]);
            let v5 = new Array(this.vertices[((Row - 1) * Sa_Num + Column) * 3], this.vertices[((Row - 1) * Sa_Num + Column) * 3 + 1], this.vertices[((Row - 1) * Sa_Num + Column) * 3 + 2]);
            let v6 = new Array(this.vertices[i + 3], this.vertices[(i + 3) + 1], this.vertices[(i + 3) + 2]);
            N2 = this.normFace(v4, v5, v6);
        }
        else {
            N2 = null; // ??????????????
        }

        if (Column > 0 && Row > 0) {
            let v7 = new Array(this.vertices[i], this.vertices[i + 1], this.vertices[i + 2]);
            let v8 = new Array(this.vertices[i - 3], this.vertices[(i - 3) + 1], this.vertices[(i - 3) + 2]);
            let v9 = new Array(this.vertices[((Row - 1) * Sa_Num + Column) * 3], this.vertices[((Row - 1) * Sa_Num + Column) * 3 + 1], this.vertices[((Row - 1) * Sa_Num + Column) * 3 + 2]);
            N3 = this.normFace(v7, v8, v9);
        }
        else {
            N3 = null; // ??????????????
        }

        if (Column > 0 && Row < RS_Count - 2) {
            let v10 = new Array(this.vertices[i], this.vertices[i + 1], this.vertices[i + 2]);
            let v11 = new Array(this.vertices[((Row + 1) * Sa_Num + Column) * 3], this.vertices[((Row + 1) * Sa_Num + Column) * 3 + 1], this.vertices[((Row + 1) * Sa_Num + Column) * 3 + 2]);
            let v12 = new Array(this.vertices[i - 3], this.vertices[(i - 3) + 1], this.vertices[(i - 3) + 2]);
            N4 = this.normFace(v10, v11, v12);
        }
        else {
            N4 = null; // ??????????????
        }
        N_Mid = this.Vector_Median(N1, N2);
        N_Mid = this.Vector_Median(N_Mid, N3);
        N_Mid = this.Vector_Median(N_Mid, N4);

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
        this.normals[i] = N_Mid[0];
        this.normals[i + 1] = N_Mid[1];
        this.normals[i + 2] = N_Mid[2];



    }
}

private initBuffers() {

    this.vertexPositionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STREAM_DRAW);
    this.vertexPositionBuffer.itemSize = 3;
    this.vertexPositionBuffer.numItems = this.vertices.length / 3;


    this.facesVertexNormalBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.facesVertexNormalBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.normals), this.gl.STREAM_DRAW);
    this.facesVertexNormalBuffer.itemSize = 3;
    this.facesVertexNormalBuffer.numItems = this.normals.length / 3;

    this.facesVertexColorBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.facesVertexColorBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.trColors), this.gl.STATIC_DRAW);
    this.facesVertexColorBuffer.itemSize = 4;
    this.facesVertexColorBuffer.numItems = this.trColors.length / 4;

    this.facesVertexIndexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.facesVertexIndexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.trIndices), this.gl.STATIC_DRAW);
    this.facesVertexIndexBuffer.itemSize = 1;
    this.facesVertexIndexBuffer.numItems = this.trIndices.length;
    //alert(this.trIndices.length);
    if (this.anim) {
        this.linesVertexIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.linesVertexIndexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.lineIndices), this.gl.STATIC_DRAW);
        this.linesVertexIndexBuffer.itemSize = 1;
        this.linesVertexIndexBuffer.numItems = this.lineIndices.length;
    }

    // --------------------------

}


private drawScene() {


    this.showFaces = false;

    if (this.currentView.Rotate_Incr === 0)
        this.RI = 0.5;
    else
        this.RI = this.currentView.Rotate_Incr;

    if (this.currentView.Zoom_Incr === 0)
        this.ZI = 0.002;
    else
        this.ZI = this.currentView.Zoom_Incr;

    if (this.currentView.Translate_Incr === 0)
        this.TI = 0.0002;
    else
        this.TI = this.currentView.Translate_Incr;

    this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    mat4.perspective(this.pMatrix, 45, this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 100000.0);

    mat4.identity(this.mvMatrix);

    mat4.translate(this.mvMatrix, this.mvMatrix, [(this.currentView.DistX * this.TI + this.currentView.PowerDX_1 * this.ZI * 1.05 / 10), (this.currentView.DistY * this.TI + this.currentView.PowerDY_1 * this.ZI * 1.05 / 10), (this.currentView.DistZ + this.currentView.PowerS * this.ZI)]);
    mat4.rotate(this.mvMatrix, this.mvMatrix, this.degToRad(this.currentView.xDeg * this.currentView.Rotate_Incr), [1, 0, 0]);
    mat4.rotate(this.mvMatrix, this.mvMatrix, this.degToRad(this.currentView.yDeg * this.currentView.Rotate_Incr), [0, 1, 0]);


    let lighting = true;
    this.gl.uniform1i(this.shaderProgram.useLightingUniform, lighting);
    if (lighting) {

        this.gl.uniform3f(this.shaderProgram.ambientColorUniform, 0.3, 0.3, 0.3);

        let lightingDirection = [0, 0, -1];
        let adjustedLD = vec3.create();
        vec3.normalize(lightingDirection, adjustedLD);
        vec3.scale(adjustedLD, -1);
        this.gl.uniform3fv(this.shaderProgram.lightingDirectionUniform, adjustedLD);

        this.gl.uniform3f(this.shaderProgram.directionalColorUniform, 0.6, 0.6, 0.6);

    }

    this.gl.disable(this.gl.BLEND);
    this.gl.uniform1f(this.shaderProgram.alphaUniform, 1)
    this.gl.enable(this.gl.DEPTH_TEST);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.facesVertexNormalBuffer);
    this.gl.vertexAttribPointer(this.shaderProgram.vertexNormalAttribute, this.facesVertexNormalBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.facesVertexColorBuffer);
    this.gl.vertexAttribPointer(this.shaderProgram.vertexColorAttribute, this.facesVertexColorBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    if (this.anim) {
        if (this.showFaces) {
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.facesVertexIndexBuffer);
            this.setMatrixUniforms();
            //gl.drawArrays(gl.TRIANGLES, 0, facesVertexIndexBuffer.numItems);
            this.gl.drawElements(this.gl.TRIANGLES, this.facesVertexIndexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
        }
    }
    else {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.facesVertexIndexBuffer);
        this.setMatrixUniforms();
        //gl.drawArrays(gl.TRIANGLES, 0, facesVertexIndexBuffer.numItems);
        this.gl.drawElements(this.gl.TRIANGLES, this.facesVertexIndexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
        //alert(facesVertexIndexBuffer.numItems);

    }
    //gl.bindBuffer(gl.ARRAY_BUFFER, linesVertexColorBuffer);
    //gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, linesVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    if (this.anim) {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.linesVertexIndexBuffer);
        this.setMatrixUniforms();
        this.gl.drawElements(this.gl.LINES, this.linesVertexIndexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
        let a = 0;
    }
    //gl.lineWidth(3.0);
    // ------------------------------------------------  Draw Bolts

    //alert('LALALLALA 8');

    /* -------------------------------------------------  Display Mouse Ray  --------------------------------------------------
    gl.bindBuffer(gl.ARRAY_BUFFER, Temp_LinesvertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, Temp_LinesvertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Temp_linesVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.LINES, Temp_linesVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    */

}

private resizeCanvas() {
    //let canvas = document.getElementById('worldmapcanvas1');
    this.canvasWidth = this.canvas.clientWidth;
    this.canvasHeight = this.canvas.clientHeight;
    // only change the size of the canvas if the size it's being displayed
    // has changed.
    if (this.canvas.width !== this.canvas.clientWidth ||
        this.canvas.height !== this.canvas.clientHeight) {
        // Change the size of the canvas to match the size it's being displayed
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    this.midX = this.canvas.width / 2.0;
    this.midY = this.canvas.height / 2.0;

    try {
        this.gl.viewportWidth = this.canvas.width;
        this.gl.viewportHeight = this.canvas.height;
        this.drawScene();
    }
    catch (e) { }

}

public webGLStop() {
    this.anim = false;
}

private webGLStart(canvas, ANIME) {
    this.initGL(canvas);
    this.anim = ANIME;

    this.elapsed = 0;
    this.showFaces = false;
    this.SelectMode = false;

    this.Load_currentView();

    //let canvas = document.getElementById('worldmapcanvas1');
    this.resizeCanvas();

    this.initShaders();


    let i, f;
    for (i = 0; i < 10800; i++) {
        this.vertices.push(0);
        this.normals.push(0);
    }

    for (i = 0; i < 14400; i++) {
        this.trColors.push(0);
    }

    if (this.vertices.length === 0) {

        this.init_Surface_Geom();
    }

    for (i = 0; i < 20886; i++) {
        this.trIndices.push(0);
    }

    for (i = 0; i < 14160; i++) {
        this.lineIndices.push(0);
    }

    let m = 0, n = 0, n_L = 0, n_col = 0;
    let DDist = -60;
    let step = 2;

    for (i = 0; i < 60; i++) {
        m++;
        for (f = 0; f < 60; f++) {
            this.vertices[(f + (m - 1) * 60) * 3 + 0] = DDist;
            this.vertices[(f + (m - 1) * 60) * 3 + 1] = 0;
            this.vertices[(f + (m - 1) * 60) * 3 + 2] = (f * step - 60);

            this.vertices[(f + (m - 1) * 60) * 3 + 0] = DDist;
            this.vertices[(f + (m - 1) * 60) * 3 + 1] = 0;
            this.vertices[(f + (m - 1) * 60) * 3 + 2] = (f * step - 60);

            this.trColors[n_col++] = 0;
            this.trColors[n_col++] = 1;
            this.trColors[n_col++] = 0;
            this.trColors[n_col++] = 0.9;
            if (m < 60) {
                if (f < 60 - 1) {
                    this.trIndices[n] = f + (m - 1) * 60;
                    this.lineIndices[n_L] = f + (m - 1) * 60;
                    n++;
                    n_L++;
                    this.trIndices[n] = (f + 1) + (m - 1) * 60;
                    this.lineIndices[n_L] = (f + 1) + (m - 1) * 60;
                    n++;
                    n_L++;
                    this.trIndices[n] = f + m * 60;
                    n++;
                    this.trIndices[n] = f + m * 60;
                    n++;
                    this.trIndices[n] = (f + 1) + (m - 1) * 60;
                    this.lineIndices[n_L] = (f + 1) + (m - 1) * 60;
                    n++;
                    n_L++;
                    this.trIndices[n] = (f + 1) + m * 60;
                    this.lineIndices[n_L] = (f + 1) + m * 60;
                    n++;
                    n_L++;
                }
                else {
                    this.lineIndices[n_L] = (m - 1) * 60;
                    n_L++;
                    this.lineIndices[n_L] = m * 60;
                    n_L++;
                }
            }
            else {
                if (f < 60 - 1) {
                    this.lineIndices[n_L] = (f + 1) + (m - 1) * 60;
                    n_L++;
                    this.lineIndices[n_L] = f + (m - 1) * 60;
                    n_L++;
                }
            }
        }
        DDist = DDist + step;
    }

    let max = 0;
    for (i = 0; i < 14160; i++) {
        if (this.lineIndices[i] > max) max = this.lineIndices[i];
    }


    this.initBuffers(); // <---------- error here!

    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);

    this.gl.clearColor(0, 0, 0, 1.0);
    //gl.clearColor(0.67843, 0.84706, 0.90196, 1.0);
    this.gl.enable(this.gl.DEPTH_TEST);

    this.gl.depthFunc(this.gl.LEQUAL);

    this.gl.hint(this.gl.PERSPECTIVE_CORRECTION_HINT, this.gl.NICEST);

    this.gl.polygonOffset(2, 1);

    this.activePart = '';
    this.activeAssembly = '';
    this.selectedPart = '';
    this.selectedAssembly = '';

    // try {
    //     canvas.addEventListener('DOMMouseScroll', wheel, false);
    // }
    // catch (e) {
    // }
    try {
        canvas.addEventListener('mousewheel', (e) => this.MouseWheelHandler(e), false);
    }
    catch (e) {
    }

    window.onresize = () => this.resizeCanvas();

    canvas.onmousedown = e => this.handleMouseDown(e);
    canvas.onmousemove = e => this.handleMouseMove(e);


    if (ANIME) {
        this.tick();
    }
    else {
        this.drawScene();
    }
}

private Load_currentView() {
    try {
        this.currentView = {
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

private _Cross(dest, v1, v2) {
    dest.X = v1[1] * v2[2] - v1[2] * v2[1];
    dest.Y = v1[2] * v2[0] - v1[0] * v2[2];
    dest.Z = v1[0] * v2[1] - v1[1] * v2[0];
}

private _Cross1(dest, v1, v2) {
    dest.X = v1.Y * v2.Z - v1.Z * v2.Y;
    dest.Y = v1.Z * v2.X - v1.X * v2.Z;
    dest.Z = v1.X * v2.Y - v1.Y * v2.X;
}

private _Cross2(dest, v1, v2) {
    dest.X = v1[1] * v2.Z - v1[2] * v2.Y;
    dest.Y = v1[2] * v2.X - v1[0] * v2.Z;
    dest.Z = v1[0] * v2.Y - v1[1] * v2.X;
}

private _DOT(v1, v2) {
    return v1.X * v2.X + v1.Y * v2.Y + v1.Z * v2.Z;
}
private _DOT2(v1, v2) {
    return v1[0] * v2.X + v1[1] * v2.Y + v1[2] * v2.Z;
}
private _SUB(dest, v1, v2) {
    dest.X = v1[0] - v2[0];
    dest.Y = v1[1] - v2[1];
    dest.Z = v1[2] - v2[2];

}

private Intersect_Triangle(orig, dir, vert0, vert1, vert2, TEST_CULL, Hit_Obj) {

    let edge1 = { X: 0, Y: 0, Z: 0 }
    let edge2 = { X: 0, Y: 0, Z: 0 }
    let tvec = { X: 0, Y: 0, Z: 0 }
    let pvec = { X: 0, Y: 0, Z: 0 }
    let qvec = { X: 0, Y: 0, Z: 0 }
    let det, inv_det;

    this._SUB(edge1, vert1, vert0);
    this._SUB(edge2, vert2, vert0);

    this._Cross2(pvec, dir, edge2);

    det = this._DOT(edge1, pvec);

    if (TEST_CULL) {

        if (det < this.Epsilon)
            return 0;

        this._SUB(tvec, orig, vert0);

        Hit_Obj.u = this._DOT(tvec, pvec);
        if (Hit_Obj.u < 0 || Hit_Obj.u > det)
            return 0;

        this._Cross1(qvec, tvec, edge1);

        Hit_Obj.v = this._DOT2(dir, qvec);
        if (Hit_Obj.v < 0 || Hit_Obj.u + Hit_Obj.v > det)
            return 0;

        Hit_Obj.t = this._DOT(edge2, qvec);
        inv_det = 1 / det;
        Hit_Obj.t *= inv_det;
        Hit_Obj.u *= inv_det;
        Hit_Obj.v *= inv_det;
    }
    else {
        if (det > -this.Epsilon && det < this.Epsilon)
            return 0;

        inv_det = 1 / det;
        this._SUB(tvec, orig, vert0);

        Hit_Obj.u = this._DOT(tvec, pvec) * inv_det;

        if (Hit_Obj.u < 0 || Hit_Obj.u > 1)
            return 0;


        this._Cross1(qvec, tvec, edge1);
        Hit_Obj.v = this._DOT2(dir, qvec) * inv_det;

        if (Hit_Obj.v < 0 || Hit_Obj.u + Hit_Obj.v > 1)
            return 0;

        Hit_Obj.t = this._DOT(edge2, qvec) * inv_det;
    }

    return 1;

}

}



class GLU {

    public static unProject(winX, winY, winZ, model, proj, view, objPos) {

        let inp = [
            winX,
            winY,
            winZ,
            1.0
        ];

        let finalMatrix = [];

        this.multMatrices(model, proj, finalMatrix);
        if (!this.invertMatrix(finalMatrix, finalMatrix)) {
            return (false);
        }

        inp[0] = (inp[0] - view[0]) / view[2];
        inp[1] = (inp[1] - view[1]) / view[3];

        inp[0] = inp[0] * 2 - 1;
        inp[1] = inp[1] * 2 - 1;
        inp[2] = inp[2] * 2 - 1;

        let out = [];

        this.multMatrixVec(finalMatrix, inp, out);

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

    public static multMatrixVec(matrix, inp, out) {
        for (let i = 0; i < 4; i = i + 1) {
            out[i] =
                inp[0] * matrix[0 * 4 + i] +
                inp[1] * matrix[1 * 4 + i] +
                inp[2] * matrix[2 * 4 + i] +
                inp[3] * matrix[3 * 4 + i];
        }
    };

    public static multMatrices(a, b, r) {
        for (let i = 0; i < 4; i = i + 1) {
            for (let j = 0; j < 4; j = j + 1) {
                r[i * 4 + j] =
                    a[i * 4 + 0] * b[0 * 4 + j] +
                    a[i * 4 + 1] * b[1 * 4 + j] +
                    a[i * 4 + 2] * b[2 * 4 + j] +
                    a[i * 4 + 3] * b[3 * 4 + j];
            }
        }
    };

    public static invertMatrix(m, invOut) {

        let inv = [];

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

        let det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];

        if (det === 0) {
            return false;
        }

        det = 1.0 / det;

        for (let i = 0; i < 16; i = i + 1) {
            invOut[i] = inv[i] * det;
        }

        return true;
    };

}