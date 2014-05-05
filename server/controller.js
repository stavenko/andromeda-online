var THR = require('./three.node');
var Utils = require("./utils");
var _     = require('underscore');
ROTATE  = 10
ROTATEC = 11
MOVE = 12
SHOOT = 13

var Controller = {description:'controller'}
	
	
Controller.NetworkActor =   function(onAct, W){
		
		var map = Controller.ControllersActionMap()
		var self = this;
		
		this.run = function(){
			// no need to bother - event style
		}
		this.act=function(S, action, is_on, actor){
			if (W !== undefined){
				action.timestamp -= W._time_diff
			}
			var _a = map[action.controller].act(S, action, is_on, actor, onAct);
		}
		return this;
	};
Controller.LocalInputActor = function(W, socket){
		var self = this;
		self.World = W;
		var map = Controller.ControllersActionMap()
		var actor = W.login;
		self.actions_by_scene = {}
		///// ACTION TYPES 
		ROTATE  = 10
		ROTATEC = 11
		MOVE = 12
		SHOOT = 13
		
		
		
		//self.actor_login = actor_login
		self._default_actions={
		
			87: {type:ROTATE, controller:"pilot", p:{ a:0,d:-1}},
			83: {type:ROTATE, controller:"pilot",  p:{ a:0,d:1}},
			
			65: {type:ROTATE, controller:"pilot",  p:{ a:1,d:1}},
			68: {type:ROTATE, controller:"pilot",  p:{ a:1,d:-1}},
			
			90: {type:ROTATE, controller:"pilot",  p:{ a:2,d:1}},
			67: {type:ROTATE, controller:"pilot",  p:{ a:2,d:-1}},
		
		
			79: {type:ROTATEC, controller:"pilot", p:{ a:'x',d:'+'}},
			80: {type:ROTATEC, controller:"pilot", p:{ a:'x',d:'-'}},
		
			73: {type:ROTATEC, controller:"pilot", p:{ a:'y',d:'+'}},
			75: {type:ROTATEC, controller:"pilot", p:{ a:'y',d:'-'}},
		
			38: {type:MOVE, controller:"pilot", p:{ a:2,d:-1}},
			40: {type:MOVE, controller:"pilot", p:{ a:2,d:1}},
		
			'lmouse':{type: SHOOT, controller:"turret", p:{ '_turret_direction': function(t,k){
				// delete t[k]
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
				// console.log("REPLACING",W.mouse_projection_vec.clone())
				
				t[k.substr(1)] = W.mouse_projection_vec.clone() //.sub(camera_position_vector)
			}}},
		}
	
		self.actions = self._default_actions;
		self._keycodes_in_action = {}
		this.input = function(keycode, up_or_down, modifiers){
			var ts = new Date().getTime()
			
			// Updating values in event:
			
			
			if(up_or_down) {// down == true
				self._keycodes_in_action[keycode] = {in_action:true, ts:ts}
			}else{
				var t = self._keycodes_in_action[keycode].ts
				self._keycodes_in_action[keycode].in_action = false
				self._keycodes_in_action[keycode].ts = ts
				self._keycodes_in_action[keycode].delta = ts - t
				
			}
		}
		this.getLatestActions = function(scene, now){
			_.each(self._keycodes_in_action, function(k_action, keycode){
				if(k_action.in_action){
					var delta = now - k_action.ts
					var ts = now
					k_action.ts = now
					
				}else{
					var delta = k_action.delta
					var ts = k_action.ts
					delete self._keycodes_in_action[keycode]
				}
				var action = _.clone(self.actions[keycode]);
				
				if(action){
					_.each(action.p, function(item, k){
						// console.log('a');
						if (k[0] == '_'){
							item(action.p,k)
						}
					})
				
					action.delta = delta / 1000 // come to seconds
					action.ts = ts
					// console.log("Lets check if we have this controller in map:", action.type, map);
					var local_controller = map[action.controller] // Выбираем контроллер от типа действия
					var actors = W.get_main_viewport().actors // Собираем акторов в этом вьюпорте
				
					_.each(actors, function(actor){
						var S = W.scenes[actor.scene];
						var obj = S.get_objects()[actor.control.object_guid];
						var wp = obj.workpoints[actor.control.workpoint];
						if (wp.type == local_controller.type){ // Если это действие принадлежит этому актору и это контроллеру 
							//var a_clone = _.clone( action )
							action.actor = actor.GUID;
							var s = actor.scene
							if(!(s in self.actions_by_scene)){
								self.actions_by_scene[s] = []
							}
							self.actions_by_scene[s].push(action) // Генерируем акцию и складываем её в массив и передаем их для дальнейшей обработки
							//local_controller.act(self.World.scenes[actor.scene], action, up_or_down, actor, onAct);
							//a_clone.timestamp += W._time_diff;
							//if (up_or_down){
							// socket.emit('control_on', {action:a_clone, actor:actor});
								//}else{
							//	socket.emit('control_off', {action:a_clone, actor:actor});
							//}
						}
					})
				}
					
			});
			//console.log("actions_by-Scene", this.actions_by_scene, ">>", scene)
			var returnable = this.actions_by_scene[scene];
			this.actions_by_scene[scene] = []
			if(returnable === undefined){
				return []
			}
			return returnable
					
		}
			
			
			 
			
			// console.log("my diff", W._time_diff)
			
			// console.log("my time", new Date().getTime()/1000)
			// console.log("server time", action.timestamp/1000 )
			// console.log("my time - servtime", new Date().getTime()/1000 - action.timestamp/1000 )
			
			// console.log(action);
			/*
			if (action){
				//console.log(action);
				// DONE
				// 2. Act it locally
				var onAct = function(){}
				//
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
				})
			}*/
		
	};


