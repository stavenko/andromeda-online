var fs    = require('fs');
var u = require('./utils');
var THR = require('./three.node');
var Controller = require('./controller');

var _     = require('underscore');

var SceneObject = function(x,y,z){
	this.description= "Scene routines"
	this.GUID =  u.make_guid();
	this._create();
	this.gx = x
	this.gy = y
	this.gz = z
}
Scene = {constructor: SceneObject}

if(typeof window === 'undefined'){
	Scene.THREE = THR // Saveing THREE.js as part of scene - this step could be done on a certain platform
	Scene.do_prepare_rendering = false
	Scene.ajax_load_models = false
	Scene.need_update_matrix = true
	Scene.localActions = false
	
	
}else{
	Scene.THREE = THREE
	Scene.do_prepare_rendering = true
	Scene.ajax_load_models = true
	Scene.need_update_matrix = false
	Scene.localActions = true
	Scene.INPUT_TIMESTEP = 0.0700 // seconds
	Scene.time_since_last_actions_acquired = 0;
	
	// Scene.save_meshes_past = true
	
	
}




Scene.mesh_for = function(actor_guid){
	var actor = this.actors[actor_guid];
	return this.meshes[actor.control.object_guid]
}
Scene.create = function(){
	this._create();
	//console.log( "CLOCK", this.clock);
	
	return this;
}

Scene._create = function(){
	this.clock = new (this.THREE.Clock)();
	this.time_inc  = 0;
	
	this._scene_object_cache = {}
	this._scene_obj_actors={}
	this._network_messages = [];
	this.mesh_last_states = {}
	this._target_aq = 0.01; // seconds to get to sync target
	this.is_loaded = false
	this._d = false
	this._scene ={actors:{}, GUID: this.GUID, objects:{}, coords:[this.gx, this.gy, this.gz]  } 
	
	
	// this.simulation_runs = false
	// console.log(this.clock);
	
}
Scene.update_from_world = function(){
	// globalx-y-z - galaxy coords with 1 meter accuracy
	var closest_scene_with_distance = this.get_closest_scene(this.gx, this.gy, this.gz);
	// if closest_scene is not null - we must inject object with actors to that scene - it's already_loaded
	// else - We finding objects for that scene
				
	var objects_within_coords = this.get_objects_in(this.gx, this.gy, this.gz); // Загрузка объектов в сцену из глобального мира
	
	var objects = {}
	for ( var i = 0; i < objects_within_coords.length ; i++ ){
		objects[ objects_within_coords[i].GUID ] =   objects_within_coords[i];
	}
	_.extend(this._scene.objects, objects)
	
	this._scene.sunDirection = [0,1,0]
	this._scene.sunLightColor = [Math.random(), 0.8, 0.9] // HSL
	this._scene.coords =[ this.gx, this.gy, this.gz ]
	// this._create();
	
	// creating scene
	
	// this._scene = {coords :[ globalx, globaly, globalz ], actors:{}, GUID: u.make_guid(), objects:{} } 
	// this.GUID = this._scene.GUID;
	
	// prepare actors - all of them would control object_id = 0, viewports - each for each
	
	
	// Injecting other objects
	//var objects = {}
	// objects[for_object.GUID] = for_object;
	
	// console.log(
	// console.log( "CLOCK", this.clock);
	
	return this
	
}
Scene.get_actors = function(){
	return this._scene.actors
}
Scene.get_objects = function(){
	return this._scene.objects
}
Scene.get_json = function(){
	return this._scene
}
Scene.get_closest_scene = function(){
	return undefined
}
Scene.get_objects_in = function(){
	return [];
}
Scene.join_object = function( object ){
	this._scene.objects[object.GUID] = object
	
	// this._scene_obj_actors[object.GUID] = []
	// console.log("PUT OBJ", object.GUID)
}
Scene.join_actor = function( actor ){
	//if (this._scene.actors[actor.GUID]){
	//	this._scene.actors[actor.GUID].push(actor)
		//}else{
	this._scene.actors[actor.GUID] = actor
	
	// console.log("GET OBJ",this._scene_obj_actors,  actor.control.object_guid)
	
	// this._scene_obj_actors[actor.control.object_guid].push(actor)
	
	return this
	
}
Scene.set_from_json = function(object){
	this._scene = object
	
	this.GUID = object.GUID
	this.gx = object.coords[0]
	this.gy = object.coords[1]
	this.gz = object.coords[2]
	this.update_from_world( )
	
	
}

