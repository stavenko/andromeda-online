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
EventQueue.prototype.add = function( e, _ ){
	//if(is_browser==false){
	//	console.log("ADDING", e, ts);
	//}
	var ts = e.ident;
	if(this._events[ts]){
		this._events[ts].push(e);	
	}else{
		this._events[ts] = [e];
	}
	
	this._stamps.push(ts);
	this._stamps.sort();
}
EventQueue.prototype.set_last_processed = function(ts){
	
	//if(! is_browser){
	//	console.log("just checking - we can't get here on serverside");
	//}
	
	this._last_processed = ts;
	this._include_last_once = true;
}
EventQueue.prototype.remove = function(remove_before_ts){
	this._rem_comm += 1;
	//L.setValue("removing_command " + this._mesh_id, this._rem_comm);
	// console.log("removing_command" + this._mesh_id, remove_before_ts);
	this._remove_before = remove_before_ts; // Lazy removing
	
}
EventQueue.prototype.process = function(now, processor){
	var removed_ixes = [];
	var self = this;
	// console.log("S");
	var processed_events = 0;
	_.each(this._stamps, function(ts, ix){
		
		// console.log("crit", ts, ix);
		
		if (ts <= self._remove_before){
			removed_ixes.push(ix);
			delete self._events[ts];
			return;
		}
		// console.log("FFF", self._last_processed, ts, now );
		var is_from = self._include_last_once? self._last_processed <= ts : self._last_processed < ts;

		//L.setValue("IF" + self._mesh_id, is_from)
		//L.setValue("Includeonce " + self._mesh_id, self._include_last_once)
		
		if(is_from && ts <= now){
			// console.log("NO ACTIONS? KIDDING?! ", self._events[ts] )
			self._include_last_once = false;
			_.each(self._events[ts], function(e){
				if(!is_browser){
					// console.log("processing", e.type)
				}
				
				// console.log("q>>", self._last_processed, e.ident, now, e)
				
				processor(  e, ts )
				processed_events += 1;
			})
			//console.log("last_proc was ", self._mesh_id, self._last_processed);
			self._last_processed = ts;
			//console.log("last_proc became ", self._mesh_id , self._last_processed);
			
		}
	})
	// L.setValue("events "+ self._mesh_id, processed_events);
	
	// console.log("E");
	
	_.each(removed_ixes, function(ix){
		self._stamps.splice(ix, 1);
	})
	//L.setValue("ST" + this._mesh_id, this._stamps.length)
	
}

module.exports = EventQueue;