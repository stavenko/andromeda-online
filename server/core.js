var _     = require('underscore')
	, Scene = require('./scene')
	, Mission = require('./missions')
	, ProtoBuf = require("protobufjs")
	, Controller = require("./controller");


var Core = function(Globals){
	this._interval = 60
	
	this.tick = function(){
		// console.log('tiking;
		for (i in Globals.Scenes){
			var sc = Globals.Scenes[i]
			//console.log(sc._scene)
			//sc._scene.updateMatrixWorld();
			sc.tick();
		}
		
	}
	this.send_scene_sync = function(){
		_.each(Globals.Scenes, function(scene, scene_guid){
			var al = scene.get_almanach()
			// console.log(al)
			_.each(scene.actors, function(actor,login){
				if (_.has(Globals.Sockets, login)){
					var socket = Globals.Sockets[login]
					// console.log("SCENE EMIT", actor,i, _.keys(Globals.Sockets))
					socket.emit("scene_sync", {scene:scene_guid, almanach:al})
				}
				
			})
			
		})
	}
	this.launch = function(){
		var int_ = 1000/60;
		var self = this;
		this._interval_func = setInterval(function(){self.tick() }, int_)
		this._sync_func = setInterval(function(){self.send_scene_sync() },1000)
	}
	
}
var Simulation = function(sender){
	var self = this;
	this._fps = 60
	this._missions = {};
	this._user_missions = {};
	this._public_positions = [];
	this._org_positions = {};
	this._friends_positions={};
	this.protoBuilder = ProtoBuf.loadProtoFile("./public/js/gl/client_message.proto" )
	
	this._scenes = {}; // by guid
	this._actors = {}; // by guid
	this._user_actors = {}; // bu user_id
	this.sender = sender;
}