// Scene.controllable = function(login){
	
//	return this.meshes[this.actors[login].control.object_guid]
// }
Scene.load = function(onload, three_scene, W){
	// three scene - is a param for adding meshes to
	var self = this;
	//console.log('loading');
	// DEBUG THINGS
	this._server_sync_queue = [];
	this._server_last_sended = 0;
	self.total = new self.THREE.Vector3();
	self.total_t=0;
	self.controller_map= Controller.ControllersActionMap()
	
	self.meshes = {}
	self.loader =  new self.THREE.JSONLoader();
	self.total_objects_count = 0;
	self._call_back = onload;
	
	if(typeof window !== 'undefined'){
		self.three_scene = three_scene
		self.W = W;
	}
	
	function put_on(type, name, ts){
		var es = this["on_engines_" + type]
		obj = {name:name, ts:ts}
		// console.log(es)
		if ( es.indexOf( name ) === -1){
			es.push( name )	
		}
		// console.log(es)
	}
	function put_off(type, name,ts){
		var es = this["on_engines_" + type]
		var ix = es.indexOf(name)
		if (  ix !== -1 ){
			es.splice(ix, 1);
		}
	}
	var json = this._scene
	
	
	self.actors = json.actors;
	
	// self.automatic actors - run in loops
	self.automatic_actors = {};
	// console.log(self.actors)
	
	self.loaded_objects_count = 0
	
	// console.log(self.actors);
	// console.log(json);
	self._model_cache = {}
	//console.log(this);
	_.each(json.objects, function( object,ix ){
		self.total_objects_count +=1;
		
		if (! self.ajax_load_models){
			var m = object.model_3d.split('/')[2];
			var model_path= "./public/models/" + m
		}
		// console.log(model_path);
		
		var rf = function(){
			var with_geom_and_mat = function(geom, mat){
				var m = new self.THREE.Matrix4()
				m.identity()
			
				// var turret = object.turrets[objects.workpoints[actor.control.workpoint].turret] 
				
				
				var mesh = new self.THREE.Mesh( geom, mat );
				mesh.json = object
				mesh.pending_actions = [];
				mesh._processed_actions = [];
				mesh._actions_index = {};
				mesh._previous_states = []
				mesh._previous_states_index = {}
				//mesh.total_angular_impulses = [];
						// console.log(i, mesh.total_torques, mesh.total_powers)
				mesh.type=object.type
				var object_rotated = false
				// Setting defaults 
				mesh.avel = new self.THREE.Vector3(0,0,0)
				mesh.aacc = new self.THREE.Vector3(0,0,0)
				mesh.vel = new self.THREE.Vector3(0,0,0)
				mesh.acc = new self.THREE.Vector3(0,0,0)
				
				
				if ( object.physical ){
					for(i in object.physical){
						
						var _is = 'to' in object.physical[i]
						if (!_is){
							if(i !='rotation'){
								var v = new self.THREE.Vector3()
								
							}else{
								var v = new self.THREE.Euler()
							}
							v.set.apply(v, object.physical[i])
							mesh[i] = v
						
						}else{
							var p = new self.THREE.Vector3(object.physical[i].to[0], object.physical[i].to[1], object.physical[i].to[2])
							// Try to rotate p on 180 
							//p.rotateX(2* Math.PI);
							mesh.lookAt(p.negate())
							// mesh.rotateX(2*Math.PI)
							mesh.rot = new self.THREE.Vector3(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z);
							object_rotated = true;
						}
					}
				}else{
					var pi2 = Math.PI * 2;
					mesh.pos = new self.THREE.Vector3(Math.random() * 200, Math.random() * 200, Math.random() * 200);
					mesh.rot = new self.THREE.Vector3(Math.random() * pi2, Math.random() * pi2, Math.random() * pi2);
					
				}
				mesh.position = mesh.pos;
				if (! object_rotated &&  'rot' in mesh){
					
					var uel = new self.THREE.Euler(mesh.rot.x, mesh.rot.y, mesh.rot.z);
					mesh.rotation = uel;
				}
				// console.log(mesh.position)
				mesh.cameras = object.cameras;
				mesh.engines = object.engines;
				mesh.has_engines = object.engines !== undefined;
				if (mesh.has_engines){
					mesh.on_engines_rotation = [];
					mesh.on_engines_propulsion = [];
				}
				mesh.put_off = put_off;
				mesh.put_on  = put_on;
				mesh.mass = object.mass;
				mesh.angular_impulse = mesh.avel.clone().multiplyScalar(mesh.mass)
				mesh.impulse = mesh.vel.clone().multiplyScalar(mesh.mass)
				
		
				if (self.do_prepare_rendering){
					if (object.type !=='static'){
						var label = SpriteUtils.makeTextSprite("mesh: " + ix);
						label.position = new self.THREE.Vector3(0,0,0);
						mesh.add(label);
						// console.log("added");
					}
					three_scene.add( mesh );
					
				}
				mesh.last_processed_timestamp = new Date().getTime();
				mesh.update_static_physical_data = function(till_time){
					var time_left = (till_time - this.last_processed_timestamp) / 1000 // to seconds;
					// console.log(time_left);
					var um = 1 / mesh.mass;
					var umt = time_left * um
	
					var rots = this.angular_impulse.clone().multiplyScalar(umt)
					var poses = this.impulse.clone().multiplyScalar(umt)
	
					// mesh.vel = mesh.impulse.clone().multiplyScalar(um);
	
					this.rotateX(rots.x)
					this.rotateY(rots.y)
					this.rotateZ(rots.z);
	
					this.position.add(poses);
					this.last_processed_timestamp = till_time
				}
				//var turrets = {}
				//_.each(object.workpoints, function( wp ){
				//	turret = object.turrets[ wp.turret ] 
				//	var turret_pos = new self.THREE.Vector3();
				//	turret_pos.fromArray(turret.position)
				//	turrets[ wp.turret ] = turret_pos;
				//	mesh.add(
					
					//})
				
			
				self.meshes[ object.GUID ] = mesh;
				self.loaded_objects_count +=1;
				self._model_loaded( ix )
			}
			
			
			if(self.ajax_load_models){
				self._get_model(object.model_3d,self._ajax_getter, with_geom_and_mat)
			}else{
				self._get_model(model_path, self._fs_getter, with_geom_and_mat)
	
			}
		}
		setTimeout(rf,1);
		
	})
			
	
	
},
Scene._ajax_getter=function(name, cb) {
	//console.log(this);
	var self = this;
	self.loader.load( name, function(geom, mat){
		
		var material = new THREE.MeshFaceMaterial( mat );
		//var a = {geom:geom, material:material}
		cb(geom, material);
		
	})
}
Scene._fs_getter=function(name, cb){
	var self = this;
	fs.readFile(name, function(err,data){
		//console.log("start loading");
		if(err) throw err;
		var json = JSON.parse(data)
        var result = self.loader.parse( json, '' );

		var ld = (function(){
			var material = new self.THREE.MeshFaceMaterial( result.materials );
			cb(result.geometry, material);
		
		})
		setTimeout(ld,1);
	});
}