Controller.CPilotController = function(){
	
		// Обработка события осуществляется в два этапа:
		// Первый этап - вычисления исходя из параметров события тех характеристик, которые направлены на нужный корабль (Вектора)
		// Второй этап - пересчет координат (работа двигателей)
		 
		this.type='pilot';
		this.action_types=[ROTATE, MOVE];
		var T = Controller.T();
		
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
		this.process = function(raw_action, mesh){
			// console.log("On the server", action);
			
			var process = function(object_guid, action){
				mesh.update_static_physical_data(action.ts)
				
				if (action.type === ROTATE){
					mesh.angular_impulse.add(action.vector)
				}else if(action.type === MOVE){
					if(action.vector instanceof T.Vector3){
						var v = action.vector
					}else{
						var v = new T.Vector3(action.vector.x, action.vector.y, action.vector.z)
					
					}
					var tug = v.clone().applyQuaternion(mesh.quaternion);
					mesh.impulse.add(tug);
				
				}
				
			}
			// console.log('call process',  _.has(raw_action,'vector') );
			
			if (_.has(raw_action, 'vector'))  { // Если акцию уже вычислили - будем применять все вектора на нее
				process('-', raw_action)
			}else{
				this.act_for_mesh(mesh, raw_action, process); // Если нет - то сначала вычислим их
			}
		};
		this.act_for_mesh=function(mesh, action, onAct){
			var C = mesh;
			var T = Controller.T();
			
			var ets ={};
			ets[ROTATE]='rotation';
			ets[MOVE] = 'propulsion';
			
			var et = ets[action.type]
			if(typeof action.p === 'string'){
				action.p = JSON.parse(action.p);
			}
			var AX= action.p.a;
			var ar = [0,0,0]
			ar[AX] = action.p.d
			
			var vec = new T.Vector3();
			vec.fromArray(ar);         // AX == 'x'?new T.Vector3(a,0,0):(AX =='y'?new T.Vector3(0, a, 0): new T.Vector3(0,0,a))
			// Теперь его надо умножить на мощность двигателя и получить силу
			var ea = action.p.a ==0 ? 'x' : action.p.a ==1 ? 'y': 'z'
			if(action.p.d <0){ea +='-'}else{ea += '+' }
			var power = C.engines[et][ea];
			vec.multiplyScalar(power)
			//console.log("action delta", action.ts, action.delta);
			vec.multiplyScalar(action.delta)
			action.vector = vec
			
			// Нашли все силы и возвращаем обратно событие
			// console.log("MESH", "GUID", C);
			onAct(C.json.GUID, action)
			
		},
		this.act = function(S, action,  actor, onAct_ ){
			// Эта функция создаёет акцию исходя из условий окружения
			// В данном случае нам надо создать подробно описывающее событие о том, что может и дожно происходить с кораблем
			if(S === undefined ) return;
			var C = S.mesh_for(actor);
			var onAct = function(guid, action){
				onAct_(guid, action);
			}
			this.act_for_mesh(C, action, onAct );

			
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
	
		this.act = function(S, action,  actor_guid, onAct ){
			if (S === undefined){return;}
			if (action.type === SHOOT ){
				// if(! is_down) return;
				// console.log('>>>');
				// var weapon = C.weapons[0];
				//console.log("shot by", actor)
				var T = Controller.T();
				console.log("Woah");
				
				// TODO Надо сделать простой способ проверить попадание в текующую цель исходя из данных в сообщении
				// TODO Не будем гнаться за достоверностью - проверяем достоверности попадания + вводим величину везения.
				// TODO Кратчайшее расстояние между скрещивающимися кривыми и сравнение с физическими размерами
				// TODO Умноженное на коэффициенты разброса
				// Для медленно движующихся зарадов вычислять вероятность их попадания - возможность изменить скорость цели так, чтобы попасть под обстрел или уйти от него
				// Для ракет - это будут функции захвата цели и выстрела - влияния на состояние турели.
				
				
				var seed = Math.random() // Это зерно будет использоваться для вычисления вероятностей и оно должно быть записано в сообщение - чтобы позволить серверу вычислить параметры попадания детерминированно
				// console.log(action)
				// Теперь высляем вектор выстрела в мировых координатах
				var shoot_vec = new T.Vector3(action.p.turret_direction.x,
											  action.p.turret_direction.y,
											  action.p.turret_direction.z);

				//dist
				// For all targets:
				// calculate closest distance and time to that 
				// console.log("ACTOR", actor);
				
				var C = S.mesh_for(actor_guid);
				var actor = S.actors[actor_guid];
				var object = C.json
				var wp = object.workpoints[actor.control.workpoint];
				var turret = object.turrets[ wp.turret ] 
				
				var turret_position_vector = new T.Vector3();
				turret_position_vector.fromArray(turret.position );
				
				var bullet_pos = C.position.clone()
				bullet_pos.add(  turret_position_vector.clone() )
				
				shoot_vec.sub(bullet_pos.clone())
				// Надо составить список мешей, через которые проходит луч траектории движения снаряда с учетом вероятности попадания
				var collidables = [];
				_.each(S.meshes, function(mesh, i){
					if(i ==  actor.control.object_guid) return;
					
					var target_pos = mesh.position.clone();
					var target_impulse = mesh.impulse.clone();
					var target_velocity = target_impulse.multiplyScalar(1/mesh.mass);
					
					// Увеличим скорость во много-много раз
					// shoot_vec.multiplyScalar( 100 );
					target_pos.sub( bullet_pos );
					target_velocity.sub( shoot_vec );
					
					var dot = target_pos.dot(target_velocity);
					
					
					var cosp = dot/( target_pos.length() * target_velocity.length() )
					var sinp = Math.sqrt(1 - cosp*cosp);
					
					var v = Math.abs(cosp) * target_velocity.length();
					var time = v / target_pos.length()
					var distance = sinp * target_pos.length(); // Максимальная дистанция, в которой пройдет снаряд от корабля
					
					//console.log("distance and time", distance, time);
					
					// Решение о попадании надо принимать здесь
					//  distance Может уменьшиться в зависимости от скиллов игрока и характеристик оружия
					
					// Сравнение с геометрическими размерами тела:
					var boundRadius = mesh.geometry.boundingSphere;
					// console.log("SPHERE", boundRadius.radius, distance);
					if(distance < boundRadius.radius){
						// hit 
						collidables.push({time: time, mesh:i})
						
					}
					
					// Синус - это мера попадания. При умножении её на вектор позиции мы узнаем на какой дистанции пройдет снаряд от цели
					// Косинус дает представление о времени  до контакта. Если косинус отрицательный - значит  
					// console.log("sin and cos", target_pos.toArray(), mesh.position.toArray(), sinp, cosp);
					
				});
				// Теперь, надо запихнуть это событие в очередь процессинга:
				// 1. Событие - импульс на нас, которое может включать также измение состояний внутренних приборов - например количество патронов
				// 2. В случае попадания - отправить в будущее событие об изменении импульса и состояния цели.
				
				
				if (collidables.length > 0){
					var  mesh_id = _.sortBy(collidables, function(i){ return i.time})[0].mesh
					action.hit = true;
					action.time = i.time;
					action.mesh = mesh_id;
					action.distance = distance;
					action.seed = seed;
				}else{
					action.hit = false;
				}
				onAct(C.GUID, action);
				 
				//if (actor === undefined){
					// console.log("MY", W.get_current_actor().control.object_guid)
				//	var C = S.meshes[ W.get_actor(actor).control.object_guid ]
				//}else{
				//console.log(actor, action);
				
				//var C = S.meshes[actor.control.object_guid]
				//var object = C.json
				//var wp = object.workpoints[actor.control.workpoint];
				//var turret = object.turrets[ wp.turret ] 
				// console.log(turret, C.json.turrets, C.json.workpoints, actor)
				
				
					//}
					/*
				if (action.turret_direction instanceof T.Vector3){
					var mpv = action.turret_direction
				
				}else{
					var mpv = new T.Vector3(action.p.turret_direction.x,
												action.p.turret_direction.y,
												action.p.turret_direction.z)
				}
			//	console.log(mpv)
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
					*/
			
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
			this._ControllersActionMap = {}
			//this._ControllersActionMap[MOVE]= PilotController;
			//this._ControllersActionMap[ROTATE]=PilotController;
			this._ControllersActionMap['pilot']= PilotController;
			this._ControllersActionMap['turret']= TurretController;
			
			return this._ControllersActionMap;
			
		}
	}

if(typeof window === 'undefined'){
	Controller.T = function(){
		return THR
	};
	Controller.createShotParticle=function(){
		var T = this.T();
		console.log('P');
		var cubeGeometry = new T.CubeGeometry(1,1,1,1,1,1);
		var map	= T.ImageUtils.loadTexture( "/textures/lensflare/lensflare0.png" );
		var SpriteMaterial = new T.SpriteMaterial( { map: map, color: 0xffffff, fog: true } );
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
