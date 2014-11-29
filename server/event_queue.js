var _     = require('underscore');



if(typeof window ==='undefined'){
	
	var L = {setValue:function(){}};
	is_browser = false;
}else{
	var L = SL;
	is_browser = true;
}
var EventQueue = function(mesh_id){
	this._mesh_guid = mesh_id;
	this._mesh_id = mesh_id.substring(0,5);
	
	this._events = {};
	this._stamps = []; // sorted;
	this._remove_before = 0;
	this._last_processed = 0;
	this._rem_comm =0
	this._disp_counter1 = 0;
	this._disp_counter2 = 0;
	
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
	this._rem_comm += 1;
	this._remove_before = remove_before_ts; // Lazy removing
	
}
EventQueue.prototype.process = function(now, processor){
	var removed_ixes = [];
	var self = this;
	// console.log("S");
	var processed_events = 0;
	_.each(this._stamps, function(ts, ix){
		
		if (ts <= self._remove_before){
			removed_ixes.push(ix);
			delete self._events[ts];
			return;
		}
		var is_from = self._include_last_once? self._last_processed <= ts : self._last_processed < ts;
		//console.log("FFF", [is_from,ts <= now], self._last_processed, ts, now, ts-now );
		
		if(is_from && ts <= now){
			self._include_last_once = false;
			_.each(self._events[ts], function(e){
				if(!is_browser){
				}

				processor(  e, ts )
				processed_events += 1;
			})

			self._last_processed = ts;

			
		}
	})

	_.each(removed_ixes, function(ix){
		self._stamps.splice(ix, 1);
	})
	//L.setValue("ST" + this._mesh_id, this._stamps.length)
	
}

module.exports = EventQueue;