Scene._get_model = function(name, getter, with_geom_and_mat){
	var self = this;
	var mat_geom_cb = function(geom, mat){
		self._model_cache[name] = {geom:geom, material:mat}
		with_geom_and_mat(geom, mat)
	}
	if (name in self._model_cache){
		var a= self._model_cache[name]
		with_geom_and_mat(a.geom, a.material)
	}else{
		getter.apply(self,[name, mat_geom_cb])
	}
				
}
Scene._delete_object = function(guid){
	var self = this;
	if(self.three_scene){
		self.three_scene.remove(self.meshes[guid]) // удяляем ядро из сцены
	}
	delete self.meshes[ guid ]; // ... из мешей
	delete self._scene_object_cache[ guid ]
	
	
}
Scene._model_loaded = function(ix){
	//console.log("LLL");
	if (this.loaded_objects_count == this.total_objects_count){
		// scene loaded
		this.is_loaded = true;
		if  (this._call_back){
			this._call_back(this)
		}
		//console.log("DONE");
	}else{
		//console.log('not yet', this.loaded_objects_count , this.total_objects_count);
	}
}
Scene.sync = function(sync){
	var self = this;
	console.log ("syncing pulse recv", sync)
	self._last_server_report = sync
	//self.targets = {};
	/*
	_.each(sync, function(object, guid){
		if (!(guid in self.meshes)) return;
		self.meshes[guid].ph_targets = {}
		//console.log("SYNC========================================");
		var delta = (new Date().getTime()) - object.ts + self.W._time_diff;
		//console.log("time",  object.ts, delta);
	
		_.each(object._cache, function(vec, name){
			var v = new self.THREE.Vector3()
			v.fromArray(vec)
			
			//if(['position', 'rotation'].indexOf(name ) === -1){
			//console.log('name', name);
			var target = {vec: v,
						  started:false,
					  	  ts: object.ts }
			self.meshes[guid].ph_targets[name] = target
			self.need_sync = true;
				
				//}
			
			
			
			//if (!v.equals(ov)){
			//	console.log(name, vec, ov.toArray() )
			//}
		
		})
		
	})
	*/
}
Scene.get = function(){
	return this._scene
}
Scene.get_almanach = function(){
	// var self = this;
	console.log(this.mesh_last_states);
	return this.mesh_last_states
	
}

