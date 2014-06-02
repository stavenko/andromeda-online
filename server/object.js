var THR = require('./three.node');
var EQ = require("./event_queue");



// console.log(THR, THREE);
if(typeof window === 'undefined'){
	// var AObject = {}; THR.Mesh;
	
	// AObject.prototype.THREE = THR // Saveing THREE.js as part of scene - this step could be done on a certain platform
	var L = {setValue:function(){}};
	var get_three = function(){
		return THR;
	}
	//var THREE = THR;
	// AObject.prototype.do_prepare_rendering = false;
	 
	
}else{
	var get_three = function(){
		return THREE;
	}
	var L = SL;
	
	// console.log('loaded', THREE )
	//var AObject =  THREE.Mesh;
	// AObject.prototype.THREE = THREE
	//AObject.prototype.do_prepare_rendering = true;
	
}

// console.log("Holy crap", AObject)


function createObject(mat, geom){
	var THREE = get_three();
	// console.log("WWW", TH, THR);
	var m = THREE.Mesh;
	m.prototype.some_counter = 0;
	
	m.prototype.reload_saved_state= function(){
		// Здесь мы возвращаем сохраненное ранее состояние - состояние, которое было с этим объектом когда-то давно
		prev_state = {workpoints:{
			"Front turret": {
				"magazine": 3,
				"last_shot_time":0,
			},
			"Back turret": {
				"magazine": 50,
				"last_shot_time":0,
			},
			"Piloting":{
				"capacitor":0,
				"eng_rotation_x+_power": 1,
				"eng_rotation_y+_power": 1,
				"eng_rotation_z+_power": 1,
				"eng_rotation_x-_power": 1,
				"eng_rotation_y-_power": 1,
				"eng_rotation_z-_power": 1,

				"eng_propulsion_x-_power": 1,
				"eng_propulsion_y-_power": 1,
				"eng_propulsion_z-_power": 1,
				"eng_propulsion_x+_power": 1,
				"eng_propulsion_y+_power": 1,
				"eng_propulsion_z+_power": 1,
				s_armor0_power:0.1,
				s_shield0_power:0.1,

				
			}
			
		}};
		this.restoreState(prev_state);
		
	}
	
	m.prototype.getState = function(){
		if(this.some_counter < 100){
			// console.log("Last Process while state" + this.eventManager._mesh_id, this.eventManager._last_processed);
			this.some_counter +=1;
		}
		var current_state = {	
			server_ts: this.eventManager._last_processed , 
			world:{	
				position: this.position.toArray(),
				rotation: this.rotation.toArray(),
				impulse:  this.impulse.toArray(),
				angular_impulse: this.angular_impulse.toArray()},};
							
		if (this.workpoint_states){
			current_state.workpoints = {}
			for (workpoint in this.workpoint_states){
				current_state.workpoints[workpoint] = {};
				for (param in this.workpoint_states[workpoint]){
					current_state.workpoints[workpoint][param] = this.workpoint_states[workpoint][param];
				}
			}
		}
		return current_state;
		
	}
	m.prototype.restoreState = function(state ){
		for(v in state.world){
			this[v].fromArray(state.world[v]);
		}
		if(state.workpoints){
			if(typeof this.workpoint_states === 'undefined'){
				this.workpoint_states = {};
			}
			for (var wp in state.workpoints){
				if (typeof this.workpoint_states[wp] ==='undefined'){
					this.workpoint_states[wp] = {};
				}
				for(var p in state.workpoints[wp]){
					this.workpoint_states[wp][p] = state.workpoints[wp][p];
				}
			}
		}
		
	}
	
	m.prototype.saveWorkpointValue = function(wp, param, value){
		if(typeof this.workpoint_states[wp] === 'undefined'){
			this.workpoint_states[wp] = {};
			this.workpoint_states[wp][param] = value
		}else{
			this.workpoint_states[wp][param] = value
			
		}
	}
	m.prototype.getWorkpointValue = function(wp, param){
		if (this.workpoint_states[wp]){
			return this.workpoint_states[wp][param];
		}
		return undefined;
	}
	m.prototype.alterWorkpointValue = function(wp, param, modifier){
		if (this.workpoint_states[wp]){
			value = this.workpoint_states[wp][param];
			new_value = modifier(value);
			if (new_value !== undefined){
				this.workpoint_states[wp][param] = new_value;
			}
		}
		// return undefined;
		
	}
	m.prototype.recalculate_till_server_report = function(server_report, time_diff){
		var state = server_report;
		var last_ts = state.server_ts;
		this.restoreState(state);
		
		current_ts = last_ts - time_diff;
		// console.log("MARK", current_ts);
		if (last_ts !== 0){
			this.eventManager.set_last_processed(current_ts);
			this.eventManager.remove(current_ts);
			
		}
			
	};
	
	m.prototype.update_static_physical_data = function(till_time){
		var time_left = (till_time - this.last_processed_timestamp) / 1000 // to seconds;
		// console.log(time_left);
		var um = 1 / this.mass;
		var umt = time_left * um

		var rots = this.angular_impulse.clone().multiplyScalar(umt)
		var poses = this.impulse.clone().multiplyScalar(umt)

		// mesh.vel = mesh.impulse.clone().multiplyScalar(um);

		// console.log("statics ",rots.toArray(), poses.toArray());
		this.rotateX(rots.x)
		this.rotateY(rots.y)
		this.rotateZ(rots.z);

		this.position.add(poses);
		
		var power_plant_current_power = 100;
		var power_produced = (this.json.power_source.max_power * power_plant_current_power) /100 * time_left ;
		var max_capacitor = this.json.power_source.capacitor
		L.setValue("POWER PRODUCED", power_produced);
		L.setValue("TIME ", time_left);
		
		this.alterWorkpointValue('Piloting', "capacitor", function(value){
			if (value < max_capacitor){
				
				return value + power_produced;
			}else{
				return value;
			}
		})
		
		
		
		this.last_processed_timestamp = till_time
		
		
		
	}
	
	
	m.prototype.load_json = function(){
		var self = this;
	
		var object = self.json
	
		// console.log("Loading", )
	
		self.eventManager = new EQ( object.GUID );
		self.pending_actions = [];
		self.workpoint_states = {};
		self._processed_actions = [];
		self._actions_index = {};
		self._previous_states = []
		self._previous_states_index = {}
		self.total_angular_impulses = [];
				// console.log(i, mesh.total_torques, mesh.total_powers)
		self.type=object.type
		var object_rotated = false
		// Setting defaults 
		self.avel = new THREE.Vector3(0,0,0)
		self.aacc = new THREE.Vector3(0,0,0)
		self.vel = new THREE.Vector3(0,0,0)
		self.acc = new THREE.Vector3(0,0,0)
	
	
		if ( object.physical ){
			for(i in object.physical){
				
				var _is = 'to' in object.physical[i]
				if (!_is){
					if(i !='rotation'){
						var v = new THREE.Vector3()
						
					}else{
						var v = new THREE.Euler()
					}
					v.set.apply(v, object.physical[i])
					self[i] = v
				
				}else{
					var p = new THREE.Vector3(object.physical[i].to[0], object.physical[i].to[1], object.physical[i].to[2])
					// Try to rotate p on 180 
					//p.rotateX(2* Math.PI);
					self.lookAt(p.negate())
					// mesh.rotateX(2*Math.PI)
					self.rot = new THREE.Vector3(self.rotation.x, self.rotation.y, self.rotation.z);
					object_rotated = true;
				}
			}
		}else{
			var pi2 = Math.PI * 2;
			self.pos = new THREE.Vector3(Math.random() * 200, Math.random() * 200, Math.random() * 200);
			self.rot = new THREE.Vector3(Math.random() * pi2, Math.random() * pi2, Math.random() * pi2);
			
		}
		
		self.position = self.pos;
		if (! object_rotated &&  'rot' in self){
			
			var uel = new self.THREE.Euler(self.rot.x, self.rot.y, self.rot.z);
			self.rotation = uel;
		}
		// console.log(mesh.position)
		self.cameras = object.cameras;
		self.engines = object.engines;
		self.has_engines = object.engines !== undefined;
		if (self.has_engines){
			self.on_engines_rotation = [];
			self.on_engines_propulsion = [];
		}
		// mesh.put_off = put_off;
		// mesh.put_on  = put_on;
		self.mass = object.mass;
		self.angular_impulse = self.avel.clone().multiplyScalar(object.mass)
		self.impulse = self.vel.clone().multiplyScalar(object.mass)
		

		
		self.last_processed_timestamp = new Date().getTime();
		self.reload_saved_state();
	
	}
	return (new m(mat, geom));
}


module.exports = createObject;
