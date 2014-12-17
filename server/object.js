var THR = require('three');
var EQ = require("./event_queue");
var _     = require('underscore');
var Controller = require("./controller");



// // CL(THR, THREE);
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
	
	// // CL('loaded', THREE )
	//var AObject =  THREE.Mesh;
	// AObject.prototype.THREE = THREE
	//AObject.prototype.do_prepare_rendering = true;
	
}

// // CL("Holy crap", AObject)


function createObject(scene, mat, geom){
	
	var THREE = get_three();
	var m = THREE.Mesh;
	m.prototype._scene = scene;
	m.prototype.some_counter = 0;
	m.prototype._foreign_procs = {};
    
	
	m.prototype.reload_saved_state= function(){
		// Здесь мы возвращаем сохраненное ранее состояние - состояние, которое было с этим объектом когда-то давно
        /*
		prev_state___ = {workpoints:{
			"Front turret": {
				"magazine": 30,
				"last_shot_time":0,
			},
			"Back turret": {
				"magazine": 50,
				"last_shot_time":0,
			}
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
				
				's_armor0_power':0.1,
				's_shield0_power':0.3,
				
				's_armor0_state':false,
				's_armor0_cap': 400,
				's_armor0_rcap':0,
				's_shield0_state':false,
				's_shield0_cap':500,
				's_shield0_rcap':0,
				

				
			}
			
		}};
		
		prev_state = {
			world:{	
				position: this.position.toArray(),
				rotation: this.rotation.toArray(),
				impulse:  this.impulse.toArray(),
				angular_impulse: this.angular_impulse.toArray()
            },
            
			devices:[
				{power:1},
				{power:1},
				{power:1},
				{power:1},
				{power:1},
				{power:1},
			
			
				{power:1},
				{power:1},
			
				{capacitor:0, power:1},
			
				{power:0.1, capacity:100, state:false, reserve_capacity:0},
				{power:0.1, capacity:100, state:false, reserve_capacity:0},
				{power:0.0, capacity:0},
			
				{magazine:30, last_shot_time:0, is_reloading:0},
				{magazine:30, last_shot_time:0, is_reloading:0},
				{},
				{capacity:200}
			]	
		};
        */
        
        // // CL("TTTTTTTTTTTTTT",this.type)
		this.restoreState(this.json.last_state);
		
	}
	/*
	m.prototype.getState = function(){
		if(this.some_counter < 100){
			// // CL("Last Process while state" + this.eventManager._mesh_id, this.eventManager._last_processed);
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
	*/
	m.prototype.getState = function(){
		var current_state = {	
			server_ts: this.eventManager._last_processed , 
			world:{	
				position: this.position.toArray(),
				rotation: this.rotation.toArray(),
				impulse:  this.impulse.toArray(),
				angular_impulse: this.angular_impulse.toArray()}};
							
		if (this.devices){
			current_state.devices = {}
			for (dev in this.devices){
				current_state.devices[dev] = {};
				for (param in this.devices[dev]){
					current_state.devices[dev][param] = this.devices[dev][param];
				}
			}
		}
		return current_state;
	}
	m.prototype.restoreState = function(state){
		var self = this;
		for(v in state.world){
            if(this[v] === undefined){
               this[v] = new THREE.Vector3(); 
            }
			this[v].fromArray(state.world[v]);
		}
		if(state.devices){
            
			_.each(state.devices, function(dev_st, ix){
                if(self.devices[ix] === undefined){
                    self.devices[ix] = {};
                }
				_.each(dev_st, function(val, name){
					self.devices[ix][name]=val;
				
				})
			})
			
		}
	}
	/*
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
	*/
	
	m.prototype.setDeviceSetting = function(dev, name, value){
		this.devices[dev][name] = value;
	}
	m.prototype.getDeviceSetting = function(dev, name){
        // CL(this.devices, dev, name);
		return this.devices[dev][name] ;
	}
	m.prototype.alterDeviceSetting = function(dev, name, callback){
		if (this.devices[dev]){
			var value = this.devices[dev][name];
			var new_value = callback(value);
			if (new_value !== undefined){
				// L.setValue(" set " + param, new_value );
				
				this.devices[dev][name] = new_value;
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
				// L.setValue(" set " + param, new_value );
				
				this.workpoint_states[wp][param] = new_value;
			}
		}
		// return undefined;
		
	}
	m.prototype.recalculate_till_server_report = function(server_report, time_diff){
		var state = server_report;
		var last_ts = state.server_ts;
		this.restoreState(state);
		
		current_ts = last_ts // - time_diff;
		if (last_ts !== 0){
			this.eventManager.set_last_processed(current_ts);
			this.eventManager.remove(current_ts);
		}
	};
	
	m.prototype.update_static_physical_data = function(till_time){
		var time_left = (till_time - this.last_processed_timestamp) / 1000 // to seconds;
		// // CL(time_left);
		var um = 1 / this.mass;
		var umt = time_left * um

		var rots = this.angular_impulse.clone().multiplyScalar(umt)
		var poses = this.impulse.clone().multiplyScalar(umt)

		// mesh.vel = mesh.impulse.clone().multiplyScalar(um);

		// // CL("statics ",rots.toArray(), poses.toArray());
		this.rotateX(rots.x)
		this.rotateY(rots.y)
		this.rotateZ(rots.z);

		this.position.add(poses);
		
		var power_plant_current_power = this.getDeviceSetting(this.type.power_source, 'power');
		var psource_dev = this.type.devices[this.type.power_source]
		var max_power = psource_dev.max_power;
		var power_produced = (max_power * power_plant_current_power)  * time_left ;
		var max_capacitor = psource_dev.capacitor
		// L.setValue("POWER PRODUCED", power_produced);
		// L.setValue("TIME ", time_left);
		
		this.alterDeviceSetting(this.type.power_source, "capacitor", function(value){
			if (value < max_capacitor){
				
				return value + power_produced;
			}else{
				return value;
			}
		})
		
		var self = this;
		_.each(this.type.shields, function(shields, type){
			_.each(shields, function(shield_id){
				// СНАЧАЛА ЗАРЯЖАЕМ ИХ КАПАСИТОРЫ
				var shield_dev = self.type.devices[shield_id]
				var performance = 1;
				var charge_power = self.getDeviceSetting(shield_id, 'power');
				var reserve_cap_amount = self.getDeviceSetting(shield_id, 'reserve_capacity');
				var max_rcap_amount = shield_dev.capacitor;
				var charge_nominal = shield_dev.charge_rate * charge_power * time_left;
				var cap = self.getDeviceSetting(self.type.power_source, "capacitor");
				if( reserve_cap_amount < max_rcap_amount  ){
					var consumed = charge_nominal;
					if(cap >= consumed){
						var added = consumed * performance;
						self.alterDeviceSetting(shield_id, "reserve_capacity", function(val){
							return val + added;
							
						});
						self.alterDeviceSetting(self.type.power_source, "capacitor", function(val){
							return val - consumed;
						});
						
					}
				}
				// ТЕПЕРЬ ПРОВЕРЯМ СОСТОЯНИ РАБОТЫ
				if(type === 'armor'){
					
					if(self.getDeviceSetting(shield_id, 'state') ){
						var cur_am = self.getDeviceSetting(shield_id, "capacity");
						var max_am = shield_dev.capacity;
						if(cur_am < max_am){
							var rr = shield_dev.repair_rate * time_left;
							var perf = shield_dev.performance;
							var rcap = self.getDeviceSetting(shield_id, 'reserve_capacity');
							
							consumed = rr / perf;
							if(consumed > rcap){ 
								consumed = rcap 
								rr = consumed * perf ;
							};
							self.alterDeviceSetting(shield_id, "capacity", function(val){
								return val + rr;
							})
							self.alterDeviceSetting(shield_id, "reserve_capacity", function(val){
								return val - consumed;
							})
							
						}
					}
				}
				if(type ==='shield'){
					var state = self.getDeviceSetting(shield_id, "state");
					var is_on = state;
					L.setValue("is_on", is_on);
					L.setValue("state", state);
					if( is_on ){
						var rcap = self.getDeviceSetting(shield_id, "reserve_capacity");
						var need = shield_dev.setup_energy;
						
						if(need <=rcap){
							
							var cap = shield_dev.capacity;
							self.alterDeviceSetting(shield_id, "capacity", function(val){
								return cap;
							})
							self.alterDeviceSetting(shield_id, "reserve_capacity", function(val){
								return val - need;
							})
							
							// Теперь надо выключить, проведя по системе сообщений
							// // CL("MESH ACTORS", self.actors)
							self.autoMessage(shield_id, "toggle", 0) ;// This one should go through networking
							// self._scene.addSettingToScene(actor, sett, undefined, true);

							
						}
					}
					
				}
			})
		})
		
		
		var curr_hull = this.getDeviceSetting(this.type.hull_device, "capacity");
		if(curr_hull <=0){
            
			// // CL("DESTROYED");
            scene.removeObject(self);
            
		}
		this.last_processed_timestamp = till_time
		
		
		
	}
	m.prototype.createDeviceAction = function(dev,name, val, add_params){
		var action = this.type.devices[dev].actions[name];
		console.log("GUID", this.GUID, this.type.GUID )
		if(action.is_switch){
			var act = {
				mesh : this.GUID,
				dev : dev,
				name: name,
				ts :new Date().getTime(),
			};
			
		}else{
			var act = {
				mesh : this.GUID,
				dev : dev,
				name: name,
				ts :new Date().getTime(),
				delta: 0,
				value: val
			};
			
		}
		if(add_params){
			for(i in add_params){
				act[i] = add_params[i];
			}
			
		}
		
		if (this._scene.W){
			act.ident = act.ts + this._scene.W._time_diff;
		}else{
			act.ident = act.ts;
		}
		return act
	}
	m.prototype.startDeviceAction = function(dev, name, val, add_params){
		var act = this.createDeviceAction(dev, name, val, add_params);
		// // CL("this is a createde action", act)
		this.eventManager.add(act, act.ts)
		this._scene._addToServerQueue(act)
		
	};
	m.prototype.startVirtualDeviceAction = function(proc, ts, ident){
		this._foreign_procs[ts] = proc;
		var act = {
			dev : this.type.foreign_processor,
			name: 'process',
			ts :ts,
			ident:ident,
		};
		this.eventManager.add(act);
		
	}
	m.prototype.autoMessage = function(dev, name, val){
		var act = this.createDeviceAction(dev, name, val)
		this.eventManager.add(act, act.ts);
		// this._scene.makeSceneBroadcast(act);
	}
	
	m.prototype.downStreamMessage = function(dev, name, val){
		var act = this.createDeviceAction(dev, name, val)
		this.eventManager.add(act, act.ts);
		this._scene.makeSceneBroadcast(act);
	}
	
	m.prototype.enqueue_auto_setting_action = function(wp, setting, value, is_switch){
		act = {
			type: 1000,
			name:setting,
			value:value,
			wp : wp,
			actor: this.actors[wp].GUID,
			object_guid: this.GUID,
			scene: this._scene.GUID,
			ts: new Date().getTime(),
			controller: "settings"
		}
		if (is_switch){
			act.switch = true;
			delete act.value;
		}
		if (this._scene.W){
			act.ident = act.ts + this._scene.W._time_diff;
		}else{
			act.ident = act.ts;
		}
		
		// Эта акция должна быть создана независимо и на клиенте и на сервере, раз уж она долетела до сервера
		// Тогда 
		// this._scene._addToServerQueue.call(this._scene, act); 
		this.eventManager.add(act, act.ts)
	}
	
	
	m.prototype.load_json = function(){
		var self = this;
	
		var object = self.json
        self.GUID = self.json.GUID;
	
		// // CL("Loading", )
	
		self.eventManager = new EQ( object.GUID );
		self.pending_actions = [];
		self.workpoint_states = {};
		self._processed_actions = [];
		self._actions_index = {};
		self._previous_states = []
		self._previous_states_index = {}
		self.total_angular_impulses = [];
				// // CL(i, mesh.total_torques, mesh.total_powers)
		self.type=object.sub_type
		//var object_rotated = false
		// Setting defaults 
		//self.avel = new THREE.Vector3(0,0,0)
		//self.aacc = new THREE.Vector3(0,0,0)
		//self.vel = new THREE.Vector3(0,0,0)
		//self.acc = new THREE.Vector3(0,0,0)
	
      
	    /*
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
        */
		/*
		self.position = self.pos;
		if (! object_rotated &&  'rot' in self){
			
			var uel = new self.THREE.Euler(self.rot.x, self.rot.y, self.rot.z);
			self.rotation = uel;
		}
        */
		// // CL(mesh.position)
        console.log("Creating object", self.type);
		self.cameras = self.type.cameras;
		self.mass = self.type.mass;
		// self.angular_impulse = self.avel.clone().multiplyScalar(object.mass)
		// self.impulse = self.vel.clone().multiplyScalar(object.mass)
		

		
		self.last_processed_timestamp = new Date().getTime();
		
		// По-любому здесь придется кешировать акторов в этом меше
		// БЛЯДЬ!
		self.actors = {}
		_.each(self._scene.actors, function(actor, aid){
			if(actor.control.object_guid == self.json.GUID){
				self.actors[actor.control.workpoint] = actor;
			}
		})
		
		// Создадим карты сеттингов для устройств
		// также создаем карту контроллеров девайсов
		
		self.devices = [];
		self.controllers=[];
		self.armors = [];
		self.shields = [];
		self.uis = [];
        // CL("loading devices", self.type.devices);
		_.each(self.type.devices, function(dev,ix){
			self.devices.push({});
			if (dev.type == 'shield'){
				if(dev.shield_type == 'shield'){ self.shields.push(ix)}
				if(dev.shield_type == 'armor'){ self.armors.push(ix)}
				if(dev.shield_type == 'thermal'){ /* no use yet */}
				
			}
			var C = Controller.deviceControllers.controllersMap[dev.type]
			if (C){
				var contr = new C(self, ix);
				self.controllers.push(contr)
				if(self._scene.W){
					self.uis.push(contr.getUI(self._scene.W));
				}
			}
		});
        
		self.reload_saved_state();

		
		
	
	}
	m.prototype.getUIForWP=function(wp){
		var self =this;
		var ui_list=[];
        var _wp = this.type.workpoints[wp];
		_.each(_wp.devices, function(d_id){
			var  ui = self.uis[d_id]
			if (ui){
				ui_list.push(ui)
			}
		})
        return ui_list;
		
	};
	m.prototype.getActionList = function(){
		// Возвращаемый объект
		// 
		// 
		//  {wp: [actions] }
		var self = this;
		var obj = {}
		_.each(this.type.workpoints, function(wp, wp_name){
			av_act_list = []
			_.each(wp.devices, function(dev_ix){
				var dev  = self.type.devices[dev_ix];
				_.each(dev.actions, function(act, act_name){
					var a = {mesh:self.GUID, device: dev_ix, name:act_name};
					if (act.default_key){
						a.default_key = act.default_key;
					}
					av_act_list.push(a);
					
				})
				// // CL("AA",wp_name, dev.type,  dev.actions)
			})
			obj[ wp_name ] = av_act_list;
			
		})
		return obj;

	};
    m.prototype.clear = function(){
        this._scene = null;
        this.geometry = null;

    }
	return (new m(mat, geom));
}


module.exports = createObject;
