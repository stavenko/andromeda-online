function A(){
	

	var C = $('.master canvas')
	var off = C.offset();
	console.log(off);
	var self = this;
	var canvas_height = C.height()
	var canvas_width = C.width()
	C.on('mousemove', function(evt){
		
		var winx = evt.pageX-off.left
		var winy = evt.pageY-off.top
		
		var v = self.unproject(winx, canvas_height - winy, null)
		self.mouse_vec_near = v[0];
		self.mouse_vec_far = v[1];
		self.mouse_vec = self.mouse_vec_far//vec3.sub(vec3.create(),v[0],v[1])
		
		// console.log("mouse", self.mouse_vec)
	})
	var canvas = C[0];

    this.initGL = function (canvas) {
        try {
            this.gl = canvas.getContext("experimental-webgl");
            this.gl.viewportWidth = canvas.width;
            this.gl.viewportHeight = canvas.height;
			
        } catch (e) {
        }
        if (!this.gl) {
            alert("Could not initialise WebGL, sorry :-(");
        }
    }

    function basic_vertex_shader(gl) {
		var str = "attribute vec3 aVertexPosition;"+
					"uniform mat4 uMVMatrix;"+
					"uniform mat4 uPMatrix;"+
					"void main(void) {"+
					"gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);"+
				"}"
			
        var shader;
        shader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
	}
	

    function basic_fragment_shader(gl) {
		var str = "precision mediump float;" +
				"void main(void) {"+
				"gl_FragColor = vec4(1.0, 0.5, 1.0, 1.0);"+
				"}"
        var shader;
        shader = gl.createShader(gl.FRAGMENT_SHADER);

        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }


    var shaderProgram;

    this.initShaders=function() {
        var fragmentShader = basic_fragment_shader(this.gl);
        var vertexShader = basic_vertex_shader(this.gl);

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

        this.shaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");
        this.shaderProgram.mvMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
    }


    this.mvMatrix = mat4.create();
	mat4.identity(this.mvMatrix)
    this.pMatrix = mat4.create();

	this.setMatrixUniforms=function (mvMatrix) {
		this.gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix);
		this.gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, mvMatrix);
	}



    var triangleVertexPositionBuffer;
    var squareVertexPositionBuffer;

	this.initScene = function(){
		this.scene = {}
		var objects = []
		this.cur = new Cur({}, this);
		this.cur.init();
		for(var i =0; i< 1; i++){
			var obj_json = { pos:[2*(0.5-Math.random()),2*(0.5-Math.random()),-7],
				 			 model: "/models/StarCruiser.js" }
			var obj = new GObject(obj_json, this)
			obj.init();
			objects.push(obj);
			
		}
		// console.log(objects)
		this.scene.objects = objects;
	}
	this.drawObject = function(obj){
		var object_base = mat4.create()
		mat4.translate(object_base, this.mvMatrix, vec3.fromValues.apply(null,obj.pos))
		obj.draw( object_base )
		
	}
	this.takeLookAway=function(){
		mat4.translate(this.mvMatrix, this.mvMatrix, vec3.fromValues.apply(null,[0,0,-10]))
	
	}
    this.drawScene = function () {
		var gl = this.gl;
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(this.pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
		
		//mat4.rotateY(this.pMatrix,this.pMatrix, -1.5);
		// mat4.frustum(this.pMatrix,0,gl.viewportWidth,gl.viewportHeight, 0, 0.1, 100)
		// mat4.lookAt(this.pMatrix, vec3.fromValues(-10,-10,0), vec3.fromValues(0,0,0), vec3.fromValues(0,1,0))
		
		this.pMatrix.width = gl.viewportWidth;
		this.pMatrix.height = gl.viewportHeight;
		
		for (var i = 0 ; i < this.scene.objects.length; i++){
			this.drawObject( this.scene.objects[i] )
		}
		
		// TODO: Добавить хрень, которая будет рисоваться под курсором.
		this.cur.pos = this.mouse_vec;
		this.drawObject(this.cur);

			
    }
	this.unproject = function(winx, winy, winz, mv){
		if (typeof(winz) == "number") {
			winx = parseFloat(winx);
			winy = parseFloat(winy);
			winz = parseFloat(winz);

			var inf = [];

			// var mm = this.getTransformationMatrix();

			var mm = mat4.clone(this.mvMatrix)
			var pm = mat4.clone(this.pMatrix)
			var viewport = [0, 0, this.pMatrix.width, this.pMatrix.height];
			

			//Calculation for inverting a matrix, compute projection x modelview; then compute the inverse
			//var m = mat4.create();
			//var m = mat4.copy(m, mm);
			var mpv = mat4.create();
			mat4.invert(mm,mm)
			mat4.multiply(mpv,pm, mm)
			
			mat4.invert(mpv,mpv)

			//mat4.inverse(m, m); // WHY do I have to do this? --see Jax.Context#reloadMatrices
			//mat4.multiply(pm, m, m);
			//mat4.inverse(m, m);

			
			// Transformation of normalized coordinates between -1 and 1
			inf[0]=(winx-viewport[0])/viewport[2]*2.0-1.0;
			inf[1]=(winy-viewport[1])/viewport[3]*2.0-1.0;
			inf[2]=2.0*winz-1.0;
			inf[3]=1.0;
			//console.log( "inf",inf)
			
			//Objects coordinates
			var out = vec4.create();
			mat4.multiplyVec4(mpv, inf, out);
			if(out[3]==0.0) return null;
			out[3]=1.0/out[3];
			var fout = [out[0]*out[3], out[1]*out[3], out[2]*out[3]];
			return fout;
		}
		else
			return [this.unproject(winx, winy, 0), this.unproject(winx, winy, 1)];
		
	}

	this.updateScene = function(){
		// Здесь будет происходить магия перерисовки
	}

	this.go = function(){
	    this.initGL(canvas);
		this.initScene();
		this.initShaders();
	    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
	    this.gl.enable(this.gl.DEPTH_TEST);
		var _this = this;
		var draw_loop = function(){
			requestAnimationFrame(draw_loop)
			_this.updateScene()
			_this.drawScene()
		}
	    draw_loop();
		
		
	}


	return this;
}