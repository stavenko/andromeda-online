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
		var p2 = [140, -110, 70];
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
	
		console.log(Scene);
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