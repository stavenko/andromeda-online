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
},{"./three.node.js":7,"./utils.js":4,"fs":8,"underscore":10}],3:[function(require,module,exports){
var Scene = require('./scene.js')
var u = require('./utils.js')
var _     = require('underscore');


var getMissionType =function (type){
	return create_mission_json()
}

var create_mission_json = function(  ){
	var p1 = [-110, 100, 40];
	var p2 = [500, 200, -50];
	var c = 0.2
	var p1 = _.map(p1,function(v){return v*c});
	var p2 = _.map(p2,function(v){return v*c});;
	
	var def_ship1 = {type:'ship',
					 "ship_type":"Default",
						 model_3d:'/models/eco.js',
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
	
						 model_3d:'/models/eco.js',
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
	return mission
}
var Mission = function(type){
	this.descr = "Mission"
	this.mission = getMissionType(type);
	//console.log(this.mission);
	
}

Mission.prototype = {
	constructor: Mission,
	


	create :function(creator_id, callback){
	
		// No params - only one mission available
		var self = this ;
		this.GUID = u.make_guid();
		this.creator = creator_id;
		this.ready_to_start = false
		this.is_started = false
		this._users = {};
		this._position_binds = {};
		this._total_actors = 0;
		this._total_logins = 0;
		

	

		self._mission_logins = [];
		self._mission_objects = {}
		
		self._mission_ready = function(){
			callback(self);
		
		
		}
		// self.prepare_scene();
		self._mission_ready();
		return this
	},
	getScene: function(){
		return this._scene;
	},
	prepare_scene : function(){
	
		// console.log(Scene);
		if(! this._scene_loaded){
			// console.log("DO PREP SCENE")
			this._scene = new Scene(this.mission.coords[0],
													this.mission.coords[1],
													this.mission.coords[2] );
			//create_from_world(this.mission.coords[0],
			//										this.mission.coords[1],
			//										this.mission.coords[2] );
			var self = this;
			_.each(this.mission.shared_objects, function(obj){
				self._scene.join_object(obj)
	
			})		
			var actors = this.prepare_actors()								
			_.each(actors, function(as){ // Миссия до этого времени не имела сцены - надо дать её каждому актору здесь
				//console.log(a)
				as.scene = self._scene.GUID
				self._scene.join_actor(as);
			})
			this._scene_loaded= true;
			// console.log("Prepd")
		}
		
							
	},
	prepare_actors: function(){
		var self = this;
		var actors = []
		_.each(this._users, function(positions_of_user, user_id){
			_.each(positions_of_user, function(position, pos_id){
				actors.push(self._make_actor(pos_id, user_id));
				
			})
		})
		return actors;
	},
	_make_actor: function(pos_id, user_id){
		var pos = this._positions[pos_id]
		var new_actor_guid = u.make_guid()
		var controllable = {object_guid:pos.object_guid, workpoint:pos.workpoint} // viewport:'front', controls:['Pilot', 'Turret']} 
		
		return {command:pos.command, user_id: user_id, control: controllable, GUID:  new_actor_guid}
		
	},
	
	join_player :function(user_id, position_id ){// login, command, object_guid, place){
		if (this._positions[position_id].busy){return;};
		
		if(this._users[user_id] === undefined){ // Один пользователь может иметь несколько позиций
			this._users[user_id] = [position_id];
			
		}else{
			this._users[user_id].push(position_id);
			
		}
		this._position_binds[position_id] = user_id // Позицией может управлять - на ней сидеть - только один пользователь
		this._positions[position_id].busy = true;
		this._positions[position_id].user_id = user_id;
		
		if(this.is_started){
			var actor = this._make_actor(position_id, user_id);
			actor.scene = this._scene.GUID;
			this._scene.join_actor(actor)
		}
		
		/*
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
		var new_actor_guid = u.make_guid()
		var actor = {command:command, login:login, control: controllable, GUID:  new_actor_guid}
		// Добавляем актора - индексируя по логину
		if (self.mission.actors[new_actor_guid] === undefined){
			self.mission.actors[new_actor_guid] = [actor]
		}else{
			self.mission.actors[new_actor_guid].push(actor)
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
		return new_actor_guid
		*/
	},
	to_json:function(){
		var ret = {};
		_.extend(ret, this.mission);
		ret.positions = this.positions()
		ret.GUID = this.GUID;
		return ret;
	},
	positions: function(cb){
		var self = this;
		//console.log(this);
		var places = [];
		if(self._positions){
			if(cb)cb(self._positions);
			return self._positions;
			
		}else{
			self._positions = []
			var counter = 0;
			_.each(self.mission.commands, function(command){
				_.each(self.mission.objects_for_command[command], function(object_guid){
					// console.log(command, self.mission.shared_objects);
					var object = self.mission.shared_objects[object_guid]
					_.each(object.workpoints, function(workpoint, wp_label){
					
					
						var place = {'command':command,
						 			 'object_type': object.type,
									 'object_subtype':object.ship_type,
									 'object_guid': object.GUID,
								 	 'workpoint':wp_label,
									 'MGUID' : self.GUID
								 
								 }
	 					
								 
						self._positions.push(place)
					
					})
				
				
				})
			
			})
			if(cb)cb(places);
			return self._positions;
			
		}
	}
	
}
//console.log(Mission);
module.exports = Mission
},{"./scene.js":2,"./utils.js":4,"underscore":10}],6:[function(require,module,exports){
var THR = require('./three.node.js');
var Utils = require("./Utils.js");
var _     = require('underscore');


var Controller = {description:'controller'}
	
	
Controller.NetworkActor =   function(onAct, W){
		
		var map = Controller.ControllersActionMap()
		var self = this;
		
		this.run = function(){
			// no need to bother - event style
		}
		this.act=function(S, action, is_on, actor){
			//var C = W.meshes[ W.actors[actor].control.object_guid ]
			// console.log(action)
			// console.log("SCENES",scenes, actor.scene);
			// console.log("my time", new Date().getTime()/1000)
			// console.log("server time", action.timestamp/1000 )
			// console.log("my time - servtime", new Date().getTime()/1000 - action.timestamp/1000 )
			if (W !== undefined){
				console.log(W, W._time_diff);
				action.timestamp -= W._time_diff
			}
			// console.log("my time - servtime [fixed]", new Date().getTime()/1000 - action.timestamp/1000 )
			
			// console.log(  )
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
				// console.log(W.controllable());
				t[k.substr(1)] = W.mouse_projection_vec.clone().sub(W.controllable().position.clone() )
			}},
		}
	
		self.actions = self._default_actions;
		self._keycodes_in_action = {}
		this.input = function(keycode, up_or_down, modifiers){
			// 1. Send to server action
			if(_.has(self._keycodes_in_action, keycode)){
				var state = self._keycodes_in_action[keycode]
				// console.log(state, up_or_down)
				if(state === up_or_down){// Состояние не изменилось - ничего не делаем
					return 
				}else{
					self._keycodes_in_action[keycode] = up_or_down
				}
				
			}else{
				self._keycodes_in_action[keycode] = up_or_down
			}
			
			
			var ts = new Date().getTime()
			var action = _.clone(self.actions[keycode]);
			action.timestamp = ts 
			
			console.log("my diff", W._time_diff)
			
			// console.log("my time", new Date().getTime()/1000)
			// console.log("server time", action.timestamp/1000 )
			// console.log("my time - servtime", new Date().getTime()/1000 - action.timestamp/1000 )
			
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
				var onAct = function(){ /*console.log('this is keyboard controller - no need in onAct here') */}
				local_controller = map[action.type]
				var actors = W.get_main_viewport().actors
				
				_.each(actors, function(actor){
					var S = W.scenes[actor.scene];
					var obj = S.get_objects()[actor.control.object_guid];
					var wp = obj.workpoints[actor.control.workpoint];
					if (wp.type == local_controller.type){
						local_controller.act(self.World.scenes[actor.scene], action, up_or_down, actor, onAct);
						// console.log(action);
						var a_clone = _.clone(action)
						
						a_clone.timestamp += W._time_diff;
						if (up_or_down){
							socket.emit('control_on', {action:a_clone, actor:actor});
						}else{
							socket.emit('control_off', {action:a_clone, actor:actor});
			
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
			
			var ets = {rotate:'rotation', move:'propulsion'}
			var et = ets[action.type]
			var AX= action.axis;
			if(! is_down){
				var vec = new T.Vector3(0,0,0)
			}else{
				var a = action.dir == '+'? 1 : -1;
				
				var vec = AX == 'x'?new T.Vector3(a,0,0):(AX =='y'?new T.Vector3(0, a, 0): new T.Vector3(0,0,a))
				// Теперь его надо умножить на мощность двигателя и получить силу
				var power = C.engines[et][action.axis + action.dir];
				vec.multiplyScalar(power)
			}
			var n = action.axis+action.dir
			if(!C.powers){
				C.powers = {}
			}
			if(!C.powers[et]){
				C.powers[et] = {}
			}
			C.powers[et][n] = vec.clone()
			
			
			if (et == "rotation"){
				var tot = new T.Vector3(0,0,0)
				_.each(C.powers.rotation, function(v,ename){
					tot.add(v)
				
				})
				C.total_torques.push({ts:action.timestamp, vec:tot} )
			}
			if (et =='propulsion'){
				var tot = new T.Vector3(0,0,0)
				_.each(C.powers.propulsion, function(vec,ename){
					tot.add(vec)
				})
			
				C.total_powers.push( {ts:action.timestamp, vec:tot} )
			}
			onAct(C.GUID)
			// Получили единичный вектор тяги 
			/*
	
			if (action.type == 'rotate'){
				if (is_down){
					C.put_on("rotation", vec, action.timestamp)
				}else{
					C.put_off("rotation", vec, action.timestamp)
				}
			}
			if (action.type == 'move'){
		
				var a = action.dir == '+'?1:-1;
		
				// var m = new Controller.T().Matrix4()
				if (is_down){
					C.put_on("propulsion", vec, action.timestamp)
				}else{
					C.put_off("propulsion", vec, action.timestamp)
				}
			}*/

			
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
				// console.log( vel, pd )
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
					
							console.log('HIT')
							// console.log("END", isr[0].point);
							m.worldToLocal(isr[0].point) // Теперь это плечо удара
							var impulse = self.my_mesh.impulse;  //vel.clone().multiplyScalar(self.my_mesh.mass)
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
					
					
					
							// add_vel = impulse.multiplyScalar( 1/ m.mass);
							// console.log(add_vel)
							// Убрать пока скорость
							//if (S.meshes[i].vel){
								console.log(S.meshes[i].impulse)
							S.meshes[i].impulse.add( impulse );
							console.log(S.meshes[i].impulse)
								// }
					
					
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
				if(! is_down) return;
				// console.log('>>>');
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
				bullet.vel = new T.Vector3(0,0,0); // mpv//.multiplyScalar(0.10);
				bullet.mass = 1;
				bullet.impulse = mpv;
				bullet.angular_impulse = new T.Vector3(0,0,0);
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
		// console.log('P');
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
		// console.log("particle")
		// var cubeGeometry = new T.CubeGeometry(1,1,1,1,1,1);
		var map	= T.ImageUtils.loadTexture( "/textures/lensflare/lensflare0.png" );
		var material = new T.SpriteMaterial( { map: map, color: 0xffffff, fog: true } );
		material.transparent = true;
		material.blending = THREE.AdditiveBlending;
		
		var a = new T.Sprite(material);
		a.static = false;
		a.has_engines = false;
		return a
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvYXpsL0RvY3VtZW50cy93b3Jrc3BhY2UvYXotYXoucnUvc2VydmVyL2VudHJ5LmpzIiwiL1VzZXJzL2F6bC9Eb2N1bWVudHMvd29ya3NwYWNlL2F6LWF6LnJ1L3NlcnZlci91dGlscy5qcyIsIi9Vc2Vycy9hemwvRG9jdW1lbnRzL3dvcmtzcGFjZS9hei1hei5ydS9zZXJ2ZXIvc3ByaXRlX3V0aWxzLmpzIiwiL1VzZXJzL2F6bC9Eb2N1bWVudHMvd29ya3NwYWNlL2F6LWF6LnJ1L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5LWV4cHJlc3Mvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvX2VtcHR5LmpzIiwiL1VzZXJzL2F6bC9Eb2N1bWVudHMvd29ya3NwYWNlL2F6LWF6LnJ1L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5LWV4cHJlc3Mvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItYnVpbHRpbnMvYnVpbHRpbi9mcy5qcyIsIi9Vc2Vycy9hemwvRG9jdW1lbnRzL3dvcmtzcGFjZS9hei1hei5ydS9zZXJ2ZXIvVXRpbHMuanMiLCIvVXNlcnMvYXpsL0RvY3VtZW50cy93b3Jrc3BhY2UvYXotYXoucnUvc2VydmVyL3NjZW5lLmpzIiwiL1VzZXJzL2F6bC9Eb2N1bWVudHMvd29ya3NwYWNlL2F6LWF6LnJ1L3NlcnZlci9taXNzaW9ucy5qcyIsIi9Vc2Vycy9hemwvRG9jdW1lbnRzL3dvcmtzcGFjZS9hei1hei5ydS9zZXJ2ZXIvY29udHJvbGxlci5qcyIsIi9Vc2Vycy9hemwvRG9jdW1lbnRzL3dvcmtzcGFjZS9hei1hei5ydS9ub2RlX21vZHVsZXMvdW5kZXJzY29yZS91bmRlcnNjb3JlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBOztBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzWUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIlNjZW5lID0gcmVxdWlyZSgnLi9zY2VuZS5qcycpXG5NaXNzb2lvbiA9IHJlcXVpcmUoJy4vbWlzc2lvbnMuanMnKVxuVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzLmpzJylcblNwcml0ZVV0aWxzID0gcmVxdWlyZSgnLi9zcHJpdGVfdXRpbHMuanMnKVxuQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vY29udHJvbGxlci5qcycpXG5cblxuIiwidmFyIFV0aWxzID0ge1xuXHRcblx0bWFrZV9ndWlkIDpmdW5jdGlvbigpe1xuXHRcdHZhciBndWlkID0gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbihjKSB7XG5cdFx0ICAgIHZhciByID0gTWF0aC5yYW5kb20oKSoxNnwwLCB2ID0gYyA9PSAneCcgPyByIDogKHImMHgzfDB4OCk7XG5cdFx0ICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcblx0XHR9KTtcblx0XHRyZXR1cm4gZ3VpZDtcblx0fVxufVxubW9kdWxlLmV4cG9ydHMgPSBVdGlsczsiLCJ2YXIgTW9kID0ge1xuXHQgbWFrZVRleHRTcHJpdGU6ZnVuY3Rpb24oIG1lc3NhZ2UsIHBhcmFtZXRlcnMgKXtcblx0XHRpZiAoIHBhcmFtZXRlcnMgPT09IHVuZGVmaW5lZCApIHBhcmFtZXRlcnMgPSB7fTtcblx0XG5cdFx0dmFyIGZvbnRmYWNlID0gcGFyYW1ldGVycy5oYXNPd25Qcm9wZXJ0eShcImZvbnRmYWNlXCIpID8gXG5cdFx0XHRwYXJhbWV0ZXJzW1wiZm9udGZhY2VcIl0gOiBcIkFyaWFsXCI7XG5cdFxuXHRcdHZhciBmb250c2l6ZSA9IHBhcmFtZXRlcnMuaGFzT3duUHJvcGVydHkoXCJmb250c2l6ZVwiKSA/IFxuXHRcdFx0cGFyYW1ldGVyc1tcImZvbnRzaXplXCJdIDogMTg7XG5cdFxuXHRcdHZhciBib3JkZXJUaGlja25lc3MgPSBwYXJhbWV0ZXJzLmhhc093blByb3BlcnR5KFwiYm9yZGVyVGhpY2tuZXNzXCIpID8gXG5cdFx0XHRwYXJhbWV0ZXJzW1wiYm9yZGVyVGhpY2tuZXNzXCJdIDogNDtcblx0XG5cdFx0dmFyIGJvcmRlckNvbG9yID0gcGFyYW1ldGVycy5oYXNPd25Qcm9wZXJ0eShcImJvcmRlckNvbG9yXCIpID9cblx0XHRcdHBhcmFtZXRlcnNbXCJib3JkZXJDb2xvclwiXSA6IHsgcjowLCBnOjAsIGI6MCwgYToxLjAgfTtcblx0XG5cdFx0dmFyIGJhY2tncm91bmRDb2xvciA9IHBhcmFtZXRlcnMuaGFzT3duUHJvcGVydHkoXCJiYWNrZ3JvdW5kQ29sb3JcIikgP1xuXHRcdFx0cGFyYW1ldGVyc1tcImJhY2tncm91bmRDb2xvclwiXSA6IHsgcjoyNTUsIGc6MjU1LCBiOjI1NSwgYToxLjAgfTtcblxuXHRcdC8vdmFyIHNwcml0ZUFsaWdubWVudCA9IFRIUkVFLlNwcml0ZUFsaWdubWVudC50b3BMZWZ0O1xuXHRcdFxuXHRcdHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0XHR2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXHRcdGNvbnRleHQuZm9udCA9IFwiQm9sZCBcIiArIGZvbnRzaXplICsgXCJweCBcIiArIGZvbnRmYWNlO1xuICAgIFxuXHRcdC8vIGdldCBzaXplIGRhdGEgKGhlaWdodCBkZXBlbmRzIG9ubHkgb24gZm9udCBzaXplKVxuXHRcdHZhciBtZXRyaWNzID0gY29udGV4dC5tZWFzdXJlVGV4dCggbWVzc2FnZSApO1xuXHRcdHZhciB0ZXh0V2lkdGggPSBtZXRyaWNzLndpZHRoO1xuXHRcblx0XHQvLyBiYWNrZ3JvdW5kIGNvbG9yXG5cdFx0Y29udGV4dC5maWxsU3R5bGUgICA9IFwicmdiYShcIiArIGJhY2tncm91bmRDb2xvci5yICsgXCIsXCIgKyBiYWNrZ3JvdW5kQ29sb3IuZyArIFwiLFwiXG5cdFx0XHRcdFx0XHRcdFx0XHQgICsgYmFja2dyb3VuZENvbG9yLmIgKyBcIixcIiArIGJhY2tncm91bmRDb2xvci5hICsgXCIpXCI7XG5cdFx0Ly8gYm9yZGVyIGNvbG9yXG5cdFx0Y29udGV4dC5zdHJva2VTdHlsZSA9IFwicmdiYShcIiArIGJvcmRlckNvbG9yLnIgKyBcIixcIiArIGJvcmRlckNvbG9yLmcgKyBcIixcIlxuXHRcdFx0XHRcdFx0XHRcdFx0ICArIGJvcmRlckNvbG9yLmIgKyBcIixcIiArIGJvcmRlckNvbG9yLmEgKyBcIilcIjtcblxuXHRcdGNvbnRleHQubGluZVdpZHRoID0gYm9yZGVyVGhpY2tuZXNzO1xuXHRcdHRoaXMucm91bmRSZWN0KGNvbnRleHQsIGJvcmRlclRoaWNrbmVzcy8yLCBib3JkZXJUaGlja25lc3MvMiwgdGV4dFdpZHRoICsgYm9yZGVyVGhpY2tuZXNzLCBmb250c2l6ZSAqIDEuNCArIGJvcmRlclRoaWNrbmVzcywgNik7XG5cdFx0Ly8gMS40IGlzIGV4dHJhIGhlaWdodCBmYWN0b3IgZm9yIHRleHQgYmVsb3cgYmFzZWxpbmU6IGcsaixwLHEuXG5cdFxuXHRcdC8vIHRleHQgY29sb3Jcblx0XHRjb250ZXh0LmZpbGxTdHlsZSA9IFwicmdiYSgwLCAwLCAwLCAxLjApXCI7XG5cblx0XHRjb250ZXh0LmZpbGxUZXh0KCBtZXNzYWdlLCBib3JkZXJUaGlja25lc3MsIGZvbnRzaXplICsgYm9yZGVyVGhpY2tuZXNzKTtcblx0XG5cdFx0Ly8gY2FudmFzIGNvbnRlbnRzIHdpbGwgYmUgdXNlZCBmb3IgYSB0ZXh0dXJlXG5cdFx0dmFyIHRleHR1cmUgPSBuZXcgVEhSRUUuVGV4dHVyZShjYW52YXMpIFxuXHRcdHRleHR1cmUubmVlZHNVcGRhdGUgPSB0cnVlO1xuXG5cdFx0dmFyIHNwcml0ZU1hdGVyaWFsID0gbmV3IFRIUkVFLlNwcml0ZU1hdGVyaWFsKCBcblx0XHRcdHsgbWFwOiB0ZXh0dXJlLCB1c2VTY3JlZW5Db29yZGluYXRlczogZmFsc2UgfSApO1xuXHRcdHZhciBzcHJpdGUgPSBuZXcgVEhSRUUuU3ByaXRlKCBzcHJpdGVNYXRlcmlhbCApO1xuXHRcdHNwcml0ZS5zY2FsZS5zZXQoMjAsMjAsMS4wKTtcblx0XHRyZXR1cm4gc3ByaXRlO1x0XG5cdH0sXG5cdHJvdW5kUmVjdDpmdW5jdGlvbihjdHgsIHgsIHksIHcsIGgsIHIpIFxuXHR7XG5cdCAgICBjdHguYmVnaW5QYXRoKCk7XG5cdCAgICBjdHgubW92ZVRvKHgrciwgeSk7XG5cdCAgICBjdHgubGluZVRvKHgrdy1yLCB5KTtcblx0ICAgIGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKHgrdywgeSwgeCt3LCB5K3IpO1xuXHQgICAgY3R4LmxpbmVUbyh4K3csIHkraC1yKTtcblx0ICAgIGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKHgrdywgeStoLCB4K3ctciwgeStoKTtcblx0ICAgIGN0eC5saW5lVG8oeCtyLCB5K2gpO1xuXHQgICAgY3R4LnF1YWRyYXRpY0N1cnZlVG8oeCwgeStoLCB4LCB5K2gtcik7XG5cdCAgICBjdHgubGluZVRvKHgsIHkrcik7XG5cdCAgICBjdHgucXVhZHJhdGljQ3VydmVUbyh4LCB5LCB4K3IsIHkpO1xuXHQgICAgY3R4LmNsb3NlUGF0aCgpO1xuXHQgICAgY3R4LmZpbGwoKTtcblx0XHRjdHguc3Ryb2tlKCk7ICAgXG5cdH1cbn1cbm1vZHVsZS5leHBvcnRzPU1vZCIsbnVsbCwiLy8gbm90aGluZyB0byBzZWUgaGVyZS4uLiBubyBmaWxlIG1ldGhvZHMgZm9yIHRoZSBicm93c2VyXG4iLCJ2YXIgVXRpbHMgPSB7XG5cdFxuXHRtYWtlX2d1aWQgOmZ1bmN0aW9uKCl7XG5cdFx0dmFyIGd1aWQgPSAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uKGMpIHtcblx0XHQgICAgdmFyIHIgPSBNYXRoLnJhbmRvbSgpKjE2fDAsIHYgPSBjID09ICd4JyA/IHIgOiAociYweDN8MHg4KTtcblx0XHQgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuXHRcdH0pO1xuXHRcdHJldHVybiBndWlkO1xuXHR9XG59XG5tb2R1bGUuZXhwb3J0cyA9IFV0aWxzOyIsInZhciBmcyAgICA9IHJlcXVpcmUoJ2ZzJyk7XG52YXIgdSA9IHJlcXVpcmUoJy4vdXRpbHMuanMnKTtcbnZhciBUSFIgPSByZXF1aXJlKCcuL3RocmVlLm5vZGUuanMnKTtcblxudmFyIF8gICAgID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG52YXIgU2NlbmVPYmplY3QgPSBmdW5jdGlvbih4LHkseil7XG5cdHRoaXMuZGVzY3JpcHRpb249IFwiU2NlbmUgcm91dGluZXNcIlxuXHR0aGlzLkdVSUQgPSAgdS5tYWtlX2d1aWQoKTtcblx0dGhpcy5fY3JlYXRlKCk7XG5cdHRoaXMuZ3ggPSB4XG5cdHRoaXMuZ3kgPSB5XG5cdHRoaXMuZ3ogPSB6XG59XG5TY2VuZSA9IHtjb25zdHJ1Y3RvcjogU2NlbmVPYmplY3R9XG5cbmlmKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKXtcblx0U2NlbmUuVEhSRUUgPSBUSFIgLy8gU2F2ZWluZyBUSFJFRS5qcyBhcyBwYXJ0IG9mIHNjZW5lIC0gdGhpcyBzdGVwIGNvdWxkIGJlIGRvbmUgb24gYSBjZXJ0YWluIHBsYXRmb3JtXG5cdFNjZW5lLmRvX3ByZXBhcmVfcmVuZGVyaW5nID0gZmFsc2Vcblx0U2NlbmUuYWpheF9sb2FkX21vZGVscyA9IGZhbHNlXG5cdFNjZW5lLm5lZWRfdXBkYXRlX21hdHJpeCA9IHRydWVcblx0XG59ZWxzZXtcblx0U2NlbmUuVEhSRUUgPSBUSFJFRVxuXHRTY2VuZS5kb19wcmVwYXJlX3JlbmRlcmluZyA9IHRydWVcblx0U2NlbmUuYWpheF9sb2FkX21vZGVscyA9IHRydWVcblx0U2NlbmUubmVlZF91cGRhdGVfbWF0cml4ID0gZmFsc2Vcblx0XG59XG5cblxuXG5cblNjZW5lLm1lc2hfZm9yID0gZnVuY3Rpb24oYWN0b3Ipe1xuXHRyZXR1cm4gdGhpcy5tZXNoZXNbYWN0b3IuY29udHJvbC5vYmplY3RfZ3VpZF1cbn1cblNjZW5lLmNyZWF0ZSA9IGZ1bmN0aW9uKCl7XG5cdHRoaXMuX2NyZWF0ZSgpO1xuXHQvL2NvbnNvbGUubG9nKCBcIkNMT0NLXCIsIHRoaXMuY2xvY2spO1xuXHRcblx0cmV0dXJuIHRoaXM7XG59XG5cblNjZW5lLl9jcmVhdGUgPSBmdW5jdGlvbigpe1xuXHR0aGlzLmNsb2NrID0gbmV3ICh0aGlzLlRIUkVFLkNsb2NrKSgpO1xuXHR0aGlzLnRpbWVfaW5jICA9IDA7XG5cdHRoaXMuX3NjZW5lX29iamVjdF9jYWNoZSA9IHt9XG5cdHRoaXMuX3NjZW5lX29ial9hY3RvcnM9e31cblx0dGhpcy5pc19sb2FkZWQgPSBmYWxzZVxuXHR0aGlzLl9kID0gZmFsc2Vcblx0dGhpcy5fc2NlbmUgPXthY3RvcnM6e30sIEdVSUQ6IHRoaXMuR1VJRCwgb2JqZWN0czp7fSwgY29vcmRzOlt0aGlzLmd4LCB0aGlzLmd5LCB0aGlzLmd6XSAgfSBcblx0XG5cdFxuXHQvLyB0aGlzLnNpbXVsYXRpb25fcnVucyA9IGZhbHNlXG5cdC8vIGNvbnNvbGUubG9nKHRoaXMuY2xvY2spO1xuXHRcbn1cblNjZW5lLnVwZGF0ZV9mcm9tX3dvcmxkID0gZnVuY3Rpb24oKXtcblx0Ly8gZ2xvYmFseC15LXogLSBnYWxheHkgY29vcmRzIHdpdGggMSBtZXRlciBhY2N1cmFjeVxuXHR2YXIgY2xvc2VzdF9zY2VuZV93aXRoX2Rpc3RhbmNlID0gdGhpcy5nZXRfY2xvc2VzdF9zY2VuZSh0aGlzLmd4LCB0aGlzLmd5LCB0aGlzLmd6KTtcblx0Ly8gaWYgY2xvc2VzdF9zY2VuZSBpcyBub3QgbnVsbCAtIHdlIG11c3QgaW5qZWN0IG9iamVjdCB3aXRoIGFjdG9ycyB0byB0aGF0IHNjZW5lIC0gaXQncyBhbHJlYWR5X2xvYWRlZFxuXHQvLyBlbHNlIC0gV2UgZmluZGluZyBvYmplY3RzIGZvciB0aGF0IHNjZW5lXG5cdFx0XHRcdFxuXHR2YXIgb2JqZWN0c193aXRoaW5fY29vcmRzID0gdGhpcy5nZXRfb2JqZWN0c19pbih0aGlzLmd4LCB0aGlzLmd5LCB0aGlzLmd6KTsgLy8g0JfQsNCz0YDRg9C30LrQsCDQvtCx0YrQtdC60YLQvtCyINCyINGB0YbQtdC90YMg0LjQtyDQs9C70L7QsdCw0LvRjNC90L7Qs9C+INC80LjRgNCwXG5cdFxuXHR2YXIgb2JqZWN0cyA9IHt9XG5cdGZvciAoIHZhciBpID0gMDsgaSA8IG9iamVjdHNfd2l0aGluX2Nvb3Jkcy5sZW5ndGggOyBpKysgKXtcblx0XHRvYmplY3RzWyBvYmplY3RzX3dpdGhpbl9jb29yZHNbaV0uR1VJRCBdID0gICBvYmplY3RzX3dpdGhpbl9jb29yZHNbaV07XG5cdH1cblx0Xy5leHRlbmQodGhpcy5fc2NlbmUub2JqZWN0cywgb2JqZWN0cylcblx0XG5cdHRoaXMuX3NjZW5lLnN1bkRpcmVjdGlvbiA9IFswLDEsMF1cblx0dGhpcy5fc2NlbmUuc3VuTGlnaHRDb2xvciA9IFtNYXRoLnJhbmRvbSgpLCAwLjgsIDAuOV0gLy8gSFNMXG5cdHRoaXMuX3NjZW5lLmNvb3JkcyA9WyB0aGlzLmd4LCB0aGlzLmd5LCB0aGlzLmd6IF1cblx0Ly8gdGhpcy5fY3JlYXRlKCk7XG5cdFxuXHQvLyBjcmVhdGluZyBzY2VuZVxuXHRcblx0Ly8gdGhpcy5fc2NlbmUgPSB7Y29vcmRzIDpbIGdsb2JhbHgsIGdsb2JhbHksIGdsb2JhbHogXSwgYWN0b3JzOnt9LCBHVUlEOiB1Lm1ha2VfZ3VpZCgpLCBvYmplY3RzOnt9IH0gXG5cdC8vIHRoaXMuR1VJRCA9IHRoaXMuX3NjZW5lLkdVSUQ7XG5cdFxuXHQvLyBwcmVwYXJlIGFjdG9ycyAtIGFsbCBvZiB0aGVtIHdvdWxkIGNvbnRyb2wgb2JqZWN0X2lkID0gMCwgdmlld3BvcnRzIC0gZWFjaCBmb3IgZWFjaFxuXHRcblx0XG5cdC8vIEluamVjdGluZyBvdGhlciBvYmplY3RzXG5cdC8vdmFyIG9iamVjdHMgPSB7fVxuXHQvLyBvYmplY3RzW2Zvcl9vYmplY3QuR1VJRF0gPSBmb3Jfb2JqZWN0O1xuXHRcblx0Ly8gY29uc29sZS5sb2coXG5cdC8vIGNvbnNvbGUubG9nKCBcIkNMT0NLXCIsIHRoaXMuY2xvY2spO1xuXHRcblx0cmV0dXJuIHRoaXNcblx0XG59XG5TY2VuZS5nZXRfYWN0b3JzID0gZnVuY3Rpb24oKXtcblx0cmV0dXJuIHRoaXMuX3NjZW5lLmFjdG9yc1xufVxuU2NlbmUuZ2V0X29iamVjdHMgPSBmdW5jdGlvbigpe1xuXHRyZXR1cm4gdGhpcy5fc2NlbmUub2JqZWN0c1xufVxuU2NlbmUuZ2V0X2pzb24gPSBmdW5jdGlvbigpe1xuXHRyZXR1cm4gdGhpcy5fc2NlbmVcbn1cblNjZW5lLmdldF9jbG9zZXN0X3NjZW5lID0gZnVuY3Rpb24oKXtcblx0cmV0dXJuIHVuZGVmaW5lZFxufVxuU2NlbmUuZ2V0X29iamVjdHNfaW4gPSBmdW5jdGlvbigpe1xuXHRyZXR1cm4gW107XG59XG5TY2VuZS5qb2luX29iamVjdCA9IGZ1bmN0aW9uKCBvYmplY3QgKXtcblx0dGhpcy5fc2NlbmUub2JqZWN0c1tvYmplY3QuR1VJRF0gPSBvYmplY3Rcblx0dGhpcy5fc2NlbmVfb2JqX2FjdG9yc1tvYmplY3QuR1VJRF0gPSBbXVxuXHQvLyBjb25zb2xlLmxvZyhcIlBVVCBPQkpcIiwgb2JqZWN0LkdVSUQpXG59XG5TY2VuZS5qb2luX2FjdG9yID0gZnVuY3Rpb24oIGFjdG9yICl7XG5cdC8vaWYgKHRoaXMuX3NjZW5lLmFjdG9yc1thY3Rvci5HVUlEXSl7XG5cdC8vXHR0aGlzLl9zY2VuZS5hY3RvcnNbYWN0b3IuR1VJRF0ucHVzaChhY3Rvcilcblx0XHQvL31lbHNle1xuXHRcdHRoaXMuX3NjZW5lLmFjdG9yc1thY3Rvci5HVUlEXSA9IGFjdG9yXG5cdFxuXHQvLyBjb25zb2xlLmxvZyhcIkdFVCBPQkpcIix0aGlzLl9zY2VuZV9vYmpfYWN0b3JzLCAgYWN0b3IuY29udHJvbC5vYmplY3RfZ3VpZClcblx0XG5cdHRoaXMuX3NjZW5lX29ial9hY3RvcnNbYWN0b3IuY29udHJvbC5vYmplY3RfZ3VpZF0ucHVzaChhY3Rvcilcblx0XG5cdHJldHVybiB0aGlzXG5cdFxufVxuU2NlbmUuc2V0X2Zyb21fanNvbiA9IGZ1bmN0aW9uKG9iamVjdCl7XG5cdHRoaXMuX3NjZW5lID0gb2JqZWN0XG5cdFxuXHR0aGlzLkdVSUQgPSBvYmplY3QuR1VJRFxuXHR0aGlzLmd4ID0gb2JqZWN0LmNvb3Jkc1swXVxuXHR0aGlzLmd5ID0gb2JqZWN0LmNvb3Jkc1sxXVxuXHR0aGlzLmd6ID0gb2JqZWN0LmNvb3Jkc1syXVxuXHR0aGlzLnVwZGF0ZV9mcm9tX3dvcmxkKCApXG5cdFxuXHRcbn1cblxuLy8gU2NlbmUuY29udHJvbGxhYmxlID0gZnVuY3Rpb24obG9naW4pe1xuXHRcbi8vXHRyZXR1cm4gdGhpcy5tZXNoZXNbdGhpcy5hY3RvcnNbbG9naW5dLmNvbnRyb2wub2JqZWN0X2d1aWRdXG4vLyB9XG5TY2VuZS5sb2FkID0gZnVuY3Rpb24ob25sb2FkLCB0aHJlZV9zY2VuZSl7XG5cdC8vIHRocmVlIHNjZW5lIC0gaXMgYSBwYXJhbSBmb3IgYWRkaW5nIG1lc2hlcyB0b1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cdC8vY29uc29sZS5sb2coJ2xvYWRpbmcnKTtcblx0XG5cdHNlbGYubWVzaGVzID0ge31cblx0c2VsZi5sb2FkZXIgPSAgbmV3IHNlbGYuVEhSRUUuSlNPTkxvYWRlcigpO1xuXHRzZWxmLnRvdGFsX29iamVjdHNfY291bnQgPSAwO1xuXHRzZWxmLl9jYWxsX2JhY2sgPSBvbmxvYWQ7XG5cdFxuXHRpZih0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyl7XG5cdFx0c2VsZi50aHJlZV9zY2VuZSA9IHRocmVlX3NjZW5lXG5cdH1cblx0XG5cdGZ1bmN0aW9uIHB1dF9vbih0eXBlLCBuYW1lLCB0cyl7XG5cdFx0dmFyIGVzID0gdGhpc1tcIm9uX2VuZ2luZXNfXCIgKyB0eXBlXVxuXHRcdG9iaiA9IHtuYW1lOm5hbWUsIHRzOnRzfVxuXHRcdC8vIGNvbnNvbGUubG9nKGVzKVxuXHRcdGlmICggZXMuaW5kZXhPZiggbmFtZSApID09PSAtMSl7XG5cdFx0XHRlcy5wdXNoKCBuYW1lIClcdFxuXHRcdH1cblx0XHQvLyBjb25zb2xlLmxvZyhlcylcblx0fVxuXHRmdW5jdGlvbiBwdXRfb2ZmKHR5cGUsIG5hbWUsdHMpe1xuXHRcdHZhciBlcyA9IHRoaXNbXCJvbl9lbmdpbmVzX1wiICsgdHlwZV1cblx0XHR2YXIgaXggPSBlcy5pbmRleE9mKG5hbWUpXG5cdFx0aWYgKCAgaXggIT09IC0xICl7XG5cdFx0XHRlcy5zcGxpY2UoaXgsIDEpO1xuXHRcdH1cblx0fVxuXHR2YXIganNvbiA9IHRoaXMuX3NjZW5lXG5cdFxuXHRcblx0c2VsZi5hY3RvcnMgPSBqc29uLmFjdG9ycztcblx0XG5cdC8vIHNlbGYuYXV0b21hdGljIGFjdG9ycyAtIHJ1biBpbiBsb29wc1xuXHRzZWxmLmF1dG9tYXRpY19hY3RvcnMgPSB7fTtcblx0Ly8gY29uc29sZS5sb2coc2VsZi5hY3RvcnMpXG5cdFxuXHRzZWxmLmxvYWRlZF9vYmplY3RzX2NvdW50ID0gMFxuXHRcblx0Ly8gY29uc29sZS5sb2coc2VsZi5hY3RvcnMpO1xuXHQvLyBjb25zb2xlLmxvZyhqc29uKTtcblx0c2VsZi5fbW9kZWxfY2FjaGUgPSB7fVxuXHQvL2NvbnNvbGUubG9nKHRoaXMpO1xuXHRfLmVhY2goanNvbi5vYmplY3RzLCBmdW5jdGlvbiggb2JqZWN0LGl4ICl7XG5cdFx0c2VsZi50b3RhbF9vYmplY3RzX2NvdW50ICs9MTtcblx0XHRcblx0XHRpZiAoISBzZWxmLmFqYXhfbG9hZF9tb2RlbHMpe1xuXHRcdFx0dmFyIG0gPSBvYmplY3QubW9kZWxfM2Quc3BsaXQoJy8nKVsyXTtcblx0XHRcdHZhciBtb2RlbF9wYXRoPSBcIi4vcHVibGljL21vZGVscy9cIiArIG1cblx0XHR9XG5cdFx0Ly8gY29uc29sZS5sb2cobW9kZWxfcGF0aCk7XG5cdFx0XG5cdFx0dmFyIHJmID0gZnVuY3Rpb24oKXtcblx0XHRcdHZhciB3aXRoX2dlb21fYW5kX21hdCA9IGZ1bmN0aW9uKGdlb20sIG1hdCl7XG5cdFx0XHRcdHZhciBtID0gbmV3IHNlbGYuVEhSRUUuTWF0cml4NCgpXG5cdFx0XHRcdG0uaWRlbnRpdHkoKVxuXHRcdFx0XG5cdFx0XG5cdFx0XHRcdHZhciBtZXNoID0gbmV3IHNlbGYuVEhSRUUuTWVzaCggZ2VvbSwgbWF0ICk7XG5cdFx0XHRcdG1lc2gudG90YWxfcG93ZXJzID0gW107XG5cdFx0XHRcdG1lc2gudG90YWxfdG9ycXVlcyA9IFtdO1xuXHRcdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coaSwgbWVzaC50b3RhbF90b3JxdWVzLCBtZXNoLnRvdGFsX3Bvd2Vycylcblx0XHRcdFx0bWVzaC50eXBlPW9iamVjdC50eXBlXG5cdFx0XHRcdHZhciBvYmplY3Rfcm90YXRlZCA9IGZhbHNlXG5cdFx0XHRcdC8vIFNldHRpbmcgZGVmYXVsdHMgXG5cdFx0XHRcdG1lc2guYXZlbCA9IG5ldyBzZWxmLlRIUkVFLlZlY3RvcjMoMCwwLDApXG5cdFx0XHRcdG1lc2guYWFjYyA9IG5ldyBzZWxmLlRIUkVFLlZlY3RvcjMoMCwwLDApXG5cdFx0XHRcdG1lc2gudmVsID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMygwLDAsMClcblx0XHRcdFx0bWVzaC5hY2MgPSBuZXcgc2VsZi5USFJFRS5WZWN0b3IzKDAsMCwwKVxuXHRcdFx0XHRcblx0XHRcdFx0XG5cdFx0XHRcdGlmICggb2JqZWN0LnBoeXNpY2FsICl7XG5cdFx0XHRcdFx0Zm9yKGkgaW4gb2JqZWN0LnBoeXNpY2FsKXtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0dmFyIF9pcyA9ICd0bycgaW4gb2JqZWN0LnBoeXNpY2FsW2ldXG5cdFx0XHRcdFx0XHRpZiAoIV9pcyl7XG5cdFx0XHRcdFx0XHRcdHZhciB2ID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMygpXG5cdFx0XHRcdFx0XHRcdHYuc2V0LmFwcGx5KHYsIG9iamVjdC5waHlzaWNhbFtpXSlcblx0XHRcdFx0XHRcdFx0bWVzaFtpXSA9IHZcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0XHRcdHZhciBwID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMyhvYmplY3QucGh5c2ljYWxbaV0udG9bMF0sIG9iamVjdC5waHlzaWNhbFtpXS50b1sxXSwgb2JqZWN0LnBoeXNpY2FsW2ldLnRvWzJdKVxuXHRcdFx0XHRcdFx0XHQvLyBUcnkgdG8gcm90YXRlIHAgb24gMTgwIFxuXHRcdFx0XHRcdFx0XHQvL3Aucm90YXRlWCgyKiBNYXRoLlBJKTtcblx0XHRcdFx0XHRcdFx0bWVzaC5sb29rQXQocC5uZWdhdGUoKSlcblx0XHRcdFx0XHRcdFx0Ly8gbWVzaC5yb3RhdGVYKDIqTWF0aC5QSSlcblx0XHRcdFx0XHRcdFx0bWVzaC5yb3QgPSBuZXcgc2VsZi5USFJFRS5WZWN0b3IzKG1lc2gucm90YXRpb24ueCwgbWVzaC5yb3RhdGlvbi55LCBtZXNoLnJvdGF0aW9uLnopO1xuXHRcdFx0XHRcdFx0XHRvYmplY3Rfcm90YXRlZCA9IHRydWU7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9ZWxzZXtcblx0XHRcdFx0XHR2YXIgcGkyID0gTWF0aC5QSSAqIDI7XG5cdFx0XHRcdFx0bWVzaC5wb3MgPSBuZXcgc2VsZi5USFJFRS5WZWN0b3IzKE1hdGgucmFuZG9tKCkgKiAyMDAsIE1hdGgucmFuZG9tKCkgKiAyMDAsIE1hdGgucmFuZG9tKCkgKiAyMDApO1xuXHRcdFx0XHRcdG1lc2gucm90ID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMyhNYXRoLnJhbmRvbSgpICogcGkyLCBNYXRoLnJhbmRvbSgpICogcGkyLCBNYXRoLnJhbmRvbSgpICogcGkyKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0fVxuXHRcdFx0XHRtZXNoLnBvc2l0aW9uID0gbWVzaC5wb3M7XG5cdFx0XHRcdGlmICghIG9iamVjdF9yb3RhdGVkICYmICAncm90JyBpbiBtZXNoKXtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHR2YXIgdWVsID0gbmV3IFRIUkVFLkV1bGVyKG1lc2gucm90LngsIG1lc2gucm90LnksIG1lc2gucm90LnopO1xuXHRcdFx0XHRcdG1lc2gucm90YXRpb24gPSB1ZWw7XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gY29uc29sZS5sb2cobWVzaC5wb3NpdGlvbilcblx0XHRcdFx0bWVzaC5jYW1lcmFzID0gb2JqZWN0LmNhbWVyYXM7XG5cdFx0XHRcdG1lc2guZW5naW5lcyA9IG9iamVjdC5lbmdpbmVzO1xuXHRcdFx0XHRtZXNoLmhhc19lbmdpbmVzID0gb2JqZWN0LmVuZ2luZXMgIT09IHVuZGVmaW5lZDtcblx0XHRcdFx0aWYgKG1lc2guaGFzX2VuZ2luZXMpe1xuXHRcdFx0XHRcdG1lc2gub25fZW5naW5lc19yb3RhdGlvbiA9IFtdO1xuXHRcdFx0XHRcdG1lc2gub25fZW5naW5lc19wcm9wdWxzaW9uID0gW107XG5cdFx0XHRcdH1cblx0XHRcdFx0bWVzaC5wdXRfb2ZmID0gcHV0X29mZjtcblx0XHRcdFx0bWVzaC5wdXRfb24gID0gcHV0X29uO1xuXHRcdFx0XHRtZXNoLm1hc3MgPSBvYmplY3QubWFzcztcblx0XHRcdFx0bWVzaC5hbmd1bGFyX2ltcHVsc2UgPSBtZXNoLmF2ZWwuY2xvbmUoKS5tdWx0aXBseVNjYWxhcihtZXNoLm1hc3MpXG5cdFx0XHRcdG1lc2guaW1wdWxzZSA9IG1lc2gudmVsLmNsb25lKCkubXVsdGlwbHlTY2FsYXIobWVzaC5tYXNzKVxuXHRcdFx0XHRcblx0XHRcblx0XHRcdFx0aWYgKHNlbGYuZG9fcHJlcGFyZV9yZW5kZXJpbmcpe1xuXHRcdFx0XHRcdGlmIChvYmplY3QudHlwZSAhPT0nc3RhdGljJyl7XG5cdFx0XHRcdFx0XHR2YXIgbGFiZWwgPSBTcHJpdGVVdGlscy5tYWtlVGV4dFNwcml0ZShcIm1lc2g6IFwiICsgaXgpO1xuXHRcdFx0XHRcdFx0bGFiZWwucG9zaXRpb24gPSBuZXcgc2VsZi5USFJFRS5WZWN0b3IzKDAsMCwwKTtcblx0XHRcdFx0XHRcdG1lc2guYWRkKGxhYmVsKTtcblx0XHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKFwiYWRkZWRcIik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHRocmVlX3NjZW5lLmFkZCggbWVzaCApO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHR9XG5cdFx0XHRcblx0XHRcdFx0c2VsZi5tZXNoZXNbIG9iamVjdC5HVUlEIF0gPSBtZXNoO1xuXHRcdFx0XHRzZWxmLmxvYWRlZF9vYmplY3RzX2NvdW50ICs9MTtcblx0XHRcdFx0c2VsZi5fbW9kZWxfbG9hZGVkKCBpeCApXG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGlmKHNlbGYuYWpheF9sb2FkX21vZGVscyl7XG5cdFx0XHRcdHNlbGYuX2dldF9tb2RlbChvYmplY3QubW9kZWxfM2Qsc2VsZi5fYWpheF9nZXR0ZXIsIHdpdGhfZ2VvbV9hbmRfbWF0KVxuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdHNlbGYuX2dldF9tb2RlbChtb2RlbF9wYXRoLCBzZWxmLl9mc19nZXR0ZXIsIHdpdGhfZ2VvbV9hbmRfbWF0KVxuXHRcblx0XHRcdH1cblx0XHR9XG5cdFx0c2V0VGltZW91dChyZiwxKTtcblx0XHRcblx0fSlcblx0XHRcdFxuXHRcblx0XG59LFxuU2NlbmUuX2FqYXhfZ2V0dGVyPWZ1bmN0aW9uKG5hbWUsIGNiKSB7XG5cdC8vY29uc29sZS5sb2codGhpcyk7XG5cdHZhciBzZWxmID0gdGhpcztcblx0c2VsZi5sb2FkZXIubG9hZCggbmFtZSwgZnVuY3Rpb24oZ2VvbSwgbWF0KXtcblx0XHRcblx0XHR2YXIgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEZhY2VNYXRlcmlhbCggbWF0ICk7XG5cdFx0Ly92YXIgYSA9IHtnZW9tOmdlb20sIG1hdGVyaWFsOm1hdGVyaWFsfVxuXHRcdGNiKGdlb20sIG1hdGVyaWFsKTtcblx0XHRcblx0fSlcbn1cblNjZW5lLl9mc19nZXR0ZXI9ZnVuY3Rpb24obmFtZSwgY2Ipe1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cdGZzLnJlYWRGaWxlKG5hbWUsIGZ1bmN0aW9uKGVycixkYXRhKXtcblx0XHQvL2NvbnNvbGUubG9nKFwic3RhcnQgbG9hZGluZ1wiKTtcblx0XHRpZihlcnIpIHRocm93IGVycjtcblx0XHR2YXIganNvbiA9IEpTT04ucGFyc2UoZGF0YSlcbiAgICAgICAgdmFyIHJlc3VsdCA9IHNlbGYubG9hZGVyLnBhcnNlKCBqc29uLCAnJyApO1xuXG5cdFx0dmFyIGxkID0gKGZ1bmN0aW9uKCl7XG5cdFx0XHR2YXIgbWF0ZXJpYWwgPSBuZXcgc2VsZi5USFJFRS5NZXNoRmFjZU1hdGVyaWFsKCByZXN1bHQubWF0ZXJpYWxzICk7XG5cdFx0XHRjYihyZXN1bHQuZ2VvbWV0cnksIG1hdGVyaWFsKTtcblx0XHRcblx0XHR9KVxuXHRcdHNldFRpbWVvdXQobGQsMSk7XG5cdH0pO1xufVxuXG5TY2VuZS5fZ2V0X21vZGVsID0gZnVuY3Rpb24obmFtZSwgZ2V0dGVyLCB3aXRoX2dlb21fYW5kX21hdCl7XG5cdHZhciBzZWxmID0gdGhpcztcblx0dmFyIG1hdF9nZW9tX2NiID0gZnVuY3Rpb24oZ2VvbSwgbWF0KXtcblx0XHRzZWxmLl9tb2RlbF9jYWNoZVtuYW1lXSA9IHtnZW9tOmdlb20sIG1hdGVyaWFsOm1hdH1cblx0XHR3aXRoX2dlb21fYW5kX21hdChnZW9tLCBtYXQpXG5cdH1cblx0aWYgKG5hbWUgaW4gc2VsZi5fbW9kZWxfY2FjaGUpe1xuXHRcdHZhciBhPSBzZWxmLl9tb2RlbF9jYWNoZVtuYW1lXVxuXHRcdHdpdGhfZ2VvbV9hbmRfbWF0KGEuZ2VvbSwgYS5tYXRlcmlhbClcblx0fWVsc2V7XG5cdFx0Z2V0dGVyLmFwcGx5KHNlbGYsW25hbWUsIG1hdF9nZW9tX2NiXSlcblx0fVxuXHRcdFx0XHRcbn1cblNjZW5lLl9kZWxldGVfb2JqZWN0ID0gZnVuY3Rpb24oZ3VpZCl7XG5cdHZhciBzZWxmID0gdGhpcztcblx0aWYoc2VsZi50aHJlZV9zY2VuZSl7XG5cdFx0c2VsZi50aHJlZV9zY2VuZS5yZW1vdmUoc2VsZi5tZXNoZXNbZ3VpZF0pIC8vINGD0LTRj9C70Y/QtdC8INGP0LTRgNC+INC40Lcg0YHRhtC10L3Ri1xuXHR9XG5cdGRlbGV0ZSBzZWxmLm1lc2hlc1sgZ3VpZCBdOyAvLyAuLi4g0LjQtyDQvNC10YjQtdC5XG5cdGRlbGV0ZSBzZWxmLl9zY2VuZV9vYmplY3RfY2FjaGVbIGd1aWQgXVxuXHRcblx0XG59XG5TY2VuZS5fbW9kZWxfbG9hZGVkID0gZnVuY3Rpb24oaXgpe1xuXHQvL2NvbnNvbGUubG9nKFwiTExMXCIpO1xuXHRpZiAodGhpcy5sb2FkZWRfb2JqZWN0c19jb3VudCA9PSB0aGlzLnRvdGFsX29iamVjdHNfY291bnQpe1xuXHRcdC8vIHNjZW5lIGxvYWRlZFxuXHRcdHRoaXMuaXNfbG9hZGVkID0gdHJ1ZTtcblx0XHRpZiAgKHRoaXMuX2NhbGxfYmFjayl7XG5cdFx0XHR0aGlzLl9jYWxsX2JhY2sodGhpcylcblx0XHR9XG5cdFx0Ly9jb25zb2xlLmxvZyhcIkRPTkVcIik7XG5cdH1lbHNle1xuXHRcdC8vY29uc29sZS5sb2coJ25vdCB5ZXQnLCB0aGlzLmxvYWRlZF9vYmplY3RzX2NvdW50ICwgdGhpcy50b3RhbF9vYmplY3RzX2NvdW50KTtcblx0fVxufVxuU2NlbmUuc3luYyA9IGZ1bmN0aW9uKHN5bmMpe1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cdF8uZWFjaChzeW5jLCBmdW5jdGlvbihvYmplY3QsIGd1aWQpe1xuXHRcdGlmICghKGd1aWQgaW4gc2VsZi5tZXNoZXMpKSByZXR1cm47XG5cdFx0Xy5lYWNoKG9iamVjdCwgZnVuY3Rpb24odmVjLCBuYW1lKXtcblx0XHRcdGlmIChuYW1lID09J3JvdGF0aW9uJyl7XG5cdFx0XHRcdHZhciB2ID0gbmV3IHNlbGYuVEhSRUUuRXVsZXIoKVxuXHRcdFx0XHRcblx0XHRcdH1lbHNle1xuXHRcdFx0XHR2YXIgdiA9IG5ldyBzZWxmLlRIUkVFLlZlY3RvcjMoKVxuXHRcdFx0XHRcblx0XHRcdH1cblx0XHRcdHYuZnJvbUFycmF5KHZlYylcblx0XHRcdFxuXHRcdFx0c2VsZi5tZXNoZXNbZ3VpZF1bbmFtZV0gPSB2XG5cdFx0XHRcblx0XHRcdFxuXHRcdFx0XG5cdFx0XHQvL2lmICghdi5lcXVhbHMob3YpKXtcblx0XHRcdC8vXHRjb25zb2xlLmxvZyhuYW1lLCB2ZWMsIG92LnRvQXJyYXkoKSApXG5cdFx0XHQvL31cblx0XHRcblx0XHR9KVxuXHRcdFxuXHR9KVxufVxuU2NlbmUuZ2V0ID0gZnVuY3Rpb24oKXtcblx0cmV0dXJuIHRoaXMuX3NjZW5lXG59XG5TY2VuZS5nZXRfYWxtYW5hY2ggPSBmdW5jdGlvbigpe1xuXHQvLyB2YXIgc2VsZiA9IHRoaXM7XG5cdFxuXHRyZXR1cm4gdGhpcy5fc2NlbmVfb2JqZWN0X2NhY2hlXG5cdFxufVxuU2NlbmUudGljayA9IGZ1bmN0aW9uKCl7XG5cdHZhciBzZWxmID0gdGhpcztcblx0Ly8gY29uc29sZS5sb2coJy4nKTtcblx0Ly92YXIgdGltZV9pbmMgPSAwO1xuXHR2YXIgdGltZV9sZWZ0ID0gc2VsZi5jbG9jay5nZXREZWx0YSgpO1xuXHRzZWxmLnRpbWVfaW5jICs9IHRpbWVfbGVmdDtcblx0aWYoc2VsZi5sYXN0X3RzID09PSB1bmRlZmluZWQpe1xuXHRcdHNlbGYubGFzdF90cyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHR9XG5cdFxuXHQvL2NvbnNvbGUubG9nKHNlbGYudGltZV9pbmMpO1xuXHRcblx0Ly8gdmFyIGFjdG9yID0gc2VsZi5nZXRfY3VycmVudF9hY3RvcigpXG5cdC8vIHZhciBDID0gc2VsZi5tZXNoZXMoKVthY3Rvci5jb250cm9sLm9iamVjdF9ndWlkXVxuXHQvLyBjb25zb2xlLmxvZyhzZWxmLmF1dG9tYXRpY19hY3RvcnMpO1xuXHRfLmVhY2goc2VsZi5hdXRvbWF0aWNfYWN0b3JzLCBmdW5jdGlvbihhY3Rvcil7XG5cdFx0Ly9jb25zb2xlLmxvZyhhY3Rvcik7XG5cdFx0YWN0b3IucnVuKHRpbWVfbGVmdCk7XG5cdH0pXG5cdC8vY29uc29sZS5sb2codGltZV9pbmMpXG5cdFxuXHRpZigoTWF0aC5mbG9vcihzZWxmLnRpbWVfaW5jKSAlIDUgKSA9PT0wKXtcblx0XHRpZiAoIXNlbGYuX2Qpe1xuXHRcdFx0c2VsZi5fZCA9IHRydWVcblx0XHRcdC8vY29uc29sZS5sb2coXCI1c2VrIHRpY2tcIilcblx0XHRcdC8vIG9ubHkgdHdvIGZpcnN0XG5cdFx0XHRmb3IoaSBpbiBzZWxmLm1lc2hlcyl7XG5cdFx0XHRcdHZhciBtID0gc2VsZi5tZXNoZXNbaV1cblx0XHRcdFx0aWYgKG0udHlwZSA9PSAnc2hpcCcpe1xuXHRcdFx0XHRcdHZhciB2ID0gbS52ZWw7XG5cdFx0XHRcdFx0dmFyIHAgPSBtLmltcHVsc2U7XG5cdFx0XHRcdFx0dmFyIHggPSBtLnBvc2l0aW9uO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdHZhciByID0gbS5yb3Q7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0aWYgKHYpe1xuXHRcdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coJ3YnLGksIHYueCwgdi55LCB2LnopXG5cdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZygncCcsaSwgcC54LCBwLnksIHAueilcblx0XHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKCd4JyxpLCB4LngsIHgueSwgeC56KVxuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdFxuXHR9ZWxzZXtcblx0XHRzZWxmLl9kID0gZmFsc2Vcblx0fVxuXHR2YXIgZ2V0X2ltcHVsc2VzID0gZnVuY3Rpb24oRkEsIGxhc3RfdHMsIG5vdyl7IFxuXHRcdHZhciBwcyA9IFtdXG5cdFx0aWYgKEZBLmxlbmd0aCA9PSAwKSByZXR1cm4gW11cblx0XHRpZihGQS5sZW5ndGggPiAxKXsgLy8g0JIg0YHQv9C40YHQutC1INC10YHRgtGMINGB0LjQu9GLLCDQutC+0YLQvtGA0YvQtSDRg9C20LUg0L/QtdGA0LXRgdGC0LDQu9C4INC00LXQudGB0YLQstC+0LLQsNGC0YwgXG5cdFx0XHR2YXIgX2xlbmd0aCA9IEZBLmxlbmd0aDtcblx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBGQS5sZW5ndGg7aSsrKXtcblx0XHRcdFx0dmFyIGlzX2xhc3QgPSBpID09PSAoX2xlbmd0aC0xKVxuXHRcdFx0XHRpZighaXNfbGFzdCl7IFxuXHRcdFx0XHRcdHZhciBhY3RzX3VudGlsbCA9IEZBW2krMV0udHNcblx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0dmFyIGFjdHNfdW50aWxsID0gbm93O1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciBhY3RzX3NpbmNlID0gRkFbaV0udHNcblx0XHRcdFx0aWYoYWN0c19zaW5jZSA8IGxhc3RfdHMpe2FjdHNfc2luY2UgPSBsYXN0X3RzIH1cblx0XHRcdFx0dmFyIHRpbWUgPSAoYWN0c191bnRpbGwgLSBhY3RzX3NpbmNlKS8xMDAwO1xuXHRcdFx0XHR2YXIgRiA9IEZBW2ldLnZlYy5jbG9uZSgpO1xuXHRcdFx0XHRwcy5wdXNoKCB7aTpGLm11bHRpcGx5U2NhbGFyKCB0aW1lICksIHQ6dGltZX0gKVxuXHRcdFx0fVxuXHRcdFx0Y29uc29sZS5sb2cocHMpO1xuXHRcdFx0RkEuc3BsaWNlKDAsIEZBLmxlbmd0aCAtIDEpO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhcIlRXT1wiLCBwcyk7XG5cdFx0fVxuXHRcdGVsc2V7IC8vINC+0LTQvdCwINGB0LjQu9CwINCyINGB0L/QuNGB0LrQtSAtINC00LXQudGB0YLQstGD0LXRgiDQtNC+INGB0LjRhSDQv9C+0YBcblx0XHRcdHZhciBGID0gRkFbMF0udmVjLmNsb25lKClcblx0XHRcdHZhciBhY3RzX3NpbmNlID0gRkFbMF0udHNcblx0XHRcdFxuXHRcdFx0Ly9jb25zb2xlLmxvZyhub3cgLSBsYXN0X3RzKTtcblx0XHRcdGlmKGFjdHNfc2luY2UgPCBsYXN0X3RzKXsgYWN0c19zaW5jZSA9IGxhc3RfdHMgfVxuXHRcdFx0dmFyIHRpbWUgPSAobm93IC0gYWN0c19zaW5jZSkvMTAwMDtcblx0XHRcdC8vIGNvbnNvbGUubG9nKHRpbWUsIG5vdyAtIGFjdHNfc2luY2UgKTtcblx0XHRcdGlmIChGLmxlbmd0aCgpID09PSAwKXtcblx0XHRcdFx0RkEuc3BsaWNlKDAsMSk7XG5cdFx0XHR9XG5cdFx0XHRwcy5wdXNoKHtpOkYubXVsdGlwbHlTY2FsYXIoIHRpbWUgKSwgdDp0aW1lfSk7XG5cdFx0XHQvLyBjb25zb2xlLmxvZyhcIk9ORVwiLCBwc1swXS5pLnoscHNbMF0udCk7XG5cdFx0XHRcblx0XHRcblx0XHR9XG5cdFx0XG5cdFx0XG5cdFx0cmV0dXJuIHBzXG5cdFx0XG5cdH1cblx0dmFyIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRfLmVhY2goc2VsZi5tZXNoZXMsIGZ1bmN0aW9uKG1lc2gsIGkpe1xuXHRcdGlmIChtZXNoLnR5cGUgPT0gJ3N0YXRpYycpIHJldHVybjtcblx0XHRcblx0XHR2YXIgcHMgPSBbXTtcblx0XHR2YXIgdW0gPSAxIC8gbWVzaC5tYXNzO1xuXHRcdHZhciB1bXQgPSB0aW1lX2xlZnQgKiB1bVxuXHRcdFxuXHRcdC8vIHZhciBGQSA9IHNlbGYudG90YWxfdG9ycXVlc1xuXHRcdC8vINCYINCyINC60L7QvdGG0LUt0LrQvtC90YbQvtCyINC+0YHRgtCw0LLQu9GP0LXQvCDQv9C+0YHQu9C10LTQvdC40Lkg0YLQsNC50LzRgdGC0LXQv1xuXHRcdC8vIGNvbnNvbGUubG9nKGksIG1lc2gudG90YWxfdG9ycXVlcywgbWVzaC50b3RhbF9wb3dlcnMpXG5cdFx0dmFyIHJvdHMgPSBtZXNoLmFuZ3VsYXJfaW1wdWxzZS5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKHVtdClcblx0XHR2YXIgcG9zZXMgPSBtZXNoLmltcHVsc2UuY2xvbmUoKS5tdWx0aXBseVNjYWxhcih1bXQpXG5cdFx0XG5cdFx0aWYoIG1lc2guaGFzX2VuZ2luZXMpIHtcblx0XHRcdHZhciBUSSA9IGdldF9pbXB1bHNlcyhtZXNoLnRvdGFsX3RvcnF1ZXMsIHNlbGYubGFzdF90cywgbm93KSAvLyDQmNC80L/Rg9C70YzRgdGLINCy0YDQsNGJ0LXQvdC40Y9cblx0XHRcdC8vbWVzaC50b3RhbF90b3JxdWVzID0gWyBtZXNoLnRvdGFsX3RvcnF1ZXNbbWVzaC50b3RhbF90b3JxdWVzLmxlbmd0aF0gXVxuXHRcdFx0dmFyIFBJID0gZ2V0X2ltcHVsc2VzKG1lc2gudG90YWxfcG93ZXJzLCBzZWxmLmxhc3RfdHMsIG5vdykgLy8g0JjQvNC/0YPQu9GM0YHRiyDQv9C+0YHRgtGD0L/QsNGC0LXQu9GM0L3QvtCz0L5cblx0XHRcdF8uZWFjaChUSSwgZnVuY3Rpb24oaW1wKXtcblx0XHRcdFxuXHRcdFx0XHQvLyDQn9C+0LvRg9GH0LDQtdC8INC00L7Qv9C+0LvQvdC40YLQtdC70YzQvdGL0LUg0LjQvdGC0LXQs9GA0LDQu9GLIC0g0YHRg9C80LzQuNGA0YPQtdC8IFxuXHRcdFx0XHRyb3RzLmFkZChpbXAuaS5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKCB1bSppbXAudCApKS8vINCY0L3RgtC10LPRgNC40YDRg9C10Lwg0LjQt9C80LXQvdC10L3QuNGPINGD0LPQu9C+0LIg0L/QviDQuNC80L/Rg9C70YzRgdCw0Lxcblx0XHRcdFx0bWVzaC5hbmd1bGFyX2ltcHVsc2UuYWRkKGltcC5pKVxuXHRcdFx0fSlcblx0XHRcblx0XHRcdF8uZWFjaChQSSwgZnVuY3Rpb24oaW1wKXtcblx0XHRcdFx0dmFyIHYgPSBpbXAuaS5jbG9uZSgpO1xuXHRcdFx0XHR2LmFwcGx5UXVhdGVybmlvbihtZXNoLnF1YXRlcm5pb24pO1xuXHRcdFx0XHRwb3Nlcy5hZGQoIHYuY2xvbmUoKS5tdWx0aXBseVNjYWxhcih1bSppbXAudCkgKSAvLyDQmNC90YLQtdCz0YDQuNGA0YPQtdC8INC40LfQvNC10L3QtdC90LjRjyDQutC+0L7RgNC00LjQvdCw0YIg0L/QviDQuNC80L/Rg9C70YzRgdCw0Lxcblx0XHRcdFx0bWVzaC5pbXB1bHNlLmFkZCh2KVxuXHRcdFx0fSlcblx0XHRcdFxuXHRcdH1cblx0XHRcblx0XHQvL21lc2gudG90YWxfcG93ZXJzID0gWyBtZXNoLnRvdGFsX3Bvd2Vyc1ttZXNoLnRvdGFsX3Bvd2Vycy5sZW5ndGhdIF1cblx0XHRcblx0XHQvL2NvbnNvbGUubG9nKG1lc2gpO1xuXHRcdC8vaWYoUEkubGVuZ3RoID4wKXtcblx0XHQvL1x0dnNkZnNhZGYuc2Rmc2RmLnNkZnNkZnNkZiA9IDFcblx0XHQvL31cblx0XHQvLyBjb25zb2xlLmxvZyhcIkZcIiwgUEkpO1xuXHRcdC8vdmFyIHJvdHMgPSBuZXcgc2VsZi5USFJFRS5WZWN0b3IzKDAsMCwwKVxuXHRcdC8vdmFyIHBvc2VzID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMygwLDAsMClcblx0XHQvL2NvbnNvbGUubG9nKFwiUElcIiwgUEksIG1lc2gudG90YWxfcG93ZXJzKTtcblx0XHQvLyBjb25zb2xlLmxvZyhcIklNUFwiLCBtZXNoLmltcHVsc2UsIHBvc2VzLCBtZXNoLnBvcyApXG5cdFx0Ly8gbWVzaC5hdmVsID0gbWVzaC5hbmd1bGFyX2ltcHVsc2UuY2xvbmUoKS5tdWx0aXBseVNjYWxhcih1bSk7XG5cdFx0bWVzaC52ZWwgPSBtZXNoLmltcHVsc2UuY2xvbmUoKS5tdWx0aXBseVNjYWxhcih1bSk7XG5cdFx0XG5cdFx0Ly9tZXNoLnJvdC5hZGQocm90cylcblx0XHRtZXNoLnJvdGF0ZVgocm90cy54KVxuXHRcdG1lc2gucm90YXRlWShyb3RzLnkpXG5cdFx0bWVzaC5yb3RhdGVaKHJvdHMueik7XG5cdFx0XG5cdFx0Ly9jb25zb2xlLmxvZyhtZXNoLmd1aWQsIFwiUE9TRVMgdG8gQUREXCIsIHBvc2VzKVxuXHRcdC8vIG1lc2gucG9zLmFkZChwb3Nlcyk7XG5cdFx0bWVzaC5wb3NpdGlvbi5hZGQocG9zZXMpO1xuXHRcdFxuXHRcdFxuXHRcdC8vIHZhciBtZXNoID0gc2VsZi5tZXNoZXNbaV07XG5cdFx0Lypcblx0XHRpZihtZXNoLmhhc19lbmdpbmVzKXtcblx0XHRcdHRvdGFsX2FjYyA9IG5ldyBzZWxmLlRIUkVFLlZlY3RvcjMoMCwwLDApO1xuXHRcdFx0XG5cdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IG1lc2gub25fZW5naW5lc19wcm9wdWxzaW9uLmxlbmd0aDsgaisrKXtcblx0XHRcdFxuXHRcdFx0XHR2YXIgZW5naW5lID0gbWVzaC5vbl9lbmdpbmVzX3Byb3B1bHNpb25bal1cblx0XHRcdFx0dmFyIGF4aXMgPSBlbmdpbmVbMF0gPT0gJ3gnP25ldyBzZWxmLlRIUkVFLlZlY3RvcjMoMSwwLDApOihlbmdpbmVbMF0gPT0neSc/bmV3IHNlbGYuVEhSRUUuVmVjdG9yMygwLCAxLCAwKTogbmV3IHNlbGYuVEhSRUUuVmVjdG9yMygwLDAsMSkpXG5cdFx0XHRcdHZhciBkaXIgID0gZW5naW5lWzFdID09ICcrJz8xOi0xXG5cdFx0XHRcdHZhciBhY2MgPSBtZXNoLmVuZ2luZXMucHJvcHVsc2lvbltlbmdpbmVdIC8gbWVzaC5tYXNzXG5cdFx0XHRcdGF4aXMubXVsdGlwbHlTY2FsYXIoYWNjKS5tdWx0aXBseVNjYWxhcihkaXIpLmFwcGx5UXVhdGVybmlvbihtZXNoLnF1YXRlcm5pb24pO1xuXHRcdFx0XHR0b3RhbF9hY2MuYWRkKGF4aXMpXG5cdFx0XHR9XG5cdFx0XHRpZihtZXNoLnZlbCA9PT0gdW5kZWZpbmVkKW1lc2gudmVsID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMygwLDAsMClcblx0XHRcdG1lc2gudmVsID0gdG90YWxfYWNjLmNsb25lKCkubXVsdGlwbHlTY2FsYXIodGltZV9sZWZ0KS5hZGQobWVzaC52ZWwpIFxuXHRcdFx0bWVzaC5wb3MgPSB0b3RhbF9hY2MuY2xvbmUoKS5tdWx0aXBseVNjYWxhcih0aW1lX2xlZnQgKiB0aW1lX2xlZnQpXG5cdFx0XHRcdFx0ICAgICAgIC5hZGQobWVzaC52ZWwuY2xvbmUoKS5tdWx0aXBseVNjYWxhcih0aW1lX2xlZnQpKVxuXHRcdFx0XHRcdFx0ICAgLmFkZChtZXNoLnBvcyk7XG5cdFx0XHRcdCAgIFxuXHRcdFx0dmFyIHRvdGFsX2FhY2MgPSBuZXcgc2VsZi5USFJFRS5WZWN0b3IzKDAsMCwwKVxuXHRcdFx0Ly8gY29uc29sZS5sb2cobWVzaC5vbl9lbmdpbmVzX3JvdGF0aW9uKTtcblx0XHRcdGZvcih2YXIgaiA9MDsgaiA8IG1lc2gub25fZW5naW5lc19yb3RhdGlvbi5sZW5ndGg7IGorKyl7XG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKFwiV1RGXCIpO1xuXHRcdFx0XHR2YXIgZW5naW5lID0gbWVzaC5vbl9lbmdpbmVzX3JvdGF0aW9uW2pdXG5cdFx0XHRcdHZhciBheGlzID0gZW5naW5lWzBdID09ICd4Jz9uZXcgc2VsZi5USFJFRS5WZWN0b3IzKDEsMCwwKTooZW5naW5lWzBdID09J3knP25ldyBzZWxmLlRIUkVFLlZlY3RvcjMoMCwgMSwgMCk6IG5ldyBzZWxmLlRIUkVFLlZlY3RvcjMoMCwwLDEpKVxuXHRcdFx0XHR2YXIgZGlyICA9IGVuZ2luZVsxXSA9PSAnKyc/MTotMVxuXHRcdFx0XHR2YXIgYWFjYyA9IG1lc2guZW5naW5lcy5yb3RhdGlvbltlbmdpbmVdIC8gbWVzaC5tYXNzXG5cdFx0XHRcdGF4aXMubXVsdGlwbHlTY2FsYXIoYWFjYykubXVsdGlwbHlTY2FsYXIoZGlyKVxuXHRcdFx0XHR0b3RhbF9hYWNjLmFkZChheGlzKVxuXHRcdFx0fVxuXHRcdFx0aWYobWVzaC5hdmVsID09PSB1bmRlZmluZWQpIG1lc2guYXZlbCA9IG5ldyBzZWxmLlRIUkVFLlZlY3RvcjMoMCwwLDApXG5cdFx0XHQvLyBjb25zb2xlLmxvZyhtZXNoLmF2ZWwpXG5cdFx0XHRtZXNoLmF2ZWwgPSB0b3RhbF9hYWNjLmNsb25lKCkubXVsdGlwbHlTY2FsYXIodGltZV9sZWZ0KS5hZGQobWVzaC5hdmVsKVxuXHRcdFx0bWVzaC5yb3QgID0gdG90YWxfYWFjYy5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKHRpbWVfbGVmdCAqIHRpbWVfbGVmdClcblx0XHRcdFx0XHQgICAgICAgLmFkZChtZXNoLmF2ZWwuY2xvbmUoKS5tdWx0aXBseVNjYWxhcih0aW1lX2xlZnQpKVxuXHRcdFx0bWVzaC5yb3RhdGVYKG1lc2gucm90LngpXG5cdFx0XHRtZXNoLnJvdGF0ZVkobWVzaC5yb3QueSlcblx0XHRcdG1lc2gucm90YXRlWihtZXNoLnJvdC56KTtcblx0XHRcblx0XHR9ZWxzZXtcblx0XHRcdC8vIGNvbnNvbGUubG9nKG1lc2gucG9zKTtcblx0XHRcdGlmIChtZXNoLnZlbCl7XG5cdFx0XHRcdG1lc2gucG9zID1tZXNoLnZlbC5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKHRpbWVfbGVmdCkuYWRkKG1lc2gucG9zKTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0XG5cdFx0fVxuXHRcdCovIFxuXHRcdHZhciBfdGhpc19jYWNoZT17fVxuXHRcdF8uZWFjaChbJ3Bvc2l0aW9uJywgJ3JvdGF0aW9uJywgJ2ltcHVsc2UnLCAnYW5ndWxhcl9pbXB1bHNlJ10sIGZ1bmN0aW9uKHYpe1xuXHRcdFx0dmFyIHZlYyA9IG1lc2hbdl07XG5cdFx0XHRpZiggdmVjICkgX3RoaXNfY2FjaGVbdl0gPSB2ZWMudG9BcnJheSgpO1xuXHRcdH0pXG5cdFx0c2VsZi5fc2NlbmVfb2JqZWN0X2NhY2hlW2ldID0gX3RoaXNfY2FjaGU7XG5cdFx0XG5cdH0pXG5cdHNlbGYubGFzdF90cyA9IG5vd1xuXHRcbn1cblNjZW5lT2JqZWN0LnByb3RvdHlwZSA9IFNjZW5lXG5tb2R1bGUuZXhwb3J0cyA9IFNjZW5lT2JqZWN0IiwidmFyIFNjZW5lID0gcmVxdWlyZSgnLi9zY2VuZS5qcycpXG52YXIgdSA9IHJlcXVpcmUoJy4vdXRpbHMuanMnKVxudmFyIF8gICAgID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG5cbnZhciBnZXRNaXNzaW9uVHlwZSA9ZnVuY3Rpb24gKHR5cGUpe1xuXHRyZXR1cm4gY3JlYXRlX21pc3Npb25fanNvbigpXG59XG5cbnZhciBjcmVhdGVfbWlzc2lvbl9qc29uID0gZnVuY3Rpb24oICApe1xuXHR2YXIgcDEgPSBbLTExMCwgMTAwLCA0MF07XG5cdHZhciBwMiA9IFs1MDAsIDIwMCwgLTUwXTtcblx0dmFyIGMgPSAwLjJcblx0dmFyIHAxID0gXy5tYXAocDEsZnVuY3Rpb24odil7cmV0dXJuIHYqY30pO1xuXHR2YXIgcDIgPSBfLm1hcChwMixmdW5jdGlvbih2KXtyZXR1cm4gdipjfSk7O1xuXHRcblx0dmFyIGRlZl9zaGlwMSA9IHt0eXBlOidzaGlwJyxcblx0XHRcdFx0XHQgXCJzaGlwX3R5cGVcIjpcIkRlZmF1bHRcIixcblx0XHRcdFx0XHRcdCBtb2RlbF8zZDonL21vZGVscy9lY28uanMnLFxuXHRcdFx0XHRcdFx0IHBoeXNpY2FsOntcblx0XHRcdFx0XHRcdFx0IHBvczpwMSxcblx0XHRcdFx0XHRcdFx0IHJvdDp7dG86IHAyfSxcblx0XHRcdFx0XHRcdCB9LFxuXHRcdFx0XHRcdCBcblx0XHRcdFx0XHRcdCBcImNhbWVyYXNcIjp7XG5cdFx0XHRcdFx0XHRcdFx0XCJmcm9udFwiOntcblx0XHRcdFx0XHRcdFx0XHRcdFwibGFiZWxcIjpcIm1haW5cIixcblx0XHRcdFx0XHRcdFx0XHRcdFwicG9zaXRpb25cIjogWzAsMC41LDBdLFxuXHRcdFx0XHRcdFx0XHRcdFx0XCJkaXJlY3Rpb25cIjpbMCwwLC0xXVxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcImJhY2tcIjp7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFwibGFiZWxcIjpcIm1haW5cIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XCJwb3NpdGlvblwiOiBbMCwwLjUsMl0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFwiZGlyZWN0aW9uXCI6WzAsMCwxXVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XCJ0dXJyZXRzXCI6e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcImZyb250XCI6e1widHlwZVwiOlwiYmFsbGlzdGljXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQgXCJwb3NpdGlvblwiOiBbMCwwLjUsMF19LFxuXHRcdCBcdFx0XHRcdFx0XHRcdFx0XCJiYWNrXCI6e1widHlwZVwiOlwiYmFsbGlzdGljXCIsXG5cdFx0IFx0XHRcdFx0XHRcdFx0XHRcdFx0IFwicG9zaXRpb25cIjogWzAsMCwyXX1cblxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFwid29ya3BvaW50c1wiOntcblx0XHRcdFx0XHRcdFx0XHRcdFx0XCJQaWxvdGluZ1wiOntcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwidmlld3NcIjogW1wiZnJvbnRcIixcImJhY2tcIl0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcInR5cGVcIjpcInBpbG90XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcIkZyb250IHR1cnJldFwiOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJ2aWV3c1wiOltcImZyb250XCJdLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJ0eXBlXCI6XCJ0dXJyZXRcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwidHVycmV0XCI6XCJmcm9udFwiXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFwiQmFjayB0dXJyZXRcIjp7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcInZpZXdzXCI6W1wiYmFja1wiXSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwidHlwZVwiOlwidHVycmV0XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcInR1cnJldFwiOlwiYmFja1wiXG5cdFx0XHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHQnZW5naW5lcyc6e1xuXHRcdFx0XHRcdFx0XHQncm90YXRpb24nOntcblx0XHRcdFx0XHRcdFx0XHQneCsnOjEwMDAsJ3gtJzoxMDAwLFxuXHRcdFx0XHRcdFx0XHRcdCd5Kyc6MTAwMCwneS0nOjEwMDAsXG5cdFx0XHRcdFx0XHRcdFx0J3orJzoxMDAwLCd6LSc6MTAwMFxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHQncHJvcHVsc2lvbic6e1xuXHRcdFx0XHRcdFx0XHRcdCd4Kyc6MSwneC0nOjEsXG5cdFx0XHRcdFx0XHRcdFx0J3krJzoxLCd5LSc6MSxcblx0XHRcdFx0XHRcdFx0XHQneisnOjUwMDAsJ3otJzo1MDAwXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHQnbWFzcyc6IDEwMDAwLFxuXHRcdFx0XHRcdFx0J0dVSUQnOnUubWFrZV9ndWlkKClcblx0XHRcdFx0XHR9XG5cdHZhciBkZWZfc2hpcDIgPSB7dHlwZTonc2hpcCcsXG4gXHRcdFx0XHRcdCBcInNoaXBfdHlwZVwiOlwiRGVmYXVsdFwiLFxuXHRcblx0XHRcdFx0XHRcdCBtb2RlbF8zZDonL21vZGVscy9lY28uanMnLFxuXHRcdFx0XHRcdFx0IHBoeXNpY2FsOntcblx0XHRcdFx0XHRcdFx0IHBvczpwMixcblx0XHRcdFx0XHRcdFx0IHJvdDp7dG86IHAxfSxcblx0XHRcdFx0XHRcdCBcblx0XHRcdFx0XHRcdCB9LFxuXHRcdFx0IFx0XHRcdFwiY2FtZXJhc1wiOntcblx0XHRcdCBcdFx0XHRcdFx0XCJmcm9udFwiOntcblx0XHRcdCBcdFx0XHRcdFx0XHRcImxhYmVsXCI6XCJtYWluXCIsXG5cdFx0XHQgXHRcdFx0XHRcdFx0XCJwb3NpdGlvblwiOiBbMCwwLjUsMF0sXG5cdFx0XHQgXHRcdFx0XHRcdFx0XCJkaXJlY3Rpb25cIjpbMCwwLC0xXVxuXHRcdFx0IFx0XHRcdFx0XHRcdH0sXG5cdFx0XHQgXHRcdFx0XHRcdFwiYmFja1wiOntcblx0XHRcdCBcdFx0XHRcdFx0XHRcdFwibGFiZWxcIjpcIm1haW5cIixcblx0XHRcdCBcdFx0XHRcdFx0XHRcdFwicG9zaXRpb25cIjogWzAsMC41LDJdLFxuXHRcdFx0IFx0XHRcdFx0XHRcdFx0XCJkaXJlY3Rpb25cIjpbMCwwLDFdXG5cdFx0XHQgXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XCJ0dXJyZXRzXCI6e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcImZyb250XCI6e1widHlwZVwiOlwiYmFsbGlzdGljXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQgXCJwb3NpdGlvblwiOiBbMCwwLjUsMF19LFxuXHRcdCBcdFx0XHRcdFx0XHRcdFx0XCJiYWNrXCI6e1widHlwZVwiOlwiYmFsbGlzdGljXCIsXG5cdFx0IFx0XHRcdFx0XHRcdFx0XHRcdFx0IFwicG9zaXRpb25cIjogWzAsMCwyXX1cblxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFwid29ya3BvaW50c1wiOntcblx0XHRcdFx0XHRcdFx0XHRcdFx0XCJQaWxvdGluZ1wiOntcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwidmlld3NcIjogW1wiZnJvbnRcIixcImJhY2tcIl0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcInR5cGVcIjpcInBpbG90XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcIkZyb250IHR1cnJldFwiOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJ2aWV3c1wiOltcImZyb250XCJdLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJ0eXBlXCI6XCJ0dXJyZXRcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwidHVycmV0XCI6XCJmcm9udFwiXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFwiQmFjayB0dXJyZXRcIjp7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcInZpZXdzXCI6W1wiYmFja1wiXSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwidHlwZVwiOlwidHVycmV0XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcInR1cnJldFwiOlwiYmFja1wiXG5cdFx0XHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHQgXHRcdFx0J2VuZ2luZXMnOntcblx0XHRcdCBcdFx0XHRcdCdyb3RhdGlvbic6e1xuXHRcdFx0IFx0XHRcdFx0XHQneCsnOjEwMDAsJ3gtJzoxMDAwLFxuXHRcdFx0IFx0XHRcdFx0XHQneSsnOjEwMDAsJ3ktJzoxMDAwLFxuXHRcdFx0IFx0XHRcdFx0XHQneisnOjEwMDAsJ3otJzoxMDAwXG5cdFx0XHQgXHRcdFx0XHR9LFxuXHRcdFx0IFx0XHRcdFx0J3Byb3B1bHNpb24nOntcblx0XHRcdCBcdFx0XHRcdFx0J3grJzoxLCd4LSc6MSxcblx0XHRcdCBcdFx0XHRcdFx0J3krJzoxLCd5LSc6MSxcblx0XHRcdCBcdFx0XHRcdFx0J3orJzo1MDAwLCd6LSc6NTAwMFxuXHRcdFx0IFx0XHRcdFx0fVxuXHRcdFx0IFx0XHRcdH0sXG5cdFx0XHQgXHRcdFx0J21hc3MnOiAxMDAwMCxcblx0XHRcdFx0XHRcdCdHVUlEJzp1Lm1ha2VfZ3VpZCgpXG5cdFx0XHRcdFx0fVxuXHQvLyDQltC10YHRgtC60L4g0LfQsNC00LDQvdC90YvQtSDQutC+0YDQsNCx0LvQuNC60LggLSDQsdC10Lcg0L/QvtC30LjRhtC40Lkg0Lgg0YHQutC+0YDQvtGB0YLQtdC5XHRcblx0dmFyIHBpdm90PSBcdGZ1bmN0aW9uKHgseSx6KXtcblx0XHRyZXR1cm4ge3R5cGU6J3N0YXRpYycsXG5cdFx0XG5cdFx0XHRcdFx0XHQgbW9kZWxfM2Q6Jy9tb2RlbHMvc3AuanMnLFxuXHRcdFx0XHRcdFx0IHBoeXNpY2FsOntcblx0XHRcdFx0XHRcdFx0IHBvczpbeCwgeSwgel1cblx0XHRcdFx0XHRcdFx0IC8vcm90Ont0bzogWy0xMTAsIDEwMCwgNDBdfSxcblx0XHRcdFx0XHRcdCBcblx0XHRcdFx0XHRcdCB9LFxuXHRcdFx0IFx0XHRcdCdtYXNzJzogMTAwMDAwMCxcblx0XHRcdFx0XHRcdCdHVUlEJzp1Lm1ha2VfZ3VpZCgpXG5cdFx0XHRcdFx0fVxuXHR9XG5cdHRoaXMuX2RoMiA9IGRlZl9zaGlwMjsgLy8g0KHQvtGF0YDQsNC90Y/QtdC8INC60L7RgNCw0LHQu9C40LogLSDQv9C+0YLQvtC80YMg0YfRgtC+INC/0L7QutCwINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjCDQvdC1INCy0YvQsdC40YDQsNC10YIg0LrQvtGA0LDQsdC70YwgLSDQvtC9INC10LzRgyDQvdCw0LfQvdCw0YfQsNC10YLRgdGPXHRcdFxuXHR2YXIgc28gPSB7fVxuXHRfLmVhY2goW2RlZl9zaGlwMSxkZWZfc2hpcDJdLCBmdW5jdGlvbihzKXtcblx0XHRzb1tzLkdVSURdID0gc1xuXHR9KVxuXHQvLyDQl9C00LXRgdGMINC80Ysg0L/RgNC+0YHRgtC+INC90LDQv9C+0LvQvdGP0LXQvCDRgdGG0LXQvdGLINGI0LDRgNC40LrQsNC80LggLSDQv9C+INGD0LzRgywg0Y3RgtC4INGI0LDRgNC40LrQuCDQvdCw0LTQviDRgdC+0LfQtNCw0LLQsNGC0Ywg0L3QtSDQt9C00LXRgdGMIC0g0LAg0LjQvdC20LXQutGC0LjRgtGMINC40Lcg0LzQuNGA0LBcblx0Lypcblx0dmFyIGluYyA9IDBcblx0dmFyIHN0ZXAgPSAyMDA7XG5cdGZvciAodmFyIHg9LTIwMDsgeDw9IDIwMDsgeCs9c3RlcCl7XG5cdFx0Zm9yICh2YXIgeT0tMjAwOyB5PD0gMjAwOyB5Kz1zdGVwKXtcblx0XHRcdGZvciAodmFyIHo9LTIwMDsgejw9IDIwMDsgeis9c3RlcCl7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coaW5jLFwieCx5LHpcIix4LHkseilcblx0XHRcdFx0aW5jICs9MTtcblx0XHRcdFx0dmFyIHAgPXBpdm90KHgseSx6KVxuXHRcdFx0XHRzb1twLkdVSURdID0gcFxuXHRcdFx0fVxuXHRcdH1cblx0fSovXG5cdC8vIC0tLSDQndCw0L/QvtC70L3QtdC90LjQtSDRgdGG0LXQvdGLXG5cdHZhciBtaXNzaW9uID0ge1xuXHRcdGFjdG9ycyA6IHt9LFxuXHRcdGNvbW1hbmRzOlsncmVkJywgJ2JsdWUnXSxcblx0XHRfY29tbWFuZHNfYW1vdW50OlsxLDBdLFxuXHRcdG1heF9wZXJfY29tbWFuZDoxLFxuXHRcdG1pbl9wZXJfY29tbWFuZDoxLFxuXHRcdGNvb3JkcyA6IFsxMDAsIDUwMCwgMzAwXSwgLy8gR2xvYmFsIGNvb3JkcyBvZiBtaXNzaW9uIG9yaWdpblxuXHRcdHNoYXJlZF9vYmplY3RzOiBzbyxcblx0XHRvYmplY3RzX2Zvcl9jb21tYW5kOntcInJlZFwiOltkZWZfc2hpcDEuR1VJRF0sXCJibHVlXCI6W2RlZl9zaGlwMi5HVUlEXX1cblx0XHRcblx0fVxuXHRyZXR1cm4gbWlzc2lvblxufVxudmFyIE1pc3Npb24gPSBmdW5jdGlvbih0eXBlKXtcblx0dGhpcy5kZXNjciA9IFwiTWlzc2lvblwiXG5cdHRoaXMubWlzc2lvbiA9IGdldE1pc3Npb25UeXBlKHR5cGUpO1xuXHQvL2NvbnNvbGUubG9nKHRoaXMubWlzc2lvbik7XG5cdFxufVxuXG5NaXNzaW9uLnByb3RvdHlwZSA9IHtcblx0Y29uc3RydWN0b3I6IE1pc3Npb24sXG5cdFxuXG5cblx0Y3JlYXRlIDpmdW5jdGlvbihjcmVhdG9yX2lkLCBjYWxsYmFjayl7XG5cdFxuXHRcdC8vIE5vIHBhcmFtcyAtIG9ubHkgb25lIG1pc3Npb24gYXZhaWxhYmxlXG5cdFx0dmFyIHNlbGYgPSB0aGlzIDtcblx0XHR0aGlzLkdVSUQgPSB1Lm1ha2VfZ3VpZCgpO1xuXHRcdHRoaXMuY3JlYXRvciA9IGNyZWF0b3JfaWQ7XG5cdFx0dGhpcy5yZWFkeV90b19zdGFydCA9IGZhbHNlXG5cdFx0dGhpcy5pc19zdGFydGVkID0gZmFsc2Vcblx0XHR0aGlzLl91c2VycyA9IHt9O1xuXHRcdHRoaXMuX3Bvc2l0aW9uX2JpbmRzID0ge307XG5cdFx0dGhpcy5fdG90YWxfYWN0b3JzID0gMDtcblx0XHR0aGlzLl90b3RhbF9sb2dpbnMgPSAwO1xuXHRcdFxuXG5cdFxuXG5cdFx0c2VsZi5fbWlzc2lvbl9sb2dpbnMgPSBbXTtcblx0XHRzZWxmLl9taXNzaW9uX29iamVjdHMgPSB7fVxuXHRcdFxuXHRcdHNlbGYuX21pc3Npb25fcmVhZHkgPSBmdW5jdGlvbigpe1xuXHRcdFx0Y2FsbGJhY2soc2VsZik7XG5cdFx0XG5cdFx0XG5cdFx0fVxuXHRcdC8vIHNlbGYucHJlcGFyZV9zY2VuZSgpO1xuXHRcdHNlbGYuX21pc3Npb25fcmVhZHkoKTtcblx0XHRyZXR1cm4gdGhpc1xuXHR9LFxuXHRnZXRTY2VuZTogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5fc2NlbmU7XG5cdH0sXG5cdHByZXBhcmVfc2NlbmUgOiBmdW5jdGlvbigpe1xuXHRcblx0XHQvLyBjb25zb2xlLmxvZyhTY2VuZSk7XG5cdFx0aWYoISB0aGlzLl9zY2VuZV9sb2FkZWQpe1xuXHRcdFx0Ly8gY29uc29sZS5sb2coXCJETyBQUkVQIFNDRU5FXCIpXG5cdFx0XHR0aGlzLl9zY2VuZSA9IG5ldyBTY2VuZSh0aGlzLm1pc3Npb24uY29vcmRzWzBdLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLm1pc3Npb24uY29vcmRzWzFdLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLm1pc3Npb24uY29vcmRzWzJdICk7XG5cdFx0XHQvL2NyZWF0ZV9mcm9tX3dvcmxkKHRoaXMubWlzc2lvbi5jb29yZHNbMF0sXG5cdFx0XHQvL1x0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5taXNzaW9uLmNvb3Jkc1sxXSxcblx0XHRcdC8vXHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLm1pc3Npb24uY29vcmRzWzJdICk7XG5cdFx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0XHRfLmVhY2godGhpcy5taXNzaW9uLnNoYXJlZF9vYmplY3RzLCBmdW5jdGlvbihvYmope1xuXHRcdFx0XHRzZWxmLl9zY2VuZS5qb2luX29iamVjdChvYmopXG5cdFxuXHRcdFx0fSlcdFx0XG5cdFx0XHR2YXIgYWN0b3JzID0gdGhpcy5wcmVwYXJlX2FjdG9ycygpXHRcdFx0XHRcdFx0XHRcdFxuXHRcdFx0Xy5lYWNoKGFjdG9ycywgZnVuY3Rpb24oYXMpeyAvLyDQnNC40YHRgdC40Y8g0LTQviDRjdGC0L7Qs9C+INCy0YDQtdC80LXQvdC4INC90LUg0LjQvNC10LvQsCDRgdGG0LXQvdGLIC0g0L3QsNC00L4g0LTQsNGC0Ywg0LXRkSDQutCw0LbQtNC+0LzRgyDQsNC60YLQvtGA0YMg0LfQtNC10YHRjFxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGEpXG5cdFx0XHRcdGFzLnNjZW5lID0gc2VsZi5fc2NlbmUuR1VJRFxuXHRcdFx0XHRzZWxmLl9zY2VuZS5qb2luX2FjdG9yKGFzKTtcblx0XHRcdH0pXG5cdFx0XHR0aGlzLl9zY2VuZV9sb2FkZWQ9IHRydWU7XG5cdFx0XHQvLyBjb25zb2xlLmxvZyhcIlByZXBkXCIpXG5cdFx0fVxuXHRcdFxuXHRcdFx0XHRcdFx0XHRcblx0fSxcblx0cHJlcGFyZV9hY3RvcnM6IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHZhciBhY3RvcnMgPSBbXVxuXHRcdF8uZWFjaCh0aGlzLl91c2VycywgZnVuY3Rpb24ocG9zaXRpb25zX29mX3VzZXIsIHVzZXJfaWQpe1xuXHRcdFx0Xy5lYWNoKHBvc2l0aW9uc19vZl91c2VyLCBmdW5jdGlvbihwb3NpdGlvbiwgcG9zX2lkKXtcblx0XHRcdFx0YWN0b3JzLnB1c2goc2VsZi5fbWFrZV9hY3Rvcihwb3NfaWQsIHVzZXJfaWQpKTtcblx0XHRcdFx0XG5cdFx0XHR9KVxuXHRcdH0pXG5cdFx0cmV0dXJuIGFjdG9ycztcblx0fSxcblx0X21ha2VfYWN0b3I6IGZ1bmN0aW9uKHBvc19pZCwgdXNlcl9pZCl7XG5cdFx0dmFyIHBvcyA9IHRoaXMuX3Bvc2l0aW9uc1twb3NfaWRdXG5cdFx0dmFyIG5ld19hY3Rvcl9ndWlkID0gdS5tYWtlX2d1aWQoKVxuXHRcdHZhciBjb250cm9sbGFibGUgPSB7b2JqZWN0X2d1aWQ6cG9zLm9iamVjdF9ndWlkLCB3b3JrcG9pbnQ6cG9zLndvcmtwb2ludH0gLy8gdmlld3BvcnQ6J2Zyb250JywgY29udHJvbHM6WydQaWxvdCcsICdUdXJyZXQnXX0gXG5cdFx0XG5cdFx0cmV0dXJuIHtjb21tYW5kOnBvcy5jb21tYW5kLCB1c2VyX2lkOiB1c2VyX2lkLCBjb250cm9sOiBjb250cm9sbGFibGUsIEdVSUQ6ICBuZXdfYWN0b3JfZ3VpZH1cblx0XHRcblx0fSxcblx0XG5cdGpvaW5fcGxheWVyIDpmdW5jdGlvbih1c2VyX2lkLCBwb3NpdGlvbl9pZCApey8vIGxvZ2luLCBjb21tYW5kLCBvYmplY3RfZ3VpZCwgcGxhY2Upe1xuXHRcdGlmICh0aGlzLl9wb3NpdGlvbnNbcG9zaXRpb25faWRdLmJ1c3kpe3JldHVybjt9O1xuXHRcdFxuXHRcdGlmKHRoaXMuX3VzZXJzW3VzZXJfaWRdID09PSB1bmRlZmluZWQpeyAvLyDQntC00LjQvSDQv9C+0LvRjNC30L7QstCw0YLQtdC70Ywg0LzQvtC20LXRgiDQuNC80LXRgtGMINC90LXRgdC60L7Qu9GM0LrQviDQv9C+0LfQuNGG0LjQuVxuXHRcdFx0dGhpcy5fdXNlcnNbdXNlcl9pZF0gPSBbcG9zaXRpb25faWRdO1xuXHRcdFx0XG5cdFx0fWVsc2V7XG5cdFx0XHR0aGlzLl91c2Vyc1t1c2VyX2lkXS5wdXNoKHBvc2l0aW9uX2lkKTtcblx0XHRcdFxuXHRcdH1cblx0XHR0aGlzLl9wb3NpdGlvbl9iaW5kc1twb3NpdGlvbl9pZF0gPSB1c2VyX2lkIC8vINCf0L7Qt9C40YbQuNC10Lkg0LzQvtC20LXRgiDRg9C/0YDQsNCy0LvRj9GC0YwgLSDQvdCwINC90LXQuSDRgdC40LTQtdGC0YwgLSDRgtC+0LvRjNC60L4g0L7QtNC40L0g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GMXG5cdFx0dGhpcy5fcG9zaXRpb25zW3Bvc2l0aW9uX2lkXS5idXN5ID0gdHJ1ZTtcblx0XHR0aGlzLl9wb3NpdGlvbnNbcG9zaXRpb25faWRdLnVzZXJfaWQgPSB1c2VyX2lkO1xuXHRcdFxuXHRcdGlmKHRoaXMuaXNfc3RhcnRlZCl7XG5cdFx0XHR2YXIgYWN0b3IgPSB0aGlzLl9tYWtlX2FjdG9yKHBvc2l0aW9uX2lkLCB1c2VyX2lkKTtcblx0XHRcdGFjdG9yLnNjZW5lID0gdGhpcy5fc2NlbmUuR1VJRDtcblx0XHRcdHRoaXMuX3NjZW5lLmpvaW5fYWN0b3IoYWN0b3IpXG5cdFx0fVxuXHRcdFxuXHRcdC8qXG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHZhciBNID0gc2VsZi5taXNzaW9uO1xuXHRcdHZhciBjb21tYW5kO1xuXHRcdC8vIEdldCBmaXJzdCBhdmFpbGFibGUgY29tbWFuZFxuXHRcdC8vIGNvbnNvbGUubG9nKFwiTE9HSU5cIiwgbG9naW4pXG5cdFx0aWYgKHNlbGYuX21pc3Npb25fb2JqZWN0c1tvYmplY3RfZ3VpZF0gPT09IHVuZGVmaW5lZCl7XG5cdFx0XHRzZWxmLl9taXNzaW9uX29iamVjdHNbb2JqZWN0X2d1aWRdID0ge31cblx0XHR9XG5cdFx0Ly9fLmVhY2gocGxhY2VzLCBmdW5jdGlvbihwKXsgLy8g0K3RgtC+0YIg0LrRjdGIINC40YHQv9C+0LvRjNC30YPQtdGC0YHRjyDQv9GA0Lgg0LfQsNC/0L7Qu9C90LXQvdC40Lgg0LzQtdGB0YIg0L3QsCDQutC+0YDQsNCx0LvQuFxuXHRcdFx0c2VsZi5fbWlzc2lvbl9vYmplY3RzW29iamVjdF9ndWlkXVtwbGFjZV0gPSBsb2dpbjtcblx0XHRcdFxuXHRcdFx0Ly99KVxuXHRcdC8vIFRPRE8g0JfQtNC10YHRjCDQvdCw0LTQviDQstGB0YLQsNCy0LvRj9GC0Ywg0LjQs9GA0L7QutC+0LIgLSDQvdC10LfQsNCy0LjRgdC40LzQviDQvtGCINGC0L7Qs9C+LCDRgdC60L7Qu9GM0LrQviDQu9C+0LPQuNC90L7QslxuXHRcdC8vIFRPRE8g0J3QsNC00L4g0L/RgNC+0LLQtdGA0Y/RgtGMINC90LDQu9C40YfQuNC1INC70L7Qs9C40L3QvtCyINC4INC10YHQu9C4INC10YHRgtGMIC0g0L3QtSDRgtGD0L/QviDQtNC+0LHQsNCy0LvRj9GC0YwsINCwINC00L7QsdCw0LLQu9GP0YLRjCDQtdC80YMg0LLQvtGA0LrQv9C+0LjQvdGCXG5cdFx0Ly8g0J/QviDQt9Cw0L3Rj9GC0YvQvCDQstC+0YDQutC/0L7QuNC90YLQsNC8INGB0LjRh9GC0LDRgtGMINCz0L7RgtC+0LLQvdC+0YHRgtGMXG5cdFx0dmFyIGNvbnRyb2xsYWJsZSA9IHtvYmplY3RfZ3VpZDpvYmplY3RfZ3VpZCwgd29ya3BvaW50OnBsYWNlfSAvLyB2aWV3cG9ydDonZnJvbnQnLCBjb250cm9sczpbJ1BpbG90JywgJ1R1cnJldCddfSBcblx0XHR2YXIgbmV3X2FjdG9yX2d1aWQgPSB1Lm1ha2VfZ3VpZCgpXG5cdFx0dmFyIGFjdG9yID0ge2NvbW1hbmQ6Y29tbWFuZCwgbG9naW46bG9naW4sIGNvbnRyb2w6IGNvbnRyb2xsYWJsZSwgR1VJRDogIG5ld19hY3Rvcl9ndWlkfVxuXHRcdC8vINCU0L7QsdCw0LLQu9GP0LXQvCDQsNC60YLQvtGA0LAgLSDQuNC90LTQtdC60YHQuNGA0YPRjyDQv9C+INC70L7Qs9C40L3Rg1xuXHRcdGlmIChzZWxmLm1pc3Npb24uYWN0b3JzW25ld19hY3Rvcl9ndWlkXSA9PT0gdW5kZWZpbmVkKXtcblx0XHRcdHNlbGYubWlzc2lvbi5hY3RvcnNbbmV3X2FjdG9yX2d1aWRdID0gW2FjdG9yXVxuXHRcdH1lbHNle1xuXHRcdFx0c2VsZi5taXNzaW9uLmFjdG9yc1tuZXdfYWN0b3JfZ3VpZF0ucHVzaChhY3Rvcilcblx0XHR9XG5cdFx0XG5cdFx0c2VsZi5fdG90YWxfYWN0b3JzICs9IDFcblx0XHRpZihzZWxmLl90b3RhbF9hY3RvcnMgPj0gMil7XG5cdFx0XHRjb25zb2xlLmxvZyhcIkxPR0lOU1wiLCBzZWxmLl9taXNzaW9uX2xvZ2lucyk7XG5cdFx0XHRzZWxmLnJlYWR5X3RvX3N0YXJ0ID0gdHJ1ZTtcblx0XHR9ZWxzZXtcblx0XHRcdGNvbnNvbGUubG9nKFwiVE9UQUxfQUNUT1JTXCIsIHNlbGYuX3RvdGFsX2FjdG9ycyk7XG5cdFx0fVxuXHRcdFxuXHRcdGNvbnNvbGUubG9nKFwiVEFcIixzZWxmLl90b3RhbF9hY3RvcnMpO1xuXHRcdC8vIGNvbnNvbGUubG9nKFwiQUNUT1JTXCIsIHNlbGYubWlzc2lvbi5hY3RvcnMpO1xuXHRcdGlmIChzZWxmLl9zY2VuZSl7XG5cdFx0XHRhY3Rvci5zY2VuZSA9IHNlbGYuX3NjZW5lLkdVSURcblx0XHRcdHNlbGYuX3NjZW5lLmpvaW5fYWN0b3IoYWN0b3IpXG5cdFx0fVxuXHRcdHJldHVybiBuZXdfYWN0b3JfZ3VpZFxuXHRcdCovXG5cdH0sXG5cdHRvX2pzb246ZnVuY3Rpb24oKXtcblx0XHR2YXIgcmV0ID0ge307XG5cdFx0Xy5leHRlbmQocmV0LCB0aGlzLm1pc3Npb24pO1xuXHRcdHJldC5wb3NpdGlvbnMgPSB0aGlzLnBvc2l0aW9ucygpXG5cdFx0cmV0LkdVSUQgPSB0aGlzLkdVSUQ7XG5cdFx0cmV0dXJuIHJldDtcblx0fSxcblx0cG9zaXRpb25zOiBmdW5jdGlvbihjYil7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdC8vY29uc29sZS5sb2codGhpcyk7XG5cdFx0dmFyIHBsYWNlcyA9IFtdO1xuXHRcdGlmKHNlbGYuX3Bvc2l0aW9ucyl7XG5cdFx0XHRpZihjYiljYihzZWxmLl9wb3NpdGlvbnMpO1xuXHRcdFx0cmV0dXJuIHNlbGYuX3Bvc2l0aW9ucztcblx0XHRcdFxuXHRcdH1lbHNle1xuXHRcdFx0c2VsZi5fcG9zaXRpb25zID0gW11cblx0XHRcdHZhciBjb3VudGVyID0gMDtcblx0XHRcdF8uZWFjaChzZWxmLm1pc3Npb24uY29tbWFuZHMsIGZ1bmN0aW9uKGNvbW1hbmQpe1xuXHRcdFx0XHRfLmVhY2goc2VsZi5taXNzaW9uLm9iamVjdHNfZm9yX2NvbW1hbmRbY29tbWFuZF0sIGZ1bmN0aW9uKG9iamVjdF9ndWlkKXtcblx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhjb21tYW5kLCBzZWxmLm1pc3Npb24uc2hhcmVkX29iamVjdHMpO1xuXHRcdFx0XHRcdHZhciBvYmplY3QgPSBzZWxmLm1pc3Npb24uc2hhcmVkX29iamVjdHNbb2JqZWN0X2d1aWRdXG5cdFx0XHRcdFx0Xy5lYWNoKG9iamVjdC53b3JrcG9pbnRzLCBmdW5jdGlvbih3b3JrcG9pbnQsIHdwX2xhYmVsKXtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdHZhciBwbGFjZSA9IHsnY29tbWFuZCc6Y29tbWFuZCxcblx0XHRcdFx0XHRcdCBcdFx0XHQgJ29iamVjdF90eXBlJzogb2JqZWN0LnR5cGUsXG5cdFx0XHRcdFx0XHRcdFx0XHQgJ29iamVjdF9zdWJ0eXBlJzpvYmplY3Quc2hpcF90eXBlLFxuXHRcdFx0XHRcdFx0XHRcdFx0ICdvYmplY3RfZ3VpZCc6IG9iamVjdC5HVUlELFxuXHRcdFx0XHRcdFx0XHRcdCBcdCAnd29ya3BvaW50Jzp3cF9sYWJlbCxcblx0XHRcdFx0XHRcdFx0XHRcdCAnTUdVSUQnIDogc2VsZi5HVUlEXG5cdFx0XHRcdFx0XHRcdFx0IFxuXHRcdFx0XHRcdFx0XHRcdCB9XG5cdCBcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdFx0IFxuXHRcdFx0XHRcdFx0c2VsZi5fcG9zaXRpb25zLnB1c2gocGxhY2UpXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XG5cdFx0XHRcdFxuXHRcdFx0XHR9KVxuXHRcdFx0XG5cdFx0XHR9KVxuXHRcdFx0aWYoY2IpY2IocGxhY2VzKTtcblx0XHRcdHJldHVybiBzZWxmLl9wb3NpdGlvbnM7XG5cdFx0XHRcblx0XHR9XG5cdH1cblx0XG59XG4vL2NvbnNvbGUubG9nKE1pc3Npb24pO1xubW9kdWxlLmV4cG9ydHMgPSBNaXNzaW9uIiwidmFyIFRIUiA9IHJlcXVpcmUoJy4vdGhyZWUubm9kZS5qcycpO1xudmFyIFV0aWxzID0gcmVxdWlyZShcIi4vVXRpbHMuanNcIik7XG52YXIgXyAgICAgPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG5cblxudmFyIENvbnRyb2xsZXIgPSB7ZGVzY3JpcHRpb246J2NvbnRyb2xsZXInfVxuXHRcblx0XG5Db250cm9sbGVyLk5ldHdvcmtBY3RvciA9ICAgZnVuY3Rpb24ob25BY3QsIFcpe1xuXHRcdFxuXHRcdHZhciBtYXAgPSBDb250cm9sbGVyLkNvbnRyb2xsZXJzQWN0aW9uTWFwKClcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0XG5cdFx0dGhpcy5ydW4gPSBmdW5jdGlvbigpe1xuXHRcdFx0Ly8gbm8gbmVlZCB0byBib3RoZXIgLSBldmVudCBzdHlsZVxuXHRcdH1cblx0XHR0aGlzLmFjdD1mdW5jdGlvbihTLCBhY3Rpb24sIGlzX29uLCBhY3Rvcil7XG5cdFx0XHQvL3ZhciBDID0gVy5tZXNoZXNbIFcuYWN0b3JzW2FjdG9yXS5jb250cm9sLm9iamVjdF9ndWlkIF1cblx0XHRcdC8vIGNvbnNvbGUubG9nKGFjdGlvbilcblx0XHRcdC8vIGNvbnNvbGUubG9nKFwiU0NFTkVTXCIsc2NlbmVzLCBhY3Rvci5zY2VuZSk7XG5cdFx0XHQvLyBjb25zb2xlLmxvZyhcIm15IHRpbWVcIiwgbmV3IERhdGUoKS5nZXRUaW1lKCkvMTAwMClcblx0XHRcdC8vIGNvbnNvbGUubG9nKFwic2VydmVyIHRpbWVcIiwgYWN0aW9uLnRpbWVzdGFtcC8xMDAwIClcblx0XHRcdC8vIGNvbnNvbGUubG9nKFwibXkgdGltZSAtIHNlcnZ0aW1lXCIsIG5ldyBEYXRlKCkuZ2V0VGltZSgpLzEwMDAgLSBhY3Rpb24udGltZXN0YW1wLzEwMDAgKVxuXHRcdFx0aWYgKFcgIT09IHVuZGVmaW5lZCl7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFcsIFcuX3RpbWVfZGlmZik7XG5cdFx0XHRcdGFjdGlvbi50aW1lc3RhbXAgLT0gVy5fdGltZV9kaWZmXG5cdFx0XHR9XG5cdFx0XHQvLyBjb25zb2xlLmxvZyhcIm15IHRpbWUgLSBzZXJ2dGltZSBbZml4ZWRdXCIsIG5ldyBEYXRlKCkuZ2V0VGltZSgpLzEwMDAgLSBhY3Rpb24udGltZXN0YW1wLzEwMDAgKVxuXHRcdFx0XG5cdFx0XHQvLyBjb25zb2xlLmxvZyggIClcblx0XHRcdHZhciBfYSA9IG1hcFthY3Rpb24udHlwZV0uYWN0KFMsIGFjdGlvbiwgaXNfb24sIGFjdG9yLCBvbkFjdCk7XG5cdFx0XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuQ29udHJvbGxlci5Mb2NhbElucHV0QWN0b3IgPSBmdW5jdGlvbihXLCBzb2NrZXQpe1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHRzZWxmLldvcmxkID0gVztcblx0XHR2YXIgbWFwID0gQ29udHJvbGxlci5Db250cm9sbGVyc0FjdGlvbk1hcCgpXG5cdFx0dmFyIGFjdG9yID0gVy5sb2dpbjtcblx0XHRcblx0XHRcblx0XHQvL3NlbGYuYWN0b3JfbG9naW4gPSBhY3Rvcl9sb2dpblxuXHRcdHNlbGYuX2RlZmF1bHRfYWN0aW9ucz17XG5cdFx0XHQ2NToge3R5cGU6J3JvdGF0ZScsIGF4aXM6J3knLGRpcjonKyd9LFxuXHRcdFx0Njg6IHt0eXBlOidyb3RhdGUnLCBheGlzOid5JyxkaXI6Jy0nfSxcblx0XHRcblx0XHRcdDg3OiB7dHlwZToncm90YXRlJywgYXhpczoneCcsZGlyOictJ30sXG5cdFx0XHQ4Mzoge3R5cGU6J3JvdGF0ZScsIGF4aXM6J3gnLGRpcjonKyd9LFxuXHRcdFxuXHRcdFx0OTA6IHt0eXBlOidyb3RhdGUnLCBheGlzOid6JyxkaXI6JysnfSxcblx0XHRcdDY3OiB7dHlwZToncm90YXRlJywgYXhpczoneicsZGlyOictJ30sXG5cdFx0XG5cdFx0XHQ3OToge3R5cGU6J3JvdGF0ZWMnLCBheGlzOid4JyxkaXI6JysnfSxcblx0XHRcdDgwOiB7dHlwZToncm90YXRlYycsIGF4aXM6J3gnLGRpcjonLSd9LFxuXHRcdFxuXHRcdFx0NzM6IHt0eXBlOidyb3RhdGVjJywgYXhpczoneScsZGlyOicrJ30sXG5cdFx0XHQ3NToge3R5cGU6J3JvdGF0ZWMnLCBheGlzOid5JyxkaXI6Jy0nfSxcblx0XHRcblx0XHRcdDM4OiB7dHlwZTonbW92ZScsIGF4aXM6J3onLGRpcjonLSd9LFxuXHRcdFx0NDA6IHt0eXBlOidtb3ZlJywgYXhpczoneicsZGlyOicrJ30sXG5cdFx0XG5cdFx0XHQnbG1vdXNlJzp7J3R5cGUnOiAnc2hvb3RfcHJpbWFyeScsICdfdHVycmV0X2RpcmVjdGlvbic6IGZ1bmN0aW9uKHQsayl7XG5cdFx0XHRcdGRlbGV0ZSB0W2tdXG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKFwid1wiKVxuXHRcdFx0XHQvLyBjb25zb2xlLmxvZyhXLmNvbnRyb2xsYWJsZSgpKTtcblx0XHRcdFx0dFtrLnN1YnN0cigxKV0gPSBXLm1vdXNlX3Byb2plY3Rpb25fdmVjLmNsb25lKCkuc3ViKFcuY29udHJvbGxhYmxlKCkucG9zaXRpb24uY2xvbmUoKSApXG5cdFx0XHR9fSxcblx0XHR9XG5cdFxuXHRcdHNlbGYuYWN0aW9ucyA9IHNlbGYuX2RlZmF1bHRfYWN0aW9ucztcblx0XHRzZWxmLl9rZXljb2Rlc19pbl9hY3Rpb24gPSB7fVxuXHRcdHRoaXMuaW5wdXQgPSBmdW5jdGlvbihrZXljb2RlLCB1cF9vcl9kb3duLCBtb2RpZmllcnMpe1xuXHRcdFx0Ly8gMS4gU2VuZCB0byBzZXJ2ZXIgYWN0aW9uXG5cdFx0XHRpZihfLmhhcyhzZWxmLl9rZXljb2Rlc19pbl9hY3Rpb24sIGtleWNvZGUpKXtcblx0XHRcdFx0dmFyIHN0YXRlID0gc2VsZi5fa2V5Y29kZXNfaW5fYWN0aW9uW2tleWNvZGVdXG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKHN0YXRlLCB1cF9vcl9kb3duKVxuXHRcdFx0XHRpZihzdGF0ZSA9PT0gdXBfb3JfZG93bil7Ly8g0KHQvtGB0YLQvtGP0L3QuNC1INC90LUg0LjQt9C80LXQvdC40LvQvtGB0YwgLSDQvdC40YfQtdCz0L4g0L3QtSDQtNC10LvQsNC10Lxcblx0XHRcdFx0XHRyZXR1cm4gXG5cdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdHNlbGYuX2tleWNvZGVzX2luX2FjdGlvbltrZXljb2RlXSA9IHVwX29yX2Rvd25cblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdH1lbHNle1xuXHRcdFx0XHRzZWxmLl9rZXljb2Rlc19pbl9hY3Rpb25ba2V5Y29kZV0gPSB1cF9vcl9kb3duXG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdFxuXHRcdFx0dmFyIHRzID0gbmV3IERhdGUoKS5nZXRUaW1lKClcblx0XHRcdHZhciBhY3Rpb24gPSBfLmNsb25lKHNlbGYuYWN0aW9uc1trZXljb2RlXSk7XG5cdFx0XHRhY3Rpb24udGltZXN0YW1wID0gdHMgXG5cdFx0XHRcblx0XHRcdGNvbnNvbGUubG9nKFwibXkgZGlmZlwiLCBXLl90aW1lX2RpZmYpXG5cdFx0XHRcblx0XHRcdC8vIGNvbnNvbGUubG9nKFwibXkgdGltZVwiLCBuZXcgRGF0ZSgpLmdldFRpbWUoKS8xMDAwKVxuXHRcdFx0Ly8gY29uc29sZS5sb2coXCJzZXJ2ZXIgdGltZVwiLCBhY3Rpb24udGltZXN0YW1wLzEwMDAgKVxuXHRcdFx0Ly8gY29uc29sZS5sb2coXCJteSB0aW1lIC0gc2VydnRpbWVcIiwgbmV3IERhdGUoKS5nZXRUaW1lKCkvMTAwMCAtIGFjdGlvbi50aW1lc3RhbXAvMTAwMCApXG5cdFx0XHRcblx0XHRcdC8vIGNvbnNvbGUubG9nKGFjdGlvbik7XG5cdFx0XHRpZiAoYWN0aW9uKXtcblx0XHRcdFx0Xy5lYWNoKGFjdGlvbiwgZnVuY3Rpb24oaXRlbSwgayl7XG5cdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coJ2EnKTtcblx0XHRcdFx0XHRpZiAoa1swXSA9PSAnXycpe1xuXHRcdFx0XHRcdFx0aXRlbShhY3Rpb24saylcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC8vY29uc29sZS5sb2coYWN0aW9uKTtcblx0XHRcdFx0Ly8gRE9ORVxuXHRcdFx0XHQvLyAyLiBBY3QgaXQgbG9jYWxseVxuXHRcdFx0XHR2YXIgb25BY3QgPSBmdW5jdGlvbigpeyAvKmNvbnNvbGUubG9nKCd0aGlzIGlzIGtleWJvYXJkIGNvbnRyb2xsZXIgLSBubyBuZWVkIGluIG9uQWN0IGhlcmUnKSAqL31cblx0XHRcdFx0bG9jYWxfY29udHJvbGxlciA9IG1hcFthY3Rpb24udHlwZV1cblx0XHRcdFx0dmFyIGFjdG9ycyA9IFcuZ2V0X21haW5fdmlld3BvcnQoKS5hY3RvcnNcblx0XHRcdFx0XG5cdFx0XHRcdF8uZWFjaChhY3RvcnMsIGZ1bmN0aW9uKGFjdG9yKXtcblx0XHRcdFx0XHR2YXIgUyA9IFcuc2NlbmVzW2FjdG9yLnNjZW5lXTtcblx0XHRcdFx0XHR2YXIgb2JqID0gUy5nZXRfb2JqZWN0cygpW2FjdG9yLmNvbnRyb2wub2JqZWN0X2d1aWRdO1xuXHRcdFx0XHRcdHZhciB3cCA9IG9iai53b3JrcG9pbnRzW2FjdG9yLmNvbnRyb2wud29ya3BvaW50XTtcblx0XHRcdFx0XHRpZiAod3AudHlwZSA9PSBsb2NhbF9jb250cm9sbGVyLnR5cGUpe1xuXHRcdFx0XHRcdFx0bG9jYWxfY29udHJvbGxlci5hY3Qoc2VsZi5Xb3JsZC5zY2VuZXNbYWN0b3Iuc2NlbmVdLCBhY3Rpb24sIHVwX29yX2Rvd24sIGFjdG9yLCBvbkFjdCk7XG5cdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhhY3Rpb24pO1xuXHRcdFx0XHRcdFx0dmFyIGFfY2xvbmUgPSBfLmNsb25lKGFjdGlvbilcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0YV9jbG9uZS50aW1lc3RhbXAgKz0gVy5fdGltZV9kaWZmO1xuXHRcdFx0XHRcdFx0aWYgKHVwX29yX2Rvd24pe1xuXHRcdFx0XHRcdFx0XHRzb2NrZXQuZW1pdCgnY29udHJvbF9vbicsIHthY3Rpb246YV9jbG9uZSwgYWN0b3I6YWN0b3J9KTtcblx0XHRcdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdFx0XHRzb2NrZXQuZW1pdCgnY29udHJvbF9vZmYnLCB7YWN0aW9uOmFfY2xvbmUsIGFjdG9yOmFjdG9yfSk7XG5cdFx0XHRcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKHdwKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0fSlcblx0XHRcdFx0XG5cdFx0XHRcdC8vIGxvY2FsX2NvbnRyb2xsZXIuYWN0KHNlbGYuV29ybGQuc2NlbmUsIGFjdGlvbiwgdXBfb3JfZG93biwgYWN0b3IsIG9uQWN0KTtcblx0XHRcdH1cblx0XHRcdC8vRE9ORVxuXHRcdH1cblx0fTtcblxuXG5Db250cm9sbGVyLkNQaWxvdENvbnRyb2xsZXIgPSBmdW5jdGlvbigpe1xuXHRcdHRoaXMudHlwZT0ncGlsb3QnO1xuXHRcdHRoaXMuYWN0aW9uX3R5cGVzPVsncm90YXRlJywgJ21vdmUnXVxuXHRcdGZ1bmN0aW9uIGdldF9heGlzKGEpe1xuXHRcdFx0aWYoYSA9PSAneCcpe1xuXHRcdFx0XHRheGlzID0gbmV3IENvbnRyb2xsZXIuVCgpLlZlY3RvcjMoMSwwLDApXG5cdFx0XHR9XG5cdFx0XHRpZihhID09ICd5Jyl7XG5cdFx0XHRcdGF4aXMgPSBuZXcgQ29udHJvbGxlci5UKCkuVmVjdG9yMygwLDEsMClcblx0XHRcdH1cblx0XHRcdGlmKGEgPT0gJ3onKXtcblx0XHRcdFx0YXhpcyA9IG5ldyBDb250cm9sbGVyLlQoKS5WZWN0b3IzKDAsMCwxKVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGF4aXNcblx0XHRcblx0XHRcblx0XHR9XG5cdFxuXHRcdHRoaXMuYWN0ID0gZnVuY3Rpb24oUywgYWN0aW9uLCBpc19kb3duLCBhY3Rvciwgb25BY3QgKXtcblx0XHRcdC8vIGNvbnNvbGUubG9nKCdXYXQnKTtcblx0XHRcdC8vIGNvbnNvbGUubG9nKFwibW92ZSBieVwiLCBhY3Rvcilcblx0XHRcdC8vaWYgKGFjdG9yID09PSB1bmRlZmluZWQpe1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKFwiTVlcIiwgVy5hY3RvcnNbVy5sb2dpbl0uY29udHJvbC5vYmplY3RfZ3VpZClcblx0XHRcdC8vXHR2YXIgQyA9IFMuY29udHJvbGxhYmxlKClcblx0XHRcdC8vfWVsc2V7XG5cdFx0XHR2YXIgQyA9IFMubWVzaF9mb3IoYWN0b3IpXG5cdFx0XHR2YXIgVCA9IENvbnRyb2xsZXIuVCgpO1xuXHRcdFx0XG5cdFx0XHR2YXIgZXRzID0ge3JvdGF0ZToncm90YXRpb24nLCBtb3ZlOidwcm9wdWxzaW9uJ31cblx0XHRcdHZhciBldCA9IGV0c1thY3Rpb24udHlwZV1cblx0XHRcdHZhciBBWD0gYWN0aW9uLmF4aXM7XG5cdFx0XHRpZighIGlzX2Rvd24pe1xuXHRcdFx0XHR2YXIgdmVjID0gbmV3IFQuVmVjdG9yMygwLDAsMClcblx0XHRcdH1lbHNle1xuXHRcdFx0XHR2YXIgYSA9IGFjdGlvbi5kaXIgPT0gJysnPyAxIDogLTE7XG5cdFx0XHRcdFxuXHRcdFx0XHR2YXIgdmVjID0gQVggPT0gJ3gnP25ldyBULlZlY3RvcjMoYSwwLDApOihBWCA9PSd5Jz9uZXcgVC5WZWN0b3IzKDAsIGEsIDApOiBuZXcgVC5WZWN0b3IzKDAsMCxhKSlcblx0XHRcdFx0Ly8g0KLQtdC/0LXRgNGMINC10LPQviDQvdCw0LTQviDRg9C80L3QvtC20LjRgtGMINC90LAg0LzQvtGJ0L3QvtGB0YLRjCDQtNCy0LjQs9Cw0YLQtdC70Y8g0Lgg0L/QvtC70YPRh9C40YLRjCDRgdC40LvRg1xuXHRcdFx0XHR2YXIgcG93ZXIgPSBDLmVuZ2luZXNbZXRdW2FjdGlvbi5heGlzICsgYWN0aW9uLmRpcl07XG5cdFx0XHRcdHZlYy5tdWx0aXBseVNjYWxhcihwb3dlcilcblx0XHRcdH1cblx0XHRcdHZhciBuID0gYWN0aW9uLmF4aXMrYWN0aW9uLmRpclxuXHRcdFx0aWYoIUMucG93ZXJzKXtcblx0XHRcdFx0Qy5wb3dlcnMgPSB7fVxuXHRcdFx0fVxuXHRcdFx0aWYoIUMucG93ZXJzW2V0XSl7XG5cdFx0XHRcdEMucG93ZXJzW2V0XSA9IHt9XG5cdFx0XHR9XG5cdFx0XHRDLnBvd2Vyc1tldF1bbl0gPSB2ZWMuY2xvbmUoKVxuXHRcdFx0XG5cdFx0XHRcblx0XHRcdGlmIChldCA9PSBcInJvdGF0aW9uXCIpe1xuXHRcdFx0XHR2YXIgdG90ID0gbmV3IFQuVmVjdG9yMygwLDAsMClcblx0XHRcdFx0Xy5lYWNoKEMucG93ZXJzLnJvdGF0aW9uLCBmdW5jdGlvbih2LGVuYW1lKXtcblx0XHRcdFx0XHR0b3QuYWRkKHYpXG5cdFx0XHRcdFxuXHRcdFx0XHR9KVxuXHRcdFx0XHRDLnRvdGFsX3RvcnF1ZXMucHVzaCh7dHM6YWN0aW9uLnRpbWVzdGFtcCwgdmVjOnRvdH0gKVxuXHRcdFx0fVxuXHRcdFx0aWYgKGV0ID09J3Byb3B1bHNpb24nKXtcblx0XHRcdFx0dmFyIHRvdCA9IG5ldyBULlZlY3RvcjMoMCwwLDApXG5cdFx0XHRcdF8uZWFjaChDLnBvd2Vycy5wcm9wdWxzaW9uLCBmdW5jdGlvbih2ZWMsZW5hbWUpe1xuXHRcdFx0XHRcdHRvdC5hZGQodmVjKVxuXHRcdFx0XHR9KVxuXHRcdFx0XG5cdFx0XHRcdEMudG90YWxfcG93ZXJzLnB1c2goIHt0czphY3Rpb24udGltZXN0YW1wLCB2ZWM6dG90fSApXG5cdFx0XHR9XG5cdFx0XHRvbkFjdChDLkdVSUQpXG5cdFx0XHQvLyDQn9C+0LvRg9GH0LjQu9C4INC10LTQuNC90LjRh9C90YvQuSDQstC10LrRgtC+0YAg0YLRj9Cz0LggXG5cdFx0XHQvKlxuXHRcblx0XHRcdGlmIChhY3Rpb24udHlwZSA9PSAncm90YXRlJyl7XG5cdFx0XHRcdGlmIChpc19kb3duKXtcblx0XHRcdFx0XHRDLnB1dF9vbihcInJvdGF0aW9uXCIsIHZlYywgYWN0aW9uLnRpbWVzdGFtcClcblx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0Qy5wdXRfb2ZmKFwicm90YXRpb25cIiwgdmVjLCBhY3Rpb24udGltZXN0YW1wKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZiAoYWN0aW9uLnR5cGUgPT0gJ21vdmUnKXtcblx0XHRcblx0XHRcdFx0dmFyIGEgPSBhY3Rpb24uZGlyID09ICcrJz8xOi0xO1xuXHRcdFxuXHRcdFx0XHQvLyB2YXIgbSA9IG5ldyBDb250cm9sbGVyLlQoKS5NYXRyaXg0KClcblx0XHRcdFx0aWYgKGlzX2Rvd24pe1xuXHRcdFx0XHRcdEMucHV0X29uKFwicHJvcHVsc2lvblwiLCB2ZWMsIGFjdGlvbi50aW1lc3RhbXApXG5cdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdEMucHV0X29mZihcInByb3B1bHNpb25cIiwgdmVjLCBhY3Rpb24udGltZXN0YW1wKVxuXHRcdFx0XHR9XG5cdFx0XHR9Ki9cblxuXHRcdFx0XG5cdFx0fVxuXHRcdC8vIHJldHVybiB0aGlzO1xuXHRcblx0fTtcblxuXG5Db250cm9sbGVyLmJhc2ljQXV0b1BpbG90QWN0b3I9ZnVuY3Rpb24gKFMsIGlkLCBvaWQpe1xuXHRcdHRoaXMudGFyZ2V0cyA9IFtcIm9yYml0X29iamVjdFwiLCBcImNsb3NlX3RvX29iamVjdFwiXTtcblx0XHR0aGlzLmRlZmF1bHRfZGlzdGFuY2UgPSAyMDBcblx0XHR0aGlzLmdldF9mb2VzID0gZnVuY3Rpb24oKXtcblx0XHRcdHRoaXMuZm9lcyA9IFtdXG5cdFx0XHRmb3IgKHZhciBpID0wOyBpIDwgVy5tZXNoZXMubGVuZ3RoOyBpKyspe1xuXHRcdFx0XHRpZihpICE9IGlkKSBmb2VzLnB1c2goe2lkOmlkLCBvYmo6Vy5tZXNoZXNbaV19KVxuXHRcdFx0fVxuXHRcdH1cblx0fTtcbkNvbnRyb2xsZXIuQmFzaWNCdWxsZXRBY3Rvcj1mdW5jdGlvbihTLCBpZCwgY29pZCl7IFxuXHRcdC8vIGlkID0gaXMgb2JqZWN0IGluIHRoZSB3b3JsZCBjb250cm9sbGFibGUgYnkgdGhpcyBhY3RvclxuXHRcdC8vIGNvaWQgIE1VU1QgQkUgYW4gb2JqZWN0LCB3aG8gc2hvb3QgdGhpcyBidWxsZXRcblx0XHQvL3ZhciBTID0gVy5zY2VuZVxuXHRcdHRoaXMubmFtZSA9IFwiQmFzaWNfYWN0b3JfXCIgKyAobmV3IERhdGUoKS5nZXRUaW1lKCkpXG5cdFx0Ly8gdGhpcy5XO1xuXHRcdHRoaXMub2lkID0gaWRcblx0XHR0aGlzLmNvaWQgPSBjb2lkXG5cdFx0Ly8gY29uc29sZS5sb2coaWQpO1xuXHRcdHRoaXMubXlfbWVzaCA9IFMubWVzaGVzW2lkXVxuXHRcdC8vY29uc29sZS5sb2coXCJNWSBNRVNIXCIsIHRoaXMubXlfbWVzaCwgaWQpXG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdC8vIGNvbnNvbGUubG9nKFcubWVzaGVzLCBpZCwgVy5tZXNoZXMubGVuZ3RoKVxuXHRcdHZhciB0b3RhbF90aW1lX2luX3NwYWNlID0gMDtcblx0XHR2YXIgX3Bvc3NpYmxlX3RhcmdldHMgPSB7fTtcblx0XHR2YXIgVCA9IENvbnRyb2xsZXIuVCgpO1xuXHRcblx0XHR0aGlzLnJ1biA9IGZ1bmN0aW9uKHRpbWVfbGVmdCl7XG5cdFx0XHR0b3RhbF90aW1lX2luX3NwYWNlICs9IHRpbWVfbGVmdFxuXHRcdFx0Ly9jb25zb2xlLmxvZygncnVubmluZycpO1xuXHRcdFx0aWYgKHRvdGFsX3RpbWVfaW5fc3BhY2UgPiAxMCl7XG5cdFx0XHRcdC8vUy5tZXNoZXMuc3BsaWNlKGlkLCAxKVxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKFwicmVtb3ZpbmdcIilcblx0XHRcdFx0Uy5fZGVsZXRlX29iamVjdChpZClcblx0XHRcdFx0ZGVsZXRlIFMuYXV0b21hdGljX2FjdG9yc1t0aGlzLm5hbWVdO1xuXHRcdFx0fVxuXHRcdFx0dmFyIHZlbCA9IHRoaXMubXlfbWVzaC52ZWwuY2xvbmUoKTtcblx0XHRcdHZhciBtcG9zID0gdGhpcy5teV9tZXNoLnBvc2l0aW9uLmNsb25lKCk7XG5cdFx0XG5cdFx0XHR2YXIgdGhyZXMgPSA0ICogdGhpcy5teV9tZXNoLnZlbC5sZW5ndGgoKTtcblx0XHRcdHZhciBpbl90aHJlcyA9IFtdO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhcIlRIUmVzXCIsIHRocmVzKTtcblx0XHRcblx0XHRcdF8uZWFjaCggUy5tZXNoZXMsIGZ1bmN0aW9uKG0saSkge1xuXHRcdFx0XHRpZihpID09PSBpZCB8fCBpID09PSBjb2lkKSByZXR1cm47XG5cdFx0XHRcdGlmKG0uaXNfbm90X2NvbGxpZGFibGUpIHJldHVybjtcblx0XHRcdFx0Ly8gdmFyIG0gPSBXLm1lc2hlc1tpXTtcblx0XHRcdFx0dmFyIG1wID0gIG0ucG9zaXRpb24uY2xvbmUoKTtcblx0XHRcdFx0dmFyIHBkID0gbXAuc3ViKCBtcG9zIClcblx0XHRcdFx0Ly8gY29uc29sZS5sb2coIHZlbCwgcGQgKVxuXHRcdFx0XHR2YXIgYWcgPSBNYXRoLmFjb3MocGQuZG90KHZlbCkvIHZlbC5sZW5ndGgoKSAvIHBkLmxlbmd0aCgpKSAvLyDRg9Cz0L7QuyDQvNC10LbQtNGDINC90LDQv9GA0LDQstC70LXQvdC40LXQvCDQtNCy0LjQttC10L3QuNGPINC4INGG0LXQvdGC0YDQvtC8INC+0LHRitC10LrRgtCwXG5cdFx0XHRcdGlmIChhZyA8IE1hdGguUEkvMTYpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdhZycpO1xuXHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKFwiSEhcIiwgaSwgYWcsIE1hdGguUEkvOCk7XG5cdFx0XHRcdFxuXHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKFwiaWQgdmVmb3JlXCIsIFx0aWQsICk7XG5cdFx0XHRcdFx0dmFyIHN1YiA9IHNlbGYubXlfbWVzaC5wb3NpdGlvbi5jbG9uZSgpLnN1YiggbXAgKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHR2YXIgZGlzdCA9IHN1Yi5sZW5ndGgoKVxuXHRcdFx0XHRcdGlmKCBkaXN0IDwgdGhyZXMpe1xuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhcIk9LRVwiKTtcblx0XHRcdFx0XHRcdGlmKCBpbl90aHJlcy5pbmRleE9mKCBpICkgPT09IC0xICl7XG5cdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ3Bvc3NpYmxlJyk7XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0aW5fdGhyZXMucHVzaChpKSAvLyBBZGQgbWVzaCBpbmRleFxuXHRcdFx0XHRcdFx0XHR0YXJnZXQgPSB7bGFzdF9wb2ludCA6bXBvcy5jbG9uZSgpLFxuXHRcdFx0XHRcdFx0XHRcdFx0ICBsYXN0X2FuZ2xlIDogYWcsXG5cdFx0XHRcdFx0XHRcdFx0XHQgIGxhc3RfZGlzdGFuY2UgOiBkaXN0LFxuXHRcdFx0XHRcdFx0XHRcdFx0ICBhbmdsZV9yYWlzZSA6IDAsXG5cdFx0XHRcdFx0XHRcdFx0XHQgIGRpc3RhbmNlX3JhaXNlIDowLFxuXHRcdFx0XHRcdFx0XHRcdFx0ICBkaXN0YW5jZV9zaG9ydGVucyA6IDAsXG5cdFx0XHRcdFx0XHRcdFx0XHQgIGFuZ2xlX2xvd2VycyA6IDAsXG5cdFx0XHRcdFx0XHRcdFx0ICBcdCAgaWQgOiBpfVxuXHRcdFx0XHRcdFx0XHRfcG9zc2libGVfdGFyZ2V0c1tpXSA9IHRhcmdldFxuXHRcdFx0XHRcdFx0fS8vZWxzZXt9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFxuXHRcdFx0XHR9ZWxzZXtcblx0XHRcdFx0XHRpZihpIGluIF9wb3NzaWJsZV90YXJnZXRzKXtcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ1BPUycsIGkpXG5cdFx0XHRcdFx0XHQvLyDQo9Cz0L7QuyDQsdGL0Lsg0L7RgdGC0YDRi9C5IC0g0YHRgtCw0Lsg0YLRg9C/0L7QuVxuXHRcdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coXCJoZXJlIVwiLGkpO1xuXHRcdFx0XHRcdFx0Ly8g0J3QsNC00L4g0L/RgNC+0LLQtdGA0LjRgtGMLCDQvdC1INC/0LXRgNC10YHQtdC60LDQtdGCINC70Lgg0L7RgtGA0LXQt9C+0LogLSDQv9GA0L7RiNC70YvQtSDQutC+0L7RgNC00LjQvdCw0YLRiyAtINGC0LXQutGD0YnQuNC1INC60L7QvtGA0LTQuNC90LDRgtGLINC90LDRiCDQvNC10Yhcblx0XHRcdFx0XHRcdHZhciBkaXJlY3Rpb24gPSBtcG9zLmNsb25lKCkuc3ViKCBfcG9zc2libGVfdGFyZ2V0c1tpXS5sYXN0X3BvaW50KVxuXHRcdFx0XHRcdFx0dmFyIHJheSA9IG5ldyBULlJheWNhc3RlcihfcG9zc2libGVfdGFyZ2V0c1tpXS5sYXN0X3BvaW50LCBkaXJlY3Rpb24uY2xvbmUoKS5ub3JtYWxpemUoKSApXG5cdFx0XHRcdFx0XHRpZihTLm5lZWRfdXBkYXRlX21hdHJpeCl7XG5cdFx0XHRcdFx0XHRcdG0udXBkYXRlTWF0cml4V29ybGQoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHZhciBpc3IgPSByYXkuaW50ZXJzZWN0T2JqZWN0cyhbbV0pXG5cdFx0XHRcdFx0XHQvL2lmIChtLnR5cGUgPT0gJ3NoaXAnKXtcblx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKFwibWF0cml4IGF1dG91cGRcIiwgbS5tYXRyaXhXb3JsZC5lbGVtZW50cylcblx0XHRcdFx0XHRcdFx0Ly8gY29uc29sZS5sb2cobXBvcyk7XG5cdFx0XHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKHJheSxpc3IpXG5cdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHQvL31cblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyggbS50eXBlIClcblx0XHRcdFx0XHRcdGlmIChpc3IubGVuZ3RoID4gMCAmJiBpc3JbMF0uZGlzdGFuY2UgPCBkaXJlY3Rpb24ubGVuZ3RoKCkgKXtcblx0XHRcdFx0XHRcdFx0Ly9mb3IoIHZhciBpbmRleCA9MDsgaW5kZXg8aXNyLmxlbmd0aDsgaW5kZXgrKyl7XG5cdFx0XHRcdFx0XHRcdC8vXHRjb25zb2xlLmxvZyhcIkhFUkVcIiwgaXNyW2luZGV4XS5kaXN0YW5jZSwgZGlyZWN0aW9uLmxlbmd0aCgpKVxuXHRcdFx0XHRcdFx0XHQvLy99XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdISVQnKVxuXHRcdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhcIkVORFwiLCBpc3JbMF0ucG9pbnQpO1xuXHRcdFx0XHRcdFx0XHRtLndvcmxkVG9Mb2NhbChpc3JbMF0ucG9pbnQpIC8vINCi0LXQv9C10YDRjCDRjdGC0L4g0L/Qu9C10YfQviDRg9C00LDRgNCwXG5cdFx0XHRcdFx0XHRcdHZhciBpbXB1bHNlID0gc2VsZi5teV9tZXNoLmltcHVsc2U7ICAvL3ZlbC5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKHNlbGYubXlfbWVzaC5tYXNzKVxuXHRcdFx0XHRcdFx0XHR2YXIgYXhpcyA9IG5ldyBULlZlY3RvcjMoKS5jcm9zc1ZlY3RvcnMoaXNyWzBdLnBvaW50LCBpbXB1bHNlKVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHR2YXIgYWcgPSBNYXRoLmFjb3MoaXNyWzBdLnBvaW50LmNsb25lKCkuZG90KGltcHVsc2UpIC8gaW1wdWxzZS5sZW5ndGgoKSAvIGlzclswXS5wb2ludC5sZW5ndGgoKSApXG5cdFx0XHRcdFx0XHRcdC8vINCi0LXQv9C10YDRjCDRjdGC0L4g0LLRgNCw0YnQtdC90LjQtSDQvdCw0LTQviDRgNCw0LfQsdC40YLRjCDQv9C+INC+0YHRj9C8XG5cdFx0XHRcdFx0XHRcdHZhciBtYXQgPSBuZXcgVC5NYXRyaXg0KCkubWFrZVJvdGF0aW9uQXhpcyhheGlzLm5vcm1hbGl6ZSgpLCBhZylcblx0XHRcdFx0XHRcdFx0dmFyIGV1bCA9IG5ldyBULkV1bGVyKClcblx0XHRcdFx0XHRcdFx0ZXVsLnNldEZyb21Sb3RhdGlvbk1hdHJpeChtYXQsIFwiWFlaXCIpXG5cdFx0XHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKGksIGV1bClcblx0XHRcdFx0XHRcdFx0dmFyIGF2ZWwgPSBuZXcgVC5WZWN0b3IzKCk7XG5cdFx0XHRcdFx0XHRcdGF2ZWwueCA9IGV1bC54O1xuXHRcdFx0XHRcdFx0XHRhdmVsLnkgPSBldWwueTtcblx0XHRcdFx0XHRcdFx0YXZlbC56ID0gZXVsLno7XG5cdFx0XHRcdFx0XHRcdHZhciBjayA9IGlzclswXS5wb2ludC5sZW5ndGgoKSAqIE1hdGguc2luKGFnIC0gTWF0aC5QSS8yKVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyh0aGlzLm15X21lc2gubWFzcyAvIG0ubWFzcyAqIChjayAqIGNrICkpO1xuXHRcdFx0XHRcdFx0XHRhdmVsLm11bHRpcGx5U2NhbGFyKHNlbGYubXlfbWVzaC5tYXNzL20ubWFzcyAqIE1hdGguYWJzKGNrKSlcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0Ly8g0J3QtSDRg9GH0LjRgtGL0LLQsNGOINC80LDRgdGB0YMg0Lgg0L/Qu9C10YfQvi4uLiBcblx0XHRcdFx0XHRcdFx0dmFyIG1hdmVsID0gUy5tZXNoZXNbaV0uYXZlbFxuXHRcdFx0XHRcdFx0XHRpZiAoISBtYXZlbCApe21hdmVsID0gbmV3IFQuVmVjdG9yMygwLDAsMCl9XG5cdFx0XHRcdFx0XHRcdG1hdmVsLnggKz0gYXZlbC54XG5cdFx0XHRcdFx0XHRcdG1hdmVsLnkgKz0gYXZlbC55XG5cdFx0XHRcdFx0XHRcdG1hdmVsLnogKz0gYXZlbC56O1xuXHRcdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhtYXZlbC54LCBtYXZlbC55LCBtYXZlbC56KVxuXHRcdFx0XHRcdFx0XHRTLm1lc2hlc1tpXS5hdmVsID0gbWF2ZWw7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdC8vIGFkZF92ZWwgPSBpbXB1bHNlLm11bHRpcGx5U2NhbGFyKCAxLyBtLm1hc3MpO1xuXHRcdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhhZGRfdmVsKVxuXHRcdFx0XHRcdFx0XHQvLyDQo9Cx0YDQsNGC0Ywg0L/QvtC60LAg0YHQutC+0YDQvtGB0YLRjFxuXHRcdFx0XHRcdFx0XHQvL2lmIChTLm1lc2hlc1tpXS52ZWwpe1xuXHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFMubWVzaGVzW2ldLmltcHVsc2UpXG5cdFx0XHRcdFx0XHRcdFMubWVzaGVzW2ldLmltcHVsc2UuYWRkKCBpbXB1bHNlICk7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFMubWVzaGVzW2ldLmltcHVsc2UpXG5cdFx0XHRcdFx0XHRcdFx0Ly8gfVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKFwiRU5EIExPQ0FMXCIsIGlzclswXS5wb2ludCk7XG5cdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29rZSwgd2Ugc2hvb3QgaXQ6JywgaSlcblx0XHRcdFx0XHRcdFx0Ly8gTm93IHdlIHdpbGwganVzdCByZW1vdmUgb2JqZWN0IGZyb20gc2NlbmUgd2l0aCB0aGUgYnVsbGV0XG5cdFx0XHRcdFx0XHRcdC8vVy5zY2VuZS5yZW1vdmUoVy5tZXNoZXNbaV0pXG5cdFx0XHRcdFx0XHRcdFMuX2RlbGV0ZV9vYmplY3QoaWQpXG5cdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHQvL2lmKFMudGhyZWVfc2NlbmUpe1xuXHRcdFx0XHRcdFx0XHQvL1x0Uy50aHJlZV9zY2VuZS5yZW1vdmUoUy5tZXNoZXNbaWRdKSAvLyDRg9C00Y/Qu9GP0LXQvCDRj9C00YDQviDQuNC3INGB0YbQtdC90Ytcblx0XHRcdFx0XHRcdFx0Ly99XG5cdFx0XHRcdFx0XHRcdC8vZGVsZXRlIFMubWVzaGVzWyBpZCBdOyAvLyAuLi4g0LjQtyDQvNC10YjQtdC5XG5cdFx0XHRcdFx0XHRcdGRlbGV0ZSBTLmFjdG9yc1tzZWxmLm5hbWVdOyAvLyAuLi4g0KPQtNCw0LvRj9C10Lwg0Y3RgtC+0LPQviDQsNC60YLQvtGA0LAgLSDQsdC+0LvRjNGI0LUg0L3QtSDQt9Cw0LPRgNGD0LfQuNGC0YHRjyDRjdGC0LAg0YTRg9C90LrRhtC40Y9cblx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0Ly9XLm1lc2hlcy5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0XHRcdGRlbGV0ZSBfcG9zc2libGVfdGFyZ2V0c1tpXSAvLyAuLi4g0LjQtyDQstC+0LfQvNC+0LbQvdGL0YUg0YbQtdC70LXQuSDRg9C00LDQu9GP0LXQvCDRjdGC0L7RgiDQvNC10Yhcblx0XHRcdFx0XHRcdFx0Ly8gYmxhLmJsYSA9IDFcblx0XHRcdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdFx0XHRkZWxldGUgX3Bvc3NpYmxlX3RhcmdldHNbaV07XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coIGFnLCBNYXRoLlBJLzgpO1xuXHRcdFx0XHRcblx0XHRcdFx0fVxuXHRcdFx0XG5cdFx0XHR9KVxuXHRcdFx0Ly9ibGEuYmFsICs9MVxuXHRcdFx0Ly9jb25zb2xlLmxvZyhibGEpXG5cdFx0XG5cdFx0XG5cdFx0XHQvLyBjb25zb2xlLmxvZyh0b3RhbF90aW1lX2luX3NwYWNlICxXLm1lc2hlcy5sZW5ndGgsIFcuYWN0b3JzKVxuXHRcdH1cblx0XG5cdFxuXHR9O1xuXHRcbkNvbnRyb2xsZXIuQ1R1cnJldENvbnRyb2xsZXIgPSBmdW5jdGlvbigpe1xuXHR0aGlzLnR5cGUgPSAndHVycmV0Jztcblx0XHR0aGlzLmFjdCA9IGZ1bmN0aW9uKFMsIGFjdGlvbiwgaXNfZG93biwgYWN0b3IgKXtcblx0XHRcdFxuXHRcdFx0aWYgKGFjdGlvbi50eXBlID09J3Nob290X3ByaW1hcnknKXtcblx0XHRcdFx0aWYoISBpc19kb3duKSByZXR1cm47XG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKCc+Pj4nKTtcblx0XHRcdFx0Ly8gdmFyIHdlYXBvbiA9IEMud2VhcG9uc1swXTtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhcInNob3QgYnlcIiwgYWN0b3IpXG5cdFx0XHRcdHZhciBUID0gQ29udHJvbGxlci5UKCk7XG5cdFx0XHRcdC8vaWYgKGFjdG9yID09PSB1bmRlZmluZWQpe1xuXHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKFwiTVlcIiwgVy5nZXRfY3VycmVudF9hY3RvcigpLmNvbnRyb2wub2JqZWN0X2d1aWQpXG5cdFx0XHRcdC8vXHR2YXIgQyA9IFMubWVzaGVzWyBXLmdldF9hY3RvcihhY3RvcikuY29udHJvbC5vYmplY3RfZ3VpZCBdXG5cdFx0XHRcdC8vfWVsc2V7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coYWN0b3IsIGFjdGlvbik7XG5cdFx0XHRcdHZhciBDID0gUy5tZXNoZXNbYWN0b3IuY29udHJvbC5vYmplY3RfZ3VpZF1cblx0XHRcdFx0XG5cdFx0XHRcdFx0Ly99XG5cdFx0XHRcdGlmIChhY3Rpb24udHVycmV0X2RpcmVjdGlvbiBpbnN0YW5jZW9mIFQuVmVjdG9yMyl7XG5cdFx0XHRcdFx0dmFyIG1wdiA9IGFjdGlvbi50dXJyZXRfZGlyZWN0aW9uXG5cdFx0XHRcdFxuXHRcdFx0XHR9ZWxzZXtcblx0XHRcdFx0XHR2YXIgbXB2ID0gbmV3IFQuVmVjdG9yMyhhY3Rpb24udHVycmV0X2RpcmVjdGlvbi54LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YWN0aW9uLnR1cnJldF9kaXJlY3Rpb24ueSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGFjdGlvbi50dXJyZXRfZGlyZWN0aW9uLnopXG5cdFx0XHRcdH1cblx0XHRcdFx0bXB2Lm11bHRpcGx5U2NhbGFyKDAuNTAwMCk7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ1RIJywgQ29udHJvbGxlci5UKCkpXG5cdFx0XHRcdFxuXHRcdFx0XHR2YXIgYnVsbGV0ID0gQ29udHJvbGxlci5jcmVhdGVTaG90UGFydGljbGUoKTtcblx0XHRcdFx0YnVsbGV0LnBvcyA9IG5ldyBULlZlY3RvcjMoKVxuXHRcdFx0XHRidWxsZXQucG9zID0gQy5wb3NpdGlvbi5jbG9uZSgpXG5cdFx0XHRcblx0XHRcdFx0YnVsbGV0Lmhhc19lbmdpbmVzID0gZmFsc2U7XG5cdFx0XHRcdGJ1bGxldC5pc19ub3RfY29sbGlkYWJsZSA9IHRydWU7XG5cdFx0XHRcdGJ1bGxldC52ZWwgPSBuZXcgVC5WZWN0b3IzKDAsMCwwKTsgLy8gbXB2Ly8ubXVsdGlwbHlTY2FsYXIoMC4xMCk7XG5cdFx0XHRcdGJ1bGxldC5tYXNzID0gMTtcblx0XHRcdFx0YnVsbGV0LmltcHVsc2UgPSBtcHY7XG5cdFx0XHRcdGJ1bGxldC5hbmd1bGFyX2ltcHVsc2UgPSBuZXcgVC5WZWN0b3IzKDAsMCwwKTtcblx0XHRcdFx0aWYgKCB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyl7XG5cdFx0XHRcdFx0Uy50aHJlZV9zY2VuZS5hZGQoIGJ1bGxldCApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdEJfR1VJRCA9IFV0aWxzLm1ha2VfZ3VpZCgpXG5cdFx0XHRcdFMubWVzaGVzW0JfR1VJRF0gPSAgYnVsbGV0IDtcblx0XHRcdFxuXHRcdFx0XHR2YXIgYnVsbGV0X2FjdG9yID0gbmV3IENvbnRyb2xsZXIuQmFzaWNCdWxsZXRBY3RvcihTLCBCX0dVSUQsIEMuR1VJRClcblx0XHRcdFx0Uy5hdXRvbWF0aWNfYWN0b3JzW2J1bGxldF9hY3Rvci5uYW1lXSA9IGJ1bGxldF9hY3Rvcjtcblx0XHRcdFx0Ly8gY29uc29sZS5sb2coVy5zY2VuZS5hdXRvbWF0aWNfYWN0b3JzKTtcblx0XHRcdFxuXHRcdFx0XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vIHJldHVybiB0aGlzO1xuXHRcblx0fTtcbkNvbnRyb2xsZXIuQ29udHJvbGxlcnNBY3Rpb25NYXA9IGZ1bmN0aW9uKCl7XG5cdFx0aWYgKHRoaXMuX0NvbnRyb2xsZXJzQWN0aW9uTWFwKXtcblx0XHRcdHJldHVybiB0aGlzLl9Db250cm9sbGVyc0FjdGlvbk1hcFxuXHRcdH1lbHNle1xuXHRcdFx0dmFyIFBpbG90Q29udHJvbGxlciA9IG5ldyBDb250cm9sbGVyLkNQaWxvdENvbnRyb2xsZXIoKTtcblx0XHRcdHZhciBUdXJyZXRDb250cm9sbGVyID0gbmV3IENvbnRyb2xsZXIuQ1R1cnJldENvbnRyb2xsZXIoKVxuXHRcdFx0dGhpcy5fQ29udHJvbGxlcnNBY3Rpb25NYXAgPSB7XG5cdFx0XHRcdCdtb3ZlJzogUGlsb3RDb250cm9sbGVyLFxuXHRcdFx0XHQncm90YXRlJzpQaWxvdENvbnRyb2xsZXIsXG5cdFx0XHRcdCdyb3RhdGVjJzogUGlsb3RDb250cm9sbGVyLFxuXHRcdFx0XHQnc2hvb3RfcHJpbWFyeSc6IFR1cnJldENvbnRyb2xsZXJcblx0XHRcdH0gXHRcdFxuXHRcdFx0cmV0dXJuIHRoaXMuX0NvbnRyb2xsZXJzQWN0aW9uTWFwO1xuXHRcdFx0XG5cdFx0fVxuXHR9XG5cbmlmKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKXtcblx0Q29udHJvbGxlci5UID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gVEhSXG5cdH07XG5cdENvbnRyb2xsZXIuY3JlYXRlU2hvdFBhcnRpY2xlPWZ1bmN0aW9uKCl7XG5cdFx0dmFyIFQgPSB0aGlzLlQoKTtcblx0XHQvLyBjb25zb2xlLmxvZygnUCcpO1xuXHRcdC8vdmFyIGN1YmVHZW9tZXRyeSA9IG5ldyBULkN1YmVHZW9tZXRyeSgxLDEsMSwxLDEsMSk7XG5cdFx0Ly92YXIgbWFwXHQ9IFQuSW1hZ2VVdGlscy5sb2FkVGV4dHVyZSggXCIvdGV4dHVyZXMvbGVuc2ZsYXJlL2xlbnNmbGFyZTAucG5nXCIgKTtcblx0XHQvL3ZhciBTcHJpdGVNYXRlcmlhbCA9IG5ldyBULlNwcml0ZU1hdGVyaWFsKCB7IG1hcDogbWFwLCBjb2xvcjogMHhmZmZmZmYsIGZvZzogdHJ1ZSB9ICk7XG5cdFx0cmV0dXJuIG5ldyBULk9iamVjdDNEKCk7XG5cdH07XG5cbn1lbHNle1xuXHRDb250cm9sbGVyLlQgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiBUSFJFRVxuXHR9O1xuXHRDb250cm9sbGVyLmNyZWF0ZVNob3RQYXJ0aWNsZT1mdW5jdGlvbigpe1xuXHRcdHZhciBUID0gdGhpcy5UKCk7XG5cdFx0Ly8gY29uc29sZS5sb2coXCJwYXJ0aWNsZVwiKVxuXHRcdC8vIHZhciBjdWJlR2VvbWV0cnkgPSBuZXcgVC5DdWJlR2VvbWV0cnkoMSwxLDEsMSwxLDEpO1xuXHRcdHZhciBtYXBcdD0gVC5JbWFnZVV0aWxzLmxvYWRUZXh0dXJlKCBcIi90ZXh0dXJlcy9sZW5zZmxhcmUvbGVuc2ZsYXJlMC5wbmdcIiApO1xuXHRcdHZhciBtYXRlcmlhbCA9IG5ldyBULlNwcml0ZU1hdGVyaWFsKCB7IG1hcDogbWFwLCBjb2xvcjogMHhmZmZmZmYsIGZvZzogdHJ1ZSB9ICk7XG5cdFx0bWF0ZXJpYWwudHJhbnNwYXJlbnQgPSB0cnVlO1xuXHRcdG1hdGVyaWFsLmJsZW5kaW5nID0gVEhSRUUuQWRkaXRpdmVCbGVuZGluZztcblx0XHRcblx0XHR2YXIgYSA9IG5ldyBULlNwcml0ZShtYXRlcmlhbCk7XG5cdFx0YS5zdGF0aWMgPSBmYWxzZTtcblx0XHRhLmhhc19lbmdpbmVzID0gZmFsc2U7XG5cdFx0cmV0dXJuIGFcblx0fTtcblx0XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBDb250cm9sbGVyXG4vL3ZhciBUdXJyZXRDb250cm9sbGVyID0gbmV3IENUdXJyZXRDb250cm9sbGVyKClcbi8vQ1BpbG90Q29udHJvbGxlci5wcm90b3R5cGUgPSB7Y29uc3RydWN0b3I6Q1BpbG90Q29udHJvbGxlcn1cbi8vdmFyIFBpbG90Q29udHJvbGxlciA9IG5ldyBDUGlsb3RDb250cm9sbGVyKCk7XG5cbi8vY29uc29sZS5sb2coVHVycmV0Q29udHJvbGxlci5hY3QsIFBpbG90Q29udHJvbGxlci5hY3QpXG4iLCIvLyAgICAgVW5kZXJzY29yZS5qcyAxLjUuMlxuLy8gICAgIGh0dHA6Ly91bmRlcnNjb3JlanMub3JnXG4vLyAgICAgKGMpIDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuLy8gICAgIFVuZGVyc2NvcmUgbWF5IGJlIGZyZWVseSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG5cbihmdW5jdGlvbigpIHtcblxuICAvLyBCYXNlbGluZSBzZXR1cFxuICAvLyAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEVzdGFibGlzaCB0aGUgcm9vdCBvYmplY3QsIGB3aW5kb3dgIGluIHRoZSBicm93c2VyLCBvciBgZXhwb3J0c2Agb24gdGhlIHNlcnZlci5cbiAgdmFyIHJvb3QgPSB0aGlzO1xuXG4gIC8vIFNhdmUgdGhlIHByZXZpb3VzIHZhbHVlIG9mIHRoZSBgX2AgdmFyaWFibGUuXG4gIHZhciBwcmV2aW91c1VuZGVyc2NvcmUgPSByb290Ll87XG5cbiAgLy8gRXN0YWJsaXNoIHRoZSBvYmplY3QgdGhhdCBnZXRzIHJldHVybmVkIHRvIGJyZWFrIG91dCBvZiBhIGxvb3AgaXRlcmF0aW9uLlxuICB2YXIgYnJlYWtlciA9IHt9O1xuXG4gIC8vIFNhdmUgYnl0ZXMgaW4gdGhlIG1pbmlmaWVkIChidXQgbm90IGd6aXBwZWQpIHZlcnNpb246XG4gIHZhciBBcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlLCBPYmpQcm90byA9IE9iamVjdC5wcm90b3R5cGUsIEZ1bmNQcm90byA9IEZ1bmN0aW9uLnByb3RvdHlwZTtcblxuICAvLyBDcmVhdGUgcXVpY2sgcmVmZXJlbmNlIHZhcmlhYmxlcyBmb3Igc3BlZWQgYWNjZXNzIHRvIGNvcmUgcHJvdG90eXBlcy5cbiAgdmFyXG4gICAgcHVzaCAgICAgICAgICAgICA9IEFycmF5UHJvdG8ucHVzaCxcbiAgICBzbGljZSAgICAgICAgICAgID0gQXJyYXlQcm90by5zbGljZSxcbiAgICBjb25jYXQgICAgICAgICAgID0gQXJyYXlQcm90by5jb25jYXQsXG4gICAgdG9TdHJpbmcgICAgICAgICA9IE9ialByb3RvLnRvU3RyaW5nLFxuICAgIGhhc093blByb3BlcnR5ICAgPSBPYmpQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuICAvLyBBbGwgKipFQ01BU2NyaXB0IDUqKiBuYXRpdmUgZnVuY3Rpb24gaW1wbGVtZW50YXRpb25zIHRoYXQgd2UgaG9wZSB0byB1c2VcbiAgLy8gYXJlIGRlY2xhcmVkIGhlcmUuXG4gIHZhclxuICAgIG5hdGl2ZUZvckVhY2ggICAgICA9IEFycmF5UHJvdG8uZm9yRWFjaCxcbiAgICBuYXRpdmVNYXAgICAgICAgICAgPSBBcnJheVByb3RvLm1hcCxcbiAgICBuYXRpdmVSZWR1Y2UgICAgICAgPSBBcnJheVByb3RvLnJlZHVjZSxcbiAgICBuYXRpdmVSZWR1Y2VSaWdodCAgPSBBcnJheVByb3RvLnJlZHVjZVJpZ2h0LFxuICAgIG5hdGl2ZUZpbHRlciAgICAgICA9IEFycmF5UHJvdG8uZmlsdGVyLFxuICAgIG5hdGl2ZUV2ZXJ5ICAgICAgICA9IEFycmF5UHJvdG8uZXZlcnksXG4gICAgbmF0aXZlU29tZSAgICAgICAgID0gQXJyYXlQcm90by5zb21lLFxuICAgIG5hdGl2ZUluZGV4T2YgICAgICA9IEFycmF5UHJvdG8uaW5kZXhPZixcbiAgICBuYXRpdmVMYXN0SW5kZXhPZiAgPSBBcnJheVByb3RvLmxhc3RJbmRleE9mLFxuICAgIG5hdGl2ZUlzQXJyYXkgICAgICA9IEFycmF5LmlzQXJyYXksXG4gICAgbmF0aXZlS2V5cyAgICAgICAgID0gT2JqZWN0LmtleXMsXG4gICAgbmF0aXZlQmluZCAgICAgICAgID0gRnVuY1Byb3RvLmJpbmQ7XG5cbiAgLy8gQ3JlYXRlIGEgc2FmZSByZWZlcmVuY2UgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0IGZvciB1c2UgYmVsb3cuXG4gIHZhciBfID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mIF8pIHJldHVybiBvYmo7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIF8pKSByZXR1cm4gbmV3IF8ob2JqKTtcbiAgICB0aGlzLl93cmFwcGVkID0gb2JqO1xuICB9O1xuXG4gIC8vIEV4cG9ydCB0aGUgVW5kZXJzY29yZSBvYmplY3QgZm9yICoqTm9kZS5qcyoqLCB3aXRoXG4gIC8vIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciB0aGUgb2xkIGByZXF1aXJlKClgIEFQSS4gSWYgd2UncmUgaW5cbiAgLy8gdGhlIGJyb3dzZXIsIGFkZCBgX2AgYXMgYSBnbG9iYWwgb2JqZWN0IHZpYSBhIHN0cmluZyBpZGVudGlmaWVyLFxuICAvLyBmb3IgQ2xvc3VyZSBDb21waWxlciBcImFkdmFuY2VkXCIgbW9kZS5cbiAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gXztcbiAgICB9XG4gICAgZXhwb3J0cy5fID0gXztcbiAgfSBlbHNlIHtcbiAgICByb290Ll8gPSBfO1xuICB9XG5cbiAgLy8gQ3VycmVudCB2ZXJzaW9uLlxuICBfLlZFUlNJT04gPSAnMS41LjInO1xuXG4gIC8vIENvbGxlY3Rpb24gRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gVGhlIGNvcm5lcnN0b25lLCBhbiBgZWFjaGAgaW1wbGVtZW50YXRpb24sIGFrYSBgZm9yRWFjaGAuXG4gIC8vIEhhbmRsZXMgb2JqZWN0cyB3aXRoIHRoZSBidWlsdC1pbiBgZm9yRWFjaGAsIGFycmF5cywgYW5kIHJhdyBvYmplY3RzLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgZm9yRWFjaGAgaWYgYXZhaWxhYmxlLlxuICB2YXIgZWFjaCA9IF8uZWFjaCA9IF8uZm9yRWFjaCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybjtcbiAgICBpZiAobmF0aXZlRm9yRWFjaCAmJiBvYmouZm9yRWFjaCA9PT0gbmF0aXZlRm9yRWFjaCkge1xuICAgICAgb2JqLmZvckVhY2goaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIH0gZWxzZSBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBvYmoubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2ldLCBpLCBvYmopID09PSBicmVha2VyKSByZXR1cm47XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpba2V5c1tpXV0sIGtleXNbaV0sIG9iaikgPT09IGJyZWFrZXIpIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSByZXN1bHRzIG9mIGFwcGx5aW5nIHRoZSBpdGVyYXRvciB0byBlYWNoIGVsZW1lbnQuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBtYXBgIGlmIGF2YWlsYWJsZS5cbiAgXy5tYXAgPSBfLmNvbGxlY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHRzO1xuICAgIGlmIChuYXRpdmVNYXAgJiYgb2JqLm1hcCA9PT0gbmF0aXZlTWFwKSByZXR1cm4gb2JqLm1hcChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgcmVzdWx0cy5wdXNoKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgdmFyIHJlZHVjZUVycm9yID0gJ1JlZHVjZSBvZiBlbXB0eSBhcnJheSB3aXRoIG5vIGluaXRpYWwgdmFsdWUnO1xuXG4gIC8vICoqUmVkdWNlKiogYnVpbGRzIHVwIGEgc2luZ2xlIHJlc3VsdCBmcm9tIGEgbGlzdCBvZiB2YWx1ZXMsIGFrYSBgaW5qZWN0YCxcbiAgLy8gb3IgYGZvbGRsYC4gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYHJlZHVjZWAgaWYgYXZhaWxhYmxlLlxuICBfLnJlZHVjZSA9IF8uZm9sZGwgPSBfLmluamVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIG1lbW8sIGNvbnRleHQpIHtcbiAgICB2YXIgaW5pdGlhbCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyO1xuICAgIGlmIChvYmogPT0gbnVsbCkgb2JqID0gW107XG4gICAgaWYgKG5hdGl2ZVJlZHVjZSAmJiBvYmoucmVkdWNlID09PSBuYXRpdmVSZWR1Y2UpIHtcbiAgICAgIGlmIChjb250ZXh0KSBpdGVyYXRvciA9IF8uYmluZChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgICByZXR1cm4gaW5pdGlhbCA/IG9iai5yZWR1Y2UoaXRlcmF0b3IsIG1lbW8pIDogb2JqLnJlZHVjZShpdGVyYXRvcik7XG4gICAgfVxuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmICghaW5pdGlhbCkge1xuICAgICAgICBtZW1vID0gdmFsdWU7XG4gICAgICAgIGluaXRpYWwgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVtbyA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgbWVtbywgdmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoIWluaXRpYWwpIHRocm93IG5ldyBUeXBlRXJyb3IocmVkdWNlRXJyb3IpO1xuICAgIHJldHVybiBtZW1vO1xuICB9O1xuXG4gIC8vIFRoZSByaWdodC1hc3NvY2lhdGl2ZSB2ZXJzaW9uIG9mIHJlZHVjZSwgYWxzbyBrbm93biBhcyBgZm9sZHJgLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgcmVkdWNlUmlnaHRgIGlmIGF2YWlsYWJsZS5cbiAgXy5yZWR1Y2VSaWdodCA9IF8uZm9sZHIgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBtZW1vLCBjb250ZXh0KSB7XG4gICAgdmFyIGluaXRpYWwgPSBhcmd1bWVudHMubGVuZ3RoID4gMjtcbiAgICBpZiAob2JqID09IG51bGwpIG9iaiA9IFtdO1xuICAgIGlmIChuYXRpdmVSZWR1Y2VSaWdodCAmJiBvYmoucmVkdWNlUmlnaHQgPT09IG5hdGl2ZVJlZHVjZVJpZ2h0KSB7XG4gICAgICBpZiAoY29udGV4dCkgaXRlcmF0b3IgPSBfLmJpbmQoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGluaXRpYWwgPyBvYmoucmVkdWNlUmlnaHQoaXRlcmF0b3IsIG1lbW8pIDogb2JqLnJlZHVjZVJpZ2h0KGl0ZXJhdG9yKTtcbiAgICB9XG4gICAgdmFyIGxlbmd0aCA9IG9iai5sZW5ndGg7XG4gICAgaWYgKGxlbmd0aCAhPT0gK2xlbmd0aCkge1xuICAgICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICAgIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIH1cbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpbmRleCA9IGtleXMgPyBrZXlzWy0tbGVuZ3RoXSA6IC0tbGVuZ3RoO1xuICAgICAgaWYgKCFpbml0aWFsKSB7XG4gICAgICAgIG1lbW8gPSBvYmpbaW5kZXhdO1xuICAgICAgICBpbml0aWFsID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lbW8gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG1lbW8sIG9ialtpbmRleF0sIGluZGV4LCBsaXN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoIWluaXRpYWwpIHRocm93IG5ldyBUeXBlRXJyb3IocmVkdWNlRXJyb3IpO1xuICAgIHJldHVybiBtZW1vO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgZmlyc3QgdmFsdWUgd2hpY2ggcGFzc2VzIGEgdHJ1dGggdGVzdC4gQWxpYXNlZCBhcyBgZGV0ZWN0YC5cbiAgXy5maW5kID0gXy5kZXRlY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdDtcbiAgICBhbnkob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpIHtcbiAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgdGhhdCBwYXNzIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGZpbHRlcmAgaWYgYXZhaWxhYmxlLlxuICAvLyBBbGlhc2VkIGFzIGBzZWxlY3RgLlxuICBfLmZpbHRlciA9IF8uc2VsZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0cztcbiAgICBpZiAobmF0aXZlRmlsdGVyICYmIG9iai5maWx0ZXIgPT09IG5hdGl2ZUZpbHRlcikgcmV0dXJuIG9iai5maWx0ZXIoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpIHJlc3VsdHMucHVzaCh2YWx1ZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIGEgdHJ1dGggdGVzdCBmYWlscy5cbiAgXy5yZWplY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXR1cm4gIWl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICB9LCBjb250ZXh0KTtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgd2hldGhlciBhbGwgb2YgdGhlIGVsZW1lbnRzIG1hdGNoIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGV2ZXJ5YCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYGFsbGAuXG4gIF8uZXZlcnkgPSBfLmFsbCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciB8fCAoaXRlcmF0b3IgPSBfLmlkZW50aXR5KTtcbiAgICB2YXIgcmVzdWx0ID0gdHJ1ZTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHQ7XG4gICAgaWYgKG5hdGl2ZUV2ZXJ5ICYmIG9iai5ldmVyeSA9PT0gbmF0aXZlRXZlcnkpIHJldHVybiBvYmouZXZlcnkoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmICghKHJlc3VsdCA9IHJlc3VsdCAmJiBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpKSByZXR1cm4gYnJlYWtlcjtcbiAgICB9KTtcbiAgICByZXR1cm4gISFyZXN1bHQ7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIGF0IGxlYXN0IG9uZSBlbGVtZW50IGluIHRoZSBvYmplY3QgbWF0Y2hlcyBhIHRydXRoIHRlc3QuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBzb21lYCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYGFueWAuXG4gIHZhciBhbnkgPSBfLnNvbWUgPSBfLmFueSA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciB8fCAoaXRlcmF0b3IgPSBfLmlkZW50aXR5KTtcbiAgICB2YXIgcmVzdWx0ID0gZmFsc2U7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0O1xuICAgIGlmIChuYXRpdmVTb21lICYmIG9iai5zb21lID09PSBuYXRpdmVTb21lKSByZXR1cm4gb2JqLnNvbWUoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChyZXN1bHQgfHwgKHJlc3VsdCA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkpIHJldHVybiBicmVha2VyO1xuICAgIH0pO1xuICAgIHJldHVybiAhIXJlc3VsdDtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgaWYgdGhlIGFycmF5IG9yIG9iamVjdCBjb250YWlucyBhIGdpdmVuIHZhbHVlICh1c2luZyBgPT09YCkuXG4gIC8vIEFsaWFzZWQgYXMgYGluY2x1ZGVgLlxuICBfLmNvbnRhaW5zID0gXy5pbmNsdWRlID0gZnVuY3Rpb24ob2JqLCB0YXJnZXQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICBpZiAobmF0aXZlSW5kZXhPZiAmJiBvYmouaW5kZXhPZiA9PT0gbmF0aXZlSW5kZXhPZikgcmV0dXJuIG9iai5pbmRleE9mKHRhcmdldCkgIT0gLTE7XG4gICAgcmV0dXJuIGFueShvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IHRhcmdldDtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBJbnZva2UgYSBtZXRob2QgKHdpdGggYXJndW1lbnRzKSBvbiBldmVyeSBpdGVtIGluIGEgY29sbGVjdGlvbi5cbiAgXy5pbnZva2UgPSBmdW5jdGlvbihvYmosIG1ldGhvZCkge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHZhciBpc0Z1bmMgPSBfLmlzRnVuY3Rpb24obWV0aG9kKTtcbiAgICByZXR1cm4gXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIChpc0Z1bmMgPyBtZXRob2QgOiB2YWx1ZVttZXRob2RdKS5hcHBseSh2YWx1ZSwgYXJncyk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgbWFwYDogZmV0Y2hpbmcgYSBwcm9wZXJ0eS5cbiAgXy5wbHVjayA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUpeyByZXR1cm4gdmFsdWVba2V5XTsgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgZmlsdGVyYDogc2VsZWN0aW5nIG9ubHkgb2JqZWN0c1xuICAvLyBjb250YWluaW5nIHNwZWNpZmljIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLndoZXJlID0gZnVuY3Rpb24ob2JqLCBhdHRycywgZmlyc3QpIHtcbiAgICBpZiAoXy5pc0VtcHR5KGF0dHJzKSkgcmV0dXJuIGZpcnN0ID8gdm9pZCAwIDogW107XG4gICAgcmV0dXJuIF9bZmlyc3QgPyAnZmluZCcgOiAnZmlsdGVyJ10ob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgZm9yICh2YXIga2V5IGluIGF0dHJzKSB7XG4gICAgICAgIGlmIChhdHRyc1trZXldICE9PSB2YWx1ZVtrZXldKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBmaW5kYDogZ2V0dGluZyB0aGUgZmlyc3Qgb2JqZWN0XG4gIC8vIGNvbnRhaW5pbmcgc3BlY2lmaWMgYGtleTp2YWx1ZWAgcGFpcnMuXG4gIF8uZmluZFdoZXJlID0gZnVuY3Rpb24ob2JqLCBhdHRycykge1xuICAgIHJldHVybiBfLndoZXJlKG9iaiwgYXR0cnMsIHRydWUpO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbWF4aW11bSBlbGVtZW50IG9yIChlbGVtZW50LWJhc2VkIGNvbXB1dGF0aW9uKS5cbiAgLy8gQ2FuJ3Qgb3B0aW1pemUgYXJyYXlzIG9mIGludGVnZXJzIGxvbmdlciB0aGFuIDY1LDUzNSBlbGVtZW50cy5cbiAgLy8gU2VlIFtXZWJLaXQgQnVnIDgwNzk3XShodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9ODA3OTcpXG4gIF8ubWF4ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0FycmF5KG9iaikgJiYgb2JqWzBdID09PSArb2JqWzBdICYmIG9iai5sZW5ndGggPCA2NTUzNSkge1xuICAgICAgcmV0dXJuIE1hdGgubWF4LmFwcGx5KE1hdGgsIG9iaik7XG4gICAgfVxuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0VtcHR5KG9iaikpIHJldHVybiAtSW5maW5pdHk7XG4gICAgdmFyIHJlc3VsdCA9IHtjb21wdXRlZCA6IC1JbmZpbml0eSwgdmFsdWU6IC1JbmZpbml0eX07XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgdmFyIGNvbXB1dGVkID0gaXRlcmF0b3IgPyBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkgOiB2YWx1ZTtcbiAgICAgIGNvbXB1dGVkID4gcmVzdWx0LmNvbXB1dGVkICYmIChyZXN1bHQgPSB7dmFsdWUgOiB2YWx1ZSwgY29tcHV0ZWQgOiBjb21wdXRlZH0pO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQudmFsdWU7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBtaW5pbXVtIGVsZW1lbnQgKG9yIGVsZW1lbnQtYmFzZWQgY29tcHV0YXRpb24pLlxuICBfLm1pbiA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNBcnJheShvYmopICYmIG9ialswXSA9PT0gK29ialswXSAmJiBvYmoubGVuZ3RoIDwgNjU1MzUpIHtcbiAgICAgIHJldHVybiBNYXRoLm1pbi5hcHBseShNYXRoLCBvYmopO1xuICAgIH1cbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNFbXB0eShvYmopKSByZXR1cm4gSW5maW5pdHk7XG4gICAgdmFyIHJlc3VsdCA9IHtjb21wdXRlZCA6IEluZmluaXR5LCB2YWx1ZTogSW5maW5pdHl9O1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHZhciBjb21wdXRlZCA9IGl0ZXJhdG9yID8gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpIDogdmFsdWU7XG4gICAgICBjb21wdXRlZCA8IHJlc3VsdC5jb21wdXRlZCAmJiAocmVzdWx0ID0ge3ZhbHVlIDogdmFsdWUsIGNvbXB1dGVkIDogY29tcHV0ZWR9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0LnZhbHVlO1xuICB9O1xuXG4gIC8vIFNodWZmbGUgYW4gYXJyYXksIHVzaW5nIHRoZSBtb2Rlcm4gdmVyc2lvbiBvZiB0aGUgXG4gIC8vIFtGaXNoZXItWWF0ZXMgc2h1ZmZsZV0oaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9GaXNoZXLigJNZYXRlc19zaHVmZmxlKS5cbiAgXy5zaHVmZmxlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHJhbmQ7XG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc2h1ZmZsZWQgPSBbXTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJhbmQgPSBfLnJhbmRvbShpbmRleCsrKTtcbiAgICAgIHNodWZmbGVkW2luZGV4IC0gMV0gPSBzaHVmZmxlZFtyYW5kXTtcbiAgICAgIHNodWZmbGVkW3JhbmRdID0gdmFsdWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHNodWZmbGVkO1xuICB9O1xuXG4gIC8vIFNhbXBsZSAqKm4qKiByYW5kb20gdmFsdWVzIGZyb20gYW4gYXJyYXkuXG4gIC8vIElmICoqbioqIGlzIG5vdCBzcGVjaWZpZWQsIHJldHVybnMgYSBzaW5nbGUgcmFuZG9tIGVsZW1lbnQgZnJvbSB0aGUgYXJyYXkuXG4gIC8vIFRoZSBpbnRlcm5hbCBgZ3VhcmRgIGFyZ3VtZW50IGFsbG93cyBpdCB0byB3b3JrIHdpdGggYG1hcGAuXG4gIF8uc2FtcGxlID0gZnVuY3Rpb24ob2JqLCBuLCBndWFyZCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMiB8fCBndWFyZCkge1xuICAgICAgcmV0dXJuIG9ialtfLnJhbmRvbShvYmoubGVuZ3RoIC0gMSldO1xuICAgIH1cbiAgICByZXR1cm4gXy5zaHVmZmxlKG9iaikuc2xpY2UoMCwgTWF0aC5tYXgoMCwgbikpO1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIHRvIGdlbmVyYXRlIGxvb2t1cCBpdGVyYXRvcnMuXG4gIHZhciBsb29rdXBJdGVyYXRvciA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih2YWx1ZSkgPyB2YWx1ZSA6IGZ1bmN0aW9uKG9iail7IHJldHVybiBvYmpbdmFsdWVdOyB9O1xuICB9O1xuXG4gIC8vIFNvcnQgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbiBwcm9kdWNlZCBieSBhbiBpdGVyYXRvci5cbiAgXy5zb3J0QnkgPSBmdW5jdGlvbihvYmosIHZhbHVlLCBjb250ZXh0KSB7XG4gICAgdmFyIGl0ZXJhdG9yID0gbG9va3VwSXRlcmF0b3IodmFsdWUpO1xuICAgIHJldHVybiBfLnBsdWNrKF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgY3JpdGVyaWE6IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KVxuICAgICAgfTtcbiAgICB9KS5zb3J0KGZ1bmN0aW9uKGxlZnQsIHJpZ2h0KSB7XG4gICAgICB2YXIgYSA9IGxlZnQuY3JpdGVyaWE7XG4gICAgICB2YXIgYiA9IHJpZ2h0LmNyaXRlcmlhO1xuICAgICAgaWYgKGEgIT09IGIpIHtcbiAgICAgICAgaWYgKGEgPiBiIHx8IGEgPT09IHZvaWQgMCkgcmV0dXJuIDE7XG4gICAgICAgIGlmIChhIDwgYiB8fCBiID09PSB2b2lkIDApIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsZWZ0LmluZGV4IC0gcmlnaHQuaW5kZXg7XG4gICAgfSksICd2YWx1ZScpO1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIHVzZWQgZm9yIGFnZ3JlZ2F0ZSBcImdyb3VwIGJ5XCIgb3BlcmF0aW9ucy5cbiAgdmFyIGdyb3VwID0gZnVuY3Rpb24oYmVoYXZpb3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqLCB2YWx1ZSwgY29udGV4dCkge1xuICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgdmFyIGl0ZXJhdG9yID0gdmFsdWUgPT0gbnVsbCA/IF8uaWRlbnRpdHkgOiBsb29rdXBJdGVyYXRvcih2YWx1ZSk7XG4gICAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4KSB7XG4gICAgICAgIHZhciBrZXkgPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgb2JqKTtcbiAgICAgICAgYmVoYXZpb3IocmVzdWx0LCBrZXksIHZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEdyb3VwcyB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uLiBQYXNzIGVpdGhlciBhIHN0cmluZyBhdHRyaWJ1dGVcbiAgLy8gdG8gZ3JvdXAgYnksIG9yIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBjcml0ZXJpb24uXG4gIF8uZ3JvdXBCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwga2V5LCB2YWx1ZSkge1xuICAgIChfLmhhcyhyZXN1bHQsIGtleSkgPyByZXN1bHRba2V5XSA6IChyZXN1bHRba2V5XSA9IFtdKSkucHVzaCh2YWx1ZSk7XG4gIH0pO1xuXG4gIC8vIEluZGV4ZXMgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbiwgc2ltaWxhciB0byBgZ3JvdXBCeWAsIGJ1dCBmb3JcbiAgLy8gd2hlbiB5b3Uga25vdyB0aGF0IHlvdXIgaW5kZXggdmFsdWVzIHdpbGwgYmUgdW5pcXVlLlxuICBfLmluZGV4QnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIGtleSwgdmFsdWUpIHtcbiAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICB9KTtcblxuICAvLyBDb3VudHMgaW5zdGFuY2VzIG9mIGFuIG9iamVjdCB0aGF0IGdyb3VwIGJ5IGEgY2VydGFpbiBjcml0ZXJpb24uIFBhc3NcbiAgLy8gZWl0aGVyIGEgc3RyaW5nIGF0dHJpYnV0ZSB0byBjb3VudCBieSwgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlXG4gIC8vIGNyaXRlcmlvbi5cbiAgXy5jb3VudEJ5ID0gZ3JvdXAoZnVuY3Rpb24ocmVzdWx0LCBrZXkpIHtcbiAgICBfLmhhcyhyZXN1bHQsIGtleSkgPyByZXN1bHRba2V5XSsrIDogcmVzdWx0W2tleV0gPSAxO1xuICB9KTtcblxuICAvLyBVc2UgYSBjb21wYXJhdG9yIGZ1bmN0aW9uIHRvIGZpZ3VyZSBvdXQgdGhlIHNtYWxsZXN0IGluZGV4IGF0IHdoaWNoXG4gIC8vIGFuIG9iamVjdCBzaG91bGQgYmUgaW5zZXJ0ZWQgc28gYXMgdG8gbWFpbnRhaW4gb3JkZXIuIFVzZXMgYmluYXJ5IHNlYXJjaC5cbiAgXy5zb3J0ZWRJbmRleCA9IGZ1bmN0aW9uKGFycmF5LCBvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0b3IgPSBpdGVyYXRvciA9PSBudWxsID8gXy5pZGVudGl0eSA6IGxvb2t1cEl0ZXJhdG9yKGl0ZXJhdG9yKTtcbiAgICB2YXIgdmFsdWUgPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9iaik7XG4gICAgdmFyIGxvdyA9IDAsIGhpZ2ggPSBhcnJheS5sZW5ndGg7XG4gICAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcbiAgICAgIHZhciBtaWQgPSAobG93ICsgaGlnaCkgPj4+IDE7XG4gICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIGFycmF5W21pZF0pIDwgdmFsdWUgPyBsb3cgPSBtaWQgKyAxIDogaGlnaCA9IG1pZDtcbiAgICB9XG4gICAgcmV0dXJuIGxvdztcbiAgfTtcblxuICAvLyBTYWZlbHkgY3JlYXRlIGEgcmVhbCwgbGl2ZSBhcnJheSBmcm9tIGFueXRoaW5nIGl0ZXJhYmxlLlxuICBfLnRvQXJyYXkgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIW9iaikgcmV0dXJuIFtdO1xuICAgIGlmIChfLmlzQXJyYXkob2JqKSkgcmV0dXJuIHNsaWNlLmNhbGwob2JqKTtcbiAgICBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHJldHVybiBfLm1hcChvYmosIF8uaWRlbnRpdHkpO1xuICAgIHJldHVybiBfLnZhbHVlcyhvYmopO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbnVtYmVyIG9mIGVsZW1lbnRzIGluIGFuIG9iamVjdC5cbiAgXy5zaXplID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gMDtcbiAgICByZXR1cm4gKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSA/IG9iai5sZW5ndGggOiBfLmtleXMob2JqKS5sZW5ndGg7XG4gIH07XG5cbiAgLy8gQXJyYXkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEdldCB0aGUgZmlyc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiB0aGUgZmlyc3QgTlxuICAvLyB2YWx1ZXMgaW4gdGhlIGFycmF5LiBBbGlhc2VkIGFzIGBoZWFkYCBhbmQgYHRha2VgLiBUaGUgKipndWFyZCoqIGNoZWNrXG4gIC8vIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5maXJzdCA9IF8uaGVhZCA9IF8udGFrZSA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIHJldHVybiAobiA9PSBudWxsKSB8fCBndWFyZCA/IGFycmF5WzBdIDogc2xpY2UuY2FsbChhcnJheSwgMCwgbik7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBldmVyeXRoaW5nIGJ1dCB0aGUgbGFzdCBlbnRyeSBvZiB0aGUgYXJyYXkuIEVzcGVjaWFsbHkgdXNlZnVsIG9uXG4gIC8vIHRoZSBhcmd1bWVudHMgb2JqZWN0LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIGFsbCB0aGUgdmFsdWVzIGluXG4gIC8vIHRoZSBhcnJheSwgZXhjbHVkaW5nIHRoZSBsYXN0IE4uIFRoZSAqKmd1YXJkKiogY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aFxuICAvLyBgXy5tYXBgLlxuICBfLmluaXRpYWwgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgMCwgYXJyYXkubGVuZ3RoIC0gKChuID09IG51bGwpIHx8IGd1YXJkID8gMSA6IG4pKTtcbiAgfTtcblxuICAvLyBHZXQgdGhlIGxhc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiB0aGUgbGFzdCBOXG4gIC8vIHZhbHVlcyBpbiB0aGUgYXJyYXkuIFRoZSAqKmd1YXJkKiogY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLmxhc3QgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICBpZiAoKG4gPT0gbnVsbCkgfHwgZ3VhcmQpIHtcbiAgICAgIHJldHVybiBhcnJheVthcnJheS5sZW5ndGggLSAxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIE1hdGgubWF4KGFycmF5Lmxlbmd0aCAtIG4sIDApKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gUmV0dXJucyBldmVyeXRoaW5nIGJ1dCB0aGUgZmlyc3QgZW50cnkgb2YgdGhlIGFycmF5LiBBbGlhc2VkIGFzIGB0YWlsYCBhbmQgYGRyb3BgLlxuICAvLyBFc3BlY2lhbGx5IHVzZWZ1bCBvbiB0aGUgYXJndW1lbnRzIG9iamVjdC4gUGFzc2luZyBhbiAqKm4qKiB3aWxsIHJldHVyblxuICAvLyB0aGUgcmVzdCBOIHZhbHVlcyBpbiB0aGUgYXJyYXkuIFRoZSAqKmd1YXJkKipcbiAgLy8gY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLnJlc3QgPSBfLnRhaWwgPSBfLmRyb3AgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgKG4gPT0gbnVsbCkgfHwgZ3VhcmQgPyAxIDogbik7XG4gIH07XG5cbiAgLy8gVHJpbSBvdXQgYWxsIGZhbHN5IHZhbHVlcyBmcm9tIGFuIGFycmF5LlxuICBfLmNvbXBhY3QgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHJldHVybiBfLmZpbHRlcihhcnJheSwgXy5pZGVudGl0eSk7XG4gIH07XG5cbiAgLy8gSW50ZXJuYWwgaW1wbGVtZW50YXRpb24gb2YgYSByZWN1cnNpdmUgYGZsYXR0ZW5gIGZ1bmN0aW9uLlxuICB2YXIgZmxhdHRlbiA9IGZ1bmN0aW9uKGlucHV0LCBzaGFsbG93LCBvdXRwdXQpIHtcbiAgICBpZiAoc2hhbGxvdyAmJiBfLmV2ZXJ5KGlucHV0LCBfLmlzQXJyYXkpKSB7XG4gICAgICByZXR1cm4gY29uY2F0LmFwcGx5KG91dHB1dCwgaW5wdXQpO1xuICAgIH1cbiAgICBlYWNoKGlucHV0LCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgaWYgKF8uaXNBcnJheSh2YWx1ZSkgfHwgXy5pc0FyZ3VtZW50cyh2YWx1ZSkpIHtcbiAgICAgICAgc2hhbGxvdyA/IHB1c2guYXBwbHkob3V0cHV0LCB2YWx1ZSkgOiBmbGF0dGVuKHZhbHVlLCBzaGFsbG93LCBvdXRwdXQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0cHV0LnB1c2godmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBvdXRwdXQ7XG4gIH07XG5cbiAgLy8gRmxhdHRlbiBvdXQgYW4gYXJyYXksIGVpdGhlciByZWN1cnNpdmVseSAoYnkgZGVmYXVsdCksIG9yIGp1c3Qgb25lIGxldmVsLlxuICBfLmZsYXR0ZW4gPSBmdW5jdGlvbihhcnJheSwgc2hhbGxvdykge1xuICAgIHJldHVybiBmbGF0dGVuKGFycmF5LCBzaGFsbG93LCBbXSk7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgdmVyc2lvbiBvZiB0aGUgYXJyYXkgdGhhdCBkb2VzIG5vdCBjb250YWluIHRoZSBzcGVjaWZpZWQgdmFsdWUocykuXG4gIF8ud2l0aG91dCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIF8uZGlmZmVyZW5jZShhcnJheSwgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgfTtcblxuICAvLyBQcm9kdWNlIGEgZHVwbGljYXRlLWZyZWUgdmVyc2lvbiBvZiB0aGUgYXJyYXkuIElmIHRoZSBhcnJheSBoYXMgYWxyZWFkeVxuICAvLyBiZWVuIHNvcnRlZCwgeW91IGhhdmUgdGhlIG9wdGlvbiBvZiB1c2luZyBhIGZhc3RlciBhbGdvcml0aG0uXG4gIC8vIEFsaWFzZWQgYXMgYHVuaXF1ZWAuXG4gIF8udW5pcSA9IF8udW5pcXVlID0gZnVuY3Rpb24oYXJyYXksIGlzU29ydGVkLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmIChfLmlzRnVuY3Rpb24oaXNTb3J0ZWQpKSB7XG4gICAgICBjb250ZXh0ID0gaXRlcmF0b3I7XG4gICAgICBpdGVyYXRvciA9IGlzU29ydGVkO1xuICAgICAgaXNTb3J0ZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGluaXRpYWwgPSBpdGVyYXRvciA/IF8ubWFwKGFycmF5LCBpdGVyYXRvciwgY29udGV4dCkgOiBhcnJheTtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIHZhciBzZWVuID0gW107XG4gICAgZWFjaChpbml0aWFsLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcbiAgICAgIGlmIChpc1NvcnRlZCA/ICghaW5kZXggfHwgc2VlbltzZWVuLmxlbmd0aCAtIDFdICE9PSB2YWx1ZSkgOiAhXy5jb250YWlucyhzZWVuLCB2YWx1ZSkpIHtcbiAgICAgICAgc2Vlbi5wdXNoKHZhbHVlKTtcbiAgICAgICAgcmVzdWx0cy5wdXNoKGFycmF5W2luZGV4XSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIHRoZSB1bmlvbjogZWFjaCBkaXN0aW5jdCBlbGVtZW50IGZyb20gYWxsIG9mXG4gIC8vIHRoZSBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLnVuaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF8udW5pcShfLmZsYXR0ZW4oYXJndW1lbnRzLCB0cnVlKSk7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIGV2ZXJ5IGl0ZW0gc2hhcmVkIGJldHdlZW4gYWxsIHRoZVxuICAvLyBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLmludGVyc2VjdGlvbiA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHJlc3QgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIF8uZmlsdGVyKF8udW5pcShhcnJheSksIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIHJldHVybiBfLmV2ZXJ5KHJlc3QsIGZ1bmN0aW9uKG90aGVyKSB7XG4gICAgICAgIHJldHVybiBfLmluZGV4T2Yob3RoZXIsIGl0ZW0pID49IDA7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBUYWtlIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gb25lIGFycmF5IGFuZCBhIG51bWJlciBvZiBvdGhlciBhcnJheXMuXG4gIC8vIE9ubHkgdGhlIGVsZW1lbnRzIHByZXNlbnQgaW4ganVzdCB0aGUgZmlyc3QgYXJyYXkgd2lsbCByZW1haW4uXG4gIF8uZGlmZmVyZW5jZSA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHJlc3QgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyYXksIGZ1bmN0aW9uKHZhbHVlKXsgcmV0dXJuICFfLmNvbnRhaW5zKHJlc3QsIHZhbHVlKTsgfSk7XG4gIH07XG5cbiAgLy8gWmlwIHRvZ2V0aGVyIG11bHRpcGxlIGxpc3RzIGludG8gYSBzaW5nbGUgYXJyYXkgLS0gZWxlbWVudHMgdGhhdCBzaGFyZVxuICAvLyBhbiBpbmRleCBnbyB0b2dldGhlci5cbiAgXy56aXAgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGVuZ3RoID0gXy5tYXgoXy5wbHVjayhhcmd1bWVudHMsIFwibGVuZ3RoXCIpLmNvbmNhdCgwKSk7XG4gICAgdmFyIHJlc3VsdHMgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICByZXN1bHRzW2ldID0gXy5wbHVjayhhcmd1bWVudHMsICcnICsgaSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIENvbnZlcnRzIGxpc3RzIGludG8gb2JqZWN0cy4gUGFzcyBlaXRoZXIgYSBzaW5nbGUgYXJyYXkgb2YgYFtrZXksIHZhbHVlXWBcbiAgLy8gcGFpcnMsIG9yIHR3byBwYXJhbGxlbCBhcnJheXMgb2YgdGhlIHNhbWUgbGVuZ3RoIC0tIG9uZSBvZiBrZXlzLCBhbmQgb25lIG9mXG4gIC8vIHRoZSBjb3JyZXNwb25kaW5nIHZhbHVlcy5cbiAgXy5vYmplY3QgPSBmdW5jdGlvbihsaXN0LCB2YWx1ZXMpIHtcbiAgICBpZiAobGlzdCA9PSBudWxsKSByZXR1cm4ge307XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodmFsdWVzKSB7XG4gICAgICAgIHJlc3VsdFtsaXN0W2ldXSA9IHZhbHVlc1tpXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdFtsaXN0W2ldWzBdXSA9IGxpc3RbaV1bMV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gSWYgdGhlIGJyb3dzZXIgZG9lc24ndCBzdXBwbHkgdXMgd2l0aCBpbmRleE9mIChJJ20gbG9va2luZyBhdCB5b3UsICoqTVNJRSoqKSxcbiAgLy8gd2UgbmVlZCB0aGlzIGZ1bmN0aW9uLiBSZXR1cm4gdGhlIHBvc2l0aW9uIG9mIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIGFuXG4gIC8vIGl0ZW0gaW4gYW4gYXJyYXksIG9yIC0xIGlmIHRoZSBpdGVtIGlzIG5vdCBpbmNsdWRlZCBpbiB0aGUgYXJyYXkuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBpbmRleE9mYCBpZiBhdmFpbGFibGUuXG4gIC8vIElmIHRoZSBhcnJheSBpcyBsYXJnZSBhbmQgYWxyZWFkeSBpbiBzb3J0IG9yZGVyLCBwYXNzIGB0cnVlYFxuICAvLyBmb3IgKippc1NvcnRlZCoqIHRvIHVzZSBiaW5hcnkgc2VhcmNoLlxuICBfLmluZGV4T2YgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgaXNTb3J0ZWQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIC0xO1xuICAgIHZhciBpID0gMCwgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuICAgIGlmIChpc1NvcnRlZCkge1xuICAgICAgaWYgKHR5cGVvZiBpc1NvcnRlZCA9PSAnbnVtYmVyJykge1xuICAgICAgICBpID0gKGlzU29ydGVkIDwgMCA/IE1hdGgubWF4KDAsIGxlbmd0aCArIGlzU29ydGVkKSA6IGlzU29ydGVkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkgPSBfLnNvcnRlZEluZGV4KGFycmF5LCBpdGVtKTtcbiAgICAgICAgcmV0dXJuIGFycmF5W2ldID09PSBpdGVtID8gaSA6IC0xO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAobmF0aXZlSW5kZXhPZiAmJiBhcnJheS5pbmRleE9mID09PSBuYXRpdmVJbmRleE9mKSByZXR1cm4gYXJyYXkuaW5kZXhPZihpdGVtLCBpc1NvcnRlZCk7XG4gICAgZm9yICg7IGkgPCBsZW5ndGg7IGkrKykgaWYgKGFycmF5W2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH07XG5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGxhc3RJbmRleE9mYCBpZiBhdmFpbGFibGUuXG4gIF8ubGFzdEluZGV4T2YgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgZnJvbSkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gLTE7XG4gICAgdmFyIGhhc0luZGV4ID0gZnJvbSAhPSBudWxsO1xuICAgIGlmIChuYXRpdmVMYXN0SW5kZXhPZiAmJiBhcnJheS5sYXN0SW5kZXhPZiA9PT0gbmF0aXZlTGFzdEluZGV4T2YpIHtcbiAgICAgIHJldHVybiBoYXNJbmRleCA/IGFycmF5Lmxhc3RJbmRleE9mKGl0ZW0sIGZyb20pIDogYXJyYXkubGFzdEluZGV4T2YoaXRlbSk7XG4gICAgfVxuICAgIHZhciBpID0gKGhhc0luZGV4ID8gZnJvbSA6IGFycmF5Lmxlbmd0aCk7XG4gICAgd2hpbGUgKGktLSkgaWYgKGFycmF5W2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH07XG5cbiAgLy8gR2VuZXJhdGUgYW4gaW50ZWdlciBBcnJheSBjb250YWluaW5nIGFuIGFyaXRobWV0aWMgcHJvZ3Jlc3Npb24uIEEgcG9ydCBvZlxuICAvLyB0aGUgbmF0aXZlIFB5dGhvbiBgcmFuZ2UoKWAgZnVuY3Rpb24uIFNlZVxuICAvLyBbdGhlIFB5dGhvbiBkb2N1bWVudGF0aW9uXShodHRwOi8vZG9jcy5weXRob24ub3JnL2xpYnJhcnkvZnVuY3Rpb25zLmh0bWwjcmFuZ2UpLlxuICBfLnJhbmdlID0gZnVuY3Rpb24oc3RhcnQsIHN0b3AsIHN0ZXApIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8PSAxKSB7XG4gICAgICBzdG9wID0gc3RhcnQgfHwgMDtcbiAgICAgIHN0YXJ0ID0gMDtcbiAgICB9XG4gICAgc3RlcCA9IGFyZ3VtZW50c1syXSB8fCAxO1xuXG4gICAgdmFyIGxlbmd0aCA9IE1hdGgubWF4KE1hdGguY2VpbCgoc3RvcCAtIHN0YXJ0KSAvIHN0ZXApLCAwKTtcbiAgICB2YXIgaWR4ID0gMDtcbiAgICB2YXIgcmFuZ2UgPSBuZXcgQXJyYXkobGVuZ3RoKTtcblxuICAgIHdoaWxlKGlkeCA8IGxlbmd0aCkge1xuICAgICAgcmFuZ2VbaWR4KytdID0gc3RhcnQ7XG4gICAgICBzdGFydCArPSBzdGVwO1xuICAgIH1cblxuICAgIHJldHVybiByYW5nZTtcbiAgfTtcblxuICAvLyBGdW5jdGlvbiAoYWhlbSkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJldXNhYmxlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciBwcm90b3R5cGUgc2V0dGluZy5cbiAgdmFyIGN0b3IgPSBmdW5jdGlvbigpe307XG5cbiAgLy8gQ3JlYXRlIGEgZnVuY3Rpb24gYm91bmQgdG8gYSBnaXZlbiBvYmplY3QgKGFzc2lnbmluZyBgdGhpc2AsIGFuZCBhcmd1bWVudHMsXG4gIC8vIG9wdGlvbmFsbHkpLiBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgRnVuY3Rpb24uYmluZGAgaWZcbiAgLy8gYXZhaWxhYmxlLlxuICBfLmJpbmQgPSBmdW5jdGlvbihmdW5jLCBjb250ZXh0KSB7XG4gICAgdmFyIGFyZ3MsIGJvdW5kO1xuICAgIGlmIChuYXRpdmVCaW5kICYmIGZ1bmMuYmluZCA9PT0gbmF0aXZlQmluZCkgcmV0dXJuIG5hdGl2ZUJpbmQuYXBwbHkoZnVuYywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBpZiAoIV8uaXNGdW5jdGlvbihmdW5jKSkgdGhyb3cgbmV3IFR5cGVFcnJvcjtcbiAgICBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBib3VuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIGJvdW5kKSkgcmV0dXJuIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICBjdG9yLnByb3RvdHlwZSA9IGZ1bmMucHJvdG90eXBlO1xuICAgICAgdmFyIHNlbGYgPSBuZXcgY3RvcjtcbiAgICAgIGN0b3IucHJvdG90eXBlID0gbnVsbDtcbiAgICAgIHZhciByZXN1bHQgPSBmdW5jLmFwcGx5KHNlbGYsIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgaWYgKE9iamVjdChyZXN1bHQpID09PSByZXN1bHQpIHJldHVybiByZXN1bHQ7XG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFBhcnRpYWxseSBhcHBseSBhIGZ1bmN0aW9uIGJ5IGNyZWF0aW5nIGEgdmVyc2lvbiB0aGF0IGhhcyBoYWQgc29tZSBvZiBpdHNcbiAgLy8gYXJndW1lbnRzIHByZS1maWxsZWQsIHdpdGhvdXQgY2hhbmdpbmcgaXRzIGR5bmFtaWMgYHRoaXNgIGNvbnRleHQuXG4gIF8ucGFydGlhbCA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEJpbmQgYWxsIG9mIGFuIG9iamVjdCdzIG1ldGhvZHMgdG8gdGhhdCBvYmplY3QuIFVzZWZ1bCBmb3IgZW5zdXJpbmcgdGhhdFxuICAvLyBhbGwgY2FsbGJhY2tzIGRlZmluZWQgb24gYW4gb2JqZWN0IGJlbG9uZyB0byBpdC5cbiAgXy5iaW5kQWxsID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGZ1bmNzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGlmIChmdW5jcy5sZW5ndGggPT09IDApIHRocm93IG5ldyBFcnJvcihcImJpbmRBbGwgbXVzdCBiZSBwYXNzZWQgZnVuY3Rpb24gbmFtZXNcIik7XG4gICAgZWFjaChmdW5jcywgZnVuY3Rpb24oZikgeyBvYmpbZl0gPSBfLmJpbmQob2JqW2ZdLCBvYmopOyB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIE1lbW9pemUgYW4gZXhwZW5zaXZlIGZ1bmN0aW9uIGJ5IHN0b3JpbmcgaXRzIHJlc3VsdHMuXG4gIF8ubWVtb2l6ZSA9IGZ1bmN0aW9uKGZ1bmMsIGhhc2hlcikge1xuICAgIHZhciBtZW1vID0ge307XG4gICAgaGFzaGVyIHx8IChoYXNoZXIgPSBfLmlkZW50aXR5KTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIga2V5ID0gaGFzaGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gXy5oYXMobWVtbywga2V5KSA/IG1lbW9ba2V5XSA6IChtZW1vW2tleV0gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gRGVsYXlzIGEgZnVuY3Rpb24gZm9yIHRoZSBnaXZlbiBudW1iZXIgb2YgbWlsbGlzZWNvbmRzLCBhbmQgdGhlbiBjYWxsc1xuICAvLyBpdCB3aXRoIHRoZSBhcmd1bWVudHMgc3VwcGxpZWQuXG4gIF8uZGVsYXkgPSBmdW5jdGlvbihmdW5jLCB3YWl0KSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgcmV0dXJuIGZ1bmMuYXBwbHkobnVsbCwgYXJncyk7IH0sIHdhaXQpO1xuICB9O1xuXG4gIC8vIERlZmVycyBhIGZ1bmN0aW9uLCBzY2hlZHVsaW5nIGl0IHRvIHJ1biBhZnRlciB0aGUgY3VycmVudCBjYWxsIHN0YWNrIGhhc1xuICAvLyBjbGVhcmVkLlxuICBfLmRlZmVyID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHJldHVybiBfLmRlbGF5LmFwcGx5KF8sIFtmdW5jLCAxXS5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKSk7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCB3aGVuIGludm9rZWQsIHdpbGwgb25seSBiZSB0cmlnZ2VyZWQgYXQgbW9zdCBvbmNlXG4gIC8vIGR1cmluZyBhIGdpdmVuIHdpbmRvdyBvZiB0aW1lLiBOb3JtYWxseSwgdGhlIHRocm90dGxlZCBmdW5jdGlvbiB3aWxsIHJ1blxuICAvLyBhcyBtdWNoIGFzIGl0IGNhbiwgd2l0aG91dCBldmVyIGdvaW5nIG1vcmUgdGhhbiBvbmNlIHBlciBgd2FpdGAgZHVyYXRpb247XG4gIC8vIGJ1dCBpZiB5b3UnZCBsaWtlIHRvIGRpc2FibGUgdGhlIGV4ZWN1dGlvbiBvbiB0aGUgbGVhZGluZyBlZGdlLCBwYXNzXG4gIC8vIGB7bGVhZGluZzogZmFsc2V9YC4gVG8gZGlzYWJsZSBleGVjdXRpb24gb24gdGhlIHRyYWlsaW5nIGVkZ2UsIGRpdHRvLlxuICBfLnRocm90dGxlID0gZnVuY3Rpb24oZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICAgIHZhciBjb250ZXh0LCBhcmdzLCByZXN1bHQ7XG4gICAgdmFyIHRpbWVvdXQgPSBudWxsO1xuICAgIHZhciBwcmV2aW91cyA9IDA7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHByZXZpb3VzID0gb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSA/IDAgOiBuZXcgRGF0ZTtcbiAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBub3cgPSBuZXcgRGF0ZTtcbiAgICAgIGlmICghcHJldmlvdXMgJiYgb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSkgcHJldmlvdXMgPSBub3c7XG4gICAgICB2YXIgcmVtYWluaW5nID0gd2FpdCAtIChub3cgLSBwcmV2aW91cyk7XG4gICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBpZiAocmVtYWluaW5nIDw9IDApIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgcHJldmlvdXMgPSBub3c7XG4gICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICB9IGVsc2UgaWYgKCF0aW1lb3V0ICYmIG9wdGlvbnMudHJhaWxpbmcgIT09IGZhbHNlKSB7XG4gICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCByZW1haW5pbmcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgYXMgbG9uZyBhcyBpdCBjb250aW51ZXMgdG8gYmUgaW52b2tlZCwgd2lsbCBub3RcbiAgLy8gYmUgdHJpZ2dlcmVkLiBUaGUgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgaXQgc3RvcHMgYmVpbmcgY2FsbGVkIGZvclxuICAvLyBOIG1pbGxpc2Vjb25kcy4gSWYgYGltbWVkaWF0ZWAgaXMgcGFzc2VkLCB0cmlnZ2VyIHRoZSBmdW5jdGlvbiBvbiB0aGVcbiAgLy8gbGVhZGluZyBlZGdlLCBpbnN0ZWFkIG9mIHRoZSB0cmFpbGluZy5cbiAgXy5kZWJvdW5jZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuICAgIHZhciB0aW1lb3V0LCBhcmdzLCBjb250ZXh0LCB0aW1lc3RhbXAsIHJlc3VsdDtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpO1xuICAgICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBsYXN0ID0gKG5ldyBEYXRlKCkpIC0gdGltZXN0YW1wO1xuICAgICAgICBpZiAobGFzdCA8IHdhaXQpIHtcbiAgICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCAtIGxhc3QpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgIGlmICghaW1tZWRpYXRlKSByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgdmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG4gICAgICBpZiAoIXRpbWVvdXQpIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuICAgICAgfVxuICAgICAgaWYgKGNhbGxOb3cpIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBleGVjdXRlZCBhdCBtb3N0IG9uZSB0aW1lLCBubyBtYXR0ZXIgaG93XG4gIC8vIG9mdGVuIHlvdSBjYWxsIGl0LiBVc2VmdWwgZm9yIGxhenkgaW5pdGlhbGl6YXRpb24uXG4gIF8ub25jZSA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgcmFuID0gZmFsc2UsIG1lbW87XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHJhbikgcmV0dXJuIG1lbW87XG4gICAgICByYW4gPSB0cnVlO1xuICAgICAgbWVtbyA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIGZ1bmMgPSBudWxsO1xuICAgICAgcmV0dXJuIG1lbW87XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIHRoZSBmaXJzdCBmdW5jdGlvbiBwYXNzZWQgYXMgYW4gYXJndW1lbnQgdG8gdGhlIHNlY29uZCxcbiAgLy8gYWxsb3dpbmcgeW91IHRvIGFkanVzdCBhcmd1bWVudHMsIHJ1biBjb2RlIGJlZm9yZSBhbmQgYWZ0ZXIsIGFuZFxuICAvLyBjb25kaXRpb25hbGx5IGV4ZWN1dGUgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uLlxuICBfLndyYXAgPSBmdW5jdGlvbihmdW5jLCB3cmFwcGVyKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MgPSBbZnVuY107XG4gICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gd3JhcHBlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGlzIHRoZSBjb21wb3NpdGlvbiBvZiBhIGxpc3Qgb2YgZnVuY3Rpb25zLCBlYWNoXG4gIC8vIGNvbnN1bWluZyB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBmdW5jdGlvbiB0aGF0IGZvbGxvd3MuXG4gIF8uY29tcG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmdW5jcyA9IGFyZ3VtZW50cztcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGZvciAodmFyIGkgPSBmdW5jcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBhcmdzID0gW2Z1bmNzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcmdzWzBdO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBvbmx5IGJlIGV4ZWN1dGVkIGFmdGVyIGJlaW5nIGNhbGxlZCBOIHRpbWVzLlxuICBfLmFmdGVyID0gZnVuY3Rpb24odGltZXMsIGZ1bmMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoLS10aW1lcyA8IDEpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICB9O1xuICB9O1xuXG4gIC8vIE9iamVjdCBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJldHJpZXZlIHRoZSBuYW1lcyBvZiBhbiBvYmplY3QncyBwcm9wZXJ0aWVzLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgT2JqZWN0LmtleXNgXG4gIF8ua2V5cyA9IG5hdGl2ZUtleXMgfHwgZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiAhPT0gT2JqZWN0KG9iaikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgb2JqZWN0Jyk7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgICByZXR1cm4ga2V5cztcbiAgfTtcblxuICAvLyBSZXRyaWV2ZSB0aGUgdmFsdWVzIG9mIGFuIG9iamVjdCdzIHByb3BlcnRpZXMuXG4gIF8udmFsdWVzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgdmFyIHZhbHVlcyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhbHVlc1tpXSA9IG9ialtrZXlzW2ldXTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlcztcbiAgfTtcblxuICAvLyBDb252ZXJ0IGFuIG9iamVjdCBpbnRvIGEgbGlzdCBvZiBgW2tleSwgdmFsdWVdYCBwYWlycy5cbiAgXy5wYWlycyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgdmFyIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIHZhciBwYWlycyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHBhaXJzW2ldID0gW2tleXNbaV0sIG9ialtrZXlzW2ldXV07XG4gICAgfVxuICAgIHJldHVybiBwYWlycztcbiAgfTtcblxuICAvLyBJbnZlcnQgdGhlIGtleXMgYW5kIHZhbHVlcyBvZiBhbiBvYmplY3QuIFRoZSB2YWx1ZXMgbXVzdCBiZSBzZXJpYWxpemFibGUuXG4gIF8uaW52ZXJ0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc3VsdFtvYmpba2V5c1tpXV1dID0ga2V5c1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBzb3J0ZWQgbGlzdCBvZiB0aGUgZnVuY3Rpb24gbmFtZXMgYXZhaWxhYmxlIG9uIHRoZSBvYmplY3QuXG4gIC8vIEFsaWFzZWQgYXMgYG1ldGhvZHNgXG4gIF8uZnVuY3Rpb25zID0gXy5tZXRob2RzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIG5hbWVzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgaWYgKF8uaXNGdW5jdGlvbihvYmpba2V5XSkpIG5hbWVzLnB1c2goa2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIG5hbWVzLnNvcnQoKTtcbiAgfTtcblxuICAvLyBFeHRlbmQgYSBnaXZlbiBvYmplY3Qgd2l0aCBhbGwgdGhlIHByb3BlcnRpZXMgaW4gcGFzc2VkLWluIG9iamVjdChzKS5cbiAgXy5leHRlbmQgPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBjb3B5IG9mIHRoZSBvYmplY3Qgb25seSBjb250YWluaW5nIHRoZSB3aGl0ZWxpc3RlZCBwcm9wZXJ0aWVzLlxuICBfLnBpY2sgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29weSA9IHt9O1xuICAgIHZhciBrZXlzID0gY29uY2F0LmFwcGx5KEFycmF5UHJvdG8sIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgZWFjaChrZXlzLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmIChrZXkgaW4gb2JqKSBjb3B5W2tleV0gPSBvYmpba2V5XTtcbiAgICB9KTtcbiAgICByZXR1cm4gY29weTtcbiAgfTtcblxuICAgLy8gUmV0dXJuIGEgY29weSBvZiB0aGUgb2JqZWN0IHdpdGhvdXQgdGhlIGJsYWNrbGlzdGVkIHByb3BlcnRpZXMuXG4gIF8ub21pdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBjb3B5ID0ge307XG4gICAgdmFyIGtleXMgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICBpZiAoIV8uY29udGFpbnMoa2V5cywga2V5KSkgY29weVtrZXldID0gb2JqW2tleV07XG4gICAgfVxuICAgIHJldHVybiBjb3B5O1xuICB9O1xuXG4gIC8vIEZpbGwgaW4gYSBnaXZlbiBvYmplY3Qgd2l0aCBkZWZhdWx0IHByb3BlcnRpZXMuXG4gIF8uZGVmYXVsdHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgaWYgKG9ialtwcm9wXSA9PT0gdm9pZCAwKSBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIENyZWF0ZSBhIChzaGFsbG93LWNsb25lZCkgZHVwbGljYXRlIG9mIGFuIG9iamVjdC5cbiAgXy5jbG9uZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghXy5pc09iamVjdChvYmopKSByZXR1cm4gb2JqO1xuICAgIHJldHVybiBfLmlzQXJyYXkob2JqKSA/IG9iai5zbGljZSgpIDogXy5leHRlbmQoe30sIG9iaik7XG4gIH07XG5cbiAgLy8gSW52b2tlcyBpbnRlcmNlcHRvciB3aXRoIHRoZSBvYmosIGFuZCB0aGVuIHJldHVybnMgb2JqLlxuICAvLyBUaGUgcHJpbWFyeSBwdXJwb3NlIG9mIHRoaXMgbWV0aG9kIGlzIHRvIFwidGFwIGludG9cIiBhIG1ldGhvZCBjaGFpbiwgaW5cbiAgLy8gb3JkZXIgdG8gcGVyZm9ybSBvcGVyYXRpb25zIG9uIGludGVybWVkaWF0ZSByZXN1bHRzIHdpdGhpbiB0aGUgY2hhaW4uXG4gIF8udGFwID0gZnVuY3Rpb24ob2JqLCBpbnRlcmNlcHRvcikge1xuICAgIGludGVyY2VwdG9yKG9iaik7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBJbnRlcm5hbCByZWN1cnNpdmUgY29tcGFyaXNvbiBmdW5jdGlvbiBmb3IgYGlzRXF1YWxgLlxuICB2YXIgZXEgPSBmdW5jdGlvbihhLCBiLCBhU3RhY2ssIGJTdGFjaykge1xuICAgIC8vIElkZW50aWNhbCBvYmplY3RzIGFyZSBlcXVhbC4gYDAgPT09IC0wYCwgYnV0IHRoZXkgYXJlbid0IGlkZW50aWNhbC5cbiAgICAvLyBTZWUgdGhlIFtIYXJtb255IGBlZ2FsYCBwcm9wb3NhbF0oaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9aGFybW9ueTplZ2FsKS5cbiAgICBpZiAoYSA9PT0gYikgcmV0dXJuIGEgIT09IDAgfHwgMSAvIGEgPT0gMSAvIGI7XG4gICAgLy8gQSBzdHJpY3QgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnkgYmVjYXVzZSBgbnVsbCA9PSB1bmRlZmluZWRgLlxuICAgIGlmIChhID09IG51bGwgfHwgYiA9PSBudWxsKSByZXR1cm4gYSA9PT0gYjtcbiAgICAvLyBVbndyYXAgYW55IHdyYXBwZWQgb2JqZWN0cy5cbiAgICBpZiAoYSBpbnN0YW5jZW9mIF8pIGEgPSBhLl93cmFwcGVkO1xuICAgIGlmIChiIGluc3RhbmNlb2YgXykgYiA9IGIuX3dyYXBwZWQ7XG4gICAgLy8gQ29tcGFyZSBgW1tDbGFzc11dYCBuYW1lcy5cbiAgICB2YXIgY2xhc3NOYW1lID0gdG9TdHJpbmcuY2FsbChhKTtcbiAgICBpZiAoY2xhc3NOYW1lICE9IHRvU3RyaW5nLmNhbGwoYikpIHJldHVybiBmYWxzZTtcbiAgICBzd2l0Y2ggKGNsYXNzTmFtZSkge1xuICAgICAgLy8gU3RyaW5ncywgbnVtYmVycywgZGF0ZXMsIGFuZCBib29sZWFucyBhcmUgY29tcGFyZWQgYnkgdmFsdWUuXG4gICAgICBjYXNlICdbb2JqZWN0IFN0cmluZ10nOlxuICAgICAgICAvLyBQcmltaXRpdmVzIGFuZCB0aGVpciBjb3JyZXNwb25kaW5nIG9iamVjdCB3cmFwcGVycyBhcmUgZXF1aXZhbGVudDsgdGh1cywgYFwiNVwiYCBpc1xuICAgICAgICAvLyBlcXVpdmFsZW50IHRvIGBuZXcgU3RyaW5nKFwiNVwiKWAuXG4gICAgICAgIHJldHVybiBhID09IFN0cmluZyhiKTtcbiAgICAgIGNhc2UgJ1tvYmplY3QgTnVtYmVyXSc6XG4gICAgICAgIC8vIGBOYU5gcyBhcmUgZXF1aXZhbGVudCwgYnV0IG5vbi1yZWZsZXhpdmUuIEFuIGBlZ2FsYCBjb21wYXJpc29uIGlzIHBlcmZvcm1lZCBmb3JcbiAgICAgICAgLy8gb3RoZXIgbnVtZXJpYyB2YWx1ZXMuXG4gICAgICAgIHJldHVybiBhICE9ICthID8gYiAhPSArYiA6IChhID09IDAgPyAxIC8gYSA9PSAxIC8gYiA6IGEgPT0gK2IpO1xuICAgICAgY2FzZSAnW29iamVjdCBEYXRlXSc6XG4gICAgICBjYXNlICdbb2JqZWN0IEJvb2xlYW5dJzpcbiAgICAgICAgLy8gQ29lcmNlIGRhdGVzIGFuZCBib29sZWFucyB0byBudW1lcmljIHByaW1pdGl2ZSB2YWx1ZXMuIERhdGVzIGFyZSBjb21wYXJlZCBieSB0aGVpclxuICAgICAgICAvLyBtaWxsaXNlY29uZCByZXByZXNlbnRhdGlvbnMuIE5vdGUgdGhhdCBpbnZhbGlkIGRhdGVzIHdpdGggbWlsbGlzZWNvbmQgcmVwcmVzZW50YXRpb25zXG4gICAgICAgIC8vIG9mIGBOYU5gIGFyZSBub3QgZXF1aXZhbGVudC5cbiAgICAgICAgcmV0dXJuICthID09ICtiO1xuICAgICAgLy8gUmVnRXhwcyBhcmUgY29tcGFyZWQgYnkgdGhlaXIgc291cmNlIHBhdHRlcm5zIGFuZCBmbGFncy5cbiAgICAgIGNhc2UgJ1tvYmplY3QgUmVnRXhwXSc6XG4gICAgICAgIHJldHVybiBhLnNvdXJjZSA9PSBiLnNvdXJjZSAmJlxuICAgICAgICAgICAgICAgYS5nbG9iYWwgPT0gYi5nbG9iYWwgJiZcbiAgICAgICAgICAgICAgIGEubXVsdGlsaW5lID09IGIubXVsdGlsaW5lICYmXG4gICAgICAgICAgICAgICBhLmlnbm9yZUNhc2UgPT0gYi5pZ25vcmVDYXNlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGEgIT0gJ29iamVjdCcgfHwgdHlwZW9mIGIgIT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcbiAgICAvLyBBc3N1bWUgZXF1YWxpdHkgZm9yIGN5Y2xpYyBzdHJ1Y3R1cmVzLiBUaGUgYWxnb3JpdGhtIGZvciBkZXRlY3RpbmcgY3ljbGljXG4gICAgLy8gc3RydWN0dXJlcyBpcyBhZGFwdGVkIGZyb20gRVMgNS4xIHNlY3Rpb24gMTUuMTIuMywgYWJzdHJhY3Qgb3BlcmF0aW9uIGBKT2AuXG4gICAgdmFyIGxlbmd0aCA9IGFTdGFjay5sZW5ndGg7XG4gICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAvLyBMaW5lYXIgc2VhcmNoLiBQZXJmb3JtYW5jZSBpcyBpbnZlcnNlbHkgcHJvcG9ydGlvbmFsIHRvIHRoZSBudW1iZXIgb2ZcbiAgICAgIC8vIHVuaXF1ZSBuZXN0ZWQgc3RydWN0dXJlcy5cbiAgICAgIGlmIChhU3RhY2tbbGVuZ3RoXSA9PSBhKSByZXR1cm4gYlN0YWNrW2xlbmd0aF0gPT0gYjtcbiAgICB9XG4gICAgLy8gT2JqZWN0cyB3aXRoIGRpZmZlcmVudCBjb25zdHJ1Y3RvcnMgYXJlIG5vdCBlcXVpdmFsZW50LCBidXQgYE9iamVjdGBzXG4gICAgLy8gZnJvbSBkaWZmZXJlbnQgZnJhbWVzIGFyZS5cbiAgICB2YXIgYUN0b3IgPSBhLmNvbnN0cnVjdG9yLCBiQ3RvciA9IGIuY29uc3RydWN0b3I7XG4gICAgaWYgKGFDdG9yICE9PSBiQ3RvciAmJiAhKF8uaXNGdW5jdGlvbihhQ3RvcikgJiYgKGFDdG9yIGluc3RhbmNlb2YgYUN0b3IpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uaXNGdW5jdGlvbihiQ3RvcikgJiYgKGJDdG9yIGluc3RhbmNlb2YgYkN0b3IpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBBZGQgdGhlIGZpcnN0IG9iamVjdCB0byB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgYVN0YWNrLnB1c2goYSk7XG4gICAgYlN0YWNrLnB1c2goYik7XG4gICAgdmFyIHNpemUgPSAwLCByZXN1bHQgPSB0cnVlO1xuICAgIC8vIFJlY3Vyc2l2ZWx5IGNvbXBhcmUgb2JqZWN0cyBhbmQgYXJyYXlzLlxuICAgIGlmIChjbGFzc05hbWUgPT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgLy8gQ29tcGFyZSBhcnJheSBsZW5ndGhzIHRvIGRldGVybWluZSBpZiBhIGRlZXAgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnkuXG4gICAgICBzaXplID0gYS5sZW5ndGg7XG4gICAgICByZXN1bHQgPSBzaXplID09IGIubGVuZ3RoO1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAvLyBEZWVwIGNvbXBhcmUgdGhlIGNvbnRlbnRzLCBpZ25vcmluZyBub24tbnVtZXJpYyBwcm9wZXJ0aWVzLlxuICAgICAgICB3aGlsZSAoc2l6ZS0tKSB7XG4gICAgICAgICAgaWYgKCEocmVzdWx0ID0gZXEoYVtzaXplXSwgYltzaXplXSwgYVN0YWNrLCBiU3RhY2spKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRGVlcCBjb21wYXJlIG9iamVjdHMuXG4gICAgICBmb3IgKHZhciBrZXkgaW4gYSkge1xuICAgICAgICBpZiAoXy5oYXMoYSwga2V5KSkge1xuICAgICAgICAgIC8vIENvdW50IHRoZSBleHBlY3RlZCBudW1iZXIgb2YgcHJvcGVydGllcy5cbiAgICAgICAgICBzaXplKys7XG4gICAgICAgICAgLy8gRGVlcCBjb21wYXJlIGVhY2ggbWVtYmVyLlxuICAgICAgICAgIGlmICghKHJlc3VsdCA9IF8uaGFzKGIsIGtleSkgJiYgZXEoYVtrZXldLCBiW2tleV0sIGFTdGFjaywgYlN0YWNrKSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBFbnN1cmUgdGhhdCBib3RoIG9iamVjdHMgY29udGFpbiB0aGUgc2FtZSBudW1iZXIgb2YgcHJvcGVydGllcy5cbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgZm9yIChrZXkgaW4gYikge1xuICAgICAgICAgIGlmIChfLmhhcyhiLCBrZXkpICYmICEoc2l6ZS0tKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID0gIXNpemU7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFJlbW92ZSB0aGUgZmlyc3Qgb2JqZWN0IGZyb20gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgIGFTdGFjay5wb3AoKTtcbiAgICBiU3RhY2sucG9wKCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBQZXJmb3JtIGEgZGVlcCBjb21wYXJpc29uIHRvIGNoZWNrIGlmIHR3byBvYmplY3RzIGFyZSBlcXVhbC5cbiAgXy5pc0VxdWFsID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBlcShhLCBiLCBbXSwgW10pO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gYXJyYXksIHN0cmluZywgb3Igb2JqZWN0IGVtcHR5P1xuICAvLyBBbiBcImVtcHR5XCIgb2JqZWN0IGhhcyBubyBlbnVtZXJhYmxlIG93bi1wcm9wZXJ0aWVzLlxuICBfLmlzRW1wdHkgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiB0cnVlO1xuICAgIGlmIChfLmlzQXJyYXkob2JqKSB8fCBfLmlzU3RyaW5nKG9iaikpIHJldHVybiBvYmoubGVuZ3RoID09PSAwO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGEgRE9NIGVsZW1lbnQ/XG4gIF8uaXNFbGVtZW50ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuICEhKG9iaiAmJiBvYmoubm9kZVR5cGUgPT09IDEpO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYW4gYXJyYXk/XG4gIC8vIERlbGVnYXRlcyB0byBFQ01BNSdzIG5hdGl2ZSBBcnJheS5pc0FycmF5XG4gIF8uaXNBcnJheSA9IG5hdGl2ZUlzQXJyYXkgfHwgZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBBcnJheV0nO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFyaWFibGUgYW4gb2JqZWN0P1xuICBfLmlzT2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gT2JqZWN0KG9iaik7XG4gIH07XG5cbiAgLy8gQWRkIHNvbWUgaXNUeXBlIG1ldGhvZHM6IGlzQXJndW1lbnRzLCBpc0Z1bmN0aW9uLCBpc1N0cmluZywgaXNOdW1iZXIsIGlzRGF0ZSwgaXNSZWdFeHAuXG4gIGVhY2goWydBcmd1bWVudHMnLCAnRnVuY3Rpb24nLCAnU3RyaW5nJywgJ051bWJlcicsICdEYXRlJywgJ1JlZ0V4cCddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgX1snaXMnICsgbmFtZV0gPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgJyArIG5hbWUgKyAnXSc7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gRGVmaW5lIGEgZmFsbGJhY2sgdmVyc2lvbiBvZiB0aGUgbWV0aG9kIGluIGJyb3dzZXJzIChhaGVtLCBJRSksIHdoZXJlXG4gIC8vIHRoZXJlIGlzbid0IGFueSBpbnNwZWN0YWJsZSBcIkFyZ3VtZW50c1wiIHR5cGUuXG4gIGlmICghXy5pc0FyZ3VtZW50cyhhcmd1bWVudHMpKSB7XG4gICAgXy5pc0FyZ3VtZW50cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuICEhKG9iaiAmJiBfLmhhcyhvYmosICdjYWxsZWUnKSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIE9wdGltaXplIGBpc0Z1bmN0aW9uYCBpZiBhcHByb3ByaWF0ZS5cbiAgaWYgKHR5cGVvZiAoLy4vKSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIF8uaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbic7XG4gICAgfTtcbiAgfVxuXG4gIC8vIElzIGEgZ2l2ZW4gb2JqZWN0IGEgZmluaXRlIG51bWJlcj9cbiAgXy5pc0Zpbml0ZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBpc0Zpbml0ZShvYmopICYmICFpc05hTihwYXJzZUZsb2F0KG9iaikpO1xuICB9O1xuXG4gIC8vIElzIHRoZSBnaXZlbiB2YWx1ZSBgTmFOYD8gKE5hTiBpcyB0aGUgb25seSBudW1iZXIgd2hpY2ggZG9lcyBub3QgZXF1YWwgaXRzZWxmKS5cbiAgXy5pc05hTiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBfLmlzTnVtYmVyKG9iaikgJiYgb2JqICE9ICtvYmo7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhIGJvb2xlYW4/XG4gIF8uaXNCb29sZWFuID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdHJ1ZSB8fCBvYmogPT09IGZhbHNlIHx8IHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBCb29sZWFuXSc7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBlcXVhbCB0byBudWxsP1xuICBfLmlzTnVsbCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IG51bGw7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YXJpYWJsZSB1bmRlZmluZWQ/XG4gIF8uaXNVbmRlZmluZWQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSB2b2lkIDA7XG4gIH07XG5cbiAgLy8gU2hvcnRjdXQgZnVuY3Rpb24gZm9yIGNoZWNraW5nIGlmIGFuIG9iamVjdCBoYXMgYSBnaXZlbiBwcm9wZXJ0eSBkaXJlY3RseVxuICAvLyBvbiBpdHNlbGYgKGluIG90aGVyIHdvcmRzLCBub3Qgb24gYSBwcm90b3R5cGUpLlxuICBfLmhhcyA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpO1xuICB9O1xuXG4gIC8vIFV0aWxpdHkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUnVuIFVuZGVyc2NvcmUuanMgaW4gKm5vQ29uZmxpY3QqIG1vZGUsIHJldHVybmluZyB0aGUgYF9gIHZhcmlhYmxlIHRvIGl0c1xuICAvLyBwcmV2aW91cyBvd25lci4gUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8ubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgIHJvb3QuXyA9IHByZXZpb3VzVW5kZXJzY29yZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvLyBLZWVwIHRoZSBpZGVudGl0eSBmdW5jdGlvbiBhcm91bmQgZm9yIGRlZmF1bHQgaXRlcmF0b3JzLlxuICBfLmlkZW50aXR5ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG5cbiAgLy8gUnVuIGEgZnVuY3Rpb24gKipuKiogdGltZXMuXG4gIF8udGltZXMgPSBmdW5jdGlvbihuLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciBhY2N1bSA9IEFycmF5KE1hdGgubWF4KDAsIG4pKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykgYWNjdW1baV0gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIGkpO1xuICAgIHJldHVybiBhY2N1bTtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIG1pbiBhbmQgbWF4IChpbmNsdXNpdmUpLlxuICBfLnJhbmRvbSA9IGZ1bmN0aW9uKG1pbiwgbWF4KSB7XG4gICAgaWYgKG1heCA9PSBudWxsKSB7XG4gICAgICBtYXggPSBtaW47XG4gICAgICBtaW4gPSAwO1xuICAgIH1cbiAgICByZXR1cm4gbWluICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKTtcbiAgfTtcblxuICAvLyBMaXN0IG9mIEhUTUwgZW50aXRpZXMgZm9yIGVzY2FwaW5nLlxuICB2YXIgZW50aXR5TWFwID0ge1xuICAgIGVzY2FwZToge1xuICAgICAgJyYnOiAnJmFtcDsnLFxuICAgICAgJzwnOiAnJmx0OycsXG4gICAgICAnPic6ICcmZ3Q7JyxcbiAgICAgICdcIic6ICcmcXVvdDsnLFxuICAgICAgXCInXCI6ICcmI3gyNzsnXG4gICAgfVxuICB9O1xuICBlbnRpdHlNYXAudW5lc2NhcGUgPSBfLmludmVydChlbnRpdHlNYXAuZXNjYXBlKTtcblxuICAvLyBSZWdleGVzIGNvbnRhaW5pbmcgdGhlIGtleXMgYW5kIHZhbHVlcyBsaXN0ZWQgaW1tZWRpYXRlbHkgYWJvdmUuXG4gIHZhciBlbnRpdHlSZWdleGVzID0ge1xuICAgIGVzY2FwZTogICBuZXcgUmVnRXhwKCdbJyArIF8ua2V5cyhlbnRpdHlNYXAuZXNjYXBlKS5qb2luKCcnKSArICddJywgJ2cnKSxcbiAgICB1bmVzY2FwZTogbmV3IFJlZ0V4cCgnKCcgKyBfLmtleXMoZW50aXR5TWFwLnVuZXNjYXBlKS5qb2luKCd8JykgKyAnKScsICdnJylcbiAgfTtcblxuICAvLyBGdW5jdGlvbnMgZm9yIGVzY2FwaW5nIGFuZCB1bmVzY2FwaW5nIHN0cmluZ3MgdG8vZnJvbSBIVE1MIGludGVycG9sYXRpb24uXG4gIF8uZWFjaChbJ2VzY2FwZScsICd1bmVzY2FwZSddLCBmdW5jdGlvbihtZXRob2QpIHtcbiAgICBfW21ldGhvZF0gPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgIGlmIChzdHJpbmcgPT0gbnVsbCkgcmV0dXJuICcnO1xuICAgICAgcmV0dXJuICgnJyArIHN0cmluZykucmVwbGFjZShlbnRpdHlSZWdleGVzW21ldGhvZF0sIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiBlbnRpdHlNYXBbbWV0aG9kXVttYXRjaF07XG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcblxuICAvLyBJZiB0aGUgdmFsdWUgb2YgdGhlIG5hbWVkIGBwcm9wZXJ0eWAgaXMgYSBmdW5jdGlvbiB0aGVuIGludm9rZSBpdCB3aXRoIHRoZVxuICAvLyBgb2JqZWN0YCBhcyBjb250ZXh0OyBvdGhlcndpc2UsIHJldHVybiBpdC5cbiAgXy5yZXN1bHQgPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgaWYgKG9iamVjdCA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIHZhciB2YWx1ZSA9IG9iamVjdFtwcm9wZXJ0eV07XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih2YWx1ZSkgPyB2YWx1ZS5jYWxsKG9iamVjdCkgOiB2YWx1ZTtcbiAgfTtcblxuICAvLyBBZGQgeW91ciBvd24gY3VzdG9tIGZ1bmN0aW9ucyB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8ubWl4aW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKF8uZnVuY3Rpb25zKG9iaiksIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHZhciBmdW5jID0gX1tuYW1lXSA9IG9ialtuYW1lXTtcbiAgICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhcmdzID0gW3RoaXMuX3dyYXBwZWRdO1xuICAgICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBmdW5jLmFwcGx5KF8sIGFyZ3MpKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gR2VuZXJhdGUgYSB1bmlxdWUgaW50ZWdlciBpZCAodW5pcXVlIHdpdGhpbiB0aGUgZW50aXJlIGNsaWVudCBzZXNzaW9uKS5cbiAgLy8gVXNlZnVsIGZvciB0ZW1wb3JhcnkgRE9NIGlkcy5cbiAgdmFyIGlkQ291bnRlciA9IDA7XG4gIF8udW5pcXVlSWQgPSBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICB2YXIgaWQgPSArK2lkQ291bnRlciArICcnO1xuICAgIHJldHVybiBwcmVmaXggPyBwcmVmaXggKyBpZCA6IGlkO1xuICB9O1xuXG4gIC8vIEJ5IGRlZmF1bHQsIFVuZGVyc2NvcmUgdXNlcyBFUkItc3R5bGUgdGVtcGxhdGUgZGVsaW1pdGVycywgY2hhbmdlIHRoZVxuICAvLyBmb2xsb3dpbmcgdGVtcGxhdGUgc2V0dGluZ3MgdG8gdXNlIGFsdGVybmF0aXZlIGRlbGltaXRlcnMuXG4gIF8udGVtcGxhdGVTZXR0aW5ncyA9IHtcbiAgICBldmFsdWF0ZSAgICA6IC88JShbXFxzXFxTXSs/KSU+L2csXG4gICAgaW50ZXJwb2xhdGUgOiAvPCU9KFtcXHNcXFNdKz8pJT4vZyxcbiAgICBlc2NhcGUgICAgICA6IC88JS0oW1xcc1xcU10rPyklPi9nXG4gIH07XG5cbiAgLy8gV2hlbiBjdXN0b21pemluZyBgdGVtcGxhdGVTZXR0aW5nc2AsIGlmIHlvdSBkb24ndCB3YW50IHRvIGRlZmluZSBhblxuICAvLyBpbnRlcnBvbGF0aW9uLCBldmFsdWF0aW9uIG9yIGVzY2FwaW5nIHJlZ2V4LCB3ZSBuZWVkIG9uZSB0aGF0IGlzXG4gIC8vIGd1YXJhbnRlZWQgbm90IHRvIG1hdGNoLlxuICB2YXIgbm9NYXRjaCA9IC8oLileLztcblxuICAvLyBDZXJ0YWluIGNoYXJhY3RlcnMgbmVlZCB0byBiZSBlc2NhcGVkIHNvIHRoYXQgdGhleSBjYW4gYmUgcHV0IGludG8gYVxuICAvLyBzdHJpbmcgbGl0ZXJhbC5cbiAgdmFyIGVzY2FwZXMgPSB7XG4gICAgXCInXCI6ICAgICAgXCInXCIsXG4gICAgJ1xcXFwnOiAgICAgJ1xcXFwnLFxuICAgICdcXHInOiAgICAgJ3InLFxuICAgICdcXG4nOiAgICAgJ24nLFxuICAgICdcXHQnOiAgICAgJ3QnLFxuICAgICdcXHUyMDI4JzogJ3UyMDI4JyxcbiAgICAnXFx1MjAyOSc6ICd1MjAyOSdcbiAgfTtcblxuICB2YXIgZXNjYXBlciA9IC9cXFxcfCd8XFxyfFxcbnxcXHR8XFx1MjAyOHxcXHUyMDI5L2c7XG5cbiAgLy8gSmF2YVNjcmlwdCBtaWNyby10ZW1wbGF0aW5nLCBzaW1pbGFyIHRvIEpvaG4gUmVzaWcncyBpbXBsZW1lbnRhdGlvbi5cbiAgLy8gVW5kZXJzY29yZSB0ZW1wbGF0aW5nIGhhbmRsZXMgYXJiaXRyYXJ5IGRlbGltaXRlcnMsIHByZXNlcnZlcyB3aGl0ZXNwYWNlLFxuICAvLyBhbmQgY29ycmVjdGx5IGVzY2FwZXMgcXVvdGVzIHdpdGhpbiBpbnRlcnBvbGF0ZWQgY29kZS5cbiAgXy50ZW1wbGF0ZSA9IGZ1bmN0aW9uKHRleHQsIGRhdGEsIHNldHRpbmdzKSB7XG4gICAgdmFyIHJlbmRlcjtcbiAgICBzZXR0aW5ncyA9IF8uZGVmYXVsdHMoe30sIHNldHRpbmdzLCBfLnRlbXBsYXRlU2V0dGluZ3MpO1xuXG4gICAgLy8gQ29tYmluZSBkZWxpbWl0ZXJzIGludG8gb25lIHJlZ3VsYXIgZXhwcmVzc2lvbiB2aWEgYWx0ZXJuYXRpb24uXG4gICAgdmFyIG1hdGNoZXIgPSBuZXcgUmVnRXhwKFtcbiAgICAgIChzZXR0aW5ncy5lc2NhcGUgfHwgbm9NYXRjaCkuc291cmNlLFxuICAgICAgKHNldHRpbmdzLmludGVycG9sYXRlIHx8IG5vTWF0Y2gpLnNvdXJjZSxcbiAgICAgIChzZXR0aW5ncy5ldmFsdWF0ZSB8fCBub01hdGNoKS5zb3VyY2VcbiAgICBdLmpvaW4oJ3wnKSArICd8JCcsICdnJyk7XG5cbiAgICAvLyBDb21waWxlIHRoZSB0ZW1wbGF0ZSBzb3VyY2UsIGVzY2FwaW5nIHN0cmluZyBsaXRlcmFscyBhcHByb3ByaWF0ZWx5LlxuICAgIHZhciBpbmRleCA9IDA7XG4gICAgdmFyIHNvdXJjZSA9IFwiX19wKz0nXCI7XG4gICAgdGV4dC5yZXBsYWNlKG1hdGNoZXIsIGZ1bmN0aW9uKG1hdGNoLCBlc2NhcGUsIGludGVycG9sYXRlLCBldmFsdWF0ZSwgb2Zmc2V0KSB7XG4gICAgICBzb3VyY2UgKz0gdGV4dC5zbGljZShpbmRleCwgb2Zmc2V0KVxuICAgICAgICAucmVwbGFjZShlc2NhcGVyLCBmdW5jdGlvbihtYXRjaCkgeyByZXR1cm4gJ1xcXFwnICsgZXNjYXBlc1ttYXRjaF07IH0pO1xuXG4gICAgICBpZiAoZXNjYXBlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIicrXFxuKChfX3Q9KFwiICsgZXNjYXBlICsgXCIpKT09bnVsbD8nJzpfLmVzY2FwZShfX3QpKStcXG4nXCI7XG4gICAgICB9XG4gICAgICBpZiAoaW50ZXJwb2xhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBpbnRlcnBvbGF0ZSArIFwiKSk9PW51bGw/Jyc6X190KStcXG4nXCI7XG4gICAgICB9XG4gICAgICBpZiAoZXZhbHVhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJztcXG5cIiArIGV2YWx1YXRlICsgXCJcXG5fX3ArPSdcIjtcbiAgICAgIH1cbiAgICAgIGluZGV4ID0gb2Zmc2V0ICsgbWF0Y2gubGVuZ3RoO1xuICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH0pO1xuICAgIHNvdXJjZSArPSBcIic7XFxuXCI7XG5cbiAgICAvLyBJZiBhIHZhcmlhYmxlIGlzIG5vdCBzcGVjaWZpZWQsIHBsYWNlIGRhdGEgdmFsdWVzIGluIGxvY2FsIHNjb3BlLlxuICAgIGlmICghc2V0dGluZ3MudmFyaWFibGUpIHNvdXJjZSA9ICd3aXRoKG9ianx8e30pe1xcbicgKyBzb3VyY2UgKyAnfVxcbic7XG5cbiAgICBzb3VyY2UgPSBcInZhciBfX3QsX19wPScnLF9faj1BcnJheS5wcm90b3R5cGUuam9pbixcIiArXG4gICAgICBcInByaW50PWZ1bmN0aW9uKCl7X19wKz1fX2ouY2FsbChhcmd1bWVudHMsJycpO307XFxuXCIgK1xuICAgICAgc291cmNlICsgXCJyZXR1cm4gX19wO1xcblwiO1xuXG4gICAgdHJ5IHtcbiAgICAgIHJlbmRlciA9IG5ldyBGdW5jdGlvbihzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJywgJ18nLCBzb3VyY2UpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGUuc291cmNlID0gc291cmNlO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG5cbiAgICBpZiAoZGF0YSkgcmV0dXJuIHJlbmRlcihkYXRhLCBfKTtcbiAgICB2YXIgdGVtcGxhdGUgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gcmVuZGVyLmNhbGwodGhpcywgZGF0YSwgXyk7XG4gICAgfTtcblxuICAgIC8vIFByb3ZpZGUgdGhlIGNvbXBpbGVkIGZ1bmN0aW9uIHNvdXJjZSBhcyBhIGNvbnZlbmllbmNlIGZvciBwcmVjb21waWxhdGlvbi5cbiAgICB0ZW1wbGF0ZS5zb3VyY2UgPSAnZnVuY3Rpb24oJyArIChzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJykgKyAnKXtcXG4nICsgc291cmNlICsgJ30nO1xuXG4gICAgcmV0dXJuIHRlbXBsYXRlO1xuICB9O1xuXG4gIC8vIEFkZCBhIFwiY2hhaW5cIiBmdW5jdGlvbiwgd2hpY2ggd2lsbCBkZWxlZ2F0ZSB0byB0aGUgd3JhcHBlci5cbiAgXy5jaGFpbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBfKG9iaikuY2hhaW4oKTtcbiAgfTtcblxuICAvLyBPT1BcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG4gIC8vIElmIFVuZGVyc2NvcmUgaXMgY2FsbGVkIGFzIGEgZnVuY3Rpb24sIGl0IHJldHVybnMgYSB3cmFwcGVkIG9iamVjdCB0aGF0XG4gIC8vIGNhbiBiZSB1c2VkIE9PLXN0eWxlLiBUaGlzIHdyYXBwZXIgaG9sZHMgYWx0ZXJlZCB2ZXJzaW9ucyBvZiBhbGwgdGhlXG4gIC8vIHVuZGVyc2NvcmUgZnVuY3Rpb25zLiBXcmFwcGVkIG9iamVjdHMgbWF5IGJlIGNoYWluZWQuXG5cbiAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGNvbnRpbnVlIGNoYWluaW5nIGludGVybWVkaWF0ZSByZXN1bHRzLlxuICB2YXIgcmVzdWx0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NoYWluID8gXyhvYmopLmNoYWluKCkgOiBvYmo7XG4gIH07XG5cbiAgLy8gQWRkIGFsbCBvZiB0aGUgVW5kZXJzY29yZSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIgb2JqZWN0LlxuICBfLm1peGluKF8pO1xuXG4gIC8vIEFkZCBhbGwgbXV0YXRvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIGVhY2goWydwb3AnLCAncHVzaCcsICdyZXZlcnNlJywgJ3NoaWZ0JywgJ3NvcnQnLCAnc3BsaWNlJywgJ3Vuc2hpZnQnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBtZXRob2QgPSBBcnJheVByb3RvW25hbWVdO1xuICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgb2JqID0gdGhpcy5fd3JhcHBlZDtcbiAgICAgIG1ldGhvZC5hcHBseShvYmosIGFyZ3VtZW50cyk7XG4gICAgICBpZiAoKG5hbWUgPT0gJ3NoaWZ0JyB8fCBuYW1lID09ICdzcGxpY2UnKSAmJiBvYmoubGVuZ3RoID09PSAwKSBkZWxldGUgb2JqWzBdO1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIG9iaik7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gQWRkIGFsbCBhY2Nlc3NvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIGVhY2goWydjb25jYXQnLCAnam9pbicsICdzbGljZSddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG1ldGhvZCA9IEFycmF5UHJvdG9bbmFtZV07XG4gICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBtZXRob2QuYXBwbHkodGhpcy5fd3JhcHBlZCwgYXJndW1lbnRzKSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgXy5leHRlbmQoXy5wcm90b3R5cGUsIHtcblxuICAgIC8vIFN0YXJ0IGNoYWluaW5nIGEgd3JhcHBlZCBVbmRlcnNjb3JlIG9iamVjdC5cbiAgICBjaGFpbjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9jaGFpbiA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gRXh0cmFjdHMgdGhlIHJlc3VsdCBmcm9tIGEgd3JhcHBlZCBhbmQgY2hhaW5lZCBvYmplY3QuXG4gICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3dyYXBwZWQ7XG4gICAgfVxuXG4gIH0pO1xuXG59KS5jYWxsKHRoaXMpO1xuIl19
;