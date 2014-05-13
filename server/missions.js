var Scene = require('./scene')
var u = require('./utils')
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
												 "position": [0,0.5,0],
											 	 "magazine_capacity": 100},
		 								"back":{"type":"ballistic",
		 										 "position": [0,0,2],
											 	 "magazine_capacity": 100}

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
		var new_actor_guid = u.make_short_guid()
		var controllable = {object_guid:pos.object_guid, workpoint:pos.workpoint, type: pos.control_type} // viewport:'front', controls:['Pilot', 'Turret']} 
		console.log("make actor",  pos);
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
									 'control_type': workpoint.type,
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