import * as getContext from 'get-canvas-context';
import { mat4, mat3, vec3 } from 'gl-matrix';

Array.prototype.max = function () {
    return Math.max.apply(null, this);
};

export default class Visualiser {

    private gl;
    private vertices;
    private normals;
    private Tr_colors;
    private Tr_indices;
    private L_indices;
    private _canvas;
    private shaderProgram;
    private mvMatrix;
    private mvMatrixStack;
    private pMatrix;
    private rotationMatrix;

    private E_X1
    private E_Y1;

    private Mid_X
    private Mid_Y;

    private VertexPositionBuffer;
    private FacesVertexNormalBuffer;
    private FacesVertexColorBuffer;
    private LinesVertexColorBuffer;
    private FacesVertexIndexBuffer;
    private LinesVertexIndexBuffer;

    private Selected_Part_Color;
    private Active_Part_Color;

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

    private canv_Width;
    private canv_Height;
    private Current_View;
    private Epsilon;

    private parts;

    private RS_3D;

    constructor(canvas, animate) {
        this.vertices = [];
        this.normals = [];
        this.Tr_colors = [];
        this.Tr_indices = [];
        this.L_indices = [];
        this.parts = [];
        this.RS_3D = [];
        this.mvMatrixStack = [];
        this.mvMatrix = mat4.create();
        this.pMatrix = mat4.create();
        this.rotationMatrix = mat4.create();
        mat4.identity(this.rotationMatrix);
        this.Selected_Part_Color = new Array(1, 0, 0, 1);
        this.Active_Part_Color = new Array(1, 1, 0, 1);
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
        this._canvas = canvas
        try {
            this.gl = canvas.getContext("webgl");
            this.gl.viewportWidth = canvas.width;
            this.gl.viewportHeight = canvas.height;
        } catch (e) {
        }
        if (!this.gl) {
            alert("Could not initialise WebGL!");
        }
    }

    private getShader(gl, type) {
        let shaderStr = "";
        if (type == "x-fragment") {
            shaderStr = require('webpack-glsl!./shaders/x-fragment.glsl').slice(18, -1);
        } else if (type == "x-vertex") {
            shaderStr = require('webpack-glsl!./shaders/x-vertex.glsl').slice(18, -1);
        } else {
            return null;
        }

        let str = shaderStr.replace(/(\\r\\n|\\n|\\r)/gm, " ");

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



    private initShaders() {
        let fragmentShader = this.getShader(this.gl, "x-fragment");
        let vertexShader = this.getShader(this.gl, "x-vertex");

        this.shaderProgram = this.gl.createProgram();
        this.gl.attachShader(this.shaderProgram, vertexShader);
        this.gl.attachShader(this.shaderProgram, fragmentShader);
        this.gl.linkProgram(this.shaderProgram);

        if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        this.gl.useProgram(this.shaderProgram);

        this.shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
        this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);

        this.shaderProgram.vertexNormalAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexNormal");
        this.gl.enableVertexAttribArray(this.shaderProgram.vertexNormalAttribute);

        this.shaderProgram.vertexColorAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexColor");
        this.gl.enableVertexAttribArray(this.shaderProgram.vertexColorAttribute);

        this.shaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");
        this.shaderProgram.mvMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
        this.shaderProgram.nMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uNMatrix");
        this.shaderProgram.samplerUniform = this.gl.getUniformLocation(this.shaderProgram, "uSampler");
        this.shaderProgram.useLightingUniform = this.gl.getUniformLocation(this.shaderProgram, "uUseLighting");
        this.shaderProgram.ambientColorUniform = this.gl.getUniformLocation(this.shaderProgram, "uAmbientColor");
        this.shaderProgram.lightingDirectionUniform = this.gl.getUniformLocation(this.shaderProgram, "uLightingDirection");
        this.shaderProgram.directionalColorUniform = this.gl.getUniformLocation(this.shaderProgram, "uDirectionalColor");
        this.shaderProgram.alphaUniform = this.gl.getUniformLocation(this.shaderProgram, "uAlpha");
    }




