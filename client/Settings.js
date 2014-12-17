var Settings = (function(){

    var Service = function(){
        var USER_SETTINGS_KEY = "user-settings";
        var settings = JSON.parse(localStorage.getItem(USER_SETTINGS_KEY));
        if(settings){
            this.config = settings;
        }else{
            this.config = {};
        }


        this.getViewportBindings = function(){
            if (!(this.config['viewPortBindings'] )){
                this.config.viewPortBindings = this.defaultViewPortBindings;
                localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify( this.config ));
            }
            return this.config.viewPortBindings
        }
        this.defaultViewPortBindings = {
            "ship.rookie_ship.Piloting.front" : "default"
        }
    }
    var sc = null;
    return function(){
        if(sc == null){
            sc = new Service();
        }
        return sc;
    }


})()
