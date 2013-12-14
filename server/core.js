var _     = require('underscore');

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
var Simulation = function(){
	var self = this;
	this._fps = 60
	
	this._scenes = {}
	
	this.inject_scene = function(scene_json){}
	this.inject_actor = function(scene_guid, actor_json){}
	this.inject_object = function(scene_guid, object_json){}
	
	this.stop_scene = function(scene_guid){}
	this.remove_actor = function(scene_guid, actor_guid){}
	this.remove_object = function(scene_guid, object_guid){}
	
	this.tick = function(){
		for (i in self.Scenes){
			var sc = self.Scenes[i]
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
	
	
	
	
	
}
module.exports = Core