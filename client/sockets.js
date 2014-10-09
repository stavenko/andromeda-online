function socketService(listener){
    
    var authHashF = function(cb){
        var d = Q.defer();
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/my-auth-hash/', true);
        xhr.send();
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                 if(xhr.status == 200) {
                     var js = JSON.parse(xhr.responseText);
                     cb(js);
                     //alert/(xmlhttp.responseText);
                 }
             }
        };
        
    }
    var socket = io.connect();
    var is_ready = false;
    var Queue = [];
    
    is_authenticated = Q.defer();
    socket.on('connected', function(){
        //console.log("reconnection");
        authHashF(function(json){
            // console.log(">>>",json);
            socket.emit("auth_hash", {auth: json.hash});
        })
    })
    socket.on("auth_completed", function(msg){
        if(msg.err){
            is_authenticated.reject(msg.err);
        }else{
            //console.log(">>");
            is_authenticated.resolve(true);
            //$rootScope.$apply(function(){is_authenticated.resolve(true)})
        }
        
    })
    // console.log(is_authenticated);
    is_authenticated.promise.then(function(s,e){
        // console.log(is_authenticated, s,e);
        is_ready = true;
        for(var i =0;i <Queue.length; i++){
            socket.emit(Queue[i].T, Queue[i].p);
        }
    })
    
    var S = {};
    var cbs = {};
    var curcbix = 0;
    function getCBIx(){
        curcbix+=1;
        return curcbix % 10000;
    };
    
    var Req = function(mt, t, p){
        var d = Q.defer(),
        cbix =  getCBIx();
        cbs[cbix] = {
            cb: d
        }
        var o = {p:p};
        o.cbix = cbix;
        o.T = t;
        if(!is_ready){
            Queue.push({T:mt,p:o});
            
        }else{
            socket.emit(mt, o);
            
        }

        return d.promise;
    }
    
    var messages_to_hear = ["Q", "R", 'S'];
    _.each(messages_to_hear, function(message_type){
        socket.on(message_type, function(msg){
            // console.log("R>>>", msg);
            var cbix = msg.cbix;
            if(cbs.hasOwnProperty(cbix)) {
                cbs[cbix].cb.resolve(msg.d)
                delete cbs[cbix];
            }
        })
        
    })
    
    socket.on('F', function(data){
        listener("F", data);
    } );
    socket.on("ALM", function(data){
        listener("ALM", data);

    })
    
    S.get = function(t,p){
        return Req("Q", t,p)
    }
    S.sync = function(){
        return Req("S",'',{})
    }
    S.request = function(t,p){
        return Req("R", t,p)
    }
    S.action =function(mess){
        socket.emit("A",mess)
    }
    return S;
}

