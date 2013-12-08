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
