var Synchronizer = function(socketService){
    var MAX_DIFF_LENGTH = 10;
    var DROP_FIRST_DIFFS = 4;
    var SYNC_TIMEOUT = 1000;
        
    var that = this;
    this.lastTimestamp = 0;
    this.latencities = []
    this.timeDiffs = [];
    this.diffCount = 0;
    this.socketSyncClosure = function(syncData){
        var currentTimeStamp = Date.getTime();
        var ping = currentTimeStamp - that.lastTimestamp;
        that.latencities.push(ping / 2);
        that.averageLatencity = Math.floor(that.average(latencities) );
        var timeDiff = syncData.ts - that.lastTimestamp;
        this.diffCount += 1;
        if(DROP_FIRST_DIFFS > this.diffCount){
            that.timeDiffs.push(timeDiff);
        }
        if(that.timeDiffs.length > MAX_DIFF_LENGTH){that.timeDiffs.splice(0,1) }
        that.timeDiff = that.average(that.timeDiffs);
		setTimeout(function(){
            that.syncLoop()
        }, SYNC_TIMEOUT);
    }

    this.average(var array){
        return _.reduce(array, function(a,b){return a+b}, 0) / array.length;
    }
    
    this.syncLoop = function(){
        this.lastTimeStamp = Date.getTime();
        socketService.sync( this.socketSyncClosure );
    }
    
    this.getCurrentTimeDiff(){
        return this.timeDiff;
    }
}
