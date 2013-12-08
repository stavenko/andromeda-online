var fs    = require('fs');
var u = require('./utils.js');
var THR = require('./three.min.node.js');

var _     = require('underscore');

var Scene = {description: "Scene routines"}

if(typeof window === 'undefined'){
	Scene.THREE = THR // Saveing THREE.js as part of scene - this step could be done on a certain platform
	Scene.do_prepare_rendering = false
	Scene.ajax_load_models = false
	
}else{
	Scene.THREE = THREE
	Scene.do_prepare_rendering = true
	Scene.ajax_load_models = true
}




Scene.mesh_for = function(actor){
	//console.log(">>>",this.meshes()[this.scene.actors[actor].control.object_guid]);
	return this.meshes[this.actors[actor].control.object_guid]
}
Scene.create = function(){
	this.is_loaded = false
	
	return this;
}
/*function(){
	var objects_count = 10;
	var objs = []
	var vectors = ['pos', 'vel', 'acc',  'rot',    'avel', 'aacc'];
	var limits  = [100, 2,        0.1,     Math.PI, 0    ,   0];
	
	
	for(var c =0; c< objects_count; c++){	
		var obj = {
			"physical":{},
			"cameras":{
					"front":{
						"label":"main",
						"position": [0,0,0],
						"direction":[0,0,-1]
						},
					"back":{
							"label":"main",
							"position": [0,0,2],
							"direction":[0,0,1]
							}
						
			},
			'engines':{
				'rotation':{
					'x+':1,'x-':1,
					'y+':1,'y-':1,
					'z+':1,'z-':1
				},
				'propulsion':{
					'x+':1,'x-':1,
					'y+':1,'y-':1,
					'z+':10,'z-':10
				}
			},
			
			'mass': 10000,
			
			
			
			
			//"direction":[1,0,0],
			"model": "/models/StarCruiser.js"
		}
		if (c == 0) obj.direction = [0,0,-1]
		else obj.direction = [0,0,-1]
		
		for (var j =0; j < vectors.length; j++){
			var v = vectors[j]
			var vv = []
			for (var i = 0; i < 3; i++){
				vv[i] =  (Math.random() * limits[j]) - limits[j]/2
			}
			obj.physical[v] = vv;
		}
		
		objs.push(obj)
	}
	// Add pivot cubes
	poses = [[20,20,20], [20,-20,20], [-20,20,20], [-20,-20,20],
			 [20,20,-20], [20,-20,-20], [-20,20,-20], [-20,-20,-20],
	 ]
	 limits[1]=0
	for(var c =0; c< 8; c++){	
		var obj = {
			"physical":{},
			"cameras":
			{
					"front":{
						"label":"main",
						"position": [0,0,0],
						"direction":[0,0,-1]
						},
					"back":{
							"label":"main",
							"position": [0,0,0],
							"direction":[0,0,10]
							}
						
			},
			"direction":[1,0,0],
			mass:1000000,
			
			"model": "/models/sp.js"
		}
		for (var j =1; j < vectors.length; j++){
			var v = vectors[j]
			var vv = []
			for (var i = 0; i < objects_count; i++){
				vv[i] =  (Math.random() * limits[j]) - limits[j]/2
			}
			obj.physical[v] = vv;
		}
		obj.physical.pos = poses[c]
		
		objs.push(obj)
	}		
	
	var scene = {
		"actors":{"__":{
					 	"control": {"oid":0,"vp":"back"}
						}
				},
		"controllers":{
			"front":{"types":["turret", "launcher", 'pilot'], "camera": "front"},
			"back" :{"types":["turret", "launcher"], "camera": "back"}
		}
			}
				
	scene.objects = objs;
	this._scene = scene
	this.is_loaded = false;
	return this
}
	*/

Scene.create_from_world = function(globalx, globaly, globalz ){
	// globalx-y-z - galaxy coords with 1 meter accuracy
	var closest_scene_with_distance = this.get_closest_scene(globalx, globaly, globalz);
	// if closest_scene is not null - we must inject object with actors to that scene - it's already_loaded
	// else - We finding objects for that scene
				
	var objects_within_coords = this.get_objects_in(globalx, globaly, globalz)
	
	// creating scene
	
	this._scene = {coords :[ globalx, globaly, globalz ], actors:{}, GUID: u.make_guid(), objects:{} } 
	this.GUID = this._scene.GUID;
	
	// prepare actors - all of them would control object_id = 0, viewports - each for each
	
	
	// Injecting other objects
	var objects = {}
	// objects[for_object.GUID] = for_object;
	
	for ( var i = 0; i < objects_within_coords.length ; i++ ){
		objects[ objects_within_coords[i].GUID ] =   objects_within_coords[i];
	}
	_.extend(this._scene.objects, objects)
	
	return this
	
}
Scene.get_actors = function(){
	return this._scene.actors
}
Scene.get_closest_scene = function(){
	return undefined
}
Scene.get_objects_in = function(){
	return [];
}
Scene.join_object = function( object ){
	this._scene.objects[object.GUID] = object
}
Scene.join_actor = function( actor ){
	this._scene.actors[actor.login] = actor
	
	return this
	
}
Scene.set_from_json = function(object){
	this._scene = object
	this.GUID = object.GUID
}
Scene.controllable = function(login){
	return this.meshes[this.actors[login].control.object_guid]
}
Scene.load = function(onload, three_scene){
	// three scene - is a param for adding meshes to
	var self = this;
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
	_.each(json.objects, function( object,ix ){
		//console.log('looping')
		self.total_objects_count +=1;
		
		if (! self.ajax_load_models){
			var m = object.model_3d.split('/')[2];
			model_path= "./public/models/" + m
		}
		
		var rf = function(){
			var with_geom_and_mat = function(geom, mat){
				// console.log(mat)
				var m = new self.THREE.Matrix4()
				m.identity()
			
		
				var mesh = new self.THREE.Mesh( geom, mat );
				var object_rotated = false
				if ( object.physical ){
					for(i in object.physical){
						var _is = 'to' in object.physical[i]
						if (!_is){
							var v = new THREE.Vector3()
							v.set.apply(v, object.physical[i])
							mesh[i] = v
						
						}else{
							var p = new THREE.Vector3(object.physical[i].to[0], object.physical[i].to[1], object.physical[i].to[2])
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
					if (object.type !=='pivot'){
						var label = SpriteUtils.makeTextSprite("mesh: " + ix);
						label.position = new self.THREE.Vector3(0,0,0);
						mesh.add(label);
						console.log("added");
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
Scene._model_loaded = function(ix){
	if (this.loaded_objects_count == this.total_objects_count){
		// scene loaded
		this._loaded = true;
		if (this._call_back){
			this._call_back()
		}
		//console.log("DONE");
	}else{
		//console.log('not yet', this.loaded_objects_count , this.total_objects_count);
	}
}
Scene.get = function(){
	return this._scene
}
module.exports = Scene