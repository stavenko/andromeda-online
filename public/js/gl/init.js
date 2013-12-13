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
	console.log(scene._scene)
	
	var sunDirection = new THREE.Vector3().fromArray(scene._scene.sunDirection) ;
	//this.sunLightColor = [0.1, 0.7, 0.5];
	
	var ambientLight = new THREE.AmbientLight(0x010101);
	this.three_scenes[scene.GUID].add(ambientLight);

	var light = new THREE.DirectionalLight( 0xFFFFee, 1 );
	console.log("COLOR",scene._scene.sunLightColor);
	light.color.setHSL.apply(light.color, scene._scene.sunLightColor);
	light.position = sunDirection

	this.three_scenes[scene.GUID].add( light );
	this.initSun(scene)
}

window.World.initSun = function(scene){
	
	var flareColor = new THREE.Color( 0xffffff );
	var sl = _.clone(scene._scene.sunLightColor);
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
	lensFlare.position = new THREE.Vector3().fromArray(scene._scene.sunDirection).multiplyScalar(200)
	
	
	// this.sunBillboard = new THREE.Sprite(textureFlare0 )
	this.three_scenes[scene.GUID].add(lensFlare)
	this.flares[scene.GUID] = lensFlare;
}
window.World.redrawSun = function(vp){
	var m = this.scenes[vp.scene].meshes[vp.object]
	//console.log(m);
	var sd = new THREE.Vector3().fromArray(this.scenes[vp.scene]._scene.sunDirection)
	this.flares[vp.scene].position = m.position.clone().add(sd)
	//var C = this.scenes[scene.GUID].mesh_for();
	//this.flares[scene.GUID].position = C.position.clone().add(this.sunDirection)
}
window.World.initSpace  = function(vp){

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
	this.skyboxScenes[vp.scene] = new THREE.Scene();
	var m = new THREE.Mesh( new THREE.CubeGeometry( 9000, 9000, 9000 ), material );
	this.skyBoxes[vp.scene]   = m
	
	this.skyBoxCamera[vp.scene] = new THREE.PerspectiveCamera(45, vp.geom.w / vp.geom.h, 1, 10000);
	this.skyboxScenes[vp.scene].add(m);
}
window.World.redrawSky = function(vp){
	var m = this.scenes[vp.scene].meshes[vp.object]
	
	//// var C = this.scene.mesh_for(this.login);
	// var r= m.rotation
	this.skyBoxCamera[vp.scene].rotation.copy( m.rotation );

	this.renderer.setViewport(vp.geom.l, vp.geom.t, vp.geom.w, vp.geom.h);
	this.renderer.render( this.skyboxScenes[vp.scene], this.skyBoxCamera[vp.scene] );
	// renderer.render( scene, camera );
	// console.log(this.skyBox.position)
	
}
window.World.init = function(auth_hash, client_login){
	this.__vpx = 0;
	this.auth_hash = auth_hash;
	this.login = client_login;
	
	// this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
	// this.camera.position.z = 250;
	this.p = new THREE.Projector();
	this.three_scenes = {}
	this.flares = {}
	//  = new THREE.Scene();
	this.clock = new THREE.Clock();
	//this.geometry = new THREE.CubeGeometry(200, 200, 200);
	//this.cg = new THREE.SphereGeometry(2);
	this.vp_width = document.body.clientWidth;
	this.vp_height = 500;//document.body.clientHeight;
	
	this.skyboxScenes = {};
	this.skyBoxes = {}; //[scene.guid]  = new THREE.Mesh( new THREE.CubeGeometry( 9000, 9000, 9000 ), material );
	this.skyBoxCamera = {};//[scene.guid]
	
	
	var self = this;
	
	//******
	//this.setup_scene(this.three_scene);
	//this.initSun();
	//this.initSpace();
	
    
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
		//self.Inputs.input( 'lmouse', true)
		
		// var action = self.actions['lmouse']
		
		//ControllersActionMap[action.type].act(self, action, true)
		// Controller(self, action, true);
	})
	document.addEventListener('keydown', function(e){
		var code = e.keyCode;
		//self.Inputs.input( code, true)
		
		//if(code in self.actions){
		//	var action = self.actions[code]
		//	ControllersActionMap[action.type].act(self, action, true)
		//}else{
			//}
		
	}, false)
	document.addEventListener('keyup', function(e){
		var code = e.keyCode;
		//self.Inputs.input(code, false)
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
		
		// self.Inputs = new Controller.LocalInputActor(self, self.socket)
		
		
	})
	this.socket.on('server_fault', function(){
		window.location = "/console/"
		// console.log("AAA");
	})
	this.socket.on('actors', function(actors){
		// Здесь мы получаем всех акторов, которые присущи для этого логина - их может оказаться несколько и для них могут быть разные сцены
		
		self.actors = actors // Здесь список всех акторов, которые так или иначе связаны с нашим логином
		
		var scenes = _.map(self.actors, function(actor){
			return actor.scene
			
		})
		// Запрашиваем загрузку всех сцен для этого актора - по идентификаторам сцен
		
		//console.log("Req scenes", _.uniq(scenes))
		self.socket.emit("request_scenes", {scenes:_.uniq(scenes)})
		
		// console.log("Recv Actors",actors)
		// self._player_viewports = data.length;
		// self.go() // после загрузки акторов попробуем запустить эмуляцию
	})
	
	this.socket.on('scenes', function(data){
		//console.log(data);
		var guids = _.keys(data)
		var _totals = 0
		var all_loaded = function(){
			self.go();	
			// self.network_actor = new Controller.NetworkActor(socket, function(){})
		}
		var onload = function(scene){
			// console.log('loaded');
			var onAct = function(){
				console.log('act on client')
			}
			_totals +=1
			self.setup_scene(scene);
			console.log("WAT",_totals, guids.length)
			if(_totals == guids.length){
				all_loaded()
			}
			// 
			// 
		}
		_.each(data, function(scene, guid){
			console.log('well', onload);
			self.load_scene(scene._scene , onload)
			//console.log('well', scene._scene);
			
		})
		
	})
	this.socket.on('join_actor', function(data){
		// console.log('joining actor', data);
		// console.log(self.actors)
		// Актор может джойнить уже существующий в сцене - надо переделывать вьюпорты
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

window.World.load_scene = function (scene_js, onload){
	// console.log('well-well', scene._scene);
	
	this.scenes = {}
	
	var scene = new Scene()
	
	scene.set_from_json(scene_js)
	
	
	this.scenes[scene.GUID] = scene;
	this.three_scenes[scene.GUID] = new THREE.Scene();
	// console.log("WWW", onload);
	scene.load(onload, this.three_scenes[scene.GUID] )
	
	// 
	//console.log("loading this scene", scene.GUID);

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
window.World.makeCamera = function(vp ){
	var self = this;
	//var actor = self.get_current_actor()
	
	// console.log("SET CAMERA");
	// var controllable = self.controllable()
	// var wp  		 = actor.control.workpoints
	// var vp        	 = actor.control.viewport;
	
	var scene = vp.scene
	var object_id = vp.object
	var port = vp.camera
	var mesh = self.scenes[scene].meshes[object_id]
	var object = self.scenes[scene].get_objects()[object_id]
	
	var camera = new THREE.PerspectiveCamera(45, vp.geom.w / vp.geom.h, 1, 10000);
	
	var vp_pos    	 = new THREE.Vector3();
	var vp_rot  	 = new THREE.Vector3();
	console.log(object, camera);
	vp_pos.set.apply(vp_pos, object.cameras[port].position)
	vp_rot.set.apply(vp_rot, object.cameras[port].direction)
	
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
	camera.rotateOnAxis(axis, ag)
	
	camera.position = vp_pos; // controllable.position.clone().add(vp_pos)
	mesh.add(camera)
	return camera
	
	
}
window.World.setupCameras = function(){
	var self = this;
	// Сначала составим список уникальных вьюпортов - сцена-объект-камера
	self._viewports = {}
	self._viewport_amount = 0;
	
	_.each(self.actors, function(actor){
		//console.log(actor)
		var wp = actor.control.workpoint;
		
		var views = self.scenes[actor.scene].get_objects()[actor.control.object_guid].workpoints[wp].views
		
		_.each(views, function(view){
			var vp_hash = actor.scene + actor.control.object_guid + view;
		
			if(!(vp_hash in self._viewports)){
				var vp = {scene:actor.scene, object:actor.control.object_guid, camera: view, actors:[actor]}
				self._viewports[vp_hash] = vp
				self._viewport_amount +=1;
			}else{
				self._viewports[vp_hash].actors.push(actor);
			}
		})
	})
	// 
	//console.log("We got ", self._viewport_amount, " viewports");
	// Теперь надо разместить все вьюпорты на канвасе
	if(self._viewport_amount == 1){
		var geom = [{t:0,l:0,w:self.vp_width, h:self.vp_height}]
	}if(self._viewport_amount == 2){
		var m = self.vp_width/2
		var geom = [
					{t:0,l:0, w:m, h:self.vp_height},
					
					{t:0,l:m, w:m, h:self.vp_height}
		]
	}
	if(self._viewport_amount == 3){
			var m = self.vp_width/2
			var hm = self.vp_height/2
			var geom = [
						{t:0,l:0, w:m, h:self.vp_height},
						{t:0,l:m, w:m, h:hm},
						{t:hm,l:m, w:m, h:hm}
						
			]
	}
	if(self._viewport_amount == 4){
			var m = self.vp_width/2
			var hm = self.vp_height/2
			var geom = [
						{t:0,l:0, w:m, h:hm},
						{t:0,l:m, w:m, h:hm},
						{t:hm,l:0, w:m, h:hm},
						{t:hm,l:m, w:m, h:hm}
						
			]
	}
	
	var _c = 0;
	_.each(self._viewports, function(vp){
		vp.geom = geom[_c]; _c++;
		vp.three_camera = self.makeCamera(vp)
		self.initSpace(vp);
		
	})
	
	
}
window.World.controllable = function(){
	
	 return this.mesh_for(this.login);
}
window.World.mesh_for = function(actor){
	//console.log(">>>",this.meshes()[this.scene.actors[actor].control.object_guid]);
	return this.meshes()[this.scene.actors[actor].control.object_guid]
}
window.World.render=function(vp){
	this.redrawSky(vp)
	this.redrawSun(vp)
	this.renderer.setViewport(vp.geom.l, vp.geom.t, vp.geom.w, vp.geom.h)
	//console.log("BLBLB",this.three_scenes,vp.scene);
	this.renderer.render( this.three_scenes[vp.scene], vp.three_camera );
	
    //self.renderer.render(self.three_scene, self.camera);
	
	
}
window.World.go = function(){
	var self = this;
	var last_timestamp = false;
	var first_loop = true;
	var time_inc = 0
	// self.mouse_projection_vec = new THREE.Vector3();
	// var _3d_scene = self.setup_scene(self.scene._3scene)
	var _d = false
	self.setupCameras();
	
	var updatePositions = function(){
		_.each(self.scenes, function(s){
			// s.tick()
		})
		// self.scene.tick()
		// self.redrawSun();
		// self.redrawSky();
		
			
		
		//self.mouse_projection_vec.set( ( self.mouse_x/ self.vp_width ) * 2 - 1, - ( self.mouse_y / self.vp_height ) * 2 + 1, 0.999 );
		
	    //self.p.unprojectVector( self.mouse_projection_vec, self.camera );
	    //self.cur.position.copy( self.mouse_projection_vec );
		
	}
	
	
    var animate = function(){
		if (self.total_objects_count === self.loaded_objects_count){
			updatePositions();
			//console.log(self._viewports)
			_.each(self._viewports, function(vp){
				self.render(vp)
			})
		}
		requestAnimationFrame(animate)
    	
    }
	
    requestAnimationFrame(animate);
	
}
