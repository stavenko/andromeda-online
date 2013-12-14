;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
Scene = require('./scene.js')
Missoion = require('./missions.js')
Utils = require('./utils.js')
SpriteUtils = require('./sprite_utils.js')
Controller = require('./controller.js')



},{"./controller.js":6,"./missions.js":3,"./scene.js":2,"./sprite_utils.js":5,"./utils.js":4}],4:[function(require,module,exports){
var Utils = {
	
	make_guid :function(){
		var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		    return v.toString(16);
		});
		return guid;
	}
}
module.exports = Utils;
},{}],5:[function(require,module,exports){
var Mod = {
	 makeTextSprite:function( message, parameters ){
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
		this.roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
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
	},
	roundRect:function(ctx, x, y, w, h, r) 
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
}
module.exports=Mod
},{}],7:[function(require,module,exports){

},{}],8:[function(require,module,exports){
// nothing to see here... no file methods for the browser

},{}],9:[function(require,module,exports){
var Utils = {
	
	make_guid :function(){
		var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		    return v.toString(16);
		});
		return guid;
	}
}
module.exports = Utils;
},{}],2:[function(require,module,exports){
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
	
	this._scene.sunDirection = [0,1,0]
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
		console.log('loading looping')
		self.total_objects_count +=1;
		
		if (! self.ajax_load_models){
			var m = object.model_3d.split('/')[2];
			var model_path= "./public/models/" + m
		}
		// console.log(model_path);
		
		var rf = function(){
			var with_geom_and_mat = function(geom, mat){
				console.log("with_g & mat")
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
		this.is_loaded = true;
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
},{"./three.node.js":7,"./utils.js":4,"fs":8,"underscore":10}],3:[function(require,module,exports){
var Scene = require('./scene.js')
var u = require('./utils.js')
var _     = require('underscore');


var Mission = function(){
	this.descr = "Mission"
	
}
Mission.prototype = {
	constructor: Mission,
	


	create :function(creator_login, callback){
	
		// No params - only one mission available
		var self = this ;
		this.GUID = u.make_guid();
		this.creator = creator_login;
		this.ready_to_start = false
		this._total_actors = 0;
		this._total_logins = 0;
		var p1 = [-110, 100, 40];
		var p2 = [500, 200, -50];
		var c = 0.2
		var p1 = _.map(p1,function(v){return v*c});
		var p2 = _.map(p2,function(v){return v*c});;
	
		var def_ship1 = {type:'ship',
						 "ship_type":"Default",
							 model_3d:'/models/StarCruiser.js',
							 physical:{
								 pos:p1,
								 rot:{to: p2},
							 },
						 
							 "cameras":{
									"front":{
										"label":"main",
										"position": [0,0.5,0],
										"direction":[0,0,-1]
										},
									"back":{
											"label":"main",
											"position": [0,0.5,2],
											"direction":[0,0,1]
											}
										},
										"turrets":{
											"front":{"type":"ballistic",
													 "position": [0,0.5,0]},
			 								"back":{"type":"ballistic",
			 										 "position": [0,0,2]}

										},
										"workpoints":{
											"Piloting":{
													"views": ["front","back"],
													"type":"pilot",
													},
											"Front turret":
													{
													"views":["front"],
													"type":"turret",
													"turret":"front"
													},
										
											"Back turret":{
													"views":["back"],
													"type":"turret",
													"turret":"back"
										
													},
										
							
												},
							'engines':{
								'rotation':{
									'x+':1000,'x-':1000,
									'y+':1000,'y-':1000,
									'z+':1000,'z-':1000
								},
								'propulsion':{
									'x+':1,'x-':1,
									'y+':1,'y-':1,
									'z+':5000,'z-':5000
								}
							},
							'mass': 10000,
							'GUID':u.make_guid()
						}
		var def_ship2 = {type:'ship',
	 					 "ship_type":"Default",
		
							 model_3d:'/models/StarCruiser.js',
							 physical:{
								 pos:p2,
								 rot:{to: p1},
							 
							 },
				 			"cameras":{
				 					"front":{
				 						"label":"main",
				 						"position": [0,0.5,0],
				 						"direction":[0,0,-1]
				 						},
				 					"back":{
				 							"label":"main",
				 							"position": [0,0.5,2],
				 							"direction":[0,0,1]
				 							}
										},
										"turrets":{
											"front":{"type":"ballistic",
													 "position": [0,0.5,0]},
			 								"back":{"type":"ballistic",
			 										 "position": [0,0,2]}

										},
										"workpoints":{
											"Piloting":{
													"views": ["front","back"],
													"type":"pilot",
													},
											"Front turret":
													{
													"views":["front"],
													"type":"turret",
													"turret":"front"
													},
										
											"Back turret":{
													"views":["back"],
													"type":"turret",
													"turret":"back"
										
													},
										
							
												},
				 			'engines':{
				 				'rotation':{
				 					'x+':1000,'x-':1000,
				 					'y+':1000,'y-':1000,
				 					'z+':1000,'z-':1000
				 				},
				 				'propulsion':{
				 					'x+':1,'x-':1,
				 					'y+':1,'y-':1,
				 					'z+':5000,'z-':5000
				 				}
				 			},
				 			'mass': 10000,
							'GUID':u.make_guid()
						}
		// Жестко заданные кораблики - без позиций и скоростей	
		var pivot= 	function(x,y,z){
			return {type:'static',
			
							 model_3d:'/models/sp.js',
							 physical:{
								 pos:[x, y, z]
								 //rot:{to: [-110, 100, 40]},
							 
							 },
				 			'mass': 1000000,
							'GUID':u.make_guid()
						}
		}
		this._dh2 = def_ship2; // Сохраняем кораблик - потому что пока пользователь не выбирает корабль - он ему назначается		
		var so = {}
		_.each([def_ship1,def_ship2], function(s){
			so[s.GUID] = s
		})
		// Здесь мы просто наполняем сцены шариками - по уму, эти шарики надо создавать не здесь - а инжектить из мира
		/*
		var inc = 0
		var step = 200;
		for (var x=-200; x<= 200; x+=step){
			for (var y=-200; y<= 200; y+=step){
				for (var z=-200; z<= 200; z+=step){
					//console.log(inc,"x,y,z",x,y,z)
					inc +=1;
					var p =pivot(x,y,z)
					so[p.GUID] = p
				}
			}
		}*/
		// --- Наполнение сцены
		var mission = {
			actors : {},
			commands:['red', 'blue'],
			_commands_amount:[1,0],
			max_per_command:1,
			min_per_command:1,
			coords : [100, 500, 300], // Global coords of mission origin
			shared_objects: so,
			objects_for_command:{"red":[def_ship1.GUID],"blue":[def_ship2.GUID]}
			
		}
		self._mission_logins = [];
		self._mission_objects = {}
		self.mission = mission
		self._mission_ready = function(){
			// console.log('ok - launching')
			// var scene = self.prepare_scene()
			// callback (scene)
		
		
		}
		// self.prepare_scene();
		return this
	},
	prepare_scene : function(){
	
		// console.log(Scene);
		if(! this._scene_loaded){
			console.log("DO PREP SCENE")
			this._scene = new Scene();
			//create_from_world(this.mission.coords[0],
			//										this.mission.coords[1],
			//										this.mission.coords[2] );
			var self = this;
			_.each(this.mission.shared_objects, function(obj){
				self._scene.join_object(obj)
	
			})										
			_.each(this.mission.actors, function(as, login){ // Миссия до этого времени не имела сцены - надо дать её каждому актору здесь
				//console.log(a)
				_.each(as, function(a){ // По логину находится массив акторов
					a.scene = self._scene.GUID
					self._scene.join_actor(a);
				})
			})
			this._scene.update_from_world(this.mission.coords[0],
													this.mission.coords[1],
													this.mission.coords[2] )
			this._scene_loaded= true;
		}
		
							
	},
	join_player :function(login, command, object_guid, place){
		var self = this;
		var M = self.mission;
		var command;
		// Get first available command
		// console.log("LOGIN", login)
		if (self._mission_objects[object_guid] === undefined){
			self._mission_objects[object_guid] = {}
		}
		//_.each(places, function(p){ // Этот кэш используется при заполнении мест на корабли
			self._mission_objects[object_guid][place] = login;
			
			//})
		// TODO Здесь надо вставлять игроков - независимо от того, сколько логинов
		// TODO Надо проверять наличие логинов и если есть - не тупо добавлять, а добавлять ему воркпоинт
		// По занятым воркпоинтам сичтать готовность
		var controllable = {object_guid:object_guid, workpoint:place} // viewport:'front', controls:['Pilot', 'Turret']} 
		
		var actor = {command:command, login:login, control: controllable}
		// Добавляем актора - индексируя по логину
		if (self.mission.actors[login] === undefined){
			self.mission.actors[login] = [actor]
		}else{
			self.mission.actors[login].push(actor)
		}
		
		self._total_actors += 1
		if(self._total_actors >= 2){
			console.log("LOGINS", self._mission_logins);
			self.ready_to_start = true;
		}else{
			console.log("TOTAL_ACTORS", self._total_actors);
		}
		
		console.log("TA",self._total_actors);
		// console.log("ACTORS", self.mission.actors);
		if (self._scene){
			actor.scene = self._scene.GUID
			self._scene.join_actor(actor)
		}
	
	},
	positions: function(cb){
		var self = this;
		//console.log(this);
		var places = [];
		_.each(self.mission.commands, function(command){
			_.each(self.mission.objects_for_command[command], function(object_guid){
				// console.log(command, self.mission.shared_objects);
				var object = self.mission.shared_objects[object_guid]
				_.each(object.workpoints, function(workpoint, wp_label){
					
					
					var place = {'command':command,
					 			 'object_type': object.type,
								 'ship_type':object.ship_type,
								 'object_guid': object.GUID,
							 	 'workpoint':wp_label,
								 
							 }
 					var o = self._mission_objects[object.GUID]
 					if(o){
						var l = o[wp_label];
						// console.log("LLLL",l)
						if(l){
	 							place.busy = true
								place.actor = l;
								
						}else{place.busy = false}
		
 					}
		
								 
					places.push(place)
					//console.log(place)
					
				})
				
				
			})
			
		})
		cb(places);
	}
	
}
//console.log(Mission);
module.exports = Mission
},{"./scene.js":2,"./utils.js":4,"underscore":10}],6:[function(require,module,exports){
var THR = require('./three.node.js');
var Utils = require("./Utils.js");
var _     = require('underscore');


var Controller = {description:'controller'}
	
	
Controller.NetworkActor =   function(scenes, socket, onAct){
		
		var map = Controller.ControllersActionMap()
		var self = this;
		
		socket.on('player_controls_on', function(data){
			var actor = data.actor;
			var action = data.action;
			var S = scenes[actor.scene];
			console.log("PPLAY CONTOL", actor);
			self.act(S, action, true, actor)
		
		})
	
		socket.on('player_controls_off', function(data){
			// console.log('ok recv', data)
			var actor = data.actor
			var action = data.action;
			
			var S = scenes[actor.scene];
			self.act(S, action, false, actor)
		
		})
		this.run = function(){
			// no need to bother - event style
		}
		this.act=function(S, action, is_on, actor){
			//var C = W.meshes[ W.actors[actor].control.object_guid ]
			// console.log(action)
			console.log("SCENES",scenes, actor.scene);
		
			var _a = map[action.type].act(S, action, is_on, actor, onAct);
		
		}
		return this;
	};
Controller.LocalInputActor = function(W, socket){
		var self = this;
		self.World = W;
		var map = Controller.ControllersActionMap()
		var actor = W.login;
		
		
		//self.actor_login = actor_login
		self._default_actions={
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
		
			'lmouse':{'type': 'shoot_primary', '_turret_direction': function(t,k){
				delete t[k]
				// console.log("w")
				console.log(W.controllable());
				t[k.substr(1)] = W.mouse_projection_vec.clone().sub(W.controllable().position.clone() )
			}},
		}
	
		self.actions = self._default_actions;
		this.input = function(keycode, up_or_down, modifiers){
			// 1. Send to server action
			var action = _.clone(self.actions[keycode]);
			
			// console.log(action);
			if (action){
				_.each(action, function(item, k){
					// console.log('a');
					if (k[0] == '_'){
						item(action,k)
					}
				})
				//console.log(action);
				// DONE
				// 2. Act it locally
				var onAct = function(){ console.log('this is keyboard controller - no need in onAct here') }
				local_controller = map[action.type]
				var actors = W.get_main_viewport().actors
				
				_.each(actors, function(actor){
					var S = W.scenes[actor.scene];
					var obj = S.get_objects()[actor.control.object_guid];
					var wp = obj.workpoints[actor.control.workpoint];
					if (wp.type == local_controller.type){
						local_controller.act(self.World.scenes[actor.scene], action, up_or_down, actor, onAct);
						// console.log(action);
						
						if (up_or_down){
							socket.emit('control_on', {action:action, actor:actor});
						}else{
							socket.emit('control_off', {action:action, actor:actor});
			
						}
						
					}
					//console.log(wp);
					
				})
				
				// local_controller.act(self.World.scene, action, up_or_down, actor, onAct);
			}
			//DONE
		}
	};


Controller.CPilotController = function(){
		this.type='pilot';
		this.action_types=['rotate', 'move']
		function get_axis(a){
			if(a == 'x'){
				axis = new Controller.T().Vector3(1,0,0)
			}
			if(a == 'y'){
				axis = new Controller.T().Vector3(0,1,0)
			}
			if(a == 'z'){
				axis = new Controller.T().Vector3(0,0,1)
			}
			return axis
		
		
		}
	
		this.act = function(S, action, is_down, actor, onAct ){
			// console.log('Wat');
			// console.log("move by", actor)
			//if (actor === undefined){
				//console.log("MY", W.actors[W.login].control.object_guid)
			//	var C = S.controllable()
			//}else{
			var C = S.mesh_for(actor)
			var T = Controller.T();
			
				//}

	

	
			if (action.type == 'rotate'){
				var a = action.dir == '+'?1:-1;
		
				if (is_down){
					C.put_on("rotation", action.axis+action.dir)
				}else{
					C.put_off("rotation", action.axis+action.dir)
				}
			}
			if (action.type == 'move'){
		
				var a = action.dir == '+'?1:-1;
		
				var m = new Controller.T().Matrix4()
				if (is_down){
					C.put_on("propulsion", action.axis + action.dir)
				}else{
					C.put_off("propulsion", action.axis + action.dir)
				}
			}
	
			//if (action.type == 'rotatec'){
			//	var a = action.dir == '+'?1:-1;
			//	var ag = a * 0.1;
			//	var axis = get_axis(action.axis);
			//	var _q = new T.Quaternion();
			//	_q.setFromAxisAngle( axis, ag );
			//	W.camera.quaternion.multiply( _q );
			//	W.setCamera();
			//}
			onAct(C.GUID)
		}
		// return this;
	
	};


Controller.basicAutoPilotActor=function (S, id, oid){
		this.targets = ["orbit_object", "close_to_object"];
		this.default_distance = 200
		this.get_foes = function(){
			this.foes = []
			for (var i =0; i < W.meshes.length; i++){
				if(i != id) foes.push({id:id, obj:W.meshes[i]})
			}
		}
	};
Controller.BasicBulletActor=function(S, id, coid){ 
		// id = is object in the world controllable by this actor
		// coid  MUST BE an object, who shoot this bullet
		//var S = W.scene
		this.name = "Basic_actor_" + (new Date().getTime())
		// this.W;
		this.oid = id
		this.coid = coid
		// console.log(id);
		this.my_mesh = S.meshes[id]
		//console.log("MY MESH", this.my_mesh, id)
		var self = this;
		// console.log(W.meshes, id, W.meshes.length)
		var total_time_in_space = 0;
		var _possible_targets = {};
		var T = Controller.T();
	
		this.run = function(time_left){
			total_time_in_space += time_left
			//console.log('running');
			if (total_time_in_space > 10){
				//S.meshes.splice(id, 1)
				//console.log("removing")
				S._delete_object(id)
				delete S.automatic_actors[this.name];
			}
			var vel = this.my_mesh.vel.clone();
			var mpos = this.my_mesh.position.clone();
		
			var thres = 4 * this.my_mesh.vel.length();
			var in_thres = [];
			//console.log("THRes", thres);
		
			_.each( S.meshes, function(m,i) {
				if(i === id || i === coid) return;
				if(m.is_not_collidable) return;
				// var m = W.meshes[i];
				var mp =  m.position.clone();
				var pd = mp.sub( mpos )
				var ag = Math.acos(pd.dot(vel)/ vel.length() / pd.length()) // угол между направлением движения и центром объекта
				if (ag < Math.PI/16)
				{
					//console.log('ag');
					// console.log("HH", i, ag, Math.PI/8);
				
					// console.log("id vefore", 	id, );
					var sub = self.my_mesh.position.clone().sub( mp );
					
					var dist = sub.length()
					if( dist < thres){
						//console.log("OKE");
						if( in_thres.indexOf( i ) === -1 ){
							//console.log('possible');
						
							in_thres.push(i) // Add mesh index
							target = {last_point :mpos.clone(),
									  last_angle : ag,
									  last_distance : dist,
									  angle_raise : 0,
									  distance_raise :0,
									  distance_shortens : 0,
									  angle_lowers : 0,
								  	  id : i}
							_possible_targets[i] = target
						}//else{}
					}
					
				}else{
					if(i in _possible_targets){
						//console.log('POS', i)
						// Угол был острый - стал тупой
						// console.log("here!",i);
						// Надо проверить, не пересекает ли отрезок - прошлые координаты - текущие координаты наш меш
						var direction = mpos.clone().sub( _possible_targets[i].last_point)
						var ray = new T.Raycaster(_possible_targets[i].last_point, direction.clone().normalize() )
						if(S.need_update_matrix){
							m.updateMatrixWorld();
						}
						var isr = ray.intersectObjects([m])
						//if (m.type == 'ship'){
							
							// console.log("matrix autoupd", m.matrixWorld.elements)
							// console.log(mpos);
							// console.log(ray,isr)
							
							//}
						
						//console.log( m.type )
						if (isr.length > 0 && isr[0].distance < direction.length() ){
							//for( var index =0; index<isr.length; index++){
							//	console.log("HERE", isr[index].distance, direction.length())
							///}
					
							console.log('hit')
							// console.log("END", isr[0].point);
							m.worldToLocal(isr[0].point) // Теперь это плечо удара
							var impulse = vel.clone().multiplyScalar(self.my_mesh.mass)
							var axis = new T.Vector3().crossVectors(isr[0].point, impulse)
					
							var ag = Math.acos(isr[0].point.clone().dot(impulse) / impulse.length() / isr[0].point.length() )
							// Теперь это вращение надо разбить по осям
							var mat = new T.Matrix4().makeRotationAxis(axis.normalize(), ag)
							var eul = new T.Euler()
							eul.setFromRotationMatrix(mat, "XYZ")
							// console.log(i, eul)
							var avel = new T.Vector3();
							avel.x = eul.x;
							avel.y = eul.y;
							avel.z = eul.z;
							var ck = isr[0].point.length() * Math.sin(ag - Math.PI/2)
					
							// console.log(this.my_mesh.mass / m.mass * (ck * ck ));
							avel.multiplyScalar(self.my_mesh.mass/m.mass * Math.abs(ck))
					
							// Не учитываю массу и плечо... 
							var mavel = S.meshes[i].avel
							if (! mavel ){mavel = new T.Vector3(0,0,0)}
							mavel.x += avel.x
							mavel.y += avel.y
							mavel.z += avel.z;
							// console.log(mavel.x, mavel.y, mavel.z)
							S.meshes[i].avel = mavel;
					
					
					
							add_vel = impulse.multiplyScalar( 1/ m.mass);
							// console.log(add_vel)
							// Убрать пока скорость
							if (S.meshes[i].vel){
								S.meshes[i].vel.add(add_vel);
							}
					
					
							//console.log("END LOCAL", isr[0].point);
							//console.log('oke, we shoot it:', i)
							// Now we will just remove object from scene with the bullet
							//W.scene.remove(W.meshes[i])
							S._delete_object(id)
							
							//if(S.three_scene){
							//	S.three_scene.remove(S.meshes[id]) // удяляем ядро из сцены
							//}
							//delete S.meshes[ id ]; // ... из мешей
							delete S.actors[self.name]; // ... Удаляем этого актора - больше не загрузится эта функция
					
							//W.meshes.splice(i, 1);
							delete _possible_targets[i] // ... из возможных целей удаляем этот меш
							// bla.bla = 1
						}else{
							delete _possible_targets[i];
						
						}
					}
					// console.log( ag, Math.PI/8);
				
				}
			
			})
			//bla.bal +=1
			//console.log(bla)
		
		
			// console.log(total_time_in_space ,W.meshes.length, W.actors)
		}
	
	
	};
	
Controller.CTurretController = function(){
	this.type = 'turret';
		this.act = function(S, action, is_down, actor ){
			if (action.type =='shoot_primary'){
				// var weapon = C.weapons[0];
				//console.log("shot by", actor)
				var T = Controller.T();
				//if (actor === undefined){
					// console.log("MY", W.get_current_actor().control.object_guid)
				//	var C = S.meshes[ W.get_actor(actor).control.object_guid ]
				//}else{
				//console.log(actor, action);
				var C = S.meshes[actor.control.object_guid]
				
					//}
				if (action.turret_direction instanceof T.Vector3){
					var mpv = action.turret_direction
				
				}else{
					var mpv = new T.Vector3(action.turret_direction.x,
												action.turret_direction.y,
												action.turret_direction.z)
				}
				mpv.multiplyScalar(0.5000);
				//console.log('TH', Controller.T())
				
				var bullet = Controller.createShotParticle();
				bullet.pos = new T.Vector3()
				bullet.pos = C.position.clone()
			
				bullet.has_engines = false;
				bullet.is_not_collidable = true;
				bullet.vel = mpv//.multiplyScalar(0.10);
				bullet.mass = 1;
				if ( typeof window !== 'undefined'){
					S.three_scene.add( bullet );
				}
				B_GUID = Utils.make_guid()
				S.meshes[B_GUID] =  bullet ;
			
				var bullet_actor = new Controller.BasicBulletActor(S, B_GUID, C.GUID)
				S.automatic_actors[bullet_actor.name] = bullet_actor;
				// console.log(W.scene.automatic_actors);
			
			
			}
		}
		// return this;
	
	};
Controller.ControllersActionMap= function(){
		if (this._ControllersActionMap){
			return this._ControllersActionMap
		}else{
			var PilotController = new Controller.CPilotController();
			var TurretController = new Controller.CTurretController()
			this._ControllersActionMap = {
				'move': PilotController,
				'rotate':PilotController,
				'rotatec': PilotController,
				'shoot_primary': TurretController
			} 		
			return this._ControllersActionMap;
			
		}
	}

if(typeof window === 'undefined'){
	Controller.T = function(){
		return THR
	};
	Controller.createShotParticle=function(){
		var T = this.T();
		//var cubeGeometry = new T.CubeGeometry(1,1,1,1,1,1);
		//var map	= T.ImageUtils.loadTexture( "/textures/lensflare/lensflare0.png" );
		//var SpriteMaterial = new T.SpriteMaterial( { map: map, color: 0xffffff, fog: true } );
		return new T.Object3D();
	};

}else{
	Controller.T = function(){
		return THREE
	};
	Controller.createShotParticle=function(){
		var T = this.T();
		// var cubeGeometry = new T.CubeGeometry(1,1,1,1,1,1);
		var map	= T.ImageUtils.loadTexture( "/textures/lensflare/lensflare0.png" );
		var material = new T.SpriteMaterial( { map: map, color: 0xffffff, fog: true } );
		material.transparent = true;
		material.blending = THREE.AdditiveBlending;
		
		return new T.Sprite(material);
	};
	
}


module.exports = Controller
//var TurretController = new CTurretController()
//CPilotController.prototype = {constructor:CPilotController}
//var PilotController = new CPilotController();

//console.log(TurretController.act, PilotController.act)

},{"./Utils.js":9,"./three.node.js":7,"underscore":10}],10:[function(require,module,exports){
//     Underscore.js 1.5.2
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.5.2';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? void 0 : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed > result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array, using the modern version of the 
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from an array.
  // If **n** is not specified, returns a single random element from the array.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (arguments.length < 2 || guard) {
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, value, context) {
      var result = {};
      var iterator = value == null ? _.identity : lookupIterator(value);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n == null) || guard ? array[0] : slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) {
      return array[array.length - 1];
    } else {
      return slice.call(array, Math.max(array.length - n, 0));
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, "length").concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error("bindAll must be passed function names");
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;
    return function() {
      context = this;
      args = arguments;
      timestamp = new Date();
      var later = function() {
        var last = (new Date()) - timestamp;
        if (last < wait) {
          timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) result = func.apply(context, args);
        }
      };
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvYXpsL0RvY3VtZW50cy93b3Jrc3BhY2UvYXotYXoucnUvc2VydmVyL2VudHJ5LmpzIiwiL1VzZXJzL2F6bC9Eb2N1bWVudHMvd29ya3NwYWNlL2F6LWF6LnJ1L3NlcnZlci91dGlscy5qcyIsIi9Vc2Vycy9hemwvRG9jdW1lbnRzL3dvcmtzcGFjZS9hei1hei5ydS9zZXJ2ZXIvc3ByaXRlX3V0aWxzLmpzIiwiL1VzZXJzL2F6bC9Eb2N1bWVudHMvd29ya3NwYWNlL2F6LWF6LnJ1L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5LWV4cHJlc3Mvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvX2VtcHR5LmpzIiwiL1VzZXJzL2F6bC9Eb2N1bWVudHMvd29ya3NwYWNlL2F6LWF6LnJ1L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5LWV4cHJlc3Mvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItYnVpbHRpbnMvYnVpbHRpbi9mcy5qcyIsIi9Vc2Vycy9hemwvRG9jdW1lbnRzL3dvcmtzcGFjZS9hei1hei5ydS9zZXJ2ZXIvVXRpbHMuanMiLCIvVXNlcnMvYXpsL0RvY3VtZW50cy93b3Jrc3BhY2UvYXotYXoucnUvc2VydmVyL3NjZW5lLmpzIiwiL1VzZXJzL2F6bC9Eb2N1bWVudHMvd29ya3NwYWNlL2F6LWF6LnJ1L3NlcnZlci9taXNzaW9ucy5qcyIsIi9Vc2Vycy9hemwvRG9jdW1lbnRzL3dvcmtzcGFjZS9hei1hei5ydS9zZXJ2ZXIvY29udHJvbGxlci5qcyIsIi9Vc2Vycy9hemwvRG9jdW1lbnRzL3dvcmtzcGFjZS9hei1hei5ydS9ub2RlX21vZHVsZXMvdW5kZXJzY29yZS91bmRlcnNjb3JlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBOztBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOWVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3ZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIlNjZW5lID0gcmVxdWlyZSgnLi9zY2VuZS5qcycpXG5NaXNzb2lvbiA9IHJlcXVpcmUoJy4vbWlzc2lvbnMuanMnKVxuVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzLmpzJylcblNwcml0ZVV0aWxzID0gcmVxdWlyZSgnLi9zcHJpdGVfdXRpbHMuanMnKVxuQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vY29udHJvbGxlci5qcycpXG5cblxuIiwidmFyIFV0aWxzID0ge1xuXHRcblx0bWFrZV9ndWlkIDpmdW5jdGlvbigpe1xuXHRcdHZhciBndWlkID0gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbihjKSB7XG5cdFx0ICAgIHZhciByID0gTWF0aC5yYW5kb20oKSoxNnwwLCB2ID0gYyA9PSAneCcgPyByIDogKHImMHgzfDB4OCk7XG5cdFx0ICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcblx0XHR9KTtcblx0XHRyZXR1cm4gZ3VpZDtcblx0fVxufVxubW9kdWxlLmV4cG9ydHMgPSBVdGlsczsiLCJ2YXIgTW9kID0ge1xuXHQgbWFrZVRleHRTcHJpdGU6ZnVuY3Rpb24oIG1lc3NhZ2UsIHBhcmFtZXRlcnMgKXtcblx0XHRpZiAoIHBhcmFtZXRlcnMgPT09IHVuZGVmaW5lZCApIHBhcmFtZXRlcnMgPSB7fTtcblx0XG5cdFx0dmFyIGZvbnRmYWNlID0gcGFyYW1ldGVycy5oYXNPd25Qcm9wZXJ0eShcImZvbnRmYWNlXCIpID8gXG5cdFx0XHRwYXJhbWV0ZXJzW1wiZm9udGZhY2VcIl0gOiBcIkFyaWFsXCI7XG5cdFxuXHRcdHZhciBmb250c2l6ZSA9IHBhcmFtZXRlcnMuaGFzT3duUHJvcGVydHkoXCJmb250c2l6ZVwiKSA/IFxuXHRcdFx0cGFyYW1ldGVyc1tcImZvbnRzaXplXCJdIDogMTg7XG5cdFxuXHRcdHZhciBib3JkZXJUaGlja25lc3MgPSBwYXJhbWV0ZXJzLmhhc093blByb3BlcnR5KFwiYm9yZGVyVGhpY2tuZXNzXCIpID8gXG5cdFx0XHRwYXJhbWV0ZXJzW1wiYm9yZGVyVGhpY2tuZXNzXCJdIDogNDtcblx0XG5cdFx0dmFyIGJvcmRlckNvbG9yID0gcGFyYW1ldGVycy5oYXNPd25Qcm9wZXJ0eShcImJvcmRlckNvbG9yXCIpID9cblx0XHRcdHBhcmFtZXRlcnNbXCJib3JkZXJDb2xvclwiXSA6IHsgcjowLCBnOjAsIGI6MCwgYToxLjAgfTtcblx0XG5cdFx0dmFyIGJhY2tncm91bmRDb2xvciA9IHBhcmFtZXRlcnMuaGFzT3duUHJvcGVydHkoXCJiYWNrZ3JvdW5kQ29sb3JcIikgP1xuXHRcdFx0cGFyYW1ldGVyc1tcImJhY2tncm91bmRDb2xvclwiXSA6IHsgcjoyNTUsIGc6MjU1LCBiOjI1NSwgYToxLjAgfTtcblxuXHRcdC8vdmFyIHNwcml0ZUFsaWdubWVudCA9IFRIUkVFLlNwcml0ZUFsaWdubWVudC50b3BMZWZ0O1xuXHRcdFxuXHRcdHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0XHR2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXHRcdGNvbnRleHQuZm9udCA9IFwiQm9sZCBcIiArIGZvbnRzaXplICsgXCJweCBcIiArIGZvbnRmYWNlO1xuICAgIFxuXHRcdC8vIGdldCBzaXplIGRhdGEgKGhlaWdodCBkZXBlbmRzIG9ubHkgb24gZm9udCBzaXplKVxuXHRcdHZhciBtZXRyaWNzID0gY29udGV4dC5tZWFzdXJlVGV4dCggbWVzc2FnZSApO1xuXHRcdHZhciB0ZXh0V2lkdGggPSBtZXRyaWNzLndpZHRoO1xuXHRcblx0XHQvLyBiYWNrZ3JvdW5kIGNvbG9yXG5cdFx0Y29udGV4dC5maWxsU3R5bGUgICA9IFwicmdiYShcIiArIGJhY2tncm91bmRDb2xvci5yICsgXCIsXCIgKyBiYWNrZ3JvdW5kQ29sb3IuZyArIFwiLFwiXG5cdFx0XHRcdFx0XHRcdFx0XHQgICsgYmFja2dyb3VuZENvbG9yLmIgKyBcIixcIiArIGJhY2tncm91bmRDb2xvci5hICsgXCIpXCI7XG5cdFx0Ly8gYm9yZGVyIGNvbG9yXG5cdFx0Y29udGV4dC5zdHJva2VTdHlsZSA9IFwicmdiYShcIiArIGJvcmRlckNvbG9yLnIgKyBcIixcIiArIGJvcmRlckNvbG9yLmcgKyBcIixcIlxuXHRcdFx0XHRcdFx0XHRcdFx0ICArIGJvcmRlckNvbG9yLmIgKyBcIixcIiArIGJvcmRlckNvbG9yLmEgKyBcIilcIjtcblxuXHRcdGNvbnRleHQubGluZVdpZHRoID0gYm9yZGVyVGhpY2tuZXNzO1xuXHRcdHRoaXMucm91bmRSZWN0KGNvbnRleHQsIGJvcmRlclRoaWNrbmVzcy8yLCBib3JkZXJUaGlja25lc3MvMiwgdGV4dFdpZHRoICsgYm9yZGVyVGhpY2tuZXNzLCBmb250c2l6ZSAqIDEuNCArIGJvcmRlclRoaWNrbmVzcywgNik7XG5cdFx0Ly8gMS40IGlzIGV4dHJhIGhlaWdodCBmYWN0b3IgZm9yIHRleHQgYmVsb3cgYmFzZWxpbmU6IGcsaixwLHEuXG5cdFxuXHRcdC8vIHRleHQgY29sb3Jcblx0XHRjb250ZXh0LmZpbGxTdHlsZSA9IFwicmdiYSgwLCAwLCAwLCAxLjApXCI7XG5cblx0XHRjb250ZXh0LmZpbGxUZXh0KCBtZXNzYWdlLCBib3JkZXJUaGlja25lc3MsIGZvbnRzaXplICsgYm9yZGVyVGhpY2tuZXNzKTtcblx0XG5cdFx0Ly8gY2FudmFzIGNvbnRlbnRzIHdpbGwgYmUgdXNlZCBmb3IgYSB0ZXh0dXJlXG5cdFx0dmFyIHRleHR1cmUgPSBuZXcgVEhSRUUuVGV4dHVyZShjYW52YXMpIFxuXHRcdHRleHR1cmUubmVlZHNVcGRhdGUgPSB0cnVlO1xuXG5cdFx0dmFyIHNwcml0ZU1hdGVyaWFsID0gbmV3IFRIUkVFLlNwcml0ZU1hdGVyaWFsKCBcblx0XHRcdHsgbWFwOiB0ZXh0dXJlLCB1c2VTY3JlZW5Db29yZGluYXRlczogZmFsc2UgfSApO1xuXHRcdHZhciBzcHJpdGUgPSBuZXcgVEhSRUUuU3ByaXRlKCBzcHJpdGVNYXRlcmlhbCApO1xuXHRcdHNwcml0ZS5zY2FsZS5zZXQoMjAsMjAsMS4wKTtcblx0XHRyZXR1cm4gc3ByaXRlO1x0XG5cdH0sXG5cdHJvdW5kUmVjdDpmdW5jdGlvbihjdHgsIHgsIHksIHcsIGgsIHIpIFxuXHR7XG5cdCAgICBjdHguYmVnaW5QYXRoKCk7XG5cdCAgICBjdHgubW92ZVRvKHgrciwgeSk7XG5cdCAgICBjdHgubGluZVRvKHgrdy1yLCB5KTtcblx0ICAgIGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKHgrdywgeSwgeCt3LCB5K3IpO1xuXHQgICAgY3R4LmxpbmVUbyh4K3csIHkraC1yKTtcblx0ICAgIGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKHgrdywgeStoLCB4K3ctciwgeStoKTtcblx0ICAgIGN0eC5saW5lVG8oeCtyLCB5K2gpO1xuXHQgICAgY3R4LnF1YWRyYXRpY0N1cnZlVG8oeCwgeStoLCB4LCB5K2gtcik7XG5cdCAgICBjdHgubGluZVRvKHgsIHkrcik7XG5cdCAgICBjdHgucXVhZHJhdGljQ3VydmVUbyh4LCB5LCB4K3IsIHkpO1xuXHQgICAgY3R4LmNsb3NlUGF0aCgpO1xuXHQgICAgY3R4LmZpbGwoKTtcblx0XHRjdHguc3Ryb2tlKCk7ICAgXG5cdH1cbn1cbm1vZHVsZS5leHBvcnRzPU1vZCIsbnVsbCwiLy8gbm90aGluZyB0byBzZWUgaGVyZS4uLiBubyBmaWxlIG1ldGhvZHMgZm9yIHRoZSBicm93c2VyXG4iLCJ2YXIgVXRpbHMgPSB7XG5cdFxuXHRtYWtlX2d1aWQgOmZ1bmN0aW9uKCl7XG5cdFx0dmFyIGd1aWQgPSAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uKGMpIHtcblx0XHQgICAgdmFyIHIgPSBNYXRoLnJhbmRvbSgpKjE2fDAsIHYgPSBjID09ICd4JyA/IHIgOiAociYweDN8MHg4KTtcblx0XHQgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuXHRcdH0pO1xuXHRcdHJldHVybiBndWlkO1xuXHR9XG59XG5tb2R1bGUuZXhwb3J0cyA9IFV0aWxzOyIsInZhciBmcyAgICA9IHJlcXVpcmUoJ2ZzJyk7XG52YXIgdSA9IHJlcXVpcmUoJy4vdXRpbHMuanMnKTtcbnZhciBUSFIgPSByZXF1aXJlKCcuL3RocmVlLm5vZGUuanMnKTtcblxudmFyIF8gICAgID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG52YXIgU2NlbmVPYmplY3QgPSBmdW5jdGlvbigpe1xuXHR0aGlzLmRlc2NyaXB0aW9uPSBcIlNjZW5lIHJvdXRpbmVzXCJcblx0dGhpcy5HVUlEID0gIHUubWFrZV9ndWlkKCk7XG5cdHRoaXMuX2NyZWF0ZSgpO1xufVxuU2NlbmUgPSB7Y29uc3RydWN0b3I6IFNjZW5lT2JqZWN0fVxuXG5pZih0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyl7XG5cdFNjZW5lLlRIUkVFID0gVEhSIC8vIFNhdmVpbmcgVEhSRUUuanMgYXMgcGFydCBvZiBzY2VuZSAtIHRoaXMgc3RlcCBjb3VsZCBiZSBkb25lIG9uIGEgY2VydGFpbiBwbGF0Zm9ybVxuXHRTY2VuZS5kb19wcmVwYXJlX3JlbmRlcmluZyA9IGZhbHNlXG5cdFNjZW5lLmFqYXhfbG9hZF9tb2RlbHMgPSBmYWxzZVxuXHRTY2VuZS5uZWVkX3VwZGF0ZV9tYXRyaXggPSB0cnVlXG5cdFxufWVsc2V7XG5cdFNjZW5lLlRIUkVFID0gVEhSRUVcblx0U2NlbmUuZG9fcHJlcGFyZV9yZW5kZXJpbmcgPSB0cnVlXG5cdFNjZW5lLmFqYXhfbG9hZF9tb2RlbHMgPSB0cnVlXG5cdFNjZW5lLm5lZWRfdXBkYXRlX21hdHJpeCA9IGZhbHNlXG5cdFxufVxuXG5cblxuXG5TY2VuZS5tZXNoX2ZvciA9IGZ1bmN0aW9uKGFjdG9yKXtcblx0cmV0dXJuIHRoaXMubWVzaGVzW2FjdG9yLmNvbnRyb2wub2JqZWN0X2d1aWRdXG59XG5TY2VuZS5jcmVhdGUgPSBmdW5jdGlvbigpe1xuXHR0aGlzLl9jcmVhdGUoKTtcblx0Ly9jb25zb2xlLmxvZyggXCJDTE9DS1wiLCB0aGlzLmNsb2NrKTtcblx0XG5cdHJldHVybiB0aGlzO1xufVxuXG5TY2VuZS5fY3JlYXRlID0gZnVuY3Rpb24oKXtcblx0dGhpcy5jbG9jayA9IG5ldyAodGhpcy5USFJFRS5DbG9jaykoKTtcblx0dGhpcy50aW1lX2luYyAgPSAwO1xuXHR0aGlzLl9zY2VuZV9vYmplY3RfY2FjaGUgPSB7fVxuXHR0aGlzLl9zY2VuZV9vYmpfYWN0b3JzPXt9XG5cdHRoaXMuaXNfbG9hZGVkID0gZmFsc2Vcblx0dGhpcy5fZCA9IGZhbHNlXG5cdHRoaXMuX3NjZW5lID17YWN0b3JzOnt9LCBHVUlEOiB0aGlzLkdVSUQsIG9iamVjdHM6e30gfSBcblx0XG5cdFxuXHQvLyB0aGlzLnNpbXVsYXRpb25fcnVucyA9IGZhbHNlXG5cdC8vIGNvbnNvbGUubG9nKHRoaXMuY2xvY2spO1xuXHRcbn1cblNjZW5lLnVwZGF0ZV9mcm9tX3dvcmxkID0gZnVuY3Rpb24oZ2xvYmFseCwgZ2xvYmFseSwgZ2xvYmFseiApe1xuXHQvLyBnbG9iYWx4LXkteiAtIGdhbGF4eSBjb29yZHMgd2l0aCAxIG1ldGVyIGFjY3VyYWN5XG5cdHZhciBjbG9zZXN0X3NjZW5lX3dpdGhfZGlzdGFuY2UgPSB0aGlzLmdldF9jbG9zZXN0X3NjZW5lKGdsb2JhbHgsIGdsb2JhbHksIGdsb2JhbHopO1xuXHQvLyBpZiBjbG9zZXN0X3NjZW5lIGlzIG5vdCBudWxsIC0gd2UgbXVzdCBpbmplY3Qgb2JqZWN0IHdpdGggYWN0b3JzIHRvIHRoYXQgc2NlbmUgLSBpdCdzIGFscmVhZHlfbG9hZGVkXG5cdC8vIGVsc2UgLSBXZSBmaW5kaW5nIG9iamVjdHMgZm9yIHRoYXQgc2NlbmVcblx0XHRcdFx0XG5cdHZhciBvYmplY3RzX3dpdGhpbl9jb29yZHMgPSB0aGlzLmdldF9vYmplY3RzX2luKGdsb2JhbHgsIGdsb2JhbHksIGdsb2JhbHopIC8vINCX0LDQs9GA0YPQt9C60LAg0L7QsdGK0LXQutGC0L7QsiDQsiDRgdGG0LXQvdGDINC40Lcg0LPQu9C+0LHQsNC70YzQvdC+0LPQviDQvNC40YDQsFxuXHRcblx0dmFyIG9iamVjdHMgPSB7fVxuXHRmb3IgKCB2YXIgaSA9IDA7IGkgPCBvYmplY3RzX3dpdGhpbl9jb29yZHMubGVuZ3RoIDsgaSsrICl7XG5cdFx0b2JqZWN0c1sgb2JqZWN0c193aXRoaW5fY29vcmRzW2ldLkdVSUQgXSA9ICAgb2JqZWN0c193aXRoaW5fY29vcmRzW2ldO1xuXHR9XG5cdF8uZXh0ZW5kKHRoaXMuX3NjZW5lLm9iamVjdHMsIG9iamVjdHMpXG5cdFxuXHR0aGlzLl9zY2VuZS5zdW5EaXJlY3Rpb24gPSBbMCwxLDBdXG5cdHRoaXMuX3NjZW5lLnN1bkxpZ2h0Q29sb3IgPSBbTWF0aC5yYW5kb20oKSwgMC44LCAwLjldIC8vIEhTTFxuXHR0aGlzLl9zY2VuZS5jb29yZHMgPVsgZ2xvYmFseCwgZ2xvYmFseSwgZ2xvYmFseiBdXG5cdC8vIHRoaXMuX2NyZWF0ZSgpO1xuXHRcblx0Ly8gY3JlYXRpbmcgc2NlbmVcblx0XG5cdC8vIHRoaXMuX3NjZW5lID0ge2Nvb3JkcyA6WyBnbG9iYWx4LCBnbG9iYWx5LCBnbG9iYWx6IF0sIGFjdG9yczp7fSwgR1VJRDogdS5tYWtlX2d1aWQoKSwgb2JqZWN0czp7fSB9IFxuXHQvLyB0aGlzLkdVSUQgPSB0aGlzLl9zY2VuZS5HVUlEO1xuXHRcblx0Ly8gcHJlcGFyZSBhY3RvcnMgLSBhbGwgb2YgdGhlbSB3b3VsZCBjb250cm9sIG9iamVjdF9pZCA9IDAsIHZpZXdwb3J0cyAtIGVhY2ggZm9yIGVhY2hcblx0XG5cdFxuXHQvLyBJbmplY3Rpbmcgb3RoZXIgb2JqZWN0c1xuXHQvL3ZhciBvYmplY3RzID0ge31cblx0Ly8gb2JqZWN0c1tmb3Jfb2JqZWN0LkdVSURdID0gZm9yX29iamVjdDtcblx0XG5cdC8vIGNvbnNvbGUubG9nKFxuXHQvLyBjb25zb2xlLmxvZyggXCJDTE9DS1wiLCB0aGlzLmNsb2NrKTtcblx0XG5cdHJldHVybiB0aGlzXG5cdFxufVxuU2NlbmUuZ2V0X2FjdG9ycyA9IGZ1bmN0aW9uKCl7XG5cdHJldHVybiB0aGlzLl9zY2VuZS5hY3RvcnNcbn1cblNjZW5lLmdldF9vYmplY3RzID0gZnVuY3Rpb24oKXtcblx0cmV0dXJuIHRoaXMuX3NjZW5lLm9iamVjdHNcbn1cblxuU2NlbmUuZ2V0X2Nsb3Nlc3Rfc2NlbmUgPSBmdW5jdGlvbigpe1xuXHRyZXR1cm4gdW5kZWZpbmVkXG59XG5TY2VuZS5nZXRfb2JqZWN0c19pbiA9IGZ1bmN0aW9uKCl7XG5cdHJldHVybiBbXTtcbn1cblNjZW5lLmpvaW5fb2JqZWN0ID0gZnVuY3Rpb24oIG9iamVjdCApe1xuXHR0aGlzLl9zY2VuZS5vYmplY3RzW29iamVjdC5HVUlEXSA9IG9iamVjdFxuXHR0aGlzLl9zY2VuZV9vYmpfYWN0b3JzW29iamVjdC5HVUlEXSA9IFtdXG5cdC8vIGNvbnNvbGUubG9nKFwiUFVUIE9CSlwiLCBvYmplY3QuR1VJRClcbn1cblNjZW5lLmpvaW5fYWN0b3IgPSBmdW5jdGlvbiggYWN0b3IgKXtcblx0aWYgKHRoaXMuX3NjZW5lLmFjdG9yc1thY3Rvci5sb2dpbl0pe1xuXHRcdHRoaXMuX3NjZW5lLmFjdG9yc1thY3Rvci5sb2dpbl0ucHVzaChhY3Rvcilcblx0fWVsc2V7XG5cdFx0dGhpcy5fc2NlbmUuYWN0b3JzW2FjdG9yLmxvZ2luXSA9IFthY3Rvcl1cblx0fVxuXHQvLyBjb25zb2xlLmxvZyhcIkdFVCBPQkpcIix0aGlzLl9zY2VuZV9vYmpfYWN0b3JzLCAgYWN0b3IuY29udHJvbC5vYmplY3RfZ3VpZClcblx0XG5cdHRoaXMuX3NjZW5lX29ial9hY3RvcnNbYWN0b3IuY29udHJvbC5vYmplY3RfZ3VpZF0ucHVzaChhY3Rvcilcblx0XG5cdHJldHVybiB0aGlzXG5cdFxufVxuU2NlbmUuc2V0X2Zyb21fanNvbiA9IGZ1bmN0aW9uKG9iamVjdCl7XG5cdHRoaXMuX3NjZW5lID0gb2JqZWN0XG5cdC8vIGNvbnNvbGUubG9nKFwic2V0IGZyb21fanNvblwiLCBvYmplY3QpO1xuXHRcblx0dGhpcy5HVUlEID0gb2JqZWN0LkdVSURcblx0XG59XG5cbi8vIFNjZW5lLmNvbnRyb2xsYWJsZSA9IGZ1bmN0aW9uKGxvZ2luKXtcblx0XG4vL1x0cmV0dXJuIHRoaXMubWVzaGVzW3RoaXMuYWN0b3JzW2xvZ2luXS5jb250cm9sLm9iamVjdF9ndWlkXVxuLy8gfVxuU2NlbmUubG9hZCA9IGZ1bmN0aW9uKG9ubG9hZCwgdGhyZWVfc2NlbmUpe1xuXHQvLyB0aHJlZSBzY2VuZSAtIGlzIGEgcGFyYW0gZm9yIGFkZGluZyBtZXNoZXMgdG9cblx0dmFyIHNlbGYgPSB0aGlzO1xuXHQvL2NvbnNvbGUubG9nKCdsb2FkaW5nJyk7XG5cdFxuXHRzZWxmLm1lc2hlcyA9IHt9XG5cdHNlbGYubG9hZGVyID0gIG5ldyBzZWxmLlRIUkVFLkpTT05Mb2FkZXIoKTtcblx0c2VsZi50b3RhbF9vYmplY3RzX2NvdW50ID0gMDtcblx0c2VsZi5fY2FsbF9iYWNrID0gb25sb2FkO1xuXHRcblx0aWYodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpe1xuXHRcdHNlbGYudGhyZWVfc2NlbmUgPSB0aHJlZV9zY2VuZVxuXHR9XG5cdFxuXHRmdW5jdGlvbiBwdXRfb24odHlwZSwgbmFtZSl7XG5cdFx0dmFyIGVzID0gdGhpc1tcIm9uX2VuZ2luZXNfXCIgKyB0eXBlXVxuXHRcdC8vIGNvbnNvbGUubG9nKGVzKVxuXHRcdGlmICggZXMuaW5kZXhPZihuYW1lKSA9PT0gLTEpe1xuXHRcdFx0ZXMucHVzaChuYW1lKVx0XG5cdFx0fVxuXHRcdC8vIGNvbnNvbGUubG9nKGVzKVxuXHR9XG5cdGZ1bmN0aW9uIHB1dF9vZmYodHlwZSwgbmFtZSl7XG5cdFx0dmFyIGVzID0gdGhpc1tcIm9uX2VuZ2luZXNfXCIgKyB0eXBlXVxuXHRcdHZhciBpeCA9IGVzLmluZGV4T2YobmFtZSlcblx0XHRpZiAoICBpeCAhPT0gLTEgKXtcblx0XHRcdGVzLnNwbGljZShpeCwgMSk7XG5cdFx0fVxuXHR9XG5cdHZhciBqc29uID0gdGhpcy5fc2NlbmVcblx0XG5cdFxuXHRzZWxmLmFjdG9ycyA9IGpzb24uYWN0b3JzO1xuXHRcblx0Ly8gc2VsZi5hdXRvbWF0aWMgYWN0b3JzIC0gcnVuIGluIGxvb3BzXG5cdHNlbGYuYXV0b21hdGljX2FjdG9ycyA9IHt9O1xuXHQvLyBjb25zb2xlLmxvZyhzZWxmLmFjdG9ycylcblx0XG5cdHNlbGYubG9hZGVkX29iamVjdHNfY291bnQgPSAwXG5cdFxuXHQvLyBjb25zb2xlLmxvZyhzZWxmLmFjdG9ycyk7XG5cdC8vIGNvbnNvbGUubG9nKGpzb24pO1xuXHRzZWxmLl9tb2RlbF9jYWNoZSA9IHt9XG5cdC8vY29uc29sZS5sb2codGhpcyk7XG5cdF8uZWFjaChqc29uLm9iamVjdHMsIGZ1bmN0aW9uKCBvYmplY3QsaXggKXtcblx0XHRjb25zb2xlLmxvZygnbG9hZGluZyBsb29waW5nJylcblx0XHRzZWxmLnRvdGFsX29iamVjdHNfY291bnQgKz0xO1xuXHRcdFxuXHRcdGlmICghIHNlbGYuYWpheF9sb2FkX21vZGVscyl7XG5cdFx0XHR2YXIgbSA9IG9iamVjdC5tb2RlbF8zZC5zcGxpdCgnLycpWzJdO1xuXHRcdFx0dmFyIG1vZGVsX3BhdGg9IFwiLi9wdWJsaWMvbW9kZWxzL1wiICsgbVxuXHRcdH1cblx0XHQvLyBjb25zb2xlLmxvZyhtb2RlbF9wYXRoKTtcblx0XHRcblx0XHR2YXIgcmYgPSBmdW5jdGlvbigpe1xuXHRcdFx0dmFyIHdpdGhfZ2VvbV9hbmRfbWF0ID0gZnVuY3Rpb24oZ2VvbSwgbWF0KXtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJ3aXRoX2cgJiBtYXRcIilcblx0XHRcdFx0dmFyIG0gPSBuZXcgc2VsZi5USFJFRS5NYXRyaXg0KClcblx0XHRcdFx0bS5pZGVudGl0eSgpXG5cdFx0XHRcblx0XHRcblx0XHRcdFx0dmFyIG1lc2ggPSBuZXcgc2VsZi5USFJFRS5NZXNoKCBnZW9tLCBtYXQgKTtcblx0XHRcdFx0bWVzaC50eXBlPW9iamVjdC50eXBlXG5cdFx0XHRcdHZhciBvYmplY3Rfcm90YXRlZCA9IGZhbHNlXG5cdFx0XHRcdGlmICggb2JqZWN0LnBoeXNpY2FsICl7XG5cdFx0XHRcdFx0Zm9yKGkgaW4gb2JqZWN0LnBoeXNpY2FsKXtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0dmFyIF9pcyA9ICd0bycgaW4gb2JqZWN0LnBoeXNpY2FsW2ldXG5cdFx0XHRcdFx0XHRpZiAoIV9pcyl7XG5cdFx0XHRcdFx0XHRcdHZhciB2ID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMygpXG5cdFx0XHRcdFx0XHRcdHYuc2V0LmFwcGx5KHYsIG9iamVjdC5waHlzaWNhbFtpXSlcblx0XHRcdFx0XHRcdFx0bWVzaFtpXSA9IHZcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0XHRcdHZhciBwID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMyhvYmplY3QucGh5c2ljYWxbaV0udG9bMF0sIG9iamVjdC5waHlzaWNhbFtpXS50b1sxXSwgb2JqZWN0LnBoeXNpY2FsW2ldLnRvWzJdKVxuXHRcdFx0XHRcdFx0XHQvLyBUcnkgdG8gcm90YXRlIHAgb24gMTgwIFxuXHRcdFx0XHRcdFx0XHQvL3Aucm90YXRlWCgyKiBNYXRoLlBJKTtcblx0XHRcdFx0XHRcdFx0bWVzaC5sb29rQXQocC5uZWdhdGUoKSlcblx0XHRcdFx0XHRcdFx0Ly8gbWVzaC5yb3RhdGVYKDIqTWF0aC5QSSlcblx0XHRcdFx0XHRcdFx0b2JqZWN0X3JvdGF0ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0dmFyIHBpMiA9IE1hdGguUEkgKiAyO1xuXHRcdFx0XHRcdG1lc2gucG9zID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMyhNYXRoLnJhbmRvbSgpICogMjAwLCBNYXRoLnJhbmRvbSgpICogMjAwLCBNYXRoLnJhbmRvbSgpICogMjAwKTtcblx0XHRcdFx0XHRtZXNoLnJvdCA9IG5ldyBzZWxmLlRIUkVFLlZlY3RvcjMoTWF0aC5yYW5kb20oKSAqIHBpMiwgTWF0aC5yYW5kb20oKSAqIHBpMiwgTWF0aC5yYW5kb20oKSAqIHBpMik7XG5cdFx0XHRcdFx0bWVzaC5hdmVsID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMygwLDAsMClcblx0XHRcdFx0XHRtZXNoLmFhY2MgPSBuZXcgc2VsZi5USFJFRS5WZWN0b3IzKDAsMCwwKVxuXHRcdFx0XHRcdG1lc2gudmVsID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMygwLDAsMClcblx0XHRcdFx0XHRtZXNoLmFjYyA9IG5ldyBzZWxmLlRIUkVFLlZlY3RvcjMoMCwwLDApXG5cdFx0XHRcdFx0XG5cdFx0XHRcdH1cblx0XHRcdFx0bWVzaC5wb3NpdGlvbiA9IG1lc2gucG9zO1xuXHRcdFx0XHRpZiAoISBvYmplY3Rfcm90YXRlZCAmJiAgJ3JvdCcgaW4gbWVzaCl7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0dmFyIHVlbCA9IG5ldyBUSFJFRS5FdWxlcihtZXNoLnJvdC54LCBtZXNoLnJvdC55LCBtZXNoLnJvdC56KTtcblx0XHRcdFx0XHRtZXNoLnJvdGF0aW9uID0gdWVsO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKG1lc2gucG9zaXRpb24pXG5cdFx0XHRcdG1lc2guY2FtZXJhcyA9IG9iamVjdC5jYW1lcmFzO1xuXHRcdFx0XHRtZXNoLmVuZ2luZXMgPSBvYmplY3QuZW5naW5lcztcblx0XHRcdFx0bWVzaC5oYXNfZW5naW5lcyA9IG9iamVjdC5lbmdpbmVzICE9PSB1bmRlZmluZWQ7XG5cdFx0XHRcdGlmIChtZXNoLmhhc19lbmdpbmVzKXtcblx0XHRcdFx0XHRtZXNoLm9uX2VuZ2luZXNfcm90YXRpb24gPSBbXTtcblx0XHRcdFx0XHRtZXNoLm9uX2VuZ2luZXNfcHJvcHVsc2lvbiA9IFtdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdG1lc2gucHV0X29mZiA9IHB1dF9vZmY7XG5cdFx0XHRcdG1lc2gucHV0X29uICA9IHB1dF9vbjtcblx0XHRcdFx0bWVzaC5tYXNzID0gb2JqZWN0Lm1hc3M7XG5cdFx0XG5cdFx0XHRcdGlmIChzZWxmLmRvX3ByZXBhcmVfcmVuZGVyaW5nKXtcblx0XHRcdFx0XHRpZiAob2JqZWN0LnR5cGUgIT09J3N0YXRpYycpe1xuXHRcdFx0XHRcdFx0dmFyIGxhYmVsID0gU3ByaXRlVXRpbHMubWFrZVRleHRTcHJpdGUoXCJtZXNoOiBcIiArIGl4KTtcblx0XHRcdFx0XHRcdGxhYmVsLnBvc2l0aW9uID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMygwLDAsMCk7XG5cdFx0XHRcdFx0XHRtZXNoLmFkZChsYWJlbCk7XG5cdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhcImFkZGVkXCIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0aHJlZV9zY2VuZS5hZGQoIG1lc2ggKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRcdHNlbGYubWVzaGVzWyBvYmplY3QuR1VJRCBdID0gbWVzaDtcblx0XHRcdFx0c2VsZi5sb2FkZWRfb2JqZWN0c19jb3VudCArPTE7XG5cdFx0XHRcdHNlbGYuX21vZGVsX2xvYWRlZCggaXggKVxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRpZihzZWxmLmFqYXhfbG9hZF9tb2RlbHMpe1xuXHRcdFx0XHRzZWxmLl9nZXRfbW9kZWwob2JqZWN0Lm1vZGVsXzNkLHNlbGYuX2FqYXhfZ2V0dGVyLCB3aXRoX2dlb21fYW5kX21hdClcblx0XHRcdH1lbHNle1xuXHRcdFx0XHRzZWxmLl9nZXRfbW9kZWwobW9kZWxfcGF0aCwgc2VsZi5fZnNfZ2V0dGVyLCB3aXRoX2dlb21fYW5kX21hdClcblx0XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHNldFRpbWVvdXQocmYsMSk7XG5cdFx0XG5cdH0pXG5cdFx0XHRcblx0XG5cdFxufSxcblNjZW5lLl9hamF4X2dldHRlcj1mdW5jdGlvbihuYW1lLCBjYikge1xuXHQvL2NvbnNvbGUubG9nKHRoaXMpO1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cdHNlbGYubG9hZGVyLmxvYWQoIG5hbWUsIGZ1bmN0aW9uKGdlb20sIG1hdCl7XG5cdFx0XG5cdFx0dmFyIG1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hGYWNlTWF0ZXJpYWwoIG1hdCApO1xuXHRcdC8vdmFyIGEgPSB7Z2VvbTpnZW9tLCBtYXRlcmlhbDptYXRlcmlhbH1cblx0XHRjYihnZW9tLCBtYXRlcmlhbCk7XG5cdFx0XG5cdH0pXG59XG5TY2VuZS5fZnNfZ2V0dGVyPWZ1bmN0aW9uKG5hbWUsIGNiKXtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXHRjb25zb2xlLmxvZyhuYW1lKTtcblx0ZnMucmVhZEZpbGUobmFtZSwgZnVuY3Rpb24oZXJyLGRhdGEpe1xuXHRcdC8vY29uc29sZS5sb2coXCJzdGFydCBsb2FkaW5nXCIpO1xuXHRcdGlmKGVycikgdGhyb3cgZXJyO1xuXHRcdHZhciBqc29uID0gSlNPTi5wYXJzZShkYXRhKVxuICAgICAgICB2YXIgcmVzdWx0ID0gc2VsZi5sb2FkZXIucGFyc2UoIGpzb24sICcnICk7XG5cblx0XHR2YXIgbGQgPSAoZnVuY3Rpb24oKXtcblx0XHRcdHZhciBtYXRlcmlhbCA9IG5ldyBzZWxmLlRIUkVFLk1lc2hGYWNlTWF0ZXJpYWwoIHJlc3VsdC5tYXRlcmlhbHMgKTtcblx0XHRcdGNiKHJlc3VsdC5nZW9tZXRyeSwgbWF0ZXJpYWwpO1xuXHRcdFxuXHRcdH0pXG5cdFx0c2V0VGltZW91dChsZCwxKTtcblx0fSk7XG59XG5cblNjZW5lLl9nZXRfbW9kZWwgPSBmdW5jdGlvbihuYW1lLCBnZXR0ZXIsIHdpdGhfZ2VvbV9hbmRfbWF0KXtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXHR2YXIgbWF0X2dlb21fY2IgPSBmdW5jdGlvbihnZW9tLCBtYXQpe1xuXHRcdHNlbGYuX21vZGVsX2NhY2hlW25hbWVdID0ge2dlb206Z2VvbSwgbWF0ZXJpYWw6bWF0fVxuXHRcdHdpdGhfZ2VvbV9hbmRfbWF0KGdlb20sIG1hdClcblx0fVxuXHRpZiAobmFtZSBpbiBzZWxmLl9tb2RlbF9jYWNoZSl7XG5cdFx0dmFyIGE9IHNlbGYuX21vZGVsX2NhY2hlW25hbWVdXG5cdFx0d2l0aF9nZW9tX2FuZF9tYXQoYS5nZW9tLCBhLm1hdGVyaWFsKVxuXHR9ZWxzZXtcblx0XHRnZXR0ZXIuYXBwbHkoc2VsZixbbmFtZSwgbWF0X2dlb21fY2JdKVxuXHR9XG5cdFx0XHRcdFxufVxuU2NlbmUuX2RlbGV0ZV9vYmplY3QgPSBmdW5jdGlvbihndWlkKXtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXHRpZihzZWxmLnRocmVlX3NjZW5lKXtcblx0XHRzZWxmLnRocmVlX3NjZW5lLnJlbW92ZShzZWxmLm1lc2hlc1tndWlkXSkgLy8g0YPQtNGP0LvRj9C10Lwg0Y/QtNGA0L4g0LjQtyDRgdGG0LXQvdGLXG5cdH1cblx0ZGVsZXRlIHNlbGYubWVzaGVzWyBndWlkIF07IC8vIC4uLiDQuNC3INC80LXRiNC10Llcblx0ZGVsZXRlIHNlbGYuX3NjZW5lX29iamVjdF9jYWNoZVsgZ3VpZCBdXG5cdFxuXHRcbn1cblNjZW5lLl9tb2RlbF9sb2FkZWQgPSBmdW5jdGlvbihpeCl7XG5cdC8vY29uc29sZS5sb2coXCJMTExcIik7XG5cdGlmICh0aGlzLmxvYWRlZF9vYmplY3RzX2NvdW50ID09IHRoaXMudG90YWxfb2JqZWN0c19jb3VudCl7XG5cdFx0Ly8gc2NlbmUgbG9hZGVkXG5cdFx0dGhpcy5pc19sb2FkZWQgPSB0cnVlO1xuXHRcdGNvbnNvbGUubG9nKFwiT0tcIiwgIHRoaXMuX2NhbGxfYmFjayk7XG5cdFx0aWYgICh0aGlzLl9jYWxsX2JhY2spe1xuXHRcdFx0dGhpcy5fY2FsbF9iYWNrKHRoaXMpXG5cdFx0fVxuXHRcdC8vY29uc29sZS5sb2coXCJET05FXCIpO1xuXHR9ZWxzZXtcblx0XHQvL2NvbnNvbGUubG9nKCdub3QgeWV0JywgdGhpcy5sb2FkZWRfb2JqZWN0c19jb3VudCAsIHRoaXMudG90YWxfb2JqZWN0c19jb3VudCk7XG5cdH1cbn1cblNjZW5lLnN5bmMgPSBmdW5jdGlvbihzeW5jKXtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXHRfLmVhY2goc3luYywgZnVuY3Rpb24ob2JqZWN0LCBndWlkKXtcblx0XHRpZiAoIShndWlkIGluIHNlbGYubWVzaGVzKSkgcmV0dXJuO1xuXHRcdF8uZWFjaChvYmplY3QsIGZ1bmN0aW9uKHZlYywgbmFtZSl7XG5cdFx0XHRpZiAobmFtZSA9PSdyb3RhdGlvbicpe1xuXHRcdFx0XHR2YXIgdiA9IG5ldyBzZWxmLlRIUkVFLkV1bGVyKClcblx0XHRcdFx0XG5cdFx0XHR9ZWxzZXtcblx0XHRcdFx0dmFyIHYgPSBuZXcgc2VsZi5USFJFRS5WZWN0b3IzKClcblx0XHRcdFx0XG5cdFx0XHR9XG5cdFx0XHR2LmZyb21BcnJheSh2ZWMpXG5cdFx0XHRcblx0XHRcdHNlbGYubWVzaGVzW2d1aWRdW25hbWVdID0gdlxuXHRcdFx0XG5cdFx0XHRcblx0XHRcdFxuXHRcdFx0Ly9pZiAoIXYuZXF1YWxzKG92KSl7XG5cdFx0XHQvL1x0Y29uc29sZS5sb2cobmFtZSwgdmVjLCBvdi50b0FycmF5KCkgKVxuXHRcdFx0Ly99XG5cdFx0XG5cdFx0fSlcblx0XHRcblx0fSlcbn1cblNjZW5lLmdldCA9IGZ1bmN0aW9uKCl7XG5cdHJldHVybiB0aGlzLl9zY2VuZVxufVxuU2NlbmUuZ2V0X2FsbWFuYWNoID0gZnVuY3Rpb24oKXtcblx0Ly8gdmFyIHNlbGYgPSB0aGlzO1xuXHRcblx0cmV0dXJuIHRoaXMuX3NjZW5lX29iamVjdF9jYWNoZVxuXHRcbn1cblNjZW5lLnRpY2sgPSBmdW5jdGlvbigpe1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cdC8vdmFyIHRpbWVfaW5jID0gMDtcblx0dmFyIHRpbWVfbGVmdCA9IHNlbGYuY2xvY2suZ2V0RGVsdGEoKTtcblx0c2VsZi50aW1lX2luYyArPSB0aW1lX2xlZnQ7XG5cdC8vY29uc29sZS5sb2coc2VsZi50aW1lX2luYyk7XG5cdFxuXHQvLyB2YXIgYWN0b3IgPSBzZWxmLmdldF9jdXJyZW50X2FjdG9yKClcblx0Ly8gdmFyIEMgPSBzZWxmLm1lc2hlcygpW2FjdG9yLmNvbnRyb2wub2JqZWN0X2d1aWRdXG5cdC8vIGNvbnNvbGUubG9nKHNlbGYuYXV0b21hdGljX2FjdG9ycyk7XG5cdF8uZWFjaChzZWxmLmF1dG9tYXRpY19hY3RvcnMsIGZ1bmN0aW9uKGFjdG9yKXtcblx0XHQvL2NvbnNvbGUubG9nKGFjdG9yKTtcblx0XHRhY3Rvci5ydW4odGltZV9sZWZ0KTtcblx0fSlcblx0Ly9jb25zb2xlLmxvZyh0aW1lX2luYylcblx0XG5cdGlmKChNYXRoLmZsb29yKHNlbGYudGltZV9pbmMpICUgNSApID09PTApe1xuXHRcdGlmICghc2VsZi5fZCl7XG5cdFx0XHRzZWxmLl9kID0gdHJ1ZVxuXHRcdFx0Ly9jb25zb2xlLmxvZyhcIjVzZWsgdGlja1wiKVxuXHRcdFx0Ly8gb25seSB0d28gZmlyc3Rcblx0XHRcdGZvcihpIGluIHNlbGYubWVzaGVzKXtcblx0XHRcdFx0dmFyIG0gPSBzZWxmLm1lc2hlc1tpXVxuXHRcdFx0XHRpZiAobS50eXBlID09ICdzaGlwJyl7XG5cdFx0XHRcdFx0dmFyIHYgPSBtLnZlbDtcblx0XHRcdFx0XHR2YXIgcCA9IG0ucG9zO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdHZhciByID0gbS5yb3Q7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0aWYgKHYpe1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coaSwgdi54LCB2LnksIHYueilcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGksIHAueCwgcC55LCBwLnopXG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly9pZiAocil7XG5cdFx0XHRcdFx0Ly9cdGNvbnNvbGUubG9nKGksIHIueCwgci55LCByLnopXG5cdFx0XHRcdFx0Ly99XG5cdFx0XHRcdFx0XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdC8qXG5cdFx0XHRmb3IoaSBpbiBzZWxmLnNjZW5lLmFjdG9ycyl7XG5cdFx0XHRcdHZhciBhID0gc2VsZi5zY2VuZS5hY3RvcnNbaV1cblx0XHRcdFx0Y29uc29sZS5sb2coYS5jb250cm9sLm9iamVjdF9ndWlkKTtcblx0XHRcdFx0dmFyIG0gPSBzZWxmLnNjZW5lLm1lc2hlc1thLmNvbnRyb2wub2JqZWN0X2d1aWRdXG5cdFx0XHRcdHZhciB2ID0gbS52ZWw7XG5cdFx0XHRcdGlmICh2KXtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhpLCB2LngsIHYueSwgdi56KVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHQqL1xuXHRcdFx0XG5cdFx0fVxuXHRcdFxuXHR9ZWxzZXtcblx0XHRzZWxmLl9kID0gZmFsc2Vcblx0fVxuXHRcblx0Xy5lYWNoKHNlbGYubWVzaGVzLCBmdW5jdGlvbihtZXNoLCBpKXtcblx0XHRpZiAobWVzaC50eXBlID09ICdzdGF0aWMnKSByZXR1cm47XG5cdFx0Ly8gdmFyIG1lc2ggPSBzZWxmLm1lc2hlc1tpXTtcblx0XHRpZihtZXNoLmhhc19lbmdpbmVzKXtcblx0XHRcdHRvdGFsX2FjYyA9IG5ldyBzZWxmLlRIUkVFLlZlY3RvcjMoMCwwLDApO1xuXHRcdFx0XG5cdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IG1lc2gub25fZW5naW5lc19wcm9wdWxzaW9uLmxlbmd0aDsgaisrKXtcblx0XHRcdFxuXHRcdFx0XHR2YXIgZW5naW5lID0gbWVzaC5vbl9lbmdpbmVzX3Byb3B1bHNpb25bal1cblx0XHRcdFx0dmFyIGF4aXMgPSBlbmdpbmVbMF0gPT0gJ3gnP25ldyBzZWxmLlRIUkVFLlZlY3RvcjMoMSwwLDApOihlbmdpbmVbMF0gPT0neSc/bmV3IHNlbGYuVEhSRUUuVmVjdG9yMygwLCAxLCAwKTogbmV3IHNlbGYuVEhSRUUuVmVjdG9yMygwLDAsMSkpXG5cdFx0XHRcdHZhciBkaXIgID0gZW5naW5lWzFdID09ICcrJz8xOi0xXG5cdFx0XHRcdHZhciBhY2MgPSBtZXNoLmVuZ2luZXMucHJvcHVsc2lvbltlbmdpbmVdIC8gbWVzaC5tYXNzXG5cdFx0XHRcdGF4aXMubXVsdGlwbHlTY2FsYXIoYWNjKS5tdWx0aXBseVNjYWxhcihkaXIpLmFwcGx5UXVhdGVybmlvbihtZXNoLnF1YXRlcm5pb24pO1xuXHRcdFx0XHR0b3RhbF9hY2MuYWRkKGF4aXMpXG5cdFx0XHR9XG5cdFx0XHRpZihtZXNoLnZlbCA9PT0gdW5kZWZpbmVkKW1lc2gudmVsID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMygwLDAsMClcblx0XHRcdG1lc2gudmVsID0gdG90YWxfYWNjLmNsb25lKCkubXVsdGlwbHlTY2FsYXIodGltZV9sZWZ0KS5hZGQobWVzaC52ZWwpIFxuXHRcdFx0bWVzaC5wb3MgPSB0b3RhbF9hY2MuY2xvbmUoKS5tdWx0aXBseVNjYWxhcih0aW1lX2xlZnQgKiB0aW1lX2xlZnQpXG5cdFx0XHRcdFx0ICAgICAgIC5hZGQobWVzaC52ZWwuY2xvbmUoKS5tdWx0aXBseVNjYWxhcih0aW1lX2xlZnQpKVxuXHRcdFx0XHRcdFx0ICAgLmFkZChtZXNoLnBvcyk7XG5cdFx0XHRcdCAgIFxuXHRcdFx0dmFyIHRvdGFsX2FhY2MgPSBuZXcgc2VsZi5USFJFRS5WZWN0b3IzKDAsMCwwKVxuXHRcdFx0Ly8gY29uc29sZS5sb2cobWVzaC5vbl9lbmdpbmVzX3JvdGF0aW9uKTtcblx0XHRcdGZvcih2YXIgaiA9MDsgaiA8IG1lc2gub25fZW5naW5lc19yb3RhdGlvbi5sZW5ndGg7IGorKyl7XG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKFwiV1RGXCIpO1xuXHRcdFx0XHR2YXIgZW5naW5lID0gbWVzaC5vbl9lbmdpbmVzX3JvdGF0aW9uW2pdXG5cdFx0XHRcdHZhciBheGlzID0gZW5naW5lWzBdID09ICd4Jz9uZXcgc2VsZi5USFJFRS5WZWN0b3IzKDEsMCwwKTooZW5naW5lWzBdID09J3knP25ldyBzZWxmLlRIUkVFLlZlY3RvcjMoMCwgMSwgMCk6IG5ldyBzZWxmLlRIUkVFLlZlY3RvcjMoMCwwLDEpKVxuXHRcdFx0XHR2YXIgZGlyICA9IGVuZ2luZVsxXSA9PSAnKyc/MTotMVxuXHRcdFx0XHR2YXIgYWFjYyA9IG1lc2guZW5naW5lcy5yb3RhdGlvbltlbmdpbmVdIC8gbWVzaC5tYXNzXG5cdFx0XHRcdGF4aXMubXVsdGlwbHlTY2FsYXIoYWFjYykubXVsdGlwbHlTY2FsYXIoZGlyKVxuXHRcdFx0XHR0b3RhbF9hYWNjLmFkZChheGlzKVxuXHRcdFx0fVxuXHRcdFx0aWYobWVzaC5hdmVsID09PSB1bmRlZmluZWQpIG1lc2guYXZlbCA9IG5ldyBzZWxmLlRIUkVFLlZlY3RvcjMoMCwwLDApXG5cdFx0XHQvLyBjb25zb2xlLmxvZyhtZXNoLmF2ZWwpXG5cdFx0XHRtZXNoLmF2ZWwgPSB0b3RhbF9hYWNjLmNsb25lKCkubXVsdGlwbHlTY2FsYXIodGltZV9sZWZ0KS5hZGQobWVzaC5hdmVsKVxuXHRcdFx0bWVzaC5yb3QgID0gdG90YWxfYWFjYy5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKHRpbWVfbGVmdCAqIHRpbWVfbGVmdClcblx0XHRcdFx0XHQgICAgICAgLmFkZChtZXNoLmF2ZWwuY2xvbmUoKS5tdWx0aXBseVNjYWxhcih0aW1lX2xlZnQpKVxuXHRcdFx0bWVzaC5yb3RhdGVYKG1lc2gucm90LngpXG5cdFx0XHRtZXNoLnJvdGF0ZVkobWVzaC5yb3QueSlcblx0XHRcdG1lc2gucm90YXRlWihtZXNoLnJvdC56KTtcblx0XHRcblx0XHR9ZWxzZXtcblx0XHRcdC8vIGNvbnNvbGUubG9nKG1lc2gucG9zKTtcblx0XHRcdGlmIChtZXNoLnZlbCl7XG5cdFx0XHRcdG1lc2gucG9zID1tZXNoLnZlbC5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKHRpbWVfbGVmdCkuYWRkKG1lc2gucG9zKTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0XG5cdFx0fVxuXHRcdG1lc2gucG9zaXRpb24gPSBtZXNoLnBvcztcblx0XHR2YXIgX3RoaXNfY2FjaGU9e31cblx0XHRfLmVhY2goWydwb3NpdGlvbicsICdyb3RhdGlvbicsICd2ZWwnLCAnYXZlbCcsJ2FjYycsICdhYWNjJ10sIGZ1bmN0aW9uKHYpe1xuXHRcdFx0dmFyIHZlYyA9IG1lc2hbdl07XG5cdFx0XHRpZiggdmVjICkgX3RoaXNfY2FjaGVbdl0gPSB2ZWMudG9BcnJheSgpO1xuXHRcdH0pXG5cdFx0c2VsZi5fc2NlbmVfb2JqZWN0X2NhY2hlW2ldID0gX3RoaXNfY2FjaGU7XG5cdFx0XG5cdH0pXG59XG5TY2VuZU9iamVjdC5wcm90b3R5cGUgPSBTY2VuZVxubW9kdWxlLmV4cG9ydHMgPSBTY2VuZU9iamVjdCIsInZhciBTY2VuZSA9IHJlcXVpcmUoJy4vc2NlbmUuanMnKVxudmFyIHUgPSByZXF1aXJlKCcuL3V0aWxzLmpzJylcbnZhciBfICAgICA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcblxuXG52YXIgTWlzc2lvbiA9IGZ1bmN0aW9uKCl7XG5cdHRoaXMuZGVzY3IgPSBcIk1pc3Npb25cIlxuXHRcbn1cbk1pc3Npb24ucHJvdG90eXBlID0ge1xuXHRjb25zdHJ1Y3RvcjogTWlzc2lvbixcblx0XG5cblxuXHRjcmVhdGUgOmZ1bmN0aW9uKGNyZWF0b3JfbG9naW4sIGNhbGxiYWNrKXtcblx0XG5cdFx0Ly8gTm8gcGFyYW1zIC0gb25seSBvbmUgbWlzc2lvbiBhdmFpbGFibGVcblx0XHR2YXIgc2VsZiA9IHRoaXMgO1xuXHRcdHRoaXMuR1VJRCA9IHUubWFrZV9ndWlkKCk7XG5cdFx0dGhpcy5jcmVhdG9yID0gY3JlYXRvcl9sb2dpbjtcblx0XHR0aGlzLnJlYWR5X3RvX3N0YXJ0ID0gZmFsc2Vcblx0XHR0aGlzLl90b3RhbF9hY3RvcnMgPSAwO1xuXHRcdHRoaXMuX3RvdGFsX2xvZ2lucyA9IDA7XG5cdFx0dmFyIHAxID0gWy0xMTAsIDEwMCwgNDBdO1xuXHRcdHZhciBwMiA9IFs1MDAsIDIwMCwgLTUwXTtcblx0XHR2YXIgYyA9IDAuMlxuXHRcdHZhciBwMSA9IF8ubWFwKHAxLGZ1bmN0aW9uKHYpe3JldHVybiB2KmN9KTtcblx0XHR2YXIgcDIgPSBfLm1hcChwMixmdW5jdGlvbih2KXtyZXR1cm4gdipjfSk7O1xuXHRcblx0XHR2YXIgZGVmX3NoaXAxID0ge3R5cGU6J3NoaXAnLFxuXHRcdFx0XHRcdFx0IFwic2hpcF90eXBlXCI6XCJEZWZhdWx0XCIsXG5cdFx0XHRcdFx0XHRcdCBtb2RlbF8zZDonL21vZGVscy9TdGFyQ3J1aXNlci5qcycsXG5cdFx0XHRcdFx0XHRcdCBwaHlzaWNhbDp7XG5cdFx0XHRcdFx0XHRcdFx0IHBvczpwMSxcblx0XHRcdFx0XHRcdFx0XHQgcm90Ont0bzogcDJ9LFxuXHRcdFx0XHRcdFx0XHQgfSxcblx0XHRcdFx0XHRcdCBcblx0XHRcdFx0XHRcdFx0IFwiY2FtZXJhc1wiOntcblx0XHRcdFx0XHRcdFx0XHRcdFwiZnJvbnRcIjp7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFwibGFiZWxcIjpcIm1haW5cIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XCJwb3NpdGlvblwiOiBbMCwwLjUsMF0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFwiZGlyZWN0aW9uXCI6WzAsMCwtMV1cblx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFwiYmFja1wiOntcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcImxhYmVsXCI6XCJtYWluXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJwb3NpdGlvblwiOiBbMCwwLjUsMl0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJkaXJlY3Rpb25cIjpbMCwwLDFdXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcInR1cnJldHNcIjp7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJmcm9udFwiOntcInR5cGVcIjpcImJhbGxpc3RpY1wiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQgXCJwb3NpdGlvblwiOiBbMCwwLjUsMF19LFxuXHRcdFx0IFx0XHRcdFx0XHRcdFx0XHRcImJhY2tcIjp7XCJ0eXBlXCI6XCJiYWxsaXN0aWNcIixcblx0XHRcdCBcdFx0XHRcdFx0XHRcdFx0XHRcdCBcInBvc2l0aW9uXCI6IFswLDAsMl19XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XCJ3b3JrcG9pbnRzXCI6e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwiUGlsb3RpbmdcIjp7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwidmlld3NcIjogW1wiZnJvbnRcIixcImJhY2tcIl0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwidHlwZVwiOlwicGlsb3RcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcIkZyb250IHR1cnJldFwiOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwidmlld3NcIjpbXCJmcm9udFwiXSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJ0eXBlXCI6XCJ0dXJyZXRcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJ0dXJyZXRcIjpcImZyb250XCJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJCYWNrIHR1cnJldFwiOntcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJ2aWV3c1wiOltcImJhY2tcIl0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwidHlwZVwiOlwidHVycmV0XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwidHVycmV0XCI6XCJiYWNrXCJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdCdlbmdpbmVzJzp7XG5cdFx0XHRcdFx0XHRcdFx0J3JvdGF0aW9uJzp7XG5cdFx0XHRcdFx0XHRcdFx0XHQneCsnOjEwMDAsJ3gtJzoxMDAwLFxuXHRcdFx0XHRcdFx0XHRcdFx0J3krJzoxMDAwLCd5LSc6MTAwMCxcblx0XHRcdFx0XHRcdFx0XHRcdCd6Kyc6MTAwMCwnei0nOjEwMDBcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdCdwcm9wdWxzaW9uJzp7XG5cdFx0XHRcdFx0XHRcdFx0XHQneCsnOjEsJ3gtJzoxLFxuXHRcdFx0XHRcdFx0XHRcdFx0J3krJzoxLCd5LSc6MSxcblx0XHRcdFx0XHRcdFx0XHRcdCd6Kyc6NTAwMCwnei0nOjUwMDBcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdCdtYXNzJzogMTAwMDAsXG5cdFx0XHRcdFx0XHRcdCdHVUlEJzp1Lm1ha2VfZ3VpZCgpXG5cdFx0XHRcdFx0XHR9XG5cdFx0dmFyIGRlZl9zaGlwMiA9IHt0eXBlOidzaGlwJyxcblx0IFx0XHRcdFx0XHQgXCJzaGlwX3R5cGVcIjpcIkRlZmF1bHRcIixcblx0XHRcblx0XHRcdFx0XHRcdFx0IG1vZGVsXzNkOicvbW9kZWxzL1N0YXJDcnVpc2VyLmpzJyxcblx0XHRcdFx0XHRcdFx0IHBoeXNpY2FsOntcblx0XHRcdFx0XHRcdFx0XHQgcG9zOnAyLFxuXHRcdFx0XHRcdFx0XHRcdCByb3Q6e3RvOiBwMX0sXG5cdFx0XHRcdFx0XHRcdCBcblx0XHRcdFx0XHRcdFx0IH0sXG5cdFx0XHRcdCBcdFx0XHRcImNhbWVyYXNcIjp7XG5cdFx0XHRcdCBcdFx0XHRcdFx0XCJmcm9udFwiOntcblx0XHRcdFx0IFx0XHRcdFx0XHRcdFwibGFiZWxcIjpcIm1haW5cIixcblx0XHRcdFx0IFx0XHRcdFx0XHRcdFwicG9zaXRpb25cIjogWzAsMC41LDBdLFxuXHRcdFx0XHQgXHRcdFx0XHRcdFx0XCJkaXJlY3Rpb25cIjpbMCwwLC0xXVxuXHRcdFx0XHQgXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0IFx0XHRcdFx0XHRcImJhY2tcIjp7XG5cdFx0XHRcdCBcdFx0XHRcdFx0XHRcdFwibGFiZWxcIjpcIm1haW5cIixcblx0XHRcdFx0IFx0XHRcdFx0XHRcdFx0XCJwb3NpdGlvblwiOiBbMCwwLjUsMl0sXG5cdFx0XHRcdCBcdFx0XHRcdFx0XHRcdFwiZGlyZWN0aW9uXCI6WzAsMCwxXVxuXHRcdFx0XHQgXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFwidHVycmV0c1wiOntcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcImZyb250XCI6e1widHlwZVwiOlwiYmFsbGlzdGljXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCBcInBvc2l0aW9uXCI6IFswLDAuNSwwXX0sXG5cdFx0XHQgXHRcdFx0XHRcdFx0XHRcdFwiYmFja1wiOntcInR5cGVcIjpcImJhbGxpc3RpY1wiLFxuXHRcdFx0IFx0XHRcdFx0XHRcdFx0XHRcdFx0IFwicG9zaXRpb25cIjogWzAsMCwyXX1cblxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcIndvcmtwb2ludHNcIjp7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJQaWxvdGluZ1wiOntcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJ2aWV3c1wiOiBbXCJmcm9udFwiLFwiYmFja1wiXSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJ0eXBlXCI6XCJwaWxvdFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwiRnJvbnQgdHVycmV0XCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJ2aWV3c1wiOltcImZyb250XCJdLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcInR5cGVcIjpcInR1cnJldFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcInR1cnJldFwiOlwiZnJvbnRcIlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcIkJhY2sgdHVycmV0XCI6e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcInZpZXdzXCI6W1wiYmFja1wiXSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJ0eXBlXCI6XCJ0dXJyZXRcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJ0dXJyZXRcIjpcImJhY2tcIlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0IFx0XHRcdCdlbmdpbmVzJzp7XG5cdFx0XHRcdCBcdFx0XHRcdCdyb3RhdGlvbic6e1xuXHRcdFx0XHQgXHRcdFx0XHRcdCd4Kyc6MTAwMCwneC0nOjEwMDAsXG5cdFx0XHRcdCBcdFx0XHRcdFx0J3krJzoxMDAwLCd5LSc6MTAwMCxcblx0XHRcdFx0IFx0XHRcdFx0XHQneisnOjEwMDAsJ3otJzoxMDAwXG5cdFx0XHRcdCBcdFx0XHRcdH0sXG5cdFx0XHRcdCBcdFx0XHRcdCdwcm9wdWxzaW9uJzp7XG5cdFx0XHRcdCBcdFx0XHRcdFx0J3grJzoxLCd4LSc6MSxcblx0XHRcdFx0IFx0XHRcdFx0XHQneSsnOjEsJ3ktJzoxLFxuXHRcdFx0XHQgXHRcdFx0XHRcdCd6Kyc6NTAwMCwnei0nOjUwMDBcblx0XHRcdFx0IFx0XHRcdFx0fVxuXHRcdFx0XHQgXHRcdFx0fSxcblx0XHRcdFx0IFx0XHRcdCdtYXNzJzogMTAwMDAsXG5cdFx0XHRcdFx0XHRcdCdHVUlEJzp1Lm1ha2VfZ3VpZCgpXG5cdFx0XHRcdFx0XHR9XG5cdFx0Ly8g0JbQtdGB0YLQutC+INC30LDQtNCw0L3QvdGL0LUg0LrQvtGA0LDQsdC70LjQutC4IC0g0LHQtdC3INC/0L7Qt9C40YbQuNC5INC4INGB0LrQvtGA0L7RgdGC0LXQuVx0XG5cdFx0dmFyIHBpdm90PSBcdGZ1bmN0aW9uKHgseSx6KXtcblx0XHRcdHJldHVybiB7dHlwZTonc3RhdGljJyxcblx0XHRcdFxuXHRcdFx0XHRcdFx0XHQgbW9kZWxfM2Q6Jy9tb2RlbHMvc3AuanMnLFxuXHRcdFx0XHRcdFx0XHQgcGh5c2ljYWw6e1xuXHRcdFx0XHRcdFx0XHRcdCBwb3M6W3gsIHksIHpdXG5cdFx0XHRcdFx0XHRcdFx0IC8vcm90Ont0bzogWy0xMTAsIDEwMCwgNDBdfSxcblx0XHRcdFx0XHRcdFx0IFxuXHRcdFx0XHRcdFx0XHQgfSxcblx0XHRcdFx0IFx0XHRcdCdtYXNzJzogMTAwMDAwMCxcblx0XHRcdFx0XHRcdFx0J0dVSUQnOnUubWFrZV9ndWlkKClcblx0XHRcdFx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy5fZGgyID0gZGVmX3NoaXAyOyAvLyDQodC+0YXRgNCw0L3Rj9C10Lwg0LrQvtGA0LDQsdC70LjQuiAtINC/0L7RgtC+0LzRgyDRh9GC0L4g0L/QvtC60LAg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GMINC90LUg0LLRi9Cx0LjRgNCw0LXRgiDQutC+0YDQsNCx0LvRjCAtINC+0L0g0LXQvNGDINC90LDQt9C90LDRh9Cw0LXRgtGB0Y9cdFx0XG5cdFx0dmFyIHNvID0ge31cblx0XHRfLmVhY2goW2RlZl9zaGlwMSxkZWZfc2hpcDJdLCBmdW5jdGlvbihzKXtcblx0XHRcdHNvW3MuR1VJRF0gPSBzXG5cdFx0fSlcblx0XHQvLyDQl9C00LXRgdGMINC80Ysg0L/RgNC+0YHRgtC+INC90LDQv9C+0LvQvdGP0LXQvCDRgdGG0LXQvdGLINGI0LDRgNC40LrQsNC80LggLSDQv9C+INGD0LzRgywg0Y3RgtC4INGI0LDRgNC40LrQuCDQvdCw0LTQviDRgdC+0LfQtNCw0LLQsNGC0Ywg0L3QtSDQt9C00LXRgdGMIC0g0LAg0LjQvdC20LXQutGC0LjRgtGMINC40Lcg0LzQuNGA0LBcblx0XHQvKlxuXHRcdHZhciBpbmMgPSAwXG5cdFx0dmFyIHN0ZXAgPSAyMDA7XG5cdFx0Zm9yICh2YXIgeD0tMjAwOyB4PD0gMjAwOyB4Kz1zdGVwKXtcblx0XHRcdGZvciAodmFyIHk9LTIwMDsgeTw9IDIwMDsgeSs9c3RlcCl7XG5cdFx0XHRcdGZvciAodmFyIHo9LTIwMDsgejw9IDIwMDsgeis9c3RlcCl7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhpbmMsXCJ4LHkselwiLHgseSx6KVxuXHRcdFx0XHRcdGluYyArPTE7XG5cdFx0XHRcdFx0dmFyIHAgPXBpdm90KHgseSx6KVxuXHRcdFx0XHRcdHNvW3AuR1VJRF0gPSBwXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9Ki9cblx0XHQvLyAtLS0g0J3QsNC/0L7Qu9C90LXQvdC40LUg0YHRhtC10L3Ri1xuXHRcdHZhciBtaXNzaW9uID0ge1xuXHRcdFx0YWN0b3JzIDoge30sXG5cdFx0XHRjb21tYW5kczpbJ3JlZCcsICdibHVlJ10sXG5cdFx0XHRfY29tbWFuZHNfYW1vdW50OlsxLDBdLFxuXHRcdFx0bWF4X3Blcl9jb21tYW5kOjEsXG5cdFx0XHRtaW5fcGVyX2NvbW1hbmQ6MSxcblx0XHRcdGNvb3JkcyA6IFsxMDAsIDUwMCwgMzAwXSwgLy8gR2xvYmFsIGNvb3JkcyBvZiBtaXNzaW9uIG9yaWdpblxuXHRcdFx0c2hhcmVkX29iamVjdHM6IHNvLFxuXHRcdFx0b2JqZWN0c19mb3JfY29tbWFuZDp7XCJyZWRcIjpbZGVmX3NoaXAxLkdVSURdLFwiYmx1ZVwiOltkZWZfc2hpcDIuR1VJRF19XG5cdFx0XHRcblx0XHR9XG5cdFx0c2VsZi5fbWlzc2lvbl9sb2dpbnMgPSBbXTtcblx0XHRzZWxmLl9taXNzaW9uX29iamVjdHMgPSB7fVxuXHRcdHNlbGYubWlzc2lvbiA9IG1pc3Npb25cblx0XHRzZWxmLl9taXNzaW9uX3JlYWR5ID0gZnVuY3Rpb24oKXtcblx0XHRcdC8vIGNvbnNvbGUubG9nKCdvayAtIGxhdW5jaGluZycpXG5cdFx0XHQvLyB2YXIgc2NlbmUgPSBzZWxmLnByZXBhcmVfc2NlbmUoKVxuXHRcdFx0Ly8gY2FsbGJhY2sgKHNjZW5lKVxuXHRcdFxuXHRcdFxuXHRcdH1cblx0XHQvLyBzZWxmLnByZXBhcmVfc2NlbmUoKTtcblx0XHRyZXR1cm4gdGhpc1xuXHR9LFxuXHRwcmVwYXJlX3NjZW5lIDogZnVuY3Rpb24oKXtcblx0XG5cdFx0Ly8gY29uc29sZS5sb2coU2NlbmUpO1xuXHRcdGlmKCEgdGhpcy5fc2NlbmVfbG9hZGVkKXtcblx0XHRcdGNvbnNvbGUubG9nKFwiRE8gUFJFUCBTQ0VORVwiKVxuXHRcdFx0dGhpcy5fc2NlbmUgPSBuZXcgU2NlbmUoKTtcblx0XHRcdC8vY3JlYXRlX2Zyb21fd29ybGQodGhpcy5taXNzaW9uLmNvb3Jkc1swXSxcblx0XHRcdC8vXHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLm1pc3Npb24uY29vcmRzWzFdLFxuXHRcdFx0Ly9cdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMubWlzc2lvbi5jb29yZHNbMl0gKTtcblx0XHRcdHZhciBzZWxmID0gdGhpcztcblx0XHRcdF8uZWFjaCh0aGlzLm1pc3Npb24uc2hhcmVkX29iamVjdHMsIGZ1bmN0aW9uKG9iail7XG5cdFx0XHRcdHNlbGYuX3NjZW5lLmpvaW5fb2JqZWN0KG9iailcblx0XG5cdFx0XHR9KVx0XHRcdFx0XHRcdFx0XHRcdFx0XG5cdFx0XHRfLmVhY2godGhpcy5taXNzaW9uLmFjdG9ycywgZnVuY3Rpb24oYXMsIGxvZ2luKXsgLy8g0JzQuNGB0YHQuNGPINC00L4g0Y3RgtC+0LPQviDQstGA0LXQvNC10L3QuCDQvdC1INC40LzQtdC70LAg0YHRhtC10L3RiyAtINC90LDQtNC+INC00LDRgtGMINC10ZEg0LrQsNC20LTQvtC80YMg0LDQutGC0L7RgNGDINC30LTQtdGB0Yxcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhhKVxuXHRcdFx0XHRfLmVhY2goYXMsIGZ1bmN0aW9uKGEpeyAvLyDQn9C+INC70L7Qs9C40L3RgyDQvdCw0YXQvtC00LjRgtGB0Y8g0LzQsNGB0YHQuNCyINCw0LrRgtC+0YDQvtCyXG5cdFx0XHRcdFx0YS5zY2VuZSA9IHNlbGYuX3NjZW5lLkdVSURcblx0XHRcdFx0XHRzZWxmLl9zY2VuZS5qb2luX2FjdG9yKGEpO1xuXHRcdFx0XHR9KVxuXHRcdFx0fSlcblx0XHRcdHRoaXMuX3NjZW5lLnVwZGF0ZV9mcm9tX3dvcmxkKHRoaXMubWlzc2lvbi5jb29yZHNbMF0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMubWlzc2lvbi5jb29yZHNbMV0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMubWlzc2lvbi5jb29yZHNbMl0gKVxuXHRcdFx0dGhpcy5fc2NlbmVfbG9hZGVkPSB0cnVlO1xuXHRcdH1cblx0XHRcblx0XHRcdFx0XHRcdFx0XG5cdH0sXG5cdGpvaW5fcGxheWVyIDpmdW5jdGlvbihsb2dpbiwgY29tbWFuZCwgb2JqZWN0X2d1aWQsIHBsYWNlKXtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dmFyIE0gPSBzZWxmLm1pc3Npb247XG5cdFx0dmFyIGNvbW1hbmQ7XG5cdFx0Ly8gR2V0IGZpcnN0IGF2YWlsYWJsZSBjb21tYW5kXG5cdFx0Ly8gY29uc29sZS5sb2coXCJMT0dJTlwiLCBsb2dpbilcblx0XHRpZiAoc2VsZi5fbWlzc2lvbl9vYmplY3RzW29iamVjdF9ndWlkXSA9PT0gdW5kZWZpbmVkKXtcblx0XHRcdHNlbGYuX21pc3Npb25fb2JqZWN0c1tvYmplY3RfZ3VpZF0gPSB7fVxuXHRcdH1cblx0XHQvL18uZWFjaChwbGFjZXMsIGZ1bmN0aW9uKHApeyAvLyDQrdGC0L7RgiDQutGN0Ygg0LjRgdC/0L7Qu9GM0LfRg9C10YLRgdGPINC/0YDQuCDQt9Cw0L/QvtC70L3QtdC90LjQuCDQvNC10YHRgiDQvdCwINC60L7RgNCw0LHQu9C4XG5cdFx0XHRzZWxmLl9taXNzaW9uX29iamVjdHNbb2JqZWN0X2d1aWRdW3BsYWNlXSA9IGxvZ2luO1xuXHRcdFx0XG5cdFx0XHQvL30pXG5cdFx0Ly8gVE9ETyDQl9C00LXRgdGMINC90LDQtNC+INCy0YHRgtCw0LLQu9GP0YLRjCDQuNCz0YDQvtC60L7QsiAtINC90LXQt9Cw0LLQuNGB0LjQvNC+INC+0YIg0YLQvtCz0L4sINGB0LrQvtC70YzQutC+INC70L7Qs9C40L3QvtCyXG5cdFx0Ly8gVE9ETyDQndCw0LTQviDQv9GA0L7QstC10YDRj9GC0Ywg0L3QsNC70LjRh9C40LUg0LvQvtCz0LjQvdC+0LIg0Lgg0LXRgdC70Lgg0LXRgdGC0YwgLSDQvdC1INGC0YPQv9C+INC00L7QsdCw0LLQu9GP0YLRjCwg0LAg0LTQvtCx0LDQstC70Y/RgtGMINC10LzRgyDQstC+0YDQutC/0L7QuNC90YJcblx0XHQvLyDQn9C+INC30LDQvdGP0YLRi9C8INCy0L7RgNC60L/QvtC40L3RgtCw0Lwg0YHQuNGH0YLQsNGC0Ywg0LPQvtGC0L7QstC90L7RgdGC0Yxcblx0XHR2YXIgY29udHJvbGxhYmxlID0ge29iamVjdF9ndWlkOm9iamVjdF9ndWlkLCB3b3JrcG9pbnQ6cGxhY2V9IC8vIHZpZXdwb3J0Oidmcm9udCcsIGNvbnRyb2xzOlsnUGlsb3QnLCAnVHVycmV0J119IFxuXHRcdFxuXHRcdHZhciBhY3RvciA9IHtjb21tYW5kOmNvbW1hbmQsIGxvZ2luOmxvZ2luLCBjb250cm9sOiBjb250cm9sbGFibGV9XG5cdFx0Ly8g0JTQvtCx0LDQstC70Y/QtdC8INCw0LrRgtC+0YDQsCAtINC40L3QtNC10LrRgdC40YDRg9GPINC/0L4g0LvQvtCz0LjQvdGDXG5cdFx0aWYgKHNlbGYubWlzc2lvbi5hY3RvcnNbbG9naW5dID09PSB1bmRlZmluZWQpe1xuXHRcdFx0c2VsZi5taXNzaW9uLmFjdG9yc1tsb2dpbl0gPSBbYWN0b3JdXG5cdFx0fWVsc2V7XG5cdFx0XHRzZWxmLm1pc3Npb24uYWN0b3JzW2xvZ2luXS5wdXNoKGFjdG9yKVxuXHRcdH1cblx0XHRcblx0XHRzZWxmLl90b3RhbF9hY3RvcnMgKz0gMVxuXHRcdGlmKHNlbGYuX3RvdGFsX2FjdG9ycyA+PSAyKXtcblx0XHRcdGNvbnNvbGUubG9nKFwiTE9HSU5TXCIsIHNlbGYuX21pc3Npb25fbG9naW5zKTtcblx0XHRcdHNlbGYucmVhZHlfdG9fc3RhcnQgPSB0cnVlO1xuXHRcdH1lbHNle1xuXHRcdFx0Y29uc29sZS5sb2coXCJUT1RBTF9BQ1RPUlNcIiwgc2VsZi5fdG90YWxfYWN0b3JzKTtcblx0XHR9XG5cdFx0XG5cdFx0Y29uc29sZS5sb2coXCJUQVwiLHNlbGYuX3RvdGFsX2FjdG9ycyk7XG5cdFx0Ly8gY29uc29sZS5sb2coXCJBQ1RPUlNcIiwgc2VsZi5taXNzaW9uLmFjdG9ycyk7XG5cdFx0aWYgKHNlbGYuX3NjZW5lKXtcblx0XHRcdGFjdG9yLnNjZW5lID0gc2VsZi5fc2NlbmUuR1VJRFxuXHRcdFx0c2VsZi5fc2NlbmUuam9pbl9hY3RvcihhY3Rvcilcblx0XHR9XG5cdFxuXHR9LFxuXHRwb3NpdGlvbnM6IGZ1bmN0aW9uKGNiKXtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0Ly9jb25zb2xlLmxvZyh0aGlzKTtcblx0XHR2YXIgcGxhY2VzID0gW107XG5cdFx0Xy5lYWNoKHNlbGYubWlzc2lvbi5jb21tYW5kcywgZnVuY3Rpb24oY29tbWFuZCl7XG5cdFx0XHRfLmVhY2goc2VsZi5taXNzaW9uLm9iamVjdHNfZm9yX2NvbW1hbmRbY29tbWFuZF0sIGZ1bmN0aW9uKG9iamVjdF9ndWlkKXtcblx0XHRcdFx0Ly8gY29uc29sZS5sb2coY29tbWFuZCwgc2VsZi5taXNzaW9uLnNoYXJlZF9vYmplY3RzKTtcblx0XHRcdFx0dmFyIG9iamVjdCA9IHNlbGYubWlzc2lvbi5zaGFyZWRfb2JqZWN0c1tvYmplY3RfZ3VpZF1cblx0XHRcdFx0Xy5lYWNoKG9iamVjdC53b3JrcG9pbnRzLCBmdW5jdGlvbih3b3JrcG9pbnQsIHdwX2xhYmVsKXtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRcblx0XHRcdFx0XHR2YXIgcGxhY2UgPSB7J2NvbW1hbmQnOmNvbW1hbmQsXG5cdFx0XHRcdFx0IFx0XHRcdCAnb2JqZWN0X3R5cGUnOiBvYmplY3QudHlwZSxcblx0XHRcdFx0XHRcdFx0XHQgJ3NoaXBfdHlwZSc6b2JqZWN0LnNoaXBfdHlwZSxcblx0XHRcdFx0XHRcdFx0XHQgJ29iamVjdF9ndWlkJzogb2JqZWN0LkdVSUQsXG5cdFx0XHRcdFx0XHRcdCBcdCAnd29ya3BvaW50Jzp3cF9sYWJlbCxcblx0XHRcdFx0XHRcdFx0XHQgXG5cdFx0XHRcdFx0XHRcdCB9XG4gXHRcdFx0XHRcdHZhciBvID0gc2VsZi5fbWlzc2lvbl9vYmplY3RzW29iamVjdC5HVUlEXVxuIFx0XHRcdFx0XHRpZihvKXtcblx0XHRcdFx0XHRcdHZhciBsID0gb1t3cF9sYWJlbF07XG5cdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhcIkxMTExcIixsKVxuXHRcdFx0XHRcdFx0aWYobCl7XG5cdCBcdFx0XHRcdFx0XHRcdHBsYWNlLmJ1c3kgPSB0cnVlXG5cdFx0XHRcdFx0XHRcdFx0cGxhY2UuYWN0b3IgPSBsO1xuXHRcdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0fWVsc2V7cGxhY2UuYnVzeSA9IGZhbHNlfVxuXHRcdFxuIFx0XHRcdFx0XHR9XG5cdFx0XG5cdFx0XHRcdFx0XHRcdFx0IFxuXHRcdFx0XHRcdHBsYWNlcy5wdXNoKHBsYWNlKVxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2cocGxhY2UpXG5cdFx0XHRcdFx0XG5cdFx0XHRcdH0pXG5cdFx0XHRcdFxuXHRcdFx0XHRcblx0XHRcdH0pXG5cdFx0XHRcblx0XHR9KVxuXHRcdGNiKHBsYWNlcyk7XG5cdH1cblx0XG59XG4vL2NvbnNvbGUubG9nKE1pc3Npb24pO1xubW9kdWxlLmV4cG9ydHMgPSBNaXNzaW9uIiwidmFyIFRIUiA9IHJlcXVpcmUoJy4vdGhyZWUubm9kZS5qcycpO1xudmFyIFV0aWxzID0gcmVxdWlyZShcIi4vVXRpbHMuanNcIik7XG52YXIgXyAgICAgPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG5cblxudmFyIENvbnRyb2xsZXIgPSB7ZGVzY3JpcHRpb246J2NvbnRyb2xsZXInfVxuXHRcblx0XG5Db250cm9sbGVyLk5ldHdvcmtBY3RvciA9ICAgZnVuY3Rpb24oc2NlbmVzLCBzb2NrZXQsIG9uQWN0KXtcblx0XHRcblx0XHR2YXIgbWFwID0gQ29udHJvbGxlci5Db250cm9sbGVyc0FjdGlvbk1hcCgpXG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdFxuXHRcdHNvY2tldC5vbigncGxheWVyX2NvbnRyb2xzX29uJywgZnVuY3Rpb24oZGF0YSl7XG5cdFx0XHR2YXIgYWN0b3IgPSBkYXRhLmFjdG9yO1xuXHRcdFx0dmFyIGFjdGlvbiA9IGRhdGEuYWN0aW9uO1xuXHRcdFx0dmFyIFMgPSBzY2VuZXNbYWN0b3Iuc2NlbmVdO1xuXHRcdFx0Y29uc29sZS5sb2coXCJQUExBWSBDT05UT0xcIiwgYWN0b3IpO1xuXHRcdFx0c2VsZi5hY3QoUywgYWN0aW9uLCB0cnVlLCBhY3Rvcilcblx0XHRcblx0XHR9KVxuXHRcblx0XHRzb2NrZXQub24oJ3BsYXllcl9jb250cm9sc19vZmYnLCBmdW5jdGlvbihkYXRhKXtcblx0XHRcdC8vIGNvbnNvbGUubG9nKCdvayByZWN2JywgZGF0YSlcblx0XHRcdHZhciBhY3RvciA9IGRhdGEuYWN0b3Jcblx0XHRcdHZhciBhY3Rpb24gPSBkYXRhLmFjdGlvbjtcblx0XHRcdFxuXHRcdFx0dmFyIFMgPSBzY2VuZXNbYWN0b3Iuc2NlbmVdO1xuXHRcdFx0c2VsZi5hY3QoUywgYWN0aW9uLCBmYWxzZSwgYWN0b3IpXG5cdFx0XG5cdFx0fSlcblx0XHR0aGlzLnJ1biA9IGZ1bmN0aW9uKCl7XG5cdFx0XHQvLyBubyBuZWVkIHRvIGJvdGhlciAtIGV2ZW50IHN0eWxlXG5cdFx0fVxuXHRcdHRoaXMuYWN0PWZ1bmN0aW9uKFMsIGFjdGlvbiwgaXNfb24sIGFjdG9yKXtcblx0XHRcdC8vdmFyIEMgPSBXLm1lc2hlc1sgVy5hY3RvcnNbYWN0b3JdLmNvbnRyb2wub2JqZWN0X2d1aWQgXVxuXHRcdFx0Ly8gY29uc29sZS5sb2coYWN0aW9uKVxuXHRcdFx0Y29uc29sZS5sb2coXCJTQ0VORVNcIixzY2VuZXMsIGFjdG9yLnNjZW5lKTtcblx0XHRcblx0XHRcdHZhciBfYSA9IG1hcFthY3Rpb24udHlwZV0uYWN0KFMsIGFjdGlvbiwgaXNfb24sIGFjdG9yLCBvbkFjdCk7XG5cdFx0XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuQ29udHJvbGxlci5Mb2NhbElucHV0QWN0b3IgPSBmdW5jdGlvbihXLCBzb2NrZXQpe1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHRzZWxmLldvcmxkID0gVztcblx0XHR2YXIgbWFwID0gQ29udHJvbGxlci5Db250cm9sbGVyc0FjdGlvbk1hcCgpXG5cdFx0dmFyIGFjdG9yID0gVy5sb2dpbjtcblx0XHRcblx0XHRcblx0XHQvL3NlbGYuYWN0b3JfbG9naW4gPSBhY3Rvcl9sb2dpblxuXHRcdHNlbGYuX2RlZmF1bHRfYWN0aW9ucz17XG5cdFx0XHQ2NToge3R5cGU6J3JvdGF0ZScsIGF4aXM6J3knLGRpcjonKyd9LFxuXHRcdFx0Njg6IHt0eXBlOidyb3RhdGUnLCBheGlzOid5JyxkaXI6Jy0nfSxcblx0XHRcblx0XHRcdDg3OiB7dHlwZToncm90YXRlJywgYXhpczoneCcsZGlyOictJ30sXG5cdFx0XHQ4Mzoge3R5cGU6J3JvdGF0ZScsIGF4aXM6J3gnLGRpcjonKyd9LFxuXHRcdFxuXHRcdFx0OTA6IHt0eXBlOidyb3RhdGUnLCBheGlzOid6JyxkaXI6JysnfSxcblx0XHRcdDY3OiB7dHlwZToncm90YXRlJywgYXhpczoneicsZGlyOictJ30sXG5cdFx0XG5cdFx0XHQ3OToge3R5cGU6J3JvdGF0ZWMnLCBheGlzOid4JyxkaXI6JysnfSxcblx0XHRcdDgwOiB7dHlwZToncm90YXRlYycsIGF4aXM6J3gnLGRpcjonLSd9LFxuXHRcdFxuXHRcdFx0NzM6IHt0eXBlOidyb3RhdGVjJywgYXhpczoneScsZGlyOicrJ30sXG5cdFx0XHQ3NToge3R5cGU6J3JvdGF0ZWMnLCBheGlzOid5JyxkaXI6Jy0nfSxcblx0XHRcblx0XHRcdDM4OiB7dHlwZTonbW92ZScsIGF4aXM6J3onLGRpcjonLSd9LFxuXHRcdFx0NDA6IHt0eXBlOidtb3ZlJywgYXhpczoneicsZGlyOicrJ30sXG5cdFx0XG5cdFx0XHQnbG1vdXNlJzp7J3R5cGUnOiAnc2hvb3RfcHJpbWFyeScsICdfdHVycmV0X2RpcmVjdGlvbic6IGZ1bmN0aW9uKHQsayl7XG5cdFx0XHRcdGRlbGV0ZSB0W2tdXG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKFwid1wiKVxuXHRcdFx0XHRjb25zb2xlLmxvZyhXLmNvbnRyb2xsYWJsZSgpKTtcblx0XHRcdFx0dFtrLnN1YnN0cigxKV0gPSBXLm1vdXNlX3Byb2plY3Rpb25fdmVjLmNsb25lKCkuc3ViKFcuY29udHJvbGxhYmxlKCkucG9zaXRpb24uY2xvbmUoKSApXG5cdFx0XHR9fSxcblx0XHR9XG5cdFxuXHRcdHNlbGYuYWN0aW9ucyA9IHNlbGYuX2RlZmF1bHRfYWN0aW9ucztcblx0XHR0aGlzLmlucHV0ID0gZnVuY3Rpb24oa2V5Y29kZSwgdXBfb3JfZG93biwgbW9kaWZpZXJzKXtcblx0XHRcdC8vIDEuIFNlbmQgdG8gc2VydmVyIGFjdGlvblxuXHRcdFx0dmFyIGFjdGlvbiA9IF8uY2xvbmUoc2VsZi5hY3Rpb25zW2tleWNvZGVdKTtcblx0XHRcdFxuXHRcdFx0Ly8gY29uc29sZS5sb2coYWN0aW9uKTtcblx0XHRcdGlmIChhY3Rpb24pe1xuXHRcdFx0XHRfLmVhY2goYWN0aW9uLCBmdW5jdGlvbihpdGVtLCBrKXtcblx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZygnYScpO1xuXHRcdFx0XHRcdGlmIChrWzBdID09ICdfJyl7XG5cdFx0XHRcdFx0XHRpdGVtKGFjdGlvbixrKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhhY3Rpb24pO1xuXHRcdFx0XHQvLyBET05FXG5cdFx0XHRcdC8vIDIuIEFjdCBpdCBsb2NhbGx5XG5cdFx0XHRcdHZhciBvbkFjdCA9IGZ1bmN0aW9uKCl7IGNvbnNvbGUubG9nKCd0aGlzIGlzIGtleWJvYXJkIGNvbnRyb2xsZXIgLSBubyBuZWVkIGluIG9uQWN0IGhlcmUnKSB9XG5cdFx0XHRcdGxvY2FsX2NvbnRyb2xsZXIgPSBtYXBbYWN0aW9uLnR5cGVdXG5cdFx0XHRcdHZhciBhY3RvcnMgPSBXLmdldF9tYWluX3ZpZXdwb3J0KCkuYWN0b3JzXG5cdFx0XHRcdFxuXHRcdFx0XHRfLmVhY2goYWN0b3JzLCBmdW5jdGlvbihhY3Rvcil7XG5cdFx0XHRcdFx0dmFyIFMgPSBXLnNjZW5lc1thY3Rvci5zY2VuZV07XG5cdFx0XHRcdFx0dmFyIG9iaiA9IFMuZ2V0X29iamVjdHMoKVthY3Rvci5jb250cm9sLm9iamVjdF9ndWlkXTtcblx0XHRcdFx0XHR2YXIgd3AgPSBvYmoud29ya3BvaW50c1thY3Rvci5jb250cm9sLndvcmtwb2ludF07XG5cdFx0XHRcdFx0aWYgKHdwLnR5cGUgPT0gbG9jYWxfY29udHJvbGxlci50eXBlKXtcblx0XHRcdFx0XHRcdGxvY2FsX2NvbnRyb2xsZXIuYWN0KHNlbGYuV29ybGQuc2NlbmVzW2FjdG9yLnNjZW5lXSwgYWN0aW9uLCB1cF9vcl9kb3duLCBhY3Rvciwgb25BY3QpO1xuXHRcdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coYWN0aW9uKTtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0aWYgKHVwX29yX2Rvd24pe1xuXHRcdFx0XHRcdFx0XHRzb2NrZXQuZW1pdCgnY29udHJvbF9vbicsIHthY3Rpb246YWN0aW9uLCBhY3RvcjphY3Rvcn0pO1xuXHRcdFx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0XHRcdHNvY2tldC5lbWl0KCdjb250cm9sX29mZicsIHthY3Rpb246YWN0aW9uLCBhY3RvcjphY3Rvcn0pO1xuXHRcdFx0XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyh3cCk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdH0pXG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBsb2NhbF9jb250cm9sbGVyLmFjdChzZWxmLldvcmxkLnNjZW5lLCBhY3Rpb24sIHVwX29yX2Rvd24sIGFjdG9yLCBvbkFjdCk7XG5cdFx0XHR9XG5cdFx0XHQvL0RPTkVcblx0XHR9XG5cdH07XG5cblxuQ29udHJvbGxlci5DUGlsb3RDb250cm9sbGVyID0gZnVuY3Rpb24oKXtcblx0XHR0aGlzLnR5cGU9J3BpbG90Jztcblx0XHR0aGlzLmFjdGlvbl90eXBlcz1bJ3JvdGF0ZScsICdtb3ZlJ11cblx0XHRmdW5jdGlvbiBnZXRfYXhpcyhhKXtcblx0XHRcdGlmKGEgPT0gJ3gnKXtcblx0XHRcdFx0YXhpcyA9IG5ldyBDb250cm9sbGVyLlQoKS5WZWN0b3IzKDEsMCwwKVxuXHRcdFx0fVxuXHRcdFx0aWYoYSA9PSAneScpe1xuXHRcdFx0XHRheGlzID0gbmV3IENvbnRyb2xsZXIuVCgpLlZlY3RvcjMoMCwxLDApXG5cdFx0XHR9XG5cdFx0XHRpZihhID09ICd6Jyl7XG5cdFx0XHRcdGF4aXMgPSBuZXcgQ29udHJvbGxlci5UKCkuVmVjdG9yMygwLDAsMSlcblx0XHRcdH1cblx0XHRcdHJldHVybiBheGlzXG5cdFx0XG5cdFx0XG5cdFx0fVxuXHRcblx0XHR0aGlzLmFjdCA9IGZ1bmN0aW9uKFMsIGFjdGlvbiwgaXNfZG93biwgYWN0b3IsIG9uQWN0ICl7XG5cdFx0XHQvLyBjb25zb2xlLmxvZygnV2F0Jyk7XG5cdFx0XHQvLyBjb25zb2xlLmxvZyhcIm1vdmUgYnlcIiwgYWN0b3IpXG5cdFx0XHQvL2lmIChhY3RvciA9PT0gdW5kZWZpbmVkKXtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhcIk1ZXCIsIFcuYWN0b3JzW1cubG9naW5dLmNvbnRyb2wub2JqZWN0X2d1aWQpXG5cdFx0XHQvL1x0dmFyIEMgPSBTLmNvbnRyb2xsYWJsZSgpXG5cdFx0XHQvL31lbHNle1xuXHRcdFx0dmFyIEMgPSBTLm1lc2hfZm9yKGFjdG9yKVxuXHRcdFx0dmFyIFQgPSBDb250cm9sbGVyLlQoKTtcblx0XHRcdFxuXHRcdFx0XHQvL31cblxuXHRcblxuXHRcblx0XHRcdGlmIChhY3Rpb24udHlwZSA9PSAncm90YXRlJyl7XG5cdFx0XHRcdHZhciBhID0gYWN0aW9uLmRpciA9PSAnKyc/MTotMTtcblx0XHRcblx0XHRcdFx0aWYgKGlzX2Rvd24pe1xuXHRcdFx0XHRcdEMucHV0X29uKFwicm90YXRpb25cIiwgYWN0aW9uLmF4aXMrYWN0aW9uLmRpcilcblx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0Qy5wdXRfb2ZmKFwicm90YXRpb25cIiwgYWN0aW9uLmF4aXMrYWN0aW9uLmRpcilcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKGFjdGlvbi50eXBlID09ICdtb3ZlJyl7XG5cdFx0XG5cdFx0XHRcdHZhciBhID0gYWN0aW9uLmRpciA9PSAnKyc/MTotMTtcblx0XHRcblx0XHRcdFx0dmFyIG0gPSBuZXcgQ29udHJvbGxlci5UKCkuTWF0cml4NCgpXG5cdFx0XHRcdGlmIChpc19kb3duKXtcblx0XHRcdFx0XHRDLnB1dF9vbihcInByb3B1bHNpb25cIiwgYWN0aW9uLmF4aXMgKyBhY3Rpb24uZGlyKVxuXHRcdFx0XHR9ZWxzZXtcblx0XHRcdFx0XHRDLnB1dF9vZmYoXCJwcm9wdWxzaW9uXCIsIGFjdGlvbi5heGlzICsgYWN0aW9uLmRpcilcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcblx0XHRcdC8vaWYgKGFjdGlvbi50eXBlID09ICdyb3RhdGVjJyl7XG5cdFx0XHQvL1x0dmFyIGEgPSBhY3Rpb24uZGlyID09ICcrJz8xOi0xO1xuXHRcdFx0Ly9cdHZhciBhZyA9IGEgKiAwLjE7XG5cdFx0XHQvL1x0dmFyIGF4aXMgPSBnZXRfYXhpcyhhY3Rpb24uYXhpcyk7XG5cdFx0XHQvL1x0dmFyIF9xID0gbmV3IFQuUXVhdGVybmlvbigpO1xuXHRcdFx0Ly9cdF9xLnNldEZyb21BeGlzQW5nbGUoIGF4aXMsIGFnICk7XG5cdFx0XHQvL1x0Vy5jYW1lcmEucXVhdGVybmlvbi5tdWx0aXBseSggX3EgKTtcblx0XHRcdC8vXHRXLnNldENhbWVyYSgpO1xuXHRcdFx0Ly99XG5cdFx0XHRvbkFjdChDLkdVSUQpXG5cdFx0fVxuXHRcdC8vIHJldHVybiB0aGlzO1xuXHRcblx0fTtcblxuXG5Db250cm9sbGVyLmJhc2ljQXV0b1BpbG90QWN0b3I9ZnVuY3Rpb24gKFMsIGlkLCBvaWQpe1xuXHRcdHRoaXMudGFyZ2V0cyA9IFtcIm9yYml0X29iamVjdFwiLCBcImNsb3NlX3RvX29iamVjdFwiXTtcblx0XHR0aGlzLmRlZmF1bHRfZGlzdGFuY2UgPSAyMDBcblx0XHR0aGlzLmdldF9mb2VzID0gZnVuY3Rpb24oKXtcblx0XHRcdHRoaXMuZm9lcyA9IFtdXG5cdFx0XHRmb3IgKHZhciBpID0wOyBpIDwgVy5tZXNoZXMubGVuZ3RoOyBpKyspe1xuXHRcdFx0XHRpZihpICE9IGlkKSBmb2VzLnB1c2goe2lkOmlkLCBvYmo6Vy5tZXNoZXNbaV19KVxuXHRcdFx0fVxuXHRcdH1cblx0fTtcbkNvbnRyb2xsZXIuQmFzaWNCdWxsZXRBY3Rvcj1mdW5jdGlvbihTLCBpZCwgY29pZCl7IFxuXHRcdC8vIGlkID0gaXMgb2JqZWN0IGluIHRoZSB3b3JsZCBjb250cm9sbGFibGUgYnkgdGhpcyBhY3RvclxuXHRcdC8vIGNvaWQgIE1VU1QgQkUgYW4gb2JqZWN0LCB3aG8gc2hvb3QgdGhpcyBidWxsZXRcblx0XHQvL3ZhciBTID0gVy5zY2VuZVxuXHRcdHRoaXMubmFtZSA9IFwiQmFzaWNfYWN0b3JfXCIgKyAobmV3IERhdGUoKS5nZXRUaW1lKCkpXG5cdFx0Ly8gdGhpcy5XO1xuXHRcdHRoaXMub2lkID0gaWRcblx0XHR0aGlzLmNvaWQgPSBjb2lkXG5cdFx0Ly8gY29uc29sZS5sb2coaWQpO1xuXHRcdHRoaXMubXlfbWVzaCA9IFMubWVzaGVzW2lkXVxuXHRcdC8vY29uc29sZS5sb2coXCJNWSBNRVNIXCIsIHRoaXMubXlfbWVzaCwgaWQpXG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdC8vIGNvbnNvbGUubG9nKFcubWVzaGVzLCBpZCwgVy5tZXNoZXMubGVuZ3RoKVxuXHRcdHZhciB0b3RhbF90aW1lX2luX3NwYWNlID0gMDtcblx0XHR2YXIgX3Bvc3NpYmxlX3RhcmdldHMgPSB7fTtcblx0XHR2YXIgVCA9IENvbnRyb2xsZXIuVCgpO1xuXHRcblx0XHR0aGlzLnJ1biA9IGZ1bmN0aW9uKHRpbWVfbGVmdCl7XG5cdFx0XHR0b3RhbF90aW1lX2luX3NwYWNlICs9IHRpbWVfbGVmdFxuXHRcdFx0Ly9jb25zb2xlLmxvZygncnVubmluZycpO1xuXHRcdFx0aWYgKHRvdGFsX3RpbWVfaW5fc3BhY2UgPiAxMCl7XG5cdFx0XHRcdC8vUy5tZXNoZXMuc3BsaWNlKGlkLCAxKVxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKFwicmVtb3ZpbmdcIilcblx0XHRcdFx0Uy5fZGVsZXRlX29iamVjdChpZClcblx0XHRcdFx0ZGVsZXRlIFMuYXV0b21hdGljX2FjdG9yc1t0aGlzLm5hbWVdO1xuXHRcdFx0fVxuXHRcdFx0dmFyIHZlbCA9IHRoaXMubXlfbWVzaC52ZWwuY2xvbmUoKTtcblx0XHRcdHZhciBtcG9zID0gdGhpcy5teV9tZXNoLnBvc2l0aW9uLmNsb25lKCk7XG5cdFx0XG5cdFx0XHR2YXIgdGhyZXMgPSA0ICogdGhpcy5teV9tZXNoLnZlbC5sZW5ndGgoKTtcblx0XHRcdHZhciBpbl90aHJlcyA9IFtdO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhcIlRIUmVzXCIsIHRocmVzKTtcblx0XHRcblx0XHRcdF8uZWFjaCggUy5tZXNoZXMsIGZ1bmN0aW9uKG0saSkge1xuXHRcdFx0XHRpZihpID09PSBpZCB8fCBpID09PSBjb2lkKSByZXR1cm47XG5cdFx0XHRcdGlmKG0uaXNfbm90X2NvbGxpZGFibGUpIHJldHVybjtcblx0XHRcdFx0Ly8gdmFyIG0gPSBXLm1lc2hlc1tpXTtcblx0XHRcdFx0dmFyIG1wID0gIG0ucG9zaXRpb24uY2xvbmUoKTtcblx0XHRcdFx0dmFyIHBkID0gbXAuc3ViKCBtcG9zIClcblx0XHRcdFx0dmFyIGFnID0gTWF0aC5hY29zKHBkLmRvdCh2ZWwpLyB2ZWwubGVuZ3RoKCkgLyBwZC5sZW5ndGgoKSkgLy8g0YPQs9C+0Lsg0LzQtdC20LTRgyDQvdCw0L/RgNCw0LLQu9C10L3QuNC10Lwg0LTQstC40LbQtdC90LjRjyDQuCDRhtC10L3RgtGA0L7QvCDQvtCx0YrQtdC60YLQsFxuXHRcdFx0XHRpZiAoYWcgPCBNYXRoLlBJLzE2KVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnYWcnKTtcblx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhcIkhIXCIsIGksIGFnLCBNYXRoLlBJLzgpO1xuXHRcdFx0XHRcblx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhcImlkIHZlZm9yZVwiLCBcdGlkLCApO1xuXHRcdFx0XHRcdHZhciBzdWIgPSBzZWxmLm15X21lc2gucG9zaXRpb24uY2xvbmUoKS5zdWIoIG1wICk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0dmFyIGRpc3QgPSBzdWIubGVuZ3RoKClcblx0XHRcdFx0XHRpZiggZGlzdCA8IHRocmVzKXtcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coXCJPS0VcIik7XG5cdFx0XHRcdFx0XHRpZiggaW5fdGhyZXMuaW5kZXhPZiggaSApID09PSAtMSApe1xuXHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdwb3NzaWJsZScpO1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdGluX3RocmVzLnB1c2goaSkgLy8gQWRkIG1lc2ggaW5kZXhcblx0XHRcdFx0XHRcdFx0dGFyZ2V0ID0ge2xhc3RfcG9pbnQgOm1wb3MuY2xvbmUoKSxcblx0XHRcdFx0XHRcdFx0XHRcdCAgbGFzdF9hbmdsZSA6IGFnLFxuXHRcdFx0XHRcdFx0XHRcdFx0ICBsYXN0X2Rpc3RhbmNlIDogZGlzdCxcblx0XHRcdFx0XHRcdFx0XHRcdCAgYW5nbGVfcmFpc2UgOiAwLFxuXHRcdFx0XHRcdFx0XHRcdFx0ICBkaXN0YW5jZV9yYWlzZSA6MCxcblx0XHRcdFx0XHRcdFx0XHRcdCAgZGlzdGFuY2Vfc2hvcnRlbnMgOiAwLFxuXHRcdFx0XHRcdFx0XHRcdFx0ICBhbmdsZV9sb3dlcnMgOiAwLFxuXHRcdFx0XHRcdFx0XHRcdCAgXHQgIGlkIDogaX1cblx0XHRcdFx0XHRcdFx0X3Bvc3NpYmxlX3RhcmdldHNbaV0gPSB0YXJnZXRcblx0XHRcdFx0XHRcdH0vL2Vsc2V7fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcblx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0aWYoaSBpbiBfcG9zc2libGVfdGFyZ2V0cyl7XG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdQT1MnLCBpKVxuXHRcdFx0XHRcdFx0Ly8g0KPQs9C+0Lsg0LHRi9C7INC+0YHRgtGA0YvQuSAtINGB0YLQsNC7INGC0YPQv9C+0Llcblx0XHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKFwiaGVyZSFcIixpKTtcblx0XHRcdFx0XHRcdC8vINCd0LDQtNC+INC/0YDQvtCy0LXRgNC40YLRjCwg0L3QtSDQv9C10YDQtdGB0LXQutCw0LXRgiDQu9C4INC+0YLRgNC10LfQvtC6IC0g0L/RgNC+0YjQu9GL0LUg0LrQvtC+0YDQtNC40L3QsNGC0YsgLSDRgtC10LrRg9GJ0LjQtSDQutC+0L7RgNC00LjQvdCw0YLRiyDQvdCw0Ygg0LzQtdGIXG5cdFx0XHRcdFx0XHR2YXIgZGlyZWN0aW9uID0gbXBvcy5jbG9uZSgpLnN1YiggX3Bvc3NpYmxlX3RhcmdldHNbaV0ubGFzdF9wb2ludClcblx0XHRcdFx0XHRcdHZhciByYXkgPSBuZXcgVC5SYXljYXN0ZXIoX3Bvc3NpYmxlX3RhcmdldHNbaV0ubGFzdF9wb2ludCwgZGlyZWN0aW9uLmNsb25lKCkubm9ybWFsaXplKCkgKVxuXHRcdFx0XHRcdFx0aWYoUy5uZWVkX3VwZGF0ZV9tYXRyaXgpe1xuXHRcdFx0XHRcdFx0XHRtLnVwZGF0ZU1hdHJpeFdvcmxkKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR2YXIgaXNyID0gcmF5LmludGVyc2VjdE9iamVjdHMoW21dKVxuXHRcdFx0XHRcdFx0Ly9pZiAobS50eXBlID09ICdzaGlwJyl7XG5cdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhcIm1hdHJpeCBhdXRvdXBkXCIsIG0ubWF0cml4V29ybGQuZWxlbWVudHMpXG5cdFx0XHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKG1wb3MpO1xuXHRcdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhyYXksaXNyKVxuXHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0Ly99XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coIG0udHlwZSApXG5cdFx0XHRcdFx0XHRpZiAoaXNyLmxlbmd0aCA+IDAgJiYgaXNyWzBdLmRpc3RhbmNlIDwgZGlyZWN0aW9uLmxlbmd0aCgpICl7XG5cdFx0XHRcdFx0XHRcdC8vZm9yKCB2YXIgaW5kZXggPTA7IGluZGV4PGlzci5sZW5ndGg7IGluZGV4Kyspe1xuXHRcdFx0XHRcdFx0XHQvL1x0Y29uc29sZS5sb2coXCJIRVJFXCIsIGlzcltpbmRleF0uZGlzdGFuY2UsIGRpcmVjdGlvbi5sZW5ndGgoKSlcblx0XHRcdFx0XHRcdFx0Ly8vfVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnaGl0Jylcblx0XHRcdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coXCJFTkRcIiwgaXNyWzBdLnBvaW50KTtcblx0XHRcdFx0XHRcdFx0bS53b3JsZFRvTG9jYWwoaXNyWzBdLnBvaW50KSAvLyDQotC10L/QtdGA0Ywg0Y3RgtC+INC/0LvQtdGH0L4g0YPQtNCw0YDQsFxuXHRcdFx0XHRcdFx0XHR2YXIgaW1wdWxzZSA9IHZlbC5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKHNlbGYubXlfbWVzaC5tYXNzKVxuXHRcdFx0XHRcdFx0XHR2YXIgYXhpcyA9IG5ldyBULlZlY3RvcjMoKS5jcm9zc1ZlY3RvcnMoaXNyWzBdLnBvaW50LCBpbXB1bHNlKVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHR2YXIgYWcgPSBNYXRoLmFjb3MoaXNyWzBdLnBvaW50LmNsb25lKCkuZG90KGltcHVsc2UpIC8gaW1wdWxzZS5sZW5ndGgoKSAvIGlzclswXS5wb2ludC5sZW5ndGgoKSApXG5cdFx0XHRcdFx0XHRcdC8vINCi0LXQv9C10YDRjCDRjdGC0L4g0LLRgNCw0YnQtdC90LjQtSDQvdCw0LTQviDRgNCw0LfQsdC40YLRjCDQv9C+INC+0YHRj9C8XG5cdFx0XHRcdFx0XHRcdHZhciBtYXQgPSBuZXcgVC5NYXRyaXg0KCkubWFrZVJvdGF0aW9uQXhpcyhheGlzLm5vcm1hbGl6ZSgpLCBhZylcblx0XHRcdFx0XHRcdFx0dmFyIGV1bCA9IG5ldyBULkV1bGVyKClcblx0XHRcdFx0XHRcdFx0ZXVsLnNldEZyb21Sb3RhdGlvbk1hdHJpeChtYXQsIFwiWFlaXCIpXG5cdFx0XHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKGksIGV1bClcblx0XHRcdFx0XHRcdFx0dmFyIGF2ZWwgPSBuZXcgVC5WZWN0b3IzKCk7XG5cdFx0XHRcdFx0XHRcdGF2ZWwueCA9IGV1bC54O1xuXHRcdFx0XHRcdFx0XHRhdmVsLnkgPSBldWwueTtcblx0XHRcdFx0XHRcdFx0YXZlbC56ID0gZXVsLno7XG5cdFx0XHRcdFx0XHRcdHZhciBjayA9IGlzclswXS5wb2ludC5sZW5ndGgoKSAqIE1hdGguc2luKGFnIC0gTWF0aC5QSS8yKVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyh0aGlzLm15X21lc2gubWFzcyAvIG0ubWFzcyAqIChjayAqIGNrICkpO1xuXHRcdFx0XHRcdFx0XHRhdmVsLm11bHRpcGx5U2NhbGFyKHNlbGYubXlfbWVzaC5tYXNzL20ubWFzcyAqIE1hdGguYWJzKGNrKSlcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0Ly8g0J3QtSDRg9GH0LjRgtGL0LLQsNGOINC80LDRgdGB0YMg0Lgg0L/Qu9C10YfQvi4uLiBcblx0XHRcdFx0XHRcdFx0dmFyIG1hdmVsID0gUy5tZXNoZXNbaV0uYXZlbFxuXHRcdFx0XHRcdFx0XHRpZiAoISBtYXZlbCApe21hdmVsID0gbmV3IFQuVmVjdG9yMygwLDAsMCl9XG5cdFx0XHRcdFx0XHRcdG1hdmVsLnggKz0gYXZlbC54XG5cdFx0XHRcdFx0XHRcdG1hdmVsLnkgKz0gYXZlbC55XG5cdFx0XHRcdFx0XHRcdG1hdmVsLnogKz0gYXZlbC56O1xuXHRcdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhtYXZlbC54LCBtYXZlbC55LCBtYXZlbC56KVxuXHRcdFx0XHRcdFx0XHRTLm1lc2hlc1tpXS5hdmVsID0gbWF2ZWw7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdGFkZF92ZWwgPSBpbXB1bHNlLm11bHRpcGx5U2NhbGFyKCAxLyBtLm1hc3MpO1xuXHRcdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhhZGRfdmVsKVxuXHRcdFx0XHRcdFx0XHQvLyDQo9Cx0YDQsNGC0Ywg0L/QvtC60LAg0YHQutC+0YDQvtGB0YLRjFxuXHRcdFx0XHRcdFx0XHRpZiAoUy5tZXNoZXNbaV0udmVsKXtcblx0XHRcdFx0XHRcdFx0XHRTLm1lc2hlc1tpXS52ZWwuYWRkKGFkZF92ZWwpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coXCJFTkQgTE9DQUxcIiwgaXNyWzBdLnBvaW50KTtcblx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb2tlLCB3ZSBzaG9vdCBpdDonLCBpKVxuXHRcdFx0XHRcdFx0XHQvLyBOb3cgd2Ugd2lsbCBqdXN0IHJlbW92ZSBvYmplY3QgZnJvbSBzY2VuZSB3aXRoIHRoZSBidWxsZXRcblx0XHRcdFx0XHRcdFx0Ly9XLnNjZW5lLnJlbW92ZShXLm1lc2hlc1tpXSlcblx0XHRcdFx0XHRcdFx0Uy5fZGVsZXRlX29iamVjdChpZClcblx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdC8vaWYoUy50aHJlZV9zY2VuZSl7XG5cdFx0XHRcdFx0XHRcdC8vXHRTLnRocmVlX3NjZW5lLnJlbW92ZShTLm1lc2hlc1tpZF0pIC8vINGD0LTRj9C70Y/QtdC8INGP0LTRgNC+INC40Lcg0YHRhtC10L3Ri1xuXHRcdFx0XHRcdFx0XHQvL31cblx0XHRcdFx0XHRcdFx0Ly9kZWxldGUgUy5tZXNoZXNbIGlkIF07IC8vIC4uLiDQuNC3INC80LXRiNC10Llcblx0XHRcdFx0XHRcdFx0ZGVsZXRlIFMuYWN0b3JzW3NlbGYubmFtZV07IC8vIC4uLiDQo9C00LDQu9GP0LXQvCDRjdGC0L7Qs9C+INCw0LrRgtC+0YDQsCAtINCx0L7Qu9GM0YjQtSDQvdC1INC30LDQs9GA0YPQt9C40YLRgdGPINGN0YLQsCDRhNGD0L3QutGG0LjRj1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHQvL1cubWVzaGVzLnNwbGljZShpLCAxKTtcblx0XHRcdFx0XHRcdFx0ZGVsZXRlIF9wb3NzaWJsZV90YXJnZXRzW2ldIC8vIC4uLiDQuNC3INCy0L7Qt9C80L7QttC90YvRhSDRhtC10LvQtdC5INGD0LTQsNC70Y/QtdC8INGN0YLQvtGCINC80LXRiFxuXHRcdFx0XHRcdFx0XHQvLyBibGEuYmxhID0gMVxuXHRcdFx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0XHRcdGRlbGV0ZSBfcG9zc2libGVfdGFyZ2V0c1tpXTtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyggYWcsIE1hdGguUEkvOCk7XG5cdFx0XHRcdFxuXHRcdFx0XHR9XG5cdFx0XHRcblx0XHRcdH0pXG5cdFx0XHQvL2JsYS5iYWwgKz0xXG5cdFx0XHQvL2NvbnNvbGUubG9nKGJsYSlcblx0XHRcblx0XHRcblx0XHRcdC8vIGNvbnNvbGUubG9nKHRvdGFsX3RpbWVfaW5fc3BhY2UgLFcubWVzaGVzLmxlbmd0aCwgVy5hY3RvcnMpXG5cdFx0fVxuXHRcblx0XG5cdH07XG5cdFxuQ29udHJvbGxlci5DVHVycmV0Q29udHJvbGxlciA9IGZ1bmN0aW9uKCl7XG5cdHRoaXMudHlwZSA9ICd0dXJyZXQnO1xuXHRcdHRoaXMuYWN0ID0gZnVuY3Rpb24oUywgYWN0aW9uLCBpc19kb3duLCBhY3RvciApe1xuXHRcdFx0aWYgKGFjdGlvbi50eXBlID09J3Nob290X3ByaW1hcnknKXtcblx0XHRcdFx0Ly8gdmFyIHdlYXBvbiA9IEMud2VhcG9uc1swXTtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhcInNob3QgYnlcIiwgYWN0b3IpXG5cdFx0XHRcdHZhciBUID0gQ29udHJvbGxlci5UKCk7XG5cdFx0XHRcdC8vaWYgKGFjdG9yID09PSB1bmRlZmluZWQpe1xuXHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKFwiTVlcIiwgVy5nZXRfY3VycmVudF9hY3RvcigpLmNvbnRyb2wub2JqZWN0X2d1aWQpXG5cdFx0XHRcdC8vXHR2YXIgQyA9IFMubWVzaGVzWyBXLmdldF9hY3RvcihhY3RvcikuY29udHJvbC5vYmplY3RfZ3VpZCBdXG5cdFx0XHRcdC8vfWVsc2V7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coYWN0b3IsIGFjdGlvbik7XG5cdFx0XHRcdHZhciBDID0gUy5tZXNoZXNbYWN0b3IuY29udHJvbC5vYmplY3RfZ3VpZF1cblx0XHRcdFx0XG5cdFx0XHRcdFx0Ly99XG5cdFx0XHRcdGlmIChhY3Rpb24udHVycmV0X2RpcmVjdGlvbiBpbnN0YW5jZW9mIFQuVmVjdG9yMyl7XG5cdFx0XHRcdFx0dmFyIG1wdiA9IGFjdGlvbi50dXJyZXRfZGlyZWN0aW9uXG5cdFx0XHRcdFxuXHRcdFx0XHR9ZWxzZXtcblx0XHRcdFx0XHR2YXIgbXB2ID0gbmV3IFQuVmVjdG9yMyhhY3Rpb24udHVycmV0X2RpcmVjdGlvbi54LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YWN0aW9uLnR1cnJldF9kaXJlY3Rpb24ueSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGFjdGlvbi50dXJyZXRfZGlyZWN0aW9uLnopXG5cdFx0XHRcdH1cblx0XHRcdFx0bXB2Lm11bHRpcGx5U2NhbGFyKDAuNTAwMCk7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ1RIJywgQ29udHJvbGxlci5UKCkpXG5cdFx0XHRcdFxuXHRcdFx0XHR2YXIgYnVsbGV0ID0gQ29udHJvbGxlci5jcmVhdGVTaG90UGFydGljbGUoKTtcblx0XHRcdFx0YnVsbGV0LnBvcyA9IG5ldyBULlZlY3RvcjMoKVxuXHRcdFx0XHRidWxsZXQucG9zID0gQy5wb3NpdGlvbi5jbG9uZSgpXG5cdFx0XHRcblx0XHRcdFx0YnVsbGV0Lmhhc19lbmdpbmVzID0gZmFsc2U7XG5cdFx0XHRcdGJ1bGxldC5pc19ub3RfY29sbGlkYWJsZSA9IHRydWU7XG5cdFx0XHRcdGJ1bGxldC52ZWwgPSBtcHYvLy5tdWx0aXBseVNjYWxhcigwLjEwKTtcblx0XHRcdFx0YnVsbGV0Lm1hc3MgPSAxO1xuXHRcdFx0XHRpZiAoIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKXtcblx0XHRcdFx0XHRTLnRocmVlX3NjZW5lLmFkZCggYnVsbGV0ICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Ql9HVUlEID0gVXRpbHMubWFrZV9ndWlkKClcblx0XHRcdFx0Uy5tZXNoZXNbQl9HVUlEXSA9ICBidWxsZXQgO1xuXHRcdFx0XG5cdFx0XHRcdHZhciBidWxsZXRfYWN0b3IgPSBuZXcgQ29udHJvbGxlci5CYXNpY0J1bGxldEFjdG9yKFMsIEJfR1VJRCwgQy5HVUlEKVxuXHRcdFx0XHRTLmF1dG9tYXRpY19hY3RvcnNbYnVsbGV0X2FjdG9yLm5hbWVdID0gYnVsbGV0X2FjdG9yO1xuXHRcdFx0XHQvLyBjb25zb2xlLmxvZyhXLnNjZW5lLmF1dG9tYXRpY19hY3RvcnMpO1xuXHRcdFx0XG5cdFx0XHRcblx0XHRcdH1cblx0XHR9XG5cdFx0Ly8gcmV0dXJuIHRoaXM7XG5cdFxuXHR9O1xuQ29udHJvbGxlci5Db250cm9sbGVyc0FjdGlvbk1hcD0gZnVuY3Rpb24oKXtcblx0XHRpZiAodGhpcy5fQ29udHJvbGxlcnNBY3Rpb25NYXApe1xuXHRcdFx0cmV0dXJuIHRoaXMuX0NvbnRyb2xsZXJzQWN0aW9uTWFwXG5cdFx0fWVsc2V7XG5cdFx0XHR2YXIgUGlsb3RDb250cm9sbGVyID0gbmV3IENvbnRyb2xsZXIuQ1BpbG90Q29udHJvbGxlcigpO1xuXHRcdFx0dmFyIFR1cnJldENvbnRyb2xsZXIgPSBuZXcgQ29udHJvbGxlci5DVHVycmV0Q29udHJvbGxlcigpXG5cdFx0XHR0aGlzLl9Db250cm9sbGVyc0FjdGlvbk1hcCA9IHtcblx0XHRcdFx0J21vdmUnOiBQaWxvdENvbnRyb2xsZXIsXG5cdFx0XHRcdCdyb3RhdGUnOlBpbG90Q29udHJvbGxlcixcblx0XHRcdFx0J3JvdGF0ZWMnOiBQaWxvdENvbnRyb2xsZXIsXG5cdFx0XHRcdCdzaG9vdF9wcmltYXJ5JzogVHVycmV0Q29udHJvbGxlclxuXHRcdFx0fSBcdFx0XG5cdFx0XHRyZXR1cm4gdGhpcy5fQ29udHJvbGxlcnNBY3Rpb25NYXA7XG5cdFx0XHRcblx0XHR9XG5cdH1cblxuaWYodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpe1xuXHRDb250cm9sbGVyLlQgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiBUSFJcblx0fTtcblx0Q29udHJvbGxlci5jcmVhdGVTaG90UGFydGljbGU9ZnVuY3Rpb24oKXtcblx0XHR2YXIgVCA9IHRoaXMuVCgpO1xuXHRcdC8vdmFyIGN1YmVHZW9tZXRyeSA9IG5ldyBULkN1YmVHZW9tZXRyeSgxLDEsMSwxLDEsMSk7XG5cdFx0Ly92YXIgbWFwXHQ9IFQuSW1hZ2VVdGlscy5sb2FkVGV4dHVyZSggXCIvdGV4dHVyZXMvbGVuc2ZsYXJlL2xlbnNmbGFyZTAucG5nXCIgKTtcblx0XHQvL3ZhciBTcHJpdGVNYXRlcmlhbCA9IG5ldyBULlNwcml0ZU1hdGVyaWFsKCB7IG1hcDogbWFwLCBjb2xvcjogMHhmZmZmZmYsIGZvZzogdHJ1ZSB9ICk7XG5cdFx0cmV0dXJuIG5ldyBULk9iamVjdDNEKCk7XG5cdH07XG5cbn1lbHNle1xuXHRDb250cm9sbGVyLlQgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiBUSFJFRVxuXHR9O1xuXHRDb250cm9sbGVyLmNyZWF0ZVNob3RQYXJ0aWNsZT1mdW5jdGlvbigpe1xuXHRcdHZhciBUID0gdGhpcy5UKCk7XG5cdFx0Ly8gdmFyIGN1YmVHZW9tZXRyeSA9IG5ldyBULkN1YmVHZW9tZXRyeSgxLDEsMSwxLDEsMSk7XG5cdFx0dmFyIG1hcFx0PSBULkltYWdlVXRpbHMubG9hZFRleHR1cmUoIFwiL3RleHR1cmVzL2xlbnNmbGFyZS9sZW5zZmxhcmUwLnBuZ1wiICk7XG5cdFx0dmFyIG1hdGVyaWFsID0gbmV3IFQuU3ByaXRlTWF0ZXJpYWwoIHsgbWFwOiBtYXAsIGNvbG9yOiAweGZmZmZmZiwgZm9nOiB0cnVlIH0gKTtcblx0XHRtYXRlcmlhbC50cmFuc3BhcmVudCA9IHRydWU7XG5cdFx0bWF0ZXJpYWwuYmxlbmRpbmcgPSBUSFJFRS5BZGRpdGl2ZUJsZW5kaW5nO1xuXHRcdFxuXHRcdHJldHVybiBuZXcgVC5TcHJpdGUobWF0ZXJpYWwpO1xuXHR9O1xuXHRcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xsZXJcbi8vdmFyIFR1cnJldENvbnRyb2xsZXIgPSBuZXcgQ1R1cnJldENvbnRyb2xsZXIoKVxuLy9DUGlsb3RDb250cm9sbGVyLnByb3RvdHlwZSA9IHtjb25zdHJ1Y3RvcjpDUGlsb3RDb250cm9sbGVyfVxuLy92YXIgUGlsb3RDb250cm9sbGVyID0gbmV3IENQaWxvdENvbnRyb2xsZXIoKTtcblxuLy9jb25zb2xlLmxvZyhUdXJyZXRDb250cm9sbGVyLmFjdCwgUGlsb3RDb250cm9sbGVyLmFjdClcbiIsIi8vICAgICBVbmRlcnNjb3JlLmpzIDEuNS4yXG4vLyAgICAgaHR0cDovL3VuZGVyc2NvcmVqcy5vcmdcbi8vICAgICAoYykgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4vLyAgICAgVW5kZXJzY29yZSBtYXkgYmUgZnJlZWx5IGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cblxuKGZ1bmN0aW9uKCkge1xuXG4gIC8vIEJhc2VsaW5lIHNldHVwXG4gIC8vIC0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gRXN0YWJsaXNoIHRoZSByb290IG9iamVjdCwgYHdpbmRvd2AgaW4gdGhlIGJyb3dzZXIsIG9yIGBleHBvcnRzYCBvbiB0aGUgc2VydmVyLlxuICB2YXIgcm9vdCA9IHRoaXM7XG5cbiAgLy8gU2F2ZSB0aGUgcHJldmlvdXMgdmFsdWUgb2YgdGhlIGBfYCB2YXJpYWJsZS5cbiAgdmFyIHByZXZpb3VzVW5kZXJzY29yZSA9IHJvb3QuXztcblxuICAvLyBFc3RhYmxpc2ggdGhlIG9iamVjdCB0aGF0IGdldHMgcmV0dXJuZWQgdG8gYnJlYWsgb3V0IG9mIGEgbG9vcCBpdGVyYXRpb24uXG4gIHZhciBicmVha2VyID0ge307XG5cbiAgLy8gU2F2ZSBieXRlcyBpbiB0aGUgbWluaWZpZWQgKGJ1dCBub3QgZ3ppcHBlZCkgdmVyc2lvbjpcbiAgdmFyIEFycmF5UHJvdG8gPSBBcnJheS5wcm90b3R5cGUsIE9ialByb3RvID0gT2JqZWN0LnByb3RvdHlwZSwgRnVuY1Byb3RvID0gRnVuY3Rpb24ucHJvdG90eXBlO1xuXG4gIC8vIENyZWF0ZSBxdWljayByZWZlcmVuY2UgdmFyaWFibGVzIGZvciBzcGVlZCBhY2Nlc3MgdG8gY29yZSBwcm90b3R5cGVzLlxuICB2YXJcbiAgICBwdXNoICAgICAgICAgICAgID0gQXJyYXlQcm90by5wdXNoLFxuICAgIHNsaWNlICAgICAgICAgICAgPSBBcnJheVByb3RvLnNsaWNlLFxuICAgIGNvbmNhdCAgICAgICAgICAgPSBBcnJheVByb3RvLmNvbmNhdCxcbiAgICB0b1N0cmluZyAgICAgICAgID0gT2JqUHJvdG8udG9TdHJpbmcsXG4gICAgaGFzT3duUHJvcGVydHkgICA9IE9ialByb3RvLmhhc093blByb3BlcnR5O1xuXG4gIC8vIEFsbCAqKkVDTUFTY3JpcHQgNSoqIG5hdGl2ZSBmdW5jdGlvbiBpbXBsZW1lbnRhdGlvbnMgdGhhdCB3ZSBob3BlIHRvIHVzZVxuICAvLyBhcmUgZGVjbGFyZWQgaGVyZS5cbiAgdmFyXG4gICAgbmF0aXZlRm9yRWFjaCAgICAgID0gQXJyYXlQcm90by5mb3JFYWNoLFxuICAgIG5hdGl2ZU1hcCAgICAgICAgICA9IEFycmF5UHJvdG8ubWFwLFxuICAgIG5hdGl2ZVJlZHVjZSAgICAgICA9IEFycmF5UHJvdG8ucmVkdWNlLFxuICAgIG5hdGl2ZVJlZHVjZVJpZ2h0ICA9IEFycmF5UHJvdG8ucmVkdWNlUmlnaHQsXG4gICAgbmF0aXZlRmlsdGVyICAgICAgID0gQXJyYXlQcm90by5maWx0ZXIsXG4gICAgbmF0aXZlRXZlcnkgICAgICAgID0gQXJyYXlQcm90by5ldmVyeSxcbiAgICBuYXRpdmVTb21lICAgICAgICAgPSBBcnJheVByb3RvLnNvbWUsXG4gICAgbmF0aXZlSW5kZXhPZiAgICAgID0gQXJyYXlQcm90by5pbmRleE9mLFxuICAgIG5hdGl2ZUxhc3RJbmRleE9mICA9IEFycmF5UHJvdG8ubGFzdEluZGV4T2YsXG4gICAgbmF0aXZlSXNBcnJheSAgICAgID0gQXJyYXkuaXNBcnJheSxcbiAgICBuYXRpdmVLZXlzICAgICAgICAgPSBPYmplY3Qua2V5cyxcbiAgICBuYXRpdmVCaW5kICAgICAgICAgPSBGdW5jUHJvdG8uYmluZDtcblxuICAvLyBDcmVhdGUgYSBzYWZlIHJlZmVyZW5jZSB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QgZm9yIHVzZSBiZWxvdy5cbiAgdmFyIF8gPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqIGluc3RhbmNlb2YgXykgcmV0dXJuIG9iajtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgXykpIHJldHVybiBuZXcgXyhvYmopO1xuICAgIHRoaXMuX3dyYXBwZWQgPSBvYmo7XG4gIH07XG5cbiAgLy8gRXhwb3J0IHRoZSBVbmRlcnNjb3JlIG9iamVjdCBmb3IgKipOb2RlLmpzKiosIHdpdGhcbiAgLy8gYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgZm9yIHRoZSBvbGQgYHJlcXVpcmUoKWAgQVBJLiBJZiB3ZSdyZSBpblxuICAvLyB0aGUgYnJvd3NlciwgYWRkIGBfYCBhcyBhIGdsb2JhbCBvYmplY3QgdmlhIGEgc3RyaW5nIGlkZW50aWZpZXIsXG4gIC8vIGZvciBDbG9zdXJlIENvbXBpbGVyIFwiYWR2YW5jZWRcIiBtb2RlLlxuICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBfO1xuICAgIH1cbiAgICBleHBvcnRzLl8gPSBfO1xuICB9IGVsc2Uge1xuICAgIHJvb3QuXyA9IF87XG4gIH1cblxuICAvLyBDdXJyZW50IHZlcnNpb24uXG4gIF8uVkVSU0lPTiA9ICcxLjUuMic7XG5cbiAgLy8gQ29sbGVjdGlvbiBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBUaGUgY29ybmVyc3RvbmUsIGFuIGBlYWNoYCBpbXBsZW1lbnRhdGlvbiwgYWthIGBmb3JFYWNoYC5cbiAgLy8gSGFuZGxlcyBvYmplY3RzIHdpdGggdGhlIGJ1aWx0LWluIGBmb3JFYWNoYCwgYXJyYXlzLCBhbmQgcmF3IG9iamVjdHMuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBmb3JFYWNoYCBpZiBhdmFpbGFibGUuXG4gIHZhciBlYWNoID0gXy5lYWNoID0gXy5mb3JFYWNoID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuO1xuICAgIGlmIChuYXRpdmVGb3JFYWNoICYmIG9iai5mb3JFYWNoID09PSBuYXRpdmVGb3JFYWNoKSB7XG4gICAgICBvYmouZm9yRWFjaChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgfSBlbHNlIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IG9iai5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpbaV0sIGksIG9iaikgPT09IGJyZWFrZXIpIHJldHVybjtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtrZXlzW2ldXSwga2V5c1tpXSwgb2JqKSA9PT0gYnJlYWtlcikgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIHJlc3VsdHMgb2YgYXBwbHlpbmcgdGhlIGl0ZXJhdG9yIHRvIGVhY2ggZWxlbWVudC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYG1hcGAgaWYgYXZhaWxhYmxlLlxuICBfLm1hcCA9IF8uY29sbGVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdHM7XG4gICAgaWYgKG5hdGl2ZU1hcCAmJiBvYmoubWFwID09PSBuYXRpdmVNYXApIHJldHVybiBvYmoubWFwKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXN1bHRzLnB1c2goaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICB2YXIgcmVkdWNlRXJyb3IgPSAnUmVkdWNlIG9mIGVtcHR5IGFycmF5IHdpdGggbm8gaW5pdGlhbCB2YWx1ZSc7XG5cbiAgLy8gKipSZWR1Y2UqKiBidWlsZHMgdXAgYSBzaW5nbGUgcmVzdWx0IGZyb20gYSBsaXN0IG9mIHZhbHVlcywgYWthIGBpbmplY3RgLFxuICAvLyBvciBgZm9sZGxgLiBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgcmVkdWNlYCBpZiBhdmFpbGFibGUuXG4gIF8ucmVkdWNlID0gXy5mb2xkbCA9IF8uaW5qZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgbWVtbywgY29udGV4dCkge1xuICAgIHZhciBpbml0aWFsID0gYXJndW1lbnRzLmxlbmd0aCA+IDI7XG4gICAgaWYgKG9iaiA9PSBudWxsKSBvYmogPSBbXTtcbiAgICBpZiAobmF0aXZlUmVkdWNlICYmIG9iai5yZWR1Y2UgPT09IG5hdGl2ZVJlZHVjZSkge1xuICAgICAgaWYgKGNvbnRleHQpIGl0ZXJhdG9yID0gXy5iaW5kKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICAgIHJldHVybiBpbml0aWFsID8gb2JqLnJlZHVjZShpdGVyYXRvciwgbWVtbykgOiBvYmoucmVkdWNlKGl0ZXJhdG9yKTtcbiAgICB9XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKCFpbml0aWFsKSB7XG4gICAgICAgIG1lbW8gPSB2YWx1ZTtcbiAgICAgICAgaW5pdGlhbCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZW1vID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCBtZW1vLCB2YWx1ZSwgaW5kZXgsIGxpc3QpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICghaW5pdGlhbCkgdGhyb3cgbmV3IFR5cGVFcnJvcihyZWR1Y2VFcnJvcik7XG4gICAgcmV0dXJuIG1lbW87XG4gIH07XG5cbiAgLy8gVGhlIHJpZ2h0LWFzc29jaWF0aXZlIHZlcnNpb24gb2YgcmVkdWNlLCBhbHNvIGtub3duIGFzIGBmb2xkcmAuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGByZWR1Y2VSaWdodGAgaWYgYXZhaWxhYmxlLlxuICBfLnJlZHVjZVJpZ2h0ID0gXy5mb2xkciA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIG1lbW8sIGNvbnRleHQpIHtcbiAgICB2YXIgaW5pdGlhbCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyO1xuICAgIGlmIChvYmogPT0gbnVsbCkgb2JqID0gW107XG4gICAgaWYgKG5hdGl2ZVJlZHVjZVJpZ2h0ICYmIG9iai5yZWR1Y2VSaWdodCA9PT0gbmF0aXZlUmVkdWNlUmlnaHQpIHtcbiAgICAgIGlmIChjb250ZXh0KSBpdGVyYXRvciA9IF8uYmluZChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgICByZXR1cm4gaW5pdGlhbCA/IG9iai5yZWR1Y2VSaWdodChpdGVyYXRvciwgbWVtbykgOiBvYmoucmVkdWNlUmlnaHQoaXRlcmF0b3IpO1xuICAgIH1cbiAgICB2YXIgbGVuZ3RoID0gb2JqLmxlbmd0aDtcbiAgICBpZiAobGVuZ3RoICE9PSArbGVuZ3RoKSB7XG4gICAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgICAgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgfVxuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGluZGV4ID0ga2V5cyA/IGtleXNbLS1sZW5ndGhdIDogLS1sZW5ndGg7XG4gICAgICBpZiAoIWluaXRpYWwpIHtcbiAgICAgICAgbWVtbyA9IG9ialtpbmRleF07XG4gICAgICAgIGluaXRpYWwgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVtbyA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgbWVtbywgb2JqW2luZGV4XSwgaW5kZXgsIGxpc3QpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICghaW5pdGlhbCkgdGhyb3cgbmV3IFR5cGVFcnJvcihyZWR1Y2VFcnJvcik7XG4gICAgcmV0dXJuIG1lbW87XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBmaXJzdCB2YWx1ZSB3aGljaCBwYXNzZXMgYSB0cnV0aCB0ZXN0LiBBbGlhc2VkIGFzIGBkZXRlY3RgLlxuICBfLmZpbmQgPSBfLmRldGVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0O1xuICAgIGFueShvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkge1xuICAgICAgICByZXN1bHQgPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gYWxsIHRoZSBlbGVtZW50cyB0aGF0IHBhc3MgYSB0cnV0aCB0ZXN0LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgZmlsdGVyYCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYHNlbGVjdGAuXG4gIF8uZmlsdGVyID0gXy5zZWxlY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHRzO1xuICAgIGlmIChuYXRpdmVGaWx0ZXIgJiYgb2JqLmZpbHRlciA9PT0gbmF0aXZlRmlsdGVyKSByZXR1cm4gb2JqLmZpbHRlcihpdGVyYXRvciwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkgcmVzdWx0cy5wdXNoKHZhbHVlKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICAvLyBSZXR1cm4gYWxsIHRoZSBlbGVtZW50cyBmb3Igd2hpY2ggYSB0cnV0aCB0ZXN0IGZhaWxzLlxuICBfLnJlamVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gXy5maWx0ZXIob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHJldHVybiAhaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpO1xuICAgIH0sIGNvbnRleHQpO1xuICB9O1xuXG4gIC8vIERldGVybWluZSB3aGV0aGVyIGFsbCBvZiB0aGUgZWxlbWVudHMgbWF0Y2ggYSB0cnV0aCB0ZXN0LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgZXZlcnlgIGlmIGF2YWlsYWJsZS5cbiAgLy8gQWxpYXNlZCBhcyBgYWxsYC5cbiAgXy5ldmVyeSA9IF8uYWxsID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGl0ZXJhdG9yIHx8IChpdGVyYXRvciA9IF8uaWRlbnRpdHkpO1xuICAgIHZhciByZXN1bHQgPSB0cnVlO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdDtcbiAgICBpZiAobmF0aXZlRXZlcnkgJiYgb2JqLmV2ZXJ5ID09PSBuYXRpdmVFdmVyeSkgcmV0dXJuIG9iai5ldmVyeShpdGVyYXRvciwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKCEocmVzdWx0ID0gcmVzdWx0ICYmIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkpIHJldHVybiBicmVha2VyO1xuICAgIH0pO1xuICAgIHJldHVybiAhIXJlc3VsdDtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgaWYgYXQgbGVhc3Qgb25lIGVsZW1lbnQgaW4gdGhlIG9iamVjdCBtYXRjaGVzIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYHNvbWVgIGlmIGF2YWlsYWJsZS5cbiAgLy8gQWxpYXNlZCBhcyBgYW55YC5cbiAgdmFyIGFueSA9IF8uc29tZSA9IF8uYW55ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGl0ZXJhdG9yIHx8IChpdGVyYXRvciA9IF8uaWRlbnRpdHkpO1xuICAgIHZhciByZXN1bHQgPSBmYWxzZTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHQ7XG4gICAgaWYgKG5hdGl2ZVNvbWUgJiYgb2JqLnNvbWUgPT09IG5hdGl2ZVNvbWUpIHJldHVybiBvYmouc29tZShpdGVyYXRvciwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKHJlc3VsdCB8fCAocmVzdWx0ID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKSkgcmV0dXJuIGJyZWFrZXI7XG4gICAgfSk7XG4gICAgcmV0dXJuICEhcmVzdWx0O1xuICB9O1xuXG4gIC8vIERldGVybWluZSBpZiB0aGUgYXJyYXkgb3Igb2JqZWN0IGNvbnRhaW5zIGEgZ2l2ZW4gdmFsdWUgKHVzaW5nIGA9PT1gKS5cbiAgLy8gQWxpYXNlZCBhcyBgaW5jbHVkZWAuXG4gIF8uY29udGFpbnMgPSBfLmluY2x1ZGUgPSBmdW5jdGlvbihvYmosIHRhcmdldCkge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChuYXRpdmVJbmRleE9mICYmIG9iai5pbmRleE9mID09PSBuYXRpdmVJbmRleE9mKSByZXR1cm4gb2JqLmluZGV4T2YodGFyZ2V0KSAhPSAtMTtcbiAgICByZXR1cm4gYW55KG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gdGFyZ2V0O1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIEludm9rZSBhIG1ldGhvZCAod2l0aCBhcmd1bWVudHMpIG9uIGV2ZXJ5IGl0ZW0gaW4gYSBjb2xsZWN0aW9uLlxuICBfLmludm9rZSA9IGZ1bmN0aW9uKG9iaiwgbWV0aG9kKSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgdmFyIGlzRnVuYyA9IF8uaXNGdW5jdGlvbihtZXRob2QpO1xuICAgIHJldHVybiBfLm1hcChvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gKGlzRnVuYyA/IG1ldGhvZCA6IHZhbHVlW21ldGhvZF0pLmFwcGx5KHZhbHVlLCBhcmdzKTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBtYXBgOiBmZXRjaGluZyBhIHByb3BlcnR5LlxuICBfLnBsdWNrID0gZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICByZXR1cm4gXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSl7IHJldHVybiB2YWx1ZVtrZXldOyB9KTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBmaWx0ZXJgOiBzZWxlY3Rpbmcgb25seSBvYmplY3RzXG4gIC8vIGNvbnRhaW5pbmcgc3BlY2lmaWMgYGtleTp2YWx1ZWAgcGFpcnMuXG4gIF8ud2hlcmUgPSBmdW5jdGlvbihvYmosIGF0dHJzLCBmaXJzdCkge1xuICAgIGlmIChfLmlzRW1wdHkoYXR0cnMpKSByZXR1cm4gZmlyc3QgPyB2b2lkIDAgOiBbXTtcbiAgICByZXR1cm4gX1tmaXJzdCA/ICdmaW5kJyA6ICdmaWx0ZXInXShvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gYXR0cnMpIHtcbiAgICAgICAgaWYgKGF0dHJzW2tleV0gIT09IHZhbHVlW2tleV0pIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYGZpbmRgOiBnZXR0aW5nIHRoZSBmaXJzdCBvYmplY3RcbiAgLy8gY29udGFpbmluZyBzcGVjaWZpYyBga2V5OnZhbHVlYCBwYWlycy5cbiAgXy5maW5kV2hlcmUgPSBmdW5jdGlvbihvYmosIGF0dHJzKSB7XG4gICAgcmV0dXJuIF8ud2hlcmUob2JqLCBhdHRycywgdHJ1ZSk7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBtYXhpbXVtIGVsZW1lbnQgb3IgKGVsZW1lbnQtYmFzZWQgY29tcHV0YXRpb24pLlxuICAvLyBDYW4ndCBvcHRpbWl6ZSBhcnJheXMgb2YgaW50ZWdlcnMgbG9uZ2VyIHRoYW4gNjUsNTM1IGVsZW1lbnRzLlxuICAvLyBTZWUgW1dlYktpdCBCdWcgODA3OTddKGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD04MDc5NylcbiAgXy5tYXggPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKCFpdGVyYXRvciAmJiBfLmlzQXJyYXkob2JqKSAmJiBvYmpbMF0gPT09ICtvYmpbMF0gJiYgb2JqLmxlbmd0aCA8IDY1NTM1KSB7XG4gICAgICByZXR1cm4gTWF0aC5tYXguYXBwbHkoTWF0aCwgb2JqKTtcbiAgICB9XG4gICAgaWYgKCFpdGVyYXRvciAmJiBfLmlzRW1wdHkob2JqKSkgcmV0dXJuIC1JbmZpbml0eTtcbiAgICB2YXIgcmVzdWx0ID0ge2NvbXB1dGVkIDogLUluZmluaXR5LCB2YWx1ZTogLUluZmluaXR5fTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICB2YXIgY29tcHV0ZWQgPSBpdGVyYXRvciA/IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSA6IHZhbHVlO1xuICAgICAgY29tcHV0ZWQgPiByZXN1bHQuY29tcHV0ZWQgJiYgKHJlc3VsdCA9IHt2YWx1ZSA6IHZhbHVlLCBjb21wdXRlZCA6IGNvbXB1dGVkfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdC52YWx1ZTtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIG1pbmltdW0gZWxlbWVudCAob3IgZWxlbWVudC1iYXNlZCBjb21wdXRhdGlvbikuXG4gIF8ubWluID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0FycmF5KG9iaikgJiYgb2JqWzBdID09PSArb2JqWzBdICYmIG9iai5sZW5ndGggPCA2NTUzNSkge1xuICAgICAgcmV0dXJuIE1hdGgubWluLmFwcGx5KE1hdGgsIG9iaik7XG4gICAgfVxuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0VtcHR5KG9iaikpIHJldHVybiBJbmZpbml0eTtcbiAgICB2YXIgcmVzdWx0ID0ge2NvbXB1dGVkIDogSW5maW5pdHksIHZhbHVlOiBJbmZpbml0eX07XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgdmFyIGNvbXB1dGVkID0gaXRlcmF0b3IgPyBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkgOiB2YWx1ZTtcbiAgICAgIGNvbXB1dGVkIDwgcmVzdWx0LmNvbXB1dGVkICYmIChyZXN1bHQgPSB7dmFsdWUgOiB2YWx1ZSwgY29tcHV0ZWQgOiBjb21wdXRlZH0pO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQudmFsdWU7XG4gIH07XG5cbiAgLy8gU2h1ZmZsZSBhbiBhcnJheSwgdXNpbmcgdGhlIG1vZGVybiB2ZXJzaW9uIG9mIHRoZSBcbiAgLy8gW0Zpc2hlci1ZYXRlcyBzaHVmZmxlXShodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Zpc2hlcuKAk1lhdGVzX3NodWZmbGUpLlxuICBfLnNodWZmbGUgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgcmFuZDtcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIHZhciBzaHVmZmxlZCA9IFtdO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmFuZCA9IF8ucmFuZG9tKGluZGV4KyspO1xuICAgICAgc2h1ZmZsZWRbaW5kZXggLSAxXSA9IHNodWZmbGVkW3JhbmRdO1xuICAgICAgc2h1ZmZsZWRbcmFuZF0gPSB2YWx1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gc2h1ZmZsZWQ7XG4gIH07XG5cbiAgLy8gU2FtcGxlICoqbioqIHJhbmRvbSB2YWx1ZXMgZnJvbSBhbiBhcnJheS5cbiAgLy8gSWYgKipuKiogaXMgbm90IHNwZWNpZmllZCwgcmV0dXJucyBhIHNpbmdsZSByYW5kb20gZWxlbWVudCBmcm9tIHRoZSBhcnJheS5cbiAgLy8gVGhlIGludGVybmFsIGBndWFyZGAgYXJndW1lbnQgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgbWFwYC5cbiAgXy5zYW1wbGUgPSBmdW5jdGlvbihvYmosIG4sIGd1YXJkKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyIHx8IGd1YXJkKSB7XG4gICAgICByZXR1cm4gb2JqW18ucmFuZG9tKG9iai5sZW5ndGggLSAxKV07XG4gICAgfVxuICAgIHJldHVybiBfLnNodWZmbGUob2JqKS5zbGljZSgwLCBNYXRoLm1heCgwLCBuKSk7XG4gIH07XG5cbiAgLy8gQW4gaW50ZXJuYWwgZnVuY3Rpb24gdG8gZ2VuZXJhdGUgbG9va3VwIGl0ZXJhdG9ycy5cbiAgdmFyIGxvb2t1cEl0ZXJhdG9yID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gXy5pc0Z1bmN0aW9uKHZhbHVlKSA/IHZhbHVlIDogZnVuY3Rpb24ob2JqKXsgcmV0dXJuIG9ialt2YWx1ZV07IH07XG4gIH07XG5cbiAgLy8gU29ydCB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uIHByb2R1Y2VkIGJ5IGFuIGl0ZXJhdG9yLlxuICBfLnNvcnRCeSA9IGZ1bmN0aW9uKG9iaiwgdmFsdWUsIGNvbnRleHQpIHtcbiAgICB2YXIgaXRlcmF0b3IgPSBsb29rdXBJdGVyYXRvcih2YWx1ZSk7XG4gICAgcmV0dXJuIF8ucGx1Y2soXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgICBjcml0ZXJpYTogaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpXG4gICAgICB9O1xuICAgIH0pLnNvcnQoZnVuY3Rpb24obGVmdCwgcmlnaHQpIHtcbiAgICAgIHZhciBhID0gbGVmdC5jcml0ZXJpYTtcbiAgICAgIHZhciBiID0gcmlnaHQuY3JpdGVyaWE7XG4gICAgICBpZiAoYSAhPT0gYikge1xuICAgICAgICBpZiAoYSA+IGIgfHwgYSA9PT0gdm9pZCAwKSByZXR1cm4gMTtcbiAgICAgICAgaWYgKGEgPCBiIHx8IGIgPT09IHZvaWQgMCkgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxlZnQuaW5kZXggLSByaWdodC5pbmRleDtcbiAgICB9KSwgJ3ZhbHVlJyk7XG4gIH07XG5cbiAgLy8gQW4gaW50ZXJuYWwgZnVuY3Rpb24gdXNlZCBmb3IgYWdncmVnYXRlIFwiZ3JvdXAgYnlcIiBvcGVyYXRpb25zLlxuICB2YXIgZ3JvdXAgPSBmdW5jdGlvbihiZWhhdmlvcikge1xuICAgIHJldHVybiBmdW5jdGlvbihvYmosIHZhbHVlLCBjb250ZXh0KSB7XG4gICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICB2YXIgaXRlcmF0b3IgPSB2YWx1ZSA9PSBudWxsID8gXy5pZGVudGl0eSA6IGxvb2t1cEl0ZXJhdG9yKHZhbHVlKTtcbiAgICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgdmFyIGtleSA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBvYmopO1xuICAgICAgICBiZWhhdmlvcihyZXN1bHQsIGtleSwgdmFsdWUpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gR3JvdXBzIHRoZSBvYmplY3QncyB2YWx1ZXMgYnkgYSBjcml0ZXJpb24uIFBhc3MgZWl0aGVyIGEgc3RyaW5nIGF0dHJpYnV0ZVxuICAvLyB0byBncm91cCBieSwgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlIGNyaXRlcmlvbi5cbiAgXy5ncm91cEJ5ID0gZ3JvdXAoZnVuY3Rpb24ocmVzdWx0LCBrZXksIHZhbHVlKSB7XG4gICAgKF8uaGFzKHJlc3VsdCwga2V5KSA/IHJlc3VsdFtrZXldIDogKHJlc3VsdFtrZXldID0gW10pKS5wdXNoKHZhbHVlKTtcbiAgfSk7XG5cbiAgLy8gSW5kZXhlcyB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uLCBzaW1pbGFyIHRvIGBncm91cEJ5YCwgYnV0IGZvclxuICAvLyB3aGVuIHlvdSBrbm93IHRoYXQgeW91ciBpbmRleCB2YWx1ZXMgd2lsbCBiZSB1bmlxdWUuXG4gIF8uaW5kZXhCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwga2V5LCB2YWx1ZSkge1xuICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gIH0pO1xuXG4gIC8vIENvdW50cyBpbnN0YW5jZXMgb2YgYW4gb2JqZWN0IHRoYXQgZ3JvdXAgYnkgYSBjZXJ0YWluIGNyaXRlcmlvbi4gUGFzc1xuICAvLyBlaXRoZXIgYSBzdHJpbmcgYXR0cmlidXRlIHRvIGNvdW50IGJ5LCBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGVcbiAgLy8gY3JpdGVyaW9uLlxuICBfLmNvdW50QnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIGtleSkge1xuICAgIF8uaGFzKHJlc3VsdCwga2V5KSA/IHJlc3VsdFtrZXldKysgOiByZXN1bHRba2V5XSA9IDE7XG4gIH0pO1xuXG4gIC8vIFVzZSBhIGNvbXBhcmF0b3IgZnVuY3Rpb24gdG8gZmlndXJlIG91dCB0aGUgc21hbGxlc3QgaW5kZXggYXQgd2hpY2hcbiAgLy8gYW4gb2JqZWN0IHNob3VsZCBiZSBpbnNlcnRlZCBzbyBhcyB0byBtYWludGFpbiBvcmRlci4gVXNlcyBiaW5hcnkgc2VhcmNoLlxuICBfLnNvcnRlZEluZGV4ID0gZnVuY3Rpb24oYXJyYXksIG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciA9IGl0ZXJhdG9yID09IG51bGwgPyBfLmlkZW50aXR5IDogbG9va3VwSXRlcmF0b3IoaXRlcmF0b3IpO1xuICAgIHZhciB2YWx1ZSA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqKTtcbiAgICB2YXIgbG93ID0gMCwgaGlnaCA9IGFycmF5Lmxlbmd0aDtcbiAgICB3aGlsZSAobG93IDwgaGlnaCkge1xuICAgICAgdmFyIG1pZCA9IChsb3cgKyBoaWdoKSA+Pj4gMTtcbiAgICAgIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgYXJyYXlbbWlkXSkgPCB2YWx1ZSA/IGxvdyA9IG1pZCArIDEgOiBoaWdoID0gbWlkO1xuICAgIH1cbiAgICByZXR1cm4gbG93O1xuICB9O1xuXG4gIC8vIFNhZmVseSBjcmVhdGUgYSByZWFsLCBsaXZlIGFycmF5IGZyb20gYW55dGhpbmcgaXRlcmFibGUuXG4gIF8udG9BcnJheSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghb2JqKSByZXR1cm4gW107XG4gICAgaWYgKF8uaXNBcnJheShvYmopKSByZXR1cm4gc2xpY2UuY2FsbChvYmopO1xuICAgIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkgcmV0dXJuIF8ubWFwKG9iaiwgXy5pZGVudGl0eSk7XG4gICAgcmV0dXJuIF8udmFsdWVzKG9iaik7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBudW1iZXIgb2YgZWxlbWVudHMgaW4gYW4gb2JqZWN0LlxuICBfLnNpemUgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiAwO1xuICAgIHJldHVybiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpID8gb2JqLmxlbmd0aCA6IF8ua2V5cyhvYmopLmxlbmd0aDtcbiAgfTtcblxuICAvLyBBcnJheSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gR2V0IHRoZSBmaXJzdCBlbGVtZW50IG9mIGFuIGFycmF5LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIHRoZSBmaXJzdCBOXG4gIC8vIHZhbHVlcyBpbiB0aGUgYXJyYXkuIEFsaWFzZWQgYXMgYGhlYWRgIGFuZCBgdGFrZWAuIFRoZSAqKmd1YXJkKiogY2hlY2tcbiAgLy8gYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLmZpcnN0ID0gXy5oZWFkID0gXy50YWtlID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiB2b2lkIDA7XG4gICAgcmV0dXJuIChuID09IG51bGwpIHx8IGd1YXJkID8gYXJyYXlbMF0gOiBzbGljZS5jYWxsKGFycmF5LCAwLCBuKTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGV2ZXJ5dGhpbmcgYnV0IHRoZSBsYXN0IGVudHJ5IG9mIHRoZSBhcnJheS4gRXNwZWNpYWxseSB1c2VmdWwgb25cbiAgLy8gdGhlIGFyZ3VtZW50cyBvYmplY3QuIFBhc3NpbmcgKipuKiogd2lsbCByZXR1cm4gYWxsIHRoZSB2YWx1ZXMgaW5cbiAgLy8gdGhlIGFycmF5LCBleGNsdWRpbmcgdGhlIGxhc3QgTi4gVGhlICoqZ3VhcmQqKiBjaGVjayBhbGxvd3MgaXQgdG8gd29yayB3aXRoXG4gIC8vIGBfLm1hcGAuXG4gIF8uaW5pdGlhbCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCAwLCBhcnJheS5sZW5ndGggLSAoKG4gPT0gbnVsbCkgfHwgZ3VhcmQgPyAxIDogbikpO1xuICB9O1xuXG4gIC8vIEdldCB0aGUgbGFzdCBlbGVtZW50IG9mIGFuIGFycmF5LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIHRoZSBsYXN0IE5cbiAgLy8gdmFsdWVzIGluIHRoZSBhcnJheS4gVGhlICoqZ3VhcmQqKiBjaGVjayBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8ubGFzdCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIGlmICgobiA9PSBudWxsKSB8fCBndWFyZCkge1xuICAgICAgcmV0dXJuIGFycmF5W2FycmF5Lmxlbmd0aCAtIDFdO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgTWF0aC5tYXgoYXJyYXkubGVuZ3RoIC0gbiwgMCkpO1xuICAgIH1cbiAgfTtcblxuICAvLyBSZXR1cm5zIGV2ZXJ5dGhpbmcgYnV0IHRoZSBmaXJzdCBlbnRyeSBvZiB0aGUgYXJyYXkuIEFsaWFzZWQgYXMgYHRhaWxgIGFuZCBgZHJvcGAuXG4gIC8vIEVzcGVjaWFsbHkgdXNlZnVsIG9uIHRoZSBhcmd1bWVudHMgb2JqZWN0LiBQYXNzaW5nIGFuICoqbioqIHdpbGwgcmV0dXJuXG4gIC8vIHRoZSByZXN0IE4gdmFsdWVzIGluIHRoZSBhcnJheS4gVGhlICoqZ3VhcmQqKlxuICAvLyBjaGVjayBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8ucmVzdCA9IF8udGFpbCA9IF8uZHJvcCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCAobiA9PSBudWxsKSB8fCBndWFyZCA/IDEgOiBuKTtcbiAgfTtcblxuICAvLyBUcmltIG91dCBhbGwgZmFsc3kgdmFsdWVzIGZyb20gYW4gYXJyYXkuXG4gIF8uY29tcGFjdCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKGFycmF5LCBfLmlkZW50aXR5KTtcbiAgfTtcblxuICAvLyBJbnRlcm5hbCBpbXBsZW1lbnRhdGlvbiBvZiBhIHJlY3Vyc2l2ZSBgZmxhdHRlbmAgZnVuY3Rpb24uXG4gIHZhciBmbGF0dGVuID0gZnVuY3Rpb24oaW5wdXQsIHNoYWxsb3csIG91dHB1dCkge1xuICAgIGlmIChzaGFsbG93ICYmIF8uZXZlcnkoaW5wdXQsIF8uaXNBcnJheSkpIHtcbiAgICAgIHJldHVybiBjb25jYXQuYXBwbHkob3V0cHV0LCBpbnB1dCk7XG4gICAgfVxuICAgIGVhY2goaW5wdXQsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBpZiAoXy5pc0FycmF5KHZhbHVlKSB8fCBfLmlzQXJndW1lbnRzKHZhbHVlKSkge1xuICAgICAgICBzaGFsbG93ID8gcHVzaC5hcHBseShvdXRwdXQsIHZhbHVlKSA6IGZsYXR0ZW4odmFsdWUsIHNoYWxsb3csIG91dHB1dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXRwdXQucHVzaCh2YWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfTtcblxuICAvLyBGbGF0dGVuIG91dCBhbiBhcnJheSwgZWl0aGVyIHJlY3Vyc2l2ZWx5IChieSBkZWZhdWx0KSwgb3IganVzdCBvbmUgbGV2ZWwuXG4gIF8uZmxhdHRlbiA9IGZ1bmN0aW9uKGFycmF5LCBzaGFsbG93KSB7XG4gICAgcmV0dXJuIGZsYXR0ZW4oYXJyYXksIHNoYWxsb3csIFtdKTtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSB2ZXJzaW9uIG9mIHRoZSBhcnJheSB0aGF0IGRvZXMgbm90IGNvbnRhaW4gdGhlIHNwZWNpZmllZCB2YWx1ZShzKS5cbiAgXy53aXRob3V0ID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICByZXR1cm4gXy5kaWZmZXJlbmNlKGFycmF5LCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICB9O1xuXG4gIC8vIFByb2R1Y2UgYSBkdXBsaWNhdGUtZnJlZSB2ZXJzaW9uIG9mIHRoZSBhcnJheS4gSWYgdGhlIGFycmF5IGhhcyBhbHJlYWR5XG4gIC8vIGJlZW4gc29ydGVkLCB5b3UgaGF2ZSB0aGUgb3B0aW9uIG9mIHVzaW5nIGEgZmFzdGVyIGFsZ29yaXRobS5cbiAgLy8gQWxpYXNlZCBhcyBgdW5pcXVlYC5cbiAgXy51bmlxID0gXy51bmlxdWUgPSBmdW5jdGlvbihhcnJheSwgaXNTb3J0ZWQsIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKF8uaXNGdW5jdGlvbihpc1NvcnRlZCkpIHtcbiAgICAgIGNvbnRleHQgPSBpdGVyYXRvcjtcbiAgICAgIGl0ZXJhdG9yID0gaXNTb3J0ZWQ7XG4gICAgICBpc1NvcnRlZCA9IGZhbHNlO1xuICAgIH1cbiAgICB2YXIgaW5pdGlhbCA9IGl0ZXJhdG9yID8gXy5tYXAoYXJyYXksIGl0ZXJhdG9yLCBjb250ZXh0KSA6IGFycmF5O1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgdmFyIHNlZW4gPSBbXTtcbiAgICBlYWNoKGluaXRpYWwsIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCkge1xuICAgICAgaWYgKGlzU29ydGVkID8gKCFpbmRleCB8fCBzZWVuW3NlZW4ubGVuZ3RoIC0gMV0gIT09IHZhbHVlKSA6ICFfLmNvbnRhaW5zKHNlZW4sIHZhbHVlKSkge1xuICAgICAgICBzZWVuLnB1c2godmFsdWUpO1xuICAgICAgICByZXN1bHRzLnB1c2goYXJyYXlbaW5kZXhdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICAvLyBQcm9kdWNlIGFuIGFycmF5IHRoYXQgY29udGFpbnMgdGhlIHVuaW9uOiBlYWNoIGRpc3RpbmN0IGVsZW1lbnQgZnJvbSBhbGwgb2ZcbiAgLy8gdGhlIHBhc3NlZC1pbiBhcnJheXMuXG4gIF8udW5pb24gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXy51bmlxKF8uZmxhdHRlbihhcmd1bWVudHMsIHRydWUpKTtcbiAgfTtcblxuICAvLyBQcm9kdWNlIGFuIGFycmF5IHRoYXQgY29udGFpbnMgZXZlcnkgaXRlbSBzaGFyZWQgYmV0d2VlbiBhbGwgdGhlXG4gIC8vIHBhc3NlZC1pbiBhcnJheXMuXG4gIF8uaW50ZXJzZWN0aW9uID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICB2YXIgcmVzdCA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gXy5maWx0ZXIoXy51bmlxKGFycmF5KSwgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgcmV0dXJuIF8uZXZlcnkocmVzdCwgZnVuY3Rpb24ob3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIF8uaW5kZXhPZihvdGhlciwgaXRlbSkgPj0gMDtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIFRha2UgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiBvbmUgYXJyYXkgYW5kIGEgbnVtYmVyIG9mIG90aGVyIGFycmF5cy5cbiAgLy8gT25seSB0aGUgZWxlbWVudHMgcHJlc2VudCBpbiBqdXN0IHRoZSBmaXJzdCBhcnJheSB3aWxsIHJlbWFpbi5cbiAgXy5kaWZmZXJlbmNlID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICB2YXIgcmVzdCA9IGNvbmNhdC5hcHBseShBcnJheVByb3RvLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIHJldHVybiBfLmZpbHRlcihhcnJheSwgZnVuY3Rpb24odmFsdWUpeyByZXR1cm4gIV8uY29udGFpbnMocmVzdCwgdmFsdWUpOyB9KTtcbiAgfTtcblxuICAvLyBaaXAgdG9nZXRoZXIgbXVsdGlwbGUgbGlzdHMgaW50byBhIHNpbmdsZSBhcnJheSAtLSBlbGVtZW50cyB0aGF0IHNoYXJlXG4gIC8vIGFuIGluZGV4IGdvIHRvZ2V0aGVyLlxuICBfLnppcCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsZW5ndGggPSBfLm1heChfLnBsdWNrKGFyZ3VtZW50cywgXCJsZW5ndGhcIikuY29uY2F0KDApKTtcbiAgICB2YXIgcmVzdWx0cyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc3VsdHNbaV0gPSBfLnBsdWNrKGFyZ3VtZW50cywgJycgKyBpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gQ29udmVydHMgbGlzdHMgaW50byBvYmplY3RzLiBQYXNzIGVpdGhlciBhIHNpbmdsZSBhcnJheSBvZiBgW2tleSwgdmFsdWVdYFxuICAvLyBwYWlycywgb3IgdHdvIHBhcmFsbGVsIGFycmF5cyBvZiB0aGUgc2FtZSBsZW5ndGggLS0gb25lIG9mIGtleXMsIGFuZCBvbmUgb2ZcbiAgLy8gdGhlIGNvcnJlc3BvbmRpbmcgdmFsdWVzLlxuICBfLm9iamVjdCA9IGZ1bmN0aW9uKGxpc3QsIHZhbHVlcykge1xuICAgIGlmIChsaXN0ID09IG51bGwpIHJldHVybiB7fTtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGxpc3QubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh2YWx1ZXMpIHtcbiAgICAgICAgcmVzdWx0W2xpc3RbaV1dID0gdmFsdWVzW2ldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0W2xpc3RbaV1bMF1dID0gbGlzdFtpXVsxXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBJZiB0aGUgYnJvd3NlciBkb2Vzbid0IHN1cHBseSB1cyB3aXRoIGluZGV4T2YgKEknbSBsb29raW5nIGF0IHlvdSwgKipNU0lFKiopLFxuICAvLyB3ZSBuZWVkIHRoaXMgZnVuY3Rpb24uIFJldHVybiB0aGUgcG9zaXRpb24gb2YgdGhlIGZpcnN0IG9jY3VycmVuY2Ugb2YgYW5cbiAgLy8gaXRlbSBpbiBhbiBhcnJheSwgb3IgLTEgaWYgdGhlIGl0ZW0gaXMgbm90IGluY2x1ZGVkIGluIHRoZSBhcnJheS5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGluZGV4T2ZgIGlmIGF2YWlsYWJsZS5cbiAgLy8gSWYgdGhlIGFycmF5IGlzIGxhcmdlIGFuZCBhbHJlYWR5IGluIHNvcnQgb3JkZXIsIHBhc3MgYHRydWVgXG4gIC8vIGZvciAqKmlzU29ydGVkKiogdG8gdXNlIGJpbmFyeSBzZWFyY2guXG4gIF8uaW5kZXhPZiA9IGZ1bmN0aW9uKGFycmF5LCBpdGVtLCBpc1NvcnRlZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gLTE7XG4gICAgdmFyIGkgPSAwLCBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG4gICAgaWYgKGlzU29ydGVkKSB7XG4gICAgICBpZiAodHlwZW9mIGlzU29ydGVkID09ICdudW1iZXInKSB7XG4gICAgICAgIGkgPSAoaXNTb3J0ZWQgPCAwID8gTWF0aC5tYXgoMCwgbGVuZ3RoICsgaXNTb3J0ZWQpIDogaXNTb3J0ZWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaSA9IF8uc29ydGVkSW5kZXgoYXJyYXksIGl0ZW0pO1xuICAgICAgICByZXR1cm4gYXJyYXlbaV0gPT09IGl0ZW0gPyBpIDogLTE7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChuYXRpdmVJbmRleE9mICYmIGFycmF5LmluZGV4T2YgPT09IG5hdGl2ZUluZGV4T2YpIHJldHVybiBhcnJheS5pbmRleE9mKGl0ZW0sIGlzU29ydGVkKTtcbiAgICBmb3IgKDsgaSA8IGxlbmd0aDsgaSsrKSBpZiAoYXJyYXlbaV0gPT09IGl0ZW0pIHJldHVybiBpO1xuICAgIHJldHVybiAtMTtcbiAgfTtcblxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgbGFzdEluZGV4T2ZgIGlmIGF2YWlsYWJsZS5cbiAgXy5sYXN0SW5kZXhPZiA9IGZ1bmN0aW9uKGFycmF5LCBpdGVtLCBmcm9tKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiAtMTtcbiAgICB2YXIgaGFzSW5kZXggPSBmcm9tICE9IG51bGw7XG4gICAgaWYgKG5hdGl2ZUxhc3RJbmRleE9mICYmIGFycmF5Lmxhc3RJbmRleE9mID09PSBuYXRpdmVMYXN0SW5kZXhPZikge1xuICAgICAgcmV0dXJuIGhhc0luZGV4ID8gYXJyYXkubGFzdEluZGV4T2YoaXRlbSwgZnJvbSkgOiBhcnJheS5sYXN0SW5kZXhPZihpdGVtKTtcbiAgICB9XG4gICAgdmFyIGkgPSAoaGFzSW5kZXggPyBmcm9tIDogYXJyYXkubGVuZ3RoKTtcbiAgICB3aGlsZSAoaS0tKSBpZiAoYXJyYXlbaV0gPT09IGl0ZW0pIHJldHVybiBpO1xuICAgIHJldHVybiAtMTtcbiAgfTtcblxuICAvLyBHZW5lcmF0ZSBhbiBpbnRlZ2VyIEFycmF5IGNvbnRhaW5pbmcgYW4gYXJpdGhtZXRpYyBwcm9ncmVzc2lvbi4gQSBwb3J0IG9mXG4gIC8vIHRoZSBuYXRpdmUgUHl0aG9uIGByYW5nZSgpYCBmdW5jdGlvbi4gU2VlXG4gIC8vIFt0aGUgUHl0aG9uIGRvY3VtZW50YXRpb25dKGh0dHA6Ly9kb2NzLnB5dGhvbi5vcmcvbGlicmFyeS9mdW5jdGlvbnMuaHRtbCNyYW5nZSkuXG4gIF8ucmFuZ2UgPSBmdW5jdGlvbihzdGFydCwgc3RvcCwgc3RlcCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDw9IDEpIHtcbiAgICAgIHN0b3AgPSBzdGFydCB8fCAwO1xuICAgICAgc3RhcnQgPSAwO1xuICAgIH1cbiAgICBzdGVwID0gYXJndW1lbnRzWzJdIHx8IDE7XG5cbiAgICB2YXIgbGVuZ3RoID0gTWF0aC5tYXgoTWF0aC5jZWlsKChzdG9wIC0gc3RhcnQpIC8gc3RlcCksIDApO1xuICAgIHZhciBpZHggPSAwO1xuICAgIHZhciByYW5nZSA9IG5ldyBBcnJheShsZW5ndGgpO1xuXG4gICAgd2hpbGUoaWR4IDwgbGVuZ3RoKSB7XG4gICAgICByYW5nZVtpZHgrK10gPSBzdGFydDtcbiAgICAgIHN0YXJ0ICs9IHN0ZXA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJhbmdlO1xuICB9O1xuXG4gIC8vIEZ1bmN0aW9uIChhaGVtKSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUmV1c2FibGUgY29uc3RydWN0b3IgZnVuY3Rpb24gZm9yIHByb3RvdHlwZSBzZXR0aW5nLlxuICB2YXIgY3RvciA9IGZ1bmN0aW9uKCl7fTtcblxuICAvLyBDcmVhdGUgYSBmdW5jdGlvbiBib3VuZCB0byBhIGdpdmVuIG9iamVjdCAoYXNzaWduaW5nIGB0aGlzYCwgYW5kIGFyZ3VtZW50cyxcbiAgLy8gb3B0aW9uYWxseSkuIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBGdW5jdGlvbi5iaW5kYCBpZlxuICAvLyBhdmFpbGFibGUuXG4gIF8uYmluZCA9IGZ1bmN0aW9uKGZ1bmMsIGNvbnRleHQpIHtcbiAgICB2YXIgYXJncywgYm91bmQ7XG4gICAgaWYgKG5hdGl2ZUJpbmQgJiYgZnVuYy5iaW5kID09PSBuYXRpdmVCaW5kKSByZXR1cm4gbmF0aXZlQmluZC5hcHBseShmdW5jLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGlmICghXy5pc0Z1bmN0aW9uKGZ1bmMpKSB0aHJvdyBuZXcgVHlwZUVycm9yO1xuICAgIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIGJvdW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgYm91bmQpKSByZXR1cm4gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgIGN0b3IucHJvdG90eXBlID0gZnVuYy5wcm90b3R5cGU7XG4gICAgICB2YXIgc2VsZiA9IG5ldyBjdG9yO1xuICAgICAgY3Rvci5wcm90b3R5cGUgPSBudWxsO1xuICAgICAgdmFyIHJlc3VsdCA9IGZ1bmMuYXBwbHkoc2VsZiwgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICBpZiAoT2JqZWN0KHJlc3VsdCkgPT09IHJlc3VsdCkgcmV0dXJuIHJlc3VsdDtcbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUGFydGlhbGx5IGFwcGx5IGEgZnVuY3Rpb24gYnkgY3JlYXRpbmcgYSB2ZXJzaW9uIHRoYXQgaGFzIGhhZCBzb21lIG9mIGl0c1xuICAvLyBhcmd1bWVudHMgcHJlLWZpbGxlZCwgd2l0aG91dCBjaGFuZ2luZyBpdHMgZHluYW1pYyBgdGhpc2AgY29udGV4dC5cbiAgXy5wYXJ0aWFsID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gQmluZCBhbGwgb2YgYW4gb2JqZWN0J3MgbWV0aG9kcyB0byB0aGF0IG9iamVjdC4gVXNlZnVsIGZvciBlbnN1cmluZyB0aGF0XG4gIC8vIGFsbCBjYWxsYmFja3MgZGVmaW5lZCBvbiBhbiBvYmplY3QgYmVsb25nIHRvIGl0LlxuICBfLmJpbmRBbGwgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgZnVuY3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgaWYgKGZ1bmNzLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IEVycm9yKFwiYmluZEFsbCBtdXN0IGJlIHBhc3NlZCBmdW5jdGlvbiBuYW1lc1wiKTtcbiAgICBlYWNoKGZ1bmNzLCBmdW5jdGlvbihmKSB7IG9ialtmXSA9IF8uYmluZChvYmpbZl0sIG9iaik7IH0pO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gTWVtb2l6ZSBhbiBleHBlbnNpdmUgZnVuY3Rpb24gYnkgc3RvcmluZyBpdHMgcmVzdWx0cy5cbiAgXy5tZW1vaXplID0gZnVuY3Rpb24oZnVuYywgaGFzaGVyKSB7XG4gICAgdmFyIG1lbW8gPSB7fTtcbiAgICBoYXNoZXIgfHwgKGhhc2hlciA9IF8uaWRlbnRpdHkpO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBrZXkgPSBoYXNoZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiBfLmhhcyhtZW1vLCBrZXkpID8gbWVtb1trZXldIDogKG1lbW9ba2V5XSA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBEZWxheXMgYSBmdW5jdGlvbiBmb3IgdGhlIGdpdmVuIG51bWJlciBvZiBtaWxsaXNlY29uZHMsIGFuZCB0aGVuIGNhbGxzXG4gIC8vIGl0IHdpdGggdGhlIGFyZ3VtZW50cyBzdXBwbGllZC5cbiAgXy5kZWxheSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpeyByZXR1cm4gZnVuYy5hcHBseShudWxsLCBhcmdzKTsgfSwgd2FpdCk7XG4gIH07XG5cbiAgLy8gRGVmZXJzIGEgZnVuY3Rpb24sIHNjaGVkdWxpbmcgaXQgdG8gcnVuIGFmdGVyIHRoZSBjdXJyZW50IGNhbGwgc3RhY2sgaGFzXG4gIC8vIGNsZWFyZWQuXG4gIF8uZGVmZXIgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgcmV0dXJuIF8uZGVsYXkuYXBwbHkoXywgW2Z1bmMsIDFdLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpKTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24sIHRoYXQsIHdoZW4gaW52b2tlZCwgd2lsbCBvbmx5IGJlIHRyaWdnZXJlZCBhdCBtb3N0IG9uY2VcbiAgLy8gZHVyaW5nIGEgZ2l2ZW4gd2luZG93IG9mIHRpbWUuIE5vcm1hbGx5LCB0aGUgdGhyb3R0bGVkIGZ1bmN0aW9uIHdpbGwgcnVuXG4gIC8vIGFzIG11Y2ggYXMgaXQgY2FuLCB3aXRob3V0IGV2ZXIgZ29pbmcgbW9yZSB0aGFuIG9uY2UgcGVyIGB3YWl0YCBkdXJhdGlvbjtcbiAgLy8gYnV0IGlmIHlvdSdkIGxpa2UgdG8gZGlzYWJsZSB0aGUgZXhlY3V0aW9uIG9uIHRoZSBsZWFkaW5nIGVkZ2UsIHBhc3NcbiAgLy8gYHtsZWFkaW5nOiBmYWxzZX1gLiBUbyBkaXNhYmxlIGV4ZWN1dGlvbiBvbiB0aGUgdHJhaWxpbmcgZWRnZSwgZGl0dG8uXG4gIF8udGhyb3R0bGUgPSBmdW5jdGlvbihmdW5jLCB3YWl0LCBvcHRpb25zKSB7XG4gICAgdmFyIGNvbnRleHQsIGFyZ3MsIHJlc3VsdDtcbiAgICB2YXIgdGltZW91dCA9IG51bGw7XG4gICAgdmFyIHByZXZpb3VzID0gMDtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcHJldmlvdXMgPSBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlID8gMCA6IG5ldyBEYXRlO1xuICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlO1xuICAgICAgaWYgKCFwcmV2aW91cyAmJiBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlKSBwcmV2aW91cyA9IG5vdztcbiAgICAgIHZhciByZW1haW5pbmcgPSB3YWl0IC0gKG5vdyAtIHByZXZpb3VzKTtcbiAgICAgIGNvbnRleHQgPSB0aGlzO1xuICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGlmIChyZW1haW5pbmcgPD0gMCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICBwcmV2aW91cyA9IG5vdztcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgIH0gZWxzZSBpZiAoIXRpbWVvdXQgJiYgb3B0aW9ucy50cmFpbGluZyAhPT0gZmFsc2UpIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHJlbWFpbmluZyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCBhcyBsb25nIGFzIGl0IGNvbnRpbnVlcyB0byBiZSBpbnZva2VkLCB3aWxsIG5vdFxuICAvLyBiZSB0cmlnZ2VyZWQuIFRoZSBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBhZnRlciBpdCBzdG9wcyBiZWluZyBjYWxsZWQgZm9yXG4gIC8vIE4gbWlsbGlzZWNvbmRzLiBJZiBgaW1tZWRpYXRlYCBpcyBwYXNzZWQsIHRyaWdnZXIgdGhlIGZ1bmN0aW9uIG9uIHRoZVxuICAvLyBsZWFkaW5nIGVkZ2UsIGluc3RlYWQgb2YgdGhlIHRyYWlsaW5nLlxuICBfLmRlYm91bmNlID0gZnVuY3Rpb24oZnVuYywgd2FpdCwgaW1tZWRpYXRlKSB7XG4gICAgdmFyIHRpbWVvdXQsIGFyZ3MsIGNvbnRleHQsIHRpbWVzdGFtcCwgcmVzdWx0O1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnRleHQgPSB0aGlzO1xuICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIHRpbWVzdGFtcCA9IG5ldyBEYXRlKCk7XG4gICAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGxhc3QgPSAobmV3IERhdGUoKSkgLSB0aW1lc3RhbXA7XG4gICAgICAgIGlmIChsYXN0IDwgd2FpdCkge1xuICAgICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0IC0gbGFzdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgICAgaWYgKCFpbW1lZGlhdGUpIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICB2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcbiAgICAgIGlmICghdGltZW91dCkge1xuICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG4gICAgICB9XG4gICAgICBpZiAoY2FsbE5vdykgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIGV4ZWN1dGVkIGF0IG1vc3Qgb25lIHRpbWUsIG5vIG1hdHRlciBob3dcbiAgLy8gb2Z0ZW4geW91IGNhbGwgaXQuIFVzZWZ1bCBmb3IgbGF6eSBpbml0aWFsaXphdGlvbi5cbiAgXy5vbmNlID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHZhciByYW4gPSBmYWxzZSwgbWVtbztcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAocmFuKSByZXR1cm4gbWVtbztcbiAgICAgIHJhbiA9IHRydWU7XG4gICAgICBtZW1vID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgZnVuYyA9IG51bGw7XG4gICAgICByZXR1cm4gbWVtbztcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgdGhlIGZpcnN0IGZ1bmN0aW9uIHBhc3NlZCBhcyBhbiBhcmd1bWVudCB0byB0aGUgc2Vjb25kLFxuICAvLyBhbGxvd2luZyB5b3UgdG8gYWRqdXN0IGFyZ3VtZW50cywgcnVuIGNvZGUgYmVmb3JlIGFuZCBhZnRlciwgYW5kXG4gIC8vIGNvbmRpdGlvbmFsbHkgZXhlY3V0ZSB0aGUgb3JpZ2luYWwgZnVuY3Rpb24uXG4gIF8ud3JhcCA9IGZ1bmN0aW9uKGZ1bmMsIHdyYXBwZXIpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncyA9IFtmdW5jXTtcbiAgICAgIHB1c2guYXBwbHkoYXJncywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB3cmFwcGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgaXMgdGhlIGNvbXBvc2l0aW9uIG9mIGEgbGlzdCBvZiBmdW5jdGlvbnMsIGVhY2hcbiAgLy8gY29uc3VtaW5nIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGZ1bmN0aW9uIHRoYXQgZm9sbG93cy5cbiAgXy5jb21wb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZ1bmNzID0gYXJndW1lbnRzO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgZm9yICh2YXIgaSA9IGZ1bmNzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGFyZ3MgPSBbZnVuY3NbaV0uYXBwbHkodGhpcywgYXJncyldO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFyZ3NbMF07XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aWxsIG9ubHkgYmUgZXhlY3V0ZWQgYWZ0ZXIgYmVpbmcgY2FsbGVkIE4gdGltZXMuXG4gIF8uYWZ0ZXIgPSBmdW5jdGlvbih0aW1lcywgZnVuYykge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICgtLXRpbWVzIDwgMSkge1xuICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfVxuICAgIH07XG4gIH07XG5cbiAgLy8gT2JqZWN0IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUmV0cmlldmUgdGhlIG5hbWVzIG9mIGFuIG9iamVjdCdzIHByb3BlcnRpZXMuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBPYmplY3Qua2V5c2BcbiAgXy5rZXlzID0gbmF0aXZlS2V5cyB8fCBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqICE9PSBPYmplY3Qob2JqKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBvYmplY3QnKTtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIGtleXMucHVzaChrZXkpO1xuICAgIHJldHVybiBrZXlzO1xuICB9O1xuXG4gIC8vIFJldHJpZXZlIHRoZSB2YWx1ZXMgb2YgYW4gb2JqZWN0J3MgcHJvcGVydGllcy5cbiAgXy52YWx1ZXMgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgIHZhciBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICB2YXIgdmFsdWVzID0gbmV3IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFsdWVzW2ldID0gb2JqW2tleXNbaV1dO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWVzO1xuICB9O1xuXG4gIC8vIENvbnZlcnQgYW4gb2JqZWN0IGludG8gYSBsaXN0IG9mIGBba2V5LCB2YWx1ZV1gIHBhaXJzLlxuICBfLnBhaXJzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgdmFyIHBhaXJzID0gbmV3IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgcGFpcnNbaV0gPSBba2V5c1tpXSwgb2JqW2tleXNbaV1dXTtcbiAgICB9XG4gICAgcmV0dXJuIHBhaXJzO1xuICB9O1xuXG4gIC8vIEludmVydCB0aGUga2V5cyBhbmQgdmFsdWVzIG9mIGFuIG9iamVjdC4gVGhlIHZhbHVlcyBtdXN0IGJlIHNlcmlhbGl6YWJsZS5cbiAgXy5pbnZlcnQgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgcmVzdWx0W29ialtrZXlzW2ldXV0gPSBrZXlzW2ldO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFJldHVybiBhIHNvcnRlZCBsaXN0IG9mIHRoZSBmdW5jdGlvbiBuYW1lcyBhdmFpbGFibGUgb24gdGhlIG9iamVjdC5cbiAgLy8gQWxpYXNlZCBhcyBgbWV0aG9kc2BcbiAgXy5mdW5jdGlvbnMgPSBfLm1ldGhvZHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgbmFtZXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICBpZiAoXy5pc0Z1bmN0aW9uKG9ialtrZXldKSkgbmFtZXMucHVzaChrZXkpO1xuICAgIH1cbiAgICByZXR1cm4gbmFtZXMuc29ydCgpO1xuICB9O1xuXG4gIC8vIEV4dGVuZCBhIGdpdmVuIG9iamVjdCB3aXRoIGFsbCB0aGUgcHJvcGVydGllcyBpbiBwYXNzZWQtaW4gb2JqZWN0KHMpLlxuICBfLmV4dGVuZCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGVhY2goc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgICBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIFJldHVybiBhIGNvcHkgb2YgdGhlIG9iamVjdCBvbmx5IGNvbnRhaW5pbmcgdGhlIHdoaXRlbGlzdGVkIHByb3BlcnRpZXMuXG4gIF8ucGljayA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBjb3B5ID0ge307XG4gICAgdmFyIGtleXMgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBlYWNoKGtleXMsIGZ1bmN0aW9uKGtleSkge1xuICAgICAgaWYgKGtleSBpbiBvYmopIGNvcHlba2V5XSA9IG9ialtrZXldO1xuICAgIH0pO1xuICAgIHJldHVybiBjb3B5O1xuICB9O1xuXG4gICAvLyBSZXR1cm4gYSBjb3B5IG9mIHRoZSBvYmplY3Qgd2l0aG91dCB0aGUgYmxhY2tsaXN0ZWQgcHJvcGVydGllcy5cbiAgXy5vbWl0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGNvcHkgPSB7fTtcbiAgICB2YXIga2V5cyA9IGNvbmNhdC5hcHBseShBcnJheVByb3RvLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgIGlmICghXy5jb250YWlucyhrZXlzLCBrZXkpKSBjb3B5W2tleV0gPSBvYmpba2V5XTtcbiAgICB9XG4gICAgcmV0dXJuIGNvcHk7XG4gIH07XG5cbiAgLy8gRmlsbCBpbiBhIGdpdmVuIG9iamVjdCB3aXRoIGRlZmF1bHQgcHJvcGVydGllcy5cbiAgXy5kZWZhdWx0cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGVhY2goc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgICBpZiAob2JqW3Byb3BdID09PSB2b2lkIDApIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gQ3JlYXRlIGEgKHNoYWxsb3ctY2xvbmVkKSBkdXBsaWNhdGUgb2YgYW4gb2JqZWN0LlxuICBfLmNsb25lID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFfLmlzT2JqZWN0KG9iaikpIHJldHVybiBvYmo7XG4gICAgcmV0dXJuIF8uaXNBcnJheShvYmopID8gb2JqLnNsaWNlKCkgOiBfLmV4dGVuZCh7fSwgb2JqKTtcbiAgfTtcblxuICAvLyBJbnZva2VzIGludGVyY2VwdG9yIHdpdGggdGhlIG9iaiwgYW5kIHRoZW4gcmV0dXJucyBvYmouXG4gIC8vIFRoZSBwcmltYXJ5IHB1cnBvc2Ugb2YgdGhpcyBtZXRob2QgaXMgdG8gXCJ0YXAgaW50b1wiIGEgbWV0aG9kIGNoYWluLCBpblxuICAvLyBvcmRlciB0byBwZXJmb3JtIG9wZXJhdGlvbnMgb24gaW50ZXJtZWRpYXRlIHJlc3VsdHMgd2l0aGluIHRoZSBjaGFpbi5cbiAgXy50YXAgPSBmdW5jdGlvbihvYmosIGludGVyY2VwdG9yKSB7XG4gICAgaW50ZXJjZXB0b3Iob2JqKTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIEludGVybmFsIHJlY3Vyc2l2ZSBjb21wYXJpc29uIGZ1bmN0aW9uIGZvciBgaXNFcXVhbGAuXG4gIHZhciBlcSA9IGZ1bmN0aW9uKGEsIGIsIGFTdGFjaywgYlN0YWNrKSB7XG4gICAgLy8gSWRlbnRpY2FsIG9iamVjdHMgYXJlIGVxdWFsLiBgMCA9PT0gLTBgLCBidXQgdGhleSBhcmVuJ3QgaWRlbnRpY2FsLlxuICAgIC8vIFNlZSB0aGUgW0hhcm1vbnkgYGVnYWxgIHByb3Bvc2FsXShodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1oYXJtb255OmVnYWwpLlxuICAgIGlmIChhID09PSBiKSByZXR1cm4gYSAhPT0gMCB8fCAxIC8gYSA9PSAxIC8gYjtcbiAgICAvLyBBIHN0cmljdCBjb21wYXJpc29uIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIGBudWxsID09IHVuZGVmaW5lZGAuXG4gICAgaWYgKGEgPT0gbnVsbCB8fCBiID09IG51bGwpIHJldHVybiBhID09PSBiO1xuICAgIC8vIFVud3JhcCBhbnkgd3JhcHBlZCBvYmplY3RzLlxuICAgIGlmIChhIGluc3RhbmNlb2YgXykgYSA9IGEuX3dyYXBwZWQ7XG4gICAgaWYgKGIgaW5zdGFuY2VvZiBfKSBiID0gYi5fd3JhcHBlZDtcbiAgICAvLyBDb21wYXJlIGBbW0NsYXNzXV1gIG5hbWVzLlxuICAgIHZhciBjbGFzc05hbWUgPSB0b1N0cmluZy5jYWxsKGEpO1xuICAgIGlmIChjbGFzc05hbWUgIT0gdG9TdHJpbmcuY2FsbChiKSkgcmV0dXJuIGZhbHNlO1xuICAgIHN3aXRjaCAoY2xhc3NOYW1lKSB7XG4gICAgICAvLyBTdHJpbmdzLCBudW1iZXJzLCBkYXRlcywgYW5kIGJvb2xlYW5zIGFyZSBjb21wYXJlZCBieSB2YWx1ZS5cbiAgICAgIGNhc2UgJ1tvYmplY3QgU3RyaW5nXSc6XG4gICAgICAgIC8vIFByaW1pdGl2ZXMgYW5kIHRoZWlyIGNvcnJlc3BvbmRpbmcgb2JqZWN0IHdyYXBwZXJzIGFyZSBlcXVpdmFsZW50OyB0aHVzLCBgXCI1XCJgIGlzXG4gICAgICAgIC8vIGVxdWl2YWxlbnQgdG8gYG5ldyBTdHJpbmcoXCI1XCIpYC5cbiAgICAgICAgcmV0dXJuIGEgPT0gU3RyaW5nKGIpO1xuICAgICAgY2FzZSAnW29iamVjdCBOdW1iZXJdJzpcbiAgICAgICAgLy8gYE5hTmBzIGFyZSBlcXVpdmFsZW50LCBidXQgbm9uLXJlZmxleGl2ZS4gQW4gYGVnYWxgIGNvbXBhcmlzb24gaXMgcGVyZm9ybWVkIGZvclxuICAgICAgICAvLyBvdGhlciBudW1lcmljIHZhbHVlcy5cbiAgICAgICAgcmV0dXJuIGEgIT0gK2EgPyBiICE9ICtiIDogKGEgPT0gMCA/IDEgLyBhID09IDEgLyBiIDogYSA9PSArYik7XG4gICAgICBjYXNlICdbb2JqZWN0IERhdGVdJzpcbiAgICAgIGNhc2UgJ1tvYmplY3QgQm9vbGVhbl0nOlxuICAgICAgICAvLyBDb2VyY2UgZGF0ZXMgYW5kIGJvb2xlYW5zIHRvIG51bWVyaWMgcHJpbWl0aXZlIHZhbHVlcy4gRGF0ZXMgYXJlIGNvbXBhcmVkIGJ5IHRoZWlyXG4gICAgICAgIC8vIG1pbGxpc2Vjb25kIHJlcHJlc2VudGF0aW9ucy4gTm90ZSB0aGF0IGludmFsaWQgZGF0ZXMgd2l0aCBtaWxsaXNlY29uZCByZXByZXNlbnRhdGlvbnNcbiAgICAgICAgLy8gb2YgYE5hTmAgYXJlIG5vdCBlcXVpdmFsZW50LlxuICAgICAgICByZXR1cm4gK2EgPT0gK2I7XG4gICAgICAvLyBSZWdFeHBzIGFyZSBjb21wYXJlZCBieSB0aGVpciBzb3VyY2UgcGF0dGVybnMgYW5kIGZsYWdzLlxuICAgICAgY2FzZSAnW29iamVjdCBSZWdFeHBdJzpcbiAgICAgICAgcmV0dXJuIGEuc291cmNlID09IGIuc291cmNlICYmXG4gICAgICAgICAgICAgICBhLmdsb2JhbCA9PSBiLmdsb2JhbCAmJlxuICAgICAgICAgICAgICAgYS5tdWx0aWxpbmUgPT0gYi5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgICAgIGEuaWdub3JlQ2FzZSA9PSBiLmlnbm9yZUNhc2U7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgYSAhPSAnb2JqZWN0JyB8fCB0eXBlb2YgYiAhPSAnb2JqZWN0JykgcmV0dXJuIGZhbHNlO1xuICAgIC8vIEFzc3VtZSBlcXVhbGl0eSBmb3IgY3ljbGljIHN0cnVjdHVyZXMuIFRoZSBhbGdvcml0aG0gZm9yIGRldGVjdGluZyBjeWNsaWNcbiAgICAvLyBzdHJ1Y3R1cmVzIGlzIGFkYXB0ZWQgZnJvbSBFUyA1LjEgc2VjdGlvbiAxNS4xMi4zLCBhYnN0cmFjdCBvcGVyYXRpb24gYEpPYC5cbiAgICB2YXIgbGVuZ3RoID0gYVN0YWNrLmxlbmd0aDtcbiAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgIC8vIExpbmVhciBzZWFyY2guIFBlcmZvcm1hbmNlIGlzIGludmVyc2VseSBwcm9wb3J0aW9uYWwgdG8gdGhlIG51bWJlciBvZlxuICAgICAgLy8gdW5pcXVlIG5lc3RlZCBzdHJ1Y3R1cmVzLlxuICAgICAgaWYgKGFTdGFja1tsZW5ndGhdID09IGEpIHJldHVybiBiU3RhY2tbbGVuZ3RoXSA9PSBiO1xuICAgIH1cbiAgICAvLyBPYmplY3RzIHdpdGggZGlmZmVyZW50IGNvbnN0cnVjdG9ycyBhcmUgbm90IGVxdWl2YWxlbnQsIGJ1dCBgT2JqZWN0YHNcbiAgICAvLyBmcm9tIGRpZmZlcmVudCBmcmFtZXMgYXJlLlxuICAgIHZhciBhQ3RvciA9IGEuY29uc3RydWN0b3IsIGJDdG9yID0gYi5jb25zdHJ1Y3RvcjtcbiAgICBpZiAoYUN0b3IgIT09IGJDdG9yICYmICEoXy5pc0Z1bmN0aW9uKGFDdG9yKSAmJiAoYUN0b3IgaW5zdGFuY2VvZiBhQ3RvcikgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5pc0Z1bmN0aW9uKGJDdG9yKSAmJiAoYkN0b3IgaW5zdGFuY2VvZiBiQ3RvcikpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIEFkZCB0aGUgZmlyc3Qgb2JqZWN0IHRvIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cy5cbiAgICBhU3RhY2sucHVzaChhKTtcbiAgICBiU3RhY2sucHVzaChiKTtcbiAgICB2YXIgc2l6ZSA9IDAsIHJlc3VsdCA9IHRydWU7XG4gICAgLy8gUmVjdXJzaXZlbHkgY29tcGFyZSBvYmplY3RzIGFuZCBhcnJheXMuXG4gICAgaWYgKGNsYXNzTmFtZSA9PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAvLyBDb21wYXJlIGFycmF5IGxlbmd0aHMgdG8gZGV0ZXJtaW5lIGlmIGEgZGVlcCBjb21wYXJpc29uIGlzIG5lY2Vzc2FyeS5cbiAgICAgIHNpemUgPSBhLmxlbmd0aDtcbiAgICAgIHJlc3VsdCA9IHNpemUgPT0gYi5sZW5ndGg7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIC8vIERlZXAgY29tcGFyZSB0aGUgY29udGVudHMsIGlnbm9yaW5nIG5vbi1udW1lcmljIHByb3BlcnRpZXMuXG4gICAgICAgIHdoaWxlIChzaXplLS0pIHtcbiAgICAgICAgICBpZiAoIShyZXN1bHQgPSBlcShhW3NpemVdLCBiW3NpemVdLCBhU3RhY2ssIGJTdGFjaykpKSBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBEZWVwIGNvbXBhcmUgb2JqZWN0cy5cbiAgICAgIGZvciAodmFyIGtleSBpbiBhKSB7XG4gICAgICAgIGlmIChfLmhhcyhhLCBrZXkpKSB7XG4gICAgICAgICAgLy8gQ291bnQgdGhlIGV4cGVjdGVkIG51bWJlciBvZiBwcm9wZXJ0aWVzLlxuICAgICAgICAgIHNpemUrKztcbiAgICAgICAgICAvLyBEZWVwIGNvbXBhcmUgZWFjaCBtZW1iZXIuXG4gICAgICAgICAgaWYgKCEocmVzdWx0ID0gXy5oYXMoYiwga2V5KSAmJiBlcShhW2tleV0sIGJba2V5XSwgYVN0YWNrLCBiU3RhY2spKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIEVuc3VyZSB0aGF0IGJvdGggb2JqZWN0cyBjb250YWluIHRoZSBzYW1lIG51bWJlciBvZiBwcm9wZXJ0aWVzLlxuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICBmb3IgKGtleSBpbiBiKSB7XG4gICAgICAgICAgaWYgKF8uaGFzKGIsIGtleSkgJiYgIShzaXplLS0pKSBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgPSAhc2l6ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gUmVtb3ZlIHRoZSBmaXJzdCBvYmplY3QgZnJvbSB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgYVN0YWNrLnBvcCgpO1xuICAgIGJTdGFjay5wb3AoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFBlcmZvcm0gYSBkZWVwIGNvbXBhcmlzb24gdG8gY2hlY2sgaWYgdHdvIG9iamVjdHMgYXJlIGVxdWFsLlxuICBfLmlzRXF1YWwgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuIGVxKGEsIGIsIFtdLCBbXSk7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiBhcnJheSwgc3RyaW5nLCBvciBvYmplY3QgZW1wdHk/XG4gIC8vIEFuIFwiZW1wdHlcIiBvYmplY3QgaGFzIG5vIGVudW1lcmFibGUgb3duLXByb3BlcnRpZXMuXG4gIF8uaXNFbXB0eSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKF8uaXNBcnJheShvYmopIHx8IF8uaXNTdHJpbmcob2JqKSkgcmV0dXJuIG9iai5sZW5ndGggPT09IDA7XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgaWYgKF8uaGFzKG9iaiwga2V5KSkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYSBET00gZWxlbWVudD9cbiAgXy5pc0VsZW1lbnQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gISEob2JqICYmIG9iai5ub2RlVHlwZSA9PT0gMSk7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhbiBhcnJheT9cbiAgLy8gRGVsZWdhdGVzIHRvIEVDTUE1J3MgbmF0aXZlIEFycmF5LmlzQXJyYXlcbiAgXy5pc0FycmF5ID0gbmF0aXZlSXNBcnJheSB8fCBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09ICdbb2JqZWN0IEFycmF5XSc7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YXJpYWJsZSBhbiBvYmplY3Q/XG4gIF8uaXNPYmplY3QgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSBPYmplY3Qob2JqKTtcbiAgfTtcblxuICAvLyBBZGQgc29tZSBpc1R5cGUgbWV0aG9kczogaXNBcmd1bWVudHMsIGlzRnVuY3Rpb24sIGlzU3RyaW5nLCBpc051bWJlciwgaXNEYXRlLCBpc1JlZ0V4cC5cbiAgZWFjaChbJ0FyZ3VtZW50cycsICdGdW5jdGlvbicsICdTdHJpbmcnLCAnTnVtYmVyJywgJ0RhdGUnLCAnUmVnRXhwJ10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBfWydpcycgKyBuYW1lXSA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCAnICsgbmFtZSArICddJztcbiAgICB9O1xuICB9KTtcblxuICAvLyBEZWZpbmUgYSBmYWxsYmFjayB2ZXJzaW9uIG9mIHRoZSBtZXRob2QgaW4gYnJvd3NlcnMgKGFoZW0sIElFKSwgd2hlcmVcbiAgLy8gdGhlcmUgaXNuJ3QgYW55IGluc3BlY3RhYmxlIFwiQXJndW1lbnRzXCIgdHlwZS5cbiAgaWYgKCFfLmlzQXJndW1lbnRzKGFyZ3VtZW50cykpIHtcbiAgICBfLmlzQXJndW1lbnRzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gISEob2JqICYmIF8uaGFzKG9iaiwgJ2NhbGxlZScpKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gT3B0aW1pemUgYGlzRnVuY3Rpb25gIGlmIGFwcHJvcHJpYXRlLlxuICBpZiAodHlwZW9mICgvLi8pICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgXy5pc0Z1bmN0aW9uID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJztcbiAgICB9O1xuICB9XG5cbiAgLy8gSXMgYSBnaXZlbiBvYmplY3QgYSBmaW5pdGUgbnVtYmVyP1xuICBfLmlzRmluaXRlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIGlzRmluaXRlKG9iaikgJiYgIWlzTmFOKHBhcnNlRmxvYXQob2JqKSk7XG4gIH07XG5cbiAgLy8gSXMgdGhlIGdpdmVuIHZhbHVlIGBOYU5gPyAoTmFOIGlzIHRoZSBvbmx5IG51bWJlciB3aGljaCBkb2VzIG5vdCBlcXVhbCBpdHNlbGYpLlxuICBfLmlzTmFOID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIF8uaXNOdW1iZXIob2JqKSAmJiBvYmogIT0gK29iajtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGEgYm9vbGVhbj9cbiAgXy5pc0Jvb2xlYW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSB0cnVlIHx8IG9iaiA9PT0gZmFsc2UgfHwgdG9TdHJpbmcuY2FsbChvYmopID09ICdbb2JqZWN0IEJvb2xlYW5dJztcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGVxdWFsIHRvIG51bGw/XG4gIF8uaXNOdWxsID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gbnVsbDtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhcmlhYmxlIHVuZGVmaW5lZD9cbiAgXy5pc1VuZGVmaW5lZCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IHZvaWQgMDtcbiAgfTtcblxuICAvLyBTaG9ydGN1dCBmdW5jdGlvbiBmb3IgY2hlY2tpbmcgaWYgYW4gb2JqZWN0IGhhcyBhIGdpdmVuIHByb3BlcnR5IGRpcmVjdGx5XG4gIC8vIG9uIGl0c2VsZiAoaW4gb3RoZXIgd29yZHMsIG5vdCBvbiBhIHByb3RvdHlwZSkuXG4gIF8uaGFzID0gZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSk7XG4gIH07XG5cbiAgLy8gVXRpbGl0eSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBSdW4gVW5kZXJzY29yZS5qcyBpbiAqbm9Db25mbGljdCogbW9kZSwgcmV0dXJuaW5nIHRoZSBgX2AgdmFyaWFibGUgdG8gaXRzXG4gIC8vIHByZXZpb3VzIG93bmVyLiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBVbmRlcnNjb3JlIG9iamVjdC5cbiAgXy5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgcm9vdC5fID0gcHJldmlvdXNVbmRlcnNjb3JlO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8vIEtlZXAgdGhlIGlkZW50aXR5IGZ1bmN0aW9uIGFyb3VuZCBmb3IgZGVmYXVsdCBpdGVyYXRvcnMuXG4gIF8uaWRlbnRpdHkgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcblxuICAvLyBSdW4gYSBmdW5jdGlvbiAqKm4qKiB0aW1lcy5cbiAgXy50aW1lcyA9IGZ1bmN0aW9uKG4sIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIGFjY3VtID0gQXJyYXkoTWF0aC5tYXgoMCwgbikpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSBhY2N1bVtpXSA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgaSk7XG4gICAgcmV0dXJuIGFjY3VtO1xuICB9O1xuXG4gIC8vIFJldHVybiBhIHJhbmRvbSBpbnRlZ2VyIGJldHdlZW4gbWluIGFuZCBtYXggKGluY2x1c2l2ZSkuXG4gIF8ucmFuZG9tID0gZnVuY3Rpb24obWluLCBtYXgpIHtcbiAgICBpZiAobWF4ID09IG51bGwpIHtcbiAgICAgIG1heCA9IG1pbjtcbiAgICAgIG1pbiA9IDA7XG4gICAgfVxuICAgIHJldHVybiBtaW4gKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpO1xuICB9O1xuXG4gIC8vIExpc3Qgb2YgSFRNTCBlbnRpdGllcyBmb3IgZXNjYXBpbmcuXG4gIHZhciBlbnRpdHlNYXAgPSB7XG4gICAgZXNjYXBlOiB7XG4gICAgICAnJic6ICcmYW1wOycsXG4gICAgICAnPCc6ICcmbHQ7JyxcbiAgICAgICc+JzogJyZndDsnLFxuICAgICAgJ1wiJzogJyZxdW90OycsXG4gICAgICBcIidcIjogJyYjeDI3OydcbiAgICB9XG4gIH07XG4gIGVudGl0eU1hcC51bmVzY2FwZSA9IF8uaW52ZXJ0KGVudGl0eU1hcC5lc2NhcGUpO1xuXG4gIC8vIFJlZ2V4ZXMgY29udGFpbmluZyB0aGUga2V5cyBhbmQgdmFsdWVzIGxpc3RlZCBpbW1lZGlhdGVseSBhYm92ZS5cbiAgdmFyIGVudGl0eVJlZ2V4ZXMgPSB7XG4gICAgZXNjYXBlOiAgIG5ldyBSZWdFeHAoJ1snICsgXy5rZXlzKGVudGl0eU1hcC5lc2NhcGUpLmpvaW4oJycpICsgJ10nLCAnZycpLFxuICAgIHVuZXNjYXBlOiBuZXcgUmVnRXhwKCcoJyArIF8ua2V5cyhlbnRpdHlNYXAudW5lc2NhcGUpLmpvaW4oJ3wnKSArICcpJywgJ2cnKVxuICB9O1xuXG4gIC8vIEZ1bmN0aW9ucyBmb3IgZXNjYXBpbmcgYW5kIHVuZXNjYXBpbmcgc3RyaW5ncyB0by9mcm9tIEhUTUwgaW50ZXJwb2xhdGlvbi5cbiAgXy5lYWNoKFsnZXNjYXBlJywgJ3VuZXNjYXBlJ10sIGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgIF9bbWV0aG9kXSA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgICAgaWYgKHN0cmluZyA9PSBudWxsKSByZXR1cm4gJyc7XG4gICAgICByZXR1cm4gKCcnICsgc3RyaW5nKS5yZXBsYWNlKGVudGl0eVJlZ2V4ZXNbbWV0aG9kXSwgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIGVudGl0eU1hcFttZXRob2RdW21hdGNoXTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIElmIHRoZSB2YWx1ZSBvZiB0aGUgbmFtZWQgYHByb3BlcnR5YCBpcyBhIGZ1bmN0aW9uIHRoZW4gaW52b2tlIGl0IHdpdGggdGhlXG4gIC8vIGBvYmplY3RgIGFzIGNvbnRleHQ7IG90aGVyd2lzZSwgcmV0dXJuIGl0LlxuICBfLnJlc3VsdCA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICBpZiAob2JqZWN0ID09IG51bGwpIHJldHVybiB2b2lkIDA7XG4gICAgdmFyIHZhbHVlID0gb2JqZWN0W3Byb3BlcnR5XTtcbiAgICByZXR1cm4gXy5pc0Z1bmN0aW9uKHZhbHVlKSA/IHZhbHVlLmNhbGwob2JqZWN0KSA6IHZhbHVlO1xuICB9O1xuXG4gIC8vIEFkZCB5b3VyIG93biBjdXN0b20gZnVuY3Rpb25zIHRvIHRoZSBVbmRlcnNjb3JlIG9iamVjdC5cbiAgXy5taXhpbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGVhY2goXy5mdW5jdGlvbnMob2JqKSwgZnVuY3Rpb24obmFtZSkge1xuICAgICAgdmFyIGZ1bmMgPSBfW25hbWVdID0gb2JqW25hbWVdO1xuICAgICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbdGhpcy5fd3JhcHBlZF07XG4gICAgICAgIHB1c2guYXBwbHkoYXJncywgYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIGZ1bmMuYXBwbHkoXywgYXJncykpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBHZW5lcmF0ZSBhIHVuaXF1ZSBpbnRlZ2VyIGlkICh1bmlxdWUgd2l0aGluIHRoZSBlbnRpcmUgY2xpZW50IHNlc3Npb24pLlxuICAvLyBVc2VmdWwgZm9yIHRlbXBvcmFyeSBET00gaWRzLlxuICB2YXIgaWRDb3VudGVyID0gMDtcbiAgXy51bmlxdWVJZCA9IGZ1bmN0aW9uKHByZWZpeCkge1xuICAgIHZhciBpZCA9ICsraWRDb3VudGVyICsgJyc7XG4gICAgcmV0dXJuIHByZWZpeCA/IHByZWZpeCArIGlkIDogaWQ7XG4gIH07XG5cbiAgLy8gQnkgZGVmYXVsdCwgVW5kZXJzY29yZSB1c2VzIEVSQi1zdHlsZSB0ZW1wbGF0ZSBkZWxpbWl0ZXJzLCBjaGFuZ2UgdGhlXG4gIC8vIGZvbGxvd2luZyB0ZW1wbGF0ZSBzZXR0aW5ncyB0byB1c2UgYWx0ZXJuYXRpdmUgZGVsaW1pdGVycy5cbiAgXy50ZW1wbGF0ZVNldHRpbmdzID0ge1xuICAgIGV2YWx1YXRlICAgIDogLzwlKFtcXHNcXFNdKz8pJT4vZyxcbiAgICBpbnRlcnBvbGF0ZSA6IC88JT0oW1xcc1xcU10rPyklPi9nLFxuICAgIGVzY2FwZSAgICAgIDogLzwlLShbXFxzXFxTXSs/KSU+L2dcbiAgfTtcblxuICAvLyBXaGVuIGN1c3RvbWl6aW5nIGB0ZW1wbGF0ZVNldHRpbmdzYCwgaWYgeW91IGRvbid0IHdhbnQgdG8gZGVmaW5lIGFuXG4gIC8vIGludGVycG9sYXRpb24sIGV2YWx1YXRpb24gb3IgZXNjYXBpbmcgcmVnZXgsIHdlIG5lZWQgb25lIHRoYXQgaXNcbiAgLy8gZ3VhcmFudGVlZCBub3QgdG8gbWF0Y2guXG4gIHZhciBub01hdGNoID0gLyguKV4vO1xuXG4gIC8vIENlcnRhaW4gY2hhcmFjdGVycyBuZWVkIHRvIGJlIGVzY2FwZWQgc28gdGhhdCB0aGV5IGNhbiBiZSBwdXQgaW50byBhXG4gIC8vIHN0cmluZyBsaXRlcmFsLlxuICB2YXIgZXNjYXBlcyA9IHtcbiAgICBcIidcIjogICAgICBcIidcIixcbiAgICAnXFxcXCc6ICAgICAnXFxcXCcsXG4gICAgJ1xccic6ICAgICAncicsXG4gICAgJ1xcbic6ICAgICAnbicsXG4gICAgJ1xcdCc6ICAgICAndCcsXG4gICAgJ1xcdTIwMjgnOiAndTIwMjgnLFxuICAgICdcXHUyMDI5JzogJ3UyMDI5J1xuICB9O1xuXG4gIHZhciBlc2NhcGVyID0gL1xcXFx8J3xcXHJ8XFxufFxcdHxcXHUyMDI4fFxcdTIwMjkvZztcblxuICAvLyBKYXZhU2NyaXB0IG1pY3JvLXRlbXBsYXRpbmcsIHNpbWlsYXIgdG8gSm9obiBSZXNpZydzIGltcGxlbWVudGF0aW9uLlxuICAvLyBVbmRlcnNjb3JlIHRlbXBsYXRpbmcgaGFuZGxlcyBhcmJpdHJhcnkgZGVsaW1pdGVycywgcHJlc2VydmVzIHdoaXRlc3BhY2UsXG4gIC8vIGFuZCBjb3JyZWN0bHkgZXNjYXBlcyBxdW90ZXMgd2l0aGluIGludGVycG9sYXRlZCBjb2RlLlxuICBfLnRlbXBsYXRlID0gZnVuY3Rpb24odGV4dCwgZGF0YSwgc2V0dGluZ3MpIHtcbiAgICB2YXIgcmVuZGVyO1xuICAgIHNldHRpbmdzID0gXy5kZWZhdWx0cyh7fSwgc2V0dGluZ3MsIF8udGVtcGxhdGVTZXR0aW5ncyk7XG5cbiAgICAvLyBDb21iaW5lIGRlbGltaXRlcnMgaW50byBvbmUgcmVndWxhciBleHByZXNzaW9uIHZpYSBhbHRlcm5hdGlvbi5cbiAgICB2YXIgbWF0Y2hlciA9IG5ldyBSZWdFeHAoW1xuICAgICAgKHNldHRpbmdzLmVzY2FwZSB8fCBub01hdGNoKS5zb3VyY2UsXG4gICAgICAoc2V0dGluZ3MuaW50ZXJwb2xhdGUgfHwgbm9NYXRjaCkuc291cmNlLFxuICAgICAgKHNldHRpbmdzLmV2YWx1YXRlIHx8IG5vTWF0Y2gpLnNvdXJjZVxuICAgIF0uam9pbignfCcpICsgJ3wkJywgJ2cnKTtcblxuICAgIC8vIENvbXBpbGUgdGhlIHRlbXBsYXRlIHNvdXJjZSwgZXNjYXBpbmcgc3RyaW5nIGxpdGVyYWxzIGFwcHJvcHJpYXRlbHkuXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc291cmNlID0gXCJfX3ArPSdcIjtcbiAgICB0ZXh0LnJlcGxhY2UobWF0Y2hlciwgZnVuY3Rpb24obWF0Y2gsIGVzY2FwZSwgaW50ZXJwb2xhdGUsIGV2YWx1YXRlLCBvZmZzZXQpIHtcbiAgICAgIHNvdXJjZSArPSB0ZXh0LnNsaWNlKGluZGV4LCBvZmZzZXQpXG4gICAgICAgIC5yZXBsYWNlKGVzY2FwZXIsIGZ1bmN0aW9uKG1hdGNoKSB7IHJldHVybiAnXFxcXCcgKyBlc2NhcGVzW21hdGNoXTsgfSk7XG5cbiAgICAgIGlmIChlc2NhcGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBlc2NhcGUgKyBcIikpPT1udWxsPycnOl8uZXNjYXBlKF9fdCkpK1xcbidcIjtcbiAgICAgIH1cbiAgICAgIGlmIChpbnRlcnBvbGF0ZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInK1xcbigoX190PShcIiArIGludGVycG9sYXRlICsgXCIpKT09bnVsbD8nJzpfX3QpK1xcbidcIjtcbiAgICAgIH1cbiAgICAgIGlmIChldmFsdWF0ZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInO1xcblwiICsgZXZhbHVhdGUgKyBcIlxcbl9fcCs9J1wiO1xuICAgICAgfVxuICAgICAgaW5kZXggPSBvZmZzZXQgKyBtYXRjaC5sZW5ndGg7XG4gICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG4gICAgc291cmNlICs9IFwiJztcXG5cIjtcblxuICAgIC8vIElmIGEgdmFyaWFibGUgaXMgbm90IHNwZWNpZmllZCwgcGxhY2UgZGF0YSB2YWx1ZXMgaW4gbG9jYWwgc2NvcGUuXG4gICAgaWYgKCFzZXR0aW5ncy52YXJpYWJsZSkgc291cmNlID0gJ3dpdGgob2JqfHx7fSl7XFxuJyArIHNvdXJjZSArICd9XFxuJztcblxuICAgIHNvdXJjZSA9IFwidmFyIF9fdCxfX3A9JycsX19qPUFycmF5LnByb3RvdHlwZS5qb2luLFwiICtcbiAgICAgIFwicHJpbnQ9ZnVuY3Rpb24oKXtfX3ArPV9fai5jYWxsKGFyZ3VtZW50cywnJyk7fTtcXG5cIiArXG4gICAgICBzb3VyY2UgKyBcInJldHVybiBfX3A7XFxuXCI7XG5cbiAgICB0cnkge1xuICAgICAgcmVuZGVyID0gbmV3IEZ1bmN0aW9uKHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonLCAnXycsIHNvdXJjZSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZS5zb3VyY2UgPSBzb3VyY2U7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cblxuICAgIGlmIChkYXRhKSByZXR1cm4gcmVuZGVyKGRhdGEsIF8pO1xuICAgIHZhciB0ZW1wbGF0ZSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiByZW5kZXIuY2FsbCh0aGlzLCBkYXRhLCBfKTtcbiAgICB9O1xuXG4gICAgLy8gUHJvdmlkZSB0aGUgY29tcGlsZWQgZnVuY3Rpb24gc291cmNlIGFzIGEgY29udmVuaWVuY2UgZm9yIHByZWNvbXBpbGF0aW9uLlxuICAgIHRlbXBsYXRlLnNvdXJjZSA9ICdmdW5jdGlvbignICsgKHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonKSArICcpe1xcbicgKyBzb3VyY2UgKyAnfSc7XG5cbiAgICByZXR1cm4gdGVtcGxhdGU7XG4gIH07XG5cbiAgLy8gQWRkIGEgXCJjaGFpblwiIGZ1bmN0aW9uLCB3aGljaCB3aWxsIGRlbGVnYXRlIHRvIHRoZSB3cmFwcGVyLlxuICBfLmNoYWluID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIF8ob2JqKS5jaGFpbigpO1xuICB9O1xuXG4gIC8vIE9PUFxuICAvLyAtLS0tLS0tLS0tLS0tLS1cbiAgLy8gSWYgVW5kZXJzY29yZSBpcyBjYWxsZWQgYXMgYSBmdW5jdGlvbiwgaXQgcmV0dXJucyBhIHdyYXBwZWQgb2JqZWN0IHRoYXRcbiAgLy8gY2FuIGJlIHVzZWQgT08tc3R5bGUuIFRoaXMgd3JhcHBlciBob2xkcyBhbHRlcmVkIHZlcnNpb25zIG9mIGFsbCB0aGVcbiAgLy8gdW5kZXJzY29yZSBmdW5jdGlvbnMuIFdyYXBwZWQgb2JqZWN0cyBtYXkgYmUgY2hhaW5lZC5cblxuICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gY29udGludWUgY2hhaW5pbmcgaW50ZXJtZWRpYXRlIHJlc3VsdHMuXG4gIHZhciByZXN1bHQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gdGhpcy5fY2hhaW4gPyBfKG9iaikuY2hhaW4oKSA6IG9iajtcbiAgfTtcblxuICAvLyBBZGQgYWxsIG9mIHRoZSBVbmRlcnNjb3JlIGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlciBvYmplY3QuXG4gIF8ubWl4aW4oXyk7XG5cbiAgLy8gQWRkIGFsbCBtdXRhdG9yIEFycmF5IGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlci5cbiAgZWFjaChbJ3BvcCcsICdwdXNoJywgJ3JldmVyc2UnLCAnc2hpZnQnLCAnc29ydCcsICdzcGxpY2UnLCAndW5zaGlmdCddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG1ldGhvZCA9IEFycmF5UHJvdG9bbmFtZV07XG4gICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBvYmogPSB0aGlzLl93cmFwcGVkO1xuICAgICAgbWV0aG9kLmFwcGx5KG9iaiwgYXJndW1lbnRzKTtcbiAgICAgIGlmICgobmFtZSA9PSAnc2hpZnQnIHx8IG5hbWUgPT0gJ3NwbGljZScpICYmIG9iai5sZW5ndGggPT09IDApIGRlbGV0ZSBvYmpbMF07XG4gICAgICByZXR1cm4gcmVzdWx0LmNhbGwodGhpcywgb2JqKTtcbiAgICB9O1xuICB9KTtcblxuICAvLyBBZGQgYWxsIGFjY2Vzc29yIEFycmF5IGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlci5cbiAgZWFjaChbJ2NvbmNhdCcsICdqb2luJywgJ3NsaWNlJ10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbWV0aG9kID0gQXJyYXlQcm90b1tuYW1lXTtcbiAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIG1ldGhvZC5hcHBseSh0aGlzLl93cmFwcGVkLCBhcmd1bWVudHMpKTtcbiAgICB9O1xuICB9KTtcblxuICBfLmV4dGVuZChfLnByb3RvdHlwZSwge1xuXG4gICAgLy8gU3RhcnQgY2hhaW5pbmcgYSB3cmFwcGVkIFVuZGVyc2NvcmUgb2JqZWN0LlxuICAgIGNoYWluOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX2NoYWluID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBFeHRyYWN0cyB0aGUgcmVzdWx0IGZyb20gYSB3cmFwcGVkIGFuZCBjaGFpbmVkIG9iamVjdC5cbiAgICB2YWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fd3JhcHBlZDtcbiAgICB9XG5cbiAgfSk7XG5cbn0pLmNhbGwodGhpcyk7XG4iXX0=
;