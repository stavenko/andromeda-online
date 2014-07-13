window.World.init_socket = function(){
	// console.log("init socket");
	var origin = window.location.origin
	//console.log("What if I try to do it twice");
	var socket = io.connect(origin);
	this.socket = socket;
	var self = this;
	this.socket.on('connected', function(d){
		//console.log(">>")
		
		self.socket.emit("auth_hash", {auth:self.auth_hash})
		
		// 
		
		
	})
	this.socket.on('server_fault', function(){
		// window.location = "/console/"
		// console.log("AAA");
	})
	this.socket.on('actors', function(data){
		// Здесь мы получаем всех акторов, которые присущи для этого логина - их может оказаться несколько и для них могут быть разные сцены
		var actors = data.actors;
		self.actors = actors // Здесь список всех акторов, которые так или иначе связаны с нашим логином
		//console.log('actors', actors);
		self.syncTime()
		
		var scenes = _.map(self.actors, function(actor){
			return actor.scene
			
		})
		// Запрашиваем загрузку всех сцен для этого актора - по идентификаторам сцен
		
		// console.log("Req scenes", _.uniq(scenes))
		self.socket.emit("request_scenes", {scenes:_.uniq(scenes)})
		
		// console.log("Recv Actors",actors)
		// self._player_viewports = data.length;
		// self.go() // после загрузки акторов попробуем запустить эмуляцию
	})
	
	this.socket.on('scenes', function(data){
		//console.log('scenes', data.scenes);
		var guids = _.keys(data.scenes)
		var _totals = 0
		var all_loaded = function(){
			self.go();	
			// console.log("recv scenes", self.scenes)
			self.network_actor = new Controller.NetworkActor( function(){}, self)
		}
		var onload = function(scene){
			// console.log('loaded');
			var onAct = function(){
				//console.log('act on client')
			}
			_totals +=1
			self.setup_scene(scene);
			_.each(self.actors, function(a){
				if (a.GUID in scene.actors){
					self.socket.emit("actor-joined",{a:a, s:scene.GUID} )
					//console.log("this actor is for me", a.GUID, scene.GUID)
				}
				
			})
			// self.socket.emit("player-joined", {scene:scene.GUID, })
			
			// console.log("WAT",_totals, guids.length)
			if(_totals == guids.length){
				all_loaded()
			}
			// 
			// 
		}
		_.each(data.scenes, function(scene, guid){
			// console.log('well', scene);
			self.load_scene(scene , onload)
			//console.log('well', scene._scene);
			
		})
		
	})
	this.socket.on('actor-joined', function(data){
		// console.log('joining actor', data);
		// console.log(self.actors)
		// Актор может джойнить уже существующий в сцене - надо переделывать вьюпорты
		if (data.GUID in self.scenes[data.scene].actors){
			//console.log("actor already exist, first comer?")
		}else{
			self.scenes[data.scene].join_actor(data);
		}
	})
	this.socket.on('scene_sync', function(data){
		
		// console.log(data.almanach);
		if(self.scenes[data.scene] !== undefined){
			self.scenes[data.scene].sync(data.almanach);
		}
	})
	this.socket.on('player-inputs', function(data){
		console.log("RR", data);
		self.scenes[data.s].addNetworkMessage(data.a);
	})

	

	
}

window.World.syncTime = function(){
	this._sync_timestamp = new Date().getTime();
	var self = this;
	var Actions = this.protobufBuilder.build("Actions");
	
	var messages = {};

	this.socket.emit("sync_request")
	
	//console.log(">>>>", this.socket.emit);
	var diff_statistics_length = 50
	if(! this._sync_message_setup ){
		this.socket.on("clock_response", function(data){
			var recv_ts = new Date().getTime();
			var ping = recv_ts - self._sync_timestamp
			
			self.pings.push(ping)
			
			//if (self.pings.length > ping_statistics_length ){self.pings.splice(0,1)};
			//var avg_ping = _.reduce(self.pings, function(a,b){return a+b},0)/ self.pings.length;
			//self.pings_instability.push(Math.abs(avg_ping - ping))
			//if (self.pings_instability.length > ping_statistics_length){self.pings_instability.splice(0,1)};
			//var avg_ping_instab = _.reduce(self.pings_instability, function(a,b){return a>=b?a:b},0)
			
			var lat = ping / 2
			var _time_diff = data.ts - self._sync_timestamp - lat
			self._time_diffs.push(_time_diff)
			if(self._time_diffs.length > diff_statistics_length){self._time_diffs.splice(0,1) }
			self._time_diff = Math.floor(_.reduce(self._time_diffs, function(a,b){return a+b},0)/self._time_diffs.length)
			//if(self._time_diff < 0){
			//	self._time_diff = 0;
			//}
			// self.average_ping_instability = avg_ping_instab;
			self.max_ping = _.max(self.pings)
			
			// console.log("T", self._time_diff)
			//console.log("TIMES", self._time_diff, data.ts - self._sync_timestamp, lat)
			
			// var to = 100 / (avg_ping/1000)
			// var instab_per  =  avg_ping_instab / avg_ping * 100;
			//console.log("INSTV",to, avg_ping, avg_ping_instab, instab_per);
			
			setTimeout(function(){self.syncTime()}, 1000);
			
		})
		this._sync_message_setup = true
		
	}
};

window.World.sendAction=function(scene, action){
	var act = _.clone(action)
	act.ts += this._time_diff; 
	act.p = JSON.stringify(act.p);
	console.log("act before sending", act.ident)
	
	delete act.vector;

	this.socket.emit("user_actions", {s:scene,a:act})
};