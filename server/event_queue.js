var _     = require('underscore');

var EventQueue = function(){
	
	this._events = {};
	this._stamps = []; // sorted;
	this._remove_before = 0;
	this._last_processed = 0;
	// this._stamps_ix
}
EventQueue.prototype.add = function( e, ts ){
	if(this._events[ts]){
		this._events[ts].push(e);	
	}else{
		this._events[ts] = [e];
	}
	
	this._stamps.push(ts);
	this._stamps.sort();
}
EventQueue.prototype.set_last_processed = function(ts){
	
	this._last_processed = ts;
	this._include_last_once = true;
}
EventQueue.prototype.remove = function(remove_before_ts){
	this._remove_before = remove_before_ts; // Lazy removing
}
EventQueue.prototype.process = function(now, processor){
	var removed_ixes = [];
	var self = this;
	// console.log("S");
	_.each(this._stamps, function(ts, ix){
		if (ts < self._remove_before){
			removed_ixes.push(ix);
			delete self._events[ts];
			return;
		}
		console.log("FFF", self._last_processed, ts, now );
		var is_from = self._include_last_once? self._last_processed <= ts : self._last_processed < ts;
		
		if(is_from && ts <= now){
			console.log("NO ACTIONS? KIDDING?! ", self._events[ts] )
			this._include_last_once = false;
			_.each(self._events[ts], function(e){
				processor(  e,ts )
				
			})
			self._last_processed = ts; 
			
		}
		
		
	})
	// console.log("E");
	
	_.each(removed_ixes, function(ix){
		self._stamps.splice(ix, 1);
	})
	
}

module.exports = EventQueue;