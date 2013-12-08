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