window.SocketServiceGetter = function(listener){
    "use strict";
    if(window._socketServiceCache == undefined){
        window._socketServiceCache = function(){
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
    }else{
        return _socketServiceCache;
    }



}