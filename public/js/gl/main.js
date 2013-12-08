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
},{}],6:[function(require,module,exports){
var THR = require('./three.min.node.js');


var Controller = {
	T:function(){
		if(typeof window === 'undefined'){
			//console.log('this');
			return THR
	
		}else{
			return THREE
		}
	},
	
	NetworkActor : function(S, socket, onAct){
		
		var map = Controller.ControllersActionMap()
		var self = this;
		socket.on('player_controls_on', function(data){
			console.log('ok recv', data)
			var actor_login = data.login
			var action = data.action;
			self.act(S, action, true, actor_login)
		
		})
	
		socket.on('player_controls_off', function(data){
			console.log('ok recv', data)
			var actor_login = data.login
			var action = data.action;
			self.act(S, action, false, actor_login)
		
		})
		this.run = function(){
			// no need to bother - event style
		}
		this.act=function(W, action, is_on, actor){
			//var C = W.meshes[ W.actors[actor].control.object_guid ]
			var _a = map[action.type].act(S, action, is_on, actor, onAct);
		
		}
		return this;
	},
	LocalInputActor : function(W, socket){
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
				t[k.substr(1)] = W.mouse_projection_vec.clone().sub(W.controllable().position.clone() )
			}},
		}
	
		self.actions = self._default_actions;
		this.input = function(keycode, up_or_down, modifiers){
			// 1. Send to server action
			var action = _.clone(self.actions[keycode]);
			// console.log(action);
			_.each(action, function(item, k){
				// console.log('a');
				if (k[0] == '_'){
					item(action,k)
				}
			})
			//console.log(action);
			if (up_or_down){
				socket.emit('control_on', action);
			}else{
				socket.emit('control_off', action);
			
			}
			// DONE
			// 2. Act it locally
			var onAct = function(){ console.log('this is keyboard controller - no need in onAct here')}
			local_controller = map[action.type]
			local_controller.act(self.World.scene, action, up_or_down, actor, onAct);
			//DONE
		}
	},


	CPilotController : function(){
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
	
		this.act = function(S, action, is_down, actor ){
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
		}
		// return this;
	
	},


	basicAutoPilotActor:function (S, id, oid){
		this.targets = ["orbit_object", "close_to_object"];
		this.default_distance = 200
		this.get_foes = function(){
			this.foes = []
			for (var i =0; i < W.meshes.length; i++){
				if(i != id) foes.push({id:id, obj:W.meshes[i]})
			}
		}
	},
	 BasicBulletActor:function(S, id, coid){ 
		// id = is object in the world controllable by this actor
		// coid  MUST BE an object, who shoot this bullet
		//var S = W.scene
		this.name = "Basic_actor" + (performance.now())
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
				if(S.three_scene){
					//console.log('even from');
					S.three_scene.remove(S.meshes[id])
					//console.log(S.three_scene)
				}
				delete S.meshes[id];
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
					// console.log("HH", i, ag, Math.PI/8);
				
					// console.log("id vefore", 	id, );
					var sub = self.my_mesh.position.clone().sub( mp );
					
					var dist = sub.length()
					if( dist < thres){
						//console.log("OKE");
						if( in_thres.indexOf( i ) === -1 ){
						
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
					
				}
				//else{
				if(i in _possible_targets){
					// Угол был острый - стал тупой
					// console.log("here!",i);
					// Надо проверить, не пересекает ли отрезок - прошлые координаты - текущие координаты наш меш
					var direction = mpos.clone().sub( _possible_targets[i].last_point)
					var ray = new T.Raycaster(_possible_targets[i].last_point, direction.clone().normalize() )
					var isr = ray.intersectObjects([m])
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
						if (! mavel ){avel = new T.Vector3(0,0,0)}
						mavel.x += avel.x
						mavel.y += avel.y
						mavel.z += avel.z;
						console.log(mavel.x, mavel.y, mavel.z)
						S.meshes[i].avel = mavel;
					
					
					
						add_vel = impulse.multiplyScalar( 1/ m.mass);
						// console.log(add_vel)
						// Убрать пока скорость
						S.meshes[i].vel.add(add_vel);
					
					
						//console.log("END LOCAL", isr[0].point);
						//console.log('oke, we shoot it:', i)
						// Now we will just remove object from scene with the bullet
						//W.scene.remove(W.meshes[i])
					
						S.three_scene.remove(S.meshes[id]) // удяляем ядро из сцены
					
						//W.meshes.splice(i, 1);
						delete _possible_targets[i] // ... из возможных целей удаляем этот меш
						delete S.meshes[ id ]; // ... из мешей
						delete S.actors[self.name]; // ... Удаляем этого актора - больше не загрузится эта функция
						// bla.bla = 1
					}
					//}
					// console.log( ag, Math.PI/8);
				
				}
			
			})
			//bla.bal +=1
			//console.log(bla)
		
		
			// console.log(total_time_in_space ,W.meshes.length, W.actors)
		}
	
	
	},
	CTurretController : function(){
		this.act = function(S, action, is_down, actor ){
			if (action.type =='shoot_primary'){
				// var weapon = C.weapons[0];
				//console.log("shot by", actor)
				var T = Controller.T();
				//if (actor === undefined){
					// console.log("MY", W.get_current_actor().control.object_guid)
				//	var C = S.meshes[ W.get_actor(actor).control.object_guid ]
				//}else{
				var C = S.mesh_for(actor)
				
					//}
				if (action.turret_direction instanceof T .Vector3){
					var mpv = action.turret_direction
				
				}else{
					var mpv = new T.Vector3(action.turret_direction.x,
												action.turret_direction.y,
												action.turret_direction.z)
				}
				mpv.multiplyScalar(0.5000);
				//console.log('TH', Controller.T())
				var cubeGeometry = new T.CubeGeometry(1,1,1,1,1,1);
				var wireMaterial = new T.MeshBasicMaterial( { color: 0x00ff00, wireframe:true } );
				var bullet = new T.Mesh( cubeGeometry, wireMaterial );
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
	
	},
	ControllersActionMap: function(){
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
}
module.exports = Controller
//var TurretController = new CTurretController()
//CPilotController.prototype = {constructor:CPilotController}
//var PilotController = new CPilotController();

//console.log(TurretController.act, PilotController.act)

},{"./three.min.node.js":7}],7:[function(require,module,exports){

},{}],2:[function(require,module,exports){
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
},{"./three.min.node.js":7,"./utils.js":4,"fs":8,"underscore":9}],3:[function(require,module,exports){
var Scene = require('./scene.js')
var u = require('./utils.js')
var _     = require('underscore');

var Mission = {descr:"Module for creating missions"}

Mission.create = function(creator_login, callback){
	
	// No params - only one mission available
	var self = this ;
	this.GUID = u.make_guid();
	this.creator = creator_login;
	var p1 = [-110, 100, 40];
	var p2 = [140, -110, 70];
	var c = 0.2
	var p1 = _.map(p1,function(v){return v*c});
	var p2 = _.map(p2,function(v){return v*c});;
	
	var def_ship1 = {type:'ship',
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
			 							"position": [0,0,2],
			 							"direction":[0,0,1]
			 							}
									},
			 			'engines':{
			 				'rotation':{
			 					'x+':100,'x-':100,
			 					'y+':100,'y-':100,
			 					'z+':100,'z-':100
			 				},
			 				'propulsion':{
			 					'x+':1,'x-':1,
			 					'y+':1,'y-':1,
			 					'z+':1000,'z-':1000
			 				}
			 			},
			 			'mass': 10000,
						'GUID':u.make_guid()
					}
	var def_ship2 = {type:'ship',
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
			 							"position": [0,0,2],
			 							"direction":[0,0,1]
			 							}
									},
			 			'engines':{
			 				'rotation':{
			 					'x+':100,'x-':100,
			 					'y+':100,'y-':100,
			 					'z+':100,'z-':100
			 				},
			 				'propulsion':{
			 					'x+':1,'x-':1,
			 					'y+':1,'y-':1,
			 					'z+':1000,'z-':1000
			 				}
			 			},
			 			'mass': 10000,
						'GUID':u.make_guid()
					}
	// Жестко заданные кораблики - без позиций и скоростей	
	var pivot= 	function(x,y,z){
		return {type:'pivot',
			
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
	var inc = 0
	for (var x=-200; x<= 200; x+=50){
		for (var y=-200; y<= 200; y+=50){
			for (var z=-200; z<= 200; z+=50){
				console.log(inc,"x,y,z",x,y,z)
				inc +=1;
				var p =pivot(x,y,z)
				so[p.GUID] = p
			}
		}
	}
	var mission = {
		actors : [{login: creator_login, command:'red', control:{object_guid:def_ship1.GUID, viewport:'front', controls:['Pilot', 'Turret']} }],
		commands:['red', 'blue'],
		_commands_amount:[1,0],
		max_per_command:1,
		min_per_command:1,
		coords : [100, 500, 300], // Global coords of mission origin
		shared_objects: so
	}
	self._mission_logins = [creator_login];
	self.mission = mission
	self._mission_ready = function(){
		// console.log('ok - launching')
		// var scene = self.prepare_scene()
		// callback (scene)
		
		
	}
	self.prepare_scene();
	return this
}
Mission.prepare_scene = function(){
	
	this._scene = Scene.create_from_world(this.mission.coords[0],
											this.mission.coords[1],
											this.mission.coords[2] );
	var self = this;
	_.each(this.mission.shared_objects, function(obj){
		self._scene.join_object(obj)
		
	})										
	_.each(this.mission.actors, function(a){
		console.log(a)
		self._scene.join_actor(a);
	})
							
}
Mission.join_player = function(login){
	var self = this;
	var M = self.mission;
	var command;
	// Get first available command
	console.log("LOGIN", login)
	self._mission_logins.push(login);
	for(var c =0; c< M.commands.length;  c++){
		console.log("CAm", M._commands_amount[c], M.max_per_command);
		if (M._commands_amount[c] == M.max_per_command){
			
			continue
		}else{
			command = M.commands[c]
			break
		}
	}
	// Controllable not chosen... controllable given
	var controllable = {object_guid:this._dh2.GUID, viewport:'front', controls:['Pilot', 'Turret']} 
	// We could be safe now - only two objects and only two players - they cannot change they're position in the mission
	// But when it would be several players on ONE ship available - we should check CAREFULLY if object in scene already
	//console.log("command", command)
	if(command){
		var actor = {command:command, login:login, control: controllable}
		self.mission.actors.push(actor)
		console.log("ACTORS", self.mission.actors);
		self._scene.join_actor(actor)
	}
	
}
module.exports = Mission
},{"./scene.js":2,"./utils.js":4,"underscore":9}],8:[function(require,module,exports){
// nothing to see here... no file methods for the browser

},{}],9:[function(require,module,exports){
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvYXpsL0RvY3VtZW50cy93b3Jrc3BhY2UvYXotYXoucnUvc2VydmVyL2VudHJ5LmpzIiwiL1VzZXJzL2F6bC9Eb2N1bWVudHMvd29ya3NwYWNlL2F6LWF6LnJ1L3NlcnZlci91dGlscy5qcyIsIi9Vc2Vycy9hemwvRG9jdW1lbnRzL3dvcmtzcGFjZS9hei1hei5ydS9zZXJ2ZXIvc3ByaXRlX3V0aWxzLmpzIiwiL1VzZXJzL2F6bC9Eb2N1bWVudHMvd29ya3NwYWNlL2F6LWF6LnJ1L3NlcnZlci9jb250cm9sbGVyLmpzIiwiL1VzZXJzL2F6bC9Eb2N1bWVudHMvd29ya3NwYWNlL2F6LWF6LnJ1L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5LWV4cHJlc3Mvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvX2VtcHR5LmpzIiwiL1VzZXJzL2F6bC9Eb2N1bWVudHMvd29ya3NwYWNlL2F6LWF6LnJ1L3NlcnZlci9zY2VuZS5qcyIsIi9Vc2Vycy9hemwvRG9jdW1lbnRzL3dvcmtzcGFjZS9hei1hei5ydS9zZXJ2ZXIvbWlzc2lvbnMuanMiLCIvVXNlcnMvYXpsL0RvY3VtZW50cy93b3Jrc3BhY2UvYXotYXoucnUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnktZXhwcmVzcy9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1idWlsdGlucy9idWlsdGluL2ZzLmpzIiwiL1VzZXJzL2F6bC9Eb2N1bWVudHMvd29ya3NwYWNlL2F6LWF6LnJ1L25vZGVfbW9kdWxlcy91bmRlcnNjb3JlL3VuZGVyc2NvcmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclpBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TEE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiU2NlbmUgPSByZXF1aXJlKCcuL3NjZW5lLmpzJylcbk1pc3NvaW9uID0gcmVxdWlyZSgnLi9taXNzaW9ucy5qcycpXG5VdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMuanMnKVxuU3ByaXRlVXRpbHMgPSByZXF1aXJlKCcuL3Nwcml0ZV91dGlscy5qcycpXG5Db250cm9sbGVyID0gcmVxdWlyZSgnLi9jb250cm9sbGVyLmpzJylcblxuXG4iLCJ2YXIgVXRpbHMgPSB7XG5cdFxuXHRtYWtlX2d1aWQgOmZ1bmN0aW9uKCl7XG5cdFx0dmFyIGd1aWQgPSAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uKGMpIHtcblx0XHQgICAgdmFyIHIgPSBNYXRoLnJhbmRvbSgpKjE2fDAsIHYgPSBjID09ICd4JyA/IHIgOiAociYweDN8MHg4KTtcblx0XHQgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuXHRcdH0pO1xuXHRcdHJldHVybiBndWlkO1xuXHR9XG59XG5tb2R1bGUuZXhwb3J0cyA9IFV0aWxzOyIsInZhciBNb2QgPSB7XG5cdCBtYWtlVGV4dFNwcml0ZTpmdW5jdGlvbiggbWVzc2FnZSwgcGFyYW1ldGVycyApe1xuXHRcdGlmICggcGFyYW1ldGVycyA9PT0gdW5kZWZpbmVkICkgcGFyYW1ldGVycyA9IHt9O1xuXHRcblx0XHR2YXIgZm9udGZhY2UgPSBwYXJhbWV0ZXJzLmhhc093blByb3BlcnR5KFwiZm9udGZhY2VcIikgPyBcblx0XHRcdHBhcmFtZXRlcnNbXCJmb250ZmFjZVwiXSA6IFwiQXJpYWxcIjtcblx0XG5cdFx0dmFyIGZvbnRzaXplID0gcGFyYW1ldGVycy5oYXNPd25Qcm9wZXJ0eShcImZvbnRzaXplXCIpID8gXG5cdFx0XHRwYXJhbWV0ZXJzW1wiZm9udHNpemVcIl0gOiAxODtcblx0XG5cdFx0dmFyIGJvcmRlclRoaWNrbmVzcyA9IHBhcmFtZXRlcnMuaGFzT3duUHJvcGVydHkoXCJib3JkZXJUaGlja25lc3NcIikgPyBcblx0XHRcdHBhcmFtZXRlcnNbXCJib3JkZXJUaGlja25lc3NcIl0gOiA0O1xuXHRcblx0XHR2YXIgYm9yZGVyQ29sb3IgPSBwYXJhbWV0ZXJzLmhhc093blByb3BlcnR5KFwiYm9yZGVyQ29sb3JcIikgP1xuXHRcdFx0cGFyYW1ldGVyc1tcImJvcmRlckNvbG9yXCJdIDogeyByOjAsIGc6MCwgYjowLCBhOjEuMCB9O1xuXHRcblx0XHR2YXIgYmFja2dyb3VuZENvbG9yID0gcGFyYW1ldGVycy5oYXNPd25Qcm9wZXJ0eShcImJhY2tncm91bmRDb2xvclwiKSA/XG5cdFx0XHRwYXJhbWV0ZXJzW1wiYmFja2dyb3VuZENvbG9yXCJdIDogeyByOjI1NSwgZzoyNTUsIGI6MjU1LCBhOjEuMCB9O1xuXG5cdFx0Ly92YXIgc3ByaXRlQWxpZ25tZW50ID0gVEhSRUUuU3ByaXRlQWxpZ25tZW50LnRvcExlZnQ7XG5cdFx0XG5cdFx0dmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cdFx0Y29udGV4dC5mb250ID0gXCJCb2xkIFwiICsgZm9udHNpemUgKyBcInB4IFwiICsgZm9udGZhY2U7XG4gICAgXG5cdFx0Ly8gZ2V0IHNpemUgZGF0YSAoaGVpZ2h0IGRlcGVuZHMgb25seSBvbiBmb250IHNpemUpXG5cdFx0dmFyIG1ldHJpY3MgPSBjb250ZXh0Lm1lYXN1cmVUZXh0KCBtZXNzYWdlICk7XG5cdFx0dmFyIHRleHRXaWR0aCA9IG1ldHJpY3Mud2lkdGg7XG5cdFxuXHRcdC8vIGJhY2tncm91bmQgY29sb3Jcblx0XHRjb250ZXh0LmZpbGxTdHlsZSAgID0gXCJyZ2JhKFwiICsgYmFja2dyb3VuZENvbG9yLnIgKyBcIixcIiArIGJhY2tncm91bmRDb2xvci5nICsgXCIsXCJcblx0XHRcdFx0XHRcdFx0XHRcdCAgKyBiYWNrZ3JvdW5kQ29sb3IuYiArIFwiLFwiICsgYmFja2dyb3VuZENvbG9yLmEgKyBcIilcIjtcblx0XHQvLyBib3JkZXIgY29sb3Jcblx0XHRjb250ZXh0LnN0cm9rZVN0eWxlID0gXCJyZ2JhKFwiICsgYm9yZGVyQ29sb3IuciArIFwiLFwiICsgYm9yZGVyQ29sb3IuZyArIFwiLFwiXG5cdFx0XHRcdFx0XHRcdFx0XHQgICsgYm9yZGVyQ29sb3IuYiArIFwiLFwiICsgYm9yZGVyQ29sb3IuYSArIFwiKVwiO1xuXG5cdFx0Y29udGV4dC5saW5lV2lkdGggPSBib3JkZXJUaGlja25lc3M7XG5cdFx0dGhpcy5yb3VuZFJlY3QoY29udGV4dCwgYm9yZGVyVGhpY2tuZXNzLzIsIGJvcmRlclRoaWNrbmVzcy8yLCB0ZXh0V2lkdGggKyBib3JkZXJUaGlja25lc3MsIGZvbnRzaXplICogMS40ICsgYm9yZGVyVGhpY2tuZXNzLCA2KTtcblx0XHQvLyAxLjQgaXMgZXh0cmEgaGVpZ2h0IGZhY3RvciBmb3IgdGV4dCBiZWxvdyBiYXNlbGluZTogZyxqLHAscS5cblx0XG5cdFx0Ly8gdGV4dCBjb2xvclxuXHRcdGNvbnRleHQuZmlsbFN0eWxlID0gXCJyZ2JhKDAsIDAsIDAsIDEuMClcIjtcblxuXHRcdGNvbnRleHQuZmlsbFRleHQoIG1lc3NhZ2UsIGJvcmRlclRoaWNrbmVzcywgZm9udHNpemUgKyBib3JkZXJUaGlja25lc3MpO1xuXHRcblx0XHQvLyBjYW52YXMgY29udGVudHMgd2lsbCBiZSB1c2VkIGZvciBhIHRleHR1cmVcblx0XHR2YXIgdGV4dHVyZSA9IG5ldyBUSFJFRS5UZXh0dXJlKGNhbnZhcykgXG5cdFx0dGV4dHVyZS5uZWVkc1VwZGF0ZSA9IHRydWU7XG5cblx0XHR2YXIgc3ByaXRlTWF0ZXJpYWwgPSBuZXcgVEhSRUUuU3ByaXRlTWF0ZXJpYWwoIFxuXHRcdFx0eyBtYXA6IHRleHR1cmUsIHVzZVNjcmVlbkNvb3JkaW5hdGVzOiBmYWxzZSB9ICk7XG5cdFx0dmFyIHNwcml0ZSA9IG5ldyBUSFJFRS5TcHJpdGUoIHNwcml0ZU1hdGVyaWFsICk7XG5cdFx0c3ByaXRlLnNjYWxlLnNldCgyMCwyMCwxLjApO1xuXHRcdHJldHVybiBzcHJpdGU7XHRcblx0fSxcblx0cm91bmRSZWN0OmZ1bmN0aW9uKGN0eCwgeCwgeSwgdywgaCwgcikgXG5cdHtcblx0ICAgIGN0eC5iZWdpblBhdGgoKTtcblx0ICAgIGN0eC5tb3ZlVG8oeCtyLCB5KTtcblx0ICAgIGN0eC5saW5lVG8oeCt3LXIsIHkpO1xuXHQgICAgY3R4LnF1YWRyYXRpY0N1cnZlVG8oeCt3LCB5LCB4K3csIHkrcik7XG5cdCAgICBjdHgubGluZVRvKHgrdywgeStoLXIpO1xuXHQgICAgY3R4LnF1YWRyYXRpY0N1cnZlVG8oeCt3LCB5K2gsIHgrdy1yLCB5K2gpO1xuXHQgICAgY3R4LmxpbmVUbyh4K3IsIHkraCk7XG5cdCAgICBjdHgucXVhZHJhdGljQ3VydmVUbyh4LCB5K2gsIHgsIHkraC1yKTtcblx0ICAgIGN0eC5saW5lVG8oeCwgeStyKTtcblx0ICAgIGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKHgsIHksIHgrciwgeSk7XG5cdCAgICBjdHguY2xvc2VQYXRoKCk7XG5cdCAgICBjdHguZmlsbCgpO1xuXHRcdGN0eC5zdHJva2UoKTsgICBcblx0fVxufVxubW9kdWxlLmV4cG9ydHM9TW9kIiwidmFyIFRIUiA9IHJlcXVpcmUoJy4vdGhyZWUubWluLm5vZGUuanMnKTtcblxuXG52YXIgQ29udHJvbGxlciA9IHtcblx0VDpmdW5jdGlvbigpe1xuXHRcdGlmKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKXtcblx0XHRcdC8vY29uc29sZS5sb2coJ3RoaXMnKTtcblx0XHRcdHJldHVybiBUSFJcblx0XG5cdFx0fWVsc2V7XG5cdFx0XHRyZXR1cm4gVEhSRUVcblx0XHR9XG5cdH0sXG5cdFxuXHROZXR3b3JrQWN0b3IgOiBmdW5jdGlvbihTLCBzb2NrZXQsIG9uQWN0KXtcblx0XHRcblx0XHR2YXIgbWFwID0gQ29udHJvbGxlci5Db250cm9sbGVyc0FjdGlvbk1hcCgpXG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHNvY2tldC5vbigncGxheWVyX2NvbnRyb2xzX29uJywgZnVuY3Rpb24oZGF0YSl7XG5cdFx0XHRjb25zb2xlLmxvZygnb2sgcmVjdicsIGRhdGEpXG5cdFx0XHR2YXIgYWN0b3JfbG9naW4gPSBkYXRhLmxvZ2luXG5cdFx0XHR2YXIgYWN0aW9uID0gZGF0YS5hY3Rpb247XG5cdFx0XHRzZWxmLmFjdChTLCBhY3Rpb24sIHRydWUsIGFjdG9yX2xvZ2luKVxuXHRcdFxuXHRcdH0pXG5cdFxuXHRcdHNvY2tldC5vbigncGxheWVyX2NvbnRyb2xzX29mZicsIGZ1bmN0aW9uKGRhdGEpe1xuXHRcdFx0Y29uc29sZS5sb2coJ29rIHJlY3YnLCBkYXRhKVxuXHRcdFx0dmFyIGFjdG9yX2xvZ2luID0gZGF0YS5sb2dpblxuXHRcdFx0dmFyIGFjdGlvbiA9IGRhdGEuYWN0aW9uO1xuXHRcdFx0c2VsZi5hY3QoUywgYWN0aW9uLCBmYWxzZSwgYWN0b3JfbG9naW4pXG5cdFx0XG5cdFx0fSlcblx0XHR0aGlzLnJ1biA9IGZ1bmN0aW9uKCl7XG5cdFx0XHQvLyBubyBuZWVkIHRvIGJvdGhlciAtIGV2ZW50IHN0eWxlXG5cdFx0fVxuXHRcdHRoaXMuYWN0PWZ1bmN0aW9uKFcsIGFjdGlvbiwgaXNfb24sIGFjdG9yKXtcblx0XHRcdC8vdmFyIEMgPSBXLm1lc2hlc1sgVy5hY3RvcnNbYWN0b3JdLmNvbnRyb2wub2JqZWN0X2d1aWQgXVxuXHRcdFx0dmFyIF9hID0gbWFwW2FjdGlvbi50eXBlXS5hY3QoUywgYWN0aW9uLCBpc19vbiwgYWN0b3IsIG9uQWN0KTtcblx0XHRcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdExvY2FsSW5wdXRBY3RvciA6IGZ1bmN0aW9uKFcsIHNvY2tldCl7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHNlbGYuV29ybGQgPSBXO1xuXHRcdHZhciBtYXAgPSBDb250cm9sbGVyLkNvbnRyb2xsZXJzQWN0aW9uTWFwKClcblx0XHR2YXIgYWN0b3IgPSBXLmxvZ2luO1xuXHRcdFxuXHRcdC8vc2VsZi5hY3Rvcl9sb2dpbiA9IGFjdG9yX2xvZ2luXG5cdFx0c2VsZi5fZGVmYXVsdF9hY3Rpb25zPXtcblx0XHRcdDY1OiB7dHlwZToncm90YXRlJywgYXhpczoneScsZGlyOicrJ30sXG5cdFx0XHQ2ODoge3R5cGU6J3JvdGF0ZScsIGF4aXM6J3knLGRpcjonLSd9LFxuXHRcdFxuXHRcdFx0ODc6IHt0eXBlOidyb3RhdGUnLCBheGlzOid4JyxkaXI6Jy0nfSxcblx0XHRcdDgzOiB7dHlwZToncm90YXRlJywgYXhpczoneCcsZGlyOicrJ30sXG5cdFx0XG5cdFx0XHQ5MDoge3R5cGU6J3JvdGF0ZScsIGF4aXM6J3onLGRpcjonKyd9LFxuXHRcdFx0Njc6IHt0eXBlOidyb3RhdGUnLCBheGlzOid6JyxkaXI6Jy0nfSxcblx0XHRcblx0XHRcdDc5OiB7dHlwZToncm90YXRlYycsIGF4aXM6J3gnLGRpcjonKyd9LFxuXHRcdFx0ODA6IHt0eXBlOidyb3RhdGVjJywgYXhpczoneCcsZGlyOictJ30sXG5cdFx0XG5cdFx0XHQ3Mzoge3R5cGU6J3JvdGF0ZWMnLCBheGlzOid5JyxkaXI6JysnfSxcblx0XHRcdDc1OiB7dHlwZToncm90YXRlYycsIGF4aXM6J3knLGRpcjonLSd9LFxuXHRcdFxuXHRcdFx0Mzg6IHt0eXBlOidtb3ZlJywgYXhpczoneicsZGlyOictJ30sXG5cdFx0XHQ0MDoge3R5cGU6J21vdmUnLCBheGlzOid6JyxkaXI6JysnfSxcblx0XHRcblx0XHRcdCdsbW91c2UnOnsndHlwZSc6ICdzaG9vdF9wcmltYXJ5JywgJ190dXJyZXRfZGlyZWN0aW9uJzogZnVuY3Rpb24odCxrKXtcblx0XHRcdFx0ZGVsZXRlIHRba11cblx0XHRcdFx0Ly8gY29uc29sZS5sb2coXCJ3XCIpXG5cdFx0XHRcdHRbay5zdWJzdHIoMSldID0gVy5tb3VzZV9wcm9qZWN0aW9uX3ZlYy5jbG9uZSgpLnN1YihXLmNvbnRyb2xsYWJsZSgpLnBvc2l0aW9uLmNsb25lKCkgKVxuXHRcdFx0fX0sXG5cdFx0fVxuXHRcblx0XHRzZWxmLmFjdGlvbnMgPSBzZWxmLl9kZWZhdWx0X2FjdGlvbnM7XG5cdFx0dGhpcy5pbnB1dCA9IGZ1bmN0aW9uKGtleWNvZGUsIHVwX29yX2Rvd24sIG1vZGlmaWVycyl7XG5cdFx0XHQvLyAxLiBTZW5kIHRvIHNlcnZlciBhY3Rpb25cblx0XHRcdHZhciBhY3Rpb24gPSBfLmNsb25lKHNlbGYuYWN0aW9uc1trZXljb2RlXSk7XG5cdFx0XHQvLyBjb25zb2xlLmxvZyhhY3Rpb24pO1xuXHRcdFx0Xy5lYWNoKGFjdGlvbiwgZnVuY3Rpb24oaXRlbSwgayl7XG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKCdhJyk7XG5cdFx0XHRcdGlmIChrWzBdID09ICdfJyl7XG5cdFx0XHRcdFx0aXRlbShhY3Rpb24saylcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC8vY29uc29sZS5sb2coYWN0aW9uKTtcblx0XHRcdGlmICh1cF9vcl9kb3duKXtcblx0XHRcdFx0c29ja2V0LmVtaXQoJ2NvbnRyb2xfb24nLCBhY3Rpb24pO1xuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdHNvY2tldC5lbWl0KCdjb250cm9sX29mZicsIGFjdGlvbik7XG5cdFx0XHRcblx0XHRcdH1cblx0XHRcdC8vIERPTkVcblx0XHRcdC8vIDIuIEFjdCBpdCBsb2NhbGx5XG5cdFx0XHR2YXIgb25BY3QgPSBmdW5jdGlvbigpeyBjb25zb2xlLmxvZygndGhpcyBpcyBrZXlib2FyZCBjb250cm9sbGVyIC0gbm8gbmVlZCBpbiBvbkFjdCBoZXJlJyl9XG5cdFx0XHRsb2NhbF9jb250cm9sbGVyID0gbWFwW2FjdGlvbi50eXBlXVxuXHRcdFx0bG9jYWxfY29udHJvbGxlci5hY3Qoc2VsZi5Xb3JsZC5zY2VuZSwgYWN0aW9uLCB1cF9vcl9kb3duLCBhY3Rvciwgb25BY3QpO1xuXHRcdFx0Ly9ET05FXG5cdFx0fVxuXHR9LFxuXG5cblx0Q1BpbG90Q29udHJvbGxlciA6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy50eXBlPSdwaWxvdCc7XG5cdFx0dGhpcy5hY3Rpb25fdHlwZXM9Wydyb3RhdGUnLCAnbW92ZSddXG5cdFx0ZnVuY3Rpb24gZ2V0X2F4aXMoYSl7XG5cdFx0XHRpZihhID09ICd4Jyl7XG5cdFx0XHRcdGF4aXMgPSBuZXcgQ29udHJvbGxlci5UKCkuVmVjdG9yMygxLDAsMClcblx0XHRcdH1cblx0XHRcdGlmKGEgPT0gJ3knKXtcblx0XHRcdFx0YXhpcyA9IG5ldyBDb250cm9sbGVyLlQoKS5WZWN0b3IzKDAsMSwwKVxuXHRcdFx0fVxuXHRcdFx0aWYoYSA9PSAneicpe1xuXHRcdFx0XHRheGlzID0gbmV3IENvbnRyb2xsZXIuVCgpLlZlY3RvcjMoMCwwLDEpXG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gYXhpc1xuXHRcdFxuXHRcdFxuXHRcdH1cblx0XG5cdFx0dGhpcy5hY3QgPSBmdW5jdGlvbihTLCBhY3Rpb24sIGlzX2Rvd24sIGFjdG9yICl7XG5cdFx0XHQvLyBjb25zb2xlLmxvZygnV2F0Jyk7XG5cdFx0XHQvLyBjb25zb2xlLmxvZyhcIm1vdmUgYnlcIiwgYWN0b3IpXG5cdFx0XHQvL2lmIChhY3RvciA9PT0gdW5kZWZpbmVkKXtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhcIk1ZXCIsIFcuYWN0b3JzW1cubG9naW5dLmNvbnRyb2wub2JqZWN0X2d1aWQpXG5cdFx0XHQvL1x0dmFyIEMgPSBTLmNvbnRyb2xsYWJsZSgpXG5cdFx0XHQvL31lbHNle1xuXHRcdFx0dmFyIEMgPSBTLm1lc2hfZm9yKGFjdG9yKVxuXHRcdFx0dmFyIFQgPSBDb250cm9sbGVyLlQoKTtcblx0XHRcdFxuXHRcdFx0XHQvL31cblxuXHRcblxuXHRcblx0XHRcdGlmIChhY3Rpb24udHlwZSA9PSAncm90YXRlJyl7XG5cdFx0XHRcdHZhciBhID0gYWN0aW9uLmRpciA9PSAnKyc/MTotMTtcblx0XHRcblx0XHRcdFx0aWYgKGlzX2Rvd24pe1xuXHRcdFx0XHRcdEMucHV0X29uKFwicm90YXRpb25cIiwgYWN0aW9uLmF4aXMrYWN0aW9uLmRpcilcblx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0Qy5wdXRfb2ZmKFwicm90YXRpb25cIiwgYWN0aW9uLmF4aXMrYWN0aW9uLmRpcilcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKGFjdGlvbi50eXBlID09ICdtb3ZlJyl7XG5cdFx0XG5cdFx0XHRcdHZhciBhID0gYWN0aW9uLmRpciA9PSAnKyc/MTotMTtcblx0XHRcblx0XHRcdFx0dmFyIG0gPSBuZXcgQ29udHJvbGxlci5UKCkuTWF0cml4NCgpXG5cdFx0XHRcdGlmIChpc19kb3duKXtcblx0XHRcdFx0XHRDLnB1dF9vbihcInByb3B1bHNpb25cIiwgYWN0aW9uLmF4aXMgKyBhY3Rpb24uZGlyKVxuXHRcdFx0XHR9ZWxzZXtcblx0XHRcdFx0XHRDLnB1dF9vZmYoXCJwcm9wdWxzaW9uXCIsIGFjdGlvbi5heGlzICsgYWN0aW9uLmRpcilcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcblx0XHRcdC8vaWYgKGFjdGlvbi50eXBlID09ICdyb3RhdGVjJyl7XG5cdFx0XHQvL1x0dmFyIGEgPSBhY3Rpb24uZGlyID09ICcrJz8xOi0xO1xuXHRcdFx0Ly9cdHZhciBhZyA9IGEgKiAwLjE7XG5cdFx0XHQvL1x0dmFyIGF4aXMgPSBnZXRfYXhpcyhhY3Rpb24uYXhpcyk7XG5cdFx0XHQvL1x0dmFyIF9xID0gbmV3IFQuUXVhdGVybmlvbigpO1xuXHRcdFx0Ly9cdF9xLnNldEZyb21BeGlzQW5nbGUoIGF4aXMsIGFnICk7XG5cdFx0XHQvL1x0Vy5jYW1lcmEucXVhdGVybmlvbi5tdWx0aXBseSggX3EgKTtcblx0XHRcdC8vXHRXLnNldENhbWVyYSgpO1xuXHRcdFx0Ly99XG5cdFx0fVxuXHRcdC8vIHJldHVybiB0aGlzO1xuXHRcblx0fSxcblxuXG5cdGJhc2ljQXV0b1BpbG90QWN0b3I6ZnVuY3Rpb24gKFMsIGlkLCBvaWQpe1xuXHRcdHRoaXMudGFyZ2V0cyA9IFtcIm9yYml0X29iamVjdFwiLCBcImNsb3NlX3RvX29iamVjdFwiXTtcblx0XHR0aGlzLmRlZmF1bHRfZGlzdGFuY2UgPSAyMDBcblx0XHR0aGlzLmdldF9mb2VzID0gZnVuY3Rpb24oKXtcblx0XHRcdHRoaXMuZm9lcyA9IFtdXG5cdFx0XHRmb3IgKHZhciBpID0wOyBpIDwgVy5tZXNoZXMubGVuZ3RoOyBpKyspe1xuXHRcdFx0XHRpZihpICE9IGlkKSBmb2VzLnB1c2goe2lkOmlkLCBvYmo6Vy5tZXNoZXNbaV19KVxuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0IEJhc2ljQnVsbGV0QWN0b3I6ZnVuY3Rpb24oUywgaWQsIGNvaWQpeyBcblx0XHQvLyBpZCA9IGlzIG9iamVjdCBpbiB0aGUgd29ybGQgY29udHJvbGxhYmxlIGJ5IHRoaXMgYWN0b3Jcblx0XHQvLyBjb2lkICBNVVNUIEJFIGFuIG9iamVjdCwgd2hvIHNob290IHRoaXMgYnVsbGV0XG5cdFx0Ly92YXIgUyA9IFcuc2NlbmVcblx0XHR0aGlzLm5hbWUgPSBcIkJhc2ljX2FjdG9yXCIgKyAocGVyZm9ybWFuY2Uubm93KCkpXG5cdFx0Ly8gdGhpcy5XO1xuXHRcdHRoaXMub2lkID0gaWRcblx0XHR0aGlzLmNvaWQgPSBjb2lkXG5cdFx0Ly8gY29uc29sZS5sb2coaWQpO1xuXHRcdHRoaXMubXlfbWVzaCA9IFMubWVzaGVzW2lkXVxuXHRcdC8vY29uc29sZS5sb2coXCJNWSBNRVNIXCIsIHRoaXMubXlfbWVzaCwgaWQpXG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdC8vIGNvbnNvbGUubG9nKFcubWVzaGVzLCBpZCwgVy5tZXNoZXMubGVuZ3RoKVxuXHRcdHZhciB0b3RhbF90aW1lX2luX3NwYWNlID0gMDtcblx0XHR2YXIgX3Bvc3NpYmxlX3RhcmdldHMgPSB7fTtcblx0XHR2YXIgVCA9IENvbnRyb2xsZXIuVCgpO1xuXHRcblx0XHR0aGlzLnJ1biA9IGZ1bmN0aW9uKHRpbWVfbGVmdCl7XG5cdFx0XHR0b3RhbF90aW1lX2luX3NwYWNlICs9IHRpbWVfbGVmdFxuXHRcdFx0Ly9jb25zb2xlLmxvZygncnVubmluZycpO1xuXHRcdFx0aWYgKHRvdGFsX3RpbWVfaW5fc3BhY2UgPiAxMCl7XG5cdFx0XHRcdC8vUy5tZXNoZXMuc3BsaWNlKGlkLCAxKVxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKFwicmVtb3ZpbmdcIilcblx0XHRcdFx0aWYoUy50aHJlZV9zY2VuZSl7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnZXZlbiBmcm9tJyk7XG5cdFx0XHRcdFx0Uy50aHJlZV9zY2VuZS5yZW1vdmUoUy5tZXNoZXNbaWRdKVxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coUy50aHJlZV9zY2VuZSlcblx0XHRcdFx0fVxuXHRcdFx0XHRkZWxldGUgUy5tZXNoZXNbaWRdO1xuXHRcdFx0XHRkZWxldGUgUy5hdXRvbWF0aWNfYWN0b3JzW3RoaXMubmFtZV07XG5cdFx0XHR9XG5cdFx0XHR2YXIgdmVsID0gdGhpcy5teV9tZXNoLnZlbC5jbG9uZSgpO1xuXHRcdFx0dmFyIG1wb3MgPSB0aGlzLm15X21lc2gucG9zaXRpb24uY2xvbmUoKTtcblx0XHRcblx0XHRcdHZhciB0aHJlcyA9IDQgKiB0aGlzLm15X21lc2gudmVsLmxlbmd0aCgpO1xuXHRcdFx0dmFyIGluX3RocmVzID0gW107XG5cdFx0XHQvL2NvbnNvbGUubG9nKFwiVEhSZXNcIiwgdGhyZXMpO1xuXHRcdFxuXHRcdFx0Xy5lYWNoKCBTLm1lc2hlcywgZnVuY3Rpb24obSxpKSB7XG5cdFx0XHRcdGlmKGkgPT09IGlkIHx8IGkgPT09IGNvaWQpIHJldHVybjtcblx0XHRcdFx0aWYobS5pc19ub3RfY29sbGlkYWJsZSkgcmV0dXJuO1xuXHRcdFx0XHQvLyB2YXIgbSA9IFcubWVzaGVzW2ldO1xuXHRcdFx0XHR2YXIgbXAgPSAgbS5wb3NpdGlvbi5jbG9uZSgpO1xuXHRcdFx0XHR2YXIgcGQgPSBtcC5zdWIoIG1wb3MgKVxuXHRcdFx0XHR2YXIgYWcgPSBNYXRoLmFjb3MocGQuZG90KHZlbCkvIHZlbC5sZW5ndGgoKSAvIHBkLmxlbmd0aCgpKSAvLyDRg9Cz0L7QuyDQvNC10LbQtNGDINC90LDQv9GA0LDQstC70LXQvdC40LXQvCDQtNCy0LjQttC10L3QuNGPINC4INGG0LXQvdGC0YDQvtC8INC+0LHRitC10LrRgtCwXG5cdFx0XHRcdGlmIChhZyA8IE1hdGguUEkvMTYpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhcIkhIXCIsIGksIGFnLCBNYXRoLlBJLzgpO1xuXHRcdFx0XHRcblx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhcImlkIHZlZm9yZVwiLCBcdGlkLCApO1xuXHRcdFx0XHRcdHZhciBzdWIgPSBzZWxmLm15X21lc2gucG9zaXRpb24uY2xvbmUoKS5zdWIoIG1wICk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0dmFyIGRpc3QgPSBzdWIubGVuZ3RoKClcblx0XHRcdFx0XHRpZiggZGlzdCA8IHRocmVzKXtcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coXCJPS0VcIik7XG5cdFx0XHRcdFx0XHRpZiggaW5fdGhyZXMuaW5kZXhPZiggaSApID09PSAtMSApe1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdGluX3RocmVzLnB1c2goaSkgLy8gQWRkIG1lc2ggaW5kZXhcblx0XHRcdFx0XHRcdFx0dGFyZ2V0ID0ge2xhc3RfcG9pbnQgOm1wb3MuY2xvbmUoKSxcblx0XHRcdFx0XHRcdFx0XHRcdCAgbGFzdF9hbmdsZSA6IGFnLFxuXHRcdFx0XHRcdFx0XHRcdFx0ICBsYXN0X2Rpc3RhbmNlIDogZGlzdCxcblx0XHRcdFx0XHRcdFx0XHRcdCAgYW5nbGVfcmFpc2UgOiAwLFxuXHRcdFx0XHRcdFx0XHRcdFx0ICBkaXN0YW5jZV9yYWlzZSA6MCxcblx0XHRcdFx0XHRcdFx0XHRcdCAgZGlzdGFuY2Vfc2hvcnRlbnMgOiAwLFxuXHRcdFx0XHRcdFx0XHRcdFx0ICBhbmdsZV9sb3dlcnMgOiAwLFxuXHRcdFx0XHRcdFx0XHRcdCAgXHQgIGlkIDogaX1cblx0XHRcdFx0XHRcdFx0X3Bvc3NpYmxlX3RhcmdldHNbaV0gPSB0YXJnZXRcblx0XHRcdFx0XHRcdH0vL2Vsc2V7fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcblx0XHRcdFx0fVxuXHRcdFx0XHQvL2Vsc2V7XG5cdFx0XHRcdGlmKGkgaW4gX3Bvc3NpYmxlX3RhcmdldHMpe1xuXHRcdFx0XHRcdC8vINCj0LPQvtC7INCx0YvQuyDQvtGB0YLRgNGL0LkgLSDRgdGC0LDQuyDRgtGD0L/QvtC5XG5cdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coXCJoZXJlIVwiLGkpO1xuXHRcdFx0XHRcdC8vINCd0LDQtNC+INC/0YDQvtCy0LXRgNC40YLRjCwg0L3QtSDQv9C10YDQtdGB0LXQutCw0LXRgiDQu9C4INC+0YLRgNC10LfQvtC6IC0g0L/RgNC+0YjQu9GL0LUg0LrQvtC+0YDQtNC40L3QsNGC0YsgLSDRgtC10LrRg9GJ0LjQtSDQutC+0L7RgNC00LjQvdCw0YLRiyDQvdCw0Ygg0LzQtdGIXG5cdFx0XHRcdFx0dmFyIGRpcmVjdGlvbiA9IG1wb3MuY2xvbmUoKS5zdWIoIF9wb3NzaWJsZV90YXJnZXRzW2ldLmxhc3RfcG9pbnQpXG5cdFx0XHRcdFx0dmFyIHJheSA9IG5ldyBULlJheWNhc3RlcihfcG9zc2libGVfdGFyZ2V0c1tpXS5sYXN0X3BvaW50LCBkaXJlY3Rpb24uY2xvbmUoKS5ub3JtYWxpemUoKSApXG5cdFx0XHRcdFx0dmFyIGlzciA9IHJheS5pbnRlcnNlY3RPYmplY3RzKFttXSlcblx0XHRcdFx0XHRpZiAoaXNyLmxlbmd0aCA+IDAgJiYgaXNyWzBdLmRpc3RhbmNlIDwgZGlyZWN0aW9uLmxlbmd0aCgpICl7XG5cdFx0XHRcdFx0XHQvL2ZvciggdmFyIGluZGV4ID0wOyBpbmRleDxpc3IubGVuZ3RoOyBpbmRleCsrKXtcblx0XHRcdFx0XHRcdC8vXHRjb25zb2xlLmxvZyhcIkhFUkVcIiwgaXNyW2luZGV4XS5kaXN0YW5jZSwgZGlyZWN0aW9uLmxlbmd0aCgpKVxuXHRcdFx0XHRcdFx0Ly8vfVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ2hpdCcpXG5cdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhcIkVORFwiLCBpc3JbMF0ucG9pbnQpO1xuXHRcdFx0XHRcdFx0bS53b3JsZFRvTG9jYWwoaXNyWzBdLnBvaW50KSAvLyDQotC10L/QtdGA0Ywg0Y3RgtC+INC/0LvQtdGH0L4g0YPQtNCw0YDQsFxuXHRcdFx0XHRcdFx0dmFyIGltcHVsc2UgPSB2ZWwuY2xvbmUoKS5tdWx0aXBseVNjYWxhcihzZWxmLm15X21lc2gubWFzcylcblx0XHRcdFx0XHRcdHZhciBheGlzID0gbmV3IFQuVmVjdG9yMygpLmNyb3NzVmVjdG9ycyhpc3JbMF0ucG9pbnQsIGltcHVsc2UpXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHR2YXIgYWcgPSBNYXRoLmFjb3MoaXNyWzBdLnBvaW50LmNsb25lKCkuZG90KGltcHVsc2UpIC8gaW1wdWxzZS5sZW5ndGgoKSAvIGlzclswXS5wb2ludC5sZW5ndGgoKSApXG5cdFx0XHRcdFx0XHQvLyDQotC10L/QtdGA0Ywg0Y3RgtC+INCy0YDQsNGJ0LXQvdC40LUg0L3QsNC00L4g0YDQsNC30LHQuNGC0Ywg0L/QviDQvtGB0Y/QvFxuXHRcdFx0XHRcdFx0dmFyIG1hdCA9IG5ldyBULk1hdHJpeDQoKS5tYWtlUm90YXRpb25BeGlzKGF4aXMubm9ybWFsaXplKCksIGFnKVxuXHRcdFx0XHRcdFx0dmFyIGV1bCA9IG5ldyBULkV1bGVyKClcblx0XHRcdFx0XHRcdGV1bC5zZXRGcm9tUm90YXRpb25NYXRyaXgobWF0LCBcIlhZWlwiKVxuXHRcdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coaSwgZXVsKVxuXHRcdFx0XHRcdFx0dmFyIGF2ZWwgPSBuZXcgVC5WZWN0b3IzKCk7XG5cdFx0XHRcdFx0XHRhdmVsLnggPSBldWwueDtcblx0XHRcdFx0XHRcdGF2ZWwueSA9IGV1bC55O1xuXHRcdFx0XHRcdFx0YXZlbC56ID0gZXVsLno7XG5cdFx0XHRcdFx0XHR2YXIgY2sgPSBpc3JbMF0ucG9pbnQubGVuZ3RoKCkgKiBNYXRoLnNpbihhZyAtIE1hdGguUEkvMilcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKHRoaXMubXlfbWVzaC5tYXNzIC8gbS5tYXNzICogKGNrICogY2sgKSk7XG5cdFx0XHRcdFx0XHRhdmVsLm11bHRpcGx5U2NhbGFyKHNlbGYubXlfbWVzaC5tYXNzL20ubWFzcyAqIE1hdGguYWJzKGNrKSlcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdC8vINCd0LUg0YPRh9C40YLRi9Cy0LDRjiDQvNCw0YHRgdGDINC4INC/0LvQtdGH0L4uLi4gXG5cdFx0XHRcdFx0XHR2YXIgbWF2ZWwgPSBTLm1lc2hlc1tpXS5hdmVsXG5cdFx0XHRcdFx0XHRpZiAoISBtYXZlbCApe2F2ZWwgPSBuZXcgVC5WZWN0b3IzKDAsMCwwKX1cblx0XHRcdFx0XHRcdG1hdmVsLnggKz0gYXZlbC54XG5cdFx0XHRcdFx0XHRtYXZlbC55ICs9IGF2ZWwueVxuXHRcdFx0XHRcdFx0bWF2ZWwueiArPSBhdmVsLno7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhtYXZlbC54LCBtYXZlbC55LCBtYXZlbC56KVxuXHRcdFx0XHRcdFx0Uy5tZXNoZXNbaV0uYXZlbCA9IG1hdmVsO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0YWRkX3ZlbCA9IGltcHVsc2UubXVsdGlwbHlTY2FsYXIoIDEvIG0ubWFzcyk7XG5cdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhhZGRfdmVsKVxuXHRcdFx0XHRcdFx0Ly8g0KPQsdGA0LDRgtGMINC/0L7QutCwINGB0LrQvtGA0L7RgdGC0Yxcblx0XHRcdFx0XHRcdFMubWVzaGVzW2ldLnZlbC5hZGQoYWRkX3ZlbCk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKFwiRU5EIExPQ0FMXCIsIGlzclswXS5wb2ludCk7XG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdva2UsIHdlIHNob290IGl0OicsIGkpXG5cdFx0XHRcdFx0XHQvLyBOb3cgd2Ugd2lsbCBqdXN0IHJlbW92ZSBvYmplY3QgZnJvbSBzY2VuZSB3aXRoIHRoZSBidWxsZXRcblx0XHRcdFx0XHRcdC8vVy5zY2VuZS5yZW1vdmUoVy5tZXNoZXNbaV0pXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRTLnRocmVlX3NjZW5lLnJlbW92ZShTLm1lc2hlc1tpZF0pIC8vINGD0LTRj9C70Y/QtdC8INGP0LTRgNC+INC40Lcg0YHRhtC10L3Ri1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0Ly9XLm1lc2hlcy5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0XHRkZWxldGUgX3Bvc3NpYmxlX3RhcmdldHNbaV0gLy8gLi4uINC40Lcg0LLQvtC30LzQvtC20L3Ri9GFINGG0LXQu9C10Lkg0YPQtNCw0LvRj9C10Lwg0Y3RgtC+0YIg0LzQtdGIXG5cdFx0XHRcdFx0XHRkZWxldGUgUy5tZXNoZXNbIGlkIF07IC8vIC4uLiDQuNC3INC80LXRiNC10Llcblx0XHRcdFx0XHRcdGRlbGV0ZSBTLmFjdG9yc1tzZWxmLm5hbWVdOyAvLyAuLi4g0KPQtNCw0LvRj9C10Lwg0Y3RgtC+0LPQviDQsNC60YLQvtGA0LAgLSDQsdC+0LvRjNGI0LUg0L3QtSDQt9Cw0LPRgNGD0LfQuNGC0YHRjyDRjdGC0LAg0YTRg9C90LrRhtC40Y9cblx0XHRcdFx0XHRcdC8vIGJsYS5ibGEgPSAxXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vfVxuXHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKCBhZywgTWF0aC5QSS84KTtcblx0XHRcdFx0XG5cdFx0XHRcdH1cblx0XHRcdFxuXHRcdFx0fSlcblx0XHRcdC8vYmxhLmJhbCArPTFcblx0XHRcdC8vY29uc29sZS5sb2coYmxhKVxuXHRcdFxuXHRcdFxuXHRcdFx0Ly8gY29uc29sZS5sb2codG90YWxfdGltZV9pbl9zcGFjZSAsVy5tZXNoZXMubGVuZ3RoLCBXLmFjdG9ycylcblx0XHR9XG5cdFxuXHRcblx0fSxcblx0Q1R1cnJldENvbnRyb2xsZXIgOiBmdW5jdGlvbigpe1xuXHRcdHRoaXMuYWN0ID0gZnVuY3Rpb24oUywgYWN0aW9uLCBpc19kb3duLCBhY3RvciApe1xuXHRcdFx0aWYgKGFjdGlvbi50eXBlID09J3Nob290X3ByaW1hcnknKXtcblx0XHRcdFx0Ly8gdmFyIHdlYXBvbiA9IEMud2VhcG9uc1swXTtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhcInNob3QgYnlcIiwgYWN0b3IpXG5cdFx0XHRcdHZhciBUID0gQ29udHJvbGxlci5UKCk7XG5cdFx0XHRcdC8vaWYgKGFjdG9yID09PSB1bmRlZmluZWQpe1xuXHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKFwiTVlcIiwgVy5nZXRfY3VycmVudF9hY3RvcigpLmNvbnRyb2wub2JqZWN0X2d1aWQpXG5cdFx0XHRcdC8vXHR2YXIgQyA9IFMubWVzaGVzWyBXLmdldF9hY3RvcihhY3RvcikuY29udHJvbC5vYmplY3RfZ3VpZCBdXG5cdFx0XHRcdC8vfWVsc2V7XG5cdFx0XHRcdHZhciBDID0gUy5tZXNoX2ZvcihhY3Rvcilcblx0XHRcdFx0XG5cdFx0XHRcdFx0Ly99XG5cdFx0XHRcdGlmIChhY3Rpb24udHVycmV0X2RpcmVjdGlvbiBpbnN0YW5jZW9mIFQgLlZlY3RvcjMpe1xuXHRcdFx0XHRcdHZhciBtcHYgPSBhY3Rpb24udHVycmV0X2RpcmVjdGlvblxuXHRcdFx0XHRcblx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0dmFyIG1wdiA9IG5ldyBULlZlY3RvcjMoYWN0aW9uLnR1cnJldF9kaXJlY3Rpb24ueCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGFjdGlvbi50dXJyZXRfZGlyZWN0aW9uLnksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRhY3Rpb24udHVycmV0X2RpcmVjdGlvbi56KVxuXHRcdFx0XHR9XG5cdFx0XHRcdG1wdi5tdWx0aXBseVNjYWxhcigwLjUwMDApO1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdUSCcsIENvbnRyb2xsZXIuVCgpKVxuXHRcdFx0XHR2YXIgY3ViZUdlb21ldHJ5ID0gbmV3IFQuQ3ViZUdlb21ldHJ5KDEsMSwxLDEsMSwxKTtcblx0XHRcdFx0dmFyIHdpcmVNYXRlcmlhbCA9IG5ldyBULk1lc2hCYXNpY01hdGVyaWFsKCB7IGNvbG9yOiAweDAwZmYwMCwgd2lyZWZyYW1lOnRydWUgfSApO1xuXHRcdFx0XHR2YXIgYnVsbGV0ID0gbmV3IFQuTWVzaCggY3ViZUdlb21ldHJ5LCB3aXJlTWF0ZXJpYWwgKTtcblx0XHRcdFx0YnVsbGV0LnBvcyA9IG5ldyBULlZlY3RvcjMoKVxuXHRcdFx0XHRidWxsZXQucG9zID0gQy5wb3NpdGlvbi5jbG9uZSgpXG5cdFx0XHRcblx0XHRcdFx0YnVsbGV0Lmhhc19lbmdpbmVzID0gZmFsc2U7XG5cdFx0XHRcdGJ1bGxldC5pc19ub3RfY29sbGlkYWJsZSA9IHRydWU7XG5cdFx0XHRcdGJ1bGxldC52ZWwgPSBtcHYvLy5tdWx0aXBseVNjYWxhcigwLjEwKTtcblx0XHRcdFx0YnVsbGV0Lm1hc3MgPSAxO1xuXHRcdFx0XHRpZiAoIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKXtcblx0XHRcdFx0XHRTLnRocmVlX3NjZW5lLmFkZCggYnVsbGV0ICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Ql9HVUlEID0gVXRpbHMubWFrZV9ndWlkKClcblx0XHRcdFx0Uy5tZXNoZXNbQl9HVUlEXSA9ICBidWxsZXQgO1xuXHRcdFx0XG5cdFx0XHRcdHZhciBidWxsZXRfYWN0b3IgPSBuZXcgQ29udHJvbGxlci5CYXNpY0J1bGxldEFjdG9yKFMsIEJfR1VJRCwgQy5HVUlEKVxuXHRcdFx0XHRTLmF1dG9tYXRpY19hY3RvcnNbYnVsbGV0X2FjdG9yLm5hbWVdID0gYnVsbGV0X2FjdG9yO1xuXHRcdFx0XHQvLyBjb25zb2xlLmxvZyhXLnNjZW5lLmF1dG9tYXRpY19hY3RvcnMpO1xuXHRcdFx0XG5cdFx0XHRcblx0XHRcdH1cblx0XHR9XG5cdFx0Ly8gcmV0dXJuIHRoaXM7XG5cdFxuXHR9LFxuXHRDb250cm9sbGVyc0FjdGlvbk1hcDogZnVuY3Rpb24oKXtcblx0XHRpZiAodGhpcy5fQ29udHJvbGxlcnNBY3Rpb25NYXApe1xuXHRcdFx0cmV0dXJuIHRoaXMuX0NvbnRyb2xsZXJzQWN0aW9uTWFwXG5cdFx0fWVsc2V7XG5cdFx0XHR2YXIgUGlsb3RDb250cm9sbGVyID0gbmV3IENvbnRyb2xsZXIuQ1BpbG90Q29udHJvbGxlcigpO1xuXHRcdFx0dmFyIFR1cnJldENvbnRyb2xsZXIgPSBuZXcgQ29udHJvbGxlci5DVHVycmV0Q29udHJvbGxlcigpXG5cdFx0XHR0aGlzLl9Db250cm9sbGVyc0FjdGlvbk1hcCA9IHtcblx0XHRcdFx0J21vdmUnOiBQaWxvdENvbnRyb2xsZXIsXG5cdFx0XHRcdCdyb3RhdGUnOlBpbG90Q29udHJvbGxlcixcblx0XHRcdFx0J3JvdGF0ZWMnOiBQaWxvdENvbnRyb2xsZXIsXG5cdFx0XHRcdCdzaG9vdF9wcmltYXJ5JzogVHVycmV0Q29udHJvbGxlclxuXHRcdFx0fSBcdFx0XG5cdFx0XHRyZXR1cm4gdGhpcy5fQ29udHJvbGxlcnNBY3Rpb25NYXA7XG5cdFx0XHRcblx0XHR9XG5cdH1cbn1cbm1vZHVsZS5leHBvcnRzID0gQ29udHJvbGxlclxuLy92YXIgVHVycmV0Q29udHJvbGxlciA9IG5ldyBDVHVycmV0Q29udHJvbGxlcigpXG4vL0NQaWxvdENvbnRyb2xsZXIucHJvdG90eXBlID0ge2NvbnN0cnVjdG9yOkNQaWxvdENvbnRyb2xsZXJ9XG4vL3ZhciBQaWxvdENvbnRyb2xsZXIgPSBuZXcgQ1BpbG90Q29udHJvbGxlcigpO1xuXG4vL2NvbnNvbGUubG9nKFR1cnJldENvbnRyb2xsZXIuYWN0LCBQaWxvdENvbnRyb2xsZXIuYWN0KVxuIixudWxsLCJ2YXIgZnMgICAgPSByZXF1aXJlKCdmcycpO1xudmFyIHUgPSByZXF1aXJlKCcuL3V0aWxzLmpzJyk7XG52YXIgVEhSID0gcmVxdWlyZSgnLi90aHJlZS5taW4ubm9kZS5qcycpO1xuXG52YXIgXyAgICAgPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG5cbnZhciBTY2VuZSA9IHtkZXNjcmlwdGlvbjogXCJTY2VuZSByb3V0aW5lc1wifVxuXG5pZih0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyl7XG5cdFNjZW5lLlRIUkVFID0gVEhSIC8vIFNhdmVpbmcgVEhSRUUuanMgYXMgcGFydCBvZiBzY2VuZSAtIHRoaXMgc3RlcCBjb3VsZCBiZSBkb25lIG9uIGEgY2VydGFpbiBwbGF0Zm9ybVxuXHRTY2VuZS5kb19wcmVwYXJlX3JlbmRlcmluZyA9IGZhbHNlXG5cdFNjZW5lLmFqYXhfbG9hZF9tb2RlbHMgPSBmYWxzZVxuXHRcbn1lbHNle1xuXHRTY2VuZS5USFJFRSA9IFRIUkVFXG5cdFNjZW5lLmRvX3ByZXBhcmVfcmVuZGVyaW5nID0gdHJ1ZVxuXHRTY2VuZS5hamF4X2xvYWRfbW9kZWxzID0gdHJ1ZVxufVxuXG5cblxuXG5TY2VuZS5tZXNoX2ZvciA9IGZ1bmN0aW9uKGFjdG9yKXtcblx0Ly9jb25zb2xlLmxvZyhcIj4+PlwiLHRoaXMubWVzaGVzKClbdGhpcy5zY2VuZS5hY3RvcnNbYWN0b3JdLmNvbnRyb2wub2JqZWN0X2d1aWRdKTtcblx0cmV0dXJuIHRoaXMubWVzaGVzW3RoaXMuYWN0b3JzW2FjdG9yXS5jb250cm9sLm9iamVjdF9ndWlkXVxufVxuU2NlbmUuY3JlYXRlID0gZnVuY3Rpb24oKXtcblx0dGhpcy5pc19sb2FkZWQgPSBmYWxzZVxuXHRcblx0cmV0dXJuIHRoaXM7XG59XG4vKmZ1bmN0aW9uKCl7XG5cdHZhciBvYmplY3RzX2NvdW50ID0gMTA7XG5cdHZhciBvYmpzID0gW11cblx0dmFyIHZlY3RvcnMgPSBbJ3BvcycsICd2ZWwnLCAnYWNjJywgICdyb3QnLCAgICAnYXZlbCcsICdhYWNjJ107XG5cdHZhciBsaW1pdHMgID0gWzEwMCwgMiwgICAgICAgIDAuMSwgICAgIE1hdGguUEksIDAgICAgLCAgIDBdO1xuXHRcblx0XG5cdGZvcih2YXIgYyA9MDsgYzwgb2JqZWN0c19jb3VudDsgYysrKXtcdFxuXHRcdHZhciBvYmogPSB7XG5cdFx0XHRcInBoeXNpY2FsXCI6e30sXG5cdFx0XHRcImNhbWVyYXNcIjp7XG5cdFx0XHRcdFx0XCJmcm9udFwiOntcblx0XHRcdFx0XHRcdFwibGFiZWxcIjpcIm1haW5cIixcblx0XHRcdFx0XHRcdFwicG9zaXRpb25cIjogWzAsMCwwXSxcblx0XHRcdFx0XHRcdFwiZGlyZWN0aW9uXCI6WzAsMCwtMV1cblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XCJiYWNrXCI6e1xuXHRcdFx0XHRcdFx0XHRcImxhYmVsXCI6XCJtYWluXCIsXG5cdFx0XHRcdFx0XHRcdFwicG9zaXRpb25cIjogWzAsMCwyXSxcblx0XHRcdFx0XHRcdFx0XCJkaXJlY3Rpb25cIjpbMCwwLDFdXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFxuXHRcdFx0fSxcblx0XHRcdCdlbmdpbmVzJzp7XG5cdFx0XHRcdCdyb3RhdGlvbic6e1xuXHRcdFx0XHRcdCd4Kyc6MSwneC0nOjEsXG5cdFx0XHRcdFx0J3krJzoxLCd5LSc6MSxcblx0XHRcdFx0XHQneisnOjEsJ3otJzoxXG5cdFx0XHRcdH0sXG5cdFx0XHRcdCdwcm9wdWxzaW9uJzp7XG5cdFx0XHRcdFx0J3grJzoxLCd4LSc6MSxcblx0XHRcdFx0XHQneSsnOjEsJ3ktJzoxLFxuXHRcdFx0XHRcdCd6Kyc6MTAsJ3otJzoxMFxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0XG5cdFx0XHQnbWFzcyc6IDEwMDAwLFxuXHRcdFx0XG5cdFx0XHRcblx0XHRcdFxuXHRcdFx0XG5cdFx0XHQvL1wiZGlyZWN0aW9uXCI6WzEsMCwwXSxcblx0XHRcdFwibW9kZWxcIjogXCIvbW9kZWxzL1N0YXJDcnVpc2VyLmpzXCJcblx0XHR9XG5cdFx0aWYgKGMgPT0gMCkgb2JqLmRpcmVjdGlvbiA9IFswLDAsLTFdXG5cdFx0ZWxzZSBvYmouZGlyZWN0aW9uID0gWzAsMCwtMV1cblx0XHRcblx0XHRmb3IgKHZhciBqID0wOyBqIDwgdmVjdG9ycy5sZW5ndGg7IGorKyl7XG5cdFx0XHR2YXIgdiA9IHZlY3RvcnNbal1cblx0XHRcdHZhciB2diA9IFtdXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IDM7IGkrKyl7XG5cdFx0XHRcdHZ2W2ldID0gIChNYXRoLnJhbmRvbSgpICogbGltaXRzW2pdKSAtIGxpbWl0c1tqXS8yXG5cdFx0XHR9XG5cdFx0XHRvYmoucGh5c2ljYWxbdl0gPSB2djtcblx0XHR9XG5cdFx0XG5cdFx0b2Jqcy5wdXNoKG9iailcblx0fVxuXHQvLyBBZGQgcGl2b3QgY3ViZXNcblx0cG9zZXMgPSBbWzIwLDIwLDIwXSwgWzIwLC0yMCwyMF0sIFstMjAsMjAsMjBdLCBbLTIwLC0yMCwyMF0sXG5cdFx0XHQgWzIwLDIwLC0yMF0sIFsyMCwtMjAsLTIwXSwgWy0yMCwyMCwtMjBdLCBbLTIwLC0yMCwtMjBdLFxuXHQgXVxuXHQgbGltaXRzWzFdPTBcblx0Zm9yKHZhciBjID0wOyBjPCA4OyBjKyspe1x0XG5cdFx0dmFyIG9iaiA9IHtcblx0XHRcdFwicGh5c2ljYWxcIjp7fSxcblx0XHRcdFwiY2FtZXJhc1wiOlxuXHRcdFx0e1xuXHRcdFx0XHRcdFwiZnJvbnRcIjp7XG5cdFx0XHRcdFx0XHRcImxhYmVsXCI6XCJtYWluXCIsXG5cdFx0XHRcdFx0XHRcInBvc2l0aW9uXCI6IFswLDAsMF0sXG5cdFx0XHRcdFx0XHRcImRpcmVjdGlvblwiOlswLDAsLTFdXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFwiYmFja1wiOntcblx0XHRcdFx0XHRcdFx0XCJsYWJlbFwiOlwibWFpblwiLFxuXHRcdFx0XHRcdFx0XHRcInBvc2l0aW9uXCI6IFswLDAsMF0sXG5cdFx0XHRcdFx0XHRcdFwiZGlyZWN0aW9uXCI6WzAsMCwxMF1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XG5cdFx0XHR9LFxuXHRcdFx0XCJkaXJlY3Rpb25cIjpbMSwwLDBdLFxuXHRcdFx0bWFzczoxMDAwMDAwLFxuXHRcdFx0XG5cdFx0XHRcIm1vZGVsXCI6IFwiL21vZGVscy9zcC5qc1wiXG5cdFx0fVxuXHRcdGZvciAodmFyIGogPTE7IGogPCB2ZWN0b3JzLmxlbmd0aDsgaisrKXtcblx0XHRcdHZhciB2ID0gdmVjdG9yc1tqXVxuXHRcdFx0dmFyIHZ2ID0gW11cblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgb2JqZWN0c19jb3VudDsgaSsrKXtcblx0XHRcdFx0dnZbaV0gPSAgKE1hdGgucmFuZG9tKCkgKiBsaW1pdHNbal0pIC0gbGltaXRzW2pdLzJcblx0XHRcdH1cblx0XHRcdG9iai5waHlzaWNhbFt2XSA9IHZ2O1xuXHRcdH1cblx0XHRvYmoucGh5c2ljYWwucG9zID0gcG9zZXNbY11cblx0XHRcblx0XHRvYmpzLnB1c2gob2JqKVxuXHR9XHRcdFxuXHRcblx0dmFyIHNjZW5lID0ge1xuXHRcdFwiYWN0b3JzXCI6e1wiX19cIjp7XG5cdFx0XHRcdFx0IFx0XCJjb250cm9sXCI6IHtcIm9pZFwiOjAsXCJ2cFwiOlwiYmFja1wifVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFwiY29udHJvbGxlcnNcIjp7XG5cdFx0XHRcImZyb250XCI6e1widHlwZXNcIjpbXCJ0dXJyZXRcIiwgXCJsYXVuY2hlclwiLCAncGlsb3QnXSwgXCJjYW1lcmFcIjogXCJmcm9udFwifSxcblx0XHRcdFwiYmFja1wiIDp7XCJ0eXBlc1wiOltcInR1cnJldFwiLCBcImxhdW5jaGVyXCJdLCBcImNhbWVyYVwiOiBcImJhY2tcIn1cblx0XHR9XG5cdFx0XHR9XG5cdFx0XHRcdFxuXHRzY2VuZS5vYmplY3RzID0gb2Jqcztcblx0dGhpcy5fc2NlbmUgPSBzY2VuZVxuXHR0aGlzLmlzX2xvYWRlZCA9IGZhbHNlO1xuXHRyZXR1cm4gdGhpc1xufVxuXHQqL1xuXG5TY2VuZS5jcmVhdGVfZnJvbV93b3JsZCA9IGZ1bmN0aW9uKGdsb2JhbHgsIGdsb2JhbHksIGdsb2JhbHogKXtcblx0Ly8gZ2xvYmFseC15LXogLSBnYWxheHkgY29vcmRzIHdpdGggMSBtZXRlciBhY2N1cmFjeVxuXHR2YXIgY2xvc2VzdF9zY2VuZV93aXRoX2Rpc3RhbmNlID0gdGhpcy5nZXRfY2xvc2VzdF9zY2VuZShnbG9iYWx4LCBnbG9iYWx5LCBnbG9iYWx6KTtcblx0Ly8gaWYgY2xvc2VzdF9zY2VuZSBpcyBub3QgbnVsbCAtIHdlIG11c3QgaW5qZWN0IG9iamVjdCB3aXRoIGFjdG9ycyB0byB0aGF0IHNjZW5lIC0gaXQncyBhbHJlYWR5X2xvYWRlZFxuXHQvLyBlbHNlIC0gV2UgZmluZGluZyBvYmplY3RzIGZvciB0aGF0IHNjZW5lXG5cdFx0XHRcdFxuXHR2YXIgb2JqZWN0c193aXRoaW5fY29vcmRzID0gdGhpcy5nZXRfb2JqZWN0c19pbihnbG9iYWx4LCBnbG9iYWx5LCBnbG9iYWx6KVxuXHRcblx0Ly8gY3JlYXRpbmcgc2NlbmVcblx0XG5cdHRoaXMuX3NjZW5lID0ge2Nvb3JkcyA6WyBnbG9iYWx4LCBnbG9iYWx5LCBnbG9iYWx6IF0sIGFjdG9yczp7fSwgR1VJRDogdS5tYWtlX2d1aWQoKSwgb2JqZWN0czp7fSB9IFxuXHR0aGlzLkdVSUQgPSB0aGlzLl9zY2VuZS5HVUlEO1xuXHRcblx0Ly8gcHJlcGFyZSBhY3RvcnMgLSBhbGwgb2YgdGhlbSB3b3VsZCBjb250cm9sIG9iamVjdF9pZCA9IDAsIHZpZXdwb3J0cyAtIGVhY2ggZm9yIGVhY2hcblx0XG5cdFxuXHQvLyBJbmplY3Rpbmcgb3RoZXIgb2JqZWN0c1xuXHR2YXIgb2JqZWN0cyA9IHt9XG5cdC8vIG9iamVjdHNbZm9yX29iamVjdC5HVUlEXSA9IGZvcl9vYmplY3Q7XG5cdFxuXHRmb3IgKCB2YXIgaSA9IDA7IGkgPCBvYmplY3RzX3dpdGhpbl9jb29yZHMubGVuZ3RoIDsgaSsrICl7XG5cdFx0b2JqZWN0c1sgb2JqZWN0c193aXRoaW5fY29vcmRzW2ldLkdVSUQgXSA9ICAgb2JqZWN0c193aXRoaW5fY29vcmRzW2ldO1xuXHR9XG5cdF8uZXh0ZW5kKHRoaXMuX3NjZW5lLm9iamVjdHMsIG9iamVjdHMpXG5cdFxuXHRyZXR1cm4gdGhpc1xuXHRcbn1cblNjZW5lLmdldF9hY3RvcnMgPSBmdW5jdGlvbigpe1xuXHRyZXR1cm4gdGhpcy5fc2NlbmUuYWN0b3JzXG59XG5TY2VuZS5nZXRfY2xvc2VzdF9zY2VuZSA9IGZ1bmN0aW9uKCl7XG5cdHJldHVybiB1bmRlZmluZWRcbn1cblNjZW5lLmdldF9vYmplY3RzX2luID0gZnVuY3Rpb24oKXtcblx0cmV0dXJuIFtdO1xufVxuU2NlbmUuam9pbl9vYmplY3QgPSBmdW5jdGlvbiggb2JqZWN0ICl7XG5cdHRoaXMuX3NjZW5lLm9iamVjdHNbb2JqZWN0LkdVSURdID0gb2JqZWN0XG59XG5TY2VuZS5qb2luX2FjdG9yID0gZnVuY3Rpb24oIGFjdG9yICl7XG5cdHRoaXMuX3NjZW5lLmFjdG9yc1thY3Rvci5sb2dpbl0gPSBhY3RvclxuXHRcblx0cmV0dXJuIHRoaXNcblx0XG59XG5TY2VuZS5zZXRfZnJvbV9qc29uID0gZnVuY3Rpb24ob2JqZWN0KXtcblx0dGhpcy5fc2NlbmUgPSBvYmplY3Rcblx0dGhpcy5HVUlEID0gb2JqZWN0LkdVSURcbn1cblNjZW5lLmNvbnRyb2xsYWJsZSA9IGZ1bmN0aW9uKGxvZ2luKXtcblx0cmV0dXJuIHRoaXMubWVzaGVzW3RoaXMuYWN0b3JzW2xvZ2luXS5jb250cm9sLm9iamVjdF9ndWlkXVxufVxuU2NlbmUubG9hZCA9IGZ1bmN0aW9uKG9ubG9hZCwgdGhyZWVfc2NlbmUpe1xuXHQvLyB0aHJlZSBzY2VuZSAtIGlzIGEgcGFyYW0gZm9yIGFkZGluZyBtZXNoZXMgdG9cblx0dmFyIHNlbGYgPSB0aGlzO1xuXHRzZWxmLm1lc2hlcyA9IHt9XG5cdHNlbGYubG9hZGVyID0gIG5ldyBzZWxmLlRIUkVFLkpTT05Mb2FkZXIoKTtcblx0c2VsZi50b3RhbF9vYmplY3RzX2NvdW50ID0gMDtcblx0c2VsZi5fY2FsbF9iYWNrID0gb25sb2FkO1xuXHRcblx0aWYodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpe1xuXHRcdHNlbGYudGhyZWVfc2NlbmUgPSB0aHJlZV9zY2VuZVxuXHR9XG5cdFxuXHRmdW5jdGlvbiBwdXRfb24odHlwZSwgbmFtZSl7XG5cdFx0dmFyIGVzID0gdGhpc1tcIm9uX2VuZ2luZXNfXCIgKyB0eXBlXVxuXHRcdC8vIGNvbnNvbGUubG9nKGVzKVxuXHRcdGlmICggZXMuaW5kZXhPZihuYW1lKSA9PT0gLTEpe1xuXHRcdFx0ZXMucHVzaChuYW1lKVx0XG5cdFx0fVxuXHRcdC8vIGNvbnNvbGUubG9nKGVzKVxuXHR9XG5cdGZ1bmN0aW9uIHB1dF9vZmYodHlwZSwgbmFtZSl7XG5cdFx0dmFyIGVzID0gdGhpc1tcIm9uX2VuZ2luZXNfXCIgKyB0eXBlXVxuXHRcdHZhciBpeCA9IGVzLmluZGV4T2YobmFtZSlcblx0XHRpZiAoICBpeCAhPT0gLTEgKXtcblx0XHRcdGVzLnNwbGljZShpeCwgMSk7XG5cdFx0fVxuXHR9XG5cdHZhciBqc29uID0gdGhpcy5fc2NlbmVcblx0XG5cdFxuXHRzZWxmLmFjdG9ycyA9IGpzb24uYWN0b3JzO1xuXHRcblx0Ly8gc2VsZi5hdXRvbWF0aWMgYWN0b3JzIC0gcnVuIGluIGxvb3BzXG5cdHNlbGYuYXV0b21hdGljX2FjdG9ycyA9IHt9O1xuXHQvLyBjb25zb2xlLmxvZyhzZWxmLmFjdG9ycylcblx0XG5cdHNlbGYubG9hZGVkX29iamVjdHNfY291bnQgPSAwXG5cdFxuXHQvLyBjb25zb2xlLmxvZyhzZWxmLmFjdG9ycyk7XG5cdC8vIGNvbnNvbGUubG9nKGpzb24pO1xuXHRzZWxmLl9tb2RlbF9jYWNoZSA9IHt9XG5cdF8uZWFjaChqc29uLm9iamVjdHMsIGZ1bmN0aW9uKCBvYmplY3QsaXggKXtcblx0XHQvL2NvbnNvbGUubG9nKCdsb29waW5nJylcblx0XHRzZWxmLnRvdGFsX29iamVjdHNfY291bnQgKz0xO1xuXHRcdFxuXHRcdGlmICghIHNlbGYuYWpheF9sb2FkX21vZGVscyl7XG5cdFx0XHR2YXIgbSA9IG9iamVjdC5tb2RlbF8zZC5zcGxpdCgnLycpWzJdO1xuXHRcdFx0bW9kZWxfcGF0aD0gXCIuL3B1YmxpYy9tb2RlbHMvXCIgKyBtXG5cdFx0fVxuXHRcdFxuXHRcdHZhciByZiA9IGZ1bmN0aW9uKCl7XG5cdFx0XHR2YXIgd2l0aF9nZW9tX2FuZF9tYXQgPSBmdW5jdGlvbihnZW9tLCBtYXQpe1xuXHRcdFx0XHQvLyBjb25zb2xlLmxvZyhtYXQpXG5cdFx0XHRcdHZhciBtID0gbmV3IHNlbGYuVEhSRUUuTWF0cml4NCgpXG5cdFx0XHRcdG0uaWRlbnRpdHkoKVxuXHRcdFx0XG5cdFx0XG5cdFx0XHRcdHZhciBtZXNoID0gbmV3IHNlbGYuVEhSRUUuTWVzaCggZ2VvbSwgbWF0ICk7XG5cdFx0XHRcdHZhciBvYmplY3Rfcm90YXRlZCA9IGZhbHNlXG5cdFx0XHRcdGlmICggb2JqZWN0LnBoeXNpY2FsICl7XG5cdFx0XHRcdFx0Zm9yKGkgaW4gb2JqZWN0LnBoeXNpY2FsKXtcblx0XHRcdFx0XHRcdHZhciBfaXMgPSAndG8nIGluIG9iamVjdC5waHlzaWNhbFtpXVxuXHRcdFx0XHRcdFx0aWYgKCFfaXMpe1xuXHRcdFx0XHRcdFx0XHR2YXIgdiA9IG5ldyBUSFJFRS5WZWN0b3IzKClcblx0XHRcdFx0XHRcdFx0di5zZXQuYXBwbHkodiwgb2JqZWN0LnBoeXNpY2FsW2ldKVxuXHRcdFx0XHRcdFx0XHRtZXNoW2ldID0gdlxuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHR9ZWxzZXtcblx0XHRcdFx0XHRcdFx0dmFyIHAgPSBuZXcgVEhSRUUuVmVjdG9yMyhvYmplY3QucGh5c2ljYWxbaV0udG9bMF0sIG9iamVjdC5waHlzaWNhbFtpXS50b1sxXSwgb2JqZWN0LnBoeXNpY2FsW2ldLnRvWzJdKVxuXHRcdFx0XHRcdFx0XHQvLyBUcnkgdG8gcm90YXRlIHAgb24gMTgwIFxuXHRcdFx0XHRcdFx0XHQvL3Aucm90YXRlWCgyKiBNYXRoLlBJKTtcblx0XHRcdFx0XHRcdFx0bWVzaC5sb29rQXQocC5uZWdhdGUoKSlcblx0XHRcdFx0XHRcdFx0Ly8gbWVzaC5yb3RhdGVYKDIqTWF0aC5QSSlcblx0XHRcdFx0XHRcdFx0b2JqZWN0X3JvdGF0ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0dmFyIHBpMiA9IE1hdGguUEkgKiAyO1xuXHRcdFx0XHRcdG1lc2gucG9zID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMyhNYXRoLnJhbmRvbSgpICogMjAwLCBNYXRoLnJhbmRvbSgpICogMjAwLCBNYXRoLnJhbmRvbSgpICogMjAwKTtcblx0XHRcdFx0XHRtZXNoLnJvdCA9IG5ldyBzZWxmLlRIUkVFLlZlY3RvcjMoTWF0aC5yYW5kb20oKSAqIHBpMiwgTWF0aC5yYW5kb20oKSAqIHBpMiwgTWF0aC5yYW5kb20oKSAqIHBpMik7XG5cdFx0XHRcdFx0bWVzaC5hdmVsID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMygwLDAsMClcblx0XHRcdFx0XHRtZXNoLmFhY2MgPSBuZXcgc2VsZi5USFJFRS5WZWN0b3IzKDAsMCwwKVxuXHRcdFx0XHRcdG1lc2gudmVsID0gbmV3IHNlbGYuVEhSRUUuVmVjdG9yMygwLDAsMClcblx0XHRcdFx0XHRtZXNoLmFjYyA9IG5ldyBzZWxmLlRIUkVFLlZlY3RvcjMoMCwwLDApXG5cdFx0XHRcdFx0XG5cdFx0XHRcdH1cblx0XHRcdFx0bWVzaC5wb3NpdGlvbiA9IG1lc2gucG9zO1xuXHRcdFx0XHRpZiAoISBvYmplY3Rfcm90YXRlZCAmJiAgJ3JvdCcgaW4gbWVzaCl7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0dmFyIHVlbCA9IG5ldyBUSFJFRS5FdWxlcihtZXNoLnJvdC54LCBtZXNoLnJvdC55LCBtZXNoLnJvdC56KTtcblx0XHRcdFx0XHRtZXNoLnJvdGF0aW9uID0gdWVsO1xuXHRcdFx0XHR9XG5cdFx0XHRcdG1lc2guY2FtZXJhcyA9IG9iamVjdC5jYW1lcmFzO1xuXHRcdFx0XHRtZXNoLmVuZ2luZXMgPSBvYmplY3QuZW5naW5lcztcblx0XHRcdFx0bWVzaC5oYXNfZW5naW5lcyA9IG9iamVjdC5lbmdpbmVzICE9PSB1bmRlZmluZWQ7XG5cdFx0XHRcdGlmIChtZXNoLmhhc19lbmdpbmVzKXtcblx0XHRcdFx0XHRtZXNoLm9uX2VuZ2luZXNfcm90YXRpb24gPSBbXTtcblx0XHRcdFx0XHRtZXNoLm9uX2VuZ2luZXNfcHJvcHVsc2lvbiA9IFtdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdG1lc2gucHV0X29mZiA9IHB1dF9vZmY7XG5cdFx0XHRcdG1lc2gucHV0X29uICA9IHB1dF9vbjtcblx0XHRcdFx0bWVzaC5tYXNzID0gb2JqZWN0Lm1hc3M7XG5cdFx0XG5cdFx0XHRcdGlmIChzZWxmLmRvX3ByZXBhcmVfcmVuZGVyaW5nKXtcblx0XHRcdFx0XHRpZiAob2JqZWN0LnR5cGUgIT09J3Bpdm90Jyl7XG5cdFx0XHRcdFx0XHR2YXIgbGFiZWwgPSBTcHJpdGVVdGlscy5tYWtlVGV4dFNwcml0ZShcIm1lc2g6IFwiICsgaXgpO1xuXHRcdFx0XHRcdFx0bGFiZWwucG9zaXRpb24gPSBuZXcgc2VsZi5USFJFRS5WZWN0b3IzKDAsMCwwKTtcblx0XHRcdFx0XHRcdG1lc2guYWRkKGxhYmVsKTtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiYWRkZWRcIik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHRocmVlX3NjZW5lLmFkZCggbWVzaCApO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHR9XG5cdFx0XHRcblx0XHRcdFx0c2VsZi5tZXNoZXNbIG9iamVjdC5HVUlEIF0gPSBtZXNoO1xuXHRcdFx0XHRzZWxmLmxvYWRlZF9vYmplY3RzX2NvdW50ICs9MTtcblx0XHRcdFx0c2VsZi5fbW9kZWxfbG9hZGVkKCBpeCApXG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGlmKHNlbGYuYWpheF9sb2FkX21vZGVscyl7XG5cdFx0XHRcdHNlbGYuX2dldF9tb2RlbChvYmplY3QubW9kZWxfM2Qsc2VsZi5fYWpheF9nZXR0ZXIsIHdpdGhfZ2VvbV9hbmRfbWF0KVxuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdHNlbGYuX2dldF9tb2RlbChtb2RlbF9wYXRoLCBzZWxmLl9mc19nZXR0ZXIsIHdpdGhfZ2VvbV9hbmRfbWF0KVxuXHRcblx0XHRcdH1cblx0XHR9XG5cdFx0c2V0VGltZW91dChyZiwxKTtcblx0XHRcblx0fSlcblx0XHRcdFxuXHRcblx0XG59LFxuU2NlbmUuX2FqYXhfZ2V0dGVyPWZ1bmN0aW9uKG5hbWUsIGNiKSB7XG5cdC8vY29uc29sZS5sb2codGhpcyk7XG5cdHZhciBzZWxmID0gdGhpcztcblx0c2VsZi5sb2FkZXIubG9hZCggbmFtZSwgZnVuY3Rpb24oZ2VvbSwgbWF0KXtcblx0XHRcblx0XHR2YXIgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEZhY2VNYXRlcmlhbCggbWF0ICk7XG5cdFx0Ly92YXIgYSA9IHtnZW9tOmdlb20sIG1hdGVyaWFsOm1hdGVyaWFsfVxuXHRcdGNiKGdlb20sIG1hdGVyaWFsKTtcblx0XHRcblx0fSlcbn1cblNjZW5lLl9mc19nZXR0ZXI9ZnVuY3Rpb24obmFtZSwgY2Ipe1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cdGZzLnJlYWRGaWxlKG5hbWUsIGZ1bmN0aW9uKGVycixkYXRhKXtcblx0XHQvL2NvbnNvbGUubG9nKFwic3RhcnQgbG9hZGluZ1wiKTtcblx0XHRpZihlcnIpIHRocm93IGVycjtcblx0XHR2YXIganNvbiA9IEpTT04ucGFyc2UoZGF0YSlcbiAgICAgICAgdmFyIHJlc3VsdCA9IHNlbGYubG9hZGVyLnBhcnNlKCBqc29uLCAnJyApO1xuXG5cdFx0dmFyIGxkID0gKGZ1bmN0aW9uKCl7XG5cdFx0XHR2YXIgbWF0ZXJpYWwgPSBuZXcgc2VsZi5USFJFRS5NZXNoRmFjZU1hdGVyaWFsKCByZXN1bHQubWF0ZXJpYWxzICk7XG5cdFx0XHRjYihyZXN1bHQuZ2VvbWV0cnksIG1hdGVyaWFsKTtcblx0XHRcblx0XHR9KVxuXHRcdHNldFRpbWVvdXQobGQsMSk7XG5cdH0pO1xufVxuXG5TY2VuZS5fZ2V0X21vZGVsID0gZnVuY3Rpb24obmFtZSwgZ2V0dGVyLCB3aXRoX2dlb21fYW5kX21hdCl7XG5cdHZhciBzZWxmID0gdGhpcztcblx0dmFyIG1hdF9nZW9tX2NiID0gZnVuY3Rpb24oZ2VvbSwgbWF0KXtcblx0XHRzZWxmLl9tb2RlbF9jYWNoZVtuYW1lXSA9IHtnZW9tOmdlb20sIG1hdGVyaWFsOm1hdH1cblx0XHR3aXRoX2dlb21fYW5kX21hdChnZW9tLCBtYXQpXG5cdH1cblx0aWYgKG5hbWUgaW4gc2VsZi5fbW9kZWxfY2FjaGUpe1xuXHRcdHZhciBhPSBzZWxmLl9tb2RlbF9jYWNoZVtuYW1lXVxuXHRcdHdpdGhfZ2VvbV9hbmRfbWF0KGEuZ2VvbSwgYS5tYXRlcmlhbClcblx0fWVsc2V7XG5cdFx0Z2V0dGVyLmFwcGx5KHNlbGYsW25hbWUsIG1hdF9nZW9tX2NiXSlcblx0fVxuXHRcdFx0XHRcbn1cblNjZW5lLl9tb2RlbF9sb2FkZWQgPSBmdW5jdGlvbihpeCl7XG5cdGlmICh0aGlzLmxvYWRlZF9vYmplY3RzX2NvdW50ID09IHRoaXMudG90YWxfb2JqZWN0c19jb3VudCl7XG5cdFx0Ly8gc2NlbmUgbG9hZGVkXG5cdFx0dGhpcy5fbG9hZGVkID0gdHJ1ZTtcblx0XHRpZiAodGhpcy5fY2FsbF9iYWNrKXtcblx0XHRcdHRoaXMuX2NhbGxfYmFjaygpXG5cdFx0fVxuXHRcdC8vY29uc29sZS5sb2coXCJET05FXCIpO1xuXHR9ZWxzZXtcblx0XHQvL2NvbnNvbGUubG9nKCdub3QgeWV0JywgdGhpcy5sb2FkZWRfb2JqZWN0c19jb3VudCAsIHRoaXMudG90YWxfb2JqZWN0c19jb3VudCk7XG5cdH1cbn1cblNjZW5lLmdldCA9IGZ1bmN0aW9uKCl7XG5cdHJldHVybiB0aGlzLl9zY2VuZVxufVxubW9kdWxlLmV4cG9ydHMgPSBTY2VuZSIsInZhciBTY2VuZSA9IHJlcXVpcmUoJy4vc2NlbmUuanMnKVxudmFyIHUgPSByZXF1aXJlKCcuL3V0aWxzLmpzJylcbnZhciBfICAgICA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcblxudmFyIE1pc3Npb24gPSB7ZGVzY3I6XCJNb2R1bGUgZm9yIGNyZWF0aW5nIG1pc3Npb25zXCJ9XG5cbk1pc3Npb24uY3JlYXRlID0gZnVuY3Rpb24oY3JlYXRvcl9sb2dpbiwgY2FsbGJhY2spe1xuXHRcblx0Ly8gTm8gcGFyYW1zIC0gb25seSBvbmUgbWlzc2lvbiBhdmFpbGFibGVcblx0dmFyIHNlbGYgPSB0aGlzIDtcblx0dGhpcy5HVUlEID0gdS5tYWtlX2d1aWQoKTtcblx0dGhpcy5jcmVhdG9yID0gY3JlYXRvcl9sb2dpbjtcblx0dmFyIHAxID0gWy0xMTAsIDEwMCwgNDBdO1xuXHR2YXIgcDIgPSBbMTQwLCAtMTEwLCA3MF07XG5cdHZhciBjID0gMC4yXG5cdHZhciBwMSA9IF8ubWFwKHAxLGZ1bmN0aW9uKHYpe3JldHVybiB2KmN9KTtcblx0dmFyIHAyID0gXy5tYXAocDIsZnVuY3Rpb24odil7cmV0dXJuIHYqY30pOztcblx0XG5cdHZhciBkZWZfc2hpcDEgPSB7dHlwZTonc2hpcCcsXG5cdFx0XHRcdFx0XHQgbW9kZWxfM2Q6Jy9tb2RlbHMvU3RhckNydWlzZXIuanMnLFxuXHRcdFx0XHRcdFx0IHBoeXNpY2FsOntcblx0XHRcdFx0XHRcdFx0IHBvczpwMSxcblx0XHRcdFx0XHRcdFx0IHJvdDp7dG86IHAyfSxcblx0XHRcdFx0XHRcdCB9LFxuXHRcdFx0XHRcdFx0IFxuXHRcdFx0IFx0XHRcdFwiY2FtZXJhc1wiOntcblx0XHRcdCBcdFx0XHRcdFx0XCJmcm9udFwiOntcblx0XHRcdCBcdFx0XHRcdFx0XHRcImxhYmVsXCI6XCJtYWluXCIsXG5cdFx0XHQgXHRcdFx0XHRcdFx0XCJwb3NpdGlvblwiOiBbMCwwLjUsMF0sXG5cdFx0XHQgXHRcdFx0XHRcdFx0XCJkaXJlY3Rpb25cIjpbMCwwLC0xXVxuXHRcdFx0IFx0XHRcdFx0XHRcdH0sXG5cdFx0XHQgXHRcdFx0XHRcdFwiYmFja1wiOntcblx0XHRcdCBcdFx0XHRcdFx0XHRcdFwibGFiZWxcIjpcIm1haW5cIixcblx0XHRcdCBcdFx0XHRcdFx0XHRcdFwicG9zaXRpb25cIjogWzAsMCwyXSxcblx0XHRcdCBcdFx0XHRcdFx0XHRcdFwiZGlyZWN0aW9uXCI6WzAsMCwxXVxuXHRcdFx0IFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdCBcdFx0XHQnZW5naW5lcyc6e1xuXHRcdFx0IFx0XHRcdFx0J3JvdGF0aW9uJzp7XG5cdFx0XHQgXHRcdFx0XHRcdCd4Kyc6MTAwLCd4LSc6MTAwLFxuXHRcdFx0IFx0XHRcdFx0XHQneSsnOjEwMCwneS0nOjEwMCxcblx0XHRcdCBcdFx0XHRcdFx0J3orJzoxMDAsJ3otJzoxMDBcblx0XHRcdCBcdFx0XHRcdH0sXG5cdFx0XHQgXHRcdFx0XHQncHJvcHVsc2lvbic6e1xuXHRcdFx0IFx0XHRcdFx0XHQneCsnOjEsJ3gtJzoxLFxuXHRcdFx0IFx0XHRcdFx0XHQneSsnOjEsJ3ktJzoxLFxuXHRcdFx0IFx0XHRcdFx0XHQneisnOjEwMDAsJ3otJzoxMDAwXG5cdFx0XHQgXHRcdFx0XHR9XG5cdFx0XHQgXHRcdFx0fSxcblx0XHRcdCBcdFx0XHQnbWFzcyc6IDEwMDAwLFxuXHRcdFx0XHRcdFx0J0dVSUQnOnUubWFrZV9ndWlkKClcblx0XHRcdFx0XHR9XG5cdHZhciBkZWZfc2hpcDIgPSB7dHlwZTonc2hpcCcsXG5cdFx0XHRcdFx0XHQgbW9kZWxfM2Q6Jy9tb2RlbHMvU3RhckNydWlzZXIuanMnLFxuXHRcdFx0XHRcdFx0IHBoeXNpY2FsOntcblx0XHRcdFx0XHRcdFx0IHBvczpwMixcblx0XHRcdFx0XHRcdFx0IHJvdDp7dG86IHAxfSxcblx0XHRcdFx0XHRcdFx0IFxuXHRcdFx0XHRcdFx0IH0sXG5cdFx0XHQgXHRcdFx0XCJjYW1lcmFzXCI6e1xuXHRcdFx0IFx0XHRcdFx0XHRcImZyb250XCI6e1xuXHRcdFx0IFx0XHRcdFx0XHRcdFwibGFiZWxcIjpcIm1haW5cIixcblx0XHRcdCBcdFx0XHRcdFx0XHRcInBvc2l0aW9uXCI6IFswLDAuNSwwXSxcblx0XHRcdCBcdFx0XHRcdFx0XHRcImRpcmVjdGlvblwiOlswLDAsLTFdXG5cdFx0XHQgXHRcdFx0XHRcdFx0fSxcblx0XHRcdCBcdFx0XHRcdFx0XCJiYWNrXCI6e1xuXHRcdFx0IFx0XHRcdFx0XHRcdFx0XCJsYWJlbFwiOlwibWFpblwiLFxuXHRcdFx0IFx0XHRcdFx0XHRcdFx0XCJwb3NpdGlvblwiOiBbMCwwLDJdLFxuXHRcdFx0IFx0XHRcdFx0XHRcdFx0XCJkaXJlY3Rpb25cIjpbMCwwLDFdXG5cdFx0XHQgXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0IFx0XHRcdCdlbmdpbmVzJzp7XG5cdFx0XHQgXHRcdFx0XHQncm90YXRpb24nOntcblx0XHRcdCBcdFx0XHRcdFx0J3grJzoxMDAsJ3gtJzoxMDAsXG5cdFx0XHQgXHRcdFx0XHRcdCd5Kyc6MTAwLCd5LSc6MTAwLFxuXHRcdFx0IFx0XHRcdFx0XHQneisnOjEwMCwnei0nOjEwMFxuXHRcdFx0IFx0XHRcdFx0fSxcblx0XHRcdCBcdFx0XHRcdCdwcm9wdWxzaW9uJzp7XG5cdFx0XHQgXHRcdFx0XHRcdCd4Kyc6MSwneC0nOjEsXG5cdFx0XHQgXHRcdFx0XHRcdCd5Kyc6MSwneS0nOjEsXG5cdFx0XHQgXHRcdFx0XHRcdCd6Kyc6MTAwMCwnei0nOjEwMDBcblx0XHRcdCBcdFx0XHRcdH1cblx0XHRcdCBcdFx0XHR9LFxuXHRcdFx0IFx0XHRcdCdtYXNzJzogMTAwMDAsXG5cdFx0XHRcdFx0XHQnR1VJRCc6dS5tYWtlX2d1aWQoKVxuXHRcdFx0XHRcdH1cblx0Ly8g0JbQtdGB0YLQutC+INC30LDQtNCw0L3QvdGL0LUg0LrQvtGA0LDQsdC70LjQutC4IC0g0LHQtdC3INC/0L7Qt9C40YbQuNC5INC4INGB0LrQvtGA0L7RgdGC0LXQuVx0XG5cdHZhciBwaXZvdD0gXHRmdW5jdGlvbih4LHkseil7XG5cdFx0cmV0dXJuIHt0eXBlOidwaXZvdCcsXG5cdFx0XHRcblx0XHRcdFx0XHRcdCBtb2RlbF8zZDonL21vZGVscy9zcC5qcycsXG5cdFx0XHRcdFx0XHQgcGh5c2ljYWw6e1xuXHRcdFx0XHRcdFx0XHQgcG9zOlt4LCB5LCB6XVxuXHRcdFx0XHRcdFx0XHQgLy9yb3Q6e3RvOiBbLTExMCwgMTAwLCA0MF19LFxuXHRcdFx0XHRcdFx0XHQgXG5cdFx0XHRcdFx0XHQgfSxcblx0XHRcdCBcdFx0XHQnbWFzcyc6IDEwMDAwMDAsXG5cdFx0XHRcdFx0XHQnR1VJRCc6dS5tYWtlX2d1aWQoKVxuXHRcdFx0XHRcdH1cblx0fVxuXHR0aGlzLl9kaDIgPSBkZWZfc2hpcDI7IC8vINCh0L7RhdGA0LDQvdGP0LXQvCDQutC+0YDQsNCx0LvQuNC6IC0g0L/QvtGC0L7QvNGDINGH0YLQviDQv9C+0LrQsCDQv9C+0LvRjNC30L7QstCw0YLQtdC70Ywg0L3QtSDQstGL0LHQuNGA0LDQtdGCINC60L7RgNCw0LHQu9GMIC0g0L7QvSDQtdC80YMg0L3QsNC30L3QsNGH0LDQtdGC0YHRj1x0XHRcblx0dmFyIHNvID0ge31cblx0Xy5lYWNoKFtkZWZfc2hpcDEsZGVmX3NoaXAyXSwgZnVuY3Rpb24ocyl7XG5cdFx0c29bcy5HVUlEXSA9IHNcblx0fSlcblx0dmFyIGluYyA9IDBcblx0Zm9yICh2YXIgeD0tMjAwOyB4PD0gMjAwOyB4Kz01MCl7XG5cdFx0Zm9yICh2YXIgeT0tMjAwOyB5PD0gMjAwOyB5Kz01MCl7XG5cdFx0XHRmb3IgKHZhciB6PS0yMDA7IHo8PSAyMDA7IHorPTUwKXtcblx0XHRcdFx0Y29uc29sZS5sb2coaW5jLFwieCx5LHpcIix4LHkseilcblx0XHRcdFx0aW5jICs9MTtcblx0XHRcdFx0dmFyIHAgPXBpdm90KHgseSx6KVxuXHRcdFx0XHRzb1twLkdVSURdID0gcFxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHR2YXIgbWlzc2lvbiA9IHtcblx0XHRhY3RvcnMgOiBbe2xvZ2luOiBjcmVhdG9yX2xvZ2luLCBjb21tYW5kOidyZWQnLCBjb250cm9sOntvYmplY3RfZ3VpZDpkZWZfc2hpcDEuR1VJRCwgdmlld3BvcnQ6J2Zyb250JywgY29udHJvbHM6WydQaWxvdCcsICdUdXJyZXQnXX0gfV0sXG5cdFx0Y29tbWFuZHM6WydyZWQnLCAnYmx1ZSddLFxuXHRcdF9jb21tYW5kc19hbW91bnQ6WzEsMF0sXG5cdFx0bWF4X3Blcl9jb21tYW5kOjEsXG5cdFx0bWluX3Blcl9jb21tYW5kOjEsXG5cdFx0Y29vcmRzIDogWzEwMCwgNTAwLCAzMDBdLCAvLyBHbG9iYWwgY29vcmRzIG9mIG1pc3Npb24gb3JpZ2luXG5cdFx0c2hhcmVkX29iamVjdHM6IHNvXG5cdH1cblx0c2VsZi5fbWlzc2lvbl9sb2dpbnMgPSBbY3JlYXRvcl9sb2dpbl07XG5cdHNlbGYubWlzc2lvbiA9IG1pc3Npb25cblx0c2VsZi5fbWlzc2lvbl9yZWFkeSA9IGZ1bmN0aW9uKCl7XG5cdFx0Ly8gY29uc29sZS5sb2coJ29rIC0gbGF1bmNoaW5nJylcblx0XHQvLyB2YXIgc2NlbmUgPSBzZWxmLnByZXBhcmVfc2NlbmUoKVxuXHRcdC8vIGNhbGxiYWNrIChzY2VuZSlcblx0XHRcblx0XHRcblx0fVxuXHRzZWxmLnByZXBhcmVfc2NlbmUoKTtcblx0cmV0dXJuIHRoaXNcbn1cbk1pc3Npb24ucHJlcGFyZV9zY2VuZSA9IGZ1bmN0aW9uKCl7XG5cdFxuXHR0aGlzLl9zY2VuZSA9IFNjZW5lLmNyZWF0ZV9mcm9tX3dvcmxkKHRoaXMubWlzc2lvbi5jb29yZHNbMF0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5taXNzaW9uLmNvb3Jkc1sxXSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLm1pc3Npb24uY29vcmRzWzJdICk7XG5cdHZhciBzZWxmID0gdGhpcztcblx0Xy5lYWNoKHRoaXMubWlzc2lvbi5zaGFyZWRfb2JqZWN0cywgZnVuY3Rpb24ob2JqKXtcblx0XHRzZWxmLl9zY2VuZS5qb2luX29iamVjdChvYmopXG5cdFx0XG5cdH0pXHRcdFx0XHRcdFx0XHRcdFx0XHRcblx0Xy5lYWNoKHRoaXMubWlzc2lvbi5hY3RvcnMsIGZ1bmN0aW9uKGEpe1xuXHRcdGNvbnNvbGUubG9nKGEpXG5cdFx0c2VsZi5fc2NlbmUuam9pbl9hY3RvcihhKTtcblx0fSlcblx0XHRcdFx0XHRcdFx0XG59XG5NaXNzaW9uLmpvaW5fcGxheWVyID0gZnVuY3Rpb24obG9naW4pe1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cdHZhciBNID0gc2VsZi5taXNzaW9uO1xuXHR2YXIgY29tbWFuZDtcblx0Ly8gR2V0IGZpcnN0IGF2YWlsYWJsZSBjb21tYW5kXG5cdGNvbnNvbGUubG9nKFwiTE9HSU5cIiwgbG9naW4pXG5cdHNlbGYuX21pc3Npb25fbG9naW5zLnB1c2gobG9naW4pO1xuXHRmb3IodmFyIGMgPTA7IGM8IE0uY29tbWFuZHMubGVuZ3RoOyAgYysrKXtcblx0XHRjb25zb2xlLmxvZyhcIkNBbVwiLCBNLl9jb21tYW5kc19hbW91bnRbY10sIE0ubWF4X3Blcl9jb21tYW5kKTtcblx0XHRpZiAoTS5fY29tbWFuZHNfYW1vdW50W2NdID09IE0ubWF4X3Blcl9jb21tYW5kKXtcblx0XHRcdFxuXHRcdFx0Y29udGludWVcblx0XHR9ZWxzZXtcblx0XHRcdGNvbW1hbmQgPSBNLmNvbW1hbmRzW2NdXG5cdFx0XHRicmVha1xuXHRcdH1cblx0fVxuXHQvLyBDb250cm9sbGFibGUgbm90IGNob3Nlbi4uLiBjb250cm9sbGFibGUgZ2l2ZW5cblx0dmFyIGNvbnRyb2xsYWJsZSA9IHtvYmplY3RfZ3VpZDp0aGlzLl9kaDIuR1VJRCwgdmlld3BvcnQ6J2Zyb250JywgY29udHJvbHM6WydQaWxvdCcsICdUdXJyZXQnXX0gXG5cdC8vIFdlIGNvdWxkIGJlIHNhZmUgbm93IC0gb25seSB0d28gb2JqZWN0cyBhbmQgb25seSB0d28gcGxheWVycyAtIHRoZXkgY2Fubm90IGNoYW5nZSB0aGV5J3JlIHBvc2l0aW9uIGluIHRoZSBtaXNzaW9uXG5cdC8vIEJ1dCB3aGVuIGl0IHdvdWxkIGJlIHNldmVyYWwgcGxheWVycyBvbiBPTkUgc2hpcCBhdmFpbGFibGUgLSB3ZSBzaG91bGQgY2hlY2sgQ0FSRUZVTExZIGlmIG9iamVjdCBpbiBzY2VuZSBhbHJlYWR5XG5cdC8vY29uc29sZS5sb2coXCJjb21tYW5kXCIsIGNvbW1hbmQpXG5cdGlmKGNvbW1hbmQpe1xuXHRcdHZhciBhY3RvciA9IHtjb21tYW5kOmNvbW1hbmQsIGxvZ2luOmxvZ2luLCBjb250cm9sOiBjb250cm9sbGFibGV9XG5cdFx0c2VsZi5taXNzaW9uLmFjdG9ycy5wdXNoKGFjdG9yKVxuXHRcdGNvbnNvbGUubG9nKFwiQUNUT1JTXCIsIHNlbGYubWlzc2lvbi5hY3RvcnMpO1xuXHRcdHNlbGYuX3NjZW5lLmpvaW5fYWN0b3IoYWN0b3IpXG5cdH1cblx0XG59XG5tb2R1bGUuZXhwb3J0cyA9IE1pc3Npb24iLCIvLyBub3RoaW5nIHRvIHNlZSBoZXJlLi4uIG5vIGZpbGUgbWV0aG9kcyBmb3IgdGhlIGJyb3dzZXJcbiIsIi8vICAgICBVbmRlcnNjb3JlLmpzIDEuNS4yXG4vLyAgICAgaHR0cDovL3VuZGVyc2NvcmVqcy5vcmdcbi8vICAgICAoYykgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4vLyAgICAgVW5kZXJzY29yZSBtYXkgYmUgZnJlZWx5IGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cblxuKGZ1bmN0aW9uKCkge1xuXG4gIC8vIEJhc2VsaW5lIHNldHVwXG4gIC8vIC0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gRXN0YWJsaXNoIHRoZSByb290IG9iamVjdCwgYHdpbmRvd2AgaW4gdGhlIGJyb3dzZXIsIG9yIGBleHBvcnRzYCBvbiB0aGUgc2VydmVyLlxuICB2YXIgcm9vdCA9IHRoaXM7XG5cbiAgLy8gU2F2ZSB0aGUgcHJldmlvdXMgdmFsdWUgb2YgdGhlIGBfYCB2YXJpYWJsZS5cbiAgdmFyIHByZXZpb3VzVW5kZXJzY29yZSA9IHJvb3QuXztcblxuICAvLyBFc3RhYmxpc2ggdGhlIG9iamVjdCB0aGF0IGdldHMgcmV0dXJuZWQgdG8gYnJlYWsgb3V0IG9mIGEgbG9vcCBpdGVyYXRpb24uXG4gIHZhciBicmVha2VyID0ge307XG5cbiAgLy8gU2F2ZSBieXRlcyBpbiB0aGUgbWluaWZpZWQgKGJ1dCBub3QgZ3ppcHBlZCkgdmVyc2lvbjpcbiAgdmFyIEFycmF5UHJvdG8gPSBBcnJheS5wcm90b3R5cGUsIE9ialByb3RvID0gT2JqZWN0LnByb3RvdHlwZSwgRnVuY1Byb3RvID0gRnVuY3Rpb24ucHJvdG90eXBlO1xuXG4gIC8vIENyZWF0ZSBxdWljayByZWZlcmVuY2UgdmFyaWFibGVzIGZvciBzcGVlZCBhY2Nlc3MgdG8gY29yZSBwcm90b3R5cGVzLlxuICB2YXJcbiAgICBwdXNoICAgICAgICAgICAgID0gQXJyYXlQcm90by5wdXNoLFxuICAgIHNsaWNlICAgICAgICAgICAgPSBBcnJheVByb3RvLnNsaWNlLFxuICAgIGNvbmNhdCAgICAgICAgICAgPSBBcnJheVByb3RvLmNvbmNhdCxcbiAgICB0b1N0cmluZyAgICAgICAgID0gT2JqUHJvdG8udG9TdHJpbmcsXG4gICAgaGFzT3duUHJvcGVydHkgICA9IE9ialByb3RvLmhhc093blByb3BlcnR5O1xuXG4gIC8vIEFsbCAqKkVDTUFTY3JpcHQgNSoqIG5hdGl2ZSBmdW5jdGlvbiBpbXBsZW1lbnRhdGlvbnMgdGhhdCB3ZSBob3BlIHRvIHVzZVxuICAvLyBhcmUgZGVjbGFyZWQgaGVyZS5cbiAgdmFyXG4gICAgbmF0aXZlRm9yRWFjaCAgICAgID0gQXJyYXlQcm90by5mb3JFYWNoLFxuICAgIG5hdGl2ZU1hcCAgICAgICAgICA9IEFycmF5UHJvdG8ubWFwLFxuICAgIG5hdGl2ZVJlZHVjZSAgICAgICA9IEFycmF5UHJvdG8ucmVkdWNlLFxuICAgIG5hdGl2ZVJlZHVjZVJpZ2h0ICA9IEFycmF5UHJvdG8ucmVkdWNlUmlnaHQsXG4gICAgbmF0aXZlRmlsdGVyICAgICAgID0gQXJyYXlQcm90by5maWx0ZXIsXG4gICAgbmF0aXZlRXZlcnkgICAgICAgID0gQXJyYXlQcm90by5ldmVyeSxcbiAgICBuYXRpdmVTb21lICAgICAgICAgPSBBcnJheVByb3RvLnNvbWUsXG4gICAgbmF0aXZlSW5kZXhPZiAgICAgID0gQXJyYXlQcm90by5pbmRleE9mLFxuICAgIG5hdGl2ZUxhc3RJbmRleE9mICA9IEFycmF5UHJvdG8ubGFzdEluZGV4T2YsXG4gICAgbmF0aXZlSXNBcnJheSAgICAgID0gQXJyYXkuaXNBcnJheSxcbiAgICBuYXRpdmVLZXlzICAgICAgICAgPSBPYmplY3Qua2V5cyxcbiAgICBuYXRpdmVCaW5kICAgICAgICAgPSBGdW5jUHJvdG8uYmluZDtcblxuICAvLyBDcmVhdGUgYSBzYWZlIHJlZmVyZW5jZSB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QgZm9yIHVzZSBiZWxvdy5cbiAgdmFyIF8gPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqIGluc3RhbmNlb2YgXykgcmV0dXJuIG9iajtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgXykpIHJldHVybiBuZXcgXyhvYmopO1xuICAgIHRoaXMuX3dyYXBwZWQgPSBvYmo7XG4gIH07XG5cbiAgLy8gRXhwb3J0IHRoZSBVbmRlcnNjb3JlIG9iamVjdCBmb3IgKipOb2RlLmpzKiosIHdpdGhcbiAgLy8gYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgZm9yIHRoZSBvbGQgYHJlcXVpcmUoKWAgQVBJLiBJZiB3ZSdyZSBpblxuICAvLyB0aGUgYnJvd3NlciwgYWRkIGBfYCBhcyBhIGdsb2JhbCBvYmplY3QgdmlhIGEgc3RyaW5nIGlkZW50aWZpZXIsXG4gIC8vIGZvciBDbG9zdXJlIENvbXBpbGVyIFwiYWR2YW5jZWRcIiBtb2RlLlxuICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBfO1xuICAgIH1cbiAgICBleHBvcnRzLl8gPSBfO1xuICB9IGVsc2Uge1xuICAgIHJvb3QuXyA9IF87XG4gIH1cblxuICAvLyBDdXJyZW50IHZlcnNpb24uXG4gIF8uVkVSU0lPTiA9ICcxLjUuMic7XG5cbiAgLy8gQ29sbGVjdGlvbiBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBUaGUgY29ybmVyc3RvbmUsIGFuIGBlYWNoYCBpbXBsZW1lbnRhdGlvbiwgYWthIGBmb3JFYWNoYC5cbiAgLy8gSGFuZGxlcyBvYmplY3RzIHdpdGggdGhlIGJ1aWx0LWluIGBmb3JFYWNoYCwgYXJyYXlzLCBhbmQgcmF3IG9iamVjdHMuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBmb3JFYWNoYCBpZiBhdmFpbGFibGUuXG4gIHZhciBlYWNoID0gXy5lYWNoID0gXy5mb3JFYWNoID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuO1xuICAgIGlmIChuYXRpdmVGb3JFYWNoICYmIG9iai5mb3JFYWNoID09PSBuYXRpdmVGb3JFYWNoKSB7XG4gICAgICBvYmouZm9yRWFjaChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgfSBlbHNlIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IG9iai5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpbaV0sIGksIG9iaikgPT09IGJyZWFrZXIpIHJldHVybjtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtrZXlzW2ldXSwga2V5c1tpXSwgb2JqKSA9PT0gYnJlYWtlcikgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIHJlc3VsdHMgb2YgYXBwbHlpbmcgdGhlIGl0ZXJhdG9yIHRvIGVhY2ggZWxlbWVudC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYG1hcGAgaWYgYXZhaWxhYmxlLlxuICBfLm1hcCA9IF8uY29sbGVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdHM7XG4gICAgaWYgKG5hdGl2ZU1hcCAmJiBvYmoubWFwID09PSBuYXRpdmVNYXApIHJldHVybiBvYmoubWFwKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXN1bHRzLnB1c2goaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICB2YXIgcmVkdWNlRXJyb3IgPSAnUmVkdWNlIG9mIGVtcHR5IGFycmF5IHdpdGggbm8gaW5pdGlhbCB2YWx1ZSc7XG5cbiAgLy8gKipSZWR1Y2UqKiBidWlsZHMgdXAgYSBzaW5nbGUgcmVzdWx0IGZyb20gYSBsaXN0IG9mIHZhbHVlcywgYWthIGBpbmplY3RgLFxuICAvLyBvciBgZm9sZGxgLiBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgcmVkdWNlYCBpZiBhdmFpbGFibGUuXG4gIF8ucmVkdWNlID0gXy5mb2xkbCA9IF8uaW5qZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgbWVtbywgY29udGV4dCkge1xuICAgIHZhciBpbml0aWFsID0gYXJndW1lbnRzLmxlbmd0aCA+IDI7XG4gICAgaWYgKG9iaiA9PSBudWxsKSBvYmogPSBbXTtcbiAgICBpZiAobmF0aXZlUmVkdWNlICYmIG9iai5yZWR1Y2UgPT09IG5hdGl2ZVJlZHVjZSkge1xuICAgICAgaWYgKGNvbnRleHQpIGl0ZXJhdG9yID0gXy5iaW5kKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICAgIHJldHVybiBpbml0aWFsID8gb2JqLnJlZHVjZShpdGVyYXRvciwgbWVtbykgOiBvYmoucmVkdWNlKGl0ZXJhdG9yKTtcbiAgICB9XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKCFpbml0aWFsKSB7XG4gICAgICAgIG1lbW8gPSB2YWx1ZTtcbiAgICAgICAgaW5pdGlhbCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZW1vID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCBtZW1vLCB2YWx1ZSwgaW5kZXgsIGxpc3QpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICghaW5pdGlhbCkgdGhyb3cgbmV3IFR5cGVFcnJvcihyZWR1Y2VFcnJvcik7XG4gICAgcmV0dXJuIG1lbW87XG4gIH07XG5cbiAgLy8gVGhlIHJpZ2h0LWFzc29jaWF0aXZlIHZlcnNpb24gb2YgcmVkdWNlLCBhbHNvIGtub3duIGFzIGBmb2xkcmAuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGByZWR1Y2VSaWdodGAgaWYgYXZhaWxhYmxlLlxuICBfLnJlZHVjZVJpZ2h0ID0gXy5mb2xkciA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIG1lbW8sIGNvbnRleHQpIHtcbiAgICB2YXIgaW5pdGlhbCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyO1xuICAgIGlmIChvYmogPT0gbnVsbCkgb2JqID0gW107XG4gICAgaWYgKG5hdGl2ZVJlZHVjZVJpZ2h0ICYmIG9iai5yZWR1Y2VSaWdodCA9PT0gbmF0aXZlUmVkdWNlUmlnaHQpIHtcbiAgICAgIGlmIChjb250ZXh0KSBpdGVyYXRvciA9IF8uYmluZChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgICByZXR1cm4gaW5pdGlhbCA/IG9iai5yZWR1Y2VSaWdodChpdGVyYXRvciwgbWVtbykgOiBvYmoucmVkdWNlUmlnaHQoaXRlcmF0b3IpO1xuICAgIH1cbiAgICB2YXIgbGVuZ3RoID0gb2JqLmxlbmd0aDtcbiAgICBpZiAobGVuZ3RoICE9PSArbGVuZ3RoKSB7XG4gICAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgICAgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgfVxuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGluZGV4ID0ga2V5cyA/IGtleXNbLS1sZW5ndGhdIDogLS1sZW5ndGg7XG4gICAgICBpZiAoIWluaXRpYWwpIHtcbiAgICAgICAgbWVtbyA9IG9ialtpbmRleF07XG4gICAgICAgIGluaXRpYWwgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVtbyA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgbWVtbywgb2JqW2luZGV4XSwgaW5kZXgsIGxpc3QpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICghaW5pdGlhbCkgdGhyb3cgbmV3IFR5cGVFcnJvcihyZWR1Y2VFcnJvcik7XG4gICAgcmV0dXJuIG1lbW87XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBmaXJzdCB2YWx1ZSB3aGljaCBwYXNzZXMgYSB0cnV0aCB0ZXN0LiBBbGlhc2VkIGFzIGBkZXRlY3RgLlxuICBfLmZpbmQgPSBfLmRldGVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0O1xuICAgIGFueShvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkge1xuICAgICAgICByZXN1bHQgPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gYWxsIHRoZSBlbGVtZW50cyB0aGF0IHBhc3MgYSB0cnV0aCB0ZXN0LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgZmlsdGVyYCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYHNlbGVjdGAuXG4gIF8uZmlsdGVyID0gXy5zZWxlY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHRzO1xuICAgIGlmIChuYXRpdmVGaWx0ZXIgJiYgb2JqLmZpbHRlciA9PT0gbmF0aXZlRmlsdGVyKSByZXR1cm4gb2JqLmZpbHRlcihpdGVyYXRvciwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkgcmVzdWx0cy5wdXNoKHZhbHVlKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICAvLyBSZXR1cm4gYWxsIHRoZSBlbGVtZW50cyBmb3Igd2hpY2ggYSB0cnV0aCB0ZXN0IGZhaWxzLlxuICBfLnJlamVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gXy5maWx0ZXIob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHJldHVybiAhaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpO1xuICAgIH0sIGNvbnRleHQpO1xuICB9O1xuXG4gIC8vIERldGVybWluZSB3aGV0aGVyIGFsbCBvZiB0aGUgZWxlbWVudHMgbWF0Y2ggYSB0cnV0aCB0ZXN0LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgZXZlcnlgIGlmIGF2YWlsYWJsZS5cbiAgLy8gQWxpYXNlZCBhcyBgYWxsYC5cbiAgXy5ldmVyeSA9IF8uYWxsID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGl0ZXJhdG9yIHx8IChpdGVyYXRvciA9IF8uaWRlbnRpdHkpO1xuICAgIHZhciByZXN1bHQgPSB0cnVlO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdDtcbiAgICBpZiAobmF0aXZlRXZlcnkgJiYgb2JqLmV2ZXJ5ID09PSBuYXRpdmVFdmVyeSkgcmV0dXJuIG9iai5ldmVyeShpdGVyYXRvciwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKCEocmVzdWx0ID0gcmVzdWx0ICYmIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkpIHJldHVybiBicmVha2VyO1xuICAgIH0pO1xuICAgIHJldHVybiAhIXJlc3VsdDtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgaWYgYXQgbGVhc3Qgb25lIGVsZW1lbnQgaW4gdGhlIG9iamVjdCBtYXRjaGVzIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYHNvbWVgIGlmIGF2YWlsYWJsZS5cbiAgLy8gQWxpYXNlZCBhcyBgYW55YC5cbiAgdmFyIGFueSA9IF8uc29tZSA9IF8uYW55ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGl0ZXJhdG9yIHx8IChpdGVyYXRvciA9IF8uaWRlbnRpdHkpO1xuICAgIHZhciByZXN1bHQgPSBmYWxzZTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHQ7XG4gICAgaWYgKG5hdGl2ZVNvbWUgJiYgb2JqLnNvbWUgPT09IG5hdGl2ZVNvbWUpIHJldHVybiBvYmouc29tZShpdGVyYXRvciwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKHJlc3VsdCB8fCAocmVzdWx0ID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKSkgcmV0dXJuIGJyZWFrZXI7XG4gICAgfSk7XG4gICAgcmV0dXJuICEhcmVzdWx0O1xuICB9O1xuXG4gIC8vIERldGVybWluZSBpZiB0aGUgYXJyYXkgb3Igb2JqZWN0IGNvbnRhaW5zIGEgZ2l2ZW4gdmFsdWUgKHVzaW5nIGA9PT1gKS5cbiAgLy8gQWxpYXNlZCBhcyBgaW5jbHVkZWAuXG4gIF8uY29udGFpbnMgPSBfLmluY2x1ZGUgPSBmdW5jdGlvbihvYmosIHRhcmdldCkge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChuYXRpdmVJbmRleE9mICYmIG9iai5pbmRleE9mID09PSBuYXRpdmVJbmRleE9mKSByZXR1cm4gb2JqLmluZGV4T2YodGFyZ2V0KSAhPSAtMTtcbiAgICByZXR1cm4gYW55KG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gdGFyZ2V0O1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIEludm9rZSBhIG1ldGhvZCAod2l0aCBhcmd1bWVudHMpIG9uIGV2ZXJ5IGl0ZW0gaW4gYSBjb2xsZWN0aW9uLlxuICBfLmludm9rZSA9IGZ1bmN0aW9uKG9iaiwgbWV0aG9kKSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgdmFyIGlzRnVuYyA9IF8uaXNGdW5jdGlvbihtZXRob2QpO1xuICAgIHJldHVybiBfLm1hcChvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gKGlzRnVuYyA/IG1ldGhvZCA6IHZhbHVlW21ldGhvZF0pLmFwcGx5KHZhbHVlLCBhcmdzKTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBtYXBgOiBmZXRjaGluZyBhIHByb3BlcnR5LlxuICBfLnBsdWNrID0gZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICByZXR1cm4gXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSl7IHJldHVybiB2YWx1ZVtrZXldOyB9KTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBmaWx0ZXJgOiBzZWxlY3Rpbmcgb25seSBvYmplY3RzXG4gIC8vIGNvbnRhaW5pbmcgc3BlY2lmaWMgYGtleTp2YWx1ZWAgcGFpcnMuXG4gIF8ud2hlcmUgPSBmdW5jdGlvbihvYmosIGF0dHJzLCBmaXJzdCkge1xuICAgIGlmIChfLmlzRW1wdHkoYXR0cnMpKSByZXR1cm4gZmlyc3QgPyB2b2lkIDAgOiBbXTtcbiAgICByZXR1cm4gX1tmaXJzdCA/ICdmaW5kJyA6ICdmaWx0ZXInXShvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gYXR0cnMpIHtcbiAgICAgICAgaWYgKGF0dHJzW2tleV0gIT09IHZhbHVlW2tleV0pIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYGZpbmRgOiBnZXR0aW5nIHRoZSBmaXJzdCBvYmplY3RcbiAgLy8gY29udGFpbmluZyBzcGVjaWZpYyBga2V5OnZhbHVlYCBwYWlycy5cbiAgXy5maW5kV2hlcmUgPSBmdW5jdGlvbihvYmosIGF0dHJzKSB7XG4gICAgcmV0dXJuIF8ud2hlcmUob2JqLCBhdHRycywgdHJ1ZSk7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBtYXhpbXVtIGVsZW1lbnQgb3IgKGVsZW1lbnQtYmFzZWQgY29tcHV0YXRpb24pLlxuICAvLyBDYW4ndCBvcHRpbWl6ZSBhcnJheXMgb2YgaW50ZWdlcnMgbG9uZ2VyIHRoYW4gNjUsNTM1IGVsZW1lbnRzLlxuICAvLyBTZWUgW1dlYktpdCBCdWcgODA3OTddKGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD04MDc5NylcbiAgXy5tYXggPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKCFpdGVyYXRvciAmJiBfLmlzQXJyYXkob2JqKSAmJiBvYmpbMF0gPT09ICtvYmpbMF0gJiYgb2JqLmxlbmd0aCA8IDY1NTM1KSB7XG4gICAgICByZXR1cm4gTWF0aC5tYXguYXBwbHkoTWF0aCwgb2JqKTtcbiAgICB9XG4gICAgaWYgKCFpdGVyYXRvciAmJiBfLmlzRW1wdHkob2JqKSkgcmV0dXJuIC1JbmZpbml0eTtcbiAgICB2YXIgcmVzdWx0ID0ge2NvbXB1dGVkIDogLUluZmluaXR5LCB2YWx1ZTogLUluZmluaXR5fTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICB2YXIgY29tcHV0ZWQgPSBpdGVyYXRvciA/IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSA6IHZhbHVlO1xuICAgICAgY29tcHV0ZWQgPiByZXN1bHQuY29tcHV0ZWQgJiYgKHJlc3VsdCA9IHt2YWx1ZSA6IHZhbHVlLCBjb21wdXRlZCA6IGNvbXB1dGVkfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdC52YWx1ZTtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIG1pbmltdW0gZWxlbWVudCAob3IgZWxlbWVudC1iYXNlZCBjb21wdXRhdGlvbikuXG4gIF8ubWluID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0FycmF5KG9iaikgJiYgb2JqWzBdID09PSArb2JqWzBdICYmIG9iai5sZW5ndGggPCA2NTUzNSkge1xuICAgICAgcmV0dXJuIE1hdGgubWluLmFwcGx5KE1hdGgsIG9iaik7XG4gICAgfVxuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0VtcHR5KG9iaikpIHJldHVybiBJbmZpbml0eTtcbiAgICB2YXIgcmVzdWx0ID0ge2NvbXB1dGVkIDogSW5maW5pdHksIHZhbHVlOiBJbmZpbml0eX07XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgdmFyIGNvbXB1dGVkID0gaXRlcmF0b3IgPyBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkgOiB2YWx1ZTtcbiAgICAgIGNvbXB1dGVkIDwgcmVzdWx0LmNvbXB1dGVkICYmIChyZXN1bHQgPSB7dmFsdWUgOiB2YWx1ZSwgY29tcHV0ZWQgOiBjb21wdXRlZH0pO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQudmFsdWU7XG4gIH07XG5cbiAgLy8gU2h1ZmZsZSBhbiBhcnJheSwgdXNpbmcgdGhlIG1vZGVybiB2ZXJzaW9uIG9mIHRoZSBcbiAgLy8gW0Zpc2hlci1ZYXRlcyBzaHVmZmxlXShodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Zpc2hlcuKAk1lhdGVzX3NodWZmbGUpLlxuICBfLnNodWZmbGUgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgcmFuZDtcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIHZhciBzaHVmZmxlZCA9IFtdO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmFuZCA9IF8ucmFuZG9tKGluZGV4KyspO1xuICAgICAgc2h1ZmZsZWRbaW5kZXggLSAxXSA9IHNodWZmbGVkW3JhbmRdO1xuICAgICAgc2h1ZmZsZWRbcmFuZF0gPSB2YWx1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gc2h1ZmZsZWQ7XG4gIH07XG5cbiAgLy8gU2FtcGxlICoqbioqIHJhbmRvbSB2YWx1ZXMgZnJvbSBhbiBhcnJheS5cbiAgLy8gSWYgKipuKiogaXMgbm90IHNwZWNpZmllZCwgcmV0dXJucyBhIHNpbmdsZSByYW5kb20gZWxlbWVudCBmcm9tIHRoZSBhcnJheS5cbiAgLy8gVGhlIGludGVybmFsIGBndWFyZGAgYXJndW1lbnQgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgbWFwYC5cbiAgXy5zYW1wbGUgPSBmdW5jdGlvbihvYmosIG4sIGd1YXJkKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyIHx8IGd1YXJkKSB7XG4gICAgICByZXR1cm4gb2JqW18ucmFuZG9tKG9iai5sZW5ndGggLSAxKV07XG4gICAgfVxuICAgIHJldHVybiBfLnNodWZmbGUob2JqKS5zbGljZSgwLCBNYXRoLm1heCgwLCBuKSk7XG4gIH07XG5cbiAgLy8gQW4gaW50ZXJuYWwgZnVuY3Rpb24gdG8gZ2VuZXJhdGUgbG9va3VwIGl0ZXJhdG9ycy5cbiAgdmFyIGxvb2t1cEl0ZXJhdG9yID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gXy5pc0Z1bmN0aW9uKHZhbHVlKSA/IHZhbHVlIDogZnVuY3Rpb24ob2JqKXsgcmV0dXJuIG9ialt2YWx1ZV07IH07XG4gIH07XG5cbiAgLy8gU29ydCB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uIHByb2R1Y2VkIGJ5IGFuIGl0ZXJhdG9yLlxuICBfLnNvcnRCeSA9IGZ1bmN0aW9uKG9iaiwgdmFsdWUsIGNvbnRleHQpIHtcbiAgICB2YXIgaXRlcmF0b3IgPSBsb29rdXBJdGVyYXRvcih2YWx1ZSk7XG4gICAgcmV0dXJuIF8ucGx1Y2soXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgICBjcml0ZXJpYTogaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpXG4gICAgICB9O1xuICAgIH0pLnNvcnQoZnVuY3Rpb24obGVmdCwgcmlnaHQpIHtcbiAgICAgIHZhciBhID0gbGVmdC5jcml0ZXJpYTtcbiAgICAgIHZhciBiID0gcmlnaHQuY3JpdGVyaWE7XG4gICAgICBpZiAoYSAhPT0gYikge1xuICAgICAgICBpZiAoYSA+IGIgfHwgYSA9PT0gdm9pZCAwKSByZXR1cm4gMTtcbiAgICAgICAgaWYgKGEgPCBiIHx8IGIgPT09IHZvaWQgMCkgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxlZnQuaW5kZXggLSByaWdodC5pbmRleDtcbiAgICB9KSwgJ3ZhbHVlJyk7XG4gIH07XG5cbiAgLy8gQW4gaW50ZXJuYWwgZnVuY3Rpb24gdXNlZCBmb3IgYWdncmVnYXRlIFwiZ3JvdXAgYnlcIiBvcGVyYXRpb25zLlxuICB2YXIgZ3JvdXAgPSBmdW5jdGlvbihiZWhhdmlvcikge1xuICAgIHJldHVybiBmdW5jdGlvbihvYmosIHZhbHVlLCBjb250ZXh0KSB7XG4gICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICB2YXIgaXRlcmF0b3IgPSB2YWx1ZSA9PSBudWxsID8gXy5pZGVudGl0eSA6IGxvb2t1cEl0ZXJhdG9yKHZhbHVlKTtcbiAgICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgdmFyIGtleSA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBvYmopO1xuICAgICAgICBiZWhhdmlvcihyZXN1bHQsIGtleSwgdmFsdWUpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gR3JvdXBzIHRoZSBvYmplY3QncyB2YWx1ZXMgYnkgYSBjcml0ZXJpb24uIFBhc3MgZWl0aGVyIGEgc3RyaW5nIGF0dHJpYnV0ZVxuICAvLyB0byBncm91cCBieSwgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlIGNyaXRlcmlvbi5cbiAgXy5ncm91cEJ5ID0gZ3JvdXAoZnVuY3Rpb24ocmVzdWx0LCBrZXksIHZhbHVlKSB7XG4gICAgKF8uaGFzKHJlc3VsdCwga2V5KSA/IHJlc3VsdFtrZXldIDogKHJlc3VsdFtrZXldID0gW10pKS5wdXNoKHZhbHVlKTtcbiAgfSk7XG5cbiAgLy8gSW5kZXhlcyB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uLCBzaW1pbGFyIHRvIGBncm91cEJ5YCwgYnV0IGZvclxuICAvLyB3aGVuIHlvdSBrbm93IHRoYXQgeW91ciBpbmRleCB2YWx1ZXMgd2lsbCBiZSB1bmlxdWUuXG4gIF8uaW5kZXhCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwga2V5LCB2YWx1ZSkge1xuICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gIH0pO1xuXG4gIC8vIENvdW50cyBpbnN0YW5jZXMgb2YgYW4gb2JqZWN0IHRoYXQgZ3JvdXAgYnkgYSBjZXJ0YWluIGNyaXRlcmlvbi4gUGFzc1xuICAvLyBlaXRoZXIgYSBzdHJpbmcgYXR0cmlidXRlIHRvIGNvdW50IGJ5LCBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGVcbiAgLy8gY3JpdGVyaW9uLlxuICBfLmNvdW50QnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIGtleSkge1xuICAgIF8uaGFzKHJlc3VsdCwga2V5KSA/IHJlc3VsdFtrZXldKysgOiByZXN1bHRba2V5XSA9IDE7XG4gIH0pO1xuXG4gIC8vIFVzZSBhIGNvbXBhcmF0b3IgZnVuY3Rpb24gdG8gZmlndXJlIG91dCB0aGUgc21hbGxlc3QgaW5kZXggYXQgd2hpY2hcbiAgLy8gYW4gb2JqZWN0IHNob3VsZCBiZSBpbnNlcnRlZCBzbyBhcyB0byBtYWludGFpbiBvcmRlci4gVXNlcyBiaW5hcnkgc2VhcmNoLlxuICBfLnNvcnRlZEluZGV4ID0gZnVuY3Rpb24oYXJyYXksIG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciA9IGl0ZXJhdG9yID09IG51bGwgPyBfLmlkZW50aXR5IDogbG9va3VwSXRlcmF0b3IoaXRlcmF0b3IpO1xuICAgIHZhciB2YWx1ZSA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqKTtcbiAgICB2YXIgbG93ID0gMCwgaGlnaCA9IGFycmF5Lmxlbmd0aDtcbiAgICB3aGlsZSAobG93IDwgaGlnaCkge1xuICAgICAgdmFyIG1pZCA9IChsb3cgKyBoaWdoKSA+Pj4gMTtcbiAgICAgIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgYXJyYXlbbWlkXSkgPCB2YWx1ZSA/IGxvdyA9IG1pZCArIDEgOiBoaWdoID0gbWlkO1xuICAgIH1cbiAgICByZXR1cm4gbG93O1xuICB9O1xuXG4gIC8vIFNhZmVseSBjcmVhdGUgYSByZWFsLCBsaXZlIGFycmF5IGZyb20gYW55dGhpbmcgaXRlcmFibGUuXG4gIF8udG9BcnJheSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghb2JqKSByZXR1cm4gW107XG4gICAgaWYgKF8uaXNBcnJheShvYmopKSByZXR1cm4gc2xpY2UuY2FsbChvYmopO1xuICAgIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkgcmV0dXJuIF8ubWFwKG9iaiwgXy5pZGVudGl0eSk7XG4gICAgcmV0dXJuIF8udmFsdWVzKG9iaik7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBudW1iZXIgb2YgZWxlbWVudHMgaW4gYW4gb2JqZWN0LlxuICBfLnNpemUgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiAwO1xuICAgIHJldHVybiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpID8gb2JqLmxlbmd0aCA6IF8ua2V5cyhvYmopLmxlbmd0aDtcbiAgfTtcblxuICAvLyBBcnJheSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gR2V0IHRoZSBmaXJzdCBlbGVtZW50IG9mIGFuIGFycmF5LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIHRoZSBmaXJzdCBOXG4gIC8vIHZhbHVlcyBpbiB0aGUgYXJyYXkuIEFsaWFzZWQgYXMgYGhlYWRgIGFuZCBgdGFrZWAuIFRoZSAqKmd1YXJkKiogY2hlY2tcbiAgLy8gYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLmZpcnN0ID0gXy5oZWFkID0gXy50YWtlID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiB2b2lkIDA7XG4gICAgcmV0dXJuIChuID09IG51bGwpIHx8IGd1YXJkID8gYXJyYXlbMF0gOiBzbGljZS5jYWxsKGFycmF5LCAwLCBuKTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGV2ZXJ5dGhpbmcgYnV0IHRoZSBsYXN0IGVudHJ5IG9mIHRoZSBhcnJheS4gRXNwZWNpYWxseSB1c2VmdWwgb25cbiAgLy8gdGhlIGFyZ3VtZW50cyBvYmplY3QuIFBhc3NpbmcgKipuKiogd2lsbCByZXR1cm4gYWxsIHRoZSB2YWx1ZXMgaW5cbiAgLy8gdGhlIGFycmF5LCBleGNsdWRpbmcgdGhlIGxhc3QgTi4gVGhlICoqZ3VhcmQqKiBjaGVjayBhbGxvd3MgaXQgdG8gd29yayB3aXRoXG4gIC8vIGBfLm1hcGAuXG4gIF8uaW5pdGlhbCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCAwLCBhcnJheS5sZW5ndGggLSAoKG4gPT0gbnVsbCkgfHwgZ3VhcmQgPyAxIDogbikpO1xuICB9O1xuXG4gIC8vIEdldCB0aGUgbGFzdCBlbGVtZW50IG9mIGFuIGFycmF5LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIHRoZSBsYXN0IE5cbiAgLy8gdmFsdWVzIGluIHRoZSBhcnJheS4gVGhlICoqZ3VhcmQqKiBjaGVjayBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8ubGFzdCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIGlmICgobiA9PSBudWxsKSB8fCBndWFyZCkge1xuICAgICAgcmV0dXJuIGFycmF5W2FycmF5Lmxlbmd0aCAtIDFdO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgTWF0aC5tYXgoYXJyYXkubGVuZ3RoIC0gbiwgMCkpO1xuICAgIH1cbiAgfTtcblxuICAvLyBSZXR1cm5zIGV2ZXJ5dGhpbmcgYnV0IHRoZSBmaXJzdCBlbnRyeSBvZiB0aGUgYXJyYXkuIEFsaWFzZWQgYXMgYHRhaWxgIGFuZCBgZHJvcGAuXG4gIC8vIEVzcGVjaWFsbHkgdXNlZnVsIG9uIHRoZSBhcmd1bWVudHMgb2JqZWN0LiBQYXNzaW5nIGFuICoqbioqIHdpbGwgcmV0dXJuXG4gIC8vIHRoZSByZXN0IE4gdmFsdWVzIGluIHRoZSBhcnJheS4gVGhlICoqZ3VhcmQqKlxuICAvLyBjaGVjayBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8ucmVzdCA9IF8udGFpbCA9IF8uZHJvcCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCAobiA9PSBudWxsKSB8fCBndWFyZCA/IDEgOiBuKTtcbiAgfTtcblxuICAvLyBUcmltIG91dCBhbGwgZmFsc3kgdmFsdWVzIGZyb20gYW4gYXJyYXkuXG4gIF8uY29tcGFjdCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKGFycmF5LCBfLmlkZW50aXR5KTtcbiAgfTtcblxuICAvLyBJbnRlcm5hbCBpbXBsZW1lbnRhdGlvbiBvZiBhIHJlY3Vyc2l2ZSBgZmxhdHRlbmAgZnVuY3Rpb24uXG4gIHZhciBmbGF0dGVuID0gZnVuY3Rpb24oaW5wdXQsIHNoYWxsb3csIG91dHB1dCkge1xuICAgIGlmIChzaGFsbG93ICYmIF8uZXZlcnkoaW5wdXQsIF8uaXNBcnJheSkpIHtcbiAgICAgIHJldHVybiBjb25jYXQuYXBwbHkob3V0cHV0LCBpbnB1dCk7XG4gICAgfVxuICAgIGVhY2goaW5wdXQsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBpZiAoXy5pc0FycmF5KHZhbHVlKSB8fCBfLmlzQXJndW1lbnRzKHZhbHVlKSkge1xuICAgICAgICBzaGFsbG93ID8gcHVzaC5hcHBseShvdXRwdXQsIHZhbHVlKSA6IGZsYXR0ZW4odmFsdWUsIHNoYWxsb3csIG91dHB1dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXRwdXQucHVzaCh2YWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfTtcblxuICAvLyBGbGF0dGVuIG91dCBhbiBhcnJheSwgZWl0aGVyIHJlY3Vyc2l2ZWx5IChieSBkZWZhdWx0KSwgb3IganVzdCBvbmUgbGV2ZWwuXG4gIF8uZmxhdHRlbiA9IGZ1bmN0aW9uKGFycmF5LCBzaGFsbG93KSB7XG4gICAgcmV0dXJuIGZsYXR0ZW4oYXJyYXksIHNoYWxsb3csIFtdKTtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSB2ZXJzaW9uIG9mIHRoZSBhcnJheSB0aGF0IGRvZXMgbm90IGNvbnRhaW4gdGhlIHNwZWNpZmllZCB2YWx1ZShzKS5cbiAgXy53aXRob3V0ID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICByZXR1cm4gXy5kaWZmZXJlbmNlKGFycmF5LCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICB9O1xuXG4gIC8vIFByb2R1Y2UgYSBkdXBsaWNhdGUtZnJlZSB2ZXJzaW9uIG9mIHRoZSBhcnJheS4gSWYgdGhlIGFycmF5IGhhcyBhbHJlYWR5XG4gIC8vIGJlZW4gc29ydGVkLCB5b3UgaGF2ZSB0aGUgb3B0aW9uIG9mIHVzaW5nIGEgZmFzdGVyIGFsZ29yaXRobS5cbiAgLy8gQWxpYXNlZCBhcyBgdW5pcXVlYC5cbiAgXy51bmlxID0gXy51bmlxdWUgPSBmdW5jdGlvbihhcnJheSwgaXNTb3J0ZWQsIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKF8uaXNGdW5jdGlvbihpc1NvcnRlZCkpIHtcbiAgICAgIGNvbnRleHQgPSBpdGVyYXRvcjtcbiAgICAgIGl0ZXJhdG9yID0gaXNTb3J0ZWQ7XG4gICAgICBpc1NvcnRlZCA9IGZhbHNlO1xuICAgIH1cbiAgICB2YXIgaW5pdGlhbCA9IGl0ZXJhdG9yID8gXy5tYXAoYXJyYXksIGl0ZXJhdG9yLCBjb250ZXh0KSA6IGFycmF5O1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgdmFyIHNlZW4gPSBbXTtcbiAgICBlYWNoKGluaXRpYWwsIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCkge1xuICAgICAgaWYgKGlzU29ydGVkID8gKCFpbmRleCB8fCBzZWVuW3NlZW4ubGVuZ3RoIC0gMV0gIT09IHZhbHVlKSA6ICFfLmNvbnRhaW5zKHNlZW4sIHZhbHVlKSkge1xuICAgICAgICBzZWVuLnB1c2godmFsdWUpO1xuICAgICAgICByZXN1bHRzLnB1c2goYXJyYXlbaW5kZXhdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICAvLyBQcm9kdWNlIGFuIGFycmF5IHRoYXQgY29udGFpbnMgdGhlIHVuaW9uOiBlYWNoIGRpc3RpbmN0IGVsZW1lbnQgZnJvbSBhbGwgb2ZcbiAgLy8gdGhlIHBhc3NlZC1pbiBhcnJheXMuXG4gIF8udW5pb24gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXy51bmlxKF8uZmxhdHRlbihhcmd1bWVudHMsIHRydWUpKTtcbiAgfTtcblxuICAvLyBQcm9kdWNlIGFuIGFycmF5IHRoYXQgY29udGFpbnMgZXZlcnkgaXRlbSBzaGFyZWQgYmV0d2VlbiBhbGwgdGhlXG4gIC8vIHBhc3NlZC1pbiBhcnJheXMuXG4gIF8uaW50ZXJzZWN0aW9uID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICB2YXIgcmVzdCA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gXy5maWx0ZXIoXy51bmlxKGFycmF5KSwgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgcmV0dXJuIF8uZXZlcnkocmVzdCwgZnVuY3Rpb24ob3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIF8uaW5kZXhPZihvdGhlciwgaXRlbSkgPj0gMDtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIFRha2UgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiBvbmUgYXJyYXkgYW5kIGEgbnVtYmVyIG9mIG90aGVyIGFycmF5cy5cbiAgLy8gT25seSB0aGUgZWxlbWVudHMgcHJlc2VudCBpbiBqdXN0IHRoZSBmaXJzdCBhcnJheSB3aWxsIHJlbWFpbi5cbiAgXy5kaWZmZXJlbmNlID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICB2YXIgcmVzdCA9IGNvbmNhdC5hcHBseShBcnJheVByb3RvLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIHJldHVybiBfLmZpbHRlcihhcnJheSwgZnVuY3Rpb24odmFsdWUpeyByZXR1cm4gIV8uY29udGFpbnMocmVzdCwgdmFsdWUpOyB9KTtcbiAgfTtcblxuICAvLyBaaXAgdG9nZXRoZXIgbXVsdGlwbGUgbGlzdHMgaW50byBhIHNpbmdsZSBhcnJheSAtLSBlbGVtZW50cyB0aGF0IHNoYXJlXG4gIC8vIGFuIGluZGV4IGdvIHRvZ2V0aGVyLlxuICBfLnppcCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsZW5ndGggPSBfLm1heChfLnBsdWNrKGFyZ3VtZW50cywgXCJsZW5ndGhcIikuY29uY2F0KDApKTtcbiAgICB2YXIgcmVzdWx0cyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc3VsdHNbaV0gPSBfLnBsdWNrKGFyZ3VtZW50cywgJycgKyBpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gQ29udmVydHMgbGlzdHMgaW50byBvYmplY3RzLiBQYXNzIGVpdGhlciBhIHNpbmdsZSBhcnJheSBvZiBgW2tleSwgdmFsdWVdYFxuICAvLyBwYWlycywgb3IgdHdvIHBhcmFsbGVsIGFycmF5cyBvZiB0aGUgc2FtZSBsZW5ndGggLS0gb25lIG9mIGtleXMsIGFuZCBvbmUgb2ZcbiAgLy8gdGhlIGNvcnJlc3BvbmRpbmcgdmFsdWVzLlxuICBfLm9iamVjdCA9IGZ1bmN0aW9uKGxpc3QsIHZhbHVlcykge1xuICAgIGlmIChsaXN0ID09IG51bGwpIHJldHVybiB7fTtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGxpc3QubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh2YWx1ZXMpIHtcbiAgICAgICAgcmVzdWx0W2xpc3RbaV1dID0gdmFsdWVzW2ldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0W2xpc3RbaV1bMF1dID0gbGlzdFtpXVsxXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBJZiB0aGUgYnJvd3NlciBkb2Vzbid0IHN1cHBseSB1cyB3aXRoIGluZGV4T2YgKEknbSBsb29raW5nIGF0IHlvdSwgKipNU0lFKiopLFxuICAvLyB3ZSBuZWVkIHRoaXMgZnVuY3Rpb24uIFJldHVybiB0aGUgcG9zaXRpb24gb2YgdGhlIGZpcnN0IG9jY3VycmVuY2Ugb2YgYW5cbiAgLy8gaXRlbSBpbiBhbiBhcnJheSwgb3IgLTEgaWYgdGhlIGl0ZW0gaXMgbm90IGluY2x1ZGVkIGluIHRoZSBhcnJheS5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGluZGV4T2ZgIGlmIGF2YWlsYWJsZS5cbiAgLy8gSWYgdGhlIGFycmF5IGlzIGxhcmdlIGFuZCBhbHJlYWR5IGluIHNvcnQgb3JkZXIsIHBhc3MgYHRydWVgXG4gIC8vIGZvciAqKmlzU29ydGVkKiogdG8gdXNlIGJpbmFyeSBzZWFyY2guXG4gIF8uaW5kZXhPZiA9IGZ1bmN0aW9uKGFycmF5LCBpdGVtLCBpc1NvcnRlZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gLTE7XG4gICAgdmFyIGkgPSAwLCBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG4gICAgaWYgKGlzU29ydGVkKSB7XG4gICAgICBpZiAodHlwZW9mIGlzU29ydGVkID09ICdudW1iZXInKSB7XG4gICAgICAgIGkgPSAoaXNTb3J0ZWQgPCAwID8gTWF0aC5tYXgoMCwgbGVuZ3RoICsgaXNTb3J0ZWQpIDogaXNTb3J0ZWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaSA9IF8uc29ydGVkSW5kZXgoYXJyYXksIGl0ZW0pO1xuICAgICAgICByZXR1cm4gYXJyYXlbaV0gPT09IGl0ZW0gPyBpIDogLTE7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChuYXRpdmVJbmRleE9mICYmIGFycmF5LmluZGV4T2YgPT09IG5hdGl2ZUluZGV4T2YpIHJldHVybiBhcnJheS5pbmRleE9mKGl0ZW0sIGlzU29ydGVkKTtcbiAgICBmb3IgKDsgaSA8IGxlbmd0aDsgaSsrKSBpZiAoYXJyYXlbaV0gPT09IGl0ZW0pIHJldHVybiBpO1xuICAgIHJldHVybiAtMTtcbiAgfTtcblxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgbGFzdEluZGV4T2ZgIGlmIGF2YWlsYWJsZS5cbiAgXy5sYXN0SW5kZXhPZiA9IGZ1bmN0aW9uKGFycmF5LCBpdGVtLCBmcm9tKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiAtMTtcbiAgICB2YXIgaGFzSW5kZXggPSBmcm9tICE9IG51bGw7XG4gICAgaWYgKG5hdGl2ZUxhc3RJbmRleE9mICYmIGFycmF5Lmxhc3RJbmRleE9mID09PSBuYXRpdmVMYXN0SW5kZXhPZikge1xuICAgICAgcmV0dXJuIGhhc0luZGV4ID8gYXJyYXkubGFzdEluZGV4T2YoaXRlbSwgZnJvbSkgOiBhcnJheS5sYXN0SW5kZXhPZihpdGVtKTtcbiAgICB9XG4gICAgdmFyIGkgPSAoaGFzSW5kZXggPyBmcm9tIDogYXJyYXkubGVuZ3RoKTtcbiAgICB3aGlsZSAoaS0tKSBpZiAoYXJyYXlbaV0gPT09IGl0ZW0pIHJldHVybiBpO1xuICAgIHJldHVybiAtMTtcbiAgfTtcblxuICAvLyBHZW5lcmF0ZSBhbiBpbnRlZ2VyIEFycmF5IGNvbnRhaW5pbmcgYW4gYXJpdGhtZXRpYyBwcm9ncmVzc2lvbi4gQSBwb3J0IG9mXG4gIC8vIHRoZSBuYXRpdmUgUHl0aG9uIGByYW5nZSgpYCBmdW5jdGlvbi4gU2VlXG4gIC8vIFt0aGUgUHl0aG9uIGRvY3VtZW50YXRpb25dKGh0dHA6Ly9kb2NzLnB5dGhvbi5vcmcvbGlicmFyeS9mdW5jdGlvbnMuaHRtbCNyYW5nZSkuXG4gIF8ucmFuZ2UgPSBmdW5jdGlvbihzdGFydCwgc3RvcCwgc3RlcCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDw9IDEpIHtcbiAgICAgIHN0b3AgPSBzdGFydCB8fCAwO1xuICAgICAgc3RhcnQgPSAwO1xuICAgIH1cbiAgICBzdGVwID0gYXJndW1lbnRzWzJdIHx8IDE7XG5cbiAgICB2YXIgbGVuZ3RoID0gTWF0aC5tYXgoTWF0aC5jZWlsKChzdG9wIC0gc3RhcnQpIC8gc3RlcCksIDApO1xuICAgIHZhciBpZHggPSAwO1xuICAgIHZhciByYW5nZSA9IG5ldyBBcnJheShsZW5ndGgpO1xuXG4gICAgd2hpbGUoaWR4IDwgbGVuZ3RoKSB7XG4gICAgICByYW5nZVtpZHgrK10gPSBzdGFydDtcbiAgICAgIHN0YXJ0ICs9IHN0ZXA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJhbmdlO1xuICB9O1xuXG4gIC8vIEZ1bmN0aW9uIChhaGVtKSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUmV1c2FibGUgY29uc3RydWN0b3IgZnVuY3Rpb24gZm9yIHByb3RvdHlwZSBzZXR0aW5nLlxuICB2YXIgY3RvciA9IGZ1bmN0aW9uKCl7fTtcblxuICAvLyBDcmVhdGUgYSBmdW5jdGlvbiBib3VuZCB0byBhIGdpdmVuIG9iamVjdCAoYXNzaWduaW5nIGB0aGlzYCwgYW5kIGFyZ3VtZW50cyxcbiAgLy8gb3B0aW9uYWxseSkuIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBGdW5jdGlvbi5iaW5kYCBpZlxuICAvLyBhdmFpbGFibGUuXG4gIF8uYmluZCA9IGZ1bmN0aW9uKGZ1bmMsIGNvbnRleHQpIHtcbiAgICB2YXIgYXJncywgYm91bmQ7XG4gICAgaWYgKG5hdGl2ZUJpbmQgJiYgZnVuYy5iaW5kID09PSBuYXRpdmVCaW5kKSByZXR1cm4gbmF0aXZlQmluZC5hcHBseShmdW5jLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGlmICghXy5pc0Z1bmN0aW9uKGZ1bmMpKSB0aHJvdyBuZXcgVHlwZUVycm9yO1xuICAgIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIGJvdW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgYm91bmQpKSByZXR1cm4gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgIGN0b3IucHJvdG90eXBlID0gZnVuYy5wcm90b3R5cGU7XG4gICAgICB2YXIgc2VsZiA9IG5ldyBjdG9yO1xuICAgICAgY3Rvci5wcm90b3R5cGUgPSBudWxsO1xuICAgICAgdmFyIHJlc3VsdCA9IGZ1bmMuYXBwbHkoc2VsZiwgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICBpZiAoT2JqZWN0KHJlc3VsdCkgPT09IHJlc3VsdCkgcmV0dXJuIHJlc3VsdDtcbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUGFydGlhbGx5IGFwcGx5IGEgZnVuY3Rpb24gYnkgY3JlYXRpbmcgYSB2ZXJzaW9uIHRoYXQgaGFzIGhhZCBzb21lIG9mIGl0c1xuICAvLyBhcmd1bWVudHMgcHJlLWZpbGxlZCwgd2l0aG91dCBjaGFuZ2luZyBpdHMgZHluYW1pYyBgdGhpc2AgY29udGV4dC5cbiAgXy5wYXJ0aWFsID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gQmluZCBhbGwgb2YgYW4gb2JqZWN0J3MgbWV0aG9kcyB0byB0aGF0IG9iamVjdC4gVXNlZnVsIGZvciBlbnN1cmluZyB0aGF0XG4gIC8vIGFsbCBjYWxsYmFja3MgZGVmaW5lZCBvbiBhbiBvYmplY3QgYmVsb25nIHRvIGl0LlxuICBfLmJpbmRBbGwgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgZnVuY3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgaWYgKGZ1bmNzLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IEVycm9yKFwiYmluZEFsbCBtdXN0IGJlIHBhc3NlZCBmdW5jdGlvbiBuYW1lc1wiKTtcbiAgICBlYWNoKGZ1bmNzLCBmdW5jdGlvbihmKSB7IG9ialtmXSA9IF8uYmluZChvYmpbZl0sIG9iaik7IH0pO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gTWVtb2l6ZSBhbiBleHBlbnNpdmUgZnVuY3Rpb24gYnkgc3RvcmluZyBpdHMgcmVzdWx0cy5cbiAgXy5tZW1vaXplID0gZnVuY3Rpb24oZnVuYywgaGFzaGVyKSB7XG4gICAgdmFyIG1lbW8gPSB7fTtcbiAgICBoYXNoZXIgfHwgKGhhc2hlciA9IF8uaWRlbnRpdHkpO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBrZXkgPSBoYXNoZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiBfLmhhcyhtZW1vLCBrZXkpID8gbWVtb1trZXldIDogKG1lbW9ba2V5XSA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBEZWxheXMgYSBmdW5jdGlvbiBmb3IgdGhlIGdpdmVuIG51bWJlciBvZiBtaWxsaXNlY29uZHMsIGFuZCB0aGVuIGNhbGxzXG4gIC8vIGl0IHdpdGggdGhlIGFyZ3VtZW50cyBzdXBwbGllZC5cbiAgXy5kZWxheSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpeyByZXR1cm4gZnVuYy5hcHBseShudWxsLCBhcmdzKTsgfSwgd2FpdCk7XG4gIH07XG5cbiAgLy8gRGVmZXJzIGEgZnVuY3Rpb24sIHNjaGVkdWxpbmcgaXQgdG8gcnVuIGFmdGVyIHRoZSBjdXJyZW50IGNhbGwgc3RhY2sgaGFzXG4gIC8vIGNsZWFyZWQuXG4gIF8uZGVmZXIgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgcmV0dXJuIF8uZGVsYXkuYXBwbHkoXywgW2Z1bmMsIDFdLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpKTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24sIHRoYXQsIHdoZW4gaW52b2tlZCwgd2lsbCBvbmx5IGJlIHRyaWdnZXJlZCBhdCBtb3N0IG9uY2VcbiAgLy8gZHVyaW5nIGEgZ2l2ZW4gd2luZG93IG9mIHRpbWUuIE5vcm1hbGx5LCB0aGUgdGhyb3R0bGVkIGZ1bmN0aW9uIHdpbGwgcnVuXG4gIC8vIGFzIG11Y2ggYXMgaXQgY2FuLCB3aXRob3V0IGV2ZXIgZ29pbmcgbW9yZSB0aGFuIG9uY2UgcGVyIGB3YWl0YCBkdXJhdGlvbjtcbiAgLy8gYnV0IGlmIHlvdSdkIGxpa2UgdG8gZGlzYWJsZSB0aGUgZXhlY3V0aW9uIG9uIHRoZSBsZWFkaW5nIGVkZ2UsIHBhc3NcbiAgLy8gYHtsZWFkaW5nOiBmYWxzZX1gLiBUbyBkaXNhYmxlIGV4ZWN1dGlvbiBvbiB0aGUgdHJhaWxpbmcgZWRnZSwgZGl0dG8uXG4gIF8udGhyb3R0bGUgPSBmdW5jdGlvbihmdW5jLCB3YWl0LCBvcHRpb25zKSB7XG4gICAgdmFyIGNvbnRleHQsIGFyZ3MsIHJlc3VsdDtcbiAgICB2YXIgdGltZW91dCA9IG51bGw7XG4gICAgdmFyIHByZXZpb3VzID0gMDtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcHJldmlvdXMgPSBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlID8gMCA6IG5ldyBEYXRlO1xuICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlO1xuICAgICAgaWYgKCFwcmV2aW91cyAmJiBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlKSBwcmV2aW91cyA9IG5vdztcbiAgICAgIHZhciByZW1haW5pbmcgPSB3YWl0IC0gKG5vdyAtIHByZXZpb3VzKTtcbiAgICAgIGNvbnRleHQgPSB0aGlzO1xuICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGlmIChyZW1haW5pbmcgPD0gMCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICBwcmV2aW91cyA9IG5vdztcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgIH0gZWxzZSBpZiAoIXRpbWVvdXQgJiYgb3B0aW9ucy50cmFpbGluZyAhPT0gZmFsc2UpIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHJlbWFpbmluZyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCBhcyBsb25nIGFzIGl0IGNvbnRpbnVlcyB0byBiZSBpbnZva2VkLCB3aWxsIG5vdFxuICAvLyBiZSB0cmlnZ2VyZWQuIFRoZSBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBhZnRlciBpdCBzdG9wcyBiZWluZyBjYWxsZWQgZm9yXG4gIC8vIE4gbWlsbGlzZWNvbmRzLiBJZiBgaW1tZWRpYXRlYCBpcyBwYXNzZWQsIHRyaWdnZXIgdGhlIGZ1bmN0aW9uIG9uIHRoZVxuICAvLyBsZWFkaW5nIGVkZ2UsIGluc3RlYWQgb2YgdGhlIHRyYWlsaW5nLlxuICBfLmRlYm91bmNlID0gZnVuY3Rpb24oZnVuYywgd2FpdCwgaW1tZWRpYXRlKSB7XG4gICAgdmFyIHRpbWVvdXQsIGFyZ3MsIGNvbnRleHQsIHRpbWVzdGFtcCwgcmVzdWx0O1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnRleHQgPSB0aGlzO1xuICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIHRpbWVzdGFtcCA9IG5ldyBEYXRlKCk7XG4gICAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGxhc3QgPSAobmV3IERhdGUoKSkgLSB0aW1lc3RhbXA7XG4gICAgICAgIGlmIChsYXN0IDwgd2FpdCkge1xuICAgICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0IC0gbGFzdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgICAgaWYgKCFpbW1lZGlhdGUpIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICB2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcbiAgICAgIGlmICghdGltZW91dCkge1xuICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG4gICAgICB9XG4gICAgICBpZiAoY2FsbE5vdykgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIGV4ZWN1dGVkIGF0IG1vc3Qgb25lIHRpbWUsIG5vIG1hdHRlciBob3dcbiAgLy8gb2Z0ZW4geW91IGNhbGwgaXQuIFVzZWZ1bCBmb3IgbGF6eSBpbml0aWFsaXphdGlvbi5cbiAgXy5vbmNlID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHZhciByYW4gPSBmYWxzZSwgbWVtbztcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAocmFuKSByZXR1cm4gbWVtbztcbiAgICAgIHJhbiA9IHRydWU7XG4gICAgICBtZW1vID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgZnVuYyA9IG51bGw7XG4gICAgICByZXR1cm4gbWVtbztcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgdGhlIGZpcnN0IGZ1bmN0aW9uIHBhc3NlZCBhcyBhbiBhcmd1bWVudCB0byB0aGUgc2Vjb25kLFxuICAvLyBhbGxvd2luZyB5b3UgdG8gYWRqdXN0IGFyZ3VtZW50cywgcnVuIGNvZGUgYmVmb3JlIGFuZCBhZnRlciwgYW5kXG4gIC8vIGNvbmRpdGlvbmFsbHkgZXhlY3V0ZSB0aGUgb3JpZ2luYWwgZnVuY3Rpb24uXG4gIF8ud3JhcCA9IGZ1bmN0aW9uKGZ1bmMsIHdyYXBwZXIpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncyA9IFtmdW5jXTtcbiAgICAgIHB1c2guYXBwbHkoYXJncywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB3cmFwcGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgaXMgdGhlIGNvbXBvc2l0aW9uIG9mIGEgbGlzdCBvZiBmdW5jdGlvbnMsIGVhY2hcbiAgLy8gY29uc3VtaW5nIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGZ1bmN0aW9uIHRoYXQgZm9sbG93cy5cbiAgXy5jb21wb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZ1bmNzID0gYXJndW1lbnRzO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgZm9yICh2YXIgaSA9IGZ1bmNzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGFyZ3MgPSBbZnVuY3NbaV0uYXBwbHkodGhpcywgYXJncyldO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFyZ3NbMF07XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aWxsIG9ubHkgYmUgZXhlY3V0ZWQgYWZ0ZXIgYmVpbmcgY2FsbGVkIE4gdGltZXMuXG4gIF8uYWZ0ZXIgPSBmdW5jdGlvbih0aW1lcywgZnVuYykge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICgtLXRpbWVzIDwgMSkge1xuICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfVxuICAgIH07XG4gIH07XG5cbiAgLy8gT2JqZWN0IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUmV0cmlldmUgdGhlIG5hbWVzIG9mIGFuIG9iamVjdCdzIHByb3BlcnRpZXMuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBPYmplY3Qua2V5c2BcbiAgXy5rZXlzID0gbmF0aXZlS2V5cyB8fCBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqICE9PSBPYmplY3Qob2JqKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBvYmplY3QnKTtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIGtleXMucHVzaChrZXkpO1xuICAgIHJldHVybiBrZXlzO1xuICB9O1xuXG4gIC8vIFJldHJpZXZlIHRoZSB2YWx1ZXMgb2YgYW4gb2JqZWN0J3MgcHJvcGVydGllcy5cbiAgXy52YWx1ZXMgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgIHZhciBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICB2YXIgdmFsdWVzID0gbmV3IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFsdWVzW2ldID0gb2JqW2tleXNbaV1dO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWVzO1xuICB9O1xuXG4gIC8vIENvbnZlcnQgYW4gb2JqZWN0IGludG8gYSBsaXN0IG9mIGBba2V5LCB2YWx1ZV1gIHBhaXJzLlxuICBfLnBhaXJzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgdmFyIHBhaXJzID0gbmV3IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgcGFpcnNbaV0gPSBba2V5c1tpXSwgb2JqW2tleXNbaV1dXTtcbiAgICB9XG4gICAgcmV0dXJuIHBhaXJzO1xuICB9O1xuXG4gIC8vIEludmVydCB0aGUga2V5cyBhbmQgdmFsdWVzIG9mIGFuIG9iamVjdC4gVGhlIHZhbHVlcyBtdXN0IGJlIHNlcmlhbGl6YWJsZS5cbiAgXy5pbnZlcnQgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgcmVzdWx0W29ialtrZXlzW2ldXV0gPSBrZXlzW2ldO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFJldHVybiBhIHNvcnRlZCBsaXN0IG9mIHRoZSBmdW5jdGlvbiBuYW1lcyBhdmFpbGFibGUgb24gdGhlIG9iamVjdC5cbiAgLy8gQWxpYXNlZCBhcyBgbWV0aG9kc2BcbiAgXy5mdW5jdGlvbnMgPSBfLm1ldGhvZHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgbmFtZXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICBpZiAoXy5pc0Z1bmN0aW9uKG9ialtrZXldKSkgbmFtZXMucHVzaChrZXkpO1xuICAgIH1cbiAgICByZXR1cm4gbmFtZXMuc29ydCgpO1xuICB9O1xuXG4gIC8vIEV4dGVuZCBhIGdpdmVuIG9iamVjdCB3aXRoIGFsbCB0aGUgcHJvcGVydGllcyBpbiBwYXNzZWQtaW4gb2JqZWN0KHMpLlxuICBfLmV4dGVuZCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGVhY2goc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgICBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIFJldHVybiBhIGNvcHkgb2YgdGhlIG9iamVjdCBvbmx5IGNvbnRhaW5pbmcgdGhlIHdoaXRlbGlzdGVkIHByb3BlcnRpZXMuXG4gIF8ucGljayA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBjb3B5ID0ge307XG4gICAgdmFyIGtleXMgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBlYWNoKGtleXMsIGZ1bmN0aW9uKGtleSkge1xuICAgICAgaWYgKGtleSBpbiBvYmopIGNvcHlba2V5XSA9IG9ialtrZXldO1xuICAgIH0pO1xuICAgIHJldHVybiBjb3B5O1xuICB9O1xuXG4gICAvLyBSZXR1cm4gYSBjb3B5IG9mIHRoZSBvYmplY3Qgd2l0aG91dCB0aGUgYmxhY2tsaXN0ZWQgcHJvcGVydGllcy5cbiAgXy5vbWl0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGNvcHkgPSB7fTtcbiAgICB2YXIga2V5cyA9IGNvbmNhdC5hcHBseShBcnJheVByb3RvLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgIGlmICghXy5jb250YWlucyhrZXlzLCBrZXkpKSBjb3B5W2tleV0gPSBvYmpba2V5XTtcbiAgICB9XG4gICAgcmV0dXJuIGNvcHk7XG4gIH07XG5cbiAgLy8gRmlsbCBpbiBhIGdpdmVuIG9iamVjdCB3aXRoIGRlZmF1bHQgcHJvcGVydGllcy5cbiAgXy5kZWZhdWx0cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGVhY2goc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgICBpZiAob2JqW3Byb3BdID09PSB2b2lkIDApIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gQ3JlYXRlIGEgKHNoYWxsb3ctY2xvbmVkKSBkdXBsaWNhdGUgb2YgYW4gb2JqZWN0LlxuICBfLmNsb25lID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFfLmlzT2JqZWN0KG9iaikpIHJldHVybiBvYmo7XG4gICAgcmV0dXJuIF8uaXNBcnJheShvYmopID8gb2JqLnNsaWNlKCkgOiBfLmV4dGVuZCh7fSwgb2JqKTtcbiAgfTtcblxuICAvLyBJbnZva2VzIGludGVyY2VwdG9yIHdpdGggdGhlIG9iaiwgYW5kIHRoZW4gcmV0dXJucyBvYmouXG4gIC8vIFRoZSBwcmltYXJ5IHB1cnBvc2Ugb2YgdGhpcyBtZXRob2QgaXMgdG8gXCJ0YXAgaW50b1wiIGEgbWV0aG9kIGNoYWluLCBpblxuICAvLyBvcmRlciB0byBwZXJmb3JtIG9wZXJhdGlvbnMgb24gaW50ZXJtZWRpYXRlIHJlc3VsdHMgd2l0aGluIHRoZSBjaGFpbi5cbiAgXy50YXAgPSBmdW5jdGlvbihvYmosIGludGVyY2VwdG9yKSB7XG4gICAgaW50ZXJjZXB0b3Iob2JqKTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIEludGVybmFsIHJlY3Vyc2l2ZSBjb21wYXJpc29uIGZ1bmN0aW9uIGZvciBgaXNFcXVhbGAuXG4gIHZhciBlcSA9IGZ1bmN0aW9uKGEsIGIsIGFTdGFjaywgYlN0YWNrKSB7XG4gICAgLy8gSWRlbnRpY2FsIG9iamVjdHMgYXJlIGVxdWFsLiBgMCA9PT0gLTBgLCBidXQgdGhleSBhcmVuJ3QgaWRlbnRpY2FsLlxuICAgIC8vIFNlZSB0aGUgW0hhcm1vbnkgYGVnYWxgIHByb3Bvc2FsXShodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1oYXJtb255OmVnYWwpLlxuICAgIGlmIChhID09PSBiKSByZXR1cm4gYSAhPT0gMCB8fCAxIC8gYSA9PSAxIC8gYjtcbiAgICAvLyBBIHN0cmljdCBjb21wYXJpc29uIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIGBudWxsID09IHVuZGVmaW5lZGAuXG4gICAgaWYgKGEgPT0gbnVsbCB8fCBiID09IG51bGwpIHJldHVybiBhID09PSBiO1xuICAgIC8vIFVud3JhcCBhbnkgd3JhcHBlZCBvYmplY3RzLlxuICAgIGlmIChhIGluc3RhbmNlb2YgXykgYSA9IGEuX3dyYXBwZWQ7XG4gICAgaWYgKGIgaW5zdGFuY2VvZiBfKSBiID0gYi5fd3JhcHBlZDtcbiAgICAvLyBDb21wYXJlIGBbW0NsYXNzXV1gIG5hbWVzLlxuICAgIHZhciBjbGFzc05hbWUgPSB0b1N0cmluZy5jYWxsKGEpO1xuICAgIGlmIChjbGFzc05hbWUgIT0gdG9TdHJpbmcuY2FsbChiKSkgcmV0dXJuIGZhbHNlO1xuICAgIHN3aXRjaCAoY2xhc3NOYW1lKSB7XG4gICAgICAvLyBTdHJpbmdzLCBudW1iZXJzLCBkYXRlcywgYW5kIGJvb2xlYW5zIGFyZSBjb21wYXJlZCBieSB2YWx1ZS5cbiAgICAgIGNhc2UgJ1tvYmplY3QgU3RyaW5nXSc6XG4gICAgICAgIC8vIFByaW1pdGl2ZXMgYW5kIHRoZWlyIGNvcnJlc3BvbmRpbmcgb2JqZWN0IHdyYXBwZXJzIGFyZSBlcXVpdmFsZW50OyB0aHVzLCBgXCI1XCJgIGlzXG4gICAgICAgIC8vIGVxdWl2YWxlbnQgdG8gYG5ldyBTdHJpbmcoXCI1XCIpYC5cbiAgICAgICAgcmV0dXJuIGEgPT0gU3RyaW5nKGIpO1xuICAgICAgY2FzZSAnW29iamVjdCBOdW1iZXJdJzpcbiAgICAgICAgLy8gYE5hTmBzIGFyZSBlcXVpdmFsZW50LCBidXQgbm9uLXJlZmxleGl2ZS4gQW4gYGVnYWxgIGNvbXBhcmlzb24gaXMgcGVyZm9ybWVkIGZvclxuICAgICAgICAvLyBvdGhlciBudW1lcmljIHZhbHVlcy5cbiAgICAgICAgcmV0dXJuIGEgIT0gK2EgPyBiICE9ICtiIDogKGEgPT0gMCA/IDEgLyBhID09IDEgLyBiIDogYSA9PSArYik7XG4gICAgICBjYXNlICdbb2JqZWN0IERhdGVdJzpcbiAgICAgIGNhc2UgJ1tvYmplY3QgQm9vbGVhbl0nOlxuICAgICAgICAvLyBDb2VyY2UgZGF0ZXMgYW5kIGJvb2xlYW5zIHRvIG51bWVyaWMgcHJpbWl0aXZlIHZhbHVlcy4gRGF0ZXMgYXJlIGNvbXBhcmVkIGJ5IHRoZWlyXG4gICAgICAgIC8vIG1pbGxpc2Vjb25kIHJlcHJlc2VudGF0aW9ucy4gTm90ZSB0aGF0IGludmFsaWQgZGF0ZXMgd2l0aCBtaWxsaXNlY29uZCByZXByZXNlbnRhdGlvbnNcbiAgICAgICAgLy8gb2YgYE5hTmAgYXJlIG5vdCBlcXVpdmFsZW50LlxuICAgICAgICByZXR1cm4gK2EgPT0gK2I7XG4gICAgICAvLyBSZWdFeHBzIGFyZSBjb21wYXJlZCBieSB0aGVpciBzb3VyY2UgcGF0dGVybnMgYW5kIGZsYWdzLlxuICAgICAgY2FzZSAnW29iamVjdCBSZWdFeHBdJzpcbiAgICAgICAgcmV0dXJuIGEuc291cmNlID09IGIuc291cmNlICYmXG4gICAgICAgICAgICAgICBhLmdsb2JhbCA9PSBiLmdsb2JhbCAmJlxuICAgICAgICAgICAgICAgYS5tdWx0aWxpbmUgPT0gYi5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgICAgIGEuaWdub3JlQ2FzZSA9PSBiLmlnbm9yZUNhc2U7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgYSAhPSAnb2JqZWN0JyB8fCB0eXBlb2YgYiAhPSAnb2JqZWN0JykgcmV0dXJuIGZhbHNlO1xuICAgIC8vIEFzc3VtZSBlcXVhbGl0eSBmb3IgY3ljbGljIHN0cnVjdHVyZXMuIFRoZSBhbGdvcml0aG0gZm9yIGRldGVjdGluZyBjeWNsaWNcbiAgICAvLyBzdHJ1Y3R1cmVzIGlzIGFkYXB0ZWQgZnJvbSBFUyA1LjEgc2VjdGlvbiAxNS4xMi4zLCBhYnN0cmFjdCBvcGVyYXRpb24gYEpPYC5cbiAgICB2YXIgbGVuZ3RoID0gYVN0YWNrLmxlbmd0aDtcbiAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgIC8vIExpbmVhciBzZWFyY2guIFBlcmZvcm1hbmNlIGlzIGludmVyc2VseSBwcm9wb3J0aW9uYWwgdG8gdGhlIG51bWJlciBvZlxuICAgICAgLy8gdW5pcXVlIG5lc3RlZCBzdHJ1Y3R1cmVzLlxuICAgICAgaWYgKGFTdGFja1tsZW5ndGhdID09IGEpIHJldHVybiBiU3RhY2tbbGVuZ3RoXSA9PSBiO1xuICAgIH1cbiAgICAvLyBPYmplY3RzIHdpdGggZGlmZmVyZW50IGNvbnN0cnVjdG9ycyBhcmUgbm90IGVxdWl2YWxlbnQsIGJ1dCBgT2JqZWN0YHNcbiAgICAvLyBmcm9tIGRpZmZlcmVudCBmcmFtZXMgYXJlLlxuICAgIHZhciBhQ3RvciA9IGEuY29uc3RydWN0b3IsIGJDdG9yID0gYi5jb25zdHJ1Y3RvcjtcbiAgICBpZiAoYUN0b3IgIT09IGJDdG9yICYmICEoXy5pc0Z1bmN0aW9uKGFDdG9yKSAmJiAoYUN0b3IgaW5zdGFuY2VvZiBhQ3RvcikgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5pc0Z1bmN0aW9uKGJDdG9yKSAmJiAoYkN0b3IgaW5zdGFuY2VvZiBiQ3RvcikpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIEFkZCB0aGUgZmlyc3Qgb2JqZWN0IHRvIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cy5cbiAgICBhU3RhY2sucHVzaChhKTtcbiAgICBiU3RhY2sucHVzaChiKTtcbiAgICB2YXIgc2l6ZSA9IDAsIHJlc3VsdCA9IHRydWU7XG4gICAgLy8gUmVjdXJzaXZlbHkgY29tcGFyZSBvYmplY3RzIGFuZCBhcnJheXMuXG4gICAgaWYgKGNsYXNzTmFtZSA9PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAvLyBDb21wYXJlIGFycmF5IGxlbmd0aHMgdG8gZGV0ZXJtaW5lIGlmIGEgZGVlcCBjb21wYXJpc29uIGlzIG5lY2Vzc2FyeS5cbiAgICAgIHNpemUgPSBhLmxlbmd0aDtcbiAgICAgIHJlc3VsdCA9IHNpemUgPT0gYi5sZW5ndGg7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIC8vIERlZXAgY29tcGFyZSB0aGUgY29udGVudHMsIGlnbm9yaW5nIG5vbi1udW1lcmljIHByb3BlcnRpZXMuXG4gICAgICAgIHdoaWxlIChzaXplLS0pIHtcbiAgICAgICAgICBpZiAoIShyZXN1bHQgPSBlcShhW3NpemVdLCBiW3NpemVdLCBhU3RhY2ssIGJTdGFjaykpKSBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBEZWVwIGNvbXBhcmUgb2JqZWN0cy5cbiAgICAgIGZvciAodmFyIGtleSBpbiBhKSB7XG4gICAgICAgIGlmIChfLmhhcyhhLCBrZXkpKSB7XG4gICAgICAgICAgLy8gQ291bnQgdGhlIGV4cGVjdGVkIG51bWJlciBvZiBwcm9wZXJ0aWVzLlxuICAgICAgICAgIHNpemUrKztcbiAgICAgICAgICAvLyBEZWVwIGNvbXBhcmUgZWFjaCBtZW1iZXIuXG4gICAgICAgICAgaWYgKCEocmVzdWx0ID0gXy5oYXMoYiwga2V5KSAmJiBlcShhW2tleV0sIGJba2V5XSwgYVN0YWNrLCBiU3RhY2spKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIEVuc3VyZSB0aGF0IGJvdGggb2JqZWN0cyBjb250YWluIHRoZSBzYW1lIG51bWJlciBvZiBwcm9wZXJ0aWVzLlxuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICBmb3IgKGtleSBpbiBiKSB7XG4gICAgICAgICAgaWYgKF8uaGFzKGIsIGtleSkgJiYgIShzaXplLS0pKSBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgPSAhc2l6ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gUmVtb3ZlIHRoZSBmaXJzdCBvYmplY3QgZnJvbSB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgYVN0YWNrLnBvcCgpO1xuICAgIGJTdGFjay5wb3AoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFBlcmZvcm0gYSBkZWVwIGNvbXBhcmlzb24gdG8gY2hlY2sgaWYgdHdvIG9iamVjdHMgYXJlIGVxdWFsLlxuICBfLmlzRXF1YWwgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuIGVxKGEsIGIsIFtdLCBbXSk7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiBhcnJheSwgc3RyaW5nLCBvciBvYmplY3QgZW1wdHk/XG4gIC8vIEFuIFwiZW1wdHlcIiBvYmplY3QgaGFzIG5vIGVudW1lcmFibGUgb3duLXByb3BlcnRpZXMuXG4gIF8uaXNFbXB0eSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKF8uaXNBcnJheShvYmopIHx8IF8uaXNTdHJpbmcob2JqKSkgcmV0dXJuIG9iai5sZW5ndGggPT09IDA7XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgaWYgKF8uaGFzKG9iaiwga2V5KSkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYSBET00gZWxlbWVudD9cbiAgXy5pc0VsZW1lbnQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gISEob2JqICYmIG9iai5ub2RlVHlwZSA9PT0gMSk7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhbiBhcnJheT9cbiAgLy8gRGVsZWdhdGVzIHRvIEVDTUE1J3MgbmF0aXZlIEFycmF5LmlzQXJyYXlcbiAgXy5pc0FycmF5ID0gbmF0aXZlSXNBcnJheSB8fCBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09ICdbb2JqZWN0IEFycmF5XSc7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YXJpYWJsZSBhbiBvYmplY3Q/XG4gIF8uaXNPYmplY3QgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSBPYmplY3Qob2JqKTtcbiAgfTtcblxuICAvLyBBZGQgc29tZSBpc1R5cGUgbWV0aG9kczogaXNBcmd1bWVudHMsIGlzRnVuY3Rpb24sIGlzU3RyaW5nLCBpc051bWJlciwgaXNEYXRlLCBpc1JlZ0V4cC5cbiAgZWFjaChbJ0FyZ3VtZW50cycsICdGdW5jdGlvbicsICdTdHJpbmcnLCAnTnVtYmVyJywgJ0RhdGUnLCAnUmVnRXhwJ10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBfWydpcycgKyBuYW1lXSA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCAnICsgbmFtZSArICddJztcbiAgICB9O1xuICB9KTtcblxuICAvLyBEZWZpbmUgYSBmYWxsYmFjayB2ZXJzaW9uIG9mIHRoZSBtZXRob2QgaW4gYnJvd3NlcnMgKGFoZW0sIElFKSwgd2hlcmVcbiAgLy8gdGhlcmUgaXNuJ3QgYW55IGluc3BlY3RhYmxlIFwiQXJndW1lbnRzXCIgdHlwZS5cbiAgaWYgKCFfLmlzQXJndW1lbnRzKGFyZ3VtZW50cykpIHtcbiAgICBfLmlzQXJndW1lbnRzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gISEob2JqICYmIF8uaGFzKG9iaiwgJ2NhbGxlZScpKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gT3B0aW1pemUgYGlzRnVuY3Rpb25gIGlmIGFwcHJvcHJpYXRlLlxuICBpZiAodHlwZW9mICgvLi8pICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgXy5pc0Z1bmN0aW9uID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJztcbiAgICB9O1xuICB9XG5cbiAgLy8gSXMgYSBnaXZlbiBvYmplY3QgYSBmaW5pdGUgbnVtYmVyP1xuICBfLmlzRmluaXRlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIGlzRmluaXRlKG9iaikgJiYgIWlzTmFOKHBhcnNlRmxvYXQob2JqKSk7XG4gIH07XG5cbiAgLy8gSXMgdGhlIGdpdmVuIHZhbHVlIGBOYU5gPyAoTmFOIGlzIHRoZSBvbmx5IG51bWJlciB3aGljaCBkb2VzIG5vdCBlcXVhbCBpdHNlbGYpLlxuICBfLmlzTmFOID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIF8uaXNOdW1iZXIob2JqKSAmJiBvYmogIT0gK29iajtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGEgYm9vbGVhbj9cbiAgXy5pc0Jvb2xlYW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSB0cnVlIHx8IG9iaiA9PT0gZmFsc2UgfHwgdG9TdHJpbmcuY2FsbChvYmopID09ICdbb2JqZWN0IEJvb2xlYW5dJztcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGVxdWFsIHRvIG51bGw/XG4gIF8uaXNOdWxsID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gbnVsbDtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhcmlhYmxlIHVuZGVmaW5lZD9cbiAgXy5pc1VuZGVmaW5lZCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IHZvaWQgMDtcbiAgfTtcblxuICAvLyBTaG9ydGN1dCBmdW5jdGlvbiBmb3IgY2hlY2tpbmcgaWYgYW4gb2JqZWN0IGhhcyBhIGdpdmVuIHByb3BlcnR5IGRpcmVjdGx5XG4gIC8vIG9uIGl0c2VsZiAoaW4gb3RoZXIgd29yZHMsIG5vdCBvbiBhIHByb3RvdHlwZSkuXG4gIF8uaGFzID0gZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSk7XG4gIH07XG5cbiAgLy8gVXRpbGl0eSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBSdW4gVW5kZXJzY29yZS5qcyBpbiAqbm9Db25mbGljdCogbW9kZSwgcmV0dXJuaW5nIHRoZSBgX2AgdmFyaWFibGUgdG8gaXRzXG4gIC8vIHByZXZpb3VzIG93bmVyLiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBVbmRlcnNjb3JlIG9iamVjdC5cbiAgXy5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgcm9vdC5fID0gcHJldmlvdXNVbmRlcnNjb3JlO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8vIEtlZXAgdGhlIGlkZW50aXR5IGZ1bmN0aW9uIGFyb3VuZCBmb3IgZGVmYXVsdCBpdGVyYXRvcnMuXG4gIF8uaWRlbnRpdHkgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcblxuICAvLyBSdW4gYSBmdW5jdGlvbiAqKm4qKiB0aW1lcy5cbiAgXy50aW1lcyA9IGZ1bmN0aW9uKG4sIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIGFjY3VtID0gQXJyYXkoTWF0aC5tYXgoMCwgbikpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSBhY2N1bVtpXSA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgaSk7XG4gICAgcmV0dXJuIGFjY3VtO1xuICB9O1xuXG4gIC8vIFJldHVybiBhIHJhbmRvbSBpbnRlZ2VyIGJldHdlZW4gbWluIGFuZCBtYXggKGluY2x1c2l2ZSkuXG4gIF8ucmFuZG9tID0gZnVuY3Rpb24obWluLCBtYXgpIHtcbiAgICBpZiAobWF4ID09IG51bGwpIHtcbiAgICAgIG1heCA9IG1pbjtcbiAgICAgIG1pbiA9IDA7XG4gICAgfVxuICAgIHJldHVybiBtaW4gKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpO1xuICB9O1xuXG4gIC8vIExpc3Qgb2YgSFRNTCBlbnRpdGllcyBmb3IgZXNjYXBpbmcuXG4gIHZhciBlbnRpdHlNYXAgPSB7XG4gICAgZXNjYXBlOiB7XG4gICAgICAnJic6ICcmYW1wOycsXG4gICAgICAnPCc6ICcmbHQ7JyxcbiAgICAgICc+JzogJyZndDsnLFxuICAgICAgJ1wiJzogJyZxdW90OycsXG4gICAgICBcIidcIjogJyYjeDI3OydcbiAgICB9XG4gIH07XG4gIGVudGl0eU1hcC51bmVzY2FwZSA9IF8uaW52ZXJ0KGVudGl0eU1hcC5lc2NhcGUpO1xuXG4gIC8vIFJlZ2V4ZXMgY29udGFpbmluZyB0aGUga2V5cyBhbmQgdmFsdWVzIGxpc3RlZCBpbW1lZGlhdGVseSBhYm92ZS5cbiAgdmFyIGVudGl0eVJlZ2V4ZXMgPSB7XG4gICAgZXNjYXBlOiAgIG5ldyBSZWdFeHAoJ1snICsgXy5rZXlzKGVudGl0eU1hcC5lc2NhcGUpLmpvaW4oJycpICsgJ10nLCAnZycpLFxuICAgIHVuZXNjYXBlOiBuZXcgUmVnRXhwKCcoJyArIF8ua2V5cyhlbnRpdHlNYXAudW5lc2NhcGUpLmpvaW4oJ3wnKSArICcpJywgJ2cnKVxuICB9O1xuXG4gIC8vIEZ1bmN0aW9ucyBmb3IgZXNjYXBpbmcgYW5kIHVuZXNjYXBpbmcgc3RyaW5ncyB0by9mcm9tIEhUTUwgaW50ZXJwb2xhdGlvbi5cbiAgXy5lYWNoKFsnZXNjYXBlJywgJ3VuZXNjYXBlJ10sIGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgIF9bbWV0aG9kXSA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgICAgaWYgKHN0cmluZyA9PSBudWxsKSByZXR1cm4gJyc7XG4gICAgICByZXR1cm4gKCcnICsgc3RyaW5nKS5yZXBsYWNlKGVudGl0eVJlZ2V4ZXNbbWV0aG9kXSwgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIGVudGl0eU1hcFttZXRob2RdW21hdGNoXTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIElmIHRoZSB2YWx1ZSBvZiB0aGUgbmFtZWQgYHByb3BlcnR5YCBpcyBhIGZ1bmN0aW9uIHRoZW4gaW52b2tlIGl0IHdpdGggdGhlXG4gIC8vIGBvYmplY3RgIGFzIGNvbnRleHQ7IG90aGVyd2lzZSwgcmV0dXJuIGl0LlxuICBfLnJlc3VsdCA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICBpZiAob2JqZWN0ID09IG51bGwpIHJldHVybiB2b2lkIDA7XG4gICAgdmFyIHZhbHVlID0gb2JqZWN0W3Byb3BlcnR5XTtcbiAgICByZXR1cm4gXy5pc0Z1bmN0aW9uKHZhbHVlKSA/IHZhbHVlLmNhbGwob2JqZWN0KSA6IHZhbHVlO1xuICB9O1xuXG4gIC8vIEFkZCB5b3VyIG93biBjdXN0b20gZnVuY3Rpb25zIHRvIHRoZSBVbmRlcnNjb3JlIG9iamVjdC5cbiAgXy5taXhpbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGVhY2goXy5mdW5jdGlvbnMob2JqKSwgZnVuY3Rpb24obmFtZSkge1xuICAgICAgdmFyIGZ1bmMgPSBfW25hbWVdID0gb2JqW25hbWVdO1xuICAgICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbdGhpcy5fd3JhcHBlZF07XG4gICAgICAgIHB1c2guYXBwbHkoYXJncywgYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIGZ1bmMuYXBwbHkoXywgYXJncykpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBHZW5lcmF0ZSBhIHVuaXF1ZSBpbnRlZ2VyIGlkICh1bmlxdWUgd2l0aGluIHRoZSBlbnRpcmUgY2xpZW50IHNlc3Npb24pLlxuICAvLyBVc2VmdWwgZm9yIHRlbXBvcmFyeSBET00gaWRzLlxuICB2YXIgaWRDb3VudGVyID0gMDtcbiAgXy51bmlxdWVJZCA9IGZ1bmN0aW9uKHByZWZpeCkge1xuICAgIHZhciBpZCA9ICsraWRDb3VudGVyICsgJyc7XG4gICAgcmV0dXJuIHByZWZpeCA/IHByZWZpeCArIGlkIDogaWQ7XG4gIH07XG5cbiAgLy8gQnkgZGVmYXVsdCwgVW5kZXJzY29yZSB1c2VzIEVSQi1zdHlsZSB0ZW1wbGF0ZSBkZWxpbWl0ZXJzLCBjaGFuZ2UgdGhlXG4gIC8vIGZvbGxvd2luZyB0ZW1wbGF0ZSBzZXR0aW5ncyB0byB1c2UgYWx0ZXJuYXRpdmUgZGVsaW1pdGVycy5cbiAgXy50ZW1wbGF0ZVNldHRpbmdzID0ge1xuICAgIGV2YWx1YXRlICAgIDogLzwlKFtcXHNcXFNdKz8pJT4vZyxcbiAgICBpbnRlcnBvbGF0ZSA6IC88JT0oW1xcc1xcU10rPyklPi9nLFxuICAgIGVzY2FwZSAgICAgIDogLzwlLShbXFxzXFxTXSs/KSU+L2dcbiAgfTtcblxuICAvLyBXaGVuIGN1c3RvbWl6aW5nIGB0ZW1wbGF0ZVNldHRpbmdzYCwgaWYgeW91IGRvbid0IHdhbnQgdG8gZGVmaW5lIGFuXG4gIC8vIGludGVycG9sYXRpb24sIGV2YWx1YXRpb24gb3IgZXNjYXBpbmcgcmVnZXgsIHdlIG5lZWQgb25lIHRoYXQgaXNcbiAgLy8gZ3VhcmFudGVlZCBub3QgdG8gbWF0Y2guXG4gIHZhciBub01hdGNoID0gLyguKV4vO1xuXG4gIC8vIENlcnRhaW4gY2hhcmFjdGVycyBuZWVkIHRvIGJlIGVzY2FwZWQgc28gdGhhdCB0aGV5IGNhbiBiZSBwdXQgaW50byBhXG4gIC8vIHN0cmluZyBsaXRlcmFsLlxuICB2YXIgZXNjYXBlcyA9IHtcbiAgICBcIidcIjogICAgICBcIidcIixcbiAgICAnXFxcXCc6ICAgICAnXFxcXCcsXG4gICAgJ1xccic6ICAgICAncicsXG4gICAgJ1xcbic6ICAgICAnbicsXG4gICAgJ1xcdCc6ICAgICAndCcsXG4gICAgJ1xcdTIwMjgnOiAndTIwMjgnLFxuICAgICdcXHUyMDI5JzogJ3UyMDI5J1xuICB9O1xuXG4gIHZhciBlc2NhcGVyID0gL1xcXFx8J3xcXHJ8XFxufFxcdHxcXHUyMDI4fFxcdTIwMjkvZztcblxuICAvLyBKYXZhU2NyaXB0IG1pY3JvLXRlbXBsYXRpbmcsIHNpbWlsYXIgdG8gSm9obiBSZXNpZydzIGltcGxlbWVudGF0aW9uLlxuICAvLyBVbmRlcnNjb3JlIHRlbXBsYXRpbmcgaGFuZGxlcyBhcmJpdHJhcnkgZGVsaW1pdGVycywgcHJlc2VydmVzIHdoaXRlc3BhY2UsXG4gIC8vIGFuZCBjb3JyZWN0bHkgZXNjYXBlcyBxdW90ZXMgd2l0aGluIGludGVycG9sYXRlZCBjb2RlLlxuICBfLnRlbXBsYXRlID0gZnVuY3Rpb24odGV4dCwgZGF0YSwgc2V0dGluZ3MpIHtcbiAgICB2YXIgcmVuZGVyO1xuICAgIHNldHRpbmdzID0gXy5kZWZhdWx0cyh7fSwgc2V0dGluZ3MsIF8udGVtcGxhdGVTZXR0aW5ncyk7XG5cbiAgICAvLyBDb21iaW5lIGRlbGltaXRlcnMgaW50byBvbmUgcmVndWxhciBleHByZXNzaW9uIHZpYSBhbHRlcm5hdGlvbi5cbiAgICB2YXIgbWF0Y2hlciA9IG5ldyBSZWdFeHAoW1xuICAgICAgKHNldHRpbmdzLmVzY2FwZSB8fCBub01hdGNoKS5zb3VyY2UsXG4gICAgICAoc2V0dGluZ3MuaW50ZXJwb2xhdGUgfHwgbm9NYXRjaCkuc291cmNlLFxuICAgICAgKHNldHRpbmdzLmV2YWx1YXRlIHx8IG5vTWF0Y2gpLnNvdXJjZVxuICAgIF0uam9pbignfCcpICsgJ3wkJywgJ2cnKTtcblxuICAgIC8vIENvbXBpbGUgdGhlIHRlbXBsYXRlIHNvdXJjZSwgZXNjYXBpbmcgc3RyaW5nIGxpdGVyYWxzIGFwcHJvcHJpYXRlbHkuXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc291cmNlID0gXCJfX3ArPSdcIjtcbiAgICB0ZXh0LnJlcGxhY2UobWF0Y2hlciwgZnVuY3Rpb24obWF0Y2gsIGVzY2FwZSwgaW50ZXJwb2xhdGUsIGV2YWx1YXRlLCBvZmZzZXQpIHtcbiAgICAgIHNvdXJjZSArPSB0ZXh0LnNsaWNlKGluZGV4LCBvZmZzZXQpXG4gICAgICAgIC5yZXBsYWNlKGVzY2FwZXIsIGZ1bmN0aW9uKG1hdGNoKSB7IHJldHVybiAnXFxcXCcgKyBlc2NhcGVzW21hdGNoXTsgfSk7XG5cbiAgICAgIGlmIChlc2NhcGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBlc2NhcGUgKyBcIikpPT1udWxsPycnOl8uZXNjYXBlKF9fdCkpK1xcbidcIjtcbiAgICAgIH1cbiAgICAgIGlmIChpbnRlcnBvbGF0ZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInK1xcbigoX190PShcIiArIGludGVycG9sYXRlICsgXCIpKT09bnVsbD8nJzpfX3QpK1xcbidcIjtcbiAgICAgIH1cbiAgICAgIGlmIChldmFsdWF0ZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInO1xcblwiICsgZXZhbHVhdGUgKyBcIlxcbl9fcCs9J1wiO1xuICAgICAgfVxuICAgICAgaW5kZXggPSBvZmZzZXQgKyBtYXRjaC5sZW5ndGg7XG4gICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG4gICAgc291cmNlICs9IFwiJztcXG5cIjtcblxuICAgIC8vIElmIGEgdmFyaWFibGUgaXMgbm90IHNwZWNpZmllZCwgcGxhY2UgZGF0YSB2YWx1ZXMgaW4gbG9jYWwgc2NvcGUuXG4gICAgaWYgKCFzZXR0aW5ncy52YXJpYWJsZSkgc291cmNlID0gJ3dpdGgob2JqfHx7fSl7XFxuJyArIHNvdXJjZSArICd9XFxuJztcblxuICAgIHNvdXJjZSA9IFwidmFyIF9fdCxfX3A9JycsX19qPUFycmF5LnByb3RvdHlwZS5qb2luLFwiICtcbiAgICAgIFwicHJpbnQ9ZnVuY3Rpb24oKXtfX3ArPV9fai5jYWxsKGFyZ3VtZW50cywnJyk7fTtcXG5cIiArXG4gICAgICBzb3VyY2UgKyBcInJldHVybiBfX3A7XFxuXCI7XG5cbiAgICB0cnkge1xuICAgICAgcmVuZGVyID0gbmV3IEZ1bmN0aW9uKHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonLCAnXycsIHNvdXJjZSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZS5zb3VyY2UgPSBzb3VyY2U7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cblxuICAgIGlmIChkYXRhKSByZXR1cm4gcmVuZGVyKGRhdGEsIF8pO1xuICAgIHZhciB0ZW1wbGF0ZSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiByZW5kZXIuY2FsbCh0aGlzLCBkYXRhLCBfKTtcbiAgICB9O1xuXG4gICAgLy8gUHJvdmlkZSB0aGUgY29tcGlsZWQgZnVuY3Rpb24gc291cmNlIGFzIGEgY29udmVuaWVuY2UgZm9yIHByZWNvbXBpbGF0aW9uLlxuICAgIHRlbXBsYXRlLnNvdXJjZSA9ICdmdW5jdGlvbignICsgKHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonKSArICcpe1xcbicgKyBzb3VyY2UgKyAnfSc7XG5cbiAgICByZXR1cm4gdGVtcGxhdGU7XG4gIH07XG5cbiAgLy8gQWRkIGEgXCJjaGFpblwiIGZ1bmN0aW9uLCB3aGljaCB3aWxsIGRlbGVnYXRlIHRvIHRoZSB3cmFwcGVyLlxuICBfLmNoYWluID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIF8ob2JqKS5jaGFpbigpO1xuICB9O1xuXG4gIC8vIE9PUFxuICAvLyAtLS0tLS0tLS0tLS0tLS1cbiAgLy8gSWYgVW5kZXJzY29yZSBpcyBjYWxsZWQgYXMgYSBmdW5jdGlvbiwgaXQgcmV0dXJucyBhIHdyYXBwZWQgb2JqZWN0IHRoYXRcbiAgLy8gY2FuIGJlIHVzZWQgT08tc3R5bGUuIFRoaXMgd3JhcHBlciBob2xkcyBhbHRlcmVkIHZlcnNpb25zIG9mIGFsbCB0aGVcbiAgLy8gdW5kZXJzY29yZSBmdW5jdGlvbnMuIFdyYXBwZWQgb2JqZWN0cyBtYXkgYmUgY2hhaW5lZC5cblxuICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gY29udGludWUgY2hhaW5pbmcgaW50ZXJtZWRpYXRlIHJlc3VsdHMuXG4gIHZhciByZXN1bHQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gdGhpcy5fY2hhaW4gPyBfKG9iaikuY2hhaW4oKSA6IG9iajtcbiAgfTtcblxuICAvLyBBZGQgYWxsIG9mIHRoZSBVbmRlcnNjb3JlIGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlciBvYmplY3QuXG4gIF8ubWl4aW4oXyk7XG5cbiAgLy8gQWRkIGFsbCBtdXRhdG9yIEFycmF5IGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlci5cbiAgZWFjaChbJ3BvcCcsICdwdXNoJywgJ3JldmVyc2UnLCAnc2hpZnQnLCAnc29ydCcsICdzcGxpY2UnLCAndW5zaGlmdCddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG1ldGhvZCA9IEFycmF5UHJvdG9bbmFtZV07XG4gICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBvYmogPSB0aGlzLl93cmFwcGVkO1xuICAgICAgbWV0aG9kLmFwcGx5KG9iaiwgYXJndW1lbnRzKTtcbiAgICAgIGlmICgobmFtZSA9PSAnc2hpZnQnIHx8IG5hbWUgPT0gJ3NwbGljZScpICYmIG9iai5sZW5ndGggPT09IDApIGRlbGV0ZSBvYmpbMF07XG4gICAgICByZXR1cm4gcmVzdWx0LmNhbGwodGhpcywgb2JqKTtcbiAgICB9O1xuICB9KTtcblxuICAvLyBBZGQgYWxsIGFjY2Vzc29yIEFycmF5IGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlci5cbiAgZWFjaChbJ2NvbmNhdCcsICdqb2luJywgJ3NsaWNlJ10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbWV0aG9kID0gQXJyYXlQcm90b1tuYW1lXTtcbiAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIG1ldGhvZC5hcHBseSh0aGlzLl93cmFwcGVkLCBhcmd1bWVudHMpKTtcbiAgICB9O1xuICB9KTtcblxuICBfLmV4dGVuZChfLnByb3RvdHlwZSwge1xuXG4gICAgLy8gU3RhcnQgY2hhaW5pbmcgYSB3cmFwcGVkIFVuZGVyc2NvcmUgb2JqZWN0LlxuICAgIGNoYWluOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX2NoYWluID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBFeHRyYWN0cyB0aGUgcmVzdWx0IGZyb20gYSB3cmFwcGVkIGFuZCBjaGFpbmVkIG9iamVjdC5cbiAgICB2YWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fd3JhcHBlZDtcbiAgICB9XG5cbiAgfSk7XG5cbn0pLmNhbGwodGhpcyk7XG4iXX0=
;