var fs    = require('fs');
var u = require('./utils');
var THR = require('./three.node');

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
	Scene.save_meshes_past = false
	
}else{
	Scene.THREE = THREE
	Scene.do_prepare_rendering = true
	Scene.ajax_load_models = true
	Scene.need_update_matrix = false
	Scene.save_meshes_past = true
	
	
}




Scene.mesh_for = function(actor){
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
	this._target_aq = 0.5; // seconds to get to sync target
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
	this._scene_obj_actors[object.GUID] = []
	// console.log("PUT OBJ", object.GUID)
}
Scene.join_actor = function( actor ){
	//if (this._scene.actors[actor.GUID]){
	//	this._scene.actors[actor.GUID].push(actor)
		//}else{
		this._scene.actors[actor.GUID] = actor
	
	// console.log("GET OBJ",this._scene_obj_actors,  actor.control.object_guid)
	
	this._scene_obj_actors[actor.control.object_guid].push(actor)
	
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
	self.total = new self.THREE.Vector3();
	self.total_t=0;
	
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
				mesh.total_powers = [];
				mesh.total_torques = [];
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
	//self.targets = {};
	
	_.each(sync, function(object, guid){
		if (!(guid in self.meshes)) return;
		self.meshes[guid].ph_targets = {}
		console.log("SYNC========================================");
		var delta = (new Date().getTime()) - object.ts - W._time_diff;
		console.log("time",  object.ts, delta);
	
		_.each(object._cache, function(vec, name){
			var v = new self.THREE.Vector3()
			v.fromArray(vec)
			
			//if(['position', 'rotation'].indexOf(name ) === -1){
			console.log('name', name);
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
}
Scene.get = function(){
	return this._scene
}
Scene.get_almanach = function(){
	// var self = this;
	
	return this._scene_object_cache
	
}
Scene.tick = function(){
	var self = this;
	if(self.tick_num){
		self.tick_num+=1;
	}else{
		self.tick_num = 0;
	}
	// console.log('.');
	//var time_inc = 0;
	var time_left = self.clock.getDelta();
	self.time_inc += time_left;
	
	
	if(self.last_ts === undefined){
		self.last_ts = new Date().getTime();
	}
	
	//console.log(self.time_inc);
	
	// var actor = self.get_current_actor()
	// var C = self.meshes()[actor.control.object_guid]
	// console.log(self.automatic_actors);
	_.each(self.automatic_actors, function(actor){
		//console.log(actor);
		actor.run(time_left);
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
	var get_impulses = function(FA, last_ts, now){ 
		var ps = []
		if (FA.length == 0) return []
		if(FA.length > 1){ // В списке есть силы, которые уже перестали действовать 
			var _length = FA.length;
			for(var i = 0; i < FA.length;i++){
				var is_last = i === (_length-1)
				if(!is_last){ 
					var acts_untill = FA[i+1].ts
				}else{
					var acts_untill = now;
				}
				var acts_since = FA[i].ts
				if(acts_since < last_ts){acts_since = last_ts }
				var time = (acts_untill - acts_since)/1000;
				var F = FA[i].vec.clone();
				ps.push( {i:F.multiplyScalar( time ), t:time} )
			}
			//console.log(ps);
			FA.splice(0, FA.length - 1); // удаляем все силы кроме последней
			//console.log("TWO", ps);
		}
		else{ // одна сила в списке - действует до сих пор, или начнет действовать скоро
			var F = FA[0].vec.clone()
			var acts_since = FA[0].ts
			
			//console.log(now - last_ts);
			// if(acts_since < last_ts){ acts_since = last_ts }
			if(acts_since >= now) {
				// ничего пока не делаем - возвращаем пустые импульсы 
				console.log('in future');
				return ps;
			}
			var time = (now - acts_since)/1000;
			// console.log(time, now - acts_since );
			if (F.length() === 0){ // Удаляем силу, если она равна нулю
				FA.splice(0,1);
			}else{
				FA[0].ts = now // Если сила в далеком прошлом - её все равно надо отработать, а потом ставим время её реакции - сейчас
			}
			ps.push({i:F.multiplyScalar( time ), t:time});
			// console.log("ONE", ps[0].i.z,ps[0].t);
			
		
		}
		
		
		return ps
		
	}
	var now = new Date().getTime();
	_.each(self.meshes, function(mesh, i){
		if (mesh.type == 'static') return;
		
		var ps = [];
		var um = 1 / mesh.mass;
		var umt = time_left * um
		
		// var FA = self.total_torques
		// И в конце-концов оставляем последний таймстеп
		// console.log(i, mesh.total_torques, mesh.total_powers)
		var rots = mesh.angular_impulse.clone().multiplyScalar(umt)
		var poses = mesh.impulse.clone().multiplyScalar(umt)
		
		if( mesh.has_engines) {
			var TI = get_impulses(mesh.total_torques, self.last_ts, now) // Импульсы вращения
			//mesh.total_torques = [ mesh.total_torques[mesh.total_torques.length] ]
			var PI = get_impulses(mesh.total_powers, self.last_ts, now) // Импульсы поступательного
			//var total_t = 0
			if(TI.length > 0){
				//_.each(TI, function(i, inum){
				//	console.log("responses #"+inum, i.i, i.t, self.total.length(), self.total_t);
					
				//	self.total.add(i.i.clone())
				//	self.total_t += i.t;
				//})

				
				
			}
			_.each(TI, function(imp){

			
				// Получаем дополнительные интегралы - суммируем 
				rots.add(imp.i.clone().multiplyScalar( um*imp.t ))// Интегрируем изменения углов по импульсам
				mesh.angular_impulse.add(imp.i)
			})
		
			_.each(PI, function(imp){
				var v = imp.i.clone();
				v.applyQuaternion(mesh.quaternion);
				poses.add( v.clone().multiplyScalar(um*imp.t) ) // Интегрируем изменения координат по импульсам
				mesh.impulse.add(v)
			})
			
		}
		
		mesh.vel = mesh.impulse.clone().multiplyScalar(um);
		
		mesh.rotateX(rots.x)
		mesh.rotateY(rots.y)
		mesh.rotateZ(rots.z);
		
		mesh.position.add(poses);
		
		/// Здесь мы будем достигать поставленных целей до тех импульсов, и координат, который нам нужны, для этого сначала
		//  Попробуем на кошках - угловых моментах
		if(self.need_sync && (mesh.ph_targets !== undefined)){
			// console.log(mesh.ph_targets)
			_.each(mesh.ph_targets, function(target, name){
				if(target.started){
					var dv = target.v.clone().multiplyScalar(time_left)
					target.total_time += time_left
					target.diff_length -= dv.length();
					//target.diff.sub(dv);
					if(name==='rotation'){
						//console.log("time and diff", target.total_time,target.diff_length, target.diff.toArray(), dv.toArray());
					}
					if(name === 'rotation'){
						var _r = new self.THREE.Vector3().fromArray(mesh.rotation.toArray()).sub(dv).toArray();
						mesh.rotation = new self.THREE.Euler().fromArray(_r);
					}else{
						mesh[name].sub(dv)
					}
					if(target.diff_length <= 0.001){
						// console.log("sync_stop");
						
						delete mesh.ph_targets[name];
					}
					
					
					
				}else{
					
					var acur = mesh[name].toArray()
					if(acur){
						var cur = new self.THREE.Vector3().fromArray(acur)
					}else{
						var cur = new self.THREE.Vector3()
						
					}
					// var time_threshold = W.max_ping * 1.5)
					if (mesh.past_states !== undefined){
						for(var ts in mesh.past_states[name]){
							var v = mesh.past_states[name][ts]
							if (ts< target.ts){
								//console.log('less')
								delete mesh.past_states[name][ts]
							}else{
								var from = new self.THREE.Vector3().fromArray(v)
								var afrom = v;
								// console.log('NOW', now, from )
								// console.log("GOT", ts, target.vec)
								
								break
							}
						}
						if(from !== undefined){
							target.diff = from.clone().sub(target.vec.clone())
							target.v = target.diff.clone().multiplyScalar(1/self._target_aq)
							if(name === 'rotation' || name === 'angular_impulse'){
								// var cur_diff = cur.clone().sub(target.vec.clone());
								// console.log("start new sync ", name, target.vec.toArray());
								// console.log("FROM, DIFF",  target.diff.toArray() );
								// console.log("CUR,DIFF",  cur_diff.toArray() );
							}
					
							target.started = true;
							target.total_time = 0;
							target.diff_length = target.diff.length()
							
						}
					
						
					}
				}
			})
			/*
			
			if('rotation' in mesh.ph_targets){
				
				var to = mesh.rotation.toArray()
				var from = mesh.ph_targets.rotation.toArray()
				var tov = new self.THREE.Vector3().fromArray(to)
				var R = new self.THREE.Vector3().fromArray(from).sub(tov);
				if(R.length() < 0.01){
					mesh.rotation = mesh.ph_targets.rotation
					console.log('ROT too small');
					delete mesh.ph_targets['rotation']
				}
				else{
					//if(self.cur_tick === undefined){self.cur_tick = self.tick_num;}
					console.log("ROT target", mesh.ph_targets.rotation);
					console.log("ROT diff", R);
					console.log('ROT lill big', R.length(), mesh.rotation);
					R.multiplyScalar(1/ self._target_aq * time_left);
					console.log(">>", R.x, R.y, R.z);
					mesh.rotateX( R.x)
					mesh.rotateY( R.y)
					mesh.rotateZ( R.z)
					console.log(">>", mesh.rotation);
					
					// console.log(R.length());
					
				}
				
				
			}
			if('position' in mesh.ph_targets){
				var PD = mesh.position.clone().sub(mesh.ph_targets.position.clone())
				if(PD.length() < 0.01){
					console.log('POS too small');
					mesh.position = mesh.ph_targets.position
					delete mesh.ph_targets['position']
					
				}else{
					console.log('POS lill big', PD.length());
					
					PD.multiplyScalar(1/ self._target_aq);
					PD.multiplyScalar(time_left)
					mesh.position.add(PD)
				}
			}
			if('angular_impulse' in mesh.ph_targets){
				var ang_mom_diff = mesh.angular_impulse.clone().sub(mesh.ph_targets.angular_impulse.clone())
				var amdV = ang_mom_diff.multiplyScalar(1/ self._target_aq);
				var dm = amdV.multiplyScalar( time_left );
				mesh.angular_impulse.add(dm)
			}
			if('impulse' in mesh.ph_targets){
				var ID = mesh.impulse.clone().sub(mesh.ph_targets.impulse.clone())
				ID.multiplyScalar(1/ self._target_aq);
				ID.multiplyScalar( time_left );
				mesh.impulse.add(dm)
			}
			*/
			
			// console.log(ang_mom_diff, ang_rot_diff );
		
		}
		
		var _this_cache={}
		_.each(['position', 'rotation', 'impulse', 'angular_impulse'], function(v){
			var vec = mesh[v];
			if( vec ) _this_cache[v] = vec.toArray();
			if( self.save_meshes_past ){
				if (mesh.past_states === undefined){
					mesh.past_states = {}
				}
				if (mesh.past_states[v] === undefined){
					mesh.past_states[v] = {}
				}
				
				mesh.past_states[v][now]  = vec.clone().toArray();
			}
		})
		self._scene_object_cache[i] = {_cache:_this_cache, ts : new Date().getTime()};
		
	})
	self.last_ts = now
	
}
SceneObject.prototype = Scene
module.exports = SceneObject