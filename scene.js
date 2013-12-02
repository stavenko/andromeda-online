var THREE = require('./three.min.node.js');
var _     = require('underscore');
var fs    = require('fs')

var Scene = {description: "Scene routines"}

Scene.create = function(){
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
							"direction":[0,0,100]
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
	return this
}
Scene.load = function(cb){
	var self = this;
	self.meshes = []
	self.loader =  new THREE.JSONLoader();
	self.total_objects_count = 0;
	self._call_back = cb;
	
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
	
	self.loaded_objects_count = 0;
	
	self.actors = json.actors;
	self.loaded_objects_count = 0
	
	//console.log(self.actors);
	_.each(json.objects, function( object,ix ){
		//console.log('looping')
		self.total_objects_count +=1;
		var m = object.model.split('/')[2];
		model_path= "./public/models/" + m
		// 
		var rf = function(){
			fs.readFile(model_path, function(err,data){
				//console.log("start loading");
				if(err) throw err;
				var json = JSON.parse(data)
		        var result = self.loader.parse( json, '' );
		
				var ld = (function(){
					var material = new THREE.MeshFaceMaterial( result.materials );
			
					var m = new THREE.Matrix4()
					m.identity()
			
					var mesh = new THREE.Mesh( result.geometry, material );
			
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
			
					self.meshes[ix] = mesh;
					self.loaded_objects_count +=1;
					self._model_loaded( ix )
					// console.log('ok loaded ', ix)
			
				});
				setTimeout(ld,200);
		
			
			})
		}
		setTimeout(rf,500)
		//loader.load( object.model, function(geom, mat){
			//console.log('loaded from net')
			
			// console.log('model loaded');
			//});
	})
			
	
	
}
Scene._model_loaded = function(ix){
	if (this.loaded_objects_count == this.total_objects_count){
		// scene loaded
		if (this._call_back){
			this._call_back()
		}
		//console.log("DONE");
	}else{
		//console.log('not yet');
	}
}
Scene.get = function(){
	return this._scene
}
module.exports = Scene