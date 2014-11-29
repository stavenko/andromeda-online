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
        authHashF(function(json){
            socket.emit("auth_hash", {auth: json.hash});
        })
    })
    socket.on("auth_completed", function(msg){
        if(msg.err){
            is_authenticated.reject(msg.err);
        }else{
            is_authenticated.resolve(true);
        }

    })
    // console.log(is_authenticated);
    is_authenticated.promise.then(function(s,e){
        // console.log(is_authenticated, s,e);
        is_ready = true;
        for(var i =0;i <Queue.length; i++){
            socket.emit(Queue[i].T, Queue[i].p);
        }
    });

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
        };
        var o = {p:p};
        o.cbix = cbix;
        o.T = t;
        if(!is_ready){
            Queue.push({T:mt,p:o});

        }else{
            socket.emit(mt, o);

        }

        return d.promise;
    };

    var messages_to_hear = ["Q", "R", 'S'];
    _.each(messages_to_hear, function(message_type){
        socket.on(message_type, function(msg){
            // console.log("R>>>", msg);
            var cbix = msg.cbix;
            if(cbs.hasOwnProperty(cbix)) {
                cbs[cbix].cb.resolve(msg.d);
                delete cbs[cbix];
            }
        })

    });

    socket.on('F', function(data){
        listener("F", data);
    } );
    socket.on("ALM", function(data){
        listener("ALM", data);

    });

    S.get = function(t,p){
        return Req("Q", t,p)
    };
    S.sync = function(){
        return Req("S",'',{})
    };
    S.request = function(t,p){
        return Req("R", t,p)
    };
    S.action =function(mess){
        socket.emit("A",mess)
    };
    return S;
}

window.World.init_socket = function(){

    var origin = window.location.origin

    var socket = io.connect(origin);
	this.socket = socket;
	var self = this;

    this.socket_srv = socketService(function(type, data){
        switch(type){
        case "ALM":

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

    var scenes_in_process = [];
    
    this.socket_srv.request("CTX",{user_id:true})
    .then(function(ctx){
        // console.log("ctx received", ctx);
        self.syncTime();
        
        var total_scenes  = 0;
        var loaded_scenes = 0;
        _.each(ctx.contexts, function(scene_desc, actor_guid){

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

            console.log("Ok?",scene_desc);
            if(scene_desc.location.g.orbit){
                ospromises.push(self.socket_srv.get("celectial-recursive", {GUID: scene_desc.location.g.orbit.C}));

            }

            _.each(objects, function(oguid){

                var p = self.socket_srv.get("A", {id:oguid} ) 
                .then(function(obj){
                    return self.socket_srv.get("T", {type: obj.ship_type})
                    .then(function(t){
                        obj.ship_type = t;

                        return obj;
                        
                    })
                })
                ospromises.push(p);
                
            })


            Q.all(ospromises).then(function(objects){


                self.celestials = {};
                _.each(objects[0], function(C){
                    self.celestials[C.GUID] = C;
                });
                objects.splice(0,1);

                var actors_loaded = false;
            	self.three_scenes[scene_guid] = new THREE.Scene();


                
            	var scene = new Scene(self.three_scenes[scene_guid], self)
                scene.GUID = scene_guid;
                scene.onLoadCallback = function(){

                    self.setup_scene(scene);
                    loaded_scenes +=1;
                    if(loaded_scenes === total_scenes ){
                        console.info("all_loaded");
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
                console.error(err.stack);
            })
        })
    })

	

	
}

window.World.syncTime = function(){
	this._sync_timestamp = new Date().getTime();
	var self = this;
	// var Actions = this.protobufBuilder.build("Actions");
	
	var messages = {};
	var diff_statistics_length = 50;


    this.socket_srv.sync().then(function(data){
    	var recv_ts = new Date().getTime();
		var ping = recv_ts - self._sync_timestamp

		self.latencities.push(ping/2);
		
		self.avg_latencity = Math.floor(_.reduce(self.latencities, function(a,b){return a+b},0)/self.latencities.length)
        
		var _time_diff = data.ts - self._sync_timestamp; // - lat
		self._time_diffs.push(_time_diff)
		if(self._time_diffs.length > diff_statistics_length){self._time_diffs.splice(0,1) }
		self._time_diff = _.reduce(self._time_diffs, function(a,b){return a+b},0)/self._time_diffs.length;


		self.max_ping = _.max(self.pings);

		setTimeout(function(){

            self.syncTime()
        }, 1000);
        
    }).catch(function(err){
        console.log(err.stack);
    })
	

};

window.World.sendAction=function(scene, action){
	var act = _.clone(action)
	act.ts += this._time_diff; 
	act.p = JSON.stringify(act.p);

	
	delete act.vector;

	this.socket_srv.action({s:scene,a:act})
};