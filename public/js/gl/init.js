window.World = (function(){
	function Cons(){
		this.name = "Cons";
	}
	return Cons;
})()

window.World.setup_scene = function(scene){
	material = new THREE.MeshBasicMaterial({
	   color: 0xff0000,
	   wireframe: true
	});
	
	this.sunDirection = new THREE.Vector3(0,1,0);
	this.sunLightColor = [0.1, 0.7, 0.5];
	
	var ambientLight = new THREE.AmbientLight(0x010101);
	scene.add(ambientLight);

	var light = new THREE.DirectionalLight( 0xFFFFee, 1 );
	light.color.setHSL.apply(light.color, this.sunLightColor);
	light.position = this.sunDirection

	scene.add( light );
	
	
	return scene

	
	
	
}
window.World.initSpace  = function(){

	var path = "/textures/space/m01_cube";
	var format = 'png';
	var urls = [
		path + '.px.' + format, path + '.nx.' + format,
		path + '.py.' + format, path + '.ny.' + format,
		path + '.pz.' + format, path + '.nz.' + format
	];

	var textureCube = THREE.ImageUtils.loadTextureCube( urls );
	var shader = THREE.ShaderLib[ "cube" ];
	shader.uniforms[ "tCube" ].value = textureCube;

	var material = new THREE.ShaderMaterial( {

		fragmentShader: shader.fragmentShader,
		vertexShader: shader.vertexShader,
		uniforms: shader.uniforms,
		depthWrite: false,
		side: THREE.BackSide

	} );
	this._skyboxScene = new THREE.Scene();
	this.skyBox  = new THREE.Mesh( new THREE.CubeGeometry( 9000, 9000, 9000 ), material );
	this.skyBoxCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
	this._skyboxScene.add( this.skyBox );
}
window.World.initSun = function(){
	
	var flareColor = new THREE.Color( 0xffffff );
	var sl = _.clone(this.sunLightColor);
	sl[2] += 0.5
	flareColor.setHSL.apply(flareColor, sl);
	
	var textureFlare0 = THREE.ImageUtils.loadTexture( "/textures/lensflare/lensflare0.png" );
	var textureFlare2 = THREE.ImageUtils.loadTexture( "/textures/lensflare/lensflare2.png" );
	var textureFlare3 = THREE.ImageUtils.loadTexture( "/textures/lensflare/lensflare3.png" );
	
	var lensFlare = new THREE.LensFlare( textureFlare0, 700, 0.0, THREE.AdditiveBlending, flareColor );

	lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
	lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
	lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );

	lensFlare.add( textureFlare3, 60, 0.6, THREE.AdditiveBlending );
	lensFlare.add( textureFlare3, 70, 0.7, THREE.AdditiveBlending );
	lensFlare.add( textureFlare3, 120, 0.9, THREE.AdditiveBlending );
	lensFlare.add( textureFlare3, 70, 1.0, THREE.AdditiveBlending );
	var lensFlareUpdateCallback = function ( object ) {

		var f, fl = object.lensFlares.length;
		var flare;
		var vecX = -object.positionScreen.x * 2;
		var vecY = -object.positionScreen.y * 2;


		for( f = 0; f < fl; f++ ) {

			   flare = object.lensFlares[ f ];

			   flare.x = object.positionScreen.x + vecX * flare.distance;
			   flare.y = object.positionScreen.y + vecY * flare.distance;

			   flare.rotation = 0;

		}

		object.lensFlares[ 2 ].y += 0.025;
		object.lensFlares[ 3 ].rotation = object.positionScreen.x * 0.5 + THREE.Math.degToRad( 45 );

	}
	lensFlare.customUpdateCallback = lensFlareUpdateCallback;
	lensFlare.position = this.sunDirection.multiplyScalar(200)
	
	
	// this.sunBillboard = new THREE.Sprite(textureFlare0 )
	this.three_scene.add(lensFlare)
	this.sunLensFlare = lensFlare;
}
window.World.redrawSun = function(){
	var C = this.scene.mesh_for(this.login);
	this.sunLensFlare.position = C.position.clone().add(this.sunDirection)
}
window.World.redrawSky = function(){
	var C = this.scene.mesh_for(this.login);
	// r= C.rotation
	this.skyBoxCamera.rotation.copy( C.rotation );

	this.renderer.render( this._skyboxScene, this.skyBoxCamera );
	// renderer.render( scene, camera );
	// console.log(this.skyBox.position)
	
}
window.World.init = function(auth_hash, client_login){
	this.__vpx = 0;
	this.auth_hash = auth_hash;
	this.login = client_login;
	this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
	// this.camera.position.z = 250;
	this.p = new THREE.Projector();
	this.three_scene = new THREE.Scene();
	this.clock = new THREE.Clock();
	//this.geometry = new THREE.CubeGeometry(200, 200, 200);
	//this.cg = new THREE.SphereGeometry(2);
	this.vp_width = document.body.clientWidth;
	this.vp_height = 500;//document.body.clientHeight;
	var self = this;
	
	//******
	this.setup_scene(this.three_scene);
	this.initSun();
	this.initSpace();
	
    
	this.renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
	this.renderer.setSize(this.vp_width, this.vp_height);
	this.renderer.setClearColor(new THREE.Color(0x000000));
	document.body.appendChild(this.renderer.domElement);
	
	this.renderer.gammaInput = true;
	this.renderer.gammaOutput = true;
	this.renderer.autoClear = false;
	this.renderer.physicallyBasedShading = true;
	
	this._camera_rot_q = new THREE.Quaternion();
	
	
	
	document.addEventListener( 'mousemove', function(e){
		self.mouse_x = e.x;
		self.mouse_y = e.y;
	}, false );
	document.addEventListener('mousedown', function(e){
		// console.log(e)
		self.Inputs.input( 'lmouse', true)
		
		// var action = self.actions['lmouse']
		
		//ControllersActionMap[action.type].act(self, action, true)
		// Controller(self, action, true);
	})
	document.addEventListener('keydown', function(e){
		var code = e.keyCode;
		self.Inputs.input( code, true)
		
		//if(code in self.actions){
		//	var action = self.actions[code]
		//	ControllersActionMap[action.type].act(self, action, true)
		//}else{
			//}
		
	}, false)
	document.addEventListener('keyup', function(e){
		var code = e.keyCode;
		self.Inputs.input(code, false)
		//if(code in self.actions){
		//	var action = self.actions[code]
		//	ControllersActionMap[action.type].act(self, action, false)
		//}else{
			//}
		
	}, false)
	self.init_socket()
	return self;
	
}
window.World.init_socket = function(){
	// console.log("init socket");
	var origin = window.location.origin
	//console.log("What if I try to do it twice");
	var socket = io.connect(origin);
	this.socket = socket;
	var self = this;
	this.socket.on('connected', function(d){
		//console.log(">>")
		
		self.socket.emit("auth_hash", {auth:self.auth_hash})
		
		self.Inputs = new Controller.LocalInputActor(self, self.socket)
		
		
	})
	this.socket.on('server_fault', function(){
		window.location = "/console/"
	})
	this.socket.on('scene', function(data){
		//console.log(data);
		var onload = function(){
			// console.log('loaded');
			var onAct = function(){
				console.log('act on client')
			}
			self.network_actor = new Controller.NetworkActor(self.scene, socket, onAct)
			
			self.go();
		}
		self.load_scene(data , onload)
		
	})
	this.socket.on('join_actor', function(data){
		//console.log('joining actor', data);
		//console.log(self.actors)
		if (data.login in self.scene.actors){
			//console.log("actor already exist, first comer?")
		}else{
			self.scene.actors[data.login] = data;
		}
	})
	this.socket.on('scene_sync', function(al){
		
		self.scene.sync(al);
	})

	
}
window.World.set_actions = function(){
	self.actions = self._default_actions
}