    private mvPushMatrix() {
        let copy = mat4.create();
        mat4.set(this.mvMatrix, copy);
        this.mvMatrixStack.push(copy);
    }

    private mvPopMatrix() {
        if (this.mvMatrixStack.length == 0) {
            throw "Invalid popMatrix!";
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

    this.Current_View.PowerDX_1 = this.Current_View.PowerDX_1 - this.E_X1 * Sign1 * Math.abs(delta / 100);
    this.Current_View.PowerDY_1 = this.Current_View.PowerDY_1 - this.E_Y1 * Sign1 * Math.abs(delta / 100);
    this.Current_View.PowerS = this.Current_View.PowerS + delta;

    if (this.anim == false) {
        this.drawScene();
    }

}



private handleMouseDown(event) {

    if (event.which == 2) {

        this.EX = event.clientX;
        this.EY = event.clientY;

        this.EDX = event.clientX;
        this.EDY = event.clientY;
    }
    if (event.which == 1) {

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
                let Prev_0 = this.Selected_Part;

                this.Selected_Part = S1;

                if (Prev_0 != S1) {

                    this.initColorBuffers();
                    if (this.anim == false) {
                        //drawScene();
                    }
                }
            }
        }
        else {
            let Prev = this.Selected_Part;
            this.Selected_Part = "";
            this.Selected_Assembly = "";
            if (Prev != "") {

                this.initColorBuffers();
                if (this.anim == false) {
                    //drawScene();
                }
            }

        }
    }

}


private xDeg;
private yDeg;
private EX;
private EY;
private EDX;
private EDY;
private E_X;
private E_Y;

private Active_Part;
private Active_Assembly;
private Selected_Part;
private Selected_Assembly;

private handleMouseMove(event) {

    this.E_X1 = this.Mid_X - (event.clientX - 362);
    this.E_Y1 = -this.Mid_Y + (event.clientY - 116);

    if (event.which == 2) {
        this.E_X = event.clientX;
        this.E_Y = event.clientY;

        if (event.shiftKey == 1) {
            this.Current_View.xDeg = this.Current_View.xDeg - this.EY + event.clientY;
            this.Current_View.yDeg = this.Current_View.yDeg - this.EX + event.clientX;
            //rotate = true;
        }
        else {
            this.Current_View.DistX = this.Current_View.DistX - this.EDX + event.clientX;
            this.Current_View.DistY = this.Current_View.DistY + this.EDY - event.clientY;
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
                let Prev_0 = this.Active_Part;

                this.Active_Part = S1;

                if (Prev_0 != S1) {

                    this.initColorBuffers();
                    //drawScene();
                }
            }
        }
        else {
            let Prev = this.Active_Part;
            this.Active_Part = "";
            this.Active_Assembly = "";
            if (Prev != "") {

                this.initColorBuffers();
                //drawScene();
            }

        }

    }
}



