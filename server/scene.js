var fs    = require('fs');
var u = require('./utils.js');
var THR = require('./three.node.js');

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
	
}else{
	Scene.THREE = THREE
	Scene.do_prepare_rendering = true
	Scene.ajax_load_models = true
	Scene.need_update_matrix = false
	
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
Scene.load = function(onload, three_scene){
	// three scene - is a param for adding meshes to
	var self = this;
	//console.log('loading');
	
	self.meshes = {}
	self.loader =  new self.THREE.JSONLoader();
	self.total_objects_count = 0;
	self._call_back = onload;
	
	if(typeof window !== 'undefined'){
		self.three_scene = three_scene
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
			
		
				var mesh = new self.THREE.Mesh( geom, mat );
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
							var v = new self.THREE.Vector3()
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
					
					var uel = new THREE.Euler(mesh.rot.x, mesh.rot.y, mesh.rot.z);
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
	_.each(sync, function(object, guid){
		if (!(guid in self.meshes)) return;
		_.each(object, function(vec, name){
			if (name =='rotation'){
				var v = new self.THREE.Euler()
				
			}else{
				var v = new self.THREE.Vector3()
				
			}
			v.fromArray(vec)
			
			self.meshes[guid][name] = v
			
			
			
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
			console.log(ps);
			FA.splice(0, FA.length - 1);
			//console.log("TWO", ps);
		}
		else{ // одна сила в списке - действует до сих пор
			var F = FA[0].vec.clone()
			var acts_since = FA[0].ts
			
			//console.log(now - last_ts);
			if(acts_since < last_ts){ acts_since = last_ts }
			var time = (now - acts_since)/1000;
			// console.log(time, now - acts_since );
			if (F.length() === 0){
				FA.splice(0,1);
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
		
		//mesh.total_powers = [ mesh.total_powers[mesh.total_powers.length] ]
		
		//console.log(mesh);
		//if(PI.length >0){
		//	vsdfsadf.sdfsdf.sdfsdfsdf = 1
		//}
		// console.log("F", PI);
		//var rots = new self.THREE.Vector3(0,0,0)
		//var poses = new self.THREE.Vector3(0,0,0)
		//console.log("PI", PI, mesh.total_powers);
		// console.log("IMP", mesh.impulse, poses, mesh.pos )
		// mesh.avel = mesh.angular_impulse.clone().multiplyScalar(um);
		mesh.vel = mesh.impulse.clone().multiplyScalar(um);
		
		//mesh.rot.add(rots)
		mesh.rotateX(rots.x)
		mesh.rotateY(rots.y)
		mesh.rotateZ(rots.z);
		
		//console.log(mesh.guid, "POSES to ADD", poses)
		// mesh.pos.add(poses);
		mesh.position.add(poses);
		
		
		// var mesh = self.meshes[i];
		/*
		if(mesh.has_engines){
			total_acc = new self.THREE.Vector3(0,0,0);
			
			for (var j = 0; j < mesh.on_engines_propulsion.length; j++){
			
				var engine = mesh.on_engines_propulsion[j]
				var axis = engine[0] == 'x'?new self.THREE.Vector3(1,0,0):(engine[0] =='y'?new self.THREE.Vector3(0, 1, 0): new self.THREE.Vector3(0,0,1))
				var dir  = engine[1] == '+'?1:-1
				var acc = mesh.engines.propulsion[engine] / mesh.mass
				axis.multiplyScalar(acc).multiplyScalar(dir).applyQuaternion(mesh.quaternion);
				total_acc.add(axis)
			}
			if(mesh.vel === undefined)mesh.vel = new self.THREE.Vector3(0,0,0)
			mesh.vel = total_acc.clone().multiplyScalar(time_left).add(mesh.vel) 
			mesh.pos = total_acc.clone().multiplyScalar(time_left * time_left)
					       .add(mesh.vel.clone().multiplyScalar(time_left))
						   .add(mesh.pos);
				   
			var total_aacc = new self.THREE.Vector3(0,0,0)
			// console.log(mesh.on_engines_rotation);
			for(var j =0; j < mesh.on_engines_rotation.length; j++){
				// console.log("WTF");
				var engine = mesh.on_engines_rotation[j]
				var axis = engine[0] == 'x'?new self.THREE.Vector3(1,0,0):(engine[0] =='y'?new self.THREE.Vector3(0, 1, 0): new self.THREE.Vector3(0,0,1))
				var dir  = engine[1] == '+'?1:-1
				var aacc = mesh.engines.rotation[engine] / mesh.mass
				axis.multiplyScalar(aacc).multiplyScalar(dir)
				total_aacc.add(axis)
			}
			if(mesh.avel === undefined) mesh.avel = new self.THREE.Vector3(0,0,0)
			// console.log(mesh.avel)
			mesh.avel = total_aacc.clone().multiplyScalar(time_left).add(mesh.avel)
			mesh.rot  = total_aacc.clone().multiplyScalar(time_left * time_left)
					       .add(mesh.avel.clone().multiplyScalar(time_left))
			mesh.rotateX(mesh.rot.x)
			mesh.rotateY(mesh.rot.y)
			mesh.rotateZ(mesh.rot.z);
		
		}else{
			// console.log(mesh.pos);
			if (mesh.vel){
				mesh.pos =mesh.vel.clone().multiplyScalar(time_left).add(mesh.pos);
			}
			
			
		}
		*/ 
		var _this_cache={}
		_.each(['position', 'rotation', 'impulse', 'angular_impulse'], function(v){
			var vec = mesh[v];
			if( vec ) _this_cache[v] = vec.toArray();
		})
		self._scene_object_cache[i] = _this_cache;
		
	})
	self.last_ts = now
	
}
SceneObject.prototype = Scene
module.exports = SceneObject