window.World.load_scene = function (scene, onload){
	this.scene = Scene.create()
	this.scene.set_from_json(scene)
	
	this.scene.load(onload, this.three_scene)
	console.log(scene);
	
		//var json = JSON.parse(this.responseText)
		/*
	var self = this;
	self.meshes = {};
	self.loader =  new THREE.JSONLoader();
	self.total_objects_count = 0;
	self.onload = onload;
	
	function put_on(type, name){
		var es = this["on_engines_" + type]
		// console.log(es)
		if ( es.indexOf(name) === -1){
			es.push(name)	
		}
		// console.log(es)
	}
	function put_off(type, name){
		var es = this["on_engines_" + type]
		var ix = es.indexOf(name)
		if (  ix !== -1 ){
			es.splice(ix, 1);
		}
	}
	return (function(scene){
		self.loaded_objects_count = 0;
	
		self.actors = scene.actors;
		
		// self.automatic actors - run in loops
		self.automatic_actors = [];
		// console.log(self.actors)
	
		_.each(scene.objects, function(object, ix){
		
			self.total_objects_count +=1;
			self.loader.load( object.model_3d, function(geom, mat){
				//console.log('loaded from net')
				var material = new THREE.MeshFaceMaterial( mat );
			
				var m = new THREE.Matrix4()
				m.identity()
			
				var mesh = new THREE.Mesh( geom, material );
				var object_rotated = false
				if ( object.physical ){
					for(i in object.physical){
						//console.log('to' ,i, object.physical[i] , 'to' in  object.physical[i])
						var _is = 'to' in object.physical[i]
						if (!_is){
							var v = new THREE.Vector3()
							v.set.apply(v, object.physical[i])
							mesh[i] = v
							
						}else{
							//console.log("ph",i, object.physical[i])
							var p = new THREE.Vector3(object.physical[i].to[0], object.physical[i].to[1], object.physical[i].to[2])
							// var dir = mesh.pos.clone().sub(p);
							//console.log("what if we now apply")
							// p.reflect()
							mesh.lookAt(p.negate())
							object_rotated = true;
						}

					}
				}else{
					var pi2 = Math.PI * 2;
					mesh.pos = new THREE.Vector3(Math.random() * 200, Math.random() * 200, Math.random() * 200);
					mesh.rot = new THREE.Vector3(Math.random() * pi2, Math.random() * pi2, Math.random() * pi2);
					mesh.avel = new THREE.Vector3(0,0,0)
					mesh.aacc = new THREE.Vector3(0,0,0)
					mesh.vel = new THREE.Vector3(0,0,0)
					mesh.acc = new THREE.Vector3(0,0,0)
					
				}
				mesh.position = mesh.pos;
				if (! object_rotated){
					
					var uel = new THREE.Euler(mesh.rot.x, mesh.rot.y, mesh.rot.z);
					mesh.rotation = uel;
				}
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
			
				//console.log('model loaded');
				if(self.total_objects_count == self.loaded_objects_count){
					self.onload()
				}
			});
		})
	})(scene)
	*/
}
window.World.get_current_actor = function(){
	var self = this;
	return self.scene.actors[self.login]
}
window.World.meshes = function(){
	return this.scene.meshes
}
window.World.bindCamera = function(){
	
	var self = this;
	// console.log(self.actors);
	var actor 		 = self.get_current_actor();
	//console.log(actor.control);
	var controllable = self.meshes()[ actor.control.object_guid ];
	controllable.add( self.camera )
	self.setCamera();
	
}
function rad2deg(r){
	return r * 360/Math.PI
}
window.World.setCamera = function(){
	
	var self = this;
	var actor = self.get_current_actor()
	
	// console.log("SET CAMERA");
	var controllable = self.controllable()
	var vp        	 = actor.control.viewport;
	var vp_pos    	 = new THREE.Vector3();
	var vp_rot  	 = new THREE.Vector3()
	
	vp_pos.set.apply(vp_pos, controllable.cameras[vp].position)
	vp_rot.set.apply(vp_rot, controllable.cameras[vp].direction)
	
	var cam_base = new THREE.Vector3(0,0,-1);
	var axis = new THREE.Vector3()
	axis.crossVectors(cam_base, vp_rot)
	var ag = Math.acos(cam_base.dot(vp_rot)/ cam_base.length() / vp_rot.length())
	 //console.log(axis.length() === 0 && cam_base.equals( vp_rot ) )
	if(axis.length() === 0 && !cam_base.equals( vp_rot ) ){
		axis = new THREE.Vector3(0,1,0)
		ag = Math.PI;
		
	}
	//console.log(axis,ag, vp_rot);
	//console.log(vp_rot)
	self.camera.rotateOnAxis(axis, ag)
	//self.camera.rotateY(vp_rot.y)
	// self.camera.rotateZ(vp_rot.z)
	
	self.camera.position = vp_pos; // controllable.position.clone().add(vp_pos)
	
}
window.World.controllable = function(){
	
	 return this.mesh_for(this.login);
}
window.World.mesh_for = function(actor){
	//console.log(">>>",this.meshes()[this.scene.actors[actor].control.object_guid]);
	return this.meshes()[this.scene.actors[actor].control.object_guid]
}
window.World.go = function(){
	var self = this;
	var last_timestamp = false;
	var first_loop = true;
	var time_inc = 0
	self.mouse_projection_vec = new THREE.Vector3();
	//var _3d_scene = self.setup_scene(self.scene._3scene)
	var _d = false
	
	var updatePositions = function(){
		self.scene.tick()
		self.redrawSun();
		self.redrawSky();
		
			
		
		self.mouse_projection_vec.set( ( self.mouse_x/ self.vp_width ) * 2 - 1, - ( self.mouse_y / self.vp_height ) * 2 + 1, 0.999 );
		
	    self.p.unprojectVector( self.mouse_projection_vec, self.camera );
	    //self.cur.position.copy( self.mouse_projection_vec );
		
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

			//console.log(_3d_scene, self.camera)
		    self.renderer.render(self.three_scene, self.camera);
		}
		requestAnimationFrame(animate)
    	
    }
	
    requestAnimationFrame(animate);
	
}
