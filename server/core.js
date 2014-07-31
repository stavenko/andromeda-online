var _     = require('underscore')
	, Scene = require('./scene')
	, Mission = require('./missions')
	, ProtoBuf = require("protobufjs")
    , DB       = require('./database')
    , q        = require('q')
	, Controller = require("./controller")
    , Utils      = require("./utils");


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
    this.assetsPerScene = {}; // assetId -> scene where it's loaded;
    this.actorPerScene = {};
	this._actors = {}; // by guid
	this._user_actors = {}; // bu user_id
    this.actorUsers = {};// user_ids by actor id
    this._user_scenes = {};
    this._actor_ascenes = {};
	this.sender = sender;
}





Simulation.prototype = {
	constructor: Simulation,
    
    
    
    /// All code below needs refactoring and mostly removing
    // Mission would be done in a very independent way to Global scenes
    
    connectRequest : function(controllableObject, callback){
        // userobject represents data about user
        // controllable - represents all workpoints on any ships be become
        // in space
        console.log("start scene with", controllableObject);
        var self = this;
        // Controllable objects изначально может быть равно единице
        var scene_guids = [];
        var obj = controllableObject;
        var assetId = obj.object_guid;
        var scene_guid = self.assetsPerScene[assetId]
        
        var initNewScene = function(){
            var asyncDBdefer = function(q_){
                var d = q.defer();
                DB.getAssets(q_, function(r){
                    d.resolve(r)
                })
                return d.promise;
            }
            var asyncObjTyper = function(os){
                // var d = q.defer();
                var ps = [];
                _.each(os, function(o){
                
                    ps.push(asyncObjTyper_(o));
                })
                return q.all(ps);
            }
            var asyncObjTyper_ = function(o){
                var d = q.defer();
                DB.getType({type:o.ship_type}, function(r){
                
                    o.ship_type = r
                    d.resolve( o );
                })
                return d.promise;
            }

            asyncDBdefer({"id": assetId})
            .then(function(asset){
                scene.location = asset.location;
                return asyncDBdefer({'location': asset.location})
            })
            .then( asyncObjTyper )
            .then(function(os){
                // console.log("FOUND", os.length, " OBJECTS");
                _.each(os, function(o){
                    //console.log("loadong")
                    scene.join_object(o, o.GUID)
                    self.assetsPerScene[o.GUID] = scene.GUID;
                    //console.log("not");
                })
                // console.log(">>");
            })
            .then(function(){
                //console.log("CC act");
        		var new_actor_guid = Utils.make_short_guid();
        		var controllable = {object_guid:obj.object_guid, workpoint:obj.name, type: obj.type} // viewport:'front', controls:['Pilot', 'Turret']} 
        		    //console.log("make actor",  controllable);
                self.addUserActor(obj.user_id, new_actor_guid, scene.GUID);
                var actor = { control: controllable, GUID:  new_actor_guid };
                scene.join_actor(actor);
                callback( { new_actor:actor, scene:scene.GUID, user_ids:[ obj.user_id ]} );
            }).catch(function(err){
                //console.log(err.stack);
                for(v in err){
                    // console.log("catch", v);
                
                }
            })       
        }
        
        if(scene_guid === undefined){
            var scene = new Scene();
            self._scenes[scene.GUID] = scene;
            initNewScene() // Просто создали сцену с актором
        }else{
            var scene = self._scenes[scene_guid];
            // теперь надо узнать, нет ли в этой сцене уже загруженного объекта?
            // Если есть - тогда просто создаем автора и возмвращаем его всем пользователям в этой сцене
            // Если нет - тогда джойним объект и потм создем актора
            if(!(assetId in scene.meshes)){
                // Нет такого объекта - джойним - этот случай мне наверняка не удастся проверить до того, как я не научусь варпать объекты из сцены в сцену
                console.log("NEED TO join object");
                
            }
            var controllable = {object_guid:obj.object_guid, workpoint:obj.name, type: obj.type};
    		var new_actor_guid = Utils.make_short_guid();
            var new_actor = {control: controllable, GUID: new_actor_guid};
            self.addUserActor(obj.user_id, new_actor_guid, scene.GUID);
            scene.join_actor( new_actor );
            var user_ids = _.map(scene.get_actors(), function(a){ return self.actorUsers[a.GUID] })
            console.log("send it to", user_ids);
            callback({ new_actor:new_actor, scene:scene.GUID, user_ids: user_ids} )
        }
        
       
    },
    
    addUserActor: function(user_id, actor_guid, sceneGuid){
        this.actorPerScene[actor_guid] = sceneGuid;
        this.actorUsers[actor_guid] = user_id;
        Utils.ix_array(this._user_actors, user_id, actor_guid);
        Utils.ix_array(this._user_scenes, user_id, sceneGuid);
        
    },
    getUserActiveContexts: function(user_id){
        // Здесь необходимо упаковать по акторам
        // {актор_гуид: {  сцена - gLocation, 
        //                 список гуидов объектов,     объекты и типы можно подгрузить клиентом - лучше делать это пошагово
        //                 список акторов в сцене }}  нужны акторы чтобы четко знать чем они управляют
        var all = {}, self = this;
        _.each(this._user_actors[user_id], function(actor_guid){
            var scene = self._scenes[ self.actorPerScene[ actor_guid] ]
            var ctx = {location: scene.location,
                       objects: _.keys( scene.meshes ),
                       actors:  scene.actors,
                       GUID: scene.GUID
            };
            all[actor_guid] = ctx;
        })
        return all;
        
    },
	getUserActors: function(user_id){
		// console.log(this._user_actors[user_id]);
		return this._user_actors[user_id]
	},
    
    
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
	getScenes:function(scene_guids){
		var scs = {},
			self = this;
		_.each(scene_guids, function(sc_guid){
			// console.log("SC", sc_guid, self._scenes)
			var scene_json = self._scenes[sc_guid].get()
			scs[sc_guid] = scene_json
			
		})
		return scs
	},
	_updateActors : function(){
		var self = this;
		_.each(this._scenes, function(sc){
			_.each(sc.get_actors(), function(as, guid){
				// console.log("actor", as, guid);
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
    sceneBCaster:function(message_type, to_actors, data){
        var scene_bcast = {"type":"mesh_action", data:data, to_actors:to_actors}
        this.sender(scene_bcast);
        
    },
	startMission:function(msg){
        
		if(msg.MGUID in this._missions){ 
			var mis = this._missions[msg.MGUID]
			mis.prepare_scene(this.sceneBCaster);
			mis.is_started = true;
			// console.log('start_mis');
			mis._scene.load();
			this._scenes[mis._scene.GUID] = mis._scene;
			this._updateActors();
		}
		
		
	},
	
	
	inject_scene : function(scene_json){
        var self = this;
		var sc = new Scene(this.sceneBCaster);
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
        // console.log("in perform_action", actions_data);
		if(self._scenes[actions_data.s] !== undefined){
			self._scenes[actions_data.s].addNetworkMessage(actions_data.a)
			var actors = self._scenes[actions_data.s].get_actors()
			// actions_data.to_actors = actors;
		
			callback(actions_data, actors);
		}
		
	},
	
	tick : function(){
		var self = this;
        
        var now = new Date().getTime();
		for (i in self._scenes){
			var sc = self._scenes[i]
            var inactivity_time = now - sc._last_user_activity;
            if(inactivity_time > 5 * 60 * 1000){
                sc.unload(function(){
                    delete self._scenes[i];
                    console.log("deleted");
                });
            }
            
            
			sc.tick();
		}
		
	},
    
    
	
	send_scene_sync : function(){
		var self = this;
		_.each(this._scenes, function(scene, scene_guid){
			var al = scene.get_almanach()
			// console.log("SYNC>>>", al);
            var actor_guids = _.keys( scene.get_actors());
            var user_ids = _.map(actor_guids, function(ag){ return self.actorUsers[ag] })
			self.sender({type:"scene_sync", user_ids:user_ids,scene:scene_guid, almanach:al})
				
			
		})
	},
	start : function(){
		var int_ = 1000/60;
		var self = this;
		// console.log("SIM started");
		this.network_actor = Controller.NetworkActor(function(){ console.log("don't do anything" )})
		this._interval_func = setInterval(function(){self.tick() }, int_)
		this._sync_func = setInterval(function(){self.send_scene_sync() },1000)
		
	}
}
module.exports.Core = Core
module.exports.Simulation = Simulation