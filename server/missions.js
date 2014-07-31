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
	var psource = {
		fuel_cell_capacity: 500, // Объем топлива
		fuel_consumption_performance: 1, // Удельная энергия топлива - 
		max_power: 6000, // Максимальная мощность источника энергии - Дж (Вт.с)
		min_power:0, // Минимальная мощность источника энергии
		powerup_speed:2, // Скорость увеличения мощности источника - джоули в секунду
		powerdown_speed:2, // Скорость уменьшения мощности источника
		capacitor:360000 // Емкость конденсатора

	};

    devices = [
    // Engines first
    //0
    {type:'engine', name:'x-', engine_type:'rotation', consumption:1000, performance:0.8, unit:[-1, 0, 0], actions:{impulse:{default_key:87}, power:{} } },
    //1
    {type:'engine', name:'x+', engine_type:'rotation', consumption:1000, performance:0.8, unit:[1, 0, 0], actions:{impulse:{default_key:83}, power:{} }},
    
    //2
    {type:'engine', name:'y+', engine_type:'rotation', consumption:1000, performance:0.8, unit:[0, 1, 0], actions:{impulse:{default_key:65}, power:{} }},
    //3
    {type:'engine', name:'y-', engine_type:'rotation', consumption:1000, performance:0.8, unit:[0, -1, 0], actions:{impulse:{default_key:68}, power:{} }},
    //4
    
    {type:'engine', name:'z+', engine_type:'rotation', consumption:1000, performance:0.8, unit:[0, 0, 1], actions:{impulse:{default_key:90}, power:{} }},
    //5
    {type:'engine', name:'z-', engine_type:'rotation', consumption:1000, performance:0.8, unit:[0, 0, -1], actions:{impulse:{default_key:67}, power:{} }},
    
    //6
    {type:'engine', name:'z+', engine_type:'propulsion', consumption:5000, performance:0.8, unit:[0, 0, -1], actions:{impulse:{default_key:38}, power:{} }},
    //7
    {type:'engine', name:'z-', engine_type:'propulsion', consumption:5000, performance:0.8, unit:[0, 0, 1], actions:{impulse:{default_key:40}, power:{} }},
    
    // Shields & engine
    //8
    {type:'power',  name:'Power Source', powerup_speed:2, powerdown_speed:2, capacitor:360000, max_power:6000, min_power:0, actions:{power:{}} },
    //9
    {type:'shield', name:'Armor',shield_type:'armor', effective_impulse:300, capacity:4000, capacitor:4000, charge_rate:500, repair_rate:300, performance:0.5, actions:{power:{}, toggle:{is_switch:true} }},
    //10
    {type:'shield', name:'Shield',shield_type:'shield', capacity:5000, capacitor:10000, charge_rate:1000, setup_energy:3000, actions:{power:{}, toggle:{is_switch:true} }},
    //11
    {type:'shield', name:'Thermal',shield_type:'thermal', effective_impulse:300, actions:{power:{}, toggle:{is_switch:true} }},
    
    // turrets, bays, drones, launchers
    //12
    {type:'turret', name:"Front turret", position: [0,0.5,0], magazine_capacity: 100, turret_shoot_rate:2000, turret_reload_rate:10000, shoot_impulse:320, actions:{fire:{ default_key:'lmouse'}, reload:{default_key:82} } },
    //13
    {type:'turret', name:"back turret", position: [0,0,2], magazine_capacity: 100, turret_shoot_rate:2000, turret_reload_rate:10000, shoot_impulse:320, actions:{fire:{ default_key:'lmouse'}, reload:{default_key:82} } },
    //14
    {type:"virtual", name:"Foreign action virtual device", actions:{"process":{}}},
    //15
    {type:"hull", name:"Hull hp", shield_type:'hull', capacity:1000, actions:{}}
    

    ]
	var shields = {
		"armor":[9],
		"shield":[10],
		thermal:[]
	};
	engines = {
		'rotation':[0,1,2,3,4,5],
		'propulsion':[6,7],
	}
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

                        devices:devices,
                        power_source:8,
                        foreign_processor:14,
                        hull_device:15,
						"workpoints":{
							"Piloting":{
									"views": ["front","back"],
									"type":"pilot",
                                    devices:[0,1,2,3,4,5,6,7,8,9,10,11]
									},
							"Front turret":
									{
									"views":["front"],
                                    
									"type":"turret",
									"turret":"front",
                                    
                                    devices:[12]
									},
						
							"Back turret":{
									"views":["back"],
									"type":"turret",
									"turret":"back",
                                    devices:[13]
                                    
						
									},
						
			
								},
								//"power_source":psource,
								shields:shields,
								
						 'engines': engines ,
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
									
                                    devices:devices,
                                    power_source:8,
                                    foreign_processor:14,
                                    hull_device:15,
                                    
            						"workpoints":{
            							"Piloting":{
            									"views": ["front","back"],
            									"type":"pilot",
                                                devices:[0,1,2,3,4,5,6,7,8,9,10,11]
            									},
            							"Front turret":
            									{
            									"views":["front"],
                                    
            									"type":"turret",
            									"turret":"front",
                                    
                                                devices:[12]
            									},
						
            							"Back turret":{
            									"views":["back"],
            									"type":"turret",
            									"turret":"back",
                                                devices:[13]
                                    
						
            									},
						
			
            								},

											// "power_source":psource,
            								shields:shields,
											 'engines': engines ,
						
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
	prepare_scene : function(bcaster){
	
		// console.log(Scene);
		if(! this._scene_loaded){
			// console.log("DO PREP SCENE")
            // console.log("TTT",bcaster);
			this._scene = new Scene(bcaster);
            this._scene.gx = this.mission.coords[0];
            this._scene.gy = this.mission.coords[1];
            this._scene.gz = this.mission.coords[2];
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