private initColorBuffers() {

    if (this.Active_Part != "") {
        let Tr_colors_1 = new Array();

        for (let p_num = 0; p_num < this.parts.length; p_num++) {

            Tr_colors_1[p_num * 12 + 0] = this.Tr_colors[p_num * 12 + 0];
            Tr_colors_1[p_num * 12 + 1] = this.Tr_colors[p_num * 12 + 1];
            Tr_colors_1[p_num * 12 + 2] = this.Tr_colors[p_num * 12 + 2];
            Tr_colors_1[p_num * 12 + 3] = this.Tr_colors[p_num * 12 + 3];
            Tr_colors_1[p_num * 12 + 4] = this.Tr_colors[p_num * 12 + 4];
            Tr_colors_1[p_num * 12 + 5] = this.Tr_colors[p_num * 12 + 5];
            Tr_colors_1[p_num * 12 + 6] = this.Tr_colors[p_num * 12 + 6];
            Tr_colors_1[p_num * 12 + 7] = this.Tr_colors[p_num * 12 + 7];
            Tr_colors_1[p_num * 12 + 8] = this.Tr_colors[p_num * 12 + 8];
            Tr_colors_1[p_num * 12 + 9] = this.Tr_colors[p_num * 12 + 9];
            Tr_colors_1[p_num * 12 + 10] = this.Tr_colors[p_num * 12 + 10];
            Tr_colors_1[p_num * 12 + 11] = this.Tr_colors[p_num * 12 + 11];

            if (this.parts[p_num] == this.Active_Part) {
                Tr_colors_1[p_num * 12 + 0] = this.Active_Part_Color[0];
                Tr_colors_1[p_num * 12 + 1] = this.Active_Part_Color[1];
                Tr_colors_1[p_num * 12 + 2] = this.Active_Part_Color[2];
                Tr_colors_1[p_num * 12 + 3] = this.Active_Part_Color[3];
                Tr_colors_1[p_num * 12 + 4] = this.Active_Part_Color[0];
                Tr_colors_1[p_num * 12 + 5] = this.Active_Part_Color[1];
                Tr_colors_1[p_num * 12 + 6] = this.Active_Part_Color[2];
                Tr_colors_1[p_num * 12 + 7] = this.Active_Part_Color[3];
                Tr_colors_1[p_num * 12 + 8] = this.Active_Part_Color[0];
                Tr_colors_1[p_num * 12 + 9] = this.Active_Part_Color[1];
                Tr_colors_1[p_num * 12 + 10] = this.Active_Part_Color[2];
                Tr_colors_1[p_num * 12 + 11] = this.Active_Part_Color[3];
            }

            if (this.parts[p_num] == this.Selected_Part) {
                Tr_colors_1[p_num * 12 + 0] = this.Selected_Part_Color[0];
                Tr_colors_1[p_num * 12 + 1] = this.Selected_Part_Color[1];
                Tr_colors_1[p_num * 12 + 2] = this.Selected_Part_Color[2];
                Tr_colors_1[p_num * 12 + 3] = this.Selected_Part_Color[3];
                Tr_colors_1[p_num * 12 + 4] = this.Selected_Part_Color[0];
                Tr_colors_1[p_num * 12 + 5] = this.Selected_Part_Color[1];
                Tr_colors_1[p_num * 12 + 6] = this.Selected_Part_Color[2];
                Tr_colors_1[p_num * 12 + 7] = this.Selected_Part_Color[3];
                Tr_colors_1[p_num * 12 + 8] = this.Selected_Part_Color[0];
                Tr_colors_1[p_num * 12 + 9] = this.Selected_Part_Color[1];
                Tr_colors_1[p_num * 12 + 10] = this.Selected_Part_Color[2];
                Tr_colors_1[p_num * 12 + 11] = this.Selected_Part_Color[3];
            }

        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.FacesVertexColorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(Tr_colors_1), this.gl.STREAM_DRAW);

    }
    else {
        let Tr_colors_2 = new Array();

        for (let p_num_2 = 0; p_num_2 < this.parts.length; p_num_2++) {

            if (this.parts[p_num_2] == this.Selected_Part) {
                Tr_colors_2[p_num_2 * 12 + 0] = this.Selected_Part_Color[0];
                Tr_colors_2[p_num_2 * 12 + 1] = this.Selected_Part_Color[1];
                Tr_colors_2[p_num_2 * 12 + 2] = this.Selected_Part_Color[2];
                Tr_colors_2[p_num_2 * 12 + 3] = this.Selected_Part_Color[3];
                Tr_colors_2[p_num_2 * 12 + 4] = this.Selected_Part_Color[0];
                Tr_colors_2[p_num_2 * 12 + 5] = this.Selected_Part_Color[1];
                Tr_colors_2[p_num_2 * 12 + 6] = this.Selected_Part_Color[2];
                Tr_colors_2[p_num_2 * 12 + 7] = this.Selected_Part_Color[3];
                Tr_colors_2[p_num_2 * 12 + 8] = this.Selected_Part_Color[0];
                Tr_colors_2[p_num_2 * 12 + 9] = this.Selected_Part_Color[1];
                Tr_colors_2[p_num_2 * 12 + 10] = this.Selected_Part_Color[2];
                Tr_colors_2[p_num_2 * 12 + 11] = this.Selected_Part_Color[3];
            }
            else {
                Tr_colors_2[p_num_2 * 12 + 0] = this.Tr_colors[p_num_2 * 12 + 0];
                Tr_colors_2[p_num_2 * 12 + 1] = this.Tr_colors[p_num_2 * 12 + 1];
                Tr_colors_2[p_num_2 * 12 + 2] = this.Tr_colors[p_num_2 * 12 + 2];
                Tr_colors_2[p_num_2 * 12 + 3] = this.Tr_colors[p_num_2 * 12 + 3];
                Tr_colors_2[p_num_2 * 12 + 4] = this.Tr_colors[p_num_2 * 12 + 4];
                Tr_colors_2[p_num_2 * 12 + 5] = this.Tr_colors[p_num_2 * 12 + 5];
                Tr_colors_2[p_num_2 * 12 + 6] = this.Tr_colors[p_num_2 * 12 + 6];
                Tr_colors_2[p_num_2 * 12 + 7] = this.Tr_colors[p_num_2 * 12 + 7];
                Tr_colors_2[p_num_2 * 12 + 8] = this.Tr_colors[p_num_2 * 12 + 8];
                Tr_colors_2[p_num_2 * 12 + 9] = this.Tr_colors[p_num_2 * 12 + 9];
                Tr_colors_2[p_num_2 * 12 + 10] = this.Tr_colors[p_num_2 * 12 + 10];
                Tr_colors_2[p_num_2 * 12 + 11] = this.Tr_colors[p_num_2 * 12 + 11];
            }

        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.FacesVertexColorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(Tr_colors_2), this.gl.STREAM_DRAW);

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
        //alert("lalal");
        this.vertices[i + 1] = this.waveA(x, y, this.elapsed * 0.012);
        this.vertices[i + 1] = this.vertices[i + 1] + this.waveB(x, y, this.elapsed * 0.012);
    }
    if (this.show_faces) {
        if (this.elapsed % 3 == 0) {
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



    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.VertexPositionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STREAM_DRAW);

    //gl.bindBuffer(gl.ARRAY_BUFFER, FacesVertexNormalBuffer);
    //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.DYNAMIC_DRAW);

}

private Surface_Strip() {
    this.vertices = new Array();
    this.Tr_colors = new Array();
    this.Tr_indices = new Array();
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

                this.Tr_colors[(f + (m - 1) * ACC_Len) * 4 + 0] = 0;
                this.Tr_colors[(f + (m - 1) * ACC_Len) * 4 + 1] = 1;
                this.Tr_colors[(f + (m - 1) * ACC_Len) * 4 + 2] = 0;
                this.Tr_colors[(f + (m - 1) * ACC_Len) * 4 + 3] = 1;

                if (m < RS_Count) {
                    if (f < ACC_Len - 1) {

                        this.Tr_indices[n] = f + (m - 1) * ACC_Len;
                        n++;
                        this.Tr_indices[n] = (f + 1) + (m - 1) * ACC_Len;
                        n++;
                        this.Tr_indices[n] = f + m * ACC_Len;
                        n++;
                        this.Tr_indices[n] = f + m * ACC_Len;
                        n++;
                        this.Tr_indices[n] = (f + 1) + (m - 1) * ACC_Len;
                        n++;
                        this.Tr_indices[n] = (f + 1) + m * ACC_Len;
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

    this.VertexPositionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.VertexPositionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STREAM_DRAW);
    this.VertexPositionBuffer.itemSize = 3;
    this.VertexPositionBuffer.numItems = this.vertices.length / 3;


    this.FacesVertexNormalBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.FacesVertexNormalBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.normals), this.gl.STREAM_DRAW);
    this.FacesVertexNormalBuffer.itemSize = 3;
    this.FacesVertexNormalBuffer.numItems = this.normals.length / 3;

    this.FacesVertexColorBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.FacesVertexColorBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.Tr_colors), this.gl.STATIC_DRAW);
    this.FacesVertexColorBuffer.itemSize = 4;
    this.FacesVertexColorBuffer.numItems = this.Tr_colors.length / 4;

    this.FacesVertexIndexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.FacesVertexIndexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.Tr_indices), this.gl.STATIC_DRAW);
    this.FacesVertexIndexBuffer.itemSize = 1;
    this.FacesVertexIndexBuffer.numItems = this.Tr_indices.length;
    //alert(this.Tr_indices.length);
    if (this.anim == true) {
        this.LinesVertexIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.LinesVertexIndexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.L_indices), this.gl.STATIC_DRAW);
        this.LinesVertexIndexBuffer.itemSize = 1;
        this.LinesVertexIndexBuffer.numItems = this.L_indices.length;
    }

    // --------------------------

}