window.World.init_socket = function(){
	// console.log("init socket");
	var origin = window.location.origin
	//console.log("What if I try to do it twice");
	var socket = io.connect(origin);
	this.socket = socket;
	var self = this;
    // console.log("B");
    
    this.socket_srv = socketService(function(type, data){
        switch(type){
        case "ALM":
            // console.log(data.almanach);
            if(self.scenes[data.scene] !== undefined){
                self.scenes[data.scene].sync(data.almanach);
            }
        break;
        case "F":
            self.scenes[data.s].addNetworkMessage(data.a);
        break;
        }
    }
    
    );
    // console.log("A");
    
    var scenes_in_process = [];
    
    this.socket_srv.request("CTX",{user_id:true})
    .then(function(ctx){
        // console.log("ctx received", ctx);
        self.syncTime()
        
        var total_scenes  = 0;
        var loaded_scenes = 0;
        _.each(ctx.contexts, function(scene_desc, actor_guid){
            console.log("CTXes", scene_desc, actor_guid)
            var scene_guid = scene_desc.GUID;
            if(scenes_in_process.indexOf( scene_guid  ) !== -1){
                return;
            }else{
                scenes_in_process.push(scene_guid);
                total_scenes += 1;
            }
            var objects = scene_desc.objects;
            var scene_actors = scene_desc.actors;
            
            var ospromises = [];
            //console.log("SD", scene_desc);
            _.each(objects, function(oguid){
                //console.log("o", oguid);
                var p = self.socket_srv.get("A", {id:oguid} ) 
                .then(function(obj){
                    return self.socket_srv.get("T", {type: obj.ship_type})
                    .then(function(t){
                        obj.ship_type = t;
                        //console.log("T", obj.ship_type);
                        return obj;
                        
                    })
                })
                ospromises.push(p);
                
            })
            Q.all(ospromises).then(function(objects){
                var actors_loaded = false 
            	self.three_scenes[scene_guid] = new THREE.Scene();
                
            	var scene = new Scene(self.three_scenes[scene_guid], self)
                scene.GUID = scene_guid;
                scene.onLoadCallback = function(){

                    self.setup_scene(scene);
                    loaded_scenes +=1;
                    if(loaded_scenes === total_scenes ){
                        console.log("all_loaded");
                        self.go()
                    }
                }
                
            	self.scenes[scene_guid] = scene;

                
                _.each(scene_actors, function(act){
                    
                    if (act.GUID ===  actor_guid){
                        self.actors[actor_guid] = act;
                        self.actorScene[actor_guid] = scene_guid;
                    }
                    scene.join_actor(act);
                })
                
                
                _.each(objects, function(obj){
                    scene.join_object(obj, obj.GUID);
                })
                
                
            }).catch(function(err){
                console.log(err.stack);
            })
        })
    })
    /*
	this.socket.on('connected', function(d){
		//console.log(">>")
		
		self.socket.emit("auth_hash", {auth:self.auth_hash})
		
		// 
		
		
	})
	this.socket.on('server_fault', function(){
		// window.location = "/console/"
		// console.log("AAA");
	})
	this.socket.on('contexts', function(data){
		// Здесь мы получаем всех акторов, которые присущи для этого логина - их может оказаться несколько и для них могут быть разные сцены
        
        console.log("recieved data ", data);
		//var actors = data.actors;
		//self.actors = actors // Здесь список всех акторов, которые так или иначе связаны с нашим логином
		//console.log('actors', actors);
		self.syncTime()
		
		//var scenes = _.map(self.actors, function(actor){
		//	return actor.scene
			
		// })
		// Запрашиваем загрузку всех сцен для этого актора - по идентификаторам сцен
		
		// console.log("Req scenes", _.uniq(scenes))
		// self.socket.emit("request_scenes", {scenes:_.uniq(scenes)})
		
		// console.log("Recv Actors",actors)
		self._player_viewports = _.keys(data.context).length;
		// self.go() // после загрузки акторов попробуем запустить эмуляцию
        loaded_scenes = [];
        _.each(data.contexts, function(scene_ctx, actor_guid){
            if (scene_ctx in loaded_scenes){
                return;
            }
            var actors_in_scene = scene_ctx.actors;
            var location = scene_ctx.location;
            var object_guids = scene_ctx.objects;
            
            asyncReq = function(q){
                var d = q.defer();
                socket.emit(q.type, q.data);
            }
            
            _.each(object_guids,function(oGUID){
                oGUID
            });
        })
        
        
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
    */
	

	
}

window.World.syncTime = function(){
	this._sync_timestamp = new Date().getTime();
	var self = this;
	// var Actions = this.protobufBuilder.build("Actions");
	
	var messages = {};
	var diff_statistics_length = 50

	// console.log("RUN SYNC");
    this.socket_srv.sync().then(function(data){
        //console.log("SS", data);
		var recv_ts = new Date().getTime();
		var ping = recv_ts - self._sync_timestamp
        
        

		self.latencities.push(ping/2);
		
		self.avg_latencity = Math.floor(_.reduce(self.latencities, function(a,b){return a+b},0)/self.latencities.length)
        
		var _time_diff = data.ts - self._sync_timestamp; // - lat
		self._time_diffs.push(_time_diff)
		if(self._time_diffs.length > diff_statistics_length){self._time_diffs.splice(0,1) }
		self._time_diff = Math.floor(_.reduce(self._time_diffs, function(a,b){return a+b},0)/self._time_diffs.length)

		self.max_ping = _.max(self.pings);

		setTimeout(function(){
            // console.log("TO");
            self.syncTime()
        }, 1000);
        
    }).catch(function(err){
        console.log(err.stack);
    })
	
	//console.log(">>>>", this.socket.emit);
    /*
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
    */
};

window.World.sendAction=function(scene, action){
	var act = _.clone(action)
	act.ts += this._time_diff; 
	act.p = JSON.stringify(act.p);

	
	delete act.vector;

	this.socket_srv.action({s:scene,a:act})
};