
app.service('authHash',['$http', '$log', function($http, $log){
    return {
        is_inited:false,
        _hash:null,
        _init:function(cb){
            if (this.is_inited){ return; }
            var that = this;
            this._hash = $http.get( '/my-auth-hash/')
            .then(function(resp){
                // $log.log("ah", resp);
                // that._hash = data.hash;
                cb(resp.data.hash, resp.data.user_id)
                
            })
            this.is_inited = true;
            
        },
        get: function( cb ){
            this._init( cb )
            //$log.log("L",this.q, this._hash);
            return this._hash; 
        },
    }
  }] )

app.factory('socket', ["$rootScope", "$q", "authHash",function ($rootScope,$q, authHash) {
    var socket = io.connect();
    is_authenticated = $q.defer();
    socket.on('connected', function(){
        // console.log("reconnection");
        authHash.get(function(hash, uid){
            socket.emit("auth_hash_console", {auth: hash});
        })
    })
    socket.on("auth_completed", function(msg){
        if(msg.err){
            is_authenticated.reject(msg.err);
        }else{
            is_authenticated.resolve();            
        }
        
    })
    // console.log(is_authenticated);
    is_authenticated.promise.then(function(){console.log("auth")})
    
    
  return {
    getState: function(){return "good"},
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      
      socket.emit(eventName, data, function () {
        var args = arguments;
        // console.log("emitted");
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
} ]);

app.factory("socketPromise",["$q", "$rootScope", "authHash", function( $q, $rootScope, authHash){
    var socket = io.connect();
    var is_ready = false;
    var Queue = [];
    
    is_authenticated = $q.defer();
    socket.on('connected', function(){
        // console.log("reconnection");
        authHash.get(function(hash, uid){
            socket.emit("auth_hash_console", {auth: hash});
        })
    })
    socket.on("auth_completed", function(msg){
        if(msg.err){
            is_authenticated.reject(msg.err);
        }else{
            console.log(">>");
            $rootScope.$apply(function(){is_authenticated.resolve(true)})
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
        var d = $q.defer(),
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
    
    var messages_to_hear = ["Q", "R"];
    angular.forEach(messages_to_hear, function(message_type){
        socket.on(message_type, function(msg){
            // console.log(">>>", msg);
            var cbix = msg.cbix;
            if(cbs.hasOwnProperty(cbix)) {
                $rootScope.$apply(cbs[cbix].cb.resolve(msg.d));
                delete cbs[cbix];
            }
        })
        
    })
    
    S.get = function(t,p){
        return Req("Q", t,p)
    }
    S.request = function(t,p){
        return Req("R", t,p)
    }
    return S;
}])

app.service("socketListeners",['socket', function(socket){
    // Здесь мы хотим создать службы, которая регистрирует несколько обновлений на любые входящие socket.io запросы
    var Listeners = {
        _listeners : {}
    }
    Listeners.register = function(eventType, cb) {
        if(this._listeners[eventType] == null){
            this._listeners[eventType] = [cb];
            return 0;
        }else{
            return this._listeners[eventType].push(cb) - 1; // current item index
        }
    }
    socket.on("W", function(message){
        var message_type = message.type;
        
        angular.forEach(Listeners._listeners[message_type], function(listener){
            listener(message);
        })
        
    })
    
    return Listeners;
    
    
}])