Simulation.prototype = {
	constructor: Simulation,
	newMissionInstance : function(mission_type, instantiator_id, callback){
		var M = new Mission(mission_type)
		var self = this;
		var cb = function(mission){
			self._missions[mission.GUID] = mission;
			//console.log("ML", (instantiator_id in self._user_missions));
			if(!(instantiator_id in self._user_missions)){
				self._user_missions[instantiator_id] = [mission];
			}else{
				self._user_missions[instantiator_id].push(mission);
			}
			//console.log("UML", self._user_missions);
			callback(mission, self._user_missions[instantiator_id] ); // 
		}
		//console.log("NMI");
		M.create(instantiator_id, cb);
	},
	getMission:function(guid){
		return this._missions[guid];
	},
	getMissionPositions:function(guid){
		// console.log(this._missions, guid);
		if(guid in this._missions){
			return this._missions[guid].positions();
		}else{
			return []
		}
	},
	sharePosition: function(msg){
		// console.log(msg);
		if (msg.share_type === 'public'){
			//console.log("sharing", msg);
			this._missions[msg.MGUID]._positions[msg.position].shared= msg.share_type
			
			this._public_positions.push(this._missions[msg.MGUID]._positions[msg.position])
		}
	},
	getPublicPositions : function(){ 
		return this._public_positions
	},
	getFriendsPositions : function(){
		return [];
	},
	getOrgPositions : function(){
		return [];
	},
	
	getUserPositions: function(user_id){
		var my_poses = []
		var friends_positions = this.getFriendsPositions(user_id)
		var org_positions = this.getOrgPositions(user_id)
		var public_positions = this.getPublicPositions()
		// console.log("V", my_poses)
		var res = my_poses.concat(friends_positions, org_positions, public_positions);
		// console.log(">", my_poses, res);
		return res;
		
		
	},
	getUserMissions:function(user_id){
		if (this._user_missions[user_id] !== undefined) {
			
			console.log(this._user_missions[user_id]);
			return _.map(this._user_missions[user_id], function(m){ if('mission' in m){var mm =m.mission;mm.GUID = m.GUID; return mm}else{ return m }})
		}else{
			return []
		}
	},
	getUserActors: function(user_id){
		console.log(this._user_actors);
		return this._user_actors[user_id]
	},
	getScenes:function(scene_guids){
		var scs = {},
			self = this;
		_.each(scene_guids, function(sc_guid){
			console.log("SC", sc_guid, self._scenes)
			var scene_json = self._scenes[sc_guid].get()
			scs[sc_guid] = scene_json
			
		})
		return scs
	},
	_updateActors : function(){
		var self = this;
		_.each(this._scenes, function(sc){
			_.each(sc.get_actors(), function(as, guid){
				console.log("actor", as, guid);
				self._actors[guid] = as
				if(self._user_actors[as.user_id] === undefined){
					self._user_actors[as.user_id] ={};
					 self._user_actors[as.user_id][as.GUID]= as;
				}else{
					self._user_actors[as.user_id][as.GUID] = as; 
				}
			})
		})
	},
	
	joinPosition:function(msg){
		//console.log(msg);
		//console.log('join', msg);
		if (this._missions[msg.MGUID]){
			this._missions[msg.MGUID].join_player(msg.user_id, msg.position)
			this._updateActors();
		}
		
	},
	startMission:function(msg){
		if(msg.MGUID in this._missions){ 
			var mis = this._missions[msg.MGUID]
			mis.prepare_scene();
			mis.is_started = true;
			console.log('start_mis');
			mis._scene.load();
			this._scenes[mis._scene.GUID] = mis._scene;
			this._updateActors();
		}
		
		
	},
	
	
	inject_scene : function(scene_json){
		var sc = new Scene()
		//console.log("make")
		sc.set_from_json(scene_json)
		//console.log("made")
		sc.load(); // ok
		//console.log("loaded", sc);
		this._scenes[scene_json.GUID] = sc;
	},
	joinActor:function(to_scene, actor, callback){
		if(actor.GUID in this._scenes[to_scene].actors){
			
		}else{
			this._scenes[to_scene].joinActor(actor)
		}
		var to_actors = this._scenes[to_scene].actors
		callback(to_actors, actor);
	},
	inject_actor : function(scene_guid, actor_json){
		this._scenes[scene_guid].join_actor(actor_json);
		
	},
	inject_object : function(scene_guid, object_json){
		this._scenes[scene_guid].join_object(actor_json);
		
	},
	
	stop_scene : function(scene_guid){
		// Save then ....
		delete this._scenes[scene_guid]
		
	},
	remove_actor : function(scene_guid, actor_guid){},
	remove_object : function(scene_guid, object_guid){},
	
	action : function(action, on_off){
		var act = action.action;
		var actor = action.actor;
		var S = this._scenes[actor.scene];
		this.network_actor.act(S, act, on_off, actor);
	},
	performAction:function(actions_data, callback){
		var self = this;
		
		// No checks for now
		if(self._scenes[actions_data.s] !== undefined){
			self._scenes[actions_data.s].addNetworkMessage(actions_data.a)
			var actors = self._scenes[actions_data.s].get_actors()
			// actions_data.to_actors = actors;
		
			callback(actions_data, actors);
		}
		/*
		_.each(actions_data.actions, function(messages, scene_guid){
			// console.log("to sc", messages, scene_guid);
			if(scene_guid in self._scenes && messages){
				
				actions = self.protoBuilder.build('Actions')
				message = actions.decode64(messages)
				console.log(message);
				
				self._scenes[scene_guid].addNetworkMessages(message.inputs);
			}
		}) */
	},
	
	tick : function(){
		var self = this;
		//console.log('ticking');
		
		for (i in self._scenes){
			var sc = self._scenes[i]
			//console.log(sc._scene)
			//sc._scene.updateMatrixWorld();
			sc.tick();
		}
		
	},
	
	send_scene_sync : function(){
		var self = this;
		_.each(this._scenes, function(scene, scene_guid){
			var al = scene.get_almanach()
			self.sender({type:"scene_sync", scene:scene_guid, almanach:al})
				
			
		})
	},
	start : function(){
		var int_ = 1000/60;
		var self = this;
		console.log("SIM started");
		this.network_actor = Controller.NetworkActor(function(){ console.log("don't do anything" )})
		this._interval_func = setInterval(function(){self.tick() }, int_)
		this._sync_func = setInterval(function(){self.send_scene_sync() },1000)
		
	}
}
module.exports.Core = Core
module.exports.Simulation = Simulation