private drawScene() {


    this.show_faces = false;

    if (this.Current_View.Rotate_Incr == 0)
        this.RI = 0.5;
    else
        this.RI = this.Current_View.Rotate_Incr;

    if (this.Current_View.Zoom_Incr == 0)
        this.ZI = 0.002;
    else
        this.ZI = this.Current_View.Zoom_Incr;

    if (this.Current_View.Translate_Incr == 0)
        this.TI = 0.0002;
    else
        this.TI = this.Current_View.Translate_Incr;

    this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    mat4.perspective(this.pMatrix, 45, this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 100000.0);

    mat4.identity(this.mvMatrix);

    mat4.translate(this.mvMatrix, this.mvMatrix, [(this.Current_View.DistX * this.TI + this.Current_View.PowerDX_1 * this.ZI * 1.05 / 10), (this.Current_View.DistY * this.TI + this.Current_View.PowerDY_1 * this.ZI * 1.05 / 10), (this.Current_View.DistZ + this.Current_View.PowerS * this.ZI)]);
    mat4.rotate(this.mvMatrix, this.mvMatrix, this.degToRad(this.Current_View.xDeg * this.Current_View.Rotate_Incr), [1, 0, 0]);
    mat4.rotate(this.mvMatrix, this.mvMatrix, this.degToRad(this.Current_View.yDeg * this.Current_View.Rotate_Incr), [0, 1, 0]);


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

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.VertexPositionBuffer);
    this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.FacesVertexNormalBuffer);
    this.gl.vertexAttribPointer(this.shaderProgram.vertexNormalAttribute, this.FacesVertexNormalBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.FacesVertexColorBuffer);
    this.gl.vertexAttribPointer(this.shaderProgram.vertexColorAttribute, this.FacesVertexColorBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    if (this.anim == true) {
        if (this.show_faces) {
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.FacesVertexIndexBuffer);
            this.setMatrixUniforms();
            //gl.drawArrays(gl.TRIANGLES, 0, FacesVertexIndexBuffer.numItems);
            this.gl.drawElements(this.gl.TRIANGLES, this.FacesVertexIndexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
        }
    }
    else {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.FacesVertexIndexBuffer);
        this.setMatrixUniforms();
        //gl.drawArrays(gl.TRIANGLES, 0, FacesVertexIndexBuffer.numItems);
        this.gl.drawElements(this.gl.TRIANGLES, this.FacesVertexIndexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
        //alert(FacesVertexIndexBuffer.numItems);

    }
    //gl.bindBuffer(gl.ARRAY_BUFFER, LinesVertexColorBuffer);
    //gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, LinesVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    if (this.anim == true) {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.LinesVertexIndexBuffer);
        this.setMatrixUniforms();
        this.gl.drawElements(this.gl.LINES, this.LinesVertexIndexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
        let a = 0;
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

private resizeCanvas() {
    //let canvas = document.getElementById("worldmap_canvas1");
    this.canv_Width = this._canvas.clientWidth;
    this.canv_Height = this._canvas.clientHeight
    // only change the size of the canvas if the size it's being displayed
    // has changed.
    if (this._canvas.width != this._canvas.clientWidth ||
        this._canvas.height != this._canvas.clientHeight) {
        // Change the size of the canvas to match the size it's being displayed
        this._canvas.width = this._canvas.clientWidth;
        this._canvas.height = this._canvas.clientHeight;
    }

    this.Mid_X = this._canvas.width / 2.0;
    this.Mid_Y = this._canvas.height / 2.0;

    try {
        this.gl.viewportWidth = this._canvas.width;
        this.gl.viewportHeight = this._canvas.height;
        this.drawScene();
    }
    catch (e) { }

}
private show_faces;
private SelectMode;
private anim;

public webGLStop() {
    this.anim = false;
}

private webGLStart(canvas, ANIME) {
    this.initGL(canvas);
    this.anim = ANIME;

    this.elapsed = 0;
    this.show_faces = false;
    this.SelectMode = false;

    this.Load_Current_View();

    //let canvas = document.getElementById("worldmap_canvas1");
    this.resizeCanvas();

    this.initShaders();


    let i, f;
    for (i = 0; i < 10800; i++) {
        this.vertices.push(0);
        this.normals.push(0);
    }

    for (i = 0; i < 14400; i++) {
        this.Tr_colors.push(0);
    }

    if (this.vertices.length == 0) {

        this.init_Surface_Geom();
    }

    for (i = 0; i < 20886; i++) {
        this.Tr_indices.push(0);
    }

    for (i = 0; i < 14160; i++) {
        this.L_indices.push(0);
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

            this.Tr_colors[n_col++] = 0;
            this.Tr_colors[n_col++] = 1;
            this.Tr_colors[n_col++] = 0;
            this.Tr_colors[n_col++] = 0.9;
            if (m < 60) {
                if (f < 60 - 1) {
                    this.Tr_indices[n] = f + (m - 1) * 60;
                    this.L_indices[n_L] = f + (m - 1) * 60;
                    n++;
                    n_L++;
                    this.Tr_indices[n] = (f + 1) + (m - 1) * 60;
                    this.L_indices[n_L] = (f + 1) + (m - 1) * 60;
                    n++;
                    n_L++;
                    this.Tr_indices[n] = f + m * 60;
                    n++;
                    this.Tr_indices[n] = f + m * 60;
                    n++;
                    this.Tr_indices[n] = (f + 1) + (m - 1) * 60;
                    this.L_indices[n_L] = (f + 1) + (m - 1) * 60;
                    n++;
                    n_L++;
                    this.Tr_indices[n] = (f + 1) + m * 60;
                    this.L_indices[n_L] = (f + 1) + m * 60;
                    n++;
                    n_L++;
                }
                else {
                    this.L_indices[n_L] = (m - 1) * 60;
                    n_L++;
                    this.L_indices[n_L] = m * 60;
                    n_L++;
                }
            }
            else {
                if (f < 60 - 1) {
                    this.L_indices[n_L] = (f + 1) + (m - 1) * 60;
                    n_L++;
                    this.L_indices[n_L] = f + (m - 1) * 60;
                    n_L++;
                }
            }
        }
        DDist = DDist + step;
    }

    let max = 0;
    for (i = 0; i < 14160; i++) {
        if (this.L_indices[i] > max) max = this.L_indices[i];
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

    this.Active_Part = "";
    this.Active_Assembly = "";
    this.Selected_Part = "";
    this.Selected_Assembly = "";

    // try {
    //     canvas.addEventListener('DOMMouseScroll', wheel, false);
    // }
    // catch (e) {
    // }
    try {
        canvas.addEventListener("mousewheel", (e) => this.MouseWheelHandler(e), false);
    }
    catch (e) {
    }

    window.onresize = () => this.resizeCanvas();

    canvas.onmousedown = e => this.handleMouseDown(e);
    canvas.onmousemove = e => this.handleMouseMove(e);


    if (ANIME == true) {
        this.tick();
    }
    else {
        this.drawScene();
    }
}

private Load_Current_View() {
    try {
        this.Current_View = {
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