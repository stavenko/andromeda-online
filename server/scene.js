var fs    = require('fs');
var u = require('./utils.js');
var THR = require('./three.node.js');

var _     = require('underscore');

var SceneObject = function(){
	this.description= "Scene routines"
	this.GUID =  u.make_guid();
	this._create();
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
	this._scene ={actors:{}, GUID: this.GUID, objects:{} } 
	
	
	// this.simulation_runs = false
	// console.log(this.clock);
	
}
Scene.update_from_world = function(globalx, globaly, globalz ){
	// globalx-y-z - galaxy coords with 1 meter accuracy
	var closest_scene_with_distance = this.get_closest_scene(globalx, globaly, globalz);
	// if closest_scene is not null - we must inject object with actors to that scene - it's already_loaded
	// else - We finding objects for that scene
				
	var objects_within_coords = this.get_objects_in(globalx, globaly, globalz) // Загрузка объектов в сцену из глобального мира
	
	var objects = {}
	for ( var i = 0; i < objects_within_coords.length ; i++ ){
		objects[ objects_within_coords[i].GUID ] =   objects_within_coords[i];
	}
	_.extend(this._scene.objects, objects)
	
	this._scene.sunDirection = [Math.random(),Math.random(),Math.random()]
	this._scene.sunLightColor = [Math.random(), 0.8, 0.9] // HSL
	this._scene.coords =[ globalx, globaly, globalz ]
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
	if (this._scene.actors[actor.login]){
		this._scene.actors[actor.login].push(actor)
	}else{
		this._scene.actors[actor.login] = [actor]
	}
	// console.log("GET OBJ",this._scene_obj_actors,  actor.control.object_guid)
	
	this._scene_obj_actors[actor.control.object_guid].push(actor)
	
	return this
	
}
Scene.set_from_json = function(object){
	this._scene = object
	// console.log("set from_json", object);
	
	this.GUID = object.GUID
	
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
		//console.log('looping')
		self.total_objects_count +=1;
		
		if (! self.ajax_load_models){
			var m = object.model_3d.split('/')[2];
			var model_path= "./public/models/" + m
		}
		// console.log(model_path);
		
		var rf = function(){
			var with_geom_and_mat = function(geom, mat){
				// console.log(geom.faces.length)
				var m = new self.THREE.Matrix4()
				m.identity()
			
		
				var mesh = new self.THREE.Mesh( geom, mat );
				mesh.type=object.type
				var object_rotated = false
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
							object_rotated = true;
						}
					}
				}else{
					var pi2 = Math.PI * 2;
					mesh.pos = new self.THREE.Vector3(Math.random() * 200, Math.random() * 200, Math.random() * 200);
					mesh.rot = new self.THREE.Vector3(Math.random() * pi2, Math.random() * pi2, Math.random() * pi2);
					mesh.avel = new self.THREE.Vector3(0,0,0)
					mesh.aacc = new self.THREE.Vector3(0,0,0)
					mesh.vel = new self.THREE.Vector3(0,0,0)
					mesh.acc = new self.THREE.Vector3(0,0,0)
					
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
	console.log(name);
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
		this._loaded = true;
		console.log("OK",  this._call_back);
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
	//var time_inc = 0;
	var time_left = self.clock.getDelta();
	self.time_inc += time_left;
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
					var p = m.pos;
					
					var r = m.rot;
					
					if (v){
						console.log(i, v.x, v.y, v.z)
						console.log(i, p.x, p.y, p.z)
						
					}
					//if (r){
					//	console.log(i, r.x, r.y, r.z)
					//}
					
				}
			}
			/*
			for(i in self.scene.actors){
				var a = self.scene.actors[i]
				console.log(a.control.object_guid);
				var m = self.scene.meshes[a.control.object_guid]
				var v = m.vel;
				if (v){
					console.log(i, v.x, v.y, v.z)
				}
			}
			*/
			
		}
		
	}else{
		self._d = false
	}
	
	_.each(self.meshes, function(mesh, i){
		if (mesh.type == 'static') return;
		// var mesh = self.meshes[i];
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
		mesh.position = mesh.pos;
		var _this_cache={}
		_.each(['position', 'rotation', 'vel', 'avel','acc', 'aacc'], function(v){
			var vec = mesh[v];
			if( vec ) _this_cache[v] = vec.toArray();
		})
		self._scene_object_cache[i] = _this_cache;
		
	})
}
SceneObject.prototype = Scene
module.exports = SceneObject