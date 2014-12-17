
var SocketServiceGetter = (function(){
    "use strict";
    var SocketService = function(){
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
                    }
                }
            };
        };
        var socket = io.connect();
        var is_ready = false;
        var Queue = [];

        var is_authenticated = Q.defer();
        socket.on('connected', function(){
            //console.log("reconnection");
            authHashF(function(json){
                // console.log(">>>",json);
                socket.emit("auth_hash", {auth: json.hash});
            })
        });
        socket.on("auth_completed", function(msg){
            if(msg.err){
                is_authenticated.reject(msg.err);
            }else{
                //console.log(">>");
                is_authenticated.resolve(true);
                //$rootScope.$apply(function(){is_authenticated.resolve(true)})
            }

        });
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
        var incomingListeners = {};
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
                var cbix = msg.cbix;
                if(cbs.hasOwnProperty(cbix)) {
                    cbs[cbix].cb.resolve(msg.d);
                    delete cbs[cbix];
                }else{
                    console.warn("No such cbix in callbacks", cbix, message_type );
                }
            })

        });

        var specialEvents = ["F", "ALM"];

        _.each(specialEvents, function(event){
            socket.on(event, function(data){
                if(event in incomingListeners){
                    _.each(incomingListeners[ event ], function(listener){
                        listener(event, data);
                    })
                }
            });

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
        S.addListener = function(event, func){
            if(!(event in incomingListeners)){
                incomingListeners[event] = [];
            }
            incomingListeners[event].push(func);
        }
        return S;
    };

    var socketServiceCache = null;
    var getter = function(){
        if( socketServiceCache == null ) {
           socketServiceCache = SocketService();
        }
        return socketServiceCache;
    }
    return getter;
})();
