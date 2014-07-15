
app.service('authHash',['$http', '$log', function($http, $log){
    return {
        is_inited:false,
        _hash:null,
        _init:function(cb){
            var that = this;
            this._hash = $http.get( '/my-auth-hash/')
            .then(function(resp){
                $log.log("ah", resp);
                // that._hash = data.hash;
                cb(resp.data.hash)
                
            })
            
        },
        get: function( cb ){
            this._init( cb )
            $log.log("L",this.q, this._hash);
            return this._hash; 
        }
    }
  }] )

app.factory('socket', function ($rootScope, authHash) {
    var socket = io.connect();
    socket.on('connected', function(){
        // console.log("reconnection");
        authHash.get(function(hash){
            // console.log("auth_hash", hash);
            socket.emit("auth_hash_console", {auth: hash})
            
        })
    })
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
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});

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
    socket.on("user-console", function(message){
        var message_type = message.type;
        
        angular.forEach(Listeners._listeners[message_type], function(listener){
            listener(message);
        })
        
    })
    
    return Listeners;
    
    
}])