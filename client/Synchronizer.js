var SynchronizerGetter = (function(){

    var synchronizerCache = null;

    var Synchronizer = function(socketService){
        var MAX_DIFF_LENGTH = 10;
        var DROP_FIRST_DIFFS = 4;
        var SYNC_TIMEOUT = 1000;
            
        var that = this;

        this.lastTimestamp = 0;
        this.latencities = []
        this.timeDiffs = [];
        this.diffCount = 0;
        this.isStopped = false;
         

        this.socketSyncClosure = function(syncData){
            var currentTimeStamp = Date.now();
            var ping = currentTimeStamp - that.lastTimestamp;
            that.latencities.push(ping / 2);
            that.averageLatencity = Math.floor(that.average(that.latencities) );
            var timeDiff = syncData.ts - that.lastTimestamp;
            that.diffCount += 1;
            if(DROP_FIRST_DIFFS > that.diffCount){
                that.timeDiffs.push(timeDiff);
            }
            if(that.timeDiffs.length > MAX_DIFF_LENGTH){that.timeDiffs.splice(0,1) }
            that.timeDiff = that.average(that.timeDiffs);
            if(! that.isStopped ){
                setTimeout(function(){
                    that.syncLoop();
                }, SYNC_TIMEOUT);
            };
        }

        this.average = function(array){
            return _.reduce(array, function(a,b){return a+b}, 0) / array.length;
        }
        
        this.syncLoop = function(){
            // console.info("sync");
            this.lastTimestamp = Date.now();
            socketService.sync( ).then( this.socketSyncClosure );
        }
        
        this.getCurrentTimeDiff = function(){
            return this.timeDiff;
        }
        this.getAverageLatencity = function(){
            return this.averageLatencity;
        };
        this.start = function(){
            if (this.isStopped){
                this.isStopped = false;
                this.syncLoop();
            }
             
        }
        this.stop = function(){
            this.isStopped = true;
             
        }
    }
    var getter = function(){
        if(synchronizerCache == null){
            synchronizerCache = new Synchronizer( SocketServiceGetter() );
        }

        return synchronizerCache;
    }
    return getter;

})()
