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
		_.each(Globals.Scenes, function(scene, i){
			var al = scene.get_almanach()
			// console.log(al)
			_.each(scene.actors, function(actor,i){
				var socket = Globals.Sockets[actor.login]
				socket.emit("scene_sync", al)
				
			})
			
		})
	}
	this.launch = function(){
		var int_ = 1000/60;
		var self = this;
		//this._interval_func = setInterval(function(){self.tick() }, int_)
		//this._sync_func = setInterval(function(){self.send_scene_sync() },1000)
	}
	
}
module.exports = Core