var CustomUpdaterGetter = (function (){
    
    var customUpdaterCache = null;

    var CustomUpdater = function(){
        this.updaterList = {};
        this.add = function( name, updater ){
            this.updaterList[name] = updater;
        }
        this.remove = function(name){
            delete this.updaterList[name]
        }
        this.update = function(){
            _.each(this.updaterList, function(func, name){
                func();
            })
        }
    }
    var updaterGetter = function(){
        if(customUpdaterCache == null){
            customUpdaterCache = new CustomUpdater();
        }
        return customUpdaterCache;
    }
    return updaterGetter;
})()
