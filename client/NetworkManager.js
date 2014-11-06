window.NetworkManager = function(){

    this._callbacks = {}
    this.on = function(event, callback){
        if(event in this._callbacks){
            this._callbacks[event].push(callback);
        }else{
            this._callbacks[event] = [callback];
        }

    };
    this.socketListener = function(type, data){
        var cbs = this._callbacks[type];
        _.each(cbs, function(cb){
            cb(data);
        })
    };

    this.socketService = SocketServiceGetter(this.socketListener.bind(this));


    // Original Socket Listener for scale
    /*
    this.socketListener = function(type, data){
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
    */

}