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
	this._target_aq = 1; // seconds to get to sync target
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
	// DEBUG THINGS
	self.total = new self.THREE.Vector3();
	self.total_t=0;
	
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
	
		_.each(object, function(vec, name){
			var v = new self.THREE.Vector3()
			v.fromArray(vec)
			
			//if(['position', 'rotation'].indexOf(name ) === -1){
				//console.log('name', name);
			console.log("SYNC========================================");
			var target = {vec: v,
						  started:false}
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
			if(acts_since < last_ts){ acts_since = last_ts }
			if(acts_since >= now) {
				// ничего пока не делаем - возвращаем пустые импульсы 
				console.log('in future');
				return ps;
			}
			var time = (now - acts_since)/1000;
			// console.log(time, now - acts_since );
			if (F.length() === 0){ // Удаляем силу, если она равна нулю
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
					var afrom = mesh[name].toArray()
					var from = new self.THREE.Vector3().fromArray(afrom)
					target.diff = from.sub(target.vec.clone())
					target.v = target.diff.clone().multiplyScalar(1/self._target_aq)
					if(name === 'rotation'){
						console.log("start new sync ", name, afrom, target.vec.toArray(), target.diff.toArray(), target.v.toArray());
					}
					
					target.started = true;
					target.total_time = 0;
					target.diff_length = target.diff.length()
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
						 model_3d:'/models/StarCruiser.js',
						 physical:{
							 pos:p1,
							 rot:{to:p2},
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
							 rot:{to:p1},
						 
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
			_.each(positions_of_user, function(position){
				
				actors.push(self._make_actor(position, user_id));
				
			})
		})
		return actors;
	},
	_make_actor: function(pos_id, user_id){
		var pos = this._positions[pos_id]
		var new_actor_guid = u.make_guid()
		var controllable = {object_guid:pos.object_guid, workpoint:pos.workpoint} // viewport:'front', controls:['Pilot', 'Turret']} 
		console.log(this._positions, pos_id, user_id, pos);
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
								 place.id = counter;
								 counter += 1;
	 					
								 
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
				// console.log(W, W._time_diff);
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
				//var T = Controller.T();
				
				//var C = W.controllable();
				//var Cc = W.get_main_viewport().camera
				//var camera_position_vector = new T.Vector3()
				//console.log(C.json);
				//var camera =  C.json.cameras[Cc]
				//console.log(camera);
				//camera_position_vector.fromArray(camera.position);
				//camera_position_vector.applyEuler( C.rotation.clone() )
				//camera_position_vector.add(C.position.clone());
				//console.log("camera pos in W", camera_position_vector);
				
				t[k.substr(1)] = W.mouse_projection_vec.clone() //.sub(camera_position_vector)
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
			action.timestamp += W.average_ping_instability // Нестабильность пинга - чем пинг больше - тем меньше нестабильность
			// На маленьких значения не превышает значения пинга
			 
			
			// console.log("my diff", W._time_diff)
			
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
						var a_clone = _.clone(action)
						local_controller.act(self.World.scenes[actor.scene], action, up_or_down, actor, onAct);
						// console.log(action);
						
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
			if(S === undefined ) return;
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
					
							// console.log('HIT')
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
								// console.log(S.meshes[i].impulse)
							S.meshes[i].impulse.add( impulse );
							// console.log(S.meshes[i].impulse)
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
			if (S === undefined){return;}
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
				var object = C.json
				var wp = object.workpoints[actor.control.workpoint];
				var turret = object.turrets[ wp.turret ] 
				// console.log(turret, C.json.turrets, C.json.workpoints, actor)
				
				
					//}
				if (action.turret_direction instanceof T.Vector3){
					var mpv = action.turret_direction
				
				}else{
					var mpv = new T.Vector3(action.turret_direction.x,
												action.turret_direction.y,
												action.turret_direction.z)
				}
				console.log(mpv)
				//console.log('TH', Controller.T())
				// var front_vector = C.
				var turret_position_vector = new T.Vector3()
				turret_position_vector.fromArray(turret.position );
				// turret_position_vector.multiplyScalar(1);
				turret_position_vector.applyEuler( C.rotation.clone() )
				
				var bullet = Controller.createShotParticle();
				bullet.position = C.position.clone()
				bullet.position.add(  turret_position_vector.clone() )
				// console.log("BULLET POS IN W", C.position, C.pos,  bullet.position)
				
			
				bullet.has_engines = false;
				bullet.is_not_collidable = true;
				bullet.vel = new T.Vector3(0,0,0); // mpv//.multiplyScalar(0.10);
				
				bullet.mass = 1;
				
				mpv.sub(bullet.position.clone()).normalize().multiplyScalar(120.00);
				
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
		
		// var a = new T.Sprite(material);
		var a = new T.Mesh(new T.SphereGeometry(2));
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvYXpsL0RvY3VtZW50cy93b3Jrc3BhY2UvYXotYXoucnUvc2VydmVyL2VudHJ5LmpzIiwiL1VzZXJzL2F6bC9Eb2N1bWVudHMvd29ya3NwYWNlL2F6LWF6LnJ1L3NlcnZlci91dGlscy5qcyIsIi9Vc2Vycy9hemwvRG9jdW1lbnRzL3dvcmtzcGFjZS9hei1hei5ydS9zZXJ2ZXIvc3ByaXRlX3V0aWxzLmpzIiwiL1VzZXJzL2F6bC9Eb2N1bWVudHMvd29ya3NwYWNlL2F6LWF6LnJ1L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5LWV4cHJlc3Mvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvX2VtcHR5LmpzIiwiL1VzZXJzL2F6bC9Eb2N1bWVudHMvd29ya3NwYWNlL2F6LWF6LnJ1L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5LWV4cHJlc3Mvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItYnVpbHRpbnMvYnVpbHRpbi9mcy5qcyIsIi9Vc2Vycy9hemwvRG9jdW1lbnRzL3dvcmtzcGFjZS9hei1hei5ydS9zZXJ2ZXIvVXRpbHMuanMiLCIvVXNlcnMvYXpsL0RvY3VtZW50cy93b3Jrc3BhY2UvYXotYXoucnUvc2VydmVyL3NjZW5lLmpzIiwiL1VzZXJzL2F6bC9Eb2N1bWVudHMvd29ya3NwYWNlL2F6LWF6LnJ1L3NlcnZlci9taXNzaW9ucy5qcyIsIi9Vc2Vycy9hemwvRG9jdW1lbnRzL3dvcmtzcGFjZS9hei1hei5ydS9zZXJ2ZXIvY29udHJvbGxlci5qcyIsIi9Vc2Vycy9hemwvRG9jdW1lbnRzL3dvcmtzcGFjZS9hei1hei5ydS9ub2RlX21vZHVsZXMvdW5kZXJzY29yZS91bmRlcnNjb3JlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBOztBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMXJCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIlNjZW5lID0gcmVxdWlyZSgnLi9zY2VuZS5qcycpXG5NaXNzb2lvbiA9IHJlcXVpcmUoJy4vbWlzc2lvbnMuanMnKVxuVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzLmpzJylcblNwcml0ZVV0aWxzID0gcmVxdWlyZSgnLi9zcHJpdGVfdXRpbHMuanMnKVxuQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vY29udHJvbGxlci5qcycpXG5cblxuIiwidmFyIFV0aWxzID0ge1xuXHRcblx0bWFrZV9ndWlkIDpmdW5jdGlvbigpe1xuXHRcdHZhciBndWlkID0gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbihjKSB7XG5cdFx0ICAgIHZhciByID0gTWF0aC5yYW5kb20oKSoxNnwwLCB2ID0gYyA9PSAneCcgPyByIDogKHImMHgzfDB4OCk7XG5cdFx0ICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcblx0XHR9KTtcblx0XHRyZXR1cm4gZ3VpZDtcblx0fVxufVxubW9kdWxlLmV4cG9ydHMgPSBVdGlsczsiLCJ2YXIgTW9kID0ge1xuXHQgbWFrZVRleHRTcHJpdGU6ZnVuY3Rpb24oIG1lc3NhZ2UsIHBhcmFtZXRlcnMgKXtcblx0XHRpZiAoIHBhcmFtZXRlcnMgPT09IHVuZGVmaW5lZCApIHBhcmFtZXRlcnMgPSB7fTtcblx0XG5cdFx0dmFyIGZvbnRmYWNlID0gcGFyYW1ldGVycy5oYXNPd25Qcm9wZXJ0eShcImZvbnRmYWNlXCIpID8gXG5cdFx0XHRwYXJhbWV0ZXJzW1wiZm9udGZhY2VcIl0gOiBcIkFyaWFsXCI7XG5cdFxuXHRcdHZhciBmb250c2l6ZSA9IHBhcmFtZXRlcnMuaGFzT3duUHJvcGVydHkoXCJmb250c2l6ZVwiKSA/IFxuXHRcdFx0cGFyYW1ldGVyc1tcImZvbnRzaXplXCJdIDogMTg7XG5cdFxuXHRcdHZhciBib3JkZXJUaGlja25lc3MgPSBwYXJhbWV0ZXJzLmhhc093blByb3BlcnR5KFwiYm9yZGVyVGhpY2tuZXNzXCIpID8gXG5cdFx0XHRwYXJhbWV0ZXJzW1wiYm9yZGVyVGhpY2tuZXNzXCJdIDogNDtcblx0XG5cdFx0dmFyIGJvcmRlckNvbG9yID0gcGFyYW1ldGVycy5oYXNPd25Qcm9wZXJ0eShcImJvcmRlckNvbG9yXCIpID9cblx0XHRcdHBhcmFtZXRlcnNbXCJib3JkZXJDb2xvclwiXSA6IHsgcjowLCBnOjAsIGI6MCwgYToxLjAgfTtcblx0XG5cdFx0dmFyIGJhY2tncm91bmRDb2xvciA9IHBhcmFtZXRlcnMuaGFzT3duUHJvcGVydHkoXCJiYWNrZ3JvdW5kQ29sb3JcIikgP1xuXHRcdFx0cGFyYW1ldGVyc1tcImJhY2tncm91bmRDb2xvclwiXSA6IHsgcjoyNTUsIGc6MjU1LCBiOjI1NSwgYToxLjAgfTtcblxuXHRcdC8vdmFyIHNwcml0ZUFsaWdubWVudCA9IFRIUkVFLlNwcml0ZUFsaWdubWVudC50b3BMZWZ0O1xuXHRcdFxuXHRcdHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0XHR2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXHRcdGNvbnRleHQuZm9udCA9IFwiQm9sZCBcIiArIGZvbnRzaXplICsgXCJweCBcIiArIGZvbnRmYWNlO1xuICAgIFxuXHRcdC8vIGdldCBzaXplIGRhdGEgKGhlaWdodCBkZXBlbmRzIG9ubHkgb24gZm9udCBzaXplKVxuXHRcdHZhciBtZXRyaWNzID0gY29udGV4dC5tZWFzdXJlVGV4dCggbWVzc2FnZSApO1xuXHRcdHZhciB0ZXh0V2lkdGggPSBtZXRyaWNzLndpZHRoO1xuXHRcblx0XHQvLyBiYWNrZ3JvdW5kIGNvbG9yXG5cdFx0Y29udGV4dC5maWxsU3R5bGUgICA9IFwicmdiYShcIiArIGJhY2tncm91bmRDb2xvci5yICsgXCIsXCIgKyBiYWNrZ3JvdW5kQ29sb3IuZyArIFwiLFwiXG5cdFx0XHRcdFx0XHRcdFx0XHQgICsgYmFja2dyb3VuZENvbG9yLmIgKyBcIixcIiArIGJhY2tncm91bmRDb2xvci5hICsgXCIpXCI7XG5cdFx0Ly8gYm9yZGVyIGNvbG9yXG5cdFx0Y29udGV4dC5zdHJva2VTdHlsZSA9IFwicmdiYShcIiArIGJvcmRlckNvbG9yLnIgKyBcIixcIiArIGJvcmRlckNvbG9yLmcgKyBcIixcIlxuXHRcdFx0XHRcdFx0XHRcdFx0ICArIGJvcmRlckNvbG9yLmIgKyBcIixcIiArIGJvcmRlckNvbG9yLmEgKyBcIilcIjtcblxuXHRcdGNvbnRleHQubGluZVdpZHRoID0gYm9yZGVyVGhpY2tuZXNzO1xuXHRcdHRoaXMucm91bmRSZWN0KGNvbnRleHQsIGJvcmRlclRoaWNrbmVzcy8yLCBib3JkZXJUaGlja25lc3MvMiwgdGV4dFdpZHRoICsgYm9yZGVyVGhpY2tuZXNzLCBmb250c2l6ZSAqIDEuNCArIGJvcmRlclRoaWNrbmVzcywgNik7XG5cdFx0Ly8gMS40IGlzIGV4dHJhIGhlaWdodCBmYWN0b3IgZm9yIHRleHQgYmVsb3cgYmFzZWxpbmU6IGcsaixwLHEuXG5cdFxuXHRcdC8vIHRleHQgY29sb3Jcblx0XHRjb250ZXh0LmZpbGxTdHlsZSA9IFwicmdiYSgwLCAwLCAwLCAxLjApXCI7XG5cblx0XHRjb250ZXh0LmZpbGxUZXh0KCBtZXNzYWdlLCBib3JkZXJUaGlja25lc3MsIGZvbnRzaXplICsgYm9yZGVyVGhpY2tuZXNzKTtcblx0XG5cdFx0Ly8gY2FudmFzIGNvbnRlbnRzIHdpbGwgYmUgdXNlZCBmb3IgYSB0ZXh0dXJlXG5cdFx0dmFyIHRleHR1cmUgPSBuZXcgVEhSRUUuVGV4dHVyZShjYW52YXMpIFxuXHRcdHRleHR1cmUubmVlZHNVcGRhdGUgPSB0cnVlO1xuXG5cdFx0dmFyIHNwcml0ZU1hdGVyaWFsID0gbmV3IFRIUkVFLlNwcml0ZU1hdGVyaWFsKCBcblx0XHRcdHsgbWFwOiB0ZXh0dXJlLCB1c2VTY3JlZW5Db29yZGluYXRlczogZmFsc2UgfSApO1xuXHRcdHZhciBzcHJpdGUgPSBuZXcgVEhSRUUuU3ByaXRlKCBzcHJpdGVNYXRlcmlhbCApO1xuXHRcdHNwcml0ZS5zY2FsZS5zZXQoMjAsMjAsMS4wKTtcblx0XHRyZXR1cm4gc3ByaXRlO1x0XG5cdH0sXG5cdHJvdW5kUmVjdDpmdW5jdGlvbihjdHgsIHgsIHksIHcsIGgsIHIpIFxuXHR7XG5cdCAgICBjdHguYmVnaW5QYXRoKCk7XG5cdCAgICBjdHgubW92ZVRvKHgrciwgeSk7XG5cdCAgICBjdHgubGluZVRvKHgrdy1yLCB5KTtcblx0ICAgIGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKHgrdywgeSwgeCt3LCB5K3IpO1xuXHQgICAgY3R4LmxpbmVUbyh4K3csIHkraC1yKTtcblx0ICAgIGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKHgrdywgeStoLCB4K3ctciwgeStoKTtcblx0ICAgIGN0eC5saW5lVG8oeCtyLCB5K2gpO1xuXHQgICAgY3R4LnF1YWRyYXRpY0N1cnZlVG8oeCwgeStoLCB4LCB5K2gtcik7XG5cdCAgICBjdHgubGluZVRvKHgsIHkrcik7XG5cdCAgICBjdHgucXVhZHJhdGljQ3VydmVUbyh4LCB5LCB4K3IsIHkpO1xuXHQgICAgY3R4LmNsb3NlUGF0aCgpO1xuXHQgICAgY3R4LmZpbGwoKTtcblx0XHRjdHguc3Ryb2tlKCk7ICAgXG5cdH1cbn1cbm1vZHVsZS5leHBvcnRzPU1vZCIsbnVsbCwiLy8gbm90aGluZyB0byBzZWUgaGVyZS4uLiBubyBmaWxlIG1ldGhvZHMgZm9yIHRoZSBicm93c2VyXG4iLCJ2YXIgVXRpbHMgPSB7XG5cdFxuXHRtYWtlX2d1aWQgOmZ1bmN0aW9uKCl7XG5cdFx0dmFyIGd1aWQgPSAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uKGMpIHtcblx0XHQgICAgdmFyIHIgPSBNYXRoLnJhbmRvbSgpKjE2fDAsIHYgPSBjID09ICd4JyA/IHIgOiAociYweDN8MHg4KTtcblx0XHQgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuXHRcdH0pO1xuXHRcdHJldHVybiBndWlkO1xuXHR9XG59XG5tb2R1bGUuZXhwb3J0cyA9IFV0aWxzOyIsInZhciBmcyAgICA9IHJlcXVpcmUoJ2ZzJyk7XG52YXIgdSA9IHJlcXVpcmUoJy4vdXRpbHMuanMnKTtcbnZhciBUSFIgPSByZXF1aXJlKCcuL3RocmVlLm5vZGUuanMnKTtcblxudmFyIF8gICAgID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG52YXIgU2NlbmVPYmplY3QgPSBmdW5jdGlvbih4LHkseil7XG5cdHRoaXMuZGVzY3JpcHRpb249IFwiU2NlbmUgcm91dGluZXNcIlxuXHR0aGlzLkdVSUQgPSAgdS5tYWtlX2d1aWQoKTtcblx0dGhpcy5fY3JlYXRlKCk7XG5cdHRoaXMuZ3ggPSB4XG5cdHRoaXMuZ3kgPSB5XG5cdHRoaXMuZ3ogPSB6XG59XG5TY2VuZSA9IHtjb25zdHJ1Y3RvcjogU2NlbmVPYmplY3R9XG5cbmlmKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKXtcblx0U2NlbmUuVEhSRUUgPSBUSFIgLy8gU2F2ZWluZyBUSFJFRS5qcyBhcyBwYXJ0IG9mIHNjZW5lIC0gdGhpcyBzdGVwIGNvdWxkIGJlIGRvbmUgb24gYSBjZXJ0YWluIHBsYXRmb3JtXG5cdFNjZW5lLmRvX3ByZXBhcmVfcmVuZGVyaW5nID0gZmFsc2Vcblx0U2NlbmUuYWpheF9sb2FkX21vZGVscyA9IGZhbHNlXG5cdFNjZW5lLm5lZWRfdXBkYXRlX21hdHJpeCA9IHRydWVcblx0XG59ZWxzZXtcblx0U2NlbmUuVEhSRUUgPSBUSFJFRVxuXHRTY2VuZS5kb19wcmVwYXJlX3JlbmRlcmluZyA9IHRydWVcblx0U2NlbmUuYWpheF9sb2FkX21vZGVscyA9IHRydWVcblx0U2NlbmUubmVlZF91cGRhdGVfbWF0cml4ID0gZmFsc2Vcblx0XG59XG5cblxuXG5cblNjZW5lLm1lc2hfZm9yID0gZnVuY3Rpb24oYWN0b3Ipe1xuXHRyZXR1cm4gdGhpcy5tZXNoZXNbYWN0b3IuY29udHJvbC5vYmplY3RfZ3VpZF1cbn1cblNjZW5lLmNyZWF0ZSA9IGZ1bmN0aW9uKCl7XG5cdHRoaXMuX2NyZWF0ZSgpO1xuXHQvL2NvbnNvbGUubG9nKCBcIkNMT0NLXCIsIHRoaXMuY2xvY2spO1xuXHRcblx0cmV0dXJuIHRoaXM7XG59XG5cblNjZW5lLl9jcmVhdGUgPSBmdW5jdGlvbigpe1xuXHR0aGlzLmNsb2NrID0gbmV3ICh0aGlzLlRIUkVFLkNsb2NrKSgpO1xuXHR0aGlzLnRpbWVfaW5jICA9IDA7XG5cdHRoaXMuX3NjZW5lX29iamVjdF9jYWNoZSA9IHt9XG5cdHRoaXMuX3NjZW5lX29ial9hY3RvcnM9e31cblx0dGhpcy5fdGFyZ2V0X2FxID0gMTsgLy8gc2Vjb25kcyB0byBnZXQgdG8gc3luYyB0YXJnZXRcblx0dGhpcy5pc19sb2FkZWQgPSBmYWxzZVxuXHR0aGlzLl9kID0gZmFsc2Vcblx0dGhpcy5fc2NlbmUgPXthY3RvcnM6e30sIEdVSUQ6IHRoaXMuR1VJRCwgb2JqZWN0czp7fSwgY29vcmRzOlt0aGlzLmd4LCB0aGlzLmd5LCB0aGlzLmd6XSAgfSBcblx0XG5cdFxuXHQvLyB0aGlzLnNpbXVsYXRpb25fcnVucyA9IGZhbHNlXG5cdC8vIGNvbnNvbGUubG9nKHRoaXMuY2xvY2spO1xuXHRcbn1cblNjZW5lLnVwZGF0ZV9mcm9tX3dvcmxkID0gZnVuY3Rpb24oKXtcblx0Ly8gZ2xvYmFseC15LXogLSBnYWxheHkgY29vcmRzIHdpdGggMSBtZXRlciBhY2N1cmFjeVxuXHR2YXIgY2xvc2VzdF9zY2VuZV93aXRoX2Rpc3RhbmNlID0gdGhpcy5nZXRfY2xvc2VzdF9zY2VuZSh0aGlzLmd4LCB0aGlzLmd5LCB0aGlzLmd6KTtcblx0Ly8gaWYgY2xvc2VzdF9zY2VuZSBpcyBub3QgbnVsbCAtIHdlIG11c3QgaW5qZWN0IG9iamVjdCB3aXRoIGFjdG9ycyB0byB0aGF0IHNjZW5lIC0gaXQncyBhbHJlYWR5X2xvYWRlZFxuXHQvLyBlbHNlIC0gV2UgZmluZGluZyBvYmplY3RzIGZvciB0aGF0IHNjZW5lXG5cdFx0XHRcdFxuXHR2YXIgb2JqZWN0c193aXRoaW5fY29vcmRzID0gdGhpcy5nZXRfb2JqZWN0c19pbih0aGlzLmd4LCB0aGlzLmd5LCB0aGlzLmd6KTsgLy8g0JfQsNCz0YDRg9C30LrQsCDQvtCx0YrQtdC60YLQvtCyINCyINGB0YbQtdC90YMg0LjQtyDQs9C70L7QsdCw0LvRjNC90L7Qs9C+INC80LjRgNCwXG5cdFxuXHR2YXIgb2JqZWN0cyA9IHt9XG5cdGZvciAoIHZhciBpID0gMDsgaSA8IG9iamVjdHNfd2l0aGluX2Nvb3Jkcy5sZW5ndGggOyBpKysgKXtcblx0XHRvYmplY3RzWyBvYmplY3RzX3dpdGhpbl9jb29yZHNbaV0uR1VJRCBdID0gICBvYmplY3RzX3dpdGhpbl9jb29yZHNbaV07XG5cdH1cblx0Xy5leHRlbmQodGhpcy5fc2NlbmUub2JqZWN0cywgb2JqZWN0cylcblx0XG5cdHRoaXMuX3NjZW5lLnN1bkRpcmVjdGlvbiA9IFswLDEsMF1cblx0dGhpcy5fc2NlbmUuc3VuTGlnaHRDb2xvciA9IFtNYXRoLnJhbmRvbSgpLCAwLjgsIDAuOV0gLy8gSFNMXG5cdHRoaXMuX3NjZW5lLmNvb3JkcyA9WyB0aGlzLmd4LCB0aGlzLmd5LCB0aGlzLmd6IF1cblx0Ly8gdGhpcy5fY3JlYXRlKCk7XG5cdFxuXHQvLyBjcmVhdGluZyBzY2VuZVxuXHRcblx0Ly8gdGhpcy5fc2NlbmUgPSB7Y29vcmRzIDpbIGdsb2JhbHgsIGdsb2JhbHksIGdsb2JhbHogXSwgYWN0b3JzOnt9LCBHVUlEOiB1Lm1ha2VfZ3VpZCgpLCBvYmplY3RzOnt9IH0gXG5cdC8vIHRoaXMuR1VJRCA9IHRoaXMuX3NjZW5lLkdVSUQ7XG5cdFxuXHQvLyBwcmVwYXJlIGFjdG9ycyAtIGFsbCBvZiB0aGVtIHdvdWxkIGNvbnRyb2wgb2JqZWN0X2lkID0gMCwgdmlld3BvcnRzIC0gZWFjaCBmb3IgZWFjaFxuXHRcblx0XG5cdC8vIEluamVjdGluZyBvdGhlciBvYmplY3RzXG5cdC8vdmFyIG9iamVjdHMgPSB7fVxuXHQvLyBvYmplY3RzW2Zvcl9vYmplY3QuR1VJRF0gPSBmb3Jfb2JqZWN0O1xuXHRcblx0Ly8gY29uc29sZS5sb2coXG5cdC8vIGNvbnNvbGUubG9nKCBcIkNMT0NLXCIsIHRoaXMuY2xvY2spO1xuXHRcblx0cmV0dXJuIHRoaXNcblx0XG59XG5TY2VuZS5nZXRfYWN0b3JzID0gZnVuY3Rpb24oKXtcblx0cmV0dXJuIHRoaXMuX3NjZW5lLmFjdG9yc1xufVxuU2NlbmUuZ2V0X29iamVjdHMgPSBmdW5jdGlvbigpe1xuXHRyZXR1cm4gdGhpcy5fc2NlbmUub2JqZWN0c1xufVxuU2NlbmUuZ2V0X2pzb24gPSBmdW5jdGlvbigpe1xuXHRyZXR1cm4gdGhpcy5fc2NlbmVcbn1cblNjZW5lLmdldF9jbG9zZXN0X3NjZW5lID0gZnVuY3Rpb24oKXtcblx0cmV0dXJuIHVuZGVmaW5lZFxufVxuU2NlbmUuZ2V0X29iamVjdHNfaW4gPSBmdW5jdGlvbigpe1xuXHRyZXR1cm4gW107XG59XG5TY2VuZS5qb2luX29iamVjdCA9IGZ1bmN0aW9uKCBvYmplY3QgKXtcblx0dGhpcy5fc2NlbmUub2JqZWN0c1tvYmplY3QuR1VJRF0gPSBvYmplY3Rcblx0dGhpcy5fc2NlbmVfb2JqX2FjdG9yc1tvYmplY3QuR1VJRF0gPSBbXVxuXHQvLyBjb25zb2xlLmxvZyhcIlBVVCBPQkpcIiwgb2JqZWN0LkdVSUQpXG59XG5TY2VuZS5qb2luX2FjdG9yID0gZnVuY3Rpb24oIGFjdG9yICl7XG5cdC8vaWYgKHRoaXMuX3NjZW5lLmFjdG9yc1thY3Rvci5HVUlEXSl7XG5cdC8vXHR0aGlzLl9zY2VuZS5hY3RvcnNbYWN0b3IuR1VJRF0ucHVzaChhY3Rvcilcblx0XHQvL31lbHNle1xuXHRcdHRoaXMuX3NjZW5lLmFjdG9yc1thY3Rvci5HVUlEXSA9IGFjdG9yXG5cdFxuXHQvLyBjb25zb2xlLmxvZyhcIkdFVCBPQkpcIix0aGlzLl9zY2VuZV9vYmpfYWN0b3JzLCAgYWN0b3IuY29udHJvbC5vYmplY3RfZ3VpZClcblx0XG5cdHRoaXMuX3NjZW5lX29ial9hY3RvcnNbYWN0b3IuY29udHJvbC5vYmplY3RfZ3VpZF0ucHVzaChhY3Rvcilcblx0XG5cdHJldHVybiB0aGlzXG5cdFxufVxuU2NlbmUuc2V0X2Zyb21fanNvbiA9IGZ1bmN0aW9uKG9iamVjdCl7XG5cdHRoaXMuX3NjZW5lID0gb2JqZWN0XG5cdFxuXHR0aGlzLkdVSUQgPSBvYmplY3QuR1VJRFxuXHR0aGlzLmd4ID0gb2JqZWN0LmNvb3Jkc1swXVxuXHR0aGlzLmd5ID0gb2JqZWN0LmNvb3Jkc1sxXVxuXHR0aGlzLmd6ID0gb2JqZWN0LmNvb3Jkc1syXVxuXHR0aGlzLnVwZGF0ZV9mcm9tX3dvcmxkKCApXG5cdFxuXHRcbn1cblxuLy8gU2NlbmUuY29udHJvbGxhYmxlID0gZnVuY3Rpb24obG9naW4pe1xuXHRcbi8vXHRyZXR1cm4gdGhpcy5tZXNoZXNbdGhpcy5hY3RvcnNbbG9naW5dLmNvbnRyb2wub2JqZWN0X2d1aWRdXG4vLyB9XG5TY2VuZS5sb2FkID0gZnVuY3Rpb24ob25sb2FkLCB0aHJlZV9zY2VuZSl7XG5cdC8vIHRocmVlIHNjZW5lIC0gaXMgYSBwYXJhbSBmb3IgYWRkaW5nIG1lc2hlcyB0b1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cdC8vY29uc29sZS5sb2coJ2xvYWRpbmcnKTtcblx0Ly8gREVCVUcgVEhJTkdTXG5cdHNlbGYudG90YWwgPSBuZXcgc2VsZi5USFJFRS5WZWN0b3IzKCk7XG5cdHNlbGYudG90YWxfdD0wO1xuXHRcblx0c2VsZi5tZXNoZXMgPSB7fVxuXHRzZWxmLmxvYWRlciA9ICBuZXcgc2VsZi5USFJFRS5KU09OTG9hZGVyKCk7XG5cdHNlbGYudG90YWxfb2JqZWN0c19jb3VudCA9IDA7XG5cdHNlbGYuX2NhbGxfYmFjayA9IG9ubG9hZDtcblx0XG5cdGlmKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKXtcblx0XHRzZWxmLnRocmVlX3NjZW5lID0gdGhyZWVfc2NlbmVcblx0fVxuXHRcblx0ZnVuY3Rpb24gcHV0X29uKHR5cGUsIG5hbWUsIHRzKXtcblx0XHR2YXIgZXMgPSB0aGlzW1wib25fZW5naW5lc19cIiArIHR5cGVdXG5cdFx0b2JqID0ge25hbWU6bmFtZSwgdHM6dHN9XG5cdFx0Ly8gY29uc29sZS5sb2coZXMpXG5cdFx0aWYgKCBlcy5pbmRleE9mKCBuYW1lICkgPT09IC0xKXtcblx0XHRcdGVzLnB1c2goIG5hbWUgKVx0XG5cdFx0fVxuXHRcdC8vIGNvbnNvbGUubG9nKGVzKVxuXHR9XG5cdGZ1bmN0aW9uIHB1dF9vZmYodHlwZSwgbmFtZSx0cyl7XG5cdFx0dmFyIGVzID0gdGhpc1tcIm9uX2VuZ2luZXNfXCIgKyB0eXBlXVxuXHRcdHZhciBpeCA9IGVzLmluZGV4T2YobmFtZSlcblx0XHRpZiAoICBpeCAhPT0gLTEgKXtcblx0XHRcdGVzLnNwbGljZShpeCwgMSk7XG5cdFx0fVxuXHR9XG5cdHZhciBqc29uID0gdGhpcy5fc2NlbmVcblx0XG5cdFxuXHRzZWxmLmFjdG9ycyA9IGpzb24uYWN0b3JzO1xuXHRcblx0Ly8gc2VsZi5hdXRvbWF0aWMgYWN0b3JzIC0gcnVuIGluIGxvb3BzXG5cdHNlbGYuYXV0b21hdGljX2FjdG9ycyA9IHt9O1xuXHQvLyBjb25zb2xlLmxvZyhzZWxmLmFjdG9ycylcblx0XG5cdHNlbGYubG9hZGVkX29iamVjdHNfY291bnQgPSAwXG5cdFxuXHQvLyBjb25zb2xlLmxvZyhzZWxmLmFjdG9ycyk7XG5cdC8vIGNvbnNvbGUubG9nKGpzb24pO1xuXHRzZWxmLl9tb2RlbF9jYWNoZSA9IHt9XG5cdC8vY29uc29sZS5sb2codGhpcyk7XG5cdF8uZWFjaChqc29uLm9iamVjdHMsIGZ1bmN0aW9uKCBvYmplY3QsaXggKXtcblx0XHRzZWxmLnRvdGFsX29iamVjdHNfY291bnQgKz0xO1xuXHRcdFxuXHRcdGlmICghIHNlbGYuYWpheF9sb2FkX21vZGVscyl7XG5cdFx0XHR2YXIgbSA9IG9iamVjdC5tb2RlbF8zZC5zcGxpdCgnLycpWzJdO1xuXHRcdFx0dmFyIG1vZGVsX3BhdGg9IFwiLi9wdWJsaWMvbW9kZWxzL1wiICsgbVxuXHRcdH1cblx0XHQvLyBjb25zb2xlLmxvZyhtb2RlbF9wYXRoKTtcblx0XHRcblx0XHR2YXIgcmYgPSBmdW5jdGlvbigpe1xuXHRcdFx0dmFyIHdpdGhfZ2VvbV9hbmRfbWF0ID0gZnVuY3Rpb24oZ2VvbSwgbWF0KXtcblx0XHRcdFx0dmFyIG0gPSBuZXcgc2VsZi5USFJFRS5NYXRyaXg0KClcblx0XHRcdFx0bS5pZGVudGl0eSgpXG5cdFx0XHRcblx0XHRcdFx0Ly8gdmFyIHR1cnJldCA9IG9iamVjdC50dXJyZXRzW29iamVjdHMud29ya3BvaW50c1thY3Rvci5jb250cm9sLndvcmtwb2ludF0udHVycmV0XSBcblx0XHRcdFx0XG5cdFx0XHRcdFxuXHRcdFx0XHR2YXIgbWVzaCA9IG5ldyBzZWxmLlRIUkVFLk1lc2goIGdlb20sIG1hdCApO1xuXHRcdFx0XHRtZXNoLmpzb24gPSBvYmplY3Rcblx0XHRcdFx0bWVzaC50b3RhbF9wb3dlcnMgPSBbXTtcblx0XHRcdFx0bWVzaC50b3RhbF90b3JxdWVzID0gW107XG5cdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhpLCBtZXNoLnRvdGFsX3RvcnF1ZXMsIG1lc2gudG90YWxfcG93ZXJzKVxuXHRcdFx0XHRtZXNoLnR5cGU9b2JqZWN0LnR5cGVcblx0XHRcdFx0dmFyIG9iamVjdF9yb3RhdGVkID0gZmFsc2Vcblx0XHRcdFx0Ly8gU2V0dGluZyBkZWZhdWx0cyBcblx0XHRcdFx0bWVzaC5hdmVsID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMygwLDAsMClcblx0XHRcdFx0bWVzaC5hYWNjID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMygwLDAsMClcblx0XHRcdFx0bWVzaC52ZWwgPSBuZXcgc2VsZi5USFJFRS5WZWN0b3IzKDAsMCwwKVxuXHRcdFx0XHRtZXNoLmFjYyA9IG5ldyBzZWxmLlRIUkVFLlZlY3RvcjMoMCwwLDApXG5cdFx0XHRcdFxuXHRcdFx0XHRcblx0XHRcdFx0aWYgKCBvYmplY3QucGh5c2ljYWwgKXtcblx0XHRcdFx0XHRmb3IoaSBpbiBvYmplY3QucGh5c2ljYWwpe1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHR2YXIgX2lzID0gJ3RvJyBpbiBvYmplY3QucGh5c2ljYWxbaV1cblx0XHRcdFx0XHRcdGlmICghX2lzKXtcblx0XHRcdFx0XHRcdFx0aWYoaSAhPSdyb3RhdGlvbicpe1xuXHRcdFx0XHRcdFx0XHRcdHZhciB2ID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMygpXG5cdFx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdFx0XHRcdHZhciB2ID0gbmV3IHNlbGYuVEhSRUUuRXVsZXIoKVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdHYuc2V0LmFwcGx5KHYsIG9iamVjdC5waHlzaWNhbFtpXSlcblx0XHRcdFx0XHRcdFx0bWVzaFtpXSA9IHZcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0XHRcdHZhciBwID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMyhvYmplY3QucGh5c2ljYWxbaV0udG9bMF0sIG9iamVjdC5waHlzaWNhbFtpXS50b1sxXSwgb2JqZWN0LnBoeXNpY2FsW2ldLnRvWzJdKVxuXHRcdFx0XHRcdFx0XHQvLyBUcnkgdG8gcm90YXRlIHAgb24gMTgwIFxuXHRcdFx0XHRcdFx0XHQvL3Aucm90YXRlWCgyKiBNYXRoLlBJKTtcblx0XHRcdFx0XHRcdFx0bWVzaC5sb29rQXQocC5uZWdhdGUoKSlcblx0XHRcdFx0XHRcdFx0Ly8gbWVzaC5yb3RhdGVYKDIqTWF0aC5QSSlcblx0XHRcdFx0XHRcdFx0bWVzaC5yb3QgPSBuZXcgc2VsZi5USFJFRS5WZWN0b3IzKG1lc2gucm90YXRpb24ueCwgbWVzaC5yb3RhdGlvbi55LCBtZXNoLnJvdGF0aW9uLnopO1xuXHRcdFx0XHRcdFx0XHRvYmplY3Rfcm90YXRlZCA9IHRydWU7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9ZWxzZXtcblx0XHRcdFx0XHR2YXIgcGkyID0gTWF0aC5QSSAqIDI7XG5cdFx0XHRcdFx0bWVzaC5wb3MgPSBuZXcgc2VsZi5USFJFRS5WZWN0b3IzKE1hdGgucmFuZG9tKCkgKiAyMDAsIE1hdGgucmFuZG9tKCkgKiAyMDAsIE1hdGgucmFuZG9tKCkgKiAyMDApO1xuXHRcdFx0XHRcdG1lc2gucm90ID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMyhNYXRoLnJhbmRvbSgpICogcGkyLCBNYXRoLnJhbmRvbSgpICogcGkyLCBNYXRoLnJhbmRvbSgpICogcGkyKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0fVxuXHRcdFx0XHRtZXNoLnBvc2l0aW9uID0gbWVzaC5wb3M7XG5cdFx0XHRcdGlmICghIG9iamVjdF9yb3RhdGVkICYmICAncm90JyBpbiBtZXNoKXtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHR2YXIgdWVsID0gbmV3IHNlbGYuVEhSRUUuRXVsZXIobWVzaC5yb3QueCwgbWVzaC5yb3QueSwgbWVzaC5yb3Queik7XG5cdFx0XHRcdFx0bWVzaC5yb3RhdGlvbiA9IHVlbDtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBjb25zb2xlLmxvZyhtZXNoLnBvc2l0aW9uKVxuXHRcdFx0XHRtZXNoLmNhbWVyYXMgPSBvYmplY3QuY2FtZXJhcztcblx0XHRcdFx0bWVzaC5lbmdpbmVzID0gb2JqZWN0LmVuZ2luZXM7XG5cdFx0XHRcdG1lc2guaGFzX2VuZ2luZXMgPSBvYmplY3QuZW5naW5lcyAhPT0gdW5kZWZpbmVkO1xuXHRcdFx0XHRpZiAobWVzaC5oYXNfZW5naW5lcyl7XG5cdFx0XHRcdFx0bWVzaC5vbl9lbmdpbmVzX3JvdGF0aW9uID0gW107XG5cdFx0XHRcdFx0bWVzaC5vbl9lbmdpbmVzX3Byb3B1bHNpb24gPSBbXTtcblx0XHRcdFx0fVxuXHRcdFx0XHRtZXNoLnB1dF9vZmYgPSBwdXRfb2ZmO1xuXHRcdFx0XHRtZXNoLnB1dF9vbiAgPSBwdXRfb247XG5cdFx0XHRcdG1lc2gubWFzcyA9IG9iamVjdC5tYXNzO1xuXHRcdFx0XHRtZXNoLmFuZ3VsYXJfaW1wdWxzZSA9IG1lc2guYXZlbC5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKG1lc2gubWFzcylcblx0XHRcdFx0bWVzaC5pbXB1bHNlID0gbWVzaC52ZWwuY2xvbmUoKS5tdWx0aXBseVNjYWxhcihtZXNoLm1hc3MpXG5cdFx0XHRcdFxuXHRcdFxuXHRcdFx0XHRpZiAoc2VsZi5kb19wcmVwYXJlX3JlbmRlcmluZyl7XG5cdFx0XHRcdFx0aWYgKG9iamVjdC50eXBlICE9PSdzdGF0aWMnKXtcblx0XHRcdFx0XHRcdHZhciBsYWJlbCA9IFNwcml0ZVV0aWxzLm1ha2VUZXh0U3ByaXRlKFwibWVzaDogXCIgKyBpeCk7XG5cdFx0XHRcdFx0XHRsYWJlbC5wb3NpdGlvbiA9IG5ldyBzZWxmLlRIUkVFLlZlY3RvcjMoMCwwLDApO1xuXHRcdFx0XHRcdFx0bWVzaC5hZGQobGFiZWwpO1xuXHRcdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coXCJhZGRlZFwiKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dGhyZWVfc2NlbmUuYWRkKCBtZXNoICk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdC8vdmFyIHR1cnJldHMgPSB7fVxuXHRcdFx0XHQvL18uZWFjaChvYmplY3Qud29ya3BvaW50cywgZnVuY3Rpb24oIHdwICl7XG5cdFx0XHRcdC8vXHR0dXJyZXQgPSBvYmplY3QudHVycmV0c1sgd3AudHVycmV0IF0gXG5cdFx0XHRcdC8vXHR2YXIgdHVycmV0X3BvcyA9IG5ldyBzZWxmLlRIUkVFLlZlY3RvcjMoKTtcblx0XHRcdFx0Ly9cdHR1cnJldF9wb3MuZnJvbUFycmF5KHR1cnJldC5wb3NpdGlvbilcblx0XHRcdFx0Ly9cdHR1cnJldHNbIHdwLnR1cnJldCBdID0gdHVycmV0X3Bvcztcblx0XHRcdFx0Ly9cdG1lc2guYWRkKFxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdC8vfSlcblx0XHRcdFx0XG5cdFx0XHRcblx0XHRcdFx0c2VsZi5tZXNoZXNbIG9iamVjdC5HVUlEIF0gPSBtZXNoO1xuXHRcdFx0XHRzZWxmLmxvYWRlZF9vYmplY3RzX2NvdW50ICs9MTtcblx0XHRcdFx0c2VsZi5fbW9kZWxfbG9hZGVkKCBpeCApXG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdFxuXHRcdFx0aWYoc2VsZi5hamF4X2xvYWRfbW9kZWxzKXtcblx0XHRcdFx0c2VsZi5fZ2V0X21vZGVsKG9iamVjdC5tb2RlbF8zZCxzZWxmLl9hamF4X2dldHRlciwgd2l0aF9nZW9tX2FuZF9tYXQpXG5cdFx0XHR9ZWxzZXtcblx0XHRcdFx0c2VsZi5fZ2V0X21vZGVsKG1vZGVsX3BhdGgsIHNlbGYuX2ZzX2dldHRlciwgd2l0aF9nZW9tX2FuZF9tYXQpXG5cdFxuXHRcdFx0fVxuXHRcdH1cblx0XHRzZXRUaW1lb3V0KHJmLDEpO1xuXHRcdFxuXHR9KVxuXHRcdFx0XG5cdFxuXHRcbn0sXG5TY2VuZS5fYWpheF9nZXR0ZXI9ZnVuY3Rpb24obmFtZSwgY2IpIHtcblx0Ly9jb25zb2xlLmxvZyh0aGlzKTtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXHRzZWxmLmxvYWRlci5sb2FkKCBuYW1lLCBmdW5jdGlvbihnZW9tLCBtYXQpe1xuXHRcdFxuXHRcdHZhciBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoRmFjZU1hdGVyaWFsKCBtYXQgKTtcblx0XHQvL3ZhciBhID0ge2dlb206Z2VvbSwgbWF0ZXJpYWw6bWF0ZXJpYWx9XG5cdFx0Y2IoZ2VvbSwgbWF0ZXJpYWwpO1xuXHRcdFxuXHR9KVxufVxuU2NlbmUuX2ZzX2dldHRlcj1mdW5jdGlvbihuYW1lLCBjYil7XG5cdHZhciBzZWxmID0gdGhpcztcblx0ZnMucmVhZEZpbGUobmFtZSwgZnVuY3Rpb24oZXJyLGRhdGEpe1xuXHRcdC8vY29uc29sZS5sb2coXCJzdGFydCBsb2FkaW5nXCIpO1xuXHRcdGlmKGVycikgdGhyb3cgZXJyO1xuXHRcdHZhciBqc29uID0gSlNPTi5wYXJzZShkYXRhKVxuICAgICAgICB2YXIgcmVzdWx0ID0gc2VsZi5sb2FkZXIucGFyc2UoIGpzb24sICcnICk7XG5cblx0XHR2YXIgbGQgPSAoZnVuY3Rpb24oKXtcblx0XHRcdHZhciBtYXRlcmlhbCA9IG5ldyBzZWxmLlRIUkVFLk1lc2hGYWNlTWF0ZXJpYWwoIHJlc3VsdC5tYXRlcmlhbHMgKTtcblx0XHRcdGNiKHJlc3VsdC5nZW9tZXRyeSwgbWF0ZXJpYWwpO1xuXHRcdFxuXHRcdH0pXG5cdFx0c2V0VGltZW91dChsZCwxKTtcblx0fSk7XG59XG5cblNjZW5lLl9nZXRfbW9kZWwgPSBmdW5jdGlvbihuYW1lLCBnZXR0ZXIsIHdpdGhfZ2VvbV9hbmRfbWF0KXtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXHR2YXIgbWF0X2dlb21fY2IgPSBmdW5jdGlvbihnZW9tLCBtYXQpe1xuXHRcdHNlbGYuX21vZGVsX2NhY2hlW25hbWVdID0ge2dlb206Z2VvbSwgbWF0ZXJpYWw6bWF0fVxuXHRcdHdpdGhfZ2VvbV9hbmRfbWF0KGdlb20sIG1hdClcblx0fVxuXHRpZiAobmFtZSBpbiBzZWxmLl9tb2RlbF9jYWNoZSl7XG5cdFx0dmFyIGE9IHNlbGYuX21vZGVsX2NhY2hlW25hbWVdXG5cdFx0d2l0aF9nZW9tX2FuZF9tYXQoYS5nZW9tLCBhLm1hdGVyaWFsKVxuXHR9ZWxzZXtcblx0XHRnZXR0ZXIuYXBwbHkoc2VsZixbbmFtZSwgbWF0X2dlb21fY2JdKVxuXHR9XG5cdFx0XHRcdFxufVxuU2NlbmUuX2RlbGV0ZV9vYmplY3QgPSBmdW5jdGlvbihndWlkKXtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXHRpZihzZWxmLnRocmVlX3NjZW5lKXtcblx0XHRzZWxmLnRocmVlX3NjZW5lLnJlbW92ZShzZWxmLm1lc2hlc1tndWlkXSkgLy8g0YPQtNGP0LvRj9C10Lwg0Y/QtNGA0L4g0LjQtyDRgdGG0LXQvdGLXG5cdH1cblx0ZGVsZXRlIHNlbGYubWVzaGVzWyBndWlkIF07IC8vIC4uLiDQuNC3INC80LXRiNC10Llcblx0ZGVsZXRlIHNlbGYuX3NjZW5lX29iamVjdF9jYWNoZVsgZ3VpZCBdXG5cdFxuXHRcbn1cblNjZW5lLl9tb2RlbF9sb2FkZWQgPSBmdW5jdGlvbihpeCl7XG5cdC8vY29uc29sZS5sb2coXCJMTExcIik7XG5cdGlmICh0aGlzLmxvYWRlZF9vYmplY3RzX2NvdW50ID09IHRoaXMudG90YWxfb2JqZWN0c19jb3VudCl7XG5cdFx0Ly8gc2NlbmUgbG9hZGVkXG5cdFx0dGhpcy5pc19sb2FkZWQgPSB0cnVlO1xuXHRcdGlmICAodGhpcy5fY2FsbF9iYWNrKXtcblx0XHRcdHRoaXMuX2NhbGxfYmFjayh0aGlzKVxuXHRcdH1cblx0XHQvL2NvbnNvbGUubG9nKFwiRE9ORVwiKTtcblx0fWVsc2V7XG5cdFx0Ly9jb25zb2xlLmxvZygnbm90IHlldCcsIHRoaXMubG9hZGVkX29iamVjdHNfY291bnQgLCB0aGlzLnRvdGFsX29iamVjdHNfY291bnQpO1xuXHR9XG59XG5TY2VuZS5zeW5jID0gZnVuY3Rpb24oc3luYyl7XG5cdHZhciBzZWxmID0gdGhpcztcblx0Ly9zZWxmLnRhcmdldHMgPSB7fTtcblx0XG5cdF8uZWFjaChzeW5jLCBmdW5jdGlvbihvYmplY3QsIGd1aWQpe1xuXHRcdGlmICghKGd1aWQgaW4gc2VsZi5tZXNoZXMpKSByZXR1cm47XG5cdFx0c2VsZi5tZXNoZXNbZ3VpZF0ucGhfdGFyZ2V0cyA9IHt9XG5cdFxuXHRcdF8uZWFjaChvYmplY3QsIGZ1bmN0aW9uKHZlYywgbmFtZSl7XG5cdFx0XHR2YXIgdiA9IG5ldyBzZWxmLlRIUkVFLlZlY3RvcjMoKVxuXHRcdFx0di5mcm9tQXJyYXkodmVjKVxuXHRcdFx0XG5cdFx0XHQvL2lmKFsncG9zaXRpb24nLCAncm90YXRpb24nXS5pbmRleE9mKG5hbWUgKSA9PT0gLTEpe1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCduYW1lJywgbmFtZSk7XG5cdFx0XHRjb25zb2xlLmxvZyhcIlNZTkM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XCIpO1xuXHRcdFx0dmFyIHRhcmdldCA9IHt2ZWM6IHYsXG5cdFx0XHRcdFx0XHQgIHN0YXJ0ZWQ6ZmFsc2V9XG5cdFx0XHRzZWxmLm1lc2hlc1tndWlkXS5waF90YXJnZXRzW25hbWVdID0gdGFyZ2V0XG5cdFx0XHRzZWxmLm5lZWRfc3luYyA9IHRydWU7XG5cdFx0XHRcdFxuXHRcdFx0XHQvL31cblx0XHRcdFxuXHRcdFx0XG5cdFx0XHRcblx0XHRcdC8vaWYgKCF2LmVxdWFscyhvdikpe1xuXHRcdFx0Ly9cdGNvbnNvbGUubG9nKG5hbWUsIHZlYywgb3YudG9BcnJheSgpIClcblx0XHRcdC8vfVxuXHRcdFxuXHRcdH0pXG5cdFx0XG5cdH0pXG59XG5TY2VuZS5nZXQgPSBmdW5jdGlvbigpe1xuXHRyZXR1cm4gdGhpcy5fc2NlbmVcbn1cblNjZW5lLmdldF9hbG1hbmFjaCA9IGZ1bmN0aW9uKCl7XG5cdC8vIHZhciBzZWxmID0gdGhpcztcblx0XG5cdHJldHVybiB0aGlzLl9zY2VuZV9vYmplY3RfY2FjaGVcblx0XG59XG5TY2VuZS50aWNrID0gZnVuY3Rpb24oKXtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXHRpZihzZWxmLnRpY2tfbnVtKXtcblx0XHRzZWxmLnRpY2tfbnVtKz0xO1xuXHR9ZWxzZXtcblx0XHRzZWxmLnRpY2tfbnVtID0gMDtcblx0fVxuXHQvLyBjb25zb2xlLmxvZygnLicpO1xuXHQvL3ZhciB0aW1lX2luYyA9IDA7XG5cdHZhciB0aW1lX2xlZnQgPSBzZWxmLmNsb2NrLmdldERlbHRhKCk7XG5cdHNlbGYudGltZV9pbmMgKz0gdGltZV9sZWZ0O1xuXHRcblx0XG5cdGlmKHNlbGYubGFzdF90cyA9PT0gdW5kZWZpbmVkKXtcblx0XHRzZWxmLmxhc3RfdHMgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0fVxuXHRcblx0Ly9jb25zb2xlLmxvZyhzZWxmLnRpbWVfaW5jKTtcblx0XG5cdC8vIHZhciBhY3RvciA9IHNlbGYuZ2V0X2N1cnJlbnRfYWN0b3IoKVxuXHQvLyB2YXIgQyA9IHNlbGYubWVzaGVzKClbYWN0b3IuY29udHJvbC5vYmplY3RfZ3VpZF1cblx0Ly8gY29uc29sZS5sb2coc2VsZi5hdXRvbWF0aWNfYWN0b3JzKTtcblx0Xy5lYWNoKHNlbGYuYXV0b21hdGljX2FjdG9ycywgZnVuY3Rpb24oYWN0b3Ipe1xuXHRcdC8vY29uc29sZS5sb2coYWN0b3IpO1xuXHRcdGFjdG9yLnJ1bih0aW1lX2xlZnQpO1xuXHR9KVxuXHQvL2NvbnNvbGUubG9nKHRpbWVfaW5jKVxuXHRcblx0aWYoKE1hdGguZmxvb3Ioc2VsZi50aW1lX2luYykgJSA1ICkgPT09MCl7XG5cdFx0aWYgKCFzZWxmLl9kKXtcblx0XHRcdHNlbGYuX2QgPSB0cnVlXG5cdFx0XHQvL2NvbnNvbGUubG9nKFwiNXNlayB0aWNrXCIpXG5cdFx0XHQvLyBvbmx5IHR3byBmaXJzdFxuXHRcdFx0Zm9yKGkgaW4gc2VsZi5tZXNoZXMpe1xuXHRcdFx0XHR2YXIgbSA9IHNlbGYubWVzaGVzW2ldXG5cdFx0XHRcdGlmIChtLnR5cGUgPT0gJ3NoaXAnKXtcblx0XHRcdFx0XHR2YXIgdiA9IG0udmVsO1xuXHRcdFx0XHRcdHZhciBwID0gbS5pbXB1bHNlO1xuXHRcdFx0XHRcdHZhciB4ID0gbS5wb3NpdGlvbjtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHR2YXIgciA9IG0ucm90O1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGlmICh2KXtcblx0XHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKCd2JyxpLCB2LngsIHYueSwgdi56KVxuXHRcdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coJ3AnLGksIHAueCwgcC55LCBwLnopXG5cdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZygneCcsaSwgeC54LCB4LnksIHgueilcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRcblx0fWVsc2V7XG5cdFx0c2VsZi5fZCA9IGZhbHNlXG5cdH1cblx0dmFyIGdldF9pbXB1bHNlcyA9IGZ1bmN0aW9uKEZBLCBsYXN0X3RzLCBub3cpeyBcblx0XHR2YXIgcHMgPSBbXVxuXHRcdGlmIChGQS5sZW5ndGggPT0gMCkgcmV0dXJuIFtdXG5cdFx0aWYoRkEubGVuZ3RoID4gMSl7IC8vINCSINGB0L/QuNGB0LrQtSDQtdGB0YLRjCDRgdC40LvRiywg0LrQvtGC0L7RgNGL0LUg0YPQttC1INC/0LXRgNC10YHRgtCw0LvQuCDQtNC10LnRgdGC0LLQvtCy0LDRgtGMIFxuXHRcdFx0dmFyIF9sZW5ndGggPSBGQS5sZW5ndGg7XG5cdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgRkEubGVuZ3RoO2krKyl7XG5cdFx0XHRcdHZhciBpc19sYXN0ID0gaSA9PT0gKF9sZW5ndGgtMSlcblx0XHRcdFx0aWYoIWlzX2xhc3QpeyBcblx0XHRcdFx0XHR2YXIgYWN0c191bnRpbGwgPSBGQVtpKzFdLnRzXG5cdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdHZhciBhY3RzX3VudGlsbCA9IG5vdztcblx0XHRcdFx0fVxuXHRcdFx0XHR2YXIgYWN0c19zaW5jZSA9IEZBW2ldLnRzXG5cdFx0XHRcdGlmKGFjdHNfc2luY2UgPCBsYXN0X3RzKXthY3RzX3NpbmNlID0gbGFzdF90cyB9XG5cdFx0XHRcdHZhciB0aW1lID0gKGFjdHNfdW50aWxsIC0gYWN0c19zaW5jZSkvMTAwMDtcblx0XHRcdFx0dmFyIEYgPSBGQVtpXS52ZWMuY2xvbmUoKTtcblx0XHRcdFx0cHMucHVzaCgge2k6Ri5tdWx0aXBseVNjYWxhciggdGltZSApLCB0OnRpbWV9IClcblx0XHRcdH1cblx0XHRcdC8vY29uc29sZS5sb2cocHMpO1xuXHRcdFx0RkEuc3BsaWNlKDAsIEZBLmxlbmd0aCAtIDEpOyAvLyDRg9C00LDQu9GP0LXQvCDQstGB0LUg0YHQuNC70Ysg0LrRgNC+0LzQtSDQv9C+0YHQu9C10LTQvdC10Llcblx0XHRcdC8vY29uc29sZS5sb2coXCJUV09cIiwgcHMpO1xuXHRcdH1cblx0XHRlbHNleyAvLyDQvtC00L3QsCDRgdC40LvQsCDQsiDRgdC/0LjRgdC60LUgLSDQtNC10LnRgdGC0LLRg9C10YIg0LTQviDRgdC40YUg0L/QvtGALCDQuNC70Lgg0L3QsNGH0L3QtdGCINC00LXQudGB0YLQstC+0LLQsNGC0Ywg0YHQutC+0YDQvlxuXHRcdFx0dmFyIEYgPSBGQVswXS52ZWMuY2xvbmUoKVxuXHRcdFx0dmFyIGFjdHNfc2luY2UgPSBGQVswXS50c1xuXHRcdFx0XG5cdFx0XHQvL2NvbnNvbGUubG9nKG5vdyAtIGxhc3RfdHMpO1xuXHRcdFx0aWYoYWN0c19zaW5jZSA8IGxhc3RfdHMpeyBhY3RzX3NpbmNlID0gbGFzdF90cyB9XG5cdFx0XHRpZihhY3RzX3NpbmNlID49IG5vdykge1xuXHRcdFx0XHQvLyDQvdC40YfQtdCz0L4g0L/QvtC60LAg0L3QtSDQtNC10LvQsNC10LwgLSDQstC+0LfQstGA0LDRidCw0LXQvCDQv9GD0YHRgtGL0LUg0LjQvNC/0YPQu9GM0YHRiyBcblx0XHRcdFx0Y29uc29sZS5sb2coJ2luIGZ1dHVyZScpO1xuXHRcdFx0XHRyZXR1cm4gcHM7XG5cdFx0XHR9XG5cdFx0XHR2YXIgdGltZSA9IChub3cgLSBhY3RzX3NpbmNlKS8xMDAwO1xuXHRcdFx0Ly8gY29uc29sZS5sb2codGltZSwgbm93IC0gYWN0c19zaW5jZSApO1xuXHRcdFx0aWYgKEYubGVuZ3RoKCkgPT09IDApeyAvLyDQo9C00LDQu9GP0LXQvCDRgdC40LvRgywg0LXRgdC70Lgg0L7QvdCwINGA0LDQstC90LAg0L3Rg9C70Y5cblx0XHRcdFx0RkEuc3BsaWNlKDAsMSk7XG5cdFx0XHR9XG5cdFx0XHRwcy5wdXNoKHtpOkYubXVsdGlwbHlTY2FsYXIoIHRpbWUgKSwgdDp0aW1lfSk7XG5cdFx0XHQvLyBjb25zb2xlLmxvZyhcIk9ORVwiLCBwc1swXS5pLnoscHNbMF0udCk7XG5cdFx0XHRcblx0XHRcblx0XHR9XG5cdFx0XG5cdFx0XG5cdFx0cmV0dXJuIHBzXG5cdFx0XG5cdH1cblx0dmFyIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRfLmVhY2goc2VsZi5tZXNoZXMsIGZ1bmN0aW9uKG1lc2gsIGkpe1xuXHRcdGlmIChtZXNoLnR5cGUgPT0gJ3N0YXRpYycpIHJldHVybjtcblx0XHRcblx0XHR2YXIgcHMgPSBbXTtcblx0XHR2YXIgdW0gPSAxIC8gbWVzaC5tYXNzO1xuXHRcdHZhciB1bXQgPSB0aW1lX2xlZnQgKiB1bVxuXHRcdFxuXHRcdC8vIHZhciBGQSA9IHNlbGYudG90YWxfdG9ycXVlc1xuXHRcdC8vINCYINCyINC60L7QvdGG0LUt0LrQvtC90YbQvtCyINC+0YHRgtCw0LLQu9GP0LXQvCDQv9C+0YHQu9C10LTQvdC40Lkg0YLQsNC50LzRgdGC0LXQv1xuXHRcdC8vIGNvbnNvbGUubG9nKGksIG1lc2gudG90YWxfdG9ycXVlcywgbWVzaC50b3RhbF9wb3dlcnMpXG5cdFx0dmFyIHJvdHMgPSBtZXNoLmFuZ3VsYXJfaW1wdWxzZS5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKHVtdClcblx0XHR2YXIgcG9zZXMgPSBtZXNoLmltcHVsc2UuY2xvbmUoKS5tdWx0aXBseVNjYWxhcih1bXQpXG5cdFx0XG5cdFx0aWYoIG1lc2guaGFzX2VuZ2luZXMpIHtcblx0XHRcdHZhciBUSSA9IGdldF9pbXB1bHNlcyhtZXNoLnRvdGFsX3RvcnF1ZXMsIHNlbGYubGFzdF90cywgbm93KSAvLyDQmNC80L/Rg9C70YzRgdGLINCy0YDQsNGJ0LXQvdC40Y9cblx0XHRcdC8vbWVzaC50b3RhbF90b3JxdWVzID0gWyBtZXNoLnRvdGFsX3RvcnF1ZXNbbWVzaC50b3RhbF90b3JxdWVzLmxlbmd0aF0gXVxuXHRcdFx0dmFyIFBJID0gZ2V0X2ltcHVsc2VzKG1lc2gudG90YWxfcG93ZXJzLCBzZWxmLmxhc3RfdHMsIG5vdykgLy8g0JjQvNC/0YPQu9GM0YHRiyDQv9C+0YHRgtGD0L/QsNGC0LXQu9GM0L3QvtCz0L5cblx0XHRcdC8vdmFyIHRvdGFsX3QgPSAwXG5cdFx0XHRpZihUSS5sZW5ndGggPiAwKXtcblx0XHRcdFx0Ly9fLmVhY2goVEksIGZ1bmN0aW9uKGksIGludW0pe1xuXHRcdFx0XHQvL1x0Y29uc29sZS5sb2coXCJyZXNwb25zZXMgI1wiK2ludW0sIGkuaSwgaS50LCBzZWxmLnRvdGFsLmxlbmd0aCgpLCBzZWxmLnRvdGFsX3QpO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHQvL1x0c2VsZi50b3RhbC5hZGQoaS5pLmNsb25lKCkpXG5cdFx0XHRcdC8vXHRzZWxmLnRvdGFsX3QgKz0gaS50O1xuXHRcdFx0XHQvL30pXG5cblx0XHRcdFx0XG5cdFx0XHRcdFxuXHRcdFx0fVxuXHRcdFx0Xy5lYWNoKFRJLCBmdW5jdGlvbihpbXApe1xuXG5cdFx0XHRcblx0XHRcdFx0Ly8g0J/QvtC70YPRh9Cw0LXQvCDQtNC+0L/QvtC70L3QuNGC0LXQu9GM0L3Ri9C1INC40L3RgtC10LPRgNCw0LvRiyAtINGB0YPQvNC80LjRgNGD0LXQvCBcblx0XHRcdFx0cm90cy5hZGQoaW1wLmkuY2xvbmUoKS5tdWx0aXBseVNjYWxhciggdW0qaW1wLnQgKSkvLyDQmNC90YLQtdCz0YDQuNGA0YPQtdC8INC40LfQvNC10L3QtdC90LjRjyDRg9Cz0LvQvtCyINC/0L4g0LjQvNC/0YPQu9GM0YHQsNC8XG5cdFx0XHRcdG1lc2guYW5ndWxhcl9pbXB1bHNlLmFkZChpbXAuaSlcblx0XHRcdH0pXG5cdFx0XG5cdFx0XHRfLmVhY2goUEksIGZ1bmN0aW9uKGltcCl7XG5cdFx0XHRcdHZhciB2ID0gaW1wLmkuY2xvbmUoKTtcblx0XHRcdFx0di5hcHBseVF1YXRlcm5pb24obWVzaC5xdWF0ZXJuaW9uKTtcblx0XHRcdFx0cG9zZXMuYWRkKCB2LmNsb25lKCkubXVsdGlwbHlTY2FsYXIodW0qaW1wLnQpICkgLy8g0JjQvdGC0LXQs9GA0LjRgNGD0LXQvCDQuNC30LzQtdC90LXQvdC40Y8g0LrQvtC+0YDQtNC40L3QsNGCINC/0L4g0LjQvNC/0YPQu9GM0YHQsNC8XG5cdFx0XHRcdG1lc2guaW1wdWxzZS5hZGQodilcblx0XHRcdH0pXG5cdFx0XHRcblx0XHR9XG5cdFx0XG5cdFx0bWVzaC52ZWwgPSBtZXNoLmltcHVsc2UuY2xvbmUoKS5tdWx0aXBseVNjYWxhcih1bSk7XG5cdFx0XG5cdFx0bWVzaC5yb3RhdGVYKHJvdHMueClcblx0XHRtZXNoLnJvdGF0ZVkocm90cy55KVxuXHRcdG1lc2gucm90YXRlWihyb3RzLnopO1xuXHRcdFxuXHRcdG1lc2gucG9zaXRpb24uYWRkKHBvc2VzKTtcblx0XHRcblx0XHQvLy8g0JfQtNC10YHRjCDQvNGLINCx0YPQtNC10Lwg0LTQvtGB0YLQuNCz0LDRgtGMINC/0L7RgdGC0LDQstC70LXQvdC90YvRhSDRhtC10LvQtdC5INC00L4g0YLQtdGFINC40LzQv9GD0LvRjNGB0L7Qsiwg0Lgg0LrQvtC+0YDQtNC40L3QsNGCLCDQutC+0YLQvtGA0YvQuSDQvdCw0Lwg0L3Rg9C20L3Riywg0LTQu9GPINGN0YLQvtCz0L4g0YHQvdCw0YfQsNC70LBcblx0XHQvLyAg0J/QvtC/0YDQvtCx0YPQtdC8INC90LAg0LrQvtGI0LrQsNGFIC0g0YPQs9C70L7QstGL0YUg0LzQvtC80LXQvdGC0LDRhVxuXHRcdGlmKHNlbGYubmVlZF9zeW5jICYmIChtZXNoLnBoX3RhcmdldHMgIT09IHVuZGVmaW5lZCkpe1xuXHRcdFx0Ly8gY29uc29sZS5sb2cobWVzaC5waF90YXJnZXRzKVxuXHRcdFx0Xy5lYWNoKG1lc2gucGhfdGFyZ2V0cywgZnVuY3Rpb24odGFyZ2V0LCBuYW1lKXtcblx0XHRcdFx0aWYodGFyZ2V0LnN0YXJ0ZWQpe1xuXHRcdFx0XHRcdHZhciBkdiA9IHRhcmdldC52LmNsb25lKCkubXVsdGlwbHlTY2FsYXIodGltZV9sZWZ0KVxuXHRcdFx0XHRcdHRhcmdldC50b3RhbF90aW1lICs9IHRpbWVfbGVmdFxuXHRcdFx0XHRcdHRhcmdldC5kaWZmX2xlbmd0aCAtPSBkdi5sZW5ndGgoKTtcblx0XHRcdFx0XHQvL3RhcmdldC5kaWZmLnN1Yihkdik7XG5cdFx0XHRcdFx0aWYobmFtZT09PSdyb3RhdGlvbicpe1xuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhcInRpbWUgYW5kIGRpZmZcIiwgdGFyZ2V0LnRvdGFsX3RpbWUsdGFyZ2V0LmRpZmZfbGVuZ3RoLCB0YXJnZXQuZGlmZi50b0FycmF5KCksIGR2LnRvQXJyYXkoKSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmKG5hbWUgPT09ICdyb3RhdGlvbicpe1xuXHRcdFx0XHRcdFx0dmFyIF9yID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMygpLmZyb21BcnJheShtZXNoLnJvdGF0aW9uLnRvQXJyYXkoKSkuc3ViKGR2KS50b0FycmF5KCk7XG5cdFx0XHRcdFx0XHRtZXNoLnJvdGF0aW9uID0gbmV3IHNlbGYuVEhSRUUuRXVsZXIoKS5mcm9tQXJyYXkoX3IpO1xuXHRcdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdFx0bWVzaFtuYW1lXS5zdWIoZHYpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmKHRhcmdldC5kaWZmX2xlbmd0aCA8PSAwLjAwMSl7XG5cdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhcInN5bmNfc3RvcFwiKTtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0ZGVsZXRlIG1lc2gucGhfdGFyZ2V0c1tuYW1lXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XG5cdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdHZhciBhZnJvbSA9IG1lc2hbbmFtZV0udG9BcnJheSgpXG5cdFx0XHRcdFx0dmFyIGZyb20gPSBuZXcgc2VsZi5USFJFRS5WZWN0b3IzKCkuZnJvbUFycmF5KGFmcm9tKVxuXHRcdFx0XHRcdHRhcmdldC5kaWZmID0gZnJvbS5zdWIodGFyZ2V0LnZlYy5jbG9uZSgpKVxuXHRcdFx0XHRcdHRhcmdldC52ID0gdGFyZ2V0LmRpZmYuY2xvbmUoKS5tdWx0aXBseVNjYWxhcigxL3NlbGYuX3RhcmdldF9hcSlcblx0XHRcdFx0XHRpZihuYW1lID09PSAncm90YXRpb24nKXtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwic3RhcnQgbmV3IHN5bmMgXCIsIG5hbWUsIGFmcm9tLCB0YXJnZXQudmVjLnRvQXJyYXkoKSwgdGFyZ2V0LmRpZmYudG9BcnJheSgpLCB0YXJnZXQudi50b0FycmF5KCkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcblx0XHRcdFx0XHR0YXJnZXQuc3RhcnRlZCA9IHRydWU7XG5cdFx0XHRcdFx0dGFyZ2V0LnRvdGFsX3RpbWUgPSAwO1xuXHRcdFx0XHRcdHRhcmdldC5kaWZmX2xlbmd0aCA9IHRhcmdldC5kaWZmLmxlbmd0aCgpXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHQvKlxuXHRcdFx0XG5cdFx0XHRpZigncm90YXRpb24nIGluIG1lc2gucGhfdGFyZ2V0cyl7XG5cdFx0XHRcdFxuXHRcdFx0XHR2YXIgdG8gPSBtZXNoLnJvdGF0aW9uLnRvQXJyYXkoKVxuXHRcdFx0XHR2YXIgZnJvbSA9IG1lc2gucGhfdGFyZ2V0cy5yb3RhdGlvbi50b0FycmF5KClcblx0XHRcdFx0dmFyIHRvdiA9IG5ldyBzZWxmLlRIUkVFLlZlY3RvcjMoKS5mcm9tQXJyYXkodG8pXG5cdFx0XHRcdHZhciBSID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMygpLmZyb21BcnJheShmcm9tKS5zdWIodG92KTtcblx0XHRcdFx0aWYoUi5sZW5ndGgoKSA8IDAuMDEpe1xuXHRcdFx0XHRcdG1lc2gucm90YXRpb24gPSBtZXNoLnBoX3RhcmdldHMucm90YXRpb25cblx0XHRcdFx0XHRjb25zb2xlLmxvZygnUk9UIHRvbyBzbWFsbCcpO1xuXHRcdFx0XHRcdGRlbGV0ZSBtZXNoLnBoX3RhcmdldHNbJ3JvdGF0aW9uJ11cblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNle1xuXHRcdFx0XHRcdC8vaWYoc2VsZi5jdXJfdGljayA9PT0gdW5kZWZpbmVkKXtzZWxmLmN1cl90aWNrID0gc2VsZi50aWNrX251bTt9XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coXCJST1QgdGFyZ2V0XCIsIG1lc2gucGhfdGFyZ2V0cy5yb3RhdGlvbik7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coXCJST1QgZGlmZlwiLCBSKTtcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnUk9UIGxpbGwgYmlnJywgUi5sZW5ndGgoKSwgbWVzaC5yb3RhdGlvbik7XG5cdFx0XHRcdFx0Ui5tdWx0aXBseVNjYWxhcigxLyBzZWxmLl90YXJnZXRfYXEgKiB0aW1lX2xlZnQpO1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiPj5cIiwgUi54LCBSLnksIFIueik7XG5cdFx0XHRcdFx0bWVzaC5yb3RhdGVYKCBSLngpXG5cdFx0XHRcdFx0bWVzaC5yb3RhdGVZKCBSLnkpXG5cdFx0XHRcdFx0bWVzaC5yb3RhdGVaKCBSLnopXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coXCI+PlwiLCBtZXNoLnJvdGF0aW9uKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhSLmxlbmd0aCgpKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0XG5cdFx0XHR9XG5cdFx0XHRpZigncG9zaXRpb24nIGluIG1lc2gucGhfdGFyZ2V0cyl7XG5cdFx0XHRcdHZhciBQRCA9IG1lc2gucG9zaXRpb24uY2xvbmUoKS5zdWIobWVzaC5waF90YXJnZXRzLnBvc2l0aW9uLmNsb25lKCkpXG5cdFx0XHRcdGlmKFBELmxlbmd0aCgpIDwgMC4wMSl7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ1BPUyB0b28gc21hbGwnKTtcblx0XHRcdFx0XHRtZXNoLnBvc2l0aW9uID0gbWVzaC5waF90YXJnZXRzLnBvc2l0aW9uXG5cdFx0XHRcdFx0ZGVsZXRlIG1lc2gucGhfdGFyZ2V0c1sncG9zaXRpb24nXVxuXHRcdFx0XHRcdFxuXHRcdFx0XHR9ZWxzZXtcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnUE9TIGxpbGwgYmlnJywgUEQubGVuZ3RoKCkpO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdFBELm11bHRpcGx5U2NhbGFyKDEvIHNlbGYuX3RhcmdldF9hcSk7XG5cdFx0XHRcdFx0UEQubXVsdGlwbHlTY2FsYXIodGltZV9sZWZ0KVxuXHRcdFx0XHRcdG1lc2gucG9zaXRpb24uYWRkKFBEKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZignYW5ndWxhcl9pbXB1bHNlJyBpbiBtZXNoLnBoX3RhcmdldHMpe1xuXHRcdFx0XHR2YXIgYW5nX21vbV9kaWZmID0gbWVzaC5hbmd1bGFyX2ltcHVsc2UuY2xvbmUoKS5zdWIobWVzaC5waF90YXJnZXRzLmFuZ3VsYXJfaW1wdWxzZS5jbG9uZSgpKVxuXHRcdFx0XHR2YXIgYW1kViA9IGFuZ19tb21fZGlmZi5tdWx0aXBseVNjYWxhcigxLyBzZWxmLl90YXJnZXRfYXEpO1xuXHRcdFx0XHR2YXIgZG0gPSBhbWRWLm11bHRpcGx5U2NhbGFyKCB0aW1lX2xlZnQgKTtcblx0XHRcdFx0bWVzaC5hbmd1bGFyX2ltcHVsc2UuYWRkKGRtKVxuXHRcdFx0fVxuXHRcdFx0aWYoJ2ltcHVsc2UnIGluIG1lc2gucGhfdGFyZ2V0cyl7XG5cdFx0XHRcdHZhciBJRCA9IG1lc2guaW1wdWxzZS5jbG9uZSgpLnN1YihtZXNoLnBoX3RhcmdldHMuaW1wdWxzZS5jbG9uZSgpKVxuXHRcdFx0XHRJRC5tdWx0aXBseVNjYWxhcigxLyBzZWxmLl90YXJnZXRfYXEpO1xuXHRcdFx0XHRJRC5tdWx0aXBseVNjYWxhciggdGltZV9sZWZ0ICk7XG5cdFx0XHRcdG1lc2guaW1wdWxzZS5hZGQoZG0pXG5cdFx0XHR9XG5cdFx0XHQqL1xuXHRcdFx0XG5cdFx0XHQvLyBjb25zb2xlLmxvZyhhbmdfbW9tX2RpZmYsIGFuZ19yb3RfZGlmZiApO1xuXHRcdFxuXHRcdH1cblx0XHRcblx0XHR2YXIgX3RoaXNfY2FjaGU9e31cblx0XHRfLmVhY2goWydwb3NpdGlvbicsICdyb3RhdGlvbicsICdpbXB1bHNlJywgJ2FuZ3VsYXJfaW1wdWxzZSddLCBmdW5jdGlvbih2KXtcblx0XHRcdHZhciB2ZWMgPSBtZXNoW3ZdO1xuXHRcdFx0aWYoIHZlYyApIF90aGlzX2NhY2hlW3ZdID0gdmVjLnRvQXJyYXkoKTtcblx0XHR9KVxuXHRcdHNlbGYuX3NjZW5lX29iamVjdF9jYWNoZVtpXSA9IF90aGlzX2NhY2hlO1xuXHRcdFxuXHR9KVxuXHRzZWxmLmxhc3RfdHMgPSBub3dcblx0XG59XG5TY2VuZU9iamVjdC5wcm90b3R5cGUgPSBTY2VuZVxubW9kdWxlLmV4cG9ydHMgPSBTY2VuZU9iamVjdCIsInZhciBTY2VuZSA9IHJlcXVpcmUoJy4vc2NlbmUuanMnKVxudmFyIHUgPSByZXF1aXJlKCcuL3V0aWxzLmpzJylcbnZhciBfICAgICA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcblxuXG52YXIgZ2V0TWlzc2lvblR5cGUgPWZ1bmN0aW9uICh0eXBlKXtcblx0cmV0dXJuIGNyZWF0ZV9taXNzaW9uX2pzb24oKVxufVxuXG52YXIgY3JlYXRlX21pc3Npb25fanNvbiA9IGZ1bmN0aW9uKCAgKXtcblx0dmFyIHAxID0gWy0xMTAsIDEwMCwgNDBdO1xuXHR2YXIgcDIgPSBbNTAwLCAyMDAsIC01MF07XG5cdHZhciBjID0gMC4yXG5cdHZhciBwMSA9IF8ubWFwKHAxLGZ1bmN0aW9uKHYpe3JldHVybiB2KmN9KTtcblx0dmFyIHAyID0gXy5tYXAocDIsZnVuY3Rpb24odil7cmV0dXJuIHYqY30pOztcblx0XG5cdHZhciBkZWZfc2hpcDEgPSB7dHlwZTonc2hpcCcsXG5cdFx0XHRcdFx0IFwic2hpcF90eXBlXCI6XCJEZWZhdWx0XCIsXG5cdFx0XHRcdFx0XHQgbW9kZWxfM2Q6Jy9tb2RlbHMvU3RhckNydWlzZXIuanMnLFxuXHRcdFx0XHRcdFx0IHBoeXNpY2FsOntcblx0XHRcdFx0XHRcdFx0IHBvczpwMSxcblx0XHRcdFx0XHRcdFx0IHJvdDp7dG86cDJ9LFxuXHRcdFx0XHRcdFx0IH0sXG5cdFx0XHRcdFx0IFxuXHRcdFx0XHRcdFx0IFwiY2FtZXJhc1wiOntcblx0XHRcdFx0XHRcdFx0XHRcImZyb250XCI6e1xuXHRcdFx0XHRcdFx0XHRcdFx0XCJsYWJlbFwiOlwibWFpblwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XCJwb3NpdGlvblwiOiBbMCwwLjUsMF0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcImRpcmVjdGlvblwiOlswLDAsLTFdXG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFwiYmFja1wiOntcblx0XHRcdFx0XHRcdFx0XHRcdFx0XCJsYWJlbFwiOlwibWFpblwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcInBvc2l0aW9uXCI6IFswLDAuNSwyXSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XCJkaXJlY3Rpb25cIjpbMCwwLDFdXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcInR1cnJldHNcIjp7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFwiZnJvbnRcIjp7XCJ0eXBlXCI6XCJiYWxsaXN0aWNcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCBcInBvc2l0aW9uXCI6IFswLDAuNSwwXX0sXG5cdFx0IFx0XHRcdFx0XHRcdFx0XHRcImJhY2tcIjp7XCJ0eXBlXCI6XCJiYWxsaXN0aWNcIixcblx0XHQgXHRcdFx0XHRcdFx0XHRcdFx0XHQgXCJwb3NpdGlvblwiOiBbMCwwLDJdfVxuXG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XCJ3b3JrcG9pbnRzXCI6e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcIlBpbG90aW5nXCI6e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJ2aWV3c1wiOiBbXCJmcm9udFwiLFwiYmFja1wiXSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwidHlwZVwiOlwicGlsb3RcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFwiRnJvbnQgdHVycmV0XCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcInZpZXdzXCI6W1wiZnJvbnRcIl0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcInR5cGVcIjpcInR1cnJldFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJ0dXJyZXRcIjpcImZyb250XCJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0XHRcdFx0XCJCYWNrIHR1cnJldFwiOntcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwidmlld3NcIjpbXCJiYWNrXCJdLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJ0eXBlXCI6XCJ0dXJyZXRcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwidHVycmV0XCI6XCJiYWNrXCJcblx0XHRcdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdCdlbmdpbmVzJzp7XG5cdFx0XHRcdFx0XHRcdCdyb3RhdGlvbic6e1xuXHRcdFx0XHRcdFx0XHRcdCd4Kyc6MTAwMCwneC0nOjEwMDAsXG5cdFx0XHRcdFx0XHRcdFx0J3krJzoxMDAwLCd5LSc6MTAwMCxcblx0XHRcdFx0XHRcdFx0XHQneisnOjEwMDAsJ3otJzoxMDAwXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdCdwcm9wdWxzaW9uJzp7XG5cdFx0XHRcdFx0XHRcdFx0J3grJzoxLCd4LSc6MSxcblx0XHRcdFx0XHRcdFx0XHQneSsnOjEsJ3ktJzoxLFxuXHRcdFx0XHRcdFx0XHRcdCd6Kyc6NTAwMCwnei0nOjUwMDBcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdCdtYXNzJzogMTAwMDAsXG5cdFx0XHRcdFx0XHQnR1VJRCc6dS5tYWtlX2d1aWQoKVxuXHRcdFx0XHRcdH1cblx0dmFyIGRlZl9zaGlwMiA9IHt0eXBlOidzaGlwJyxcbiBcdFx0XHRcdFx0IFwic2hpcF90eXBlXCI6XCJEZWZhdWx0XCIsXG5cdFxuXHRcdFx0XHRcdFx0IG1vZGVsXzNkOicvbW9kZWxzL1N0YXJDcnVpc2VyLmpzJyxcblx0XHRcdFx0XHRcdCBwaHlzaWNhbDp7XG5cdFx0XHRcdFx0XHRcdCBwb3M6cDIsXG5cdFx0XHRcdFx0XHRcdCByb3Q6e3RvOnAxfSxcblx0XHRcdFx0XHRcdCBcblx0XHRcdFx0XHRcdCB9LFxuXHRcdFx0IFx0XHRcdFwiY2FtZXJhc1wiOntcblx0XHRcdCBcdFx0XHRcdFx0XCJmcm9udFwiOntcblx0XHRcdCBcdFx0XHRcdFx0XHRcImxhYmVsXCI6XCJtYWluXCIsXG5cdFx0XHQgXHRcdFx0XHRcdFx0XCJwb3NpdGlvblwiOiBbMCwwLjUsMF0sXG5cdFx0XHQgXHRcdFx0XHRcdFx0XCJkaXJlY3Rpb25cIjpbMCwwLC0xXVxuXHRcdFx0IFx0XHRcdFx0XHRcdH0sXG5cdFx0XHQgXHRcdFx0XHRcdFwiYmFja1wiOntcblx0XHRcdCBcdFx0XHRcdFx0XHRcdFwibGFiZWxcIjpcIm1haW5cIixcblx0XHRcdCBcdFx0XHRcdFx0XHRcdFwicG9zaXRpb25cIjogWzAsMC41LDJdLFxuXHRcdFx0IFx0XHRcdFx0XHRcdFx0XCJkaXJlY3Rpb25cIjpbMCwwLDFdXG5cdFx0XHQgXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XCJ0dXJyZXRzXCI6e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcImZyb250XCI6e1widHlwZVwiOlwiYmFsbGlzdGljXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQgXCJwb3NpdGlvblwiOiBbMCwwLjUsMF19LFxuXHRcdCBcdFx0XHRcdFx0XHRcdFx0XCJiYWNrXCI6e1widHlwZVwiOlwiYmFsbGlzdGljXCIsXG5cdFx0IFx0XHRcdFx0XHRcdFx0XHRcdFx0IFwicG9zaXRpb25cIjogWzAsMCwyXX1cblxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFwid29ya3BvaW50c1wiOntcblx0XHRcdFx0XHRcdFx0XHRcdFx0XCJQaWxvdGluZ1wiOntcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwidmlld3NcIjogW1wiZnJvbnRcIixcImJhY2tcIl0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcInR5cGVcIjpcInBpbG90XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcIkZyb250IHR1cnJldFwiOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJ2aWV3c1wiOltcImZyb250XCJdLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJ0eXBlXCI6XCJ0dXJyZXRcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwidHVycmV0XCI6XCJmcm9udFwiXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFwiQmFjayB0dXJyZXRcIjp7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcInZpZXdzXCI6W1wiYmFja1wiXSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwidHlwZVwiOlwidHVycmV0XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcInR1cnJldFwiOlwiYmFja1wiXG5cdFx0XHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHQgXHRcdFx0J2VuZ2luZXMnOntcblx0XHRcdCBcdFx0XHRcdCdyb3RhdGlvbic6e1xuXHRcdFx0IFx0XHRcdFx0XHQneCsnOjEwMDAsJ3gtJzoxMDAwLFxuXHRcdFx0IFx0XHRcdFx0XHQneSsnOjEwMDAsJ3ktJzoxMDAwLFxuXHRcdFx0IFx0XHRcdFx0XHQneisnOjEwMDAsJ3otJzoxMDAwXG5cdFx0XHQgXHRcdFx0XHR9LFxuXHRcdFx0IFx0XHRcdFx0J3Byb3B1bHNpb24nOntcblx0XHRcdCBcdFx0XHRcdFx0J3grJzoxLCd4LSc6MSxcblx0XHRcdCBcdFx0XHRcdFx0J3krJzoxLCd5LSc6MSxcblx0XHRcdCBcdFx0XHRcdFx0J3orJzo1MDAwLCd6LSc6NTAwMFxuXHRcdFx0IFx0XHRcdFx0fVxuXHRcdFx0IFx0XHRcdH0sXG5cdFx0XHQgXHRcdFx0J21hc3MnOiAxMDAwMCxcblx0XHRcdFx0XHRcdCdHVUlEJzp1Lm1ha2VfZ3VpZCgpXG5cdFx0XHRcdFx0fVxuXHQvLyDQltC10YHRgtC60L4g0LfQsNC00LDQvdC90YvQtSDQutC+0YDQsNCx0LvQuNC60LggLSDQsdC10Lcg0L/QvtC30LjRhtC40Lkg0Lgg0YHQutC+0YDQvtGB0YLQtdC5XHRcblx0dmFyIHBpdm90PSBcdGZ1bmN0aW9uKHgseSx6KXtcblx0XHRyZXR1cm4ge3R5cGU6J3N0YXRpYycsXG5cdFx0XG5cdFx0XHRcdFx0XHQgbW9kZWxfM2Q6Jy9tb2RlbHMvc3AuanMnLFxuXHRcdFx0XHRcdFx0IHBoeXNpY2FsOntcblx0XHRcdFx0XHRcdFx0IHBvczpbeCwgeSwgel1cblx0XHRcdFx0XHRcdFx0IC8vcm90Ont0bzogWy0xMTAsIDEwMCwgNDBdfSxcblx0XHRcdFx0XHRcdCBcblx0XHRcdFx0XHRcdCB9LFxuXHRcdFx0IFx0XHRcdCdtYXNzJzogMTAwMDAwMCxcblx0XHRcdFx0XHRcdCdHVUlEJzp1Lm1ha2VfZ3VpZCgpXG5cdFx0XHRcdFx0fVxuXHR9XG5cdHRoaXMuX2RoMiA9IGRlZl9zaGlwMjsgLy8g0KHQvtGF0YDQsNC90Y/QtdC8INC60L7RgNCw0LHQu9C40LogLSDQv9C+0YLQvtC80YMg0YfRgtC+INC/0L7QutCwINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjCDQvdC1INCy0YvQsdC40YDQsNC10YIg0LrQvtGA0LDQsdC70YwgLSDQvtC9INC10LzRgyDQvdCw0LfQvdCw0YfQsNC10YLRgdGPXHRcdFxuXHR2YXIgc28gPSB7fVxuXHRfLmVhY2goW2RlZl9zaGlwMSxkZWZfc2hpcDJdLCBmdW5jdGlvbihzKXtcblx0XHRzb1tzLkdVSURdID0gc1xuXHR9KVxuXHQvLyDQl9C00LXRgdGMINC80Ysg0L/RgNC+0YHRgtC+INC90LDQv9C+0LvQvdGP0LXQvCDRgdGG0LXQvdGLINGI0LDRgNC40LrQsNC80LggLSDQv9C+INGD0LzRgywg0Y3RgtC4INGI0LDRgNC40LrQuCDQvdCw0LTQviDRgdC+0LfQtNCw0LLQsNGC0Ywg0L3QtSDQt9C00LXRgdGMIC0g0LAg0LjQvdC20LXQutGC0LjRgtGMINC40Lcg0LzQuNGA0LBcblx0Lypcblx0dmFyIGluYyA9IDBcblx0dmFyIHN0ZXAgPSAyMDA7XG5cdGZvciAodmFyIHg9LTIwMDsgeDw9IDIwMDsgeCs9c3RlcCl7XG5cdFx0Zm9yICh2YXIgeT0tMjAwOyB5PD0gMjAwOyB5Kz1zdGVwKXtcblx0XHRcdGZvciAodmFyIHo9LTIwMDsgejw9IDIwMDsgeis9c3RlcCl7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coaW5jLFwieCx5LHpcIix4LHkseilcblx0XHRcdFx0aW5jICs9MTtcblx0XHRcdFx0dmFyIHAgPXBpdm90KHgseSx6KVxuXHRcdFx0XHRzb1twLkdVSURdID0gcFxuXHRcdFx0fVxuXHRcdH1cblx0fSovXG5cdC8vIC0tLSDQndCw0L/QvtC70L3QtdC90LjQtSDRgdGG0LXQvdGLXG5cdHZhciBtaXNzaW9uID0ge1xuXHRcdGFjdG9ycyA6IHt9LFxuXHRcdGNvbW1hbmRzOlsncmVkJywgJ2JsdWUnXSxcblx0XHRfY29tbWFuZHNfYW1vdW50OlsxLDBdLFxuXHRcdG1heF9wZXJfY29tbWFuZDoxLFxuXHRcdG1pbl9wZXJfY29tbWFuZDoxLFxuXHRcdGNvb3JkcyA6IFsxMDAsIDUwMCwgMzAwXSwgLy8gR2xvYmFsIGNvb3JkcyBvZiBtaXNzaW9uIG9yaWdpblxuXHRcdHNoYXJlZF9vYmplY3RzOiBzbyxcblx0XHRvYmplY3RzX2Zvcl9jb21tYW5kOntcInJlZFwiOltkZWZfc2hpcDEuR1VJRF0sXCJibHVlXCI6W2RlZl9zaGlwMi5HVUlEXX1cblx0XHRcblx0fVxuXHRyZXR1cm4gbWlzc2lvblxufVxudmFyIE1pc3Npb24gPSBmdW5jdGlvbih0eXBlKXtcblx0dGhpcy5kZXNjciA9IFwiTWlzc2lvblwiXG5cdHRoaXMubWlzc2lvbiA9IGdldE1pc3Npb25UeXBlKHR5cGUpO1xuXHQvL2NvbnNvbGUubG9nKHRoaXMubWlzc2lvbik7XG5cdFxufVxuXG5NaXNzaW9uLnByb3RvdHlwZSA9IHtcblx0Y29uc3RydWN0b3I6IE1pc3Npb24sXG5cdFxuXG5cblx0Y3JlYXRlIDpmdW5jdGlvbihjcmVhdG9yX2lkLCBjYWxsYmFjayl7XG5cdFxuXHRcdC8vIE5vIHBhcmFtcyAtIG9ubHkgb25lIG1pc3Npb24gYXZhaWxhYmxlXG5cdFx0dmFyIHNlbGYgPSB0aGlzIDtcblx0XHR0aGlzLkdVSUQgPSB1Lm1ha2VfZ3VpZCgpO1xuXHRcdHRoaXMuY3JlYXRvciA9IGNyZWF0b3JfaWQ7XG5cdFx0dGhpcy5yZWFkeV90b19zdGFydCA9IGZhbHNlXG5cdFx0dGhpcy5pc19zdGFydGVkID0gZmFsc2Vcblx0XHR0aGlzLl91c2VycyA9IHt9O1xuXHRcdHRoaXMuX3Bvc2l0aW9uX2JpbmRzID0ge307XG5cdFx0dGhpcy5fdG90YWxfYWN0b3JzID0gMDtcblx0XHR0aGlzLl90b3RhbF9sb2dpbnMgPSAwO1xuXHRcdFxuXG5cdFxuXG5cdFx0c2VsZi5fbWlzc2lvbl9sb2dpbnMgPSBbXTtcblx0XHRzZWxmLl9taXNzaW9uX29iamVjdHMgPSB7fVxuXHRcdFxuXHRcdHNlbGYuX21pc3Npb25fcmVhZHkgPSBmdW5jdGlvbigpe1xuXHRcdFx0Y2FsbGJhY2soc2VsZik7XG5cdFx0XG5cdFx0XG5cdFx0fVxuXHRcdC8vIHNlbGYucHJlcGFyZV9zY2VuZSgpO1xuXHRcdHNlbGYuX21pc3Npb25fcmVhZHkoKTtcblx0XHRyZXR1cm4gdGhpc1xuXHR9LFxuXHRnZXRTY2VuZTogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5fc2NlbmU7XG5cdH0sXG5cdHByZXBhcmVfc2NlbmUgOiBmdW5jdGlvbigpe1xuXHRcblx0XHQvLyBjb25zb2xlLmxvZyhTY2VuZSk7XG5cdFx0aWYoISB0aGlzLl9zY2VuZV9sb2FkZWQpe1xuXHRcdFx0Ly8gY29uc29sZS5sb2coXCJETyBQUkVQIFNDRU5FXCIpXG5cdFx0XHR0aGlzLl9zY2VuZSA9IG5ldyBTY2VuZSh0aGlzLm1pc3Npb24uY29vcmRzWzBdLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLm1pc3Npb24uY29vcmRzWzFdLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLm1pc3Npb24uY29vcmRzWzJdICk7XG5cdFx0XHQvL2NyZWF0ZV9mcm9tX3dvcmxkKHRoaXMubWlzc2lvbi5jb29yZHNbMF0sXG5cdFx0XHQvL1x0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5taXNzaW9uLmNvb3Jkc1sxXSxcblx0XHRcdC8vXHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLm1pc3Npb24uY29vcmRzWzJdICk7XG5cdFx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0XHRfLmVhY2godGhpcy5taXNzaW9uLnNoYXJlZF9vYmplY3RzLCBmdW5jdGlvbihvYmope1xuXHRcdFx0XHRzZWxmLl9zY2VuZS5qb2luX29iamVjdChvYmopXG5cdFxuXHRcdFx0fSlcdFx0XG5cdFx0XHR2YXIgYWN0b3JzID0gdGhpcy5wcmVwYXJlX2FjdG9ycygpXHRcdFx0XHRcdFx0XHRcdFxuXHRcdFx0Xy5lYWNoKGFjdG9ycywgZnVuY3Rpb24oYXMpeyAvLyDQnNC40YHRgdC40Y8g0LTQviDRjdGC0L7Qs9C+INCy0YDQtdC80LXQvdC4INC90LUg0LjQvNC10LvQsCDRgdGG0LXQvdGLIC0g0L3QsNC00L4g0LTQsNGC0Ywg0LXRkSDQutCw0LbQtNC+0LzRgyDQsNC60YLQvtGA0YMg0LfQtNC10YHRjFxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGEpXG5cdFx0XHRcdGFzLnNjZW5lID0gc2VsZi5fc2NlbmUuR1VJRFxuXHRcdFx0XHRzZWxmLl9zY2VuZS5qb2luX2FjdG9yKGFzKTtcblx0XHRcdH0pXG5cdFx0XHR0aGlzLl9zY2VuZV9sb2FkZWQ9IHRydWU7XG5cdFx0XHQvLyBjb25zb2xlLmxvZyhcIlByZXBkXCIpXG5cdFx0fVxuXHRcdFxuXHRcdFx0XHRcdFx0XHRcblx0fSxcblx0cHJlcGFyZV9hY3RvcnM6IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHZhciBhY3RvcnMgPSBbXVxuXHRcdF8uZWFjaCh0aGlzLl91c2VycywgZnVuY3Rpb24ocG9zaXRpb25zX29mX3VzZXIsIHVzZXJfaWQpe1xuXHRcdFx0Xy5lYWNoKHBvc2l0aW9uc19vZl91c2VyLCBmdW5jdGlvbihwb3NpdGlvbil7XG5cdFx0XHRcdFxuXHRcdFx0XHRhY3RvcnMucHVzaChzZWxmLl9tYWtlX2FjdG9yKHBvc2l0aW9uLCB1c2VyX2lkKSk7XG5cdFx0XHRcdFxuXHRcdFx0fSlcblx0XHR9KVxuXHRcdHJldHVybiBhY3RvcnM7XG5cdH0sXG5cdF9tYWtlX2FjdG9yOiBmdW5jdGlvbihwb3NfaWQsIHVzZXJfaWQpe1xuXHRcdHZhciBwb3MgPSB0aGlzLl9wb3NpdGlvbnNbcG9zX2lkXVxuXHRcdHZhciBuZXdfYWN0b3JfZ3VpZCA9IHUubWFrZV9ndWlkKClcblx0XHR2YXIgY29udHJvbGxhYmxlID0ge29iamVjdF9ndWlkOnBvcy5vYmplY3RfZ3VpZCwgd29ya3BvaW50OnBvcy53b3JrcG9pbnR9IC8vIHZpZXdwb3J0Oidmcm9udCcsIGNvbnRyb2xzOlsnUGlsb3QnLCAnVHVycmV0J119IFxuXHRcdGNvbnNvbGUubG9nKHRoaXMuX3Bvc2l0aW9ucywgcG9zX2lkLCB1c2VyX2lkLCBwb3MpO1xuXHRcdHJldHVybiB7Y29tbWFuZDpwb3MuY29tbWFuZCwgdXNlcl9pZDogdXNlcl9pZCwgY29udHJvbDogY29udHJvbGxhYmxlLCBHVUlEOiAgbmV3X2FjdG9yX2d1aWR9XG5cdFx0XG5cdH0sXG5cdFxuXHRqb2luX3BsYXllciA6ZnVuY3Rpb24odXNlcl9pZCwgcG9zaXRpb25faWQgKXsvLyBsb2dpbiwgY29tbWFuZCwgb2JqZWN0X2d1aWQsIHBsYWNlKXtcblx0XHRpZiAodGhpcy5fcG9zaXRpb25zW3Bvc2l0aW9uX2lkXS5idXN5KXtyZXR1cm47fTtcblx0XHRcblx0XHRpZih0aGlzLl91c2Vyc1t1c2VyX2lkXSA9PT0gdW5kZWZpbmVkKXsgLy8g0J7QtNC40L0g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GMINC80L7QttC10YIg0LjQvNC10YLRjCDQvdC10YHQutC+0LvRjNC60L4g0L/QvtC30LjRhtC40Llcblx0XHRcdHRoaXMuX3VzZXJzW3VzZXJfaWRdID0gW3Bvc2l0aW9uX2lkXTtcblx0XHRcdFxuXHRcdH1lbHNle1xuXHRcdFx0dGhpcy5fdXNlcnNbdXNlcl9pZF0ucHVzaChwb3NpdGlvbl9pZCk7XG5cdFx0XHRcblx0XHR9XG5cdFx0dGhpcy5fcG9zaXRpb25fYmluZHNbcG9zaXRpb25faWRdID0gdXNlcl9pZCAvLyDQn9C+0LfQuNGG0LjQtdC5INC80L7QttC10YIg0YPQv9GA0LDQstC70Y/RgtGMIC0g0L3QsCDQvdC10Lkg0YHQuNC00LXRgtGMIC0g0YLQvtC70YzQutC+INC+0LTQuNC9INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjFxuXHRcdHRoaXMuX3Bvc2l0aW9uc1twb3NpdGlvbl9pZF0uYnVzeSA9IHRydWU7XG5cdFx0dGhpcy5fcG9zaXRpb25zW3Bvc2l0aW9uX2lkXS51c2VyX2lkID0gdXNlcl9pZDtcblx0XHRcblx0XHRpZih0aGlzLmlzX3N0YXJ0ZWQpe1xuXHRcdFx0dmFyIGFjdG9yID0gdGhpcy5fbWFrZV9hY3Rvcihwb3NpdGlvbl9pZCwgdXNlcl9pZCk7XG5cdFx0XHRhY3Rvci5zY2VuZSA9IHRoaXMuX3NjZW5lLkdVSUQ7XG5cdFx0XHR0aGlzLl9zY2VuZS5qb2luX2FjdG9yKGFjdG9yKVxuXHRcdH1cblx0XHRcblx0XHQvKlxuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR2YXIgTSA9IHNlbGYubWlzc2lvbjtcblx0XHR2YXIgY29tbWFuZDtcblx0XHQvLyBHZXQgZmlyc3QgYXZhaWxhYmxlIGNvbW1hbmRcblx0XHQvLyBjb25zb2xlLmxvZyhcIkxPR0lOXCIsIGxvZ2luKVxuXHRcdGlmIChzZWxmLl9taXNzaW9uX29iamVjdHNbb2JqZWN0X2d1aWRdID09PSB1bmRlZmluZWQpe1xuXHRcdFx0c2VsZi5fbWlzc2lvbl9vYmplY3RzW29iamVjdF9ndWlkXSA9IHt9XG5cdFx0fVxuXHRcdC8vXy5lYWNoKHBsYWNlcywgZnVuY3Rpb24ocCl7IC8vINCt0YLQvtGCINC60Y3RiCDQuNGB0L/QvtC70YzQt9GD0LXRgtGB0Y8g0L/RgNC4INC30LDQv9C+0LvQvdC10L3QuNC4INC80LXRgdGCINC90LAg0LrQvtGA0LDQsdC70Lhcblx0XHRcdHNlbGYuX21pc3Npb25fb2JqZWN0c1tvYmplY3RfZ3VpZF1bcGxhY2VdID0gbG9naW47XG5cdFx0XHRcblx0XHRcdC8vfSlcblx0XHQvLyBUT0RPINCX0LTQtdGB0Ywg0L3QsNC00L4g0LLRgdGC0LDQstC70Y/RgtGMINC40LPRgNC+0LrQvtCyIC0g0L3QtdC30LDQstC40YHQuNC80L4g0L7RgiDRgtC+0LPQviwg0YHQutC+0LvRjNC60L4g0LvQvtCz0LjQvdC+0LJcblx0XHQvLyBUT0RPINCd0LDQtNC+INC/0YDQvtCy0LXRgNGP0YLRjCDQvdCw0LvQuNGH0LjQtSDQu9C+0LPQuNC90L7QsiDQuCDQtdGB0LvQuCDQtdGB0YLRjCAtINC90LUg0YLRg9C/0L4g0LTQvtCx0LDQstC70Y/RgtGMLCDQsCDQtNC+0LHQsNCy0LvRj9GC0Ywg0LXQvNGDINCy0L7RgNC60L/QvtC40L3RglxuXHRcdC8vINCf0L4g0LfQsNC90Y/RgtGL0Lwg0LLQvtGA0LrQv9C+0LjQvdGC0LDQvCDRgdC40YfRgtCw0YLRjCDQs9C+0YLQvtCy0L3QvtGB0YLRjFxuXHRcdHZhciBjb250cm9sbGFibGUgPSB7b2JqZWN0X2d1aWQ6b2JqZWN0X2d1aWQsIHdvcmtwb2ludDpwbGFjZX0gLy8gdmlld3BvcnQ6J2Zyb250JywgY29udHJvbHM6WydQaWxvdCcsICdUdXJyZXQnXX0gXG5cdFx0dmFyIG5ld19hY3Rvcl9ndWlkID0gdS5tYWtlX2d1aWQoKVxuXHRcdHZhciBhY3RvciA9IHtjb21tYW5kOmNvbW1hbmQsIGxvZ2luOmxvZ2luLCBjb250cm9sOiBjb250cm9sbGFibGUsIEdVSUQ6ICBuZXdfYWN0b3JfZ3VpZH1cblx0XHQvLyDQlNC+0LHQsNCy0LvRj9C10Lwg0LDQutGC0L7RgNCwIC0g0LjQvdC00LXQutGB0LjRgNGD0Y8g0L/QviDQu9C+0LPQuNC90YNcblx0XHRpZiAoc2VsZi5taXNzaW9uLmFjdG9yc1tuZXdfYWN0b3JfZ3VpZF0gPT09IHVuZGVmaW5lZCl7XG5cdFx0XHRzZWxmLm1pc3Npb24uYWN0b3JzW25ld19hY3Rvcl9ndWlkXSA9IFthY3Rvcl1cblx0XHR9ZWxzZXtcblx0XHRcdHNlbGYubWlzc2lvbi5hY3RvcnNbbmV3X2FjdG9yX2d1aWRdLnB1c2goYWN0b3IpXG5cdFx0fVxuXHRcdFxuXHRcdHNlbGYuX3RvdGFsX2FjdG9ycyArPSAxXG5cdFx0aWYoc2VsZi5fdG90YWxfYWN0b3JzID49IDIpe1xuXHRcdFx0Y29uc29sZS5sb2coXCJMT0dJTlNcIiwgc2VsZi5fbWlzc2lvbl9sb2dpbnMpO1xuXHRcdFx0c2VsZi5yZWFkeV90b19zdGFydCA9IHRydWU7XG5cdFx0fWVsc2V7XG5cdFx0XHRjb25zb2xlLmxvZyhcIlRPVEFMX0FDVE9SU1wiLCBzZWxmLl90b3RhbF9hY3RvcnMpO1xuXHRcdH1cblx0XHRcblx0XHRjb25zb2xlLmxvZyhcIlRBXCIsc2VsZi5fdG90YWxfYWN0b3JzKTtcblx0XHQvLyBjb25zb2xlLmxvZyhcIkFDVE9SU1wiLCBzZWxmLm1pc3Npb24uYWN0b3JzKTtcblx0XHRpZiAoc2VsZi5fc2NlbmUpe1xuXHRcdFx0YWN0b3Iuc2NlbmUgPSBzZWxmLl9zY2VuZS5HVUlEXG5cdFx0XHRzZWxmLl9zY2VuZS5qb2luX2FjdG9yKGFjdG9yKVxuXHRcdH1cblx0XHRyZXR1cm4gbmV3X2FjdG9yX2d1aWRcblx0XHQqL1xuXHR9LFxuXHR0b19qc29uOmZ1bmN0aW9uKCl7XG5cdFx0dmFyIHJldCA9IHt9O1xuXHRcdF8uZXh0ZW5kKHJldCwgdGhpcy5taXNzaW9uKTtcblx0XHRyZXQucG9zaXRpb25zID0gdGhpcy5wb3NpdGlvbnMoKVxuXHRcdHJldC5HVUlEID0gdGhpcy5HVUlEO1xuXHRcdHJldHVybiByZXQ7XG5cdH0sXG5cdHBvc2l0aW9uczogZnVuY3Rpb24oY2Ipe1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHQvL2NvbnNvbGUubG9nKHRoaXMpO1xuXHRcdHZhciBwbGFjZXMgPSBbXTtcblx0XHRpZihzZWxmLl9wb3NpdGlvbnMpe1xuXHRcdFx0aWYoY2IpY2Ioc2VsZi5fcG9zaXRpb25zKTtcblx0XHRcdHJldHVybiBzZWxmLl9wb3NpdGlvbnM7XG5cdFx0XHRcblx0XHR9ZWxzZXtcblx0XHRcdHNlbGYuX3Bvc2l0aW9ucyA9IFtdXG5cdFx0XHR2YXIgY291bnRlciA9IDA7XG5cdFx0XHRfLmVhY2goc2VsZi5taXNzaW9uLmNvbW1hbmRzLCBmdW5jdGlvbihjb21tYW5kKXtcblx0XHRcdFx0Xy5lYWNoKHNlbGYubWlzc2lvbi5vYmplY3RzX2Zvcl9jb21tYW5kW2NvbW1hbmRdLCBmdW5jdGlvbihvYmplY3RfZ3VpZCl7XG5cdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coY29tbWFuZCwgc2VsZi5taXNzaW9uLnNoYXJlZF9vYmplY3RzKTtcblx0XHRcdFx0XHR2YXIgb2JqZWN0ID0gc2VsZi5taXNzaW9uLnNoYXJlZF9vYmplY3RzW29iamVjdF9ndWlkXVxuXHRcdFx0XHRcdF8uZWFjaChvYmplY3Qud29ya3BvaW50cywgZnVuY3Rpb24od29ya3BvaW50LCB3cF9sYWJlbCl7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHR2YXIgcGxhY2UgPSB7J2NvbW1hbmQnOmNvbW1hbmQsXG5cdFx0XHRcdFx0XHQgXHRcdFx0ICdvYmplY3RfdHlwZSc6IG9iamVjdC50eXBlLFxuXHRcdFx0XHRcdFx0XHRcdFx0ICdvYmplY3Rfc3VidHlwZSc6b2JqZWN0LnNoaXBfdHlwZSxcblx0XHRcdFx0XHRcdFx0XHRcdCAnb2JqZWN0X2d1aWQnOiBvYmplY3QuR1VJRCxcblx0XHRcdFx0XHRcdFx0XHQgXHQgJ3dvcmtwb2ludCc6d3BfbGFiZWwsXG5cdFx0XHRcdFx0XHRcdFx0XHQgJ01HVUlEJyA6IHNlbGYuR1VJRFxuXHRcdFx0XHRcdFx0XHRcdCBcblx0XHRcdFx0XHRcdFx0XHQgfVxuXHRcdFx0XHRcdFx0XHRcdCBwbGFjZS5pZCA9IGNvdW50ZXI7XG5cdFx0XHRcdFx0XHRcdFx0IGNvdW50ZXIgKz0gMTtcblx0IFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0XHQgXG5cdFx0XHRcdFx0XHRzZWxmLl9wb3NpdGlvbnMucHVzaChwbGFjZSlcblx0XHRcdFx0XHRcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcblx0XHRcdFx0XG5cdFx0XHRcdH0pXG5cdFx0XHRcblx0XHRcdH0pXG5cdFx0XHRpZihjYiljYihwbGFjZXMpO1xuXHRcdFx0cmV0dXJuIHNlbGYuX3Bvc2l0aW9ucztcblx0XHRcdFxuXHRcdH1cblx0fVxuXHRcbn1cbi8vY29uc29sZS5sb2coTWlzc2lvbik7XG5tb2R1bGUuZXhwb3J0cyA9IE1pc3Npb24iLCJ2YXIgVEhSID0gcmVxdWlyZSgnLi90aHJlZS5ub2RlLmpzJyk7XG52YXIgVXRpbHMgPSByZXF1aXJlKFwiLi9VdGlscy5qc1wiKTtcbnZhciBfICAgICA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcblxuXG52YXIgQ29udHJvbGxlciA9IHtkZXNjcmlwdGlvbjonY29udHJvbGxlcid9XG5cdFxuXHRcbkNvbnRyb2xsZXIuTmV0d29ya0FjdG9yID0gICBmdW5jdGlvbihvbkFjdCwgVyl7XG5cdFx0XG5cdFx0dmFyIG1hcCA9IENvbnRyb2xsZXIuQ29udHJvbGxlcnNBY3Rpb25NYXAoKVxuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHRcblx0XHR0aGlzLnJ1biA9IGZ1bmN0aW9uKCl7XG5cdFx0XHQvLyBubyBuZWVkIHRvIGJvdGhlciAtIGV2ZW50IHN0eWxlXG5cdFx0fVxuXHRcdHRoaXMuYWN0PWZ1bmN0aW9uKFMsIGFjdGlvbiwgaXNfb24sIGFjdG9yKXtcblx0XHRcdC8vdmFyIEMgPSBXLm1lc2hlc1sgVy5hY3RvcnNbYWN0b3JdLmNvbnRyb2wub2JqZWN0X2d1aWQgXVxuXHRcdFx0Ly8gY29uc29sZS5sb2coYWN0aW9uKVxuXHRcdFx0Ly8gY29uc29sZS5sb2coXCJTQ0VORVNcIixzY2VuZXMsIGFjdG9yLnNjZW5lKTtcblx0XHRcdC8vIGNvbnNvbGUubG9nKFwibXkgdGltZVwiLCBuZXcgRGF0ZSgpLmdldFRpbWUoKS8xMDAwKVxuXHRcdFx0Ly8gY29uc29sZS5sb2coXCJzZXJ2ZXIgdGltZVwiLCBhY3Rpb24udGltZXN0YW1wLzEwMDAgKVxuXHRcdFx0Ly8gY29uc29sZS5sb2coXCJteSB0aW1lIC0gc2VydnRpbWVcIiwgbmV3IERhdGUoKS5nZXRUaW1lKCkvMTAwMCAtIGFjdGlvbi50aW1lc3RhbXAvMTAwMCApXG5cdFx0XHRpZiAoVyAhPT0gdW5kZWZpbmVkKXtcblx0XHRcdFx0Ly8gY29uc29sZS5sb2coVywgVy5fdGltZV9kaWZmKTtcblx0XHRcdFx0YWN0aW9uLnRpbWVzdGFtcCAtPSBXLl90aW1lX2RpZmZcblx0XHRcdH1cblx0XHRcdC8vIGNvbnNvbGUubG9nKFwibXkgdGltZSAtIHNlcnZ0aW1lIFtmaXhlZF1cIiwgbmV3IERhdGUoKS5nZXRUaW1lKCkvMTAwMCAtIGFjdGlvbi50aW1lc3RhbXAvMTAwMCApXG5cdFx0XHRcblx0XHRcdC8vIGNvbnNvbGUubG9nKCAgKVxuXHRcdFx0dmFyIF9hID0gbWFwW2FjdGlvbi50eXBlXS5hY3QoUywgYWN0aW9uLCBpc19vbiwgYWN0b3IsIG9uQWN0KTtcblx0XHRcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5Db250cm9sbGVyLkxvY2FsSW5wdXRBY3RvciA9IGZ1bmN0aW9uKFcsIHNvY2tldCl7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHNlbGYuV29ybGQgPSBXO1xuXHRcdHZhciBtYXAgPSBDb250cm9sbGVyLkNvbnRyb2xsZXJzQWN0aW9uTWFwKClcblx0XHR2YXIgYWN0b3IgPSBXLmxvZ2luO1xuXHRcdFxuXHRcdFxuXHRcdC8vc2VsZi5hY3Rvcl9sb2dpbiA9IGFjdG9yX2xvZ2luXG5cdFx0c2VsZi5fZGVmYXVsdF9hY3Rpb25zPXtcblx0XHRcdDY1OiB7dHlwZToncm90YXRlJywgYXhpczoneScsZGlyOicrJ30sXG5cdFx0XHQ2ODoge3R5cGU6J3JvdGF0ZScsIGF4aXM6J3knLGRpcjonLSd9LFxuXHRcdFxuXHRcdFx0ODc6IHt0eXBlOidyb3RhdGUnLCBheGlzOid4JyxkaXI6Jy0nfSxcblx0XHRcdDgzOiB7dHlwZToncm90YXRlJywgYXhpczoneCcsZGlyOicrJ30sXG5cdFx0XG5cdFx0XHQ5MDoge3R5cGU6J3JvdGF0ZScsIGF4aXM6J3onLGRpcjonKyd9LFxuXHRcdFx0Njc6IHt0eXBlOidyb3RhdGUnLCBheGlzOid6JyxkaXI6Jy0nfSxcblx0XHRcblx0XHRcdDc5OiB7dHlwZToncm90YXRlYycsIGF4aXM6J3gnLGRpcjonKyd9LFxuXHRcdFx0ODA6IHt0eXBlOidyb3RhdGVjJywgYXhpczoneCcsZGlyOictJ30sXG5cdFx0XG5cdFx0XHQ3Mzoge3R5cGU6J3JvdGF0ZWMnLCBheGlzOid5JyxkaXI6JysnfSxcblx0XHRcdDc1OiB7dHlwZToncm90YXRlYycsIGF4aXM6J3knLGRpcjonLSd9LFxuXHRcdFxuXHRcdFx0Mzg6IHt0eXBlOidtb3ZlJywgYXhpczoneicsZGlyOictJ30sXG5cdFx0XHQ0MDoge3R5cGU6J21vdmUnLCBheGlzOid6JyxkaXI6JysnfSxcblx0XHRcblx0XHRcdCdsbW91c2UnOnsndHlwZSc6ICdzaG9vdF9wcmltYXJ5JywgJ190dXJyZXRfZGlyZWN0aW9uJzogZnVuY3Rpb24odCxrKXtcblx0XHRcdFx0ZGVsZXRlIHRba11cblx0XHRcdFx0Ly8gY29uc29sZS5sb2coXCJ3XCIpXG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKFcuY29udHJvbGxhYmxlKCkpO1xuXHRcdFx0XHQvL3ZhciBUID0gQ29udHJvbGxlci5UKCk7XG5cdFx0XHRcdFxuXHRcdFx0XHQvL3ZhciBDID0gVy5jb250cm9sbGFibGUoKTtcblx0XHRcdFx0Ly92YXIgQ2MgPSBXLmdldF9tYWluX3ZpZXdwb3J0KCkuY2FtZXJhXG5cdFx0XHRcdC8vdmFyIGNhbWVyYV9wb3NpdGlvbl92ZWN0b3IgPSBuZXcgVC5WZWN0b3IzKClcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhDLmpzb24pO1xuXHRcdFx0XHQvL3ZhciBjYW1lcmEgPSAgQy5qc29uLmNhbWVyYXNbQ2NdXG5cdFx0XHRcdC8vY29uc29sZS5sb2coY2FtZXJhKTtcblx0XHRcdFx0Ly9jYW1lcmFfcG9zaXRpb25fdmVjdG9yLmZyb21BcnJheShjYW1lcmEucG9zaXRpb24pO1xuXHRcdFx0XHQvL2NhbWVyYV9wb3NpdGlvbl92ZWN0b3IuYXBwbHlFdWxlciggQy5yb3RhdGlvbi5jbG9uZSgpIClcblx0XHRcdFx0Ly9jYW1lcmFfcG9zaXRpb25fdmVjdG9yLmFkZChDLnBvc2l0aW9uLmNsb25lKCkpO1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKFwiY2FtZXJhIHBvcyBpbiBXXCIsIGNhbWVyYV9wb3NpdGlvbl92ZWN0b3IpO1xuXHRcdFx0XHRcblx0XHRcdFx0dFtrLnN1YnN0cigxKV0gPSBXLm1vdXNlX3Byb2plY3Rpb25fdmVjLmNsb25lKCkgLy8uc3ViKGNhbWVyYV9wb3NpdGlvbl92ZWN0b3IpXG5cdFx0XHR9fSxcblx0XHR9XG5cdFxuXHRcdHNlbGYuYWN0aW9ucyA9IHNlbGYuX2RlZmF1bHRfYWN0aW9ucztcblx0XHRzZWxmLl9rZXljb2Rlc19pbl9hY3Rpb24gPSB7fVxuXHRcdHRoaXMuaW5wdXQgPSBmdW5jdGlvbihrZXljb2RlLCB1cF9vcl9kb3duLCBtb2RpZmllcnMpe1xuXHRcdFx0Ly8gMS4gU2VuZCB0byBzZXJ2ZXIgYWN0aW9uXG5cdFx0XHRpZihfLmhhcyhzZWxmLl9rZXljb2Rlc19pbl9hY3Rpb24sIGtleWNvZGUpKXtcblx0XHRcdFx0dmFyIHN0YXRlID0gc2VsZi5fa2V5Y29kZXNfaW5fYWN0aW9uW2tleWNvZGVdXG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKHN0YXRlLCB1cF9vcl9kb3duKVxuXHRcdFx0XHRpZihzdGF0ZSA9PT0gdXBfb3JfZG93bil7Ly8g0KHQvtGB0YLQvtGP0L3QuNC1INC90LUg0LjQt9C80LXQvdC40LvQvtGB0YwgLSDQvdC40YfQtdCz0L4g0L3QtSDQtNC10LvQsNC10Lxcblx0XHRcdFx0XHRyZXR1cm4gXG5cdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdHNlbGYuX2tleWNvZGVzX2luX2FjdGlvbltrZXljb2RlXSA9IHVwX29yX2Rvd25cblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdH1lbHNle1xuXHRcdFx0XHRzZWxmLl9rZXljb2Rlc19pbl9hY3Rpb25ba2V5Y29kZV0gPSB1cF9vcl9kb3duXG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdFxuXHRcdFx0dmFyIHRzID0gbmV3IERhdGUoKS5nZXRUaW1lKClcblx0XHRcdHZhciBhY3Rpb24gPSBfLmNsb25lKHNlbGYuYWN0aW9uc1trZXljb2RlXSk7XG5cdFx0XHRhY3Rpb24udGltZXN0YW1wID0gdHNcblx0XHRcdGFjdGlvbi50aW1lc3RhbXAgKz0gVy5hdmVyYWdlX3BpbmdfaW5zdGFiaWxpdHkgLy8g0J3QtdGB0YLQsNCx0LjQu9GM0L3QvtGB0YLRjCDQv9C40L3Qs9CwIC0g0YfQtdC8INC/0LjQvdCzINCx0L7Qu9GM0YjQtSAtINGC0LXQvCDQvNC10L3RjNGI0LUg0L3QtdGB0YLQsNCx0LjQu9GM0L3QvtGB0YLRjFxuXHRcdFx0Ly8g0J3QsCDQvNCw0LvQtdC90YzQutC40YUg0LfQvdCw0YfQtdC90LjRjyDQvdC1INC/0YDQtdCy0YvRiNCw0LXRgiDQt9C90LDRh9C10L3QuNGPINC/0LjQvdCz0LBcblx0XHRcdCBcblx0XHRcdFxuXHRcdFx0Ly8gY29uc29sZS5sb2coXCJteSBkaWZmXCIsIFcuX3RpbWVfZGlmZilcblx0XHRcdFxuXHRcdFx0Ly8gY29uc29sZS5sb2coXCJteSB0aW1lXCIsIG5ldyBEYXRlKCkuZ2V0VGltZSgpLzEwMDApXG5cdFx0XHQvLyBjb25zb2xlLmxvZyhcInNlcnZlciB0aW1lXCIsIGFjdGlvbi50aW1lc3RhbXAvMTAwMCApXG5cdFx0XHQvLyBjb25zb2xlLmxvZyhcIm15IHRpbWUgLSBzZXJ2dGltZVwiLCBuZXcgRGF0ZSgpLmdldFRpbWUoKS8xMDAwIC0gYWN0aW9uLnRpbWVzdGFtcC8xMDAwIClcblx0XHRcdFxuXHRcdFx0Ly8gY29uc29sZS5sb2coYWN0aW9uKTtcblx0XHRcdGlmIChhY3Rpb24pe1xuXHRcdFx0XHRfLmVhY2goYWN0aW9uLCBmdW5jdGlvbihpdGVtLCBrKXtcblx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZygnYScpO1xuXHRcdFx0XHRcdGlmIChrWzBdID09ICdfJyl7XG5cdFx0XHRcdFx0XHRpdGVtKGFjdGlvbixrKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhhY3Rpb24pO1xuXHRcdFx0XHQvLyBET05FXG5cdFx0XHRcdC8vIDIuIEFjdCBpdCBsb2NhbGx5XG5cdFx0XHRcdHZhciBvbkFjdCA9IGZ1bmN0aW9uKCl7IC8qY29uc29sZS5sb2coJ3RoaXMgaXMga2V5Ym9hcmQgY29udHJvbGxlciAtIG5vIG5lZWQgaW4gb25BY3QgaGVyZScpICovfVxuXHRcdFx0XHRsb2NhbF9jb250cm9sbGVyID0gbWFwW2FjdGlvbi50eXBlXVxuXHRcdFx0XHR2YXIgYWN0b3JzID0gVy5nZXRfbWFpbl92aWV3cG9ydCgpLmFjdG9yc1xuXHRcdFx0XHRcblx0XHRcdFx0Xy5lYWNoKGFjdG9ycywgZnVuY3Rpb24oYWN0b3Ipe1xuXHRcdFx0XHRcdHZhciBTID0gVy5zY2VuZXNbYWN0b3Iuc2NlbmVdO1xuXHRcdFx0XHRcdHZhciBvYmogPSBTLmdldF9vYmplY3RzKClbYWN0b3IuY29udHJvbC5vYmplY3RfZ3VpZF07XG5cdFx0XHRcdFx0dmFyIHdwID0gb2JqLndvcmtwb2ludHNbYWN0b3IuY29udHJvbC53b3JrcG9pbnRdO1xuXHRcdFx0XHRcdGlmICh3cC50eXBlID09IGxvY2FsX2NvbnRyb2xsZXIudHlwZSl7XG5cdFx0XHRcdFx0XHR2YXIgYV9jbG9uZSA9IF8uY2xvbmUoYWN0aW9uKVxuXHRcdFx0XHRcdFx0bG9jYWxfY29udHJvbGxlci5hY3Qoc2VsZi5Xb3JsZC5zY2VuZXNbYWN0b3Iuc2NlbmVdLCBhY3Rpb24sIHVwX29yX2Rvd24sIGFjdG9yLCBvbkFjdCk7XG5cdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhhY3Rpb24pO1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRhX2Nsb25lLnRpbWVzdGFtcCArPSBXLl90aW1lX2RpZmY7XG5cdFx0XHRcdFx0XHRpZiAodXBfb3JfZG93bil7XG5cdFx0XHRcdFx0XHRcdHNvY2tldC5lbWl0KCdjb250cm9sX29uJywge2FjdGlvbjphX2Nsb25lLCBhY3RvcjphY3Rvcn0pO1xuXHRcdFx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0XHRcdHNvY2tldC5lbWl0KCdjb250cm9sX29mZicsIHthY3Rpb246YV9jbG9uZSwgYWN0b3I6YWN0b3J9KTtcblx0XHRcdFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2cod3ApO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHR9KVxuXHRcdFx0XHRcblx0XHRcdFx0Ly8gbG9jYWxfY29udHJvbGxlci5hY3Qoc2VsZi5Xb3JsZC5zY2VuZSwgYWN0aW9uLCB1cF9vcl9kb3duLCBhY3Rvciwgb25BY3QpO1xuXHRcdFx0fVxuXHRcdFx0Ly9ET05FXG5cdFx0fVxuXHR9O1xuXG5cbkNvbnRyb2xsZXIuQ1BpbG90Q29udHJvbGxlciA9IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy50eXBlPSdwaWxvdCc7XG5cdFx0dGhpcy5hY3Rpb25fdHlwZXM9Wydyb3RhdGUnLCAnbW92ZSddXG5cdFx0ZnVuY3Rpb24gZ2V0X2F4aXMoYSl7XG5cdFx0XHRpZihhID09ICd4Jyl7XG5cdFx0XHRcdGF4aXMgPSBuZXcgQ29udHJvbGxlci5UKCkuVmVjdG9yMygxLDAsMClcblx0XHRcdH1cblx0XHRcdGlmKGEgPT0gJ3knKXtcblx0XHRcdFx0YXhpcyA9IG5ldyBDb250cm9sbGVyLlQoKS5WZWN0b3IzKDAsMSwwKVxuXHRcdFx0fVxuXHRcdFx0aWYoYSA9PSAneicpe1xuXHRcdFx0XHRheGlzID0gbmV3IENvbnRyb2xsZXIuVCgpLlZlY3RvcjMoMCwwLDEpXG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gYXhpc1xuXHRcdFxuXHRcdFxuXHRcdH1cblx0XG5cdFx0dGhpcy5hY3QgPSBmdW5jdGlvbihTLCBhY3Rpb24sIGlzX2Rvd24sIGFjdG9yLCBvbkFjdCApe1xuXHRcdFx0Ly8gY29uc29sZS5sb2coJ1dhdCcpO1xuXHRcdFx0Ly8gY29uc29sZS5sb2coXCJtb3ZlIGJ5XCIsIGFjdG9yKVxuXHRcdFx0Ly9pZiAoYWN0b3IgPT09IHVuZGVmaW5lZCl7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coXCJNWVwiLCBXLmFjdG9yc1tXLmxvZ2luXS5jb250cm9sLm9iamVjdF9ndWlkKVxuXHRcdFx0Ly9cdHZhciBDID0gUy5jb250cm9sbGFibGUoKVxuXHRcdFx0Ly99ZWxzZXtcblx0XHRcdGlmKFMgPT09IHVuZGVmaW5lZCApIHJldHVybjtcblx0XHRcdHZhciBDID0gUy5tZXNoX2ZvcihhY3Rvcilcblx0XHRcdHZhciBUID0gQ29udHJvbGxlci5UKCk7XG5cdFx0XHRcblx0XHRcdHZhciBldHMgPSB7cm90YXRlOidyb3RhdGlvbicsIG1vdmU6J3Byb3B1bHNpb24nfVxuXHRcdFx0dmFyIGV0ID0gZXRzW2FjdGlvbi50eXBlXVxuXHRcdFx0dmFyIEFYPSBhY3Rpb24uYXhpcztcblx0XHRcdGlmKCEgaXNfZG93bil7XG5cdFx0XHRcdHZhciB2ZWMgPSBuZXcgVC5WZWN0b3IzKDAsMCwwKVxuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdHZhciBhID0gYWN0aW9uLmRpciA9PSAnKyc/IDEgOiAtMTtcblx0XHRcdFx0XG5cdFx0XHRcdHZhciB2ZWMgPSBBWCA9PSAneCc/bmV3IFQuVmVjdG9yMyhhLDAsMCk6KEFYID09J3knP25ldyBULlZlY3RvcjMoMCwgYSwgMCk6IG5ldyBULlZlY3RvcjMoMCwwLGEpKVxuXHRcdFx0XHQvLyDQotC10L/QtdGA0Ywg0LXQs9C+INC90LDQtNC+INGD0LzQvdC+0LbQuNGC0Ywg0L3QsCDQvNC+0YnQvdC+0YHRgtGMINC00LLQuNCz0LDRgtC10LvRjyDQuCDQv9C+0LvRg9GH0LjRgtGMINGB0LjQu9GDXG5cdFx0XHRcdHZhciBwb3dlciA9IEMuZW5naW5lc1tldF1bYWN0aW9uLmF4aXMgKyBhY3Rpb24uZGlyXTtcblx0XHRcdFx0dmVjLm11bHRpcGx5U2NhbGFyKHBvd2VyKVxuXHRcdFx0fVxuXHRcdFx0dmFyIG4gPSBhY3Rpb24uYXhpcythY3Rpb24uZGlyXG5cdFx0XHRpZighQy5wb3dlcnMpe1xuXHRcdFx0XHRDLnBvd2VycyA9IHt9XG5cdFx0XHR9XG5cdFx0XHRpZighQy5wb3dlcnNbZXRdKXtcblx0XHRcdFx0Qy5wb3dlcnNbZXRdID0ge31cblx0XHRcdH1cblx0XHRcdEMucG93ZXJzW2V0XVtuXSA9IHZlYy5jbG9uZSgpXG5cdFx0XHRcblx0XHRcdFxuXHRcdFx0aWYgKGV0ID09IFwicm90YXRpb25cIil7XG5cdFx0XHRcdHZhciB0b3QgPSBuZXcgVC5WZWN0b3IzKDAsMCwwKVxuXHRcdFx0XHRfLmVhY2goQy5wb3dlcnMucm90YXRpb24sIGZ1bmN0aW9uKHYsZW5hbWUpe1xuXHRcdFx0XHRcdHRvdC5hZGQodilcblx0XHRcdFx0XG5cdFx0XHRcdH0pXG5cdFx0XHRcdEMudG90YWxfdG9ycXVlcy5wdXNoKHt0czphY3Rpb24udGltZXN0YW1wLCB2ZWM6dG90fSApXG5cdFx0XHR9XG5cdFx0XHRpZiAoZXQgPT0ncHJvcHVsc2lvbicpe1xuXHRcdFx0XHR2YXIgdG90ID0gbmV3IFQuVmVjdG9yMygwLDAsMClcblx0XHRcdFx0Xy5lYWNoKEMucG93ZXJzLnByb3B1bHNpb24sIGZ1bmN0aW9uKHZlYyxlbmFtZSl7XG5cdFx0XHRcdFx0dG90LmFkZCh2ZWMpXG5cdFx0XHRcdH0pXG5cdFx0XHRcblx0XHRcdFx0Qy50b3RhbF9wb3dlcnMucHVzaCgge3RzOmFjdGlvbi50aW1lc3RhbXAsIHZlYzp0b3R9IClcblx0XHRcdH1cblx0XHRcdG9uQWN0KEMuR1VJRClcblx0XHRcdC8vINCf0L7Qu9GD0YfQuNC70Lgg0LXQtNC40L3QuNGH0L3Ri9C5INCy0LXQutGC0L7RgCDRgtGP0LPQuCBcblx0XHRcdC8qXG5cdFxuXHRcdFx0aWYgKGFjdGlvbi50eXBlID09ICdyb3RhdGUnKXtcblx0XHRcdFx0aWYgKGlzX2Rvd24pe1xuXHRcdFx0XHRcdEMucHV0X29uKFwicm90YXRpb25cIiwgdmVjLCBhY3Rpb24udGltZXN0YW1wKVxuXHRcdFx0XHR9ZWxzZXtcblx0XHRcdFx0XHRDLnB1dF9vZmYoXCJyb3RhdGlvblwiLCB2ZWMsIGFjdGlvbi50aW1lc3RhbXApXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmIChhY3Rpb24udHlwZSA9PSAnbW92ZScpe1xuXHRcdFxuXHRcdFx0XHR2YXIgYSA9IGFjdGlvbi5kaXIgPT0gJysnPzE6LTE7XG5cdFx0XG5cdFx0XHRcdC8vIHZhciBtID0gbmV3IENvbnRyb2xsZXIuVCgpLk1hdHJpeDQoKVxuXHRcdFx0XHRpZiAoaXNfZG93bil7XG5cdFx0XHRcdFx0Qy5wdXRfb24oXCJwcm9wdWxzaW9uXCIsIHZlYywgYWN0aW9uLnRpbWVzdGFtcClcblx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0Qy5wdXRfb2ZmKFwicHJvcHVsc2lvblwiLCB2ZWMsIGFjdGlvbi50aW1lc3RhbXApXG5cdFx0XHRcdH1cblx0XHRcdH0qL1xuXG5cdFx0XHRcblx0XHR9XG5cdFx0Ly8gcmV0dXJuIHRoaXM7XG5cdFxuXHR9O1xuXG5cbkNvbnRyb2xsZXIuYmFzaWNBdXRvUGlsb3RBY3Rvcj1mdW5jdGlvbiAoUywgaWQsIG9pZCl7XG5cdFx0dGhpcy50YXJnZXRzID0gW1wib3JiaXRfb2JqZWN0XCIsIFwiY2xvc2VfdG9fb2JqZWN0XCJdO1xuXHRcdHRoaXMuZGVmYXVsdF9kaXN0YW5jZSA9IDIwMFxuXHRcdHRoaXMuZ2V0X2ZvZXMgPSBmdW5jdGlvbigpe1xuXHRcdFx0dGhpcy5mb2VzID0gW11cblx0XHRcdGZvciAodmFyIGkgPTA7IGkgPCBXLm1lc2hlcy5sZW5ndGg7IGkrKyl7XG5cdFx0XHRcdGlmKGkgIT0gaWQpIGZvZXMucHVzaCh7aWQ6aWQsIG9iajpXLm1lc2hlc1tpXX0pXG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuQ29udHJvbGxlci5CYXNpY0J1bGxldEFjdG9yPWZ1bmN0aW9uKFMsIGlkLCBjb2lkKXsgXG5cdFx0Ly8gaWQgPSBpcyBvYmplY3QgaW4gdGhlIHdvcmxkIGNvbnRyb2xsYWJsZSBieSB0aGlzIGFjdG9yXG5cdFx0Ly8gY29pZCAgTVVTVCBCRSBhbiBvYmplY3QsIHdobyBzaG9vdCB0aGlzIGJ1bGxldFxuXHRcdC8vdmFyIFMgPSBXLnNjZW5lXG5cdFx0dGhpcy5uYW1lID0gXCJCYXNpY19hY3Rvcl9cIiArIChuZXcgRGF0ZSgpLmdldFRpbWUoKSlcblx0XHQvLyB0aGlzLlc7XG5cdFx0dGhpcy5vaWQgPSBpZFxuXHRcdHRoaXMuY29pZCA9IGNvaWRcblx0XHQvLyBjb25zb2xlLmxvZyhpZCk7XG5cdFx0dGhpcy5teV9tZXNoID0gUy5tZXNoZXNbaWRdXG5cdFx0Ly9jb25zb2xlLmxvZyhcIk1ZIE1FU0hcIiwgdGhpcy5teV9tZXNoLCBpZClcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0Ly8gY29uc29sZS5sb2coVy5tZXNoZXMsIGlkLCBXLm1lc2hlcy5sZW5ndGgpXG5cdFx0dmFyIHRvdGFsX3RpbWVfaW5fc3BhY2UgPSAwO1xuXHRcdHZhciBfcG9zc2libGVfdGFyZ2V0cyA9IHt9O1xuXHRcdHZhciBUID0gQ29udHJvbGxlci5UKCk7XG5cdFxuXHRcdHRoaXMucnVuID0gZnVuY3Rpb24odGltZV9sZWZ0KXtcblx0XHRcdHRvdGFsX3RpbWVfaW5fc3BhY2UgKz0gdGltZV9sZWZ0XG5cdFx0XHQvL2NvbnNvbGUubG9nKCdydW5uaW5nJyk7XG5cdFx0XHRpZiAodG90YWxfdGltZV9pbl9zcGFjZSA+IDEwKXtcblx0XHRcdFx0Ly9TLm1lc2hlcy5zcGxpY2UoaWQsIDEpXG5cdFx0XHRcdC8vY29uc29sZS5sb2coXCJyZW1vdmluZ1wiKVxuXHRcdFx0XHRTLl9kZWxldGVfb2JqZWN0KGlkKVxuXHRcdFx0XHRkZWxldGUgUy5hdXRvbWF0aWNfYWN0b3JzW3RoaXMubmFtZV07XG5cdFx0XHR9XG5cdFx0XHR2YXIgdmVsID0gdGhpcy5teV9tZXNoLnZlbC5jbG9uZSgpO1xuXHRcdFx0dmFyIG1wb3MgPSB0aGlzLm15X21lc2gucG9zaXRpb24uY2xvbmUoKTtcblx0XHRcblx0XHRcdHZhciB0aHJlcyA9IDQgKiB0aGlzLm15X21lc2gudmVsLmxlbmd0aCgpO1xuXHRcdFx0dmFyIGluX3RocmVzID0gW107XG5cdFx0XHQvL2NvbnNvbGUubG9nKFwiVEhSZXNcIiwgdGhyZXMpO1xuXHRcdFxuXHRcdFx0Xy5lYWNoKCBTLm1lc2hlcywgZnVuY3Rpb24obSxpKSB7XG5cdFx0XHRcdGlmKGkgPT09IGlkIHx8IGkgPT09IGNvaWQpIHJldHVybjtcblx0XHRcdFx0aWYobS5pc19ub3RfY29sbGlkYWJsZSkgcmV0dXJuO1xuXHRcdFx0XHQvLyB2YXIgbSA9IFcubWVzaGVzW2ldO1xuXHRcdFx0XHR2YXIgbXAgPSAgbS5wb3NpdGlvbi5jbG9uZSgpO1xuXHRcdFx0XHR2YXIgcGQgPSBtcC5zdWIoIG1wb3MgKVxuXHRcdFx0XHQvLyBjb25zb2xlLmxvZyggdmVsLCBwZCApXG5cdFx0XHRcdHZhciBhZyA9IE1hdGguYWNvcyhwZC5kb3QodmVsKS8gdmVsLmxlbmd0aCgpIC8gcGQubGVuZ3RoKCkpIC8vINGD0LPQvtC7INC80LXQttC00YMg0L3QsNC/0YDQsNCy0LvQtdC90LjQtdC8INC00LLQuNC20LXQvdC40Y8g0Lgg0YbQtdC90YLRgNC+0Lwg0L7QsdGK0LXQutGC0LBcblx0XHRcdFx0aWYgKGFnIDwgTWF0aC5QSS8xNilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ2FnJyk7XG5cdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coXCJISFwiLCBpLCBhZywgTWF0aC5QSS84KTtcblx0XHRcdFx0XG5cdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coXCJpZCB2ZWZvcmVcIiwgXHRpZCwgKTtcblx0XHRcdFx0XHR2YXIgc3ViID0gc2VsZi5teV9tZXNoLnBvc2l0aW9uLmNsb25lKCkuc3ViKCBtcCApO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdHZhciBkaXN0ID0gc3ViLmxlbmd0aCgpXG5cdFx0XHRcdFx0aWYoIGRpc3QgPCB0aHJlcyl7XG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKFwiT0tFXCIpO1xuXHRcdFx0XHRcdFx0aWYoIGluX3RocmVzLmluZGV4T2YoIGkgKSA9PT0gLTEgKXtcblx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygncG9zc2libGUnKTtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHRpbl90aHJlcy5wdXNoKGkpIC8vIEFkZCBtZXNoIGluZGV4XG5cdFx0XHRcdFx0XHRcdHRhcmdldCA9IHtsYXN0X3BvaW50IDptcG9zLmNsb25lKCksXG5cdFx0XHRcdFx0XHRcdFx0XHQgIGxhc3RfYW5nbGUgOiBhZyxcblx0XHRcdFx0XHRcdFx0XHRcdCAgbGFzdF9kaXN0YW5jZSA6IGRpc3QsXG5cdFx0XHRcdFx0XHRcdFx0XHQgIGFuZ2xlX3JhaXNlIDogMCxcblx0XHRcdFx0XHRcdFx0XHRcdCAgZGlzdGFuY2VfcmFpc2UgOjAsXG5cdFx0XHRcdFx0XHRcdFx0XHQgIGRpc3RhbmNlX3Nob3J0ZW5zIDogMCxcblx0XHRcdFx0XHRcdFx0XHRcdCAgYW5nbGVfbG93ZXJzIDogMCxcblx0XHRcdFx0XHRcdFx0XHQgIFx0ICBpZCA6IGl9XG5cdFx0XHRcdFx0XHRcdF9wb3NzaWJsZV90YXJnZXRzW2ldID0gdGFyZ2V0XG5cdFx0XHRcdFx0XHR9Ly9lbHNle31cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XG5cdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdGlmKGkgaW4gX3Bvc3NpYmxlX3RhcmdldHMpe1xuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnUE9TJywgaSlcblx0XHRcdFx0XHRcdC8vINCj0LPQvtC7INCx0YvQuyDQvtGB0YLRgNGL0LkgLSDRgdGC0LDQuyDRgtGD0L/QvtC5XG5cdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhcImhlcmUhXCIsaSk7XG5cdFx0XHRcdFx0XHQvLyDQndCw0LTQviDQv9GA0L7QstC10YDQuNGC0YwsINC90LUg0L/QtdGA0LXRgdC10LrQsNC10YIg0LvQuCDQvtGC0YDQtdC30L7QuiAtINC/0YDQvtGI0LvRi9C1INC60L7QvtGA0LTQuNC90LDRgtGLIC0g0YLQtdC60YPRidC40LUg0LrQvtC+0YDQtNC40L3QsNGC0Ysg0L3QsNGIINC80LXRiFxuXHRcdFx0XHRcdFx0dmFyIGRpcmVjdGlvbiA9IG1wb3MuY2xvbmUoKS5zdWIoIF9wb3NzaWJsZV90YXJnZXRzW2ldLmxhc3RfcG9pbnQpXG5cdFx0XHRcdFx0XHR2YXIgcmF5ID0gbmV3IFQuUmF5Y2FzdGVyKF9wb3NzaWJsZV90YXJnZXRzW2ldLmxhc3RfcG9pbnQsIGRpcmVjdGlvbi5jbG9uZSgpLm5vcm1hbGl6ZSgpIClcblx0XHRcdFx0XHRcdGlmKFMubmVlZF91cGRhdGVfbWF0cml4KXtcblx0XHRcdFx0XHRcdFx0bS51cGRhdGVNYXRyaXhXb3JsZCgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0dmFyIGlzciA9IHJheS5pbnRlcnNlY3RPYmplY3RzKFttXSlcblx0XHRcdFx0XHRcdC8vaWYgKG0udHlwZSA9PSAnc2hpcCcpe1xuXHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coXCJtYXRyaXggYXV0b3VwZFwiLCBtLm1hdHJpeFdvcmxkLmVsZW1lbnRzKVxuXHRcdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhtcG9zKTtcblx0XHRcdFx0XHRcdFx0Ly8gY29uc29sZS5sb2cocmF5LGlzcilcblx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdC8vfVxuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCBtLnR5cGUgKVxuXHRcdFx0XHRcdFx0aWYgKGlzci5sZW5ndGggPiAwICYmIGlzclswXS5kaXN0YW5jZSA8IGRpcmVjdGlvbi5sZW5ndGgoKSApe1xuXHRcdFx0XHRcdFx0XHQvL2ZvciggdmFyIGluZGV4ID0wOyBpbmRleDxpc3IubGVuZ3RoOyBpbmRleCsrKXtcblx0XHRcdFx0XHRcdFx0Ly9cdGNvbnNvbGUubG9nKFwiSEVSRVwiLCBpc3JbaW5kZXhdLmRpc3RhbmNlLCBkaXJlY3Rpb24ubGVuZ3RoKCkpXG5cdFx0XHRcdFx0XHRcdC8vL31cblx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coJ0hJVCcpXG5cdFx0XHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKFwiRU5EXCIsIGlzclswXS5wb2ludCk7XG5cdFx0XHRcdFx0XHRcdG0ud29ybGRUb0xvY2FsKGlzclswXS5wb2ludCkgLy8g0KLQtdC/0LXRgNGMINGN0YLQviDQv9C70LXRh9C+INGD0LTQsNGA0LBcblx0XHRcdFx0XHRcdFx0dmFyIGltcHVsc2UgPSBzZWxmLm15X21lc2guaW1wdWxzZTsgIC8vdmVsLmNsb25lKCkubXVsdGlwbHlTY2FsYXIoc2VsZi5teV9tZXNoLm1hc3MpXG5cdFx0XHRcdFx0XHRcdHZhciBheGlzID0gbmV3IFQuVmVjdG9yMygpLmNyb3NzVmVjdG9ycyhpc3JbMF0ucG9pbnQsIGltcHVsc2UpXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdHZhciBhZyA9IE1hdGguYWNvcyhpc3JbMF0ucG9pbnQuY2xvbmUoKS5kb3QoaW1wdWxzZSkgLyBpbXB1bHNlLmxlbmd0aCgpIC8gaXNyWzBdLnBvaW50Lmxlbmd0aCgpIClcblx0XHRcdFx0XHRcdFx0Ly8g0KLQtdC/0LXRgNGMINGN0YLQviDQstGA0LDRidC10L3QuNC1INC90LDQtNC+INGA0LDQt9Cx0LjRgtGMINC/0L4g0L7RgdGP0Lxcblx0XHRcdFx0XHRcdFx0dmFyIG1hdCA9IG5ldyBULk1hdHJpeDQoKS5tYWtlUm90YXRpb25BeGlzKGF4aXMubm9ybWFsaXplKCksIGFnKVxuXHRcdFx0XHRcdFx0XHR2YXIgZXVsID0gbmV3IFQuRXVsZXIoKVxuXHRcdFx0XHRcdFx0XHRldWwuc2V0RnJvbVJvdGF0aW9uTWF0cml4KG1hdCwgXCJYWVpcIilcblx0XHRcdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coaSwgZXVsKVxuXHRcdFx0XHRcdFx0XHR2YXIgYXZlbCA9IG5ldyBULlZlY3RvcjMoKTtcblx0XHRcdFx0XHRcdFx0YXZlbC54ID0gZXVsLng7XG5cdFx0XHRcdFx0XHRcdGF2ZWwueSA9IGV1bC55O1xuXHRcdFx0XHRcdFx0XHRhdmVsLnogPSBldWwuejtcblx0XHRcdFx0XHRcdFx0dmFyIGNrID0gaXNyWzBdLnBvaW50Lmxlbmd0aCgpICogTWF0aC5zaW4oYWcgLSBNYXRoLlBJLzIpXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKHRoaXMubXlfbWVzaC5tYXNzIC8gbS5tYXNzICogKGNrICogY2sgKSk7XG5cdFx0XHRcdFx0XHRcdGF2ZWwubXVsdGlwbHlTY2FsYXIoc2VsZi5teV9tZXNoLm1hc3MvbS5tYXNzICogTWF0aC5hYnMoY2spKVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHQvLyDQndC1INGD0YfQuNGC0YvQstCw0Y4g0LzQsNGB0YHRgyDQuCDQv9C70LXRh9C+Li4uIFxuXHRcdFx0XHRcdFx0XHR2YXIgbWF2ZWwgPSBTLm1lc2hlc1tpXS5hdmVsXG5cdFx0XHRcdFx0XHRcdGlmICghIG1hdmVsICl7bWF2ZWwgPSBuZXcgVC5WZWN0b3IzKDAsMCwwKX1cblx0XHRcdFx0XHRcdFx0bWF2ZWwueCArPSBhdmVsLnhcblx0XHRcdFx0XHRcdFx0bWF2ZWwueSArPSBhdmVsLnlcblx0XHRcdFx0XHRcdFx0bWF2ZWwueiArPSBhdmVsLno7XG5cdFx0XHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKG1hdmVsLngsIG1hdmVsLnksIG1hdmVsLnopXG5cdFx0XHRcdFx0XHRcdFMubWVzaGVzW2ldLmF2ZWwgPSBtYXZlbDtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0Ly8gYWRkX3ZlbCA9IGltcHVsc2UubXVsdGlwbHlTY2FsYXIoIDEvIG0ubWFzcyk7XG5cdFx0XHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKGFkZF92ZWwpXG5cdFx0XHRcdFx0XHRcdC8vINCj0LHRgNCw0YLRjCDQv9C+0LrQsCDRgdC60L7RgNC+0YHRgtGMXG5cdFx0XHRcdFx0XHRcdC8vaWYgKFMubWVzaGVzW2ldLnZlbCl7XG5cdFx0XHRcdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coUy5tZXNoZXNbaV0uaW1wdWxzZSlcblx0XHRcdFx0XHRcdFx0Uy5tZXNoZXNbaV0uaW1wdWxzZS5hZGQoIGltcHVsc2UgKTtcblx0XHRcdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coUy5tZXNoZXNbaV0uaW1wdWxzZSlcblx0XHRcdFx0XHRcdFx0XHQvLyB9XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coXCJFTkQgTE9DQUxcIiwgaXNyWzBdLnBvaW50KTtcblx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb2tlLCB3ZSBzaG9vdCBpdDonLCBpKVxuXHRcdFx0XHRcdFx0XHQvLyBOb3cgd2Ugd2lsbCBqdXN0IHJlbW92ZSBvYmplY3QgZnJvbSBzY2VuZSB3aXRoIHRoZSBidWxsZXRcblx0XHRcdFx0XHRcdFx0Ly9XLnNjZW5lLnJlbW92ZShXLm1lc2hlc1tpXSlcblx0XHRcdFx0XHRcdFx0Uy5fZGVsZXRlX29iamVjdChpZClcblx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdC8vaWYoUy50aHJlZV9zY2VuZSl7XG5cdFx0XHRcdFx0XHRcdC8vXHRTLnRocmVlX3NjZW5lLnJlbW92ZShTLm1lc2hlc1tpZF0pIC8vINGD0LTRj9C70Y/QtdC8INGP0LTRgNC+INC40Lcg0YHRhtC10L3Ri1xuXHRcdFx0XHRcdFx0XHQvL31cblx0XHRcdFx0XHRcdFx0Ly9kZWxldGUgUy5tZXNoZXNbIGlkIF07IC8vIC4uLiDQuNC3INC80LXRiNC10Llcblx0XHRcdFx0XHRcdFx0ZGVsZXRlIFMuYWN0b3JzW3NlbGYubmFtZV07IC8vIC4uLiDQo9C00LDQu9GP0LXQvCDRjdGC0L7Qs9C+INCw0LrRgtC+0YDQsCAtINCx0L7Qu9GM0YjQtSDQvdC1INC30LDQs9GA0YPQt9C40YLRgdGPINGN0YLQsCDRhNGD0L3QutGG0LjRj1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHQvL1cubWVzaGVzLnNwbGljZShpLCAxKTtcblx0XHRcdFx0XHRcdFx0ZGVsZXRlIF9wb3NzaWJsZV90YXJnZXRzW2ldIC8vIC4uLiDQuNC3INCy0L7Qt9C80L7QttC90YvRhSDRhtC10LvQtdC5INGD0LTQsNC70Y/QtdC8INGN0YLQvtGCINC80LXRiFxuXHRcdFx0XHRcdFx0XHQvLyBibGEuYmxhID0gMVxuXHRcdFx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0XHRcdGRlbGV0ZSBfcG9zc2libGVfdGFyZ2V0c1tpXTtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyggYWcsIE1hdGguUEkvOCk7XG5cdFx0XHRcdFxuXHRcdFx0XHR9XG5cdFx0XHRcblx0XHRcdH0pXG5cdFx0XHQvL2JsYS5iYWwgKz0xXG5cdFx0XHQvL2NvbnNvbGUubG9nKGJsYSlcblx0XHRcblx0XHRcblx0XHRcdC8vIGNvbnNvbGUubG9nKHRvdGFsX3RpbWVfaW5fc3BhY2UgLFcubWVzaGVzLmxlbmd0aCwgVy5hY3RvcnMpXG5cdFx0fVxuXHRcblx0XG5cdH07XG5cdFxuQ29udHJvbGxlci5DVHVycmV0Q29udHJvbGxlciA9IGZ1bmN0aW9uKCl7XG5cdHRoaXMudHlwZSA9ICd0dXJyZXQnO1xuXHRcdHRoaXMuYWN0ID0gZnVuY3Rpb24oUywgYWN0aW9uLCBpc19kb3duLCBhY3RvciApe1xuXHRcdFx0aWYgKFMgPT09IHVuZGVmaW5lZCl7cmV0dXJuO31cblx0XHRcdGlmIChhY3Rpb24udHlwZSA9PSdzaG9vdF9wcmltYXJ5Jyl7XG5cdFx0XHRcdGlmKCEgaXNfZG93bikgcmV0dXJuO1xuXHRcdFx0XHQvLyBjb25zb2xlLmxvZygnPj4+Jyk7XG5cdFx0XHRcdC8vIHZhciB3ZWFwb24gPSBDLndlYXBvbnNbMF07XG5cdFx0XHRcdC8vY29uc29sZS5sb2coXCJzaG90IGJ5XCIsIGFjdG9yKVxuXHRcdFx0XHR2YXIgVCA9IENvbnRyb2xsZXIuVCgpO1xuXHRcdFx0XHQvL2lmIChhY3RvciA9PT0gdW5kZWZpbmVkKXtcblx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhcIk1ZXCIsIFcuZ2V0X2N1cnJlbnRfYWN0b3IoKS5jb250cm9sLm9iamVjdF9ndWlkKVxuXHRcdFx0XHQvL1x0dmFyIEMgPSBTLm1lc2hlc1sgVy5nZXRfYWN0b3IoYWN0b3IpLmNvbnRyb2wub2JqZWN0X2d1aWQgXVxuXHRcdFx0XHQvL31lbHNle1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGFjdG9yLCBhY3Rpb24pO1xuXHRcdFx0XHR2YXIgQyA9IFMubWVzaGVzW2FjdG9yLmNvbnRyb2wub2JqZWN0X2d1aWRdXG5cdFx0XHRcdHZhciBvYmplY3QgPSBDLmpzb25cblx0XHRcdFx0dmFyIHdwID0gb2JqZWN0Lndvcmtwb2ludHNbYWN0b3IuY29udHJvbC53b3JrcG9pbnRdO1xuXHRcdFx0XHR2YXIgdHVycmV0ID0gb2JqZWN0LnR1cnJldHNbIHdwLnR1cnJldCBdIFxuXHRcdFx0XHQvLyBjb25zb2xlLmxvZyh0dXJyZXQsIEMuanNvbi50dXJyZXRzLCBDLmpzb24ud29ya3BvaW50cywgYWN0b3IpXG5cdFx0XHRcdFxuXHRcdFx0XHRcblx0XHRcdFx0XHQvL31cblx0XHRcdFx0aWYgKGFjdGlvbi50dXJyZXRfZGlyZWN0aW9uIGluc3RhbmNlb2YgVC5WZWN0b3IzKXtcblx0XHRcdFx0XHR2YXIgbXB2ID0gYWN0aW9uLnR1cnJldF9kaXJlY3Rpb25cblx0XHRcdFx0XG5cdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdHZhciBtcHYgPSBuZXcgVC5WZWN0b3IzKGFjdGlvbi50dXJyZXRfZGlyZWN0aW9uLngsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRhY3Rpb24udHVycmV0X2RpcmVjdGlvbi55LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YWN0aW9uLnR1cnJldF9kaXJlY3Rpb24ueilcblx0XHRcdFx0fVxuXHRcdFx0XHRjb25zb2xlLmxvZyhtcHYpXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ1RIJywgQ29udHJvbGxlci5UKCkpXG5cdFx0XHRcdC8vIHZhciBmcm9udF92ZWN0b3IgPSBDLlxuXHRcdFx0XHR2YXIgdHVycmV0X3Bvc2l0aW9uX3ZlY3RvciA9IG5ldyBULlZlY3RvcjMoKVxuXHRcdFx0XHR0dXJyZXRfcG9zaXRpb25fdmVjdG9yLmZyb21BcnJheSh0dXJyZXQucG9zaXRpb24gKTtcblx0XHRcdFx0Ly8gdHVycmV0X3Bvc2l0aW9uX3ZlY3Rvci5tdWx0aXBseVNjYWxhcigxKTtcblx0XHRcdFx0dHVycmV0X3Bvc2l0aW9uX3ZlY3Rvci5hcHBseUV1bGVyKCBDLnJvdGF0aW9uLmNsb25lKCkgKVxuXHRcdFx0XHRcblx0XHRcdFx0dmFyIGJ1bGxldCA9IENvbnRyb2xsZXIuY3JlYXRlU2hvdFBhcnRpY2xlKCk7XG5cdFx0XHRcdGJ1bGxldC5wb3NpdGlvbiA9IEMucG9zaXRpb24uY2xvbmUoKVxuXHRcdFx0XHRidWxsZXQucG9zaXRpb24uYWRkKCAgdHVycmV0X3Bvc2l0aW9uX3ZlY3Rvci5jbG9uZSgpIClcblx0XHRcdFx0Ly8gY29uc29sZS5sb2coXCJCVUxMRVQgUE9TIElOIFdcIiwgQy5wb3NpdGlvbiwgQy5wb3MsICBidWxsZXQucG9zaXRpb24pXG5cdFx0XHRcdFxuXHRcdFx0XG5cdFx0XHRcdGJ1bGxldC5oYXNfZW5naW5lcyA9IGZhbHNlO1xuXHRcdFx0XHRidWxsZXQuaXNfbm90X2NvbGxpZGFibGUgPSB0cnVlO1xuXHRcdFx0XHRidWxsZXQudmVsID0gbmV3IFQuVmVjdG9yMygwLDAsMCk7IC8vIG1wdi8vLm11bHRpcGx5U2NhbGFyKDAuMTApO1xuXHRcdFx0XHRcblx0XHRcdFx0YnVsbGV0Lm1hc3MgPSAxO1xuXHRcdFx0XHRcblx0XHRcdFx0bXB2LnN1YihidWxsZXQucG9zaXRpb24uY2xvbmUoKSkubm9ybWFsaXplKCkubXVsdGlwbHlTY2FsYXIoMTIwLjAwKTtcblx0XHRcdFx0XG5cdFx0XHRcdGJ1bGxldC5pbXB1bHNlID0gbXB2O1xuXHRcdFx0XHRidWxsZXQuYW5ndWxhcl9pbXB1bHNlID0gbmV3IFQuVmVjdG9yMygwLDAsMCk7XG5cdFx0XHRcdGlmICggdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpe1xuXHRcdFx0XHRcdFMudGhyZWVfc2NlbmUuYWRkKCBidWxsZXQgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRCX0dVSUQgPSBVdGlscy5tYWtlX2d1aWQoKVxuXHRcdFx0XHRTLm1lc2hlc1tCX0dVSURdID0gIGJ1bGxldCA7XG5cdFx0XHRcblx0XHRcdFx0dmFyIGJ1bGxldF9hY3RvciA9IG5ldyBDb250cm9sbGVyLkJhc2ljQnVsbGV0QWN0b3IoUywgQl9HVUlELCBDLkdVSUQpXG5cdFx0XHRcdFMuYXV0b21hdGljX2FjdG9yc1tidWxsZXRfYWN0b3IubmFtZV0gPSBidWxsZXRfYWN0b3I7XG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKFcuc2NlbmUuYXV0b21hdGljX2FjdG9ycyk7XG5cdFx0XHRcblx0XHRcdFxuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyByZXR1cm4gdGhpcztcblx0XG5cdH07XG5Db250cm9sbGVyLkNvbnRyb2xsZXJzQWN0aW9uTWFwPSBmdW5jdGlvbigpe1xuXHRcdGlmICh0aGlzLl9Db250cm9sbGVyc0FjdGlvbk1hcCl7XG5cdFx0XHRyZXR1cm4gdGhpcy5fQ29udHJvbGxlcnNBY3Rpb25NYXBcblx0XHR9ZWxzZXtcblx0XHRcdHZhciBQaWxvdENvbnRyb2xsZXIgPSBuZXcgQ29udHJvbGxlci5DUGlsb3RDb250cm9sbGVyKCk7XG5cdFx0XHR2YXIgVHVycmV0Q29udHJvbGxlciA9IG5ldyBDb250cm9sbGVyLkNUdXJyZXRDb250cm9sbGVyKClcblx0XHRcdHRoaXMuX0NvbnRyb2xsZXJzQWN0aW9uTWFwID0ge1xuXHRcdFx0XHQnbW92ZSc6IFBpbG90Q29udHJvbGxlcixcblx0XHRcdFx0J3JvdGF0ZSc6UGlsb3RDb250cm9sbGVyLFxuXHRcdFx0XHQncm90YXRlYyc6IFBpbG90Q29udHJvbGxlcixcblx0XHRcdFx0J3Nob290X3ByaW1hcnknOiBUdXJyZXRDb250cm9sbGVyXG5cdFx0XHR9IFx0XHRcblx0XHRcdHJldHVybiB0aGlzLl9Db250cm9sbGVyc0FjdGlvbk1hcDtcblx0XHRcdFxuXHRcdH1cblx0fVxuXG5pZih0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyl7XG5cdENvbnRyb2xsZXIuVCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIFRIUlxuXHR9O1xuXHRDb250cm9sbGVyLmNyZWF0ZVNob3RQYXJ0aWNsZT1mdW5jdGlvbigpe1xuXHRcdHZhciBUID0gdGhpcy5UKCk7XG5cdFx0Ly8gY29uc29sZS5sb2coJ1AnKTtcblx0XHQvL3ZhciBjdWJlR2VvbWV0cnkgPSBuZXcgVC5DdWJlR2VvbWV0cnkoMSwxLDEsMSwxLDEpO1xuXHRcdC8vdmFyIG1hcFx0PSBULkltYWdlVXRpbHMubG9hZFRleHR1cmUoIFwiL3RleHR1cmVzL2xlbnNmbGFyZS9sZW5zZmxhcmUwLnBuZ1wiICk7XG5cdFx0Ly92YXIgU3ByaXRlTWF0ZXJpYWwgPSBuZXcgVC5TcHJpdGVNYXRlcmlhbCggeyBtYXA6IG1hcCwgY29sb3I6IDB4ZmZmZmZmLCBmb2c6IHRydWUgfSApO1xuXHRcdHJldHVybiBuZXcgVC5PYmplY3QzRCgpO1xuXHR9O1xuXG59ZWxzZXtcblx0Q29udHJvbGxlci5UID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gVEhSRUVcblx0fTtcblx0Q29udHJvbGxlci5jcmVhdGVTaG90UGFydGljbGU9ZnVuY3Rpb24oKXtcblx0XHR2YXIgVCA9IHRoaXMuVCgpO1xuXHRcdC8vIGNvbnNvbGUubG9nKFwicGFydGljbGVcIilcblx0XHQvLyB2YXIgY3ViZUdlb21ldHJ5ID0gbmV3IFQuQ3ViZUdlb21ldHJ5KDEsMSwxLDEsMSwxKTtcblx0XHR2YXIgbWFwXHQ9IFQuSW1hZ2VVdGlscy5sb2FkVGV4dHVyZSggXCIvdGV4dHVyZXMvbGVuc2ZsYXJlL2xlbnNmbGFyZTAucG5nXCIgKTtcblx0XHR2YXIgbWF0ZXJpYWwgPSBuZXcgVC5TcHJpdGVNYXRlcmlhbCggeyBtYXA6IG1hcCwgY29sb3I6IDB4ZmZmZmZmLCBmb2c6IHRydWUgfSApO1xuXHRcdG1hdGVyaWFsLnRyYW5zcGFyZW50ID0gdHJ1ZTtcblx0XHRtYXRlcmlhbC5ibGVuZGluZyA9IFRIUkVFLkFkZGl0aXZlQmxlbmRpbmc7XG5cdFx0XG5cdFx0Ly8gdmFyIGEgPSBuZXcgVC5TcHJpdGUobWF0ZXJpYWwpO1xuXHRcdHZhciBhID0gbmV3IFQuTWVzaChuZXcgVC5TcGhlcmVHZW9tZXRyeSgyKSk7XG5cdFx0YS5zdGF0aWMgPSBmYWxzZTtcblx0XHRhLmhhc19lbmdpbmVzID0gZmFsc2U7XG5cdFx0cmV0dXJuIGFcblx0fTtcblx0XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBDb250cm9sbGVyXG4vL3ZhciBUdXJyZXRDb250cm9sbGVyID0gbmV3IENUdXJyZXRDb250cm9sbGVyKClcbi8vQ1BpbG90Q29udHJvbGxlci5wcm90b3R5cGUgPSB7Y29uc3RydWN0b3I6Q1BpbG90Q29udHJvbGxlcn1cbi8vdmFyIFBpbG90Q29udHJvbGxlciA9IG5ldyBDUGlsb3RDb250cm9sbGVyKCk7XG5cbi8vY29uc29sZS5sb2coVHVycmV0Q29udHJvbGxlci5hY3QsIFBpbG90Q29udHJvbGxlci5hY3QpXG4iLCIvLyAgICAgVW5kZXJzY29yZS5qcyAxLjUuMlxuLy8gICAgIGh0dHA6Ly91bmRlcnNjb3JlanMub3JnXG4vLyAgICAgKGMpIDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuLy8gICAgIFVuZGVyc2NvcmUgbWF5IGJlIGZyZWVseSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG5cbihmdW5jdGlvbigpIHtcblxuICAvLyBCYXNlbGluZSBzZXR1cFxuICAvLyAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEVzdGFibGlzaCB0aGUgcm9vdCBvYmplY3QsIGB3aW5kb3dgIGluIHRoZSBicm93c2VyLCBvciBgZXhwb3J0c2Agb24gdGhlIHNlcnZlci5cbiAgdmFyIHJvb3QgPSB0aGlzO1xuXG4gIC8vIFNhdmUgdGhlIHByZXZpb3VzIHZhbHVlIG9mIHRoZSBgX2AgdmFyaWFibGUuXG4gIHZhciBwcmV2aW91c1VuZGVyc2NvcmUgPSByb290Ll87XG5cbiAgLy8gRXN0YWJsaXNoIHRoZSBvYmplY3QgdGhhdCBnZXRzIHJldHVybmVkIHRvIGJyZWFrIG91dCBvZiBhIGxvb3AgaXRlcmF0aW9uLlxuICB2YXIgYnJlYWtlciA9IHt9O1xuXG4gIC8vIFNhdmUgYnl0ZXMgaW4gdGhlIG1pbmlmaWVkIChidXQgbm90IGd6aXBwZWQpIHZlcnNpb246XG4gIHZhciBBcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlLCBPYmpQcm90byA9IE9iamVjdC5wcm90b3R5cGUsIEZ1bmNQcm90byA9IEZ1bmN0aW9uLnByb3RvdHlwZTtcblxuICAvLyBDcmVhdGUgcXVpY2sgcmVmZXJlbmNlIHZhcmlhYmxlcyBmb3Igc3BlZWQgYWNjZXNzIHRvIGNvcmUgcHJvdG90eXBlcy5cbiAgdmFyXG4gICAgcHVzaCAgICAgICAgICAgICA9IEFycmF5UHJvdG8ucHVzaCxcbiAgICBzbGljZSAgICAgICAgICAgID0gQXJyYXlQcm90by5zbGljZSxcbiAgICBjb25jYXQgICAgICAgICAgID0gQXJyYXlQcm90by5jb25jYXQsXG4gICAgdG9TdHJpbmcgICAgICAgICA9IE9ialByb3RvLnRvU3RyaW5nLFxuICAgIGhhc093blByb3BlcnR5ICAgPSBPYmpQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuICAvLyBBbGwgKipFQ01BU2NyaXB0IDUqKiBuYXRpdmUgZnVuY3Rpb24gaW1wbGVtZW50YXRpb25zIHRoYXQgd2UgaG9wZSB0byB1c2VcbiAgLy8gYXJlIGRlY2xhcmVkIGhlcmUuXG4gIHZhclxuICAgIG5hdGl2ZUZvckVhY2ggICAgICA9IEFycmF5UHJvdG8uZm9yRWFjaCxcbiAgICBuYXRpdmVNYXAgICAgICAgICAgPSBBcnJheVByb3RvLm1hcCxcbiAgICBuYXRpdmVSZWR1Y2UgICAgICAgPSBBcnJheVByb3RvLnJlZHVjZSxcbiAgICBuYXRpdmVSZWR1Y2VSaWdodCAgPSBBcnJheVByb3RvLnJlZHVjZVJpZ2h0LFxuICAgIG5hdGl2ZUZpbHRlciAgICAgICA9IEFycmF5UHJvdG8uZmlsdGVyLFxuICAgIG5hdGl2ZUV2ZXJ5ICAgICAgICA9IEFycmF5UHJvdG8uZXZlcnksXG4gICAgbmF0aXZlU29tZSAgICAgICAgID0gQXJyYXlQcm90by5zb21lLFxuICAgIG5hdGl2ZUluZGV4T2YgICAgICA9IEFycmF5UHJvdG8uaW5kZXhPZixcbiAgICBuYXRpdmVMYXN0SW5kZXhPZiAgPSBBcnJheVByb3RvLmxhc3RJbmRleE9mLFxuICAgIG5hdGl2ZUlzQXJyYXkgICAgICA9IEFycmF5LmlzQXJyYXksXG4gICAgbmF0aXZlS2V5cyAgICAgICAgID0gT2JqZWN0LmtleXMsXG4gICAgbmF0aXZlQmluZCAgICAgICAgID0gRnVuY1Byb3RvLmJpbmQ7XG5cbiAgLy8gQ3JlYXRlIGEgc2FmZSByZWZlcmVuY2UgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0IGZvciB1c2UgYmVsb3cuXG4gIHZhciBfID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mIF8pIHJldHVybiBvYmo7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIF8pKSByZXR1cm4gbmV3IF8ob2JqKTtcbiAgICB0aGlzLl93cmFwcGVkID0gb2JqO1xuICB9O1xuXG4gIC8vIEV4cG9ydCB0aGUgVW5kZXJzY29yZSBvYmplY3QgZm9yICoqTm9kZS5qcyoqLCB3aXRoXG4gIC8vIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciB0aGUgb2xkIGByZXF1aXJlKClgIEFQSS4gSWYgd2UncmUgaW5cbiAgLy8gdGhlIGJyb3dzZXIsIGFkZCBgX2AgYXMgYSBnbG9iYWwgb2JqZWN0IHZpYSBhIHN0cmluZyBpZGVudGlmaWVyLFxuICAvLyBmb3IgQ2xvc3VyZSBDb21waWxlciBcImFkdmFuY2VkXCIgbW9kZS5cbiAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gXztcbiAgICB9XG4gICAgZXhwb3J0cy5fID0gXztcbiAgfSBlbHNlIHtcbiAgICByb290Ll8gPSBfO1xuICB9XG5cbiAgLy8gQ3VycmVudCB2ZXJzaW9uLlxuICBfLlZFUlNJT04gPSAnMS41LjInO1xuXG4gIC8vIENvbGxlY3Rpb24gRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gVGhlIGNvcm5lcnN0b25lLCBhbiBgZWFjaGAgaW1wbGVtZW50YXRpb24sIGFrYSBgZm9yRWFjaGAuXG4gIC8vIEhhbmRsZXMgb2JqZWN0cyB3aXRoIHRoZSBidWlsdC1pbiBgZm9yRWFjaGAsIGFycmF5cywgYW5kIHJhdyBvYmplY3RzLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgZm9yRWFjaGAgaWYgYXZhaWxhYmxlLlxuICB2YXIgZWFjaCA9IF8uZWFjaCA9IF8uZm9yRWFjaCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybjtcbiAgICBpZiAobmF0aXZlRm9yRWFjaCAmJiBvYmouZm9yRWFjaCA9PT0gbmF0aXZlRm9yRWFjaCkge1xuICAgICAgb2JqLmZvckVhY2goaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIH0gZWxzZSBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBvYmoubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2ldLCBpLCBvYmopID09PSBicmVha2VyKSByZXR1cm47XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpba2V5c1tpXV0sIGtleXNbaV0sIG9iaikgPT09IGJyZWFrZXIpIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSByZXN1bHRzIG9mIGFwcGx5aW5nIHRoZSBpdGVyYXRvciB0byBlYWNoIGVsZW1lbnQuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBtYXBgIGlmIGF2YWlsYWJsZS5cbiAgXy5tYXAgPSBfLmNvbGxlY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHRzO1xuICAgIGlmIChuYXRpdmVNYXAgJiYgb2JqLm1hcCA9PT0gbmF0aXZlTWFwKSByZXR1cm4gb2JqLm1hcChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgcmVzdWx0cy5wdXNoKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgdmFyIHJlZHVjZUVycm9yID0gJ1JlZHVjZSBvZiBlbXB0eSBhcnJheSB3aXRoIG5vIGluaXRpYWwgdmFsdWUnO1xuXG4gIC8vICoqUmVkdWNlKiogYnVpbGRzIHVwIGEgc2luZ2xlIHJlc3VsdCBmcm9tIGEgbGlzdCBvZiB2YWx1ZXMsIGFrYSBgaW5qZWN0YCxcbiAgLy8gb3IgYGZvbGRsYC4gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYHJlZHVjZWAgaWYgYXZhaWxhYmxlLlxuICBfLnJlZHVjZSA9IF8uZm9sZGwgPSBfLmluamVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIG1lbW8sIGNvbnRleHQpIHtcbiAgICB2YXIgaW5pdGlhbCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyO1xuICAgIGlmIChvYmogPT0gbnVsbCkgb2JqID0gW107XG4gICAgaWYgKG5hdGl2ZVJlZHVjZSAmJiBvYmoucmVkdWNlID09PSBuYXRpdmVSZWR1Y2UpIHtcbiAgICAgIGlmIChjb250ZXh0KSBpdGVyYXRvciA9IF8uYmluZChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgICByZXR1cm4gaW5pdGlhbCA/IG9iai5yZWR1Y2UoaXRlcmF0b3IsIG1lbW8pIDogb2JqLnJlZHVjZShpdGVyYXRvcik7XG4gICAgfVxuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmICghaW5pdGlhbCkge1xuICAgICAgICBtZW1vID0gdmFsdWU7XG4gICAgICAgIGluaXRpYWwgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVtbyA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgbWVtbywgdmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoIWluaXRpYWwpIHRocm93IG5ldyBUeXBlRXJyb3IocmVkdWNlRXJyb3IpO1xuICAgIHJldHVybiBtZW1vO1xuICB9O1xuXG4gIC8vIFRoZSByaWdodC1hc3NvY2lhdGl2ZSB2ZXJzaW9uIG9mIHJlZHVjZSwgYWxzbyBrbm93biBhcyBgZm9sZHJgLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgcmVkdWNlUmlnaHRgIGlmIGF2YWlsYWJsZS5cbiAgXy5yZWR1Y2VSaWdodCA9IF8uZm9sZHIgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBtZW1vLCBjb250ZXh0KSB7XG4gICAgdmFyIGluaXRpYWwgPSBhcmd1bWVudHMubGVuZ3RoID4gMjtcbiAgICBpZiAob2JqID09IG51bGwpIG9iaiA9IFtdO1xuICAgIGlmIChuYXRpdmVSZWR1Y2VSaWdodCAmJiBvYmoucmVkdWNlUmlnaHQgPT09IG5hdGl2ZVJlZHVjZVJpZ2h0KSB7XG4gICAgICBpZiAoY29udGV4dCkgaXRlcmF0b3IgPSBfLmJpbmQoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGluaXRpYWwgPyBvYmoucmVkdWNlUmlnaHQoaXRlcmF0b3IsIG1lbW8pIDogb2JqLnJlZHVjZVJpZ2h0KGl0ZXJhdG9yKTtcbiAgICB9XG4gICAgdmFyIGxlbmd0aCA9IG9iai5sZW5ndGg7XG4gICAgaWYgKGxlbmd0aCAhPT0gK2xlbmd0aCkge1xuICAgICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICAgIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIH1cbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpbmRleCA9IGtleXMgPyBrZXlzWy0tbGVuZ3RoXSA6IC0tbGVuZ3RoO1xuICAgICAgaWYgKCFpbml0aWFsKSB7XG4gICAgICAgIG1lbW8gPSBvYmpbaW5kZXhdO1xuICAgICAgICBpbml0aWFsID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lbW8gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG1lbW8sIG9ialtpbmRleF0sIGluZGV4LCBsaXN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoIWluaXRpYWwpIHRocm93IG5ldyBUeXBlRXJyb3IocmVkdWNlRXJyb3IpO1xuICAgIHJldHVybiBtZW1vO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgZmlyc3QgdmFsdWUgd2hpY2ggcGFzc2VzIGEgdHJ1dGggdGVzdC4gQWxpYXNlZCBhcyBgZGV0ZWN0YC5cbiAgXy5maW5kID0gXy5kZXRlY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdDtcbiAgICBhbnkob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpIHtcbiAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgdGhhdCBwYXNzIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGZpbHRlcmAgaWYgYXZhaWxhYmxlLlxuICAvLyBBbGlhc2VkIGFzIGBzZWxlY3RgLlxuICBfLmZpbHRlciA9IF8uc2VsZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0cztcbiAgICBpZiAobmF0aXZlRmlsdGVyICYmIG9iai5maWx0ZXIgPT09IG5hdGl2ZUZpbHRlcikgcmV0dXJuIG9iai5maWx0ZXIoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpIHJlc3VsdHMucHVzaCh2YWx1ZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIGEgdHJ1dGggdGVzdCBmYWlscy5cbiAgXy5yZWplY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXR1cm4gIWl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICB9LCBjb250ZXh0KTtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgd2hldGhlciBhbGwgb2YgdGhlIGVsZW1lbnRzIG1hdGNoIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGV2ZXJ5YCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYGFsbGAuXG4gIF8uZXZlcnkgPSBfLmFsbCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciB8fCAoaXRlcmF0b3IgPSBfLmlkZW50aXR5KTtcbiAgICB2YXIgcmVzdWx0ID0gdHJ1ZTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHQ7XG4gICAgaWYgKG5hdGl2ZUV2ZXJ5ICYmIG9iai5ldmVyeSA9PT0gbmF0aXZlRXZlcnkpIHJldHVybiBvYmouZXZlcnkoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmICghKHJlc3VsdCA9IHJlc3VsdCAmJiBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpKSByZXR1cm4gYnJlYWtlcjtcbiAgICB9KTtcbiAgICByZXR1cm4gISFyZXN1bHQ7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIGF0IGxlYXN0IG9uZSBlbGVtZW50IGluIHRoZSBvYmplY3QgbWF0Y2hlcyBhIHRydXRoIHRlc3QuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBzb21lYCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYGFueWAuXG4gIHZhciBhbnkgPSBfLnNvbWUgPSBfLmFueSA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciB8fCAoaXRlcmF0b3IgPSBfLmlkZW50aXR5KTtcbiAgICB2YXIgcmVzdWx0ID0gZmFsc2U7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0O1xuICAgIGlmIChuYXRpdmVTb21lICYmIG9iai5zb21lID09PSBuYXRpdmVTb21lKSByZXR1cm4gb2JqLnNvbWUoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChyZXN1bHQgfHwgKHJlc3VsdCA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkpIHJldHVybiBicmVha2VyO1xuICAgIH0pO1xuICAgIHJldHVybiAhIXJlc3VsdDtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgaWYgdGhlIGFycmF5IG9yIG9iamVjdCBjb250YWlucyBhIGdpdmVuIHZhbHVlICh1c2luZyBgPT09YCkuXG4gIC8vIEFsaWFzZWQgYXMgYGluY2x1ZGVgLlxuICBfLmNvbnRhaW5zID0gXy5pbmNsdWRlID0gZnVuY3Rpb24ob2JqLCB0YXJnZXQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICBpZiAobmF0aXZlSW5kZXhPZiAmJiBvYmouaW5kZXhPZiA9PT0gbmF0aXZlSW5kZXhPZikgcmV0dXJuIG9iai5pbmRleE9mKHRhcmdldCkgIT0gLTE7XG4gICAgcmV0dXJuIGFueShvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IHRhcmdldDtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBJbnZva2UgYSBtZXRob2QgKHdpdGggYXJndW1lbnRzKSBvbiBldmVyeSBpdGVtIGluIGEgY29sbGVjdGlvbi5cbiAgXy5pbnZva2UgPSBmdW5jdGlvbihvYmosIG1ldGhvZCkge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHZhciBpc0Z1bmMgPSBfLmlzRnVuY3Rpb24obWV0aG9kKTtcbiAgICByZXR1cm4gXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIChpc0Z1bmMgPyBtZXRob2QgOiB2YWx1ZVttZXRob2RdKS5hcHBseSh2YWx1ZSwgYXJncyk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgbWFwYDogZmV0Y2hpbmcgYSBwcm9wZXJ0eS5cbiAgXy5wbHVjayA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUpeyByZXR1cm4gdmFsdWVba2V5XTsgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgZmlsdGVyYDogc2VsZWN0aW5nIG9ubHkgb2JqZWN0c1xuICAvLyBjb250YWluaW5nIHNwZWNpZmljIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLndoZXJlID0gZnVuY3Rpb24ob2JqLCBhdHRycywgZmlyc3QpIHtcbiAgICBpZiAoXy5pc0VtcHR5KGF0dHJzKSkgcmV0dXJuIGZpcnN0ID8gdm9pZCAwIDogW107XG4gICAgcmV0dXJuIF9bZmlyc3QgPyAnZmluZCcgOiAnZmlsdGVyJ10ob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgZm9yICh2YXIga2V5IGluIGF0dHJzKSB7XG4gICAgICAgIGlmIChhdHRyc1trZXldICE9PSB2YWx1ZVtrZXldKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBmaW5kYDogZ2V0dGluZyB0aGUgZmlyc3Qgb2JqZWN0XG4gIC8vIGNvbnRhaW5pbmcgc3BlY2lmaWMgYGtleTp2YWx1ZWAgcGFpcnMuXG4gIF8uZmluZFdoZXJlID0gZnVuY3Rpb24ob2JqLCBhdHRycykge1xuICAgIHJldHVybiBfLndoZXJlKG9iaiwgYXR0cnMsIHRydWUpO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbWF4aW11bSBlbGVtZW50IG9yIChlbGVtZW50LWJhc2VkIGNvbXB1dGF0aW9uKS5cbiAgLy8gQ2FuJ3Qgb3B0aW1pemUgYXJyYXlzIG9mIGludGVnZXJzIGxvbmdlciB0aGFuIDY1LDUzNSBlbGVtZW50cy5cbiAgLy8gU2VlIFtXZWJLaXQgQnVnIDgwNzk3XShodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9ODA3OTcpXG4gIF8ubWF4ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0FycmF5KG9iaikgJiYgb2JqWzBdID09PSArb2JqWzBdICYmIG9iai5sZW5ndGggPCA2NTUzNSkge1xuICAgICAgcmV0dXJuIE1hdGgubWF4LmFwcGx5KE1hdGgsIG9iaik7XG4gICAgfVxuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0VtcHR5KG9iaikpIHJldHVybiAtSW5maW5pdHk7XG4gICAgdmFyIHJlc3VsdCA9IHtjb21wdXRlZCA6IC1JbmZpbml0eSwgdmFsdWU6IC1JbmZpbml0eX07XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgdmFyIGNvbXB1dGVkID0gaXRlcmF0b3IgPyBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkgOiB2YWx1ZTtcbiAgICAgIGNvbXB1dGVkID4gcmVzdWx0LmNvbXB1dGVkICYmIChyZXN1bHQgPSB7dmFsdWUgOiB2YWx1ZSwgY29tcHV0ZWQgOiBjb21wdXRlZH0pO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQudmFsdWU7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBtaW5pbXVtIGVsZW1lbnQgKG9yIGVsZW1lbnQtYmFzZWQgY29tcHV0YXRpb24pLlxuICBfLm1pbiA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNBcnJheShvYmopICYmIG9ialswXSA9PT0gK29ialswXSAmJiBvYmoubGVuZ3RoIDwgNjU1MzUpIHtcbiAgICAgIHJldHVybiBNYXRoLm1pbi5hcHBseShNYXRoLCBvYmopO1xuICAgIH1cbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNFbXB0eShvYmopKSByZXR1cm4gSW5maW5pdHk7XG4gICAgdmFyIHJlc3VsdCA9IHtjb21wdXRlZCA6IEluZmluaXR5LCB2YWx1ZTogSW5maW5pdHl9O1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHZhciBjb21wdXRlZCA9IGl0ZXJhdG9yID8gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpIDogdmFsdWU7XG4gICAgICBjb21wdXRlZCA8IHJlc3VsdC5jb21wdXRlZCAmJiAocmVzdWx0ID0ge3ZhbHVlIDogdmFsdWUsIGNvbXB1dGVkIDogY29tcHV0ZWR9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0LnZhbHVlO1xuICB9O1xuXG4gIC8vIFNodWZmbGUgYW4gYXJyYXksIHVzaW5nIHRoZSBtb2Rlcm4gdmVyc2lvbiBvZiB0aGUgXG4gIC8vIFtGaXNoZXItWWF0ZXMgc2h1ZmZsZV0oaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9GaXNoZXLigJNZYXRlc19zaHVmZmxlKS5cbiAgXy5zaHVmZmxlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHJhbmQ7XG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc2h1ZmZsZWQgPSBbXTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJhbmQgPSBfLnJhbmRvbShpbmRleCsrKTtcbiAgICAgIHNodWZmbGVkW2luZGV4IC0gMV0gPSBzaHVmZmxlZFtyYW5kXTtcbiAgICAgIHNodWZmbGVkW3JhbmRdID0gdmFsdWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHNodWZmbGVkO1xuICB9O1xuXG4gIC8vIFNhbXBsZSAqKm4qKiByYW5kb20gdmFsdWVzIGZyb20gYW4gYXJyYXkuXG4gIC8vIElmICoqbioqIGlzIG5vdCBzcGVjaWZpZWQsIHJldHVybnMgYSBzaW5nbGUgcmFuZG9tIGVsZW1lbnQgZnJvbSB0aGUgYXJyYXkuXG4gIC8vIFRoZSBpbnRlcm5hbCBgZ3VhcmRgIGFyZ3VtZW50IGFsbG93cyBpdCB0byB3b3JrIHdpdGggYG1hcGAuXG4gIF8uc2FtcGxlID0gZnVuY3Rpb24ob2JqLCBuLCBndWFyZCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMiB8fCBndWFyZCkge1xuICAgICAgcmV0dXJuIG9ialtfLnJhbmRvbShvYmoubGVuZ3RoIC0gMSldO1xuICAgIH1cbiAgICByZXR1cm4gXy5zaHVmZmxlKG9iaikuc2xpY2UoMCwgTWF0aC5tYXgoMCwgbikpO1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIHRvIGdlbmVyYXRlIGxvb2t1cCBpdGVyYXRvcnMuXG4gIHZhciBsb29rdXBJdGVyYXRvciA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih2YWx1ZSkgPyB2YWx1ZSA6IGZ1bmN0aW9uKG9iail7IHJldHVybiBvYmpbdmFsdWVdOyB9O1xuICB9O1xuXG4gIC8vIFNvcnQgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbiBwcm9kdWNlZCBieSBhbiBpdGVyYXRvci5cbiAgXy5zb3J0QnkgPSBmdW5jdGlvbihvYmosIHZhbHVlLCBjb250ZXh0KSB7XG4gICAgdmFyIGl0ZXJhdG9yID0gbG9va3VwSXRlcmF0b3IodmFsdWUpO1xuICAgIHJldHVybiBfLnBsdWNrKF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgY3JpdGVyaWE6IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KVxuICAgICAgfTtcbiAgICB9KS5zb3J0KGZ1bmN0aW9uKGxlZnQsIHJpZ2h0KSB7XG4gICAgICB2YXIgYSA9IGxlZnQuY3JpdGVyaWE7XG4gICAgICB2YXIgYiA9IHJpZ2h0LmNyaXRlcmlhO1xuICAgICAgaWYgKGEgIT09IGIpIHtcbiAgICAgICAgaWYgKGEgPiBiIHx8IGEgPT09IHZvaWQgMCkgcmV0dXJuIDE7XG4gICAgICAgIGlmIChhIDwgYiB8fCBiID09PSB2b2lkIDApIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsZWZ0LmluZGV4IC0gcmlnaHQuaW5kZXg7XG4gICAgfSksICd2YWx1ZScpO1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIHVzZWQgZm9yIGFnZ3JlZ2F0ZSBcImdyb3VwIGJ5XCIgb3BlcmF0aW9ucy5cbiAgdmFyIGdyb3VwID0gZnVuY3Rpb24oYmVoYXZpb3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqLCB2YWx1ZSwgY29udGV4dCkge1xuICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgdmFyIGl0ZXJhdG9yID0gdmFsdWUgPT0gbnVsbCA/IF8uaWRlbnRpdHkgOiBsb29rdXBJdGVyYXRvcih2YWx1ZSk7XG4gICAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4KSB7XG4gICAgICAgIHZhciBrZXkgPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgb2JqKTtcbiAgICAgICAgYmVoYXZpb3IocmVzdWx0LCBrZXksIHZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEdyb3VwcyB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uLiBQYXNzIGVpdGhlciBhIHN0cmluZyBhdHRyaWJ1dGVcbiAgLy8gdG8gZ3JvdXAgYnksIG9yIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBjcml0ZXJpb24uXG4gIF8uZ3JvdXBCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwga2V5LCB2YWx1ZSkge1xuICAgIChfLmhhcyhyZXN1bHQsIGtleSkgPyByZXN1bHRba2V5XSA6IChyZXN1bHRba2V5XSA9IFtdKSkucHVzaCh2YWx1ZSk7XG4gIH0pO1xuXG4gIC8vIEluZGV4ZXMgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbiwgc2ltaWxhciB0byBgZ3JvdXBCeWAsIGJ1dCBmb3JcbiAgLy8gd2hlbiB5b3Uga25vdyB0aGF0IHlvdXIgaW5kZXggdmFsdWVzIHdpbGwgYmUgdW5pcXVlLlxuICBfLmluZGV4QnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIGtleSwgdmFsdWUpIHtcbiAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICB9KTtcblxuICAvLyBDb3VudHMgaW5zdGFuY2VzIG9mIGFuIG9iamVjdCB0aGF0IGdyb3VwIGJ5IGEgY2VydGFpbiBjcml0ZXJpb24uIFBhc3NcbiAgLy8gZWl0aGVyIGEgc3RyaW5nIGF0dHJpYnV0ZSB0byBjb3VudCBieSwgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlXG4gIC8vIGNyaXRlcmlvbi5cbiAgXy5jb3VudEJ5ID0gZ3JvdXAoZnVuY3Rpb24ocmVzdWx0LCBrZXkpIHtcbiAgICBfLmhhcyhyZXN1bHQsIGtleSkgPyByZXN1bHRba2V5XSsrIDogcmVzdWx0W2tleV0gPSAxO1xuICB9KTtcblxuICAvLyBVc2UgYSBjb21wYXJhdG9yIGZ1bmN0aW9uIHRvIGZpZ3VyZSBvdXQgdGhlIHNtYWxsZXN0IGluZGV4IGF0IHdoaWNoXG4gIC8vIGFuIG9iamVjdCBzaG91bGQgYmUgaW5zZXJ0ZWQgc28gYXMgdG8gbWFpbnRhaW4gb3JkZXIuIFVzZXMgYmluYXJ5IHNlYXJjaC5cbiAgXy5zb3J0ZWRJbmRleCA9IGZ1bmN0aW9uKGFycmF5LCBvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0b3IgPSBpdGVyYXRvciA9PSBudWxsID8gXy5pZGVudGl0eSA6IGxvb2t1cEl0ZXJhdG9yKGl0ZXJhdG9yKTtcbiAgICB2YXIgdmFsdWUgPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9iaik7XG4gICAgdmFyIGxvdyA9IDAsIGhpZ2ggPSBhcnJheS5sZW5ndGg7XG4gICAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcbiAgICAgIHZhciBtaWQgPSAobG93ICsgaGlnaCkgPj4+IDE7XG4gICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIGFycmF5W21pZF0pIDwgdmFsdWUgPyBsb3cgPSBtaWQgKyAxIDogaGlnaCA9IG1pZDtcbiAgICB9XG4gICAgcmV0dXJuIGxvdztcbiAgfTtcblxuICAvLyBTYWZlbHkgY3JlYXRlIGEgcmVhbCwgbGl2ZSBhcnJheSBmcm9tIGFueXRoaW5nIGl0ZXJhYmxlLlxuICBfLnRvQXJyYXkgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIW9iaikgcmV0dXJuIFtdO1xuICAgIGlmIChfLmlzQXJyYXkob2JqKSkgcmV0dXJuIHNsaWNlLmNhbGwob2JqKTtcbiAgICBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHJldHVybiBfLm1hcChvYmosIF8uaWRlbnRpdHkpO1xuICAgIHJldHVybiBfLnZhbHVlcyhvYmopO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbnVtYmVyIG9mIGVsZW1lbnRzIGluIGFuIG9iamVjdC5cbiAgXy5zaXplID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gMDtcbiAgICByZXR1cm4gKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSA/IG9iai5sZW5ndGggOiBfLmtleXMob2JqKS5sZW5ndGg7XG4gIH07XG5cbiAgLy8gQXJyYXkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEdldCB0aGUgZmlyc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiB0aGUgZmlyc3QgTlxuICAvLyB2YWx1ZXMgaW4gdGhlIGFycmF5LiBBbGlhc2VkIGFzIGBoZWFkYCBhbmQgYHRha2VgLiBUaGUgKipndWFyZCoqIGNoZWNrXG4gIC8vIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5maXJzdCA9IF8uaGVhZCA9IF8udGFrZSA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIHJldHVybiAobiA9PSBudWxsKSB8fCBndWFyZCA/IGFycmF5WzBdIDogc2xpY2UuY2FsbChhcnJheSwgMCwgbik7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBldmVyeXRoaW5nIGJ1dCB0aGUgbGFzdCBlbnRyeSBvZiB0aGUgYXJyYXkuIEVzcGVjaWFsbHkgdXNlZnVsIG9uXG4gIC8vIHRoZSBhcmd1bWVudHMgb2JqZWN0LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIGFsbCB0aGUgdmFsdWVzIGluXG4gIC8vIHRoZSBhcnJheSwgZXhjbHVkaW5nIHRoZSBsYXN0IE4uIFRoZSAqKmd1YXJkKiogY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aFxuICAvLyBgXy5tYXBgLlxuICBfLmluaXRpYWwgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgMCwgYXJyYXkubGVuZ3RoIC0gKChuID09IG51bGwpIHx8IGd1YXJkID8gMSA6IG4pKTtcbiAgfTtcblxuICAvLyBHZXQgdGhlIGxhc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiB0aGUgbGFzdCBOXG4gIC8vIHZhbHVlcyBpbiB0aGUgYXJyYXkuIFRoZSAqKmd1YXJkKiogY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLmxhc3QgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICBpZiAoKG4gPT0gbnVsbCkgfHwgZ3VhcmQpIHtcbiAgICAgIHJldHVybiBhcnJheVthcnJheS5sZW5ndGggLSAxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIE1hdGgubWF4KGFycmF5Lmxlbmd0aCAtIG4sIDApKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gUmV0dXJucyBldmVyeXRoaW5nIGJ1dCB0aGUgZmlyc3QgZW50cnkgb2YgdGhlIGFycmF5LiBBbGlhc2VkIGFzIGB0YWlsYCBhbmQgYGRyb3BgLlxuICAvLyBFc3BlY2lhbGx5IHVzZWZ1bCBvbiB0aGUgYXJndW1lbnRzIG9iamVjdC4gUGFzc2luZyBhbiAqKm4qKiB3aWxsIHJldHVyblxuICAvLyB0aGUgcmVzdCBOIHZhbHVlcyBpbiB0aGUgYXJyYXkuIFRoZSAqKmd1YXJkKipcbiAgLy8gY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLnJlc3QgPSBfLnRhaWwgPSBfLmRyb3AgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgKG4gPT0gbnVsbCkgfHwgZ3VhcmQgPyAxIDogbik7XG4gIH07XG5cbiAgLy8gVHJpbSBvdXQgYWxsIGZhbHN5IHZhbHVlcyBmcm9tIGFuIGFycmF5LlxuICBfLmNvbXBhY3QgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHJldHVybiBfLmZpbHRlcihhcnJheSwgXy5pZGVudGl0eSk7XG4gIH07XG5cbiAgLy8gSW50ZXJuYWwgaW1wbGVtZW50YXRpb24gb2YgYSByZWN1cnNpdmUgYGZsYXR0ZW5gIGZ1bmN0aW9uLlxuICB2YXIgZmxhdHRlbiA9IGZ1bmN0aW9uKGlucHV0LCBzaGFsbG93LCBvdXRwdXQpIHtcbiAgICBpZiAoc2hhbGxvdyAmJiBfLmV2ZXJ5KGlucHV0LCBfLmlzQXJyYXkpKSB7XG4gICAgICByZXR1cm4gY29uY2F0LmFwcGx5KG91dHB1dCwgaW5wdXQpO1xuICAgIH1cbiAgICBlYWNoKGlucHV0LCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgaWYgKF8uaXNBcnJheSh2YWx1ZSkgfHwgXy5pc0FyZ3VtZW50cyh2YWx1ZSkpIHtcbiAgICAgICAgc2hhbGxvdyA/IHB1c2guYXBwbHkob3V0cHV0LCB2YWx1ZSkgOiBmbGF0dGVuKHZhbHVlLCBzaGFsbG93LCBvdXRwdXQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0cHV0LnB1c2godmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBvdXRwdXQ7XG4gIH07XG5cbiAgLy8gRmxhdHRlbiBvdXQgYW4gYXJyYXksIGVpdGhlciByZWN1cnNpdmVseSAoYnkgZGVmYXVsdCksIG9yIGp1c3Qgb25lIGxldmVsLlxuICBfLmZsYXR0ZW4gPSBmdW5jdGlvbihhcnJheSwgc2hhbGxvdykge1xuICAgIHJldHVybiBmbGF0dGVuKGFycmF5LCBzaGFsbG93LCBbXSk7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgdmVyc2lvbiBvZiB0aGUgYXJyYXkgdGhhdCBkb2VzIG5vdCBjb250YWluIHRoZSBzcGVjaWZpZWQgdmFsdWUocykuXG4gIF8ud2l0aG91dCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIF8uZGlmZmVyZW5jZShhcnJheSwgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgfTtcblxuICAvLyBQcm9kdWNlIGEgZHVwbGljYXRlLWZyZWUgdmVyc2lvbiBvZiB0aGUgYXJyYXkuIElmIHRoZSBhcnJheSBoYXMgYWxyZWFkeVxuICAvLyBiZWVuIHNvcnRlZCwgeW91IGhhdmUgdGhlIG9wdGlvbiBvZiB1c2luZyBhIGZhc3RlciBhbGdvcml0aG0uXG4gIC8vIEFsaWFzZWQgYXMgYHVuaXF1ZWAuXG4gIF8udW5pcSA9IF8udW5pcXVlID0gZnVuY3Rpb24oYXJyYXksIGlzU29ydGVkLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmIChfLmlzRnVuY3Rpb24oaXNTb3J0ZWQpKSB7XG4gICAgICBjb250ZXh0ID0gaXRlcmF0b3I7XG4gICAgICBpdGVyYXRvciA9IGlzU29ydGVkO1xuICAgICAgaXNTb3J0ZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGluaXRpYWwgPSBpdGVyYXRvciA/IF8ubWFwKGFycmF5LCBpdGVyYXRvciwgY29udGV4dCkgOiBhcnJheTtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIHZhciBzZWVuID0gW107XG4gICAgZWFjaChpbml0aWFsLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcbiAgICAgIGlmIChpc1NvcnRlZCA/ICghaW5kZXggfHwgc2VlbltzZWVuLmxlbmd0aCAtIDFdICE9PSB2YWx1ZSkgOiAhXy5jb250YWlucyhzZWVuLCB2YWx1ZSkpIHtcbiAgICAgICAgc2Vlbi5wdXNoKHZhbHVlKTtcbiAgICAgICAgcmVzdWx0cy5wdXNoKGFycmF5W2luZGV4XSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIHRoZSB1bmlvbjogZWFjaCBkaXN0aW5jdCBlbGVtZW50IGZyb20gYWxsIG9mXG4gIC8vIHRoZSBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLnVuaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF8udW5pcShfLmZsYXR0ZW4oYXJndW1lbnRzLCB0cnVlKSk7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIGV2ZXJ5IGl0ZW0gc2hhcmVkIGJldHdlZW4gYWxsIHRoZVxuICAvLyBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLmludGVyc2VjdGlvbiA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHJlc3QgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIF8uZmlsdGVyKF8udW5pcShhcnJheSksIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIHJldHVybiBfLmV2ZXJ5KHJlc3QsIGZ1bmN0aW9uKG90aGVyKSB7XG4gICAgICAgIHJldHVybiBfLmluZGV4T2Yob3RoZXIsIGl0ZW0pID49IDA7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBUYWtlIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gb25lIGFycmF5IGFuZCBhIG51bWJlciBvZiBvdGhlciBhcnJheXMuXG4gIC8vIE9ubHkgdGhlIGVsZW1lbnRzIHByZXNlbnQgaW4ganVzdCB0aGUgZmlyc3QgYXJyYXkgd2lsbCByZW1haW4uXG4gIF8uZGlmZmVyZW5jZSA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHJlc3QgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyYXksIGZ1bmN0aW9uKHZhbHVlKXsgcmV0dXJuICFfLmNvbnRhaW5zKHJlc3QsIHZhbHVlKTsgfSk7XG4gIH07XG5cbiAgLy8gWmlwIHRvZ2V0aGVyIG11bHRpcGxlIGxpc3RzIGludG8gYSBzaW5nbGUgYXJyYXkgLS0gZWxlbWVudHMgdGhhdCBzaGFyZVxuICAvLyBhbiBpbmRleCBnbyB0b2dldGhlci5cbiAgXy56aXAgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGVuZ3RoID0gXy5tYXgoXy5wbHVjayhhcmd1bWVudHMsIFwibGVuZ3RoXCIpLmNvbmNhdCgwKSk7XG4gICAgdmFyIHJlc3VsdHMgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICByZXN1bHRzW2ldID0gXy5wbHVjayhhcmd1bWVudHMsICcnICsgaSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIENvbnZlcnRzIGxpc3RzIGludG8gb2JqZWN0cy4gUGFzcyBlaXRoZXIgYSBzaW5nbGUgYXJyYXkgb2YgYFtrZXksIHZhbHVlXWBcbiAgLy8gcGFpcnMsIG9yIHR3byBwYXJhbGxlbCBhcnJheXMgb2YgdGhlIHNhbWUgbGVuZ3RoIC0tIG9uZSBvZiBrZXlzLCBhbmQgb25lIG9mXG4gIC8vIHRoZSBjb3JyZXNwb25kaW5nIHZhbHVlcy5cbiAgXy5vYmplY3QgPSBmdW5jdGlvbihsaXN0LCB2YWx1ZXMpIHtcbiAgICBpZiAobGlzdCA9PSBudWxsKSByZXR1cm4ge307XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodmFsdWVzKSB7XG4gICAgICAgIHJlc3VsdFtsaXN0W2ldXSA9IHZhbHVlc1tpXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdFtsaXN0W2ldWzBdXSA9IGxpc3RbaV1bMV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gSWYgdGhlIGJyb3dzZXIgZG9lc24ndCBzdXBwbHkgdXMgd2l0aCBpbmRleE9mIChJJ20gbG9va2luZyBhdCB5b3UsICoqTVNJRSoqKSxcbiAgLy8gd2UgbmVlZCB0aGlzIGZ1bmN0aW9uLiBSZXR1cm4gdGhlIHBvc2l0aW9uIG9mIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIGFuXG4gIC8vIGl0ZW0gaW4gYW4gYXJyYXksIG9yIC0xIGlmIHRoZSBpdGVtIGlzIG5vdCBpbmNsdWRlZCBpbiB0aGUgYXJyYXkuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBpbmRleE9mYCBpZiBhdmFpbGFibGUuXG4gIC8vIElmIHRoZSBhcnJheSBpcyBsYXJnZSBhbmQgYWxyZWFkeSBpbiBzb3J0IG9yZGVyLCBwYXNzIGB0cnVlYFxuICAvLyBmb3IgKippc1NvcnRlZCoqIHRvIHVzZSBiaW5hcnkgc2VhcmNoLlxuICBfLmluZGV4T2YgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgaXNTb3J0ZWQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIC0xO1xuICAgIHZhciBpID0gMCwgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuICAgIGlmIChpc1NvcnRlZCkge1xuICAgICAgaWYgKHR5cGVvZiBpc1NvcnRlZCA9PSAnbnVtYmVyJykge1xuICAgICAgICBpID0gKGlzU29ydGVkIDwgMCA/IE1hdGgubWF4KDAsIGxlbmd0aCArIGlzU29ydGVkKSA6IGlzU29ydGVkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkgPSBfLnNvcnRlZEluZGV4KGFycmF5LCBpdGVtKTtcbiAgICAgICAgcmV0dXJuIGFycmF5W2ldID09PSBpdGVtID8gaSA6IC0xO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAobmF0aXZlSW5kZXhPZiAmJiBhcnJheS5pbmRleE9mID09PSBuYXRpdmVJbmRleE9mKSByZXR1cm4gYXJyYXkuaW5kZXhPZihpdGVtLCBpc1NvcnRlZCk7XG4gICAgZm9yICg7IGkgPCBsZW5ndGg7IGkrKykgaWYgKGFycmF5W2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH07XG5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGxhc3RJbmRleE9mYCBpZiBhdmFpbGFibGUuXG4gIF8ubGFzdEluZGV4T2YgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgZnJvbSkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gLTE7XG4gICAgdmFyIGhhc0luZGV4ID0gZnJvbSAhPSBudWxsO1xuICAgIGlmIChuYXRpdmVMYXN0SW5kZXhPZiAmJiBhcnJheS5sYXN0SW5kZXhPZiA9PT0gbmF0aXZlTGFzdEluZGV4T2YpIHtcbiAgICAgIHJldHVybiBoYXNJbmRleCA/IGFycmF5Lmxhc3RJbmRleE9mKGl0ZW0sIGZyb20pIDogYXJyYXkubGFzdEluZGV4T2YoaXRlbSk7XG4gICAgfVxuICAgIHZhciBpID0gKGhhc0luZGV4ID8gZnJvbSA6IGFycmF5Lmxlbmd0aCk7XG4gICAgd2hpbGUgKGktLSkgaWYgKGFycmF5W2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH07XG5cbiAgLy8gR2VuZXJhdGUgYW4gaW50ZWdlciBBcnJheSBjb250YWluaW5nIGFuIGFyaXRobWV0aWMgcHJvZ3Jlc3Npb24uIEEgcG9ydCBvZlxuICAvLyB0aGUgbmF0aXZlIFB5dGhvbiBgcmFuZ2UoKWAgZnVuY3Rpb24uIFNlZVxuICAvLyBbdGhlIFB5dGhvbiBkb2N1bWVudGF0aW9uXShodHRwOi8vZG9jcy5weXRob24ub3JnL2xpYnJhcnkvZnVuY3Rpb25zLmh0bWwjcmFuZ2UpLlxuICBfLnJhbmdlID0gZnVuY3Rpb24oc3RhcnQsIHN0b3AsIHN0ZXApIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8PSAxKSB7XG4gICAgICBzdG9wID0gc3RhcnQgfHwgMDtcbiAgICAgIHN0YXJ0ID0gMDtcbiAgICB9XG4gICAgc3RlcCA9IGFyZ3VtZW50c1syXSB8fCAxO1xuXG4gICAgdmFyIGxlbmd0aCA9IE1hdGgubWF4KE1hdGguY2VpbCgoc3RvcCAtIHN0YXJ0KSAvIHN0ZXApLCAwKTtcbiAgICB2YXIgaWR4ID0gMDtcbiAgICB2YXIgcmFuZ2UgPSBuZXcgQXJyYXkobGVuZ3RoKTtcblxuICAgIHdoaWxlKGlkeCA8IGxlbmd0aCkge1xuICAgICAgcmFuZ2VbaWR4KytdID0gc3RhcnQ7XG4gICAgICBzdGFydCArPSBzdGVwO1xuICAgIH1cblxuICAgIHJldHVybiByYW5nZTtcbiAgfTtcblxuICAvLyBGdW5jdGlvbiAoYWhlbSkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJldXNhYmxlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciBwcm90b3R5cGUgc2V0dGluZy5cbiAgdmFyIGN0b3IgPSBmdW5jdGlvbigpe307XG5cbiAgLy8gQ3JlYXRlIGEgZnVuY3Rpb24gYm91bmQgdG8gYSBnaXZlbiBvYmplY3QgKGFzc2lnbmluZyBgdGhpc2AsIGFuZCBhcmd1bWVudHMsXG4gIC8vIG9wdGlvbmFsbHkpLiBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgRnVuY3Rpb24uYmluZGAgaWZcbiAgLy8gYXZhaWxhYmxlLlxuICBfLmJpbmQgPSBmdW5jdGlvbihmdW5jLCBjb250ZXh0KSB7XG4gICAgdmFyIGFyZ3MsIGJvdW5kO1xuICAgIGlmIChuYXRpdmVCaW5kICYmIGZ1bmMuYmluZCA9PT0gbmF0aXZlQmluZCkgcmV0dXJuIG5hdGl2ZUJpbmQuYXBwbHkoZnVuYywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBpZiAoIV8uaXNGdW5jdGlvbihmdW5jKSkgdGhyb3cgbmV3IFR5cGVFcnJvcjtcbiAgICBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBib3VuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIGJvdW5kKSkgcmV0dXJuIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICBjdG9yLnByb3RvdHlwZSA9IGZ1bmMucHJvdG90eXBlO1xuICAgICAgdmFyIHNlbGYgPSBuZXcgY3RvcjtcbiAgICAgIGN0b3IucHJvdG90eXBlID0gbnVsbDtcbiAgICAgIHZhciByZXN1bHQgPSBmdW5jLmFwcGx5KHNlbGYsIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgaWYgKE9iamVjdChyZXN1bHQpID09PSByZXN1bHQpIHJldHVybiByZXN1bHQ7XG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFBhcnRpYWxseSBhcHBseSBhIGZ1bmN0aW9uIGJ5IGNyZWF0aW5nIGEgdmVyc2lvbiB0aGF0IGhhcyBoYWQgc29tZSBvZiBpdHNcbiAgLy8gYXJndW1lbnRzIHByZS1maWxsZWQsIHdpdGhvdXQgY2hhbmdpbmcgaXRzIGR5bmFtaWMgYHRoaXNgIGNvbnRleHQuXG4gIF8ucGFydGlhbCA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEJpbmQgYWxsIG9mIGFuIG9iamVjdCdzIG1ldGhvZHMgdG8gdGhhdCBvYmplY3QuIFVzZWZ1bCBmb3IgZW5zdXJpbmcgdGhhdFxuICAvLyBhbGwgY2FsbGJhY2tzIGRlZmluZWQgb24gYW4gb2JqZWN0IGJlbG9uZyB0byBpdC5cbiAgXy5iaW5kQWxsID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGZ1bmNzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGlmIChmdW5jcy5sZW5ndGggPT09IDApIHRocm93IG5ldyBFcnJvcihcImJpbmRBbGwgbXVzdCBiZSBwYXNzZWQgZnVuY3Rpb24gbmFtZXNcIik7XG4gICAgZWFjaChmdW5jcywgZnVuY3Rpb24oZikgeyBvYmpbZl0gPSBfLmJpbmQob2JqW2ZdLCBvYmopOyB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIE1lbW9pemUgYW4gZXhwZW5zaXZlIGZ1bmN0aW9uIGJ5IHN0b3JpbmcgaXRzIHJlc3VsdHMuXG4gIF8ubWVtb2l6ZSA9IGZ1bmN0aW9uKGZ1bmMsIGhhc2hlcikge1xuICAgIHZhciBtZW1vID0ge307XG4gICAgaGFzaGVyIHx8IChoYXNoZXIgPSBfLmlkZW50aXR5KTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIga2V5ID0gaGFzaGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gXy5oYXMobWVtbywga2V5KSA/IG1lbW9ba2V5XSA6IChtZW1vW2tleV0gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gRGVsYXlzIGEgZnVuY3Rpb24gZm9yIHRoZSBnaXZlbiBudW1iZXIgb2YgbWlsbGlzZWNvbmRzLCBhbmQgdGhlbiBjYWxsc1xuICAvLyBpdCB3aXRoIHRoZSBhcmd1bWVudHMgc3VwcGxpZWQuXG4gIF8uZGVsYXkgPSBmdW5jdGlvbihmdW5jLCB3YWl0KSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgcmV0dXJuIGZ1bmMuYXBwbHkobnVsbCwgYXJncyk7IH0sIHdhaXQpO1xuICB9O1xuXG4gIC8vIERlZmVycyBhIGZ1bmN0aW9uLCBzY2hlZHVsaW5nIGl0IHRvIHJ1biBhZnRlciB0aGUgY3VycmVudCBjYWxsIHN0YWNrIGhhc1xuICAvLyBjbGVhcmVkLlxuICBfLmRlZmVyID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHJldHVybiBfLmRlbGF5LmFwcGx5KF8sIFtmdW5jLCAxXS5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKSk7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCB3aGVuIGludm9rZWQsIHdpbGwgb25seSBiZSB0cmlnZ2VyZWQgYXQgbW9zdCBvbmNlXG4gIC8vIGR1cmluZyBhIGdpdmVuIHdpbmRvdyBvZiB0aW1lLiBOb3JtYWxseSwgdGhlIHRocm90dGxlZCBmdW5jdGlvbiB3aWxsIHJ1blxuICAvLyBhcyBtdWNoIGFzIGl0IGNhbiwgd2l0aG91dCBldmVyIGdvaW5nIG1vcmUgdGhhbiBvbmNlIHBlciBgd2FpdGAgZHVyYXRpb247XG4gIC8vIGJ1dCBpZiB5b3UnZCBsaWtlIHRvIGRpc2FibGUgdGhlIGV4ZWN1dGlvbiBvbiB0aGUgbGVhZGluZyBlZGdlLCBwYXNzXG4gIC8vIGB7bGVhZGluZzogZmFsc2V9YC4gVG8gZGlzYWJsZSBleGVjdXRpb24gb24gdGhlIHRyYWlsaW5nIGVkZ2UsIGRpdHRvLlxuICBfLnRocm90dGxlID0gZnVuY3Rpb24oZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICAgIHZhciBjb250ZXh0LCBhcmdzLCByZXN1bHQ7XG4gICAgdmFyIHRpbWVvdXQgPSBudWxsO1xuICAgIHZhciBwcmV2aW91cyA9IDA7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHByZXZpb3VzID0gb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSA/IDAgOiBuZXcgRGF0ZTtcbiAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBub3cgPSBuZXcgRGF0ZTtcbiAgICAgIGlmICghcHJldmlvdXMgJiYgb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSkgcHJldmlvdXMgPSBub3c7XG4gICAgICB2YXIgcmVtYWluaW5nID0gd2FpdCAtIChub3cgLSBwcmV2aW91cyk7XG4gICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBpZiAocmVtYWluaW5nIDw9IDApIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgcHJldmlvdXMgPSBub3c7XG4gICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICB9IGVsc2UgaWYgKCF0aW1lb3V0ICYmIG9wdGlvbnMudHJhaWxpbmcgIT09IGZhbHNlKSB7XG4gICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCByZW1haW5pbmcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgYXMgbG9uZyBhcyBpdCBjb250aW51ZXMgdG8gYmUgaW52b2tlZCwgd2lsbCBub3RcbiAgLy8gYmUgdHJpZ2dlcmVkLiBUaGUgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgaXQgc3RvcHMgYmVpbmcgY2FsbGVkIGZvclxuICAvLyBOIG1pbGxpc2Vjb25kcy4gSWYgYGltbWVkaWF0ZWAgaXMgcGFzc2VkLCB0cmlnZ2VyIHRoZSBmdW5jdGlvbiBvbiB0aGVcbiAgLy8gbGVhZGluZyBlZGdlLCBpbnN0ZWFkIG9mIHRoZSB0cmFpbGluZy5cbiAgXy5kZWJvdW5jZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuICAgIHZhciB0aW1lb3V0LCBhcmdzLCBjb250ZXh0LCB0aW1lc3RhbXAsIHJlc3VsdDtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpO1xuICAgICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBsYXN0ID0gKG5ldyBEYXRlKCkpIC0gdGltZXN0YW1wO1xuICAgICAgICBpZiAobGFzdCA8IHdhaXQpIHtcbiAgICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCAtIGxhc3QpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgIGlmICghaW1tZWRpYXRlKSByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgdmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG4gICAgICBpZiAoIXRpbWVvdXQpIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuICAgICAgfVxuICAgICAgaWYgKGNhbGxOb3cpIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBleGVjdXRlZCBhdCBtb3N0IG9uZSB0aW1lLCBubyBtYXR0ZXIgaG93XG4gIC8vIG9mdGVuIHlvdSBjYWxsIGl0LiBVc2VmdWwgZm9yIGxhenkgaW5pdGlhbGl6YXRpb24uXG4gIF8ub25jZSA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgcmFuID0gZmFsc2UsIG1lbW87XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHJhbikgcmV0dXJuIG1lbW87XG4gICAgICByYW4gPSB0cnVlO1xuICAgICAgbWVtbyA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIGZ1bmMgPSBudWxsO1xuICAgICAgcmV0dXJuIG1lbW87XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIHRoZSBmaXJzdCBmdW5jdGlvbiBwYXNzZWQgYXMgYW4gYXJndW1lbnQgdG8gdGhlIHNlY29uZCxcbiAgLy8gYWxsb3dpbmcgeW91IHRvIGFkanVzdCBhcmd1bWVudHMsIHJ1biBjb2RlIGJlZm9yZSBhbmQgYWZ0ZXIsIGFuZFxuICAvLyBjb25kaXRpb25hbGx5IGV4ZWN1dGUgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uLlxuICBfLndyYXAgPSBmdW5jdGlvbihmdW5jLCB3cmFwcGVyKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MgPSBbZnVuY107XG4gICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gd3JhcHBlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGlzIHRoZSBjb21wb3NpdGlvbiBvZiBhIGxpc3Qgb2YgZnVuY3Rpb25zLCBlYWNoXG4gIC8vIGNvbnN1bWluZyB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBmdW5jdGlvbiB0aGF0IGZvbGxvd3MuXG4gIF8uY29tcG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmdW5jcyA9IGFyZ3VtZW50cztcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGZvciAodmFyIGkgPSBmdW5jcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBhcmdzID0gW2Z1bmNzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcmdzWzBdO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBvbmx5IGJlIGV4ZWN1dGVkIGFmdGVyIGJlaW5nIGNhbGxlZCBOIHRpbWVzLlxuICBfLmFmdGVyID0gZnVuY3Rpb24odGltZXMsIGZ1bmMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoLS10aW1lcyA8IDEpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICB9O1xuICB9O1xuXG4gIC8vIE9iamVjdCBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJldHJpZXZlIHRoZSBuYW1lcyBvZiBhbiBvYmplY3QncyBwcm9wZXJ0aWVzLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgT2JqZWN0LmtleXNgXG4gIF8ua2V5cyA9IG5hdGl2ZUtleXMgfHwgZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiAhPT0gT2JqZWN0KG9iaikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgb2JqZWN0Jyk7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgICByZXR1cm4ga2V5cztcbiAgfTtcblxuICAvLyBSZXRyaWV2ZSB0aGUgdmFsdWVzIG9mIGFuIG9iamVjdCdzIHByb3BlcnRpZXMuXG4gIF8udmFsdWVzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgdmFyIHZhbHVlcyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhbHVlc1tpXSA9IG9ialtrZXlzW2ldXTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlcztcbiAgfTtcblxuICAvLyBDb252ZXJ0IGFuIG9iamVjdCBpbnRvIGEgbGlzdCBvZiBgW2tleSwgdmFsdWVdYCBwYWlycy5cbiAgXy5wYWlycyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgdmFyIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIHZhciBwYWlycyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHBhaXJzW2ldID0gW2tleXNbaV0sIG9ialtrZXlzW2ldXV07XG4gICAgfVxuICAgIHJldHVybiBwYWlycztcbiAgfTtcblxuICAvLyBJbnZlcnQgdGhlIGtleXMgYW5kIHZhbHVlcyBvZiBhbiBvYmplY3QuIFRoZSB2YWx1ZXMgbXVzdCBiZSBzZXJpYWxpemFibGUuXG4gIF8uaW52ZXJ0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc3VsdFtvYmpba2V5c1tpXV1dID0ga2V5c1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBzb3J0ZWQgbGlzdCBvZiB0aGUgZnVuY3Rpb24gbmFtZXMgYXZhaWxhYmxlIG9uIHRoZSBvYmplY3QuXG4gIC8vIEFsaWFzZWQgYXMgYG1ldGhvZHNgXG4gIF8uZnVuY3Rpb25zID0gXy5tZXRob2RzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIG5hbWVzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgaWYgKF8uaXNGdW5jdGlvbihvYmpba2V5XSkpIG5hbWVzLnB1c2goa2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIG5hbWVzLnNvcnQoKTtcbiAgfTtcblxuICAvLyBFeHRlbmQgYSBnaXZlbiBvYmplY3Qgd2l0aCBhbGwgdGhlIHByb3BlcnRpZXMgaW4gcGFzc2VkLWluIG9iamVjdChzKS5cbiAgXy5leHRlbmQgPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBjb3B5IG9mIHRoZSBvYmplY3Qgb25seSBjb250YWluaW5nIHRoZSB3aGl0ZWxpc3RlZCBwcm9wZXJ0aWVzLlxuICBfLnBpY2sgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29weSA9IHt9O1xuICAgIHZhciBrZXlzID0gY29uY2F0LmFwcGx5KEFycmF5UHJvdG8sIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgZWFjaChrZXlzLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmIChrZXkgaW4gb2JqKSBjb3B5W2tleV0gPSBvYmpba2V5XTtcbiAgICB9KTtcbiAgICByZXR1cm4gY29weTtcbiAgfTtcblxuICAgLy8gUmV0dXJuIGEgY29weSBvZiB0aGUgb2JqZWN0IHdpdGhvdXQgdGhlIGJsYWNrbGlzdGVkIHByb3BlcnRpZXMuXG4gIF8ub21pdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBjb3B5ID0ge307XG4gICAgdmFyIGtleXMgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICBpZiAoIV8uY29udGFpbnMoa2V5cywga2V5KSkgY29weVtrZXldID0gb2JqW2tleV07XG4gICAgfVxuICAgIHJldHVybiBjb3B5O1xuICB9O1xuXG4gIC8vIEZpbGwgaW4gYSBnaXZlbiBvYmplY3Qgd2l0aCBkZWZhdWx0IHByb3BlcnRpZXMuXG4gIF8uZGVmYXVsdHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgaWYgKG9ialtwcm9wXSA9PT0gdm9pZCAwKSBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIENyZWF0ZSBhIChzaGFsbG93LWNsb25lZCkgZHVwbGljYXRlIG9mIGFuIG9iamVjdC5cbiAgXy5jbG9uZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghXy5pc09iamVjdChvYmopKSByZXR1cm4gb2JqO1xuICAgIHJldHVybiBfLmlzQXJyYXkob2JqKSA/IG9iai5zbGljZSgpIDogXy5leHRlbmQoe30sIG9iaik7XG4gIH07XG5cbiAgLy8gSW52b2tlcyBpbnRlcmNlcHRvciB3aXRoIHRoZSBvYmosIGFuZCB0aGVuIHJldHVybnMgb2JqLlxuICAvLyBUaGUgcHJpbWFyeSBwdXJwb3NlIG9mIHRoaXMgbWV0aG9kIGlzIHRvIFwidGFwIGludG9cIiBhIG1ldGhvZCBjaGFpbiwgaW5cbiAgLy8gb3JkZXIgdG8gcGVyZm9ybSBvcGVyYXRpb25zIG9uIGludGVybWVkaWF0ZSByZXN1bHRzIHdpdGhpbiB0aGUgY2hhaW4uXG4gIF8udGFwID0gZnVuY3Rpb24ob2JqLCBpbnRlcmNlcHRvcikge1xuICAgIGludGVyY2VwdG9yKG9iaik7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBJbnRlcm5hbCByZWN1cnNpdmUgY29tcGFyaXNvbiBmdW5jdGlvbiBmb3IgYGlzRXF1YWxgLlxuICB2YXIgZXEgPSBmdW5jdGlvbihhLCBiLCBhU3RhY2ssIGJTdGFjaykge1xuICAgIC8vIElkZW50aWNhbCBvYmplY3RzIGFyZSBlcXVhbC4gYDAgPT09IC0wYCwgYnV0IHRoZXkgYXJlbid0IGlkZW50aWNhbC5cbiAgICAvLyBTZWUgdGhlIFtIYXJtb255IGBlZ2FsYCBwcm9wb3NhbF0oaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9aGFybW9ueTplZ2FsKS5cbiAgICBpZiAoYSA9PT0gYikgcmV0dXJuIGEgIT09IDAgfHwgMSAvIGEgPT0gMSAvIGI7XG4gICAgLy8gQSBzdHJpY3QgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnkgYmVjYXVzZSBgbnVsbCA9PSB1bmRlZmluZWRgLlxuICAgIGlmIChhID09IG51bGwgfHwgYiA9PSBudWxsKSByZXR1cm4gYSA9PT0gYjtcbiAgICAvLyBVbndyYXAgYW55IHdyYXBwZWQgb2JqZWN0cy5cbiAgICBpZiAoYSBpbnN0YW5jZW9mIF8pIGEgPSBhLl93cmFwcGVkO1xuICAgIGlmIChiIGluc3RhbmNlb2YgXykgYiA9IGIuX3dyYXBwZWQ7XG4gICAgLy8gQ29tcGFyZSBgW1tDbGFzc11dYCBuYW1lcy5cbiAgICB2YXIgY2xhc3NOYW1lID0gdG9TdHJpbmcuY2FsbChhKTtcbiAgICBpZiAoY2xhc3NOYW1lICE9IHRvU3RyaW5nLmNhbGwoYikpIHJldHVybiBmYWxzZTtcbiAgICBzd2l0Y2ggKGNsYXNzTmFtZSkge1xuICAgICAgLy8gU3RyaW5ncywgbnVtYmVycywgZGF0ZXMsIGFuZCBib29sZWFucyBhcmUgY29tcGFyZWQgYnkgdmFsdWUuXG4gICAgICBjYXNlICdbb2JqZWN0IFN0cmluZ10nOlxuICAgICAgICAvLyBQcmltaXRpdmVzIGFuZCB0aGVpciBjb3JyZXNwb25kaW5nIG9iamVjdCB3cmFwcGVycyBhcmUgZXF1aXZhbGVudDsgdGh1cywgYFwiNVwiYCBpc1xuICAgICAgICAvLyBlcXVpdmFsZW50IHRvIGBuZXcgU3RyaW5nKFwiNVwiKWAuXG4gICAgICAgIHJldHVybiBhID09IFN0cmluZyhiKTtcbiAgICAgIGNhc2UgJ1tvYmplY3QgTnVtYmVyXSc6XG4gICAgICAgIC8vIGBOYU5gcyBhcmUgZXF1aXZhbGVudCwgYnV0IG5vbi1yZWZsZXhpdmUuIEFuIGBlZ2FsYCBjb21wYXJpc29uIGlzIHBlcmZvcm1lZCBmb3JcbiAgICAgICAgLy8gb3RoZXIgbnVtZXJpYyB2YWx1ZXMuXG4gICAgICAgIHJldHVybiBhICE9ICthID8gYiAhPSArYiA6IChhID09IDAgPyAxIC8gYSA9PSAxIC8gYiA6IGEgPT0gK2IpO1xuICAgICAgY2FzZSAnW29iamVjdCBEYXRlXSc6XG4gICAgICBjYXNlICdbb2JqZWN0IEJvb2xlYW5dJzpcbiAgICAgICAgLy8gQ29lcmNlIGRhdGVzIGFuZCBib29sZWFucyB0byBudW1lcmljIHByaW1pdGl2ZSB2YWx1ZXMuIERhdGVzIGFyZSBjb21wYXJlZCBieSB0aGVpclxuICAgICAgICAvLyBtaWxsaXNlY29uZCByZXByZXNlbnRhdGlvbnMuIE5vdGUgdGhhdCBpbnZhbGlkIGRhdGVzIHdpdGggbWlsbGlzZWNvbmQgcmVwcmVzZW50YXRpb25zXG4gICAgICAgIC8vIG9mIGBOYU5gIGFyZSBub3QgZXF1aXZhbGVudC5cbiAgICAgICAgcmV0dXJuICthID09ICtiO1xuICAgICAgLy8gUmVnRXhwcyBhcmUgY29tcGFyZWQgYnkgdGhlaXIgc291cmNlIHBhdHRlcm5zIGFuZCBmbGFncy5cbiAgICAgIGNhc2UgJ1tvYmplY3QgUmVnRXhwXSc6XG4gICAgICAgIHJldHVybiBhLnNvdXJjZSA9PSBiLnNvdXJjZSAmJlxuICAgICAgICAgICAgICAgYS5nbG9iYWwgPT0gYi5nbG9iYWwgJiZcbiAgICAgICAgICAgICAgIGEubXVsdGlsaW5lID09IGIubXVsdGlsaW5lICYmXG4gICAgICAgICAgICAgICBhLmlnbm9yZUNhc2UgPT0gYi5pZ25vcmVDYXNlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGEgIT0gJ29iamVjdCcgfHwgdHlwZW9mIGIgIT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcbiAgICAvLyBBc3N1bWUgZXF1YWxpdHkgZm9yIGN5Y2xpYyBzdHJ1Y3R1cmVzLiBUaGUgYWxnb3JpdGhtIGZvciBkZXRlY3RpbmcgY3ljbGljXG4gICAgLy8gc3RydWN0dXJlcyBpcyBhZGFwdGVkIGZyb20gRVMgNS4xIHNlY3Rpb24gMTUuMTIuMywgYWJzdHJhY3Qgb3BlcmF0aW9uIGBKT2AuXG4gICAgdmFyIGxlbmd0aCA9IGFTdGFjay5sZW5ndGg7XG4gICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAvLyBMaW5lYXIgc2VhcmNoLiBQZXJmb3JtYW5jZSBpcyBpbnZlcnNlbHkgcHJvcG9ydGlvbmFsIHRvIHRoZSBudW1iZXIgb2ZcbiAgICAgIC8vIHVuaXF1ZSBuZXN0ZWQgc3RydWN0dXJlcy5cbiAgICAgIGlmIChhU3RhY2tbbGVuZ3RoXSA9PSBhKSByZXR1cm4gYlN0YWNrW2xlbmd0aF0gPT0gYjtcbiAgICB9XG4gICAgLy8gT2JqZWN0cyB3aXRoIGRpZmZlcmVudCBjb25zdHJ1Y3RvcnMgYXJlIG5vdCBlcXVpdmFsZW50LCBidXQgYE9iamVjdGBzXG4gICAgLy8gZnJvbSBkaWZmZXJlbnQgZnJhbWVzIGFyZS5cbiAgICB2YXIgYUN0b3IgPSBhLmNvbnN0cnVjdG9yLCBiQ3RvciA9IGIuY29uc3RydWN0b3I7XG4gICAgaWYgKGFDdG9yICE9PSBiQ3RvciAmJiAhKF8uaXNGdW5jdGlvbihhQ3RvcikgJiYgKGFDdG9yIGluc3RhbmNlb2YgYUN0b3IpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uaXNGdW5jdGlvbihiQ3RvcikgJiYgKGJDdG9yIGluc3RhbmNlb2YgYkN0b3IpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBBZGQgdGhlIGZpcnN0IG9iamVjdCB0byB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgYVN0YWNrLnB1c2goYSk7XG4gICAgYlN0YWNrLnB1c2goYik7XG4gICAgdmFyIHNpemUgPSAwLCByZXN1bHQgPSB0cnVlO1xuICAgIC8vIFJlY3Vyc2l2ZWx5IGNvbXBhcmUgb2JqZWN0cyBhbmQgYXJyYXlzLlxuICAgIGlmIChjbGFzc05hbWUgPT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgLy8gQ29tcGFyZSBhcnJheSBsZW5ndGhzIHRvIGRldGVybWluZSBpZiBhIGRlZXAgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnkuXG4gICAgICBzaXplID0gYS5sZW5ndGg7XG4gICAgICByZXN1bHQgPSBzaXplID09IGIubGVuZ3RoO1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAvLyBEZWVwIGNvbXBhcmUgdGhlIGNvbnRlbnRzLCBpZ25vcmluZyBub24tbnVtZXJpYyBwcm9wZXJ0aWVzLlxuICAgICAgICB3aGlsZSAoc2l6ZS0tKSB7XG4gICAgICAgICAgaWYgKCEocmVzdWx0ID0gZXEoYVtzaXplXSwgYltzaXplXSwgYVN0YWNrLCBiU3RhY2spKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRGVlcCBjb21wYXJlIG9iamVjdHMuXG4gICAgICBmb3IgKHZhciBrZXkgaW4gYSkge1xuICAgICAgICBpZiAoXy5oYXMoYSwga2V5KSkge1xuICAgICAgICAgIC8vIENvdW50IHRoZSBleHBlY3RlZCBudW1iZXIgb2YgcHJvcGVydGllcy5cbiAgICAgICAgICBzaXplKys7XG4gICAgICAgICAgLy8gRGVlcCBjb21wYXJlIGVhY2ggbWVtYmVyLlxuICAgICAgICAgIGlmICghKHJlc3VsdCA9IF8uaGFzKGIsIGtleSkgJiYgZXEoYVtrZXldLCBiW2tleV0sIGFTdGFjaywgYlN0YWNrKSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBFbnN1cmUgdGhhdCBib3RoIG9iamVjdHMgY29udGFpbiB0aGUgc2FtZSBudW1iZXIgb2YgcHJvcGVydGllcy5cbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgZm9yIChrZXkgaW4gYikge1xuICAgICAgICAgIGlmIChfLmhhcyhiLCBrZXkpICYmICEoc2l6ZS0tKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID0gIXNpemU7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFJlbW92ZSB0aGUgZmlyc3Qgb2JqZWN0IGZyb20gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgIGFTdGFjay5wb3AoKTtcbiAgICBiU3RhY2sucG9wKCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBQZXJmb3JtIGEgZGVlcCBjb21wYXJpc29uIHRvIGNoZWNrIGlmIHR3byBvYmplY3RzIGFyZSBlcXVhbC5cbiAgXy5pc0VxdWFsID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBlcShhLCBiLCBbXSwgW10pO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gYXJyYXksIHN0cmluZywgb3Igb2JqZWN0IGVtcHR5P1xuICAvLyBBbiBcImVtcHR5XCIgb2JqZWN0IGhhcyBubyBlbnVtZXJhYmxlIG93bi1wcm9wZXJ0aWVzLlxuICBfLmlzRW1wdHkgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiB0cnVlO1xuICAgIGlmIChfLmlzQXJyYXkob2JqKSB8fCBfLmlzU3RyaW5nKG9iaikpIHJldHVybiBvYmoubGVuZ3RoID09PSAwO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGEgRE9NIGVsZW1lbnQ/XG4gIF8uaXNFbGVtZW50ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuICEhKG9iaiAmJiBvYmoubm9kZVR5cGUgPT09IDEpO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYW4gYXJyYXk/XG4gIC8vIERlbGVnYXRlcyB0byBFQ01BNSdzIG5hdGl2ZSBBcnJheS5pc0FycmF5XG4gIF8uaXNBcnJheSA9IG5hdGl2ZUlzQXJyYXkgfHwgZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBBcnJheV0nO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFyaWFibGUgYW4gb2JqZWN0P1xuICBfLmlzT2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gT2JqZWN0KG9iaik7XG4gIH07XG5cbiAgLy8gQWRkIHNvbWUgaXNUeXBlIG1ldGhvZHM6IGlzQXJndW1lbnRzLCBpc0Z1bmN0aW9uLCBpc1N0cmluZywgaXNOdW1iZXIsIGlzRGF0ZSwgaXNSZWdFeHAuXG4gIGVhY2goWydBcmd1bWVudHMnLCAnRnVuY3Rpb24nLCAnU3RyaW5nJywgJ051bWJlcicsICdEYXRlJywgJ1JlZ0V4cCddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgX1snaXMnICsgbmFtZV0gPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgJyArIG5hbWUgKyAnXSc7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gRGVmaW5lIGEgZmFsbGJhY2sgdmVyc2lvbiBvZiB0aGUgbWV0aG9kIGluIGJyb3dzZXJzIChhaGVtLCBJRSksIHdoZXJlXG4gIC8vIHRoZXJlIGlzbid0IGFueSBpbnNwZWN0YWJsZSBcIkFyZ3VtZW50c1wiIHR5cGUuXG4gIGlmICghXy5pc0FyZ3VtZW50cyhhcmd1bWVudHMpKSB7XG4gICAgXy5pc0FyZ3VtZW50cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuICEhKG9iaiAmJiBfLmhhcyhvYmosICdjYWxsZWUnKSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIE9wdGltaXplIGBpc0Z1bmN0aW9uYCBpZiBhcHByb3ByaWF0ZS5cbiAgaWYgKHR5cGVvZiAoLy4vKSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIF8uaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbic7XG4gICAgfTtcbiAgfVxuXG4gIC8vIElzIGEgZ2l2ZW4gb2JqZWN0IGEgZmluaXRlIG51bWJlcj9cbiAgXy5pc0Zpbml0ZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBpc0Zpbml0ZShvYmopICYmICFpc05hTihwYXJzZUZsb2F0KG9iaikpO1xuICB9O1xuXG4gIC8vIElzIHRoZSBnaXZlbiB2YWx1ZSBgTmFOYD8gKE5hTiBpcyB0aGUgb25seSBudW1iZXIgd2hpY2ggZG9lcyBub3QgZXF1YWwgaXRzZWxmKS5cbiAgXy5pc05hTiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBfLmlzTnVtYmVyKG9iaikgJiYgb2JqICE9ICtvYmo7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhIGJvb2xlYW4/XG4gIF8uaXNCb29sZWFuID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdHJ1ZSB8fCBvYmogPT09IGZhbHNlIHx8IHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBCb29sZWFuXSc7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBlcXVhbCB0byBudWxsP1xuICBfLmlzTnVsbCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IG51bGw7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YXJpYWJsZSB1bmRlZmluZWQ/XG4gIF8uaXNVbmRlZmluZWQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSB2b2lkIDA7XG4gIH07XG5cbiAgLy8gU2hvcnRjdXQgZnVuY3Rpb24gZm9yIGNoZWNraW5nIGlmIGFuIG9iamVjdCBoYXMgYSBnaXZlbiBwcm9wZXJ0eSBkaXJlY3RseVxuICAvLyBvbiBpdHNlbGYgKGluIG90aGVyIHdvcmRzLCBub3Qgb24gYSBwcm90b3R5cGUpLlxuICBfLmhhcyA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpO1xuICB9O1xuXG4gIC8vIFV0aWxpdHkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUnVuIFVuZGVyc2NvcmUuanMgaW4gKm5vQ29uZmxpY3QqIG1vZGUsIHJldHVybmluZyB0aGUgYF9gIHZhcmlhYmxlIHRvIGl0c1xuICAvLyBwcmV2aW91cyBvd25lci4gUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8ubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgIHJvb3QuXyA9IHByZXZpb3VzVW5kZXJzY29yZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvLyBLZWVwIHRoZSBpZGVudGl0eSBmdW5jdGlvbiBhcm91bmQgZm9yIGRlZmF1bHQgaXRlcmF0b3JzLlxuICBfLmlkZW50aXR5ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG5cbiAgLy8gUnVuIGEgZnVuY3Rpb24gKipuKiogdGltZXMuXG4gIF8udGltZXMgPSBmdW5jdGlvbihuLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciBhY2N1bSA9IEFycmF5KE1hdGgubWF4KDAsIG4pKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykgYWNjdW1baV0gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIGkpO1xuICAgIHJldHVybiBhY2N1bTtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIG1pbiBhbmQgbWF4IChpbmNsdXNpdmUpLlxuICBfLnJhbmRvbSA9IGZ1bmN0aW9uKG1pbiwgbWF4KSB7XG4gICAgaWYgKG1heCA9PSBudWxsKSB7XG4gICAgICBtYXggPSBtaW47XG4gICAgICBtaW4gPSAwO1xuICAgIH1cbiAgICByZXR1cm4gbWluICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKTtcbiAgfTtcblxuICAvLyBMaXN0IG9mIEhUTUwgZW50aXRpZXMgZm9yIGVzY2FwaW5nLlxuICB2YXIgZW50aXR5TWFwID0ge1xuICAgIGVzY2FwZToge1xuICAgICAgJyYnOiAnJmFtcDsnLFxuICAgICAgJzwnOiAnJmx0OycsXG4gICAgICAnPic6ICcmZ3Q7JyxcbiAgICAgICdcIic6ICcmcXVvdDsnLFxuICAgICAgXCInXCI6ICcmI3gyNzsnXG4gICAgfVxuICB9O1xuICBlbnRpdHlNYXAudW5lc2NhcGUgPSBfLmludmVydChlbnRpdHlNYXAuZXNjYXBlKTtcblxuICAvLyBSZWdleGVzIGNvbnRhaW5pbmcgdGhlIGtleXMgYW5kIHZhbHVlcyBsaXN0ZWQgaW1tZWRpYXRlbHkgYWJvdmUuXG4gIHZhciBlbnRpdHlSZWdleGVzID0ge1xuICAgIGVzY2FwZTogICBuZXcgUmVnRXhwKCdbJyArIF8ua2V5cyhlbnRpdHlNYXAuZXNjYXBlKS5qb2luKCcnKSArICddJywgJ2cnKSxcbiAgICB1bmVzY2FwZTogbmV3IFJlZ0V4cCgnKCcgKyBfLmtleXMoZW50aXR5TWFwLnVuZXNjYXBlKS5qb2luKCd8JykgKyAnKScsICdnJylcbiAgfTtcblxuICAvLyBGdW5jdGlvbnMgZm9yIGVzY2FwaW5nIGFuZCB1bmVzY2FwaW5nIHN0cmluZ3MgdG8vZnJvbSBIVE1MIGludGVycG9sYXRpb24uXG4gIF8uZWFjaChbJ2VzY2FwZScsICd1bmVzY2FwZSddLCBmdW5jdGlvbihtZXRob2QpIHtcbiAgICBfW21ldGhvZF0gPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgIGlmIChzdHJpbmcgPT0gbnVsbCkgcmV0dXJuICcnO1xuICAgICAgcmV0dXJuICgnJyArIHN0cmluZykucmVwbGFjZShlbnRpdHlSZWdleGVzW21ldGhvZF0sIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiBlbnRpdHlNYXBbbWV0aG9kXVttYXRjaF07XG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcblxuICAvLyBJZiB0aGUgdmFsdWUgb2YgdGhlIG5hbWVkIGBwcm9wZXJ0eWAgaXMgYSBmdW5jdGlvbiB0aGVuIGludm9rZSBpdCB3aXRoIHRoZVxuICAvLyBgb2JqZWN0YCBhcyBjb250ZXh0OyBvdGhlcndpc2UsIHJldHVybiBpdC5cbiAgXy5yZXN1bHQgPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgaWYgKG9iamVjdCA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIHZhciB2YWx1ZSA9IG9iamVjdFtwcm9wZXJ0eV07XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih2YWx1ZSkgPyB2YWx1ZS5jYWxsKG9iamVjdCkgOiB2YWx1ZTtcbiAgfTtcblxuICAvLyBBZGQgeW91ciBvd24gY3VzdG9tIGZ1bmN0aW9ucyB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8ubWl4aW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKF8uZnVuY3Rpb25zKG9iaiksIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHZhciBmdW5jID0gX1tuYW1lXSA9IG9ialtuYW1lXTtcbiAgICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhcmdzID0gW3RoaXMuX3dyYXBwZWRdO1xuICAgICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBmdW5jLmFwcGx5KF8sIGFyZ3MpKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gR2VuZXJhdGUgYSB1bmlxdWUgaW50ZWdlciBpZCAodW5pcXVlIHdpdGhpbiB0aGUgZW50aXJlIGNsaWVudCBzZXNzaW9uKS5cbiAgLy8gVXNlZnVsIGZvciB0ZW1wb3JhcnkgRE9NIGlkcy5cbiAgdmFyIGlkQ291bnRlciA9IDA7XG4gIF8udW5pcXVlSWQgPSBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICB2YXIgaWQgPSArK2lkQ291bnRlciArICcnO1xuICAgIHJldHVybiBwcmVmaXggPyBwcmVmaXggKyBpZCA6IGlkO1xuICB9O1xuXG4gIC8vIEJ5IGRlZmF1bHQsIFVuZGVyc2NvcmUgdXNlcyBFUkItc3R5bGUgdGVtcGxhdGUgZGVsaW1pdGVycywgY2hhbmdlIHRoZVxuICAvLyBmb2xsb3dpbmcgdGVtcGxhdGUgc2V0dGluZ3MgdG8gdXNlIGFsdGVybmF0aXZlIGRlbGltaXRlcnMuXG4gIF8udGVtcGxhdGVTZXR0aW5ncyA9IHtcbiAgICBldmFsdWF0ZSAgICA6IC88JShbXFxzXFxTXSs/KSU+L2csXG4gICAgaW50ZXJwb2xhdGUgOiAvPCU9KFtcXHNcXFNdKz8pJT4vZyxcbiAgICBlc2NhcGUgICAgICA6IC88JS0oW1xcc1xcU10rPyklPi9nXG4gIH07XG5cbiAgLy8gV2hlbiBjdXN0b21pemluZyBgdGVtcGxhdGVTZXR0aW5nc2AsIGlmIHlvdSBkb24ndCB3YW50IHRvIGRlZmluZSBhblxuICAvLyBpbnRlcnBvbGF0aW9uLCBldmFsdWF0aW9uIG9yIGVzY2FwaW5nIHJlZ2V4LCB3ZSBuZWVkIG9uZSB0aGF0IGlzXG4gIC8vIGd1YXJhbnRlZWQgbm90IHRvIG1hdGNoLlxuICB2YXIgbm9NYXRjaCA9IC8oLileLztcblxuICAvLyBDZXJ0YWluIGNoYXJhY3RlcnMgbmVlZCB0byBiZSBlc2NhcGVkIHNvIHRoYXQgdGhleSBjYW4gYmUgcHV0IGludG8gYVxuICAvLyBzdHJpbmcgbGl0ZXJhbC5cbiAgdmFyIGVzY2FwZXMgPSB7XG4gICAgXCInXCI6ICAgICAgXCInXCIsXG4gICAgJ1xcXFwnOiAgICAgJ1xcXFwnLFxuICAgICdcXHInOiAgICAgJ3InLFxuICAgICdcXG4nOiAgICAgJ24nLFxuICAgICdcXHQnOiAgICAgJ3QnLFxuICAgICdcXHUyMDI4JzogJ3UyMDI4JyxcbiAgICAnXFx1MjAyOSc6ICd1MjAyOSdcbiAgfTtcblxuICB2YXIgZXNjYXBlciA9IC9cXFxcfCd8XFxyfFxcbnxcXHR8XFx1MjAyOHxcXHUyMDI5L2c7XG5cbiAgLy8gSmF2YVNjcmlwdCBtaWNyby10ZW1wbGF0aW5nLCBzaW1pbGFyIHRvIEpvaG4gUmVzaWcncyBpbXBsZW1lbnRhdGlvbi5cbiAgLy8gVW5kZXJzY29yZSB0ZW1wbGF0aW5nIGhhbmRsZXMgYXJiaXRyYXJ5IGRlbGltaXRlcnMsIHByZXNlcnZlcyB3aGl0ZXNwYWNlLFxuICAvLyBhbmQgY29ycmVjdGx5IGVzY2FwZXMgcXVvdGVzIHdpdGhpbiBpbnRlcnBvbGF0ZWQgY29kZS5cbiAgXy50ZW1wbGF0ZSA9IGZ1bmN0aW9uKHRleHQsIGRhdGEsIHNldHRpbmdzKSB7XG4gICAgdmFyIHJlbmRlcjtcbiAgICBzZXR0aW5ncyA9IF8uZGVmYXVsdHMoe30sIHNldHRpbmdzLCBfLnRlbXBsYXRlU2V0dGluZ3MpO1xuXG4gICAgLy8gQ29tYmluZSBkZWxpbWl0ZXJzIGludG8gb25lIHJlZ3VsYXIgZXhwcmVzc2lvbiB2aWEgYWx0ZXJuYXRpb24uXG4gICAgdmFyIG1hdGNoZXIgPSBuZXcgUmVnRXhwKFtcbiAgICAgIChzZXR0aW5ncy5lc2NhcGUgfHwgbm9NYXRjaCkuc291cmNlLFxuICAgICAgKHNldHRpbmdzLmludGVycG9sYXRlIHx8IG5vTWF0Y2gpLnNvdXJjZSxcbiAgICAgIChzZXR0aW5ncy5ldmFsdWF0ZSB8fCBub01hdGNoKS5zb3VyY2VcbiAgICBdLmpvaW4oJ3wnKSArICd8JCcsICdnJyk7XG5cbiAgICAvLyBDb21waWxlIHRoZSB0ZW1wbGF0ZSBzb3VyY2UsIGVzY2FwaW5nIHN0cmluZyBsaXRlcmFscyBhcHByb3ByaWF0ZWx5LlxuICAgIHZhciBpbmRleCA9IDA7XG4gICAgdmFyIHNvdXJjZSA9IFwiX19wKz0nXCI7XG4gICAgdGV4dC5yZXBsYWNlKG1hdGNoZXIsIGZ1bmN0aW9uKG1hdGNoLCBlc2NhcGUsIGludGVycG9sYXRlLCBldmFsdWF0ZSwgb2Zmc2V0KSB7XG4gICAgICBzb3VyY2UgKz0gdGV4dC5zbGljZShpbmRleCwgb2Zmc2V0KVxuICAgICAgICAucmVwbGFjZShlc2NhcGVyLCBmdW5jdGlvbihtYXRjaCkgeyByZXR1cm4gJ1xcXFwnICsgZXNjYXBlc1ttYXRjaF07IH0pO1xuXG4gICAgICBpZiAoZXNjYXBlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIicrXFxuKChfX3Q9KFwiICsgZXNjYXBlICsgXCIpKT09bnVsbD8nJzpfLmVzY2FwZShfX3QpKStcXG4nXCI7XG4gICAgICB9XG4gICAgICBpZiAoaW50ZXJwb2xhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBpbnRlcnBvbGF0ZSArIFwiKSk9PW51bGw/Jyc6X190KStcXG4nXCI7XG4gICAgICB9XG4gICAgICBpZiAoZXZhbHVhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJztcXG5cIiArIGV2YWx1YXRlICsgXCJcXG5fX3ArPSdcIjtcbiAgICAgIH1cbiAgICAgIGluZGV4ID0gb2Zmc2V0ICsgbWF0Y2gubGVuZ3RoO1xuICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH0pO1xuICAgIHNvdXJjZSArPSBcIic7XFxuXCI7XG5cbiAgICAvLyBJZiBhIHZhcmlhYmxlIGlzIG5vdCBzcGVjaWZpZWQsIHBsYWNlIGRhdGEgdmFsdWVzIGluIGxvY2FsIHNjb3BlLlxuICAgIGlmICghc2V0dGluZ3MudmFyaWFibGUpIHNvdXJjZSA9ICd3aXRoKG9ianx8e30pe1xcbicgKyBzb3VyY2UgKyAnfVxcbic7XG5cbiAgICBzb3VyY2UgPSBcInZhciBfX3QsX19wPScnLF9faj1BcnJheS5wcm90b3R5cGUuam9pbixcIiArXG4gICAgICBcInByaW50PWZ1bmN0aW9uKCl7X19wKz1fX2ouY2FsbChhcmd1bWVudHMsJycpO307XFxuXCIgK1xuICAgICAgc291cmNlICsgXCJyZXR1cm4gX19wO1xcblwiO1xuXG4gICAgdHJ5IHtcbiAgICAgIHJlbmRlciA9IG5ldyBGdW5jdGlvbihzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJywgJ18nLCBzb3VyY2UpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGUuc291cmNlID0gc291cmNlO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG5cbiAgICBpZiAoZGF0YSkgcmV0dXJuIHJlbmRlcihkYXRhLCBfKTtcbiAgICB2YXIgdGVtcGxhdGUgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gcmVuZGVyLmNhbGwodGhpcywgZGF0YSwgXyk7XG4gICAgfTtcblxuICAgIC8vIFByb3ZpZGUgdGhlIGNvbXBpbGVkIGZ1bmN0aW9uIHNvdXJjZSBhcyBhIGNvbnZlbmllbmNlIGZvciBwcmVjb21waWxhdGlvbi5cbiAgICB0ZW1wbGF0ZS5zb3VyY2UgPSAnZnVuY3Rpb24oJyArIChzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJykgKyAnKXtcXG4nICsgc291cmNlICsgJ30nO1xuXG4gICAgcmV0dXJuIHRlbXBsYXRlO1xuICB9O1xuXG4gIC8vIEFkZCBhIFwiY2hhaW5cIiBmdW5jdGlvbiwgd2hpY2ggd2lsbCBkZWxlZ2F0ZSB0byB0aGUgd3JhcHBlci5cbiAgXy5jaGFpbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBfKG9iaikuY2hhaW4oKTtcbiAgfTtcblxuICAvLyBPT1BcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG4gIC8vIElmIFVuZGVyc2NvcmUgaXMgY2FsbGVkIGFzIGEgZnVuY3Rpb24sIGl0IHJldHVybnMgYSB3cmFwcGVkIG9iamVjdCB0aGF0XG4gIC8vIGNhbiBiZSB1c2VkIE9PLXN0eWxlLiBUaGlzIHdyYXBwZXIgaG9sZHMgYWx0ZXJlZCB2ZXJzaW9ucyBvZiBhbGwgdGhlXG4gIC8vIHVuZGVyc2NvcmUgZnVuY3Rpb25zLiBXcmFwcGVkIG9iamVjdHMgbWF5IGJlIGNoYWluZWQuXG5cbiAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGNvbnRpbnVlIGNoYWluaW5nIGludGVybWVkaWF0ZSByZXN1bHRzLlxuICB2YXIgcmVzdWx0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NoYWluID8gXyhvYmopLmNoYWluKCkgOiBvYmo7XG4gIH07XG5cbiAgLy8gQWRkIGFsbCBvZiB0aGUgVW5kZXJzY29yZSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIgb2JqZWN0LlxuICBfLm1peGluKF8pO1xuXG4gIC8vIEFkZCBhbGwgbXV0YXRvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIGVhY2goWydwb3AnLCAncHVzaCcsICdyZXZlcnNlJywgJ3NoaWZ0JywgJ3NvcnQnLCAnc3BsaWNlJywgJ3Vuc2hpZnQnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBtZXRob2QgPSBBcnJheVByb3RvW25hbWVdO1xuICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgb2JqID0gdGhpcy5fd3JhcHBlZDtcbiAgICAgIG1ldGhvZC5hcHBseShvYmosIGFyZ3VtZW50cyk7XG4gICAgICBpZiAoKG5hbWUgPT0gJ3NoaWZ0JyB8fCBuYW1lID09ICdzcGxpY2UnKSAmJiBvYmoubGVuZ3RoID09PSAwKSBkZWxldGUgb2JqWzBdO1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIG9iaik7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gQWRkIGFsbCBhY2Nlc3NvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIGVhY2goWydjb25jYXQnLCAnam9pbicsICdzbGljZSddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG1ldGhvZCA9IEFycmF5UHJvdG9bbmFtZV07XG4gICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBtZXRob2QuYXBwbHkodGhpcy5fd3JhcHBlZCwgYXJndW1lbnRzKSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgXy5leHRlbmQoXy5wcm90b3R5cGUsIHtcblxuICAgIC8vIFN0YXJ0IGNoYWluaW5nIGEgd3JhcHBlZCBVbmRlcnNjb3JlIG9iamVjdC5cbiAgICBjaGFpbjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9jaGFpbiA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gRXh0cmFjdHMgdGhlIHJlc3VsdCBmcm9tIGEgd3JhcHBlZCBhbmQgY2hhaW5lZCBvYmplY3QuXG4gICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3dyYXBwZWQ7XG4gICAgfVxuXG4gIH0pO1xuXG59KS5jYWxsKHRoaXMpO1xuIl19
;