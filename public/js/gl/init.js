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
	// console.log("COLOR",scene._scene.sunLightColor);
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
	lensFlare.position = new THREE.Vector3().fromArray(scene._scene.sunDirection).multiplyScalar(500)
	
	
	// this.sunBillboard = new THREE.Sprite(textureFlare0 )
	this.three_scenes[scene.GUID].add(lensFlare)
	this.flares[scene.GUID] = lensFlare;
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
// Vieport functions
window.World.make_main = function(scene){
	var sel = document.getElementById('viewports-select');
	this._main_viewport = sel.options[sel.selectedIndex].value;
	this._init_vps()
}
window.World.add_icon = function(scene){
	var sel = document.getElementById('viewports-select');
	add_vp = sel.options[sel.selectedIndex].value;
	if(this._additional_vps.length == 3){
		this._additional_vps[2] == add_vp;
		
	}else{
		this._additional_vps.push(add_vp);
	}
	this._init_vps()
	
	
}

window.World.init = function(auth_hash, client_login){
	this.__vpx = 0;
	this.auth_hash = auth_hash;
	this.login = client_login;
	
	// this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
	// this.camera.position.z = 250;
	this.p = new THREE.Projector();
	this.three_scenes = {}
	this.scenes = {};
	this.flares = {}
	//  = new THREE.Scene();
	this.clock = new THREE.Clock();
	//this.geometry = new THREE.CubeGeometry(200, 200, 200);
	var sg = new THREE.SphereGeometry(5);
	// var wires = new THREE.MeshBasicMaterial({wireframe:true})
	this.cur = new THREE.Mesh(sg) // , wires);
	this.vp_width = document.body.clientWidth;
	this.vp_height = 400;//document.body.clientHeight;
	this._main_viewport = 0
	this._additional_vps = [];
	var ProtoBuf = dcodeIO.ProtoBuf;
	this.protobufBuilder = ProtoBuf.loadProtoFile( "/js/gl/client_message.proto" );
	//this._main_viewport_actors = [];
	var h3 = this.vp_height/3
	var w4 = this.vp_width/4
	var w34 = this.vp_width- w4
	this._additional_vps_geom = [
		{l:w34, t:h3*2, w:w4, h:h3},
		{l:w34, t:h3, w:w4, h:h3},
		{l:w34, t:0, w:w4, h:h3},
	
	]
	this._main_vp_geom = {l:0, t:0, w:this.vp_width, h:this.vp_height};
	
	this.skyboxScenes = {};
	this.skyBoxes = {}; //[scene.guid]  = new THREE.Mesh( new THREE.CubeGeometry( 9000, 9000, 9000 ), material );
	this.skyBoxCamera = {};//[scene.guid]
	this.mouse_projection_vec = new THREE.Vector3();
	
	var self = this;
	self.pings = [];
	self.pings_instability = [];
	self._time_diffs = [];
	
	
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
	this.renderer.domElement.addEventListener('mouseup', function(e){
		// console.log(e)
		self.Inputs.input( 'lmouse', false)
		
		// var action = self.actions['lmouse']
		
		//ControllersActionMap[action.type].act(self, action, true)
		// Controller(self, action, true);
	})
	
	this.renderer.domElement.addEventListener('mousedown', function(e){
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
		
		// 
		
		
	})
	this.socket.on('server_fault', function(){
		// window.location = "/console/"
		// console.log("AAA");
	})
	this.socket.on('actors', function(data){
		// Здесь мы получаем всех акторов, которые присущи для этого логина - их может оказаться несколько и для них могут быть разные сцены
		var actors = data.actors;
		self.actors = actors // Здесь список всех акторов, которые так или иначе связаны с нашим логином
		console.log('actors', actors);
		self.syncTime()
		
		var scenes = _.map(self.actors, function(actor){
			return actor.scene
			
		})
		// Запрашиваем загрузку всех сцен для этого актора - по идентификаторам сцен
		
		// console.log("Req scenes", _.uniq(scenes))
		self.socket.emit("request_scenes", {scenes:_.uniq(scenes)})
		
		// console.log("Recv Actors",actors)
		// self._player_viewports = data.length;
		// self.go() // после загрузки акторов попробуем запустить эмуляцию
	})
	
	this.socket.on('scenes', function(data){
		//console.log('scenes', data.scenes);
		var guids = _.keys(data.scenes)
		var _totals = 0
		var all_loaded = function(){
			self.go();	
			// console.log("recv scenes", self.scenes)
			self.network_actor = new Controller.NetworkActor( function(){}, self)
		}
		var onload = function(scene){
			// console.log('loaded');
			var onAct = function(){
				console.log('act on client')
			}
			_totals +=1
			self.setup_scene(scene);
			_.each(self.actors, function(a){
				if (a.GUID in scene.actors){
					self.socket.emit("actor-joined",{a:a, s:scene.GUID} )
					//console.log("this actor is for me", a.GUID, scene.GUID)
				}
				
			})
			// self.socket.emit("player-joined", {scene:scene.GUID, })
			
			// console.log("WAT",_totals, guids.length)
			if(_totals == guids.length){
				all_loaded()
			}
			// 
			// 
		}
		_.each(data.scenes, function(scene, guid){
			// console.log('well', scene);
			self.load_scene(scene , onload)
			//console.log('well', scene._scene);
			
		})
		
	})
	this.socket.on('actor-joined', function(data){
		// console.log('joining actor', data);
		// console.log(self.actors)
		// Актор может джойнить уже существующий в сцене - надо переделывать вьюпорты
		if (data.GUID in self.scenes[data.scene].actors){
			//console.log("actor already exist, first comer?")
		}else{
			self.scenes[data.scene].join_actor(data);
		}
	})
	this.socket.on('scene_sync', function(data){
		
		// console.log(data.almanach);
		if(self.scenes[data.scene] !== undefined){
			self.scenes[data.scene].sync(data.almanach);
		}
	})
	this.socket.on('player-inputs', function(data){
		console.log("RR", data);
		self.scenes[data.s].addNetworkMessage(data.a);
	})
	/*
	this.socket.on('player_controls_on', function(data){
		var actor = data.actor;
		var action = data.action;
		var S = self.scenes[actor.scene];
		//console.log("PPLAY CONTOL", actor);
		self.network_actor.act(S, action, true, actor)
	
	})

	this.socket.on('player_controls_off', function(data){
		// console.log('ok recv', data)
		var actor = data.actor
		var action = data.action;
		
		var S = self.scenes[actor.scene];
		self.network_actor.act(S, action, false, actor)
	
	})*/
	

	
}
window.World.set_actions = function(){
	self.actions = self._default_actions
}

window.World.load_scene = function (scene_js, onload){
	// console.log('well-well', scene._scene);
	
	// this.scenes = {}
	
	var scene = new Scene()
	
	scene.set_from_json(scene_js)
	
	
	this.scenes[scene.GUID] = scene;
	this.three_scenes[scene.GUID] = new THREE.Scene();
	// console.log("WWW", onload);
	scene.load(onload, this.three_scenes[scene.GUID], this )
	
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
// window.World.setupVPCamera(
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
	
	var camera = new THREE.PerspectiveCamera(45, vp.geom.w / vp.geom.h, 1, 1000);
	
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
	var is_first = true;
	
	_.each(self.actors, function(actor){
		//console.log(actor)
		var wp = actor.control.workpoint;
		
		var views = self.scenes[actor.scene].get_objects()[actor.control.object_guid].workpoints[wp].views
		
		_.each(views, function(view){
			var vp_hash = actor.scene + actor.control.object_guid + view;
			if (is_first){
				self._main_viewport = vp_hash;
			}
		
			if(!(vp_hash in self._viewports)){
				var vp = {scene:actor.scene, object:actor.control.object_guid, camera: view, actors:[actor]}
				self._viewports[vp_hash] = vp
				self._viewport_amount +=1;
			}else{
				self._viewports[vp_hash].actors.push(actor);
			}
		})
	})
	// self._main_viewport = 0;
	// console.log("VP",self._viewports[self._main_viewport]);
	//self._viewports[self._main_viewport]
	self._init_vps();
	var sel = document.getElementById('viewports-select');
	sel.innerHtml = "";
	_.each(self._viewports, function(vp,k){
		var opt = document.createElement('option')
		opt.value = k;
		opt.appendChild(document.createTextNode(vp.camera))
		sel.appendChild(opt)
	})
	
	
}
window.World.get_main_viewport = function(){
	//console.log(this._main_viewport);
	return this._viewports[this._main_viewport];
}
window.World._init_vps = function(){
	var mvp = this._viewports[this._main_viewport];
	mvp.geom = {t:0, l:0, w:this.vp_width, h:this.vp_height};
	mvp.three_camera = this.makeCamera(mvp)
	this.three_scenes[mvp.scene].add(this.cur);
	this.initSpace(mvp);
	
	
	var self = this;
	self.Inputs = new Controller.LocalInputActor(self, self.socket)
	// self._contrallable = self.controllable();
	
	_.each(this._additional_vps, function(vp_name,i){
		var vp = self._viewports[vp_name];
		vp.geom = self._additional_vps_geom[i]
		vp.three_camera = self.makeCamera(vp)
		self.initSpace(vp);
		
		
	})
	
}
window.World.controllable = function(){
	var mvp = this.get_main_viewport();
	// console.log("MMM", mvp)
	return this.scenes[mvp.scene].meshes[mvp.object]
}
window.World.mesh_for = function(actor){
	//console.log(">>>",this.meshes()[this.scene.actors[actor].control.object_guid]);
	return this.meshes()[this.scene.actors[actor].control.object_guid]
}
window.World.redrawSun = function(vp){
	var m = this.scenes[vp.scene].meshes[vp.object]
	
	var sd = new THREE.Vector3().fromArray(this.scenes[vp.scene]._scene.sunDirection).multiplyScalar(10); 
	//console.log(sd, this.scenes[vp.scene]._scene.sunDirection);
	
	this.flares[vp.scene].position = m.position.clone().add(sd)
	// console.log(this.flares[vp.scene].position)
}
window.World.getServerTS = function(){
	
};
window.World.sendAction=function(scene, action){
	var act = _.clone(action)
	act.ts += this._time_diff; 
	act.p = JSON.stringify(act.p);
	
	delete act.vector;
	// console.log({s:scene,a:action})
	this.socket.emit("user_actions", {s:scene,a:act})
},
window.World.syncTime = function(){
	this._sync_timestamp = new Date().getTime();
	var self = this;
	var Actions = this.protobufBuilder.build("Actions");
	
	var messages = {};
	//console.log("ST", this.scenes);
	/*
	_.each(this.scenes, function(sc){
		// var sq = sc._flushServerQueue();
		// console.log("FFL", sq)
		var result = sc._flushServerQueue();
		result.actions = _.map(result.actions, function(mes){
			mes.ts += self._time_diff; 
			mes.p = JSON.stringify(mes.p);
			delete mes.vector;
			return mes;
		})
		//console.log("FFFLLL", result);
		var actions = new Actions(result.actions)
		//console.log("com_length", actions.inputs.length);
		//console.log("shouldbe", result.actions.length)
		//bin_len = actions.encode().length;
		//txt_len = actions.toBase64().length;
		//cur_len = JSON.stringify({actions:result.actions}).length
		//console.log("effect", Math.floor(bin_len*100/cur_len) ,Math.floor(txt_len*100/cur_len) )
		messages[sc.GUID] = actions.toBase64(); // result.actions
		//console.log(" here's one action", JSON.stringify(result.actions[0]))
		
	})
	//console.log("before sending syncing message");
	*/
	// console.log("length of message in bytes", JSON.stringify({actions:messages}).length)
	this.socket.emit("sync_request")
	
	//console.log(">>>>", this.socket.emit);
	var diff_statistics_length = 50
	if(! this._sync_message_setup ){
		this.socket.on("clock_response", function(data){
			var recv_ts = new Date().getTime();
			var ping = recv_ts - self._sync_timestamp
			
			self.pings.push(ping)
			
			//if (self.pings.length > ping_statistics_length ){self.pings.splice(0,1)};
			//var avg_ping = _.reduce(self.pings, function(a,b){return a+b},0)/ self.pings.length;
			//self.pings_instability.push(Math.abs(avg_ping - ping))
			//if (self.pings_instability.length > ping_statistics_length){self.pings_instability.splice(0,1)};
			var avg_ping_instab = _.reduce(self.pings_instability, function(a,b){return a>=b?a:b},0)
			
			var lat = ping / 2
			var _time_diff = data.ts - self._sync_timestamp - lat
			self._time_diffs.push(_time_diff)
			if(self._time_diffs.length > diff_statistics_length){self._time_diffs.splice(0,1) }
			self._time_diff = Math.floor(_.reduce(self._time_diffs, function(a,b){return a+b},0)/self._time_diffs.length)
			//if(self._time_diff < 0){
			//	self._time_diff = 0;
			//}
			self.average_ping_instability = avg_ping_instab;
			self.max_ping = _.max(self.pings)
			
			// console.log("T", avg_ping,self.pings,self._time_diff)
			//console.log("TIMES", self._time_diff, data.ts - self._sync_timestamp, lat)
			
			// var to = 100 / (avg_ping/1000)
			// var instab_per  =  avg_ping_instab / avg_ping * 100;
			//console.log("INSTV",to, avg_ping, avg_ping_instab, instab_per);
			
			setTimeout(function(){self.syncTime()}, 1000);
			
		})
		this._sync_message_setup = true
		
	}
}
window.World.redrawSky = function(vp){
	//var m = this.scenes[vp.scene].meshes[vp.object]
	
	//// var C = this.scene.mesh_for(this.login);
	// var r= m.rotation
	var mp = vp.three_camera.parent.matrix.clone()
	var m = vp.three_camera.matrix.clone()
	mp.multiply(m)
	var mr = new THREE.Matrix4().extractRotation(mp)
	var rot = new THREE.Euler().setFromRotationMatrix(mr)
	
	// console.log(vp.three_camera)
	this.skyBoxCamera[vp.scene].rotation.copy( rot );

	//this.renderer.setViewport(vp.geom.l, vp.geom.t, vp.geom.w, vp.geom.h);
	this.renderer.render( this.skyboxScenes[vp.scene], this.skyBoxCamera[vp.scene] );
	// renderer.render( scene, camera );
	// console.log(this.skyBox.position)
	
}

window.World.render=function(vp,geom){
	this.redrawSun(vp)
	// console.log(vp)
	this.renderer.setViewport(geom.l, geom.t, geom.w, geom.h)
	//console.log("BLBLB",this.three_scenes,vp.scene);
	this.redrawSky(vp)
	if(this.scenes[vp.scene]._action_on_the_run_var){
		console.log('render M');
	}
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
	
	
	
	// var _time_interv = 
	
	var updatePositions = function(){
		_.each(self.scenes, function(s, g){
			//console.log("recount ",g);
			s.tick()
			//console.log("is made syncy"); 
		})
	}
	
	
    var animate = function(){
		if (self.total_objects_count === self.loaded_objects_count){
			updatePositions();
			//console.log(self._viewports)
			var mvp = self.get_main_viewport();
			var geom = self._main_vp_geom
			// console.log("RENDER");
			self.render(mvp, geom);
			self.mouse_projection_vec.set( ( self.mouse_x/ geom.w ) * 2 - 1, - ( self.mouse_y / geom.h ) * 2 + 1, 0.99 );
		
		    self.p.unprojectVector( self.mouse_projection_vec, mvp.three_camera );
			
		    self.cur.position.copy( self.mouse_projection_vec );
			//console.log(self.mouse_projection_vec);
			
			
			_.each(self._additional_vps, function(vp_name, i){
				var vp = self._viewports[vp_name];
				self.render(vp, self._additional_vps_geom[i])
			})
		}
		requestAnimationFrame(animate)
    	
    }
	
    requestAnimationFrame(animate);
	
}
