window.A = (function(){
	function Cons(){
		this.name = "Cons";
	}
	return Cons;
})()


window.A.init = function(){
	this.__vpx = 0;
	this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
	this.camera.position.z = 250;
	this.p = new THREE.Projector();
	this.scene = new THREE.Scene();
	this.clock = new THREE.Clock();
	//this.geometry = new THREE.CubeGeometry(200, 200, 200);
	this.cg = new THREE.SphereGeometry(2);
	this.vp_width = document.body.clientWidth;
	this.vp_height = 500;//document.body.clientHeight;
	material = new THREE.MeshBasicMaterial({
	   color: 0xff0000,
	   wireframe: true
	});
	var self = this;
	
	//******
	
	var ambientLight = new THREE.AmbientLight(0xFFFFFF);
	this.scene.add(ambientLight);

	var light = new THREE.PointLight( 0xFFFFFF );
	light.position.set( -20, 20, 20 );
	this.scene.add( light );

	this.load_scene();
	
	this.cur = new THREE.Mesh(this.cg, material);
	this.scene.add(this.cur);
	
    
	this.renderer = new THREE.WebGLRenderer();
	this.renderer.setSize(this.vp_width, this.vp_height);

	this._camera_rot_q = new THREE.Quaternion();
	
	self.actions={
		65: {type:'rotate', axis:'y',dir:'+'},
		68: {type:'rotate', axis:'y',dir:'-'},
		
		87: {type:'rotate', axis:'x',dir:'-'},
		83: {type:'rotate', axis:'x',dir:'+'},
		
		90: {type:'rotate', axis:'z',dir:'+'},
		67: {type:'rotate', axis:'z',dir:'-'},
		
		79: {type:'rotatec', axis:'x',dir:'+'},
		80: {type:'rotatec', axis:'x',dir:'-'},
		
		73: {type:'rotatec', axis:'y',dir:'+'},
		75: {type:'rotatec', axis:'y',dir:'-'},
		
		38: {type:'move', axis:'z',dir:'-'},
		40: {type:'move', axis:'z',dir:'+'},
		
		'lmouse':{'type': 'shoot_primary'},
		
		
		
	}
	
	
	document.body.appendChild(this.renderer.domElement);
	document.addEventListener( 'mousemove', function(e){
		self.mouse_x = e.x;
		self.mouse_y = e.y;
	}, false );
	document.addEventListener('mousedown', function(e){
		// console.log(e)
		var action = self.actions['lmouse']
		
		ControllersActionMap[action.type].act(self, action, true)
		// Controller(self, action, true);
	})
	document.addEventListener('keydown', function(e){
		var code = e.keyCode;
		if(code in self.actions){
			var action = self.actions[code]
			//console.log(ControllersActionMap[action.type].act);
			
			ControllersActionMap[action.type].act(self, action, true)
			//Controller(self, action, true);
			//console.log(code, action)
			
		}else{
			console.log('uknown', code);
		}
		
	}, false)
	document.addEventListener('keyup', function(e){
		var code = e.keyCode;
		if(code in self.actions){
			var action = self.actions[code]
			ControllersActionMap[action.type].act(self, action, false)
			//console.log(code, action)
			
		}else{
			console.log('unknown', code);
		}
		
	}, false)
	
    //var socket = io.connect('http://localhost:3002');
	
    //socket.on('resp', function (data) {
    //  console.log(data);
    //  socket.emit('data', { my: 'data' });
    //});
	
	
}
window.A.load_scene =function(){
	var self = this;
	self.meshes = []
	var loader =  new THREE.JSONLoader();
	self.total_objects_count = 0;
	
	function put_on(type, name){
		var es = this["on_engines_" + type]
		console.log(es)
		if ( es.indexOf(name) === -1){
			es.push(name)	
		}
		console.log(es)
	}
	function put_off(type, name){
		var es = this["on_engines_" + type]
		var ix = es.indexOf(name)
		if (  ix !== -1 ){
			es.splice(ix, 1);
		}
	}
	function makeTextSprite( message, parameters )
	{
		if ( parameters === undefined ) parameters = {};
	
		var fontface = parameters.hasOwnProperty("fontface") ? 
			parameters["fontface"] : "Arial";
	
		var fontsize = parameters.hasOwnProperty("fontsize") ? 
			parameters["fontsize"] : 18;
	
		var borderThickness = parameters.hasOwnProperty("borderThickness") ? 
			parameters["borderThickness"] : 4;
	
		var borderColor = parameters.hasOwnProperty("borderColor") ?
			parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
	
		var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
			parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

		//var spriteAlignment = THREE.SpriteAlignment.topLeft;
		
		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
		context.font = "Bold " + fontsize + "px " + fontface;
    
		// get size data (height depends only on font size)
		var metrics = context.measureText( message );
		var textWidth = metrics.width;
	
		// background color
		context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
									  + backgroundColor.b + "," + backgroundColor.a + ")";
		// border color
		context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
									  + borderColor.b + "," + borderColor.a + ")";

		context.lineWidth = borderThickness;
		roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
		// 1.4 is extra height factor for text below baseline: g,j,p,q.
	
		// text color
		context.fillStyle = "rgba(0, 0, 0, 1.0)";

		context.fillText( message, borderThickness, fontsize + borderThickness);
	
		// canvas contents will be used for a texture
		var texture = new THREE.Texture(canvas) 
		texture.needsUpdate = true;

		var spriteMaterial = new THREE.SpriteMaterial( 
			{ map: texture, useScreenCoordinates: false } );
		var sprite = new THREE.Sprite( spriteMaterial );
		sprite.scale.set(20,20,1.0);
		return sprite;	
	}
	function roundRect(ctx, x, y, w, h, r) 
	{
	    ctx.beginPath();
	    ctx.moveTo(x+r, y);
	    ctx.lineTo(x+w-r, y);
	    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
	    ctx.lineTo(x+w, y+h-r);
	    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
	    ctx.lineTo(x+r, y+h);
	    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
	    ctx.lineTo(x, y+r);
	    ctx.quadraticCurveTo(x, y, x+r, y);
	    ctx.closePath();
	    ctx.fill();
		ctx.stroke();   
	}
	xhr = new XMLHttpRequest()
	xhr.onload = function(){
		console.log('fff')
		var json = JSON.parse(this.responseText)
		return (function(json){
			self.loaded_objects_count = 0;
			
			self.actors = json.actors;
			
			_.each(json.objects, function(object, ix){
				
				self.total_objects_count +=1;
				loader.load( object.model, function(geom, mat){
					//console.log('loaded from net')
					var material = new THREE.MeshFaceMaterial( mat );
					
					var m = new THREE.Matrix4()
					m.identity()
					
					var mesh = new THREE.Mesh( geom, material );
					
					for(i in object.physical){
						var v = new THREE.Vector3()
						v.set.apply(v, object.physical[i])
						mesh[i] = v
					}
					mesh.position = mesh.pos;
					mesh.cameras = object.cameras;
					mesh.engines = object.engines;
					mesh.has_engines =true;
					mesh.on_engines_rotation = [];
					mesh.on_engines_propulsion = [];
					mesh.put_off = put_off
					mesh.put_on  = put_on
					mesh.mass = object.mass;
					var label = makeTextSprite("mesh: " + ix);
					label.position = new THREE.Vector3(0,0,0);
					mesh.add(label);
					self.scene.add( mesh );
					self.meshes[ix] = mesh;
					self.loaded_objects_count +=1;
					console.log('model loaded');
				});
			})
		})(json)
		
	}
	console.log(xhr);
	xhr.open("get", "/scenes/first/", true);
	xhr.send();
	console.log('H');
}
window.A.bindCamera = function(){
	
	var self = this;
	var actor 		 = self.actors['__'];
	var controllable = self.meshes[ actor.control.oid ];
	controllable.add( self.camera )
	self.setCamera();
	
}
function rad2deg(r){
	return r * 360/Math.PI
}
window.A.setCamera = function(){
	
	var self = this;
	var actor = self.actors['__']
	
	// console.log("SET CAMERA");
	var controllable = self.meshes[actor.control.oid];
	var vp        	 = actor.control.vp;
	var vp_pos    	 = new THREE.Vector3();
	var vp_rot  	 = new THREE.Vector3()
	
	vp_pos.set.apply(vp_pos, controllable.cameras[vp].position)
	vp_rot.set.apply(vp_rot, controllable.cameras[vp].direction)
	
	var cam_base = new THREE.Vector3(0,0,-1);
	var axis = new THREE.Vector3()
	axis.crossVectors(cam_base, vp_rot)
	var ag = Math.acos(cam_base.dot(vp_rot)/ cam_base.length() / vp_rot.length())
	 console.log(axis.length() === 0 && cam_base.equals( vp_rot ) )
	if(axis.length() === 0 && !cam_base.equals( vp_rot ) ){
		axis = new THREE.Vector3(0,1,0)
		ag = Math.PI;
		
	}
	console.log(axis,ag, vp_rot);
	//console.log(vp_rot)
	self.camera.rotateOnAxis(axis, ag)
	//self.camera.rotateY(vp_rot.y)
	// self.camera.rotateZ(vp_rot.z)
	
	self.camera.position = vp_pos; // controllable.position.clone().add(vp_pos)
	
}
window.A.go = function(){
	var self = this;
	var last_timestamp = false;
	var first_loop = true;
	self.mouse_projection_vec = new THREE.Vector3();
	
	var updatePositions = function(){
		var time_left = self.clock.getDelta();
		
		var actor = self.actors['__'];
		var C = self.meshes[actor.control.oid]
		
		for(var i in self.actors){
			if (i !== '__')
			{ 
				self.actors[i].run( time_left )
			}
		}
		
		for (var i = 0; i< self.meshes.length; i++){
			var mesh = self.meshes[i];
			if(mesh.has_engines){
				total_acc = new THREE.Vector3(0,0,0);
				
				for (var j = 0; j < mesh.on_engines_propulsion.length; j++){
				
					var engine = mesh.on_engines_propulsion[i]
					var axis = engine[0] == 'x'?new THREE.Vector3(1,0,0):(engine[0] =='y'?new THREE.Vector3(0, 1, 0): new THREE.Vector3(0,0,1))
					var dir  = engine[1] == '+'?1:-1
					var acc = mesh.engines.propulsion[engine] / mesh.mass
					axis.multiplyScalar(acc).multiplyScalar(dir).applyQuaternion(mesh.quaternion);
					total_acc.add(axis)
				}
				mesh.vel = total_acc.clone().multiplyScalar(time_left).add(mesh.vel) 
				mesh.pos = total_acc.clone().multiplyScalar(time_left * time_left)
						       .add(mesh.vel.clone().multiplyScalar(time_left))
							   .add(mesh.pos);
					   
				var total_aacc = new THREE.Vector3(0,0,0)
				for(var j =0; j < mesh.on_engines_rotation.length; j++){
					// console.log("WTF");
					var engine = mesh.on_engines_rotation[i]
					var axis = engine[0] == 'x'?new THREE.Vector3(1,0,0):(engine[0] =='y'?new THREE.Vector3(0, 1, 0): new THREE.Vector3(0,0,1))
					var dir  = engine[1] == '+'?1:-1
					var aacc = mesh.engines.rotation[engine] / mesh.mass
					axis.multiplyScalar(aacc).multiplyScalar(dir)
					total_aacc.add(axis)
				}
				mesh.avel = total_aacc.clone().multiplyScalar(time_left).add(mesh.avel)
				mesh.rot  = total_aacc.clone().multiplyScalar(time_left * time_left)
						       .add(mesh.avel.clone().multiplyScalar(time_left))
				mesh.rotateX(mesh.rot.x)
				mesh.rotateY(mesh.rot.y)
				mesh.rotateZ(mesh.rot.z);
			
			}else{
				// console.log(mesh.pos);
				mesh.pos =mesh.vel.clone().multiplyScalar(time_left).add(mesh.pos);
				
				
			}
			mesh.position = mesh.pos;
		}
			
		
		self.mouse_projection_vec.set( ( self.mouse_x/ self.vp_width ) * 2 - 1, - ( self.mouse_y / self.vp_height ) * 2 + 1, 0.999 );
		
	    self.p.unprojectVector( self.mouse_projection_vec, self.camera );
	    self.cur.position.copy( self.mouse_projection_vec );
		
	}
	
    var animate = function(){
		if (self.total_objects_count === self.loaded_objects_count){
			if(first_loop){
				// console.log('GO on');
				first_loop = !first_loop;
				self.bindCamera();
				//console.log("POS",  self.camera.matrixWorldNeedsUpdate);
				
				for( i=0; i<self.meshes.length; i++){
					//console.log(self.meshes[i].cameras['main'].position);
				}
			}
			
			updatePositions();

			
		    self.renderer.render(self.scene, self.camera);
		}
		requestAnimationFrame(animate)
    	
    }
	
    requestAnimationFrame(animate);
	
}