Scene.tick = function(){
	var self = this;
	if(self.tick_num){
		self.tick_num+=1;
	}else{
		self.tick_num = 0;
	}
	var now = new Date().getTime();
	// console.log("tick");
	// console.log('.');
	//var time_inc = 0;
	var time_left = self.clock.getDelta();
	self.time_inc += time_left;
	
	
	if(self.last_ts === undefined){
		self.last_ts = new Date().getTime();
	}
	if(self.localActions){
		
		if(self.time_since_last_actions_acquired > self.INPUT_TIMESTEP){
			self.time_since_last_actions_acquired = 0
			var new_actions = self.getLocalActions(now);
			
			if(new_actions.length > 0){
				console.log("got something new");
				_.each(new_actions, function(a){
					self.controller_map[a.type].act(self, a, a.actor, function(object_guid, action){
						//console.log(action);
						self._addToServerQueue(action);
					})
				})
			}
			
		}else{
			self.time_since_last_actions_acquired += time_left;
			
		}
	}
	var nm = self.getNetworkActions();
	//console.log("here's network actions", nm);
	_.each(nm,function(action){
		// console.log("pushing network actions", action )
		var mesh = self.mesh_for(action.actor)
		mesh.pending_actions.push(action)
	})
	
	//console.log(self.time_inc);
	
	// var actor = self.get_current_actor()
	// var C = self.meshes()[actor.control.object_guid]
	// console.log(self.automatic_actors);
	_.each(self.automatic_actors, function(actor){
		//console.log(actor);
		actor.run(time_left); // TODO Избавиться как-то от этой переменной
	})
	//console.log(time_inc)
	
	if((Math.floor(self.time_inc) % 5 ) ===0){
		if (!self._d){
			self._d = true
			//console.log("5sek tick")
			// only two first
			for(i in self.meshes){
				var m = self.meshes[i]
				if (m.type == 'ship'){
					var v = m.vel;
					var p = m.impulse;
					var x = m.position;
					
					var r = m.rot;
					
					if (v){
						// console.log('v',i, v.x, v.y, v.z)
						// console.log('p',i, p.x, p.y, p.z)
						// console.log('x',i, x.x, x.y, x.z)
						
					}
					
				}
			}
		}
		
	}else{
		self._d = false
	}
	
	// lastActions = getLastActions
	_.each(self.meshes, function(mesh, i){
		if (mesh.type == 'static') return;
		//console.log("this is mesh loop", mesh.pending_actions.length);
		if(self.localActions && (i in self._last_server_report) ){
			//console.log("refreshing!")
			var state = self._last_server_report[i]
			var last_id = state.ident // индентификатор-таймстемп последней обработанной сервером команды для этого меша
			var last_ts = state.server_ts;
			// console.log(last_ts
			if(last_id in mesh._actions_index) { // Мы недавно обрабoтали на клиенте это таймстемп
				var _id = mesh._actions_index[last_id] //  идентификатор массива
				var _stid = mesh._previous_states_index[last_id]
				// console.log("S", last_id, _id, mesh._processed_actions.length);
				
				for(var yy = 0; yy <= _id; yy++){ // Удаляем лишние индексы
					delete mesh._actions_index[mesh._processed_actions[yy].ident]
				}
				for(var zz = 0; zz <= _stid; zz++){ // Удаляем лишние индексы
					delete mesh._previous_states_index[mesh._previous_states[zz].ident]
				}
				
				var command = mesh._processed_actions[_id];
				var prev_state = mesh._previous_states[_stid]
				if(command){
					//console.log("we've got own ts");
					current_ts = command.ts
				}else{
					//console.log("we've got server ts - constructing our own;");
			
					current_ts = last_ts - self.W._time_diff
				}
				//console.log("total_PROCESSED_ACTIONS", mesh._processed_actions.length, _id);
				var pending = mesh._processed_actions.slice(_id+1);
				//console.log("pending starts with", pending[0], last_id);
				//console.log("pending from slice", pending);
				mesh._processed_actions = []
				mesh.pending_actions = pending.concat(mesh.pending_actions);
				if(mesh.pending_actions.length >  0){
					//console.log('starting pending actions')
					self._action_on_the_run_var = true
				}
				
				//console.log("total pending", mesh.pending_actions);
				for(v in state.state){
					
					if(prev_state){
						var a = prev_state.state[v];
						var b = state.state[v];
						var c = [b[0] -a[0], b[1]-a[1], b[2]-a[2]];
						var dc = Math.sqrt( (c[0]*c[0])+ (c[1] * c[1]) + (c[2] * c[2] ))
						console.log( a, b,dc );
					}
					mesh[v].fromArray(state.state[v]);
				}
				mesh.last_processed_timestamp = current_ts
				//console.log(mesh.last_processed_timestamp, now, now - mesh.last_processed_timestamp);
				delete self._last_server_report[i]
				
			}else{
				// такого таймстемпа нет в списке последних отработанных операций - это значит, 
				// что сервер и клиент обработали равное количество операций
			}
			//v = a+c+e
			
		}
		// console.log("L", mesh.pending_actions.length);
		if(mesh.pending_actions.length > 0){
			// apply actions
			//console.log(mesh.pending_actions.length, "actions to process"  );
			//console.log('now ', now);
			
			
			
			// console.log("last_action", _.last(mesh.pending_actions));
			_.each(mesh.pending_actions, function(action){
				// console.log(action.ident);
				
				self.controller_map[action.type].process(action, mesh)
				
				current_state = {ident:action.ident, 
								 state:{position: mesh.position.toArray(),
									    rotation: mesh.rotation.toArray(),
									    impulse:  mesh.impulse.toArray(),
									    angular_impulse: mesh.angular_impulse.toArray()}}
				var st_id = mesh._previous_states.push(current_state)
				mesh._previous_states_index[action.ident] = st_id -1
				
				var id_val = mesh._processed_actions.push(action) // - 1
				
				mesh._actions_index[action.ident] = id_val-1
				
			})
			// console.log('finished pending actions');
			self._action_on_the_run_var = false
			// console.log("last_state",  mesh.rotation, mesh.angular_impulse);
			
			// console.log("local actions", self.localActions)
			if(self.localActions){
				// console.log('total_actions_proceed', mesh._processed_actions.length);
			}else{
				self.mesh_last_states[i] = {ident:_.last(mesh.pending_actions).ident, 
					server_ts :_.last(mesh.pending_actions).ts, 
											state:{position:mesh.position.toArray(),
												   rotation:mesh.rotation.toArray(),
												   impulse:mesh.impulse.toArray(),
												   angular_impulse: mesh.angular_impulse.toArray()}}
				
			}
			mesh.pending_actions = []; // Удаляем список
			
			// мы должны именно здесь замерить текущие параметры объекта и послать их на
			// клиенты с отметкой последнего идентификатора обработанного сообщения
			self.process_physical(mesh,now) // добавляем движение объекта от последнего тс до сейчас 
		}else{
			// console.log('here...');
			self.process_physical(mesh, now)
		}
		//console.log("ROT", mesh.rotation.toArray());
		
		
		
	})
	self.last_ts = now
	
}
Scene.getNetworkActions = function(){
	var ret = _.clone(this._network_messages)
	this._network_messages = [];
	return ret;
}
Scene.getLocalActions = function(now){
	//if (this.localActions){
		return this.W.Inputs.getLatestActions(this.GUID, now)
		//}else{var locals = []}
	// var networks = this._network_messages
	// var ret = locals// .concat(networks) // network messages will follow local messages- easier to find final processed message id
	//return ret;
	
	
	
}
Scene.process_physical = function(mesh, now){
	mesh.update_static_physical_data(now);
	
}
Scene._addToServerQueue = function(action){

	// Теперь на сервер будем слать незамедлительно!
	action.ident = action.ts
	console.log("SEND");
	this.W.sendAction(this.GUID, action);
	// this._server_sync_queue.push(action)
}
Scene._flushServerQueue = function(){
	var size = this._server_sync_queue.length ;
	var ret = this._server_sync_queue.slice(this._server_last_sended);
	//console.log("ffl", size, ret)
	this._server_last_sended = size;
	return {scene:this.GUID, actions:ret};
}
Scene.addNetworkMessage = function(mes){
	this._network_messages.push(mes) // = this._network_messages.concat(mes)
}

SceneObject.prototype = Scene
module.exports = SceneObject