var THR = require('three');
var Utils = require("./utils");
var _     = require('underscore');
ROTATE  = 10;
ROTATEC = 11;
MOVE = 12;
SHOOT = 13;
HIT = 15;
RELOAD_WEAPONS = 16;
UI_SETTINGS = 1000;




/*
Актор привязан к мешу, меш к сцене.

Необходимо:
1 создавать акции из нажатий кнопок
2 создавать акции из нажатий на контролы
3 создавать акции из других акций автоматически - генератор акций должен быть доступен внутри классов реагирования.

Созданные акции имеют все необходимые параметры для обработки внутри классов

После генерации акции отправляются на сервер.
В результате реагирования акции могут появиться на сервере - такие акции не пересылаются на сервер с клиента, а только наоборот




Таким образом, необоходимо в интерфейс контроллера включать инстанс генератора акций.
*/

/*
var newAction = function(type, wp, device, mesh_id, scene_id, actor_id, ts, tdiff){
	return {type:type,
			wp:wp,
			device:device,
			
			mesh_id:mesh_id,
			scene_id:scene_id,
			actor_id:actor_id,
			ts: ts,
			tdiff: tdiff}
}
function curry(fn) {
     var slice = Array.prototype.slice,
        stored_args = slice.call(arguments, 1);
     return function () {
        var new_args = slice.call(arguments),
              args = stored_args.concat(new_args);
        return fn.apply(null, args);
     };
}


var workpointsActionList = {
	pilot: []
}

*/


var Controller = {description:'controller'}

if(typeof window ==='undefined'){
	
	var L = {setValue:function(){}};
	is_browser = false;
}else{
	var L = SL;
	is_browser = true;
}


	
Controller.NetworkActor =   function(onAct, W){
		
		var map = Controller.ControllersActionMap()
		var self = this;
		
		this.run = function(){
			// no need to bother - event style
		}
		this.act=function(S, action, is_on, actor){
			if (W !== undefined){
				action.timestamp -= W._time_diff
			}
			var _a = map[action.controller].act(S, action, is_on, actor, onAct);
		}
		return this;
	};
Controller.LocalInputActor = function(W, socket){
		var self = this;
		self.World = W;
		var map = Controller.ControllersActionMap()
		var actor = W.login;
		self.actions_by_scene = {}
		///// ACTION TYPES 
		ROTATE  = 10
		ROTATEC = 11
		MOVE = 12
		SHOOT = 13
		
		
		
		//self.actor_login = actor_login
		self._default_actions={
		
			87: {type:ROTATE, controller:"pilot",  p:{ a:0,d:-1}},
			83: {type:ROTATE, controller:"pilot",  p:{ a:0,d:1}},
			
			65: {type:ROTATE, controller:"pilot",  p:{ a:1,d:1}},
			68: {type:ROTATE, controller:"pilot",  p:{ a:1,d:-1}},
			
			90: {type:ROTATE, controller:"pilot",  p:{ a:2,d:1}},
			67: {type:ROTATE, controller:"pilot",  p:{ a:2,d:-1}},
		
		
			79: {type:ROTATEC, controller:"pilot", p:{ a:'x',d:'+'}},
			80: {type:ROTATEC, controller:"pilot", p:{ a:'x',d:'-'}},
		
			73: {type:ROTATEC, controller:"pilot", p:{ a:'y',d:'+'}},
			75: {type:ROTATEC, controller:"pilot", p:{ a:'y',d:'-'}},
		
			38: {type:MOVE, controller:"pilot", p:{ a:2,d:-1}},
			40: {type:MOVE, controller:"pilot", p:{ a:2,d:1}},
			
			82: {type:RELOAD_WEAPONS, controller:"turret"},
		
			'lmouse':{type: SHOOT, MA:true, controller:"turret", p:{ '_turret_direction': function(t,k){
				// delete t[k]
				// console.log("w")
				// console.log(W.controllable());
				//var T = Controller.T();
				
				//var C = W.controllable();
				//var Cc = W.get_main_viewport().camera
				//var camera_position_vector = new T.Vector3()
				//console.log(C.json);
				//var camera =  C.json.cameras[Cc]
				//console.log(camera);
				//camera_position_vector.fromArray(camera.position);
				//camera_position_vector.applyEuler( C.rotation.clone() )
				//camera_position_vector.add(C.position.clone());
				//console.log("camera pos in W", camera_position_vector);
				// console.log("REPLACING",W.mouse_projection_vec.clone())
				
				t[k.substr(1)] = W.mouse_projection_vec.clone() //.sub(camera_position_vector)
			}}},
		}
	
		self.actions = self._default_actions;
		self._keycodes_in_action = {}
		this.input = function(keycode, up_or_down, modifiers){
			var ts = new Date().getTime()
			
			// Updating values in event:
			
            // console.log("SSSS");
			
			if(up_or_down) {// down == true
				self._keycodes_in_action[keycode] = {in_action:true, ts:ts}
			}else{
				if(self._keycodes_in_action[keycode]){
					// Пользователь мог нажать кнопку мыши в одном месте - а отпустить над другим.
					var t = self._keycodes_in_action[keycode].ts
					self._keycodes_in_action[keycode].in_action = false
					self._keycodes_in_action[keycode].ts = ts
					self._keycodes_in_action[keycode].delta = ts - t
					
				}
				
			}
		}
		this.getLatestActions = function(scene, now){
			// console.log("GLA");
            
            
            
            var actions = [];
			_.each(self._keycodes_in_action, function(k_action, keycode){
				if(k_action.in_action){
					var delta = now - k_action.ts
					var ts = now
					k_action.ts = now
					
				}else{
					var delta = k_action.delta
					var ts = k_action.ts
					delete self._keycodes_in_action[keycode]
				}
				var action = _.clone(self.actions[keycode]);
				console.log("pressed", W._time_diff, W )
				
				if(keycode in W._input_keymap){
					var act_desc  = W._input_keymap[keycode];
					var new_action = {
						mesh : act_desc.mesh,
						dev : act_desc.device,
						name: act_desc.name,
						ts :ts,
						ident: ts + W._time_diff + W.avg_latencity,
						delta:delta/1000,
						wmouse:W.mouse_projection_vec.clone().toArray()
					}
					actions.push(new_action);
				}
			});
			return actions;
					
		}
			

		
	};
Controller.CSettingController = function(){
	this.type="settings"
	this.process = function(raw_action, mesh){
		
		// console.log("SETTING coNT READY", raw_action)
		if(raw_action.switch){
			
			mesh.alterWorkpointValue(raw_action.wp, raw_action.name, function(v){
				console.log("Altering amount ", v);
				return (! v)
			});
		}else{
			mesh.saveWorkpointValue(raw_action.wp, raw_action.name, raw_action.value);
		}
	}
}
// TODO Контроллер для шилда



Controller.CPilotController = function(){
	
		// Обработка события осуществляется в два этапа:
		// Первый этап - вычисления исходя из параметров события тех характеристик, которые направлены на нужный корабль (Вектора)
		// Второй этап - пересчет координат (работа двигателей)
		 
		this.type='pilot';
		this.action_types=[ROTATE, MOVE];
		this.getUI = function(W, actor){
			var ui = function(){
				this.actor = actor;
				this.construct = function(){
					this.indicators_length = 110;
					this.total_width = 170;
					this.cont = $('<div>').css({
						'position':'fixed',
						// 'border': '1px solid red',
						'width': this.total_width + "px",
						'height': '60px',
						'top':40,
						'left':50+300,
						'background-color':'white'
					}).appendTo('body');
						
					this.shield_cont = $('<div>').css({
						position:'fixed',
						left:0,
						height:50,
						bottom:50,
						'background-color':'#f3f',
						width:400
						
					}).appendTo('body');
				var mesh = W.scenes[actor.scene].meshes[actor.control.object_guid];
				var scene = W.scenes[actor.scene];
				var self = this;
				
				self.shield_update_closures = []
				_.each(mesh.type.shields, function(shields, type){
					_.each(shields, function(shield_id){
						var shield_dev = mesh.type.devices[shield_id];
						
						var d  = $('<div>').css({width:50, height:"100%", float:'left', 'margin-right':"10px"}).appendTo(self.shield_cont);
						var sic = $('<div>').css({width:"100%", height:10 }).appendTo(d) // strenth indicator container
						var l = shield_dev.shield_type.toLocaleUpperCase();
						var b = $('<div>').css({width:"100%", height:30,
												"text-align":'center',
												'vertical-align': 'middle',
												'line-height':'30px',
												'background-color':'#333','color':"#F0F"})
											.text(l).appendTo(d).click(function(){
												
												mesh.startDeviceAction(shield_id, "toggle",0);
												
											}) 
						var cic = $('<div>').css({width:"100%", height:10}).appendTo(d) // capacitor indicator container
						
						var si = $('<div>').css({width:"100%", height:"100%", 'background-color':"blue" }).appendTo(sic);
						var ci = $("<div>").css({width:"100%", height:"100%",'background-color':"yellow" }).appendTo(cic);
						var closure = function(){
							var reserve_cap_amount = mesh.getDeviceSetting(shield_id, "reserve_capacity");
							var tot_cap_amount = shield_dev.capacitor;
							var w = reserve_cap_amount/tot_cap_amount * 100;
							ci.width( w + '%' );
							
							var is_on = mesh.getDeviceSetting(shield_id, 'state') ;
							if (is_on){
								b.css({color:'red', 'background-color':'white'});
							}else{
								b.css({'background-color':'#333','color':"#F0F"});
							}
							
							var current_capacity = mesh.getDeviceSetting(shield_id, 'capacity');
							var max_capacity = shield_dev.capacity;
							var ww =( current_capacity / max_capacity * 100) + "%";
							si.width(ww);
							
							// console.log("updating shield", shield, num);
						}
						self.shield_update_closures.push(closure);
						
					});
				})
					
						
									
				this.indicators = $('<div>').css({
					"width": this.indicators_length,
					"height":"100%",
					"float": "left",
					'background-color':'white'
				}).appendTo(this.cont);

				this.switches = $('<div>').css({
					"width": this.total_width - this.indicators_length ,
					"height":"100%",
					"float": "left",
					'background-color':'white'
				}).appendTo(this.cont);
				
				this.fuel_indicator = $('<div>') .css({
					"width": this.indicators_length ,
					"height":"25%",
					// "float": "left",
					'background-color':'green'
				}).appendTo(this.indicators);
			
				this.power_indicator = $('<div>') .css({
					"width": this.indicators_length ,
					"height":"25%",
					// "float": "left",
					'background-color':'red'
				}).appendTo(this.indicators);
				
				this.capacitor_indicator = $('<div>') .css({
					"width": this.indicators_length ,
					"height":"50%",
					// "float": "left",
					'background-color':'yellow'
				}).appendTo(this.indicators);
			
				
				
				var self = this;
				this.engines_key = $("<div>").css({
					width:"100%",
					height:"20px",
					
				}).text("E").appendTo(this.switches).click(function(){
					self._engines_dialog();
				});
				
				this.shield_key = $("<div>").css({
					width:"100%",
					height:"20px",
					
				}).text("S").appendTo(this.switches).click(function(){
					self._shields_dialog();
				});;
				
				this.turret_keys = $("<div>").css({
					width:"100%",
					height:"20px",
					
				}).text("T").appendTo(this.switches);
	
				}
				this._update_shield_indicator = function(){
					_.each(this.shield_update_closures, function(cl){
						cl();
					})
				}
				this._update_fuel_indicator = function(){}
				this._update_power_indicator = function(){}
				this._update_capacitor_indicator = function(){
					var mesh = W.scenes[actor.scene].meshes[actor.control.object_guid];
					var psd = mesh.type.devices[mesh.type.power_source];
					var total_cap = psd.capacitor;
					var current_cap = mesh.getDeviceSetting(mesh.type.power_source, "capacitor");
					L.setValue("CUR CONS", current_cap);
			
					if(current_cap > total_cap){
						percentage = 1;
					}else{
						percentage = current_cap / total_cap;
					}
					this.capacitor_indicator.width(percentage * this.indicators_length);
					
					
				}
				this._shields_dialog = function(){
					var mesh = W.scenes[actor.scene].meshes[actor.control.object_guid];
					var scene = W.scenes[actor.scene];
					
					cont = $('<div>').css({
						'position':'absolute',
						// 'border': '1px solid red',
						'width': 400 + "px",
						'height': '600px',
						'top':40 + 100,
						'left':50+300,
						'padding': "10px",
						'border-radius':'3px',
						'border-width':'1px',
						'border-style':'solid',
						'border-color':'#aaa',
						'background-color':'#222'}).appendTo('body');
					var  cc = $('<div>').appendTo(cont).css({'width':"100%",height:20, 'padding-bottom': '30px'});
					var  closer = $('<div>').appendTo(cont).css({'width':"20", height:20, 'background-color':'red', float:'right' }).click(function(){
						cont.remove();
					}).appendTo(cc);
					
					_.each(mesh.type.shields, function(s, i){
						if (i === 'thermal'){return}
						_.each(s, function(shield_id){
							var e1 = $("<div>").css({
								width:300,
								height:40
							}).appendTo(cont);
								
							$('<div>').css({'float':'left', 'color':'#bbb'}).width(40).text(i).appendTo(e1) 
							var slc =  $('<div>').css({'float':'left', width:120,'margin-left':10}).appendTo(e1);
						
							var pc = new PowerControlWidget({container:slc[0], starting_percent:0, end_percent:1.5,progress_value:0,
								change: function( val ) {
									mesh.startDeviceAction(shield_id, "set_power", val);

								},
								slide:function(val){ 
								}
								
							});
							// var sett =  "s_" + i + num + "_power"
							var cur_val = mesh.getDeviceSetting(shield_id, "power");
							pc.set_value( cur_val );
							
						})
					})
					
				};
				
				this._engines_dialog = function(){

					var mesh = W.scenes[actor.scene].meshes[actor.control.object_guid];
					var scene = W.scenes[actor.scene];

					cont = $('<div>').css({
						'position':'absolute',
						// 'border': '1px solid red',
						'width': 400 + "px",
						'height': '600px',
						'top':40 + 100,
						'left':50+300,
						'padding': "10px",
						'border-radius':'3px',
						'border-width':'1px',
						'border-style':'solid',
						'border-color':'#aaa',
						'background-color':'#222'}).appendTo('body');
						var  cc = $('<div>').appendTo(cont).css({'width':"100%",height:20, 'padding-bottom': '30px'});
						var  closer = $('<div>').appendTo(cont).css({'width':"20", height:20, 'background-color':'red', float:'right' }).click(function(){
							cont.remove();
						}).appendTo(cc);;
					
					
					_.each(mesh.type.engines, function(engines, engine_type){
						
						_.each(engines, function(engine_id){
							
							// var et = engine_type;
							// var ea = en;
							var en_dev = mesh.type.devices[engine_id];
							
							var e1 = $("<div>").css({
								width:300,
								height:40
								}).appendTo(cont);
						
							$('<div>').css({'float':'left', 'color':'#bbb'}).width(40).text(en_dev.name).appendTo(e1) 
							var slc =  $('<div>').css({'float':'left', width:120,'margin-left':10}).appendTo(e1);
							
							var pc = new PowerControlWidget({container:slc[0], starting_percent:0, end_percent:1.5,progress_value:0,
								change: function( val ) {
									mesh.startDeviceAction(engine_id, "set_power", val);

								},
								slide:function(val){ 
									// mesh.startDeviceAction(engine_id, "set_power", val);
								}
									
							});
							// var sett =  "eng_" + engine_name + "_power"
							var cur_val = mesh.getDeviceSetting(engine_id, "power" );
							pc.set_value( cur_val );
								
						})
					})
				}
				
				this.refresh = function(){
					this._update_fuel_indicator();
					this._update_power_indicator();
					this._update_capacitor_indicator();
					this._update_shield_indicator();
				};
				
			}
		
			var UI = new ui();
			return UI;
		}
		
		var T = Controller.T();
		
		function get_axis(a){
			if(a == 'x'){
				axis = new Controller.T().Vector3(1,0,0)
			}
			if(a == 'y'){
				axis = new Controller.T().Vector3(0,1,0)
			}
			if(a == 'z'){
				axis = new Controller.T().Vector3(0,0,1)
			}
			return axis
		
		
		}
		this.process = function(action, mesh){
			
			if(action.name == 'set_power'){
				console.log( "setting power of", action.dev, " to ", action.value)
				mesh.setDeviceSetting(action.dev, 'power', action.value);
				
			}else{
			
				var T = Controller.T();
			
				var unit = new T.Vector3();
				unit.fromArray(mesh.type.devices[action.dev].unit);
				var engine_name = mesh.type.devices[action.dev].engine_type + "_" + mesh.type.devices[action.dev].name;
				var percent_of_power = mesh.getDeviceSetting(action.dev, "power");
				var engine_type = mesh.type.devices[action.dev].engine_type;
			
				var performance = mesh.type.devices[action.dev].performance;
				var consumption = mesh.type.devices[action.dev].consumption;
				var capacitor_left = mesh.getDeviceSetting(mesh.type.power_source, "capacitor");
				var energy_consumption = percent_of_power* consumption * action.delta;
			
				if (capacitor_left < energy_consumption){
					energy_consumption = capacitor_left;
				}
				//console.log("took energy", energy_consumption);
				//L.setValue("NEW CONS", energy_consumption);
			
				var impulse = energy_consumption * performance;
				console.log("we go with", impulse, percent_of_power);
				unit.multiplyScalar(impulse);
			
				mesh.update_static_physical_data(action.ts)
			
				mesh.alterDeviceSetting(mesh.type.power_source, 'capacitor' ,function(value){
					L.setValue("NEW CONSump1", energy_consumption);
					var nv = value - energy_consumption;
					if (nv < 0) {return 0}
					else{ return nv }
					
				})
			
			
				if (engine_type == 'rotation'){
					mesh.angular_impulse.add(unit)
				}else if(engine_type == 'propulsion'){
				
					var tug = unit.clone().applyQuaternion(mesh.quaternion);
					mesh.impulse.add(tug);
				
				

			
				}	
			}
			
			
			
			// var performance = mesh.type.devices[action.dev].performance;
			//var performance = mesh.type.devices[action.dev].performance;
		}
		
		/*
		this.process_ = function(raw_action, mesh){
			// console.log("On the server", action);
			
			var process = function(object_guid, action){
				mesh.update_static_physical_data(action.ts)
				
				
				mesh.alterWorkpointValue("Piloting", 'capacitor' ,function(value){
					L.setValue("NEW CONSump1", raw_action.energy_consumption);
					var nv = value - raw_action.energy_consumption;
					if (nv < 0) {return 0}
					else{ return nv }
						
				})
				
				if (action.type === ROTATE){
					mesh.angular_impulse.add(action.vector)
				}else if(action.type === MOVE){
					if(action.vector instanceof T.Vector3){
						var v = action.vector
					}else{
						var v = new T.Vector3(action.vector.x, action.vector.y, action.vector.z)
					
					}
					var tug = v.clone().applyQuaternion(mesh.quaternion);
					mesh.impulse.add(tug);
					
					

				
				}
				
			}
			// console.log('call process',  _.has(raw_action,'vector') );
			
			if (_.has(raw_action, 'vector'))  { // Если акцию уже вычислили - будем применять все вектора на нее
				process('-', raw_action)
			}else{
				this.act_for_mesh(mesh, raw_action, process); // Если нет - то сначала вычислим их
			}
		};
		this.act_for_mesh=function(mesh, action, onAct){
			var C = mesh;
			var T = Controller.T();
			
			var ets ={};
			ets[ROTATE]='rotation';
			ets[MOVE] = 'propulsion';
			
			var et = ets[action.type]
			if(typeof action.p === 'string'){
				action.p = JSON.parse(action.p);
			}
			var ea = action.p.a ==0 ? 'x' : action.p.a ==1 ? 'y': 'z'
			if(action.p.d <0){ea +='-'}else{ea += '+' }
			var engine_name = et + "_" + ea
			
			var AX= action.p.a;
			var ar = [0,0,0];
			ar[AX] = action.p.d
			
			var vec = new T.Vector3();
			vec.fromArray(ar);         // AX == 'x'?new T.Vector3(a,0,0):(AX =='y'?new T.Vector3(0, a, 0): new T.Vector3(0,0,a))
			// Теперь его надо умножить на мощность двигателя и получить силу
			// Текущая мощность двигателя - это процент его мощности, умноженный на его максимальную мощность, умноженный на его КПД в джоулях
			// console.log(action.wp);
			var percent_of_power = mesh.getWorkpointValue(action.wp, "eng_" + engine_name + "_power");
			//console.log ("MM", mesh.workpoint_states,action.p, action.wp, "eng_" + engine_name + "_power");
			var max_power = mesh.type.engines[et][ea].consumption;
			var performance = mesh.type.engines[et][ea].performance;
			var energy_consumption = percent_of_power* max_power * action.delta;
			action.energy_consumption = energy_consumption;
			
			var capacitor_left = mesh.getWorkpointValue("Piloting", "capacitor");
			if (capacitor_left < energy_consumption){
				energy_consumption = capacitor_left;
			}
			//console.log("took energy", energy_consumption);
			//L.setValue("NEW CONS", energy_consumption);
			
			var impulse = energy_consumption * performance;
			//L.setValue("NEW IMPULSE", impulse);
			
			// var power = C.engines[et][ea];
			// console.log(percent_of_power, max_power, energy_consumption, impulse);
			
			vec.multiplyScalar(impulse);
			//console.log("action delta", action.ts, action.delta);
			// vec.multiplyScalar(action.delta)
			action.vector = vec
			
			// Нашли все силы и возвращаем обратно событие
			// console.log("MESH", "GUID", C);
			onAct(C.json.GUID, action)
			
		},
		this.act = function(S, action,  actor_guid, onAct_ ){
			// Эта функция создаёет акцию исходя из условий окружения
			// В данном случае нам надо создать подробно описывающее событие о том, что может и дожно происходить с кораблем
			if(S === undefined ) return;
			var C = S.mesh_for(actor_guid);
			var actor = S.actors[actor_guid];
			var onAct = function(guid, action){
				onAct_(guid, action);
			}
			action.wp = actor.control.workpoint;
			this.act_for_mesh(C, action, onAct );

			
		}
		*/
		// return this;
	
	};


Controller.basicAutoPilotActor=function (S, id, oid){
		this.targets = ["orbit_object", "close_to_object"];
		this.default_distance = 200
		this.get_foes = function(){
			this.foes = []
			for (var i =0; i < W.meshes.length; i++){
				if(i != id) foes.push({id:id, obj:W.meshes[i]})
			}
		}
	};

	
Controller.CTurretController = function(){
	this.type = 'turret';
	
	this.getUI = function(W, actor){
		var ui = function(){
			this.rules_height = 140
			this.actor = actor;
			this.construct = function(){
				this.cont = $('<div>').css({'position':'fixed',
								// 'border': '1px solid red',
								'width':"66px",
								'height': '170px',
								'top':40,
								'left':50,
								'background-color':'white'}).appendTo('body');
				
				var rul_cont = $('<div>').css({
					"width":  "100%",
					"height": this.rules_height + 'px',
					'background-color':'blue'
		
				}).appendTo(this.cont);
	
				var bul_cont = $('<div>').css({
					"width":  "100%",
					"height": (170 - this.rules_height) + "px",
					'background-color':'green'
				}).appendTo(this.cont);
	
				var auto_track_switch = $('<div>').css({'width':'22px',
														'height':'22px',
														'border-radius':'11px',
														'float':'left',
														'background-color':'white'}).appendTo(rul_cont);
				this.magazine_indicator = $('<div>').css(
					{'width':'22px',
					'height':  this.rules_height +  'px',
					'float':'left',
					'background-color':'red'}).appendTo(rul_cont);
				this.time_indicator = $('<div>').css(
					{'width':'22px',
					'height':  this.rules_height+  'px',
					'float':'left',
					'background-color':'red'}
				) .appendTo(rul_cont);
	
			}
			this._set_magazine_capacity = function(){
				var O = W.scenes[actor.scene].meshes[actor.control.object_guid];
				var wp = O.json.workpoints[actor.control.workpoint];
				var mag_cap = O.json.turrets[wp.turret].magazine_capacity;
				var _mag    = O.getWorkpointValue(actor.control.workpoint, "magazine");
				if (! _mag) _mag = 0;
				
				var percentage = _mag/ mag_cap;
				if(_mag  == 0){
					this.magazine_indicator.height("1px");
					this.magazine_indicator.css('background-color','red')
					
				}else{
					this.magazine_indicator.height(percentage * this.rules_height);
					this.magazine_indicator.css('background-color','green')
				}
				
				
				
				
			}
			this._set_readiness_timer = function(){
				var O = W.scenes[actor.scene].meshes[actor.control.object_guid];
				var wp = O.json.workpoints[actor.control.workpoint];
				var rate = O.json.turrets[wp.turret].turret_shoot_rate;
				var reload_rate = O.json.turrets[wp.turret].turret_reload_rate;
				
				var _ts  = O.getWorkpointValue(actor.control.workpoint, "last_shot_time");
				var ir_ts = O.getWorkpointValue(actor.control.workpoint, "is_reloading");
				var now  = new Date().getTime();

				var ir_diff = now - ir_ts;
				if(ir_diff > reload_rate){
					var _mag    = O.getWorkpointValue(actor.control.workpoint, "magazine");
				
					var diff = now - _ts;
					if(_mag === 0 ){
						percentage = 0;
					}else{
						if(diff > rate){
							var percentage = 1;
						} else{
							var percentage =  (diff / rate);
						}
					
					}
					
				}else{
					percentage = ir_diff/reload_rate;
				}
				
				
				this.time_indicator.height(percentage * this.rules_height);
				
				
			}
			this.refresh = function(){
				this._set_readiness_timer();
				this._set_magazine_capacity();
			}
		}
		
		var UI = new ui();
		return UI;
	}
		
	
	
	this.process = function(raw_action, mesh){
		// console.log("On the server", action);
		
		var process = function(object_guid, action){
			console.log("CHO", action.type === SHOOT, action.type == SHOOT, action.type)
			if(action.type == RELOAD_WEAPONS){
				
				console.log("process > REALODING:", action);
				mesh.saveWorkpointValue( action.wp, "is_reloading" , action.ts ); 
				mesh.saveWorkpointValue( action.wp, 'magazine', action.new_capacity);
			}
			if(action.type === HIT){
				console.log("process > HITED", action);
			}
			
			if (action.type == SHOOT){
				
				
				mesh.saveWorkpointValue(action.wp, "last_shot_time", action.ts);
				var am = mesh.getWorkpointValue(action.wp, 'magazine');
				if (am ){
					if (am !== 0){
						mesh.saveWorkpointValue(action.wp,"magazine", am - 1);
					}
				}
				
			}
			
		}
		// console.log('call process',  _.has(raw_action,'vector') );
		
		//if (_.has(raw_action, 'vector'))  { // Если акцию уже вычислили - будем применять все вектора на нее
		process('-', raw_action)
			//}else{
		//	this.act_for_mesh(mesh, raw_action, process); // Если нет - то сначала вычислим их
			// }
	};
	
		this.act = function(S, action,  actor_guid, onAct ){
			if (S === undefined){return;}
			
			var C = S.mesh_for(actor_guid);
			
			if (action.type === HIT){
				console.log("we already processed  hit", action);
				
				return;
			}
			if(action.type === RELOAD_WEAPONS){
				// Here we could check if we can reload - isn't bullet bunker empty?
				var actor = S.get_actor(actor_guid);
				var O = S.meshes[actor.control.object_guid];
				var wp = O.json.workpoints[actor.control.workpoint];
				var mag_cap = O.json.turrets[wp.turret].magazine_capacity;
				
				actor = S.get_actor(actor_guid);
				action.wp = actor.control.workpoint;
				action.new_capacity = mag_cap;
				onAct(C.json.GUID, action);
			}
			if (action.type === SHOOT ){
				// if(! is_down) return;
				// console.log('>>>');
				// var weapon = C.weapons[0];
				//console.log("shot by", actor)
				
				var T = Controller.T();
				//console.log("Woah");
				
				// TODO Надо сделать простой способ проверить попадание в текующую цель исходя из данных в сообщении
				// TODO Не будем гнаться за достоверностью - проверяем достоверности попадания + вводим величину везения.
				// TODO Кратчайшее расстояние между скрещивающимися кривыми и сравнение с физическими размерами
				// TODO Умноженное на коэффициенты разброса
				// Для медленно движующихся зарадов вычислять вероятность их попадания - возможность изменить скорость цели так, чтобы попасть под обстрел или уйти от него
				// Для ракет - это будут функции захвата цели и выстрела - влияния на состояние турели.
				
				
				var seed = Math.random() // Это зерно будет использоваться для вычисления вероятностей и оно должно быть записано в сообщение - чтобы позволить серверу вычислить параметры попадания детерминированно
				// console.log(action)
				// Теперь высляем вектор выстрела в мировых координатах
				var shoot_vec = new T.Vector3(action.p.turret_direction.x,
											  action.p.turret_direction.y,
											  action.p.turret_direction.z);

				//dist
				// For all targets:
				// calculate closest distance and time to that 
				// console.log("ACTOR", actor);
				
				var C = S.mesh_for(actor_guid);
				var object = C.json
				var actor = S.actors[actor_guid];
				
				
				var wp = object.workpoints[actor.control.workpoint];
				
				var last_shot_time = C.getWorkpointValue(actor.control.workpoint, "last_shot_time")
				var is_reloading = C.getWorkpointValue(actor.control.workpoint, "is_reloading"  ); 
				var _mag = C.getWorkpointValue(actor.control.workpoint, "magazine")
				
				console.log("SERV act before", action);
				// console.log("LOG TIMES", is_reloading, last_shot_time,  action.ts - is_reloading, action.ts - last_shot_time);
				
				if( (action.ts -  is_reloading) < C.json.turrets[wp.turret].turret_reload_rate){
					return ;
				}
				console.log("SERV act - reloaded", action);
				
				if(_mag == 0){
					return ;
				}
				console.log("SERV act full mag", action);
				
				if (last_shot_time){
					// console.log("last shot time", last_shot_time,(action.ts - last_shot_time ) < C.json.turrets[wp.turret].turret_shoot_rate );
					if((action.ts - last_shot_time ) < C.json.turrets[wp.turret].turret_shoot_rate){
						// console.log('no shoot');
						return; // this turret cannot shoot now
					}
				}
				console.log("SERV act shoot freely", action);
				
				// console.log("BOOOSH!");
				
				
				var turret = object.turrets[ wp.turret ] 
				
				var turret_position_vector = new T.Vector3();
				turret_position_vector.fromArray(turret.position );
				
				var bullet_pos = C.position.clone()
				bullet_pos.add(  turret_position_vector.clone() )
				
				shoot_vec.sub(bullet_pos.clone())
				// Надо составить список мешей, через которые проходит луч траектории движения снаряда с учетом вероятности попадания
				var collidables = [];
				_.each(S.meshes, function(mesh, i){
					if(i ==  actor.control.object_guid) return;
					
					var target_pos = mesh.position.clone();
					var target_impulse = mesh.impulse.clone();
					var target_velocity = target_impulse.multiplyScalar(1/mesh.mass);
					
					// Увеличим скорость во много-много раз
					// shoot_vec.multiplyScalar( 100 );
					target_pos.sub( bullet_pos );
					target_velocity.sub( shoot_vec );
					
					var dot = target_pos.dot(target_velocity);
					
					
					var cosp = dot/( target_pos.length() * target_velocity.length() )
					var sinp = Math.sqrt(1 - cosp*cosp);
					
					var v = Math.abs(cosp) * target_velocity.length();
					// console.log(v, target_pos.length());
					var time = target_pos.length() / v 
					var distance = sinp * target_pos.length(); // Максимальная дистанция, в которой пройдет снаряд от корабля
					
					//console.log("distance and time", distance, time);
					
					// Решение о попадании надо принимать здесь
					//  distance Может уменьшиться в зависимости от скиллов игрока и характеристик оружия
					
					// Сравнение с геометрическими размерами тела:
					var boundRadius = mesh.geometry.boundingSphere;
					// console.log("SPHERE", boundRadius.radius, distance);
					if(distance < boundRadius.radius){
						// hit 
						collidables.push({time: time, mesh:i, distance:distance})
						
					}
					
					// Синус - это мера попадания. При умножении её на вектор позиции мы узнаем на какой дистанции пройдет снаряд от цели
					// Косинус дает представление о времени  до контакта. Если косинус отрицательный - значит  
					// console.log("sin and cos", target_pos.toArray(), mesh.position.toArray(), sinp, cosp);
					
				});
				// Теперь, надо запихнуть это событие в очередь процессинга:
				// 1. Событие - импульс на нас, которое может включать также измение состояний внутренних приборов - например количество патронов
				// 2. В случае попадания - отправить в будущее событие об изменении импульса и состояния цели.
				
				action.wp = actor.control.workpoint;
				console.log("checkout if we got it");
				if (collidables.length > 0){
					var col = _.sortBy(collidables, function(i){ return i.time})[0]
					var  mesh_id = col.mesh
					action.hit = true;
					action.time = col.time;
					action.mesh = mesh_id;
					action.distance = col.distance;
					action.seed = seed;
					
					var hit_action = {};
					hit_action.ts = action.ts + action.time;
					hit_action.slave = true;
					hit_action.parent = action.ident;
					hit_action.diff = action.diff;
					hit_action.power = 100500;
					hit_action.distance = col.distance;
					hit_action.mesh = mesh_id;
					hit_action.controller = "turret";
					hit_action.type = HIT;
					hit_action.actor = action.actor;
					// console.log("HIT", action, hit_action);
					console.log("HIHIHIT", action.time);
					onAct(mesh_id, hit_action);
					
					
				}else{
					action.hit = false;
				}
				onAct(C.json.GUID, action);
				 
				
			
			}
		}
		// return this;
	
	};
Controller.ControllersActionMap= function(){
		if (this._ControllersActionMap){
			return this._ControllersActionMap
		}else{
			// Вообще нам бы не помешали инстансы контролов инициализированные для своей wp чтобы не конопатить мозг.
			var PilotController = new Controller.CPilotController();
			var TurretController = new Controller.CTurretController();
			var SettingsController = new Controller.CSettingController();
			this._ControllersActionMap = {}
			//this._ControllersActionMap[MOVE]= PilotController;
			//this._ControllersActionMap[ROTATE]=PilotController;
			this._ControllersActionMap['pilot']= PilotController;
			this._ControllersActionMap['engine']= PilotController;
			
			this._ControllersActionMap['turret']= TurretController;
			this._ControllersActionMap['settings'] = SettingsController;
			
			return this._ControllersActionMap;
			
		}
	}

if(typeof window === 'undefined'){
	Controller.T = function(){
		return THR
	};
	Controller.createShotParticle=function(){
		var T = this.T();
		console.log('P');
		var cubeGeometry = new T.CubeGeometry(1,1,1,1,1,1);
		var map	= T.ImageUtils.loadTexture( "/textures/lensflare/lensflare0.png" );
		var SpriteMaterial = new T.SpriteMaterial( { map: map, color: 0xffffff, fog: true } );
		return new T.Object3D();
	};

}else{
	Controller.T = function(){
		return THREE
	};
	Controller.createShotParticle=function(){
		var T = this.T();
		// console.log("particle")
		// var cubeGeometry = new T.CubeGeometry(1,1,1,1,1,1);
		var map	= T.ImageUtils.loadTexture( "/textures/lensflare/lensflare0.png" );
		var material = new T.SpriteMaterial( { map: map, color: 0xffffff, fog: true } );
		material.transparent = true;
		material.blending = THREE.AdditiveBlending;
		
		// var a = new T.Sprite(material);
		var a = new T.Mesh(new T.SphereGeometry(2));
		a.static = false;
		a.has_engines = false;
		return a
	};
	
}

Controller.BasicBulletActor=function(S, id, coid){ 
		// id = is object in the world controllable by this actor
		// coid  MUST BE an object, who shoot this bullet
		//var S = W.scene
		this.name = "Basic_actor_" + (new Date().getTime())
		// this.W;
		this.oid = id
		this.coid = coid
		// console.log(id);
		this.my_mesh = S.meshes[id]
		//console.log("MY MESH", this.my_mesh, id)
		var self = this;
		// console.log(W.meshes, id, W.meshes.length)
		var total_time_in_space = 0;
		var _possible_targets = {};
		var T = Controller.T();
	
		this.run = function(time_left){
			total_time_in_space += time_left
			//console.log('running');
			if (total_time_in_space > 10){
				//S.meshes.splice(id, 1)
				//console.log("removing")
				S._delete_object(id)
				delete S.automatic_actors[this.name];
			}
			var vel = this.my_mesh.vel.clone();
			var mpos = this.my_mesh.position.clone();
		
			var thres = 4 * this.my_mesh.vel.length();
			var in_thres = [];
			//console.log("THRes", thres);
		
			_.each( S.meshes, function(m,i) {
				if(i === id || i === coid) return;
				if(m.is_not_collidable) return;
				// var m = W.meshes[i];
				var mp =  m.position.clone();
				var pd = mp.sub( mpos )
				// console.log( vel, pd )
				var ag = Math.acos(pd.dot(vel)/ vel.length() / pd.length()) // угол между направлением движения и центром объекта
				if (ag < Math.PI/16)
				{
					//console.log('ag');
					// console.log("HH", i, ag, Math.PI/8);
				
					// console.log("id vefore", 	id, );
					var sub = self.my_mesh.position.clone().sub( mp );
					
					var dist = sub.length()
					if( dist < thres){
						//console.log("OKE");
						if( in_thres.indexOf( i ) === -1 ){
							//console.log('possible');
						
							in_thres.push(i) // Add mesh index
							target = {last_point :mpos.clone(),
									  last_angle : ag,
									  last_distance : dist,
									  angle_raise : 0,
									  distance_raise :0,
									  distance_shortens : 0,
									  angle_lowers : 0,
								  	  id : i}
							_possible_targets[i] = target
						}//else{}
					}
					
				}else{
					if(i in _possible_targets){
						//console.log('POS', i)
						// Угол был острый - стал тупой
						// console.log("here!",i);
						// Надо проверить, не пересекает ли отрезок - прошлые координаты - текущие координаты наш меш
						var direction = mpos.clone().sub( _possible_targets[i].last_point)
						var ray = new T.Raycaster(_possible_targets[i].last_point, direction.clone().normalize() )
						if(S.need_update_matrix){
							m.updateMatrixWorld();
						}
						var isr = ray.intersectObjects([m])
						//if (m.type == 'ship'){
							
							// console.log("matrix autoupd", m.matrixWorld.elements)
							// console.log(mpos);
							// console.log(ray,isr)
							
							//}
						
						//console.log( m.type )
						if (isr.length > 0 && isr[0].distance < direction.length() ){
							//for( var index =0; index<isr.length; index++){
							//	console.log("HERE", isr[index].distance, direction.length())
							///}
					
							// console.log('HIT')
							// console.log("END", isr[0].point);
							m.worldToLocal(isr[0].point) // Теперь это плечо удара
							var impulse = self.my_mesh.impulse;  //vel.clone().multiplyScalar(self.my_mesh.mass)
							var axis = new T.Vector3().crossVectors(isr[0].point, impulse)
					
							var ag = Math.acos(isr[0].point.clone().dot(impulse) / impulse.length() / isr[0].point.length() )
							// Теперь это вращение надо разбить по осям
							var mat = new T.Matrix4().makeRotationAxis(axis.normalize(), ag)
							var eul = new T.Euler()
							eul.setFromRotationMatrix(mat, "XYZ")
							// console.log(i, eul)
							var avel = new T.Vector3();
							avel.x = eul.x;
							avel.y = eul.y;
							avel.z = eul.z;
							var ck = isr[0].point.length() * Math.sin(ag - Math.PI/2)
					
							// console.log(this.my_mesh.mass / m.mass * (ck * ck ));
							avel.multiplyScalar(self.my_mesh.mass/m.mass * Math.abs(ck))
					
							// Не учитываю массу и плечо... 
							var mavel = S.meshes[i].avel
							if (! mavel ){mavel = new T.Vector3(0,0,0)}
							mavel.x += avel.x
							mavel.y += avel.y
							mavel.z += avel.z;
							// console.log(mavel.x, mavel.y, mavel.z)
							S.meshes[i].avel = mavel;
					
					
					
							// add_vel = impulse.multiplyScalar( 1/ m.mass);
							// console.log(add_vel)
							// Убрать пока скорость
							//if (S.meshes[i].vel){
								// console.log(S.meshes[i].impulse)
							S.meshes[i].impulse.add( impulse );
							// console.log(S.meshes[i].impulse)
								// }
					
					
							//console.log("END LOCAL", isr[0].point);
							//console.log('oke, we shoot it:', i)
							// Now we will just remove object from scene with the bullet
							//W.scene.remove(W.meshes[i])
							S._delete_object(id)
							
							//if(S.three_scene){
							//	S.three_scene.remove(S.meshes[id]) // удяляем ядро из сцены
							//}
							//delete S.meshes[ id ]; // ... из мешей
							delete S.actors[self.name]; // ... Удаляем этого актора - больше не загрузится эта функция
					
							//W.meshes.splice(i, 1);
							delete _possible_targets[i] // ... из возможных целей удаляем этот меш
							// bla.bla = 1
						}else{
							delete _possible_targets[i];
						
						}
					}
					// console.log( ag, Math.PI/8);
				
				}
			
			})
			//bla.bal +=1
			//console.log(bla)
		
		
			// console.log(total_time_in_space ,W.meshes.length, W.actors)
		}
	
	
	};
	
var Controllers = function (){

	var dev_con_proto = {
		process : function(action){
			mesh.setDeviceSetting(device.id, action.name, action.value);
	
		}
	};
	this.EngineController = function(mesh, device_id){
		
		this.getUI = function(W){
			
		}
		
		this.process = function(action){
			var T = Controller.T();
	
			var unit = new T.Vector3();
			unit.fromArray(mesh.type.devices[action.dev].unit);
			var engine_name = mesh.type.devices[action.dev].engine_type + "_" + mesh.type.devices[action.dev].name;
			var percent_of_power = mesh.getDeviceSetting(action.dev, "power");
			var engine_type = mesh.type.devices[action.dev].engine_type;
	
			var performance = mesh.type.devices[action.dev].performance;
			var consumption = mesh.type.devices[action.dev].consumption;
			var capacitor_left = mesh.getDeviceSetting(mesh.type.power_source, "capacitor");
			var energy_consumption = percent_of_power* consumption * action.delta;
	
			if (capacitor_left < energy_consumption){
				energy_consumption = capacitor_left;
			}
			var impulse = energy_consumption * performance;
			unit.multiplyScalar(impulse);
			mesh.update_static_physical_data(action.ts)
	
			mesh.alterDeviceSetting(mesh.type.power_source, 'capacitor' ,function(value){
				var nv = value - energy_consumption;
				if (nv < 0) {return 0}
				else{ return nv }
			
			})
	
	
			if (engine_type == 'rotation'){
				mesh.angular_impulse.add(unit)
			}else if(engine_type == 'propulsion'){
				var tug = unit.clone().applyQuaternion(mesh.quaternion);
				mesh.impulse.add(tug);
			}	
		}
	}
	this.EngineController.device_types = "engine";
	
	this.ShieldController = function(mesh, device_id){
		
		this.process = function(action){
			mesh.alterDeviceSetting(device_id, 'state', function(v){ return !v});
		}
		this.getUI = function(W){
			var ui = function(){
				this.construct = function(){
					var shield_dev = mesh.type.devices[device_id];
					
					var my_ind = $("#shield_indicator_"+device_id);
					console.log(my_ind.size());
					if(my_ind.size() != 0){
						my_ind.remove();
					}
			
					var shc = $("#shields_holder_container")
					if(shc.size() == 0){
						shc = $('<div id="shields_holder_container">').css({
							position:'fixed',
							left:0,
							height:50,
							bottom:50,
							'background-color':'#f3f',
							width:400
					
						}).appendTo('body');
					}
					var d  = $('<div >').attr('id',"shield_indicator_"+device_id) .css({width:50, height:"100%", float:'left', 'margin-right':"10px"}).appendTo(shc);
					var sic = $('<div>').css({width:"100%", height:10 }).appendTo(d) // strenth indicator container
					var l = shield_dev.shield_type.toLocaleUpperCase();
					var b = $('<div>').css({width:"100%", height:30,
											"text-align":'center',
											'vertical-align': 'middle',
											'line-height':'30px',
											'background-color':'#333','color':"#F0F"})
										.text(l).appendTo(d).click(function(){
									
											mesh.startDeviceAction(device_id, "toggle",0);
									
										}) 
					var cic = $('<div>').css({width:"100%", height:10}).appendTo(d) // capacitor indicator container
			
					var si = $('<div>').css({width:"100%", height:"100%", 'background-color':"blue" }).appendTo(sic);
					var ci = $("<div>").css({width:"100%", height:"100%",'background-color':"yellow" }).appendTo(cic);
					this._redraw_closure = function(){
						var reserve_cap_amount = mesh.getDeviceSetting(device_id, "reserve_capacity");
						var tot_cap_amount = shield_dev.capacitor;
						var w = reserve_cap_amount/tot_cap_amount * 100;
						ci.width( w + '%' );
				
						var is_on = mesh.getDeviceSetting(device_id, 'state') ;
						if (is_on){
							b.css({color:'red', 'background-color':'white'});
						}else{
							b.css({'background-color':'#333','color':"#F0F"});
						}
				
						var current_capacity = mesh.getDeviceSetting(device_id, 'capacity');
						var max_capacity = shield_dev.capacity;
						var ww =( current_capacity / max_capacity * 100) + "%";
						si.width(ww);
				
						// console.log("updating shield", shield, num);
					}
				}
				this.refresh = function(){
					this._redraw_closure();
				}
			}
			return new ui();
			
			
		}
	}
	this.ShieldController.device_types = "shield";
	
	this.EnergyCoreController = function(mesh, device_id){
		
		this.process = function(action){
			mesh.setDeviceSetting(action.dev_id, action.name, action.value);
		}
		this.getUI = function(W){
			var ui = function(){
				this.indicators_length = 110;
				this.total_width = 170;
				
				this.construct = function(){
					this.cont = $('<div>').css({
						'position':'fixed',
						// 'border': '1px solid red',
						'width': this.total_width + "px",
						'height': '60px',
						'top':40,
						'left':50+300,
						'background-color':'white'
					}).appendTo('body');
					
					this.indicators = $('<div>').css({
						"width": this.indicators_length,
						"height":"100%",
						"float": "left",
						'background-color':'white'
					}).appendTo(this.cont);

					this.switches = $('<div>').css({
						"width": this.total_width - this.indicators_length ,
						"height":"100%",
						"float": "left",
						'background-color':'white'
					}).appendTo(this.cont);
				
					this.fuel_indicator = $('<div>') .css({
						"width": this.indicators_length ,
						"height":"25%",
						// "float": "left",
						'background-color':'green'
					}).appendTo(this.indicators);
			
					this.power_indicator = $('<div>') .css({
						"width": this.indicators_length ,
						"height":"25%",
						// "float": "left",
						'background-color':'red'
					}).appendTo(this.indicators);
				
					this.capacitor_indicator = $('<div>') .css({
						"width": this.indicators_length ,
						"height":"50%",
						// "float": "left",
						'background-color':'yellow'
					}).appendTo(this.indicators);
					var self = this;
					this.engines_key = $("<div>").css({
						width:"100%",
						height:"20px",
					
					}).text("E").appendTo(this.switches).click(function(){
						self._engines_dialog();
					});
				
					this.shield_key = $("<div>").css({
						width:"100%",
						height:"20px",
					
					}).text("S").appendTo(this.switches).click(function(){
						self._shields_dialog();
					});;
				
					this.turret_keys = $("<div>").css({
						width:"100%",
						height:"20px",
					
					}).text("T").appendTo(this.switches);
			
			
				}
				this._shields_dialog = function(){
					//var mesh = W.scenes[actor.scene].meshes[actor.control.object_guid];
					//var scene = W.scenes[actor.scene];
					
					cont = $('<div>').css({
						'position':'absolute',
						// 'border': '1px solid red',
						'width': 400 + "px",
						'height': '600px',
						'top':40 + 100,
						'left':50+300,
						'padding': "10px",
						'border-radius':'3px',
						'border-width':'1px',
						'border-style':'solid',
						'border-color':'#aaa',
						'background-color':'#222'}).appendTo('body');
					var  cc = $('<div>').appendTo(cont).css({'width':"100%",height:20, 'padding-bottom': '30px'});
					var  closer = $('<div>').appendTo(cont).css({'width':"20", height:20, 'background-color':'red', float:'right' }).click(function(){
						cont.remove();
					}).appendTo(cc);
					
					_.each(mesh.type.shields, function(s, i){
						if (i === 'thermal'){return}
						_.each(s, function(shield_id){
							var e1 = $("<div>").css({
								width:300,
								height:40
							}).appendTo(cont);
								
							$('<div>').css({'float':'left', 'color':'#bbb'}).width(40).text(i).appendTo(e1) 
							var slc =  $('<div>').css({'float':'left', width:120,'margin-left':10}).appendTo(e1);
						
							var pc = new PowerControlWidget({container:slc[0], starting_percent:0, end_percent:1.5,progress_value:0,
								change: function( val ) {
									mesh.startDeviceAction(mesh.type.power_source, "power", val, {"dev_id": shield_id});

								},
								slide:function(val){ 
								}
								
							});
							// var sett =  "s_" + i + num + "_power"
							var cur_val = mesh.getDeviceSetting(shield_id, "power");
							pc.set_value( cur_val );
							
						})
					})
					
				};
				
				this._engines_dialog = function(){

					//var mesh = W.scenes[actor.scene].meshes[actor.control.object_guid];
					//var scene = W.scenes[actor.scene];

					cont = $('<div>').css({
						'position':'absolute',
						// 'border': '1px solid red',
						'width': 400 + "px",
						'height': '600px',
						'top':40 + 100,
						'left':50+300,
						'padding': "10px",
						'border-radius':'3px',
						'border-width':'1px',
						'border-style':'solid',
						'border-color':'#aaa',
						'background-color':'#222'}).appendTo('body');
						var  cc = $('<div>').appendTo(cont).css({'width':"100%",height:20, 'padding-bottom': '30px'});
						var  closer = $('<div>').appendTo(cont).css({'width':"20", height:20, 'background-color':'red', float:'right' }).click(function(){
							cont.remove();
						}).appendTo(cc);;
					
					
					_.each(mesh.type.engines, function(engines, engine_type){
						
						_.each(engines, function(engine_id){
							
							// var et = engine_type;
							// var ea = en;
							var en_dev = mesh.type.devices[engine_id];
							
							var e1 = $("<div>").css({
								width:300,
								height:40
								}).appendTo(cont);
						
							$('<div>').css({'float':'left', 'color':'#bbb'}).width(40).text(en_dev.name).appendTo(e1) 
							var slc =  $('<div>').css({'float':'left', width:120,'margin-left':10}).appendTo(e1);
							
							var pc = new PowerControlWidget({container:slc[0], starting_percent:0, end_percent:1.5,progress_value:0,
								change: function( val ) {
									mesh.startDeviceAction(mesh.type.power_source, "power", val, {"dev_id": engine_id});

								},
								slide:function(val){ 
									// mesh.startDeviceAction(engine_id, "set_power", val);
								}
									
							});
							// var sett =  "eng_" + engine_name + "_power"
							var cur_val = mesh.getDeviceSetting(engine_id, "power" );
							pc.set_value( cur_val );
								
						})
					})
				}
				this._update_fuel_indicator = function(){}
				this._update_power_indicator = function(){}
				this._update_capacitor_indicator = function(){
					// var mesh = W.scenes[actor.scene].meshes[actor.control.object_guid];
					var psd = mesh.type.devices[mesh.type.power_source];
					var total_cap = psd.capacitor;
					var current_cap = mesh.getDeviceSetting(mesh.type.power_source, "capacitor");
					
					L.setValue("CUR CONS", current_cap);
			
					if(current_cap > total_cap){
						percentage = 1;
					}else{
						percentage = current_cap / total_cap;
					}
					this.capacitor_indicator.width(percentage * this.indicators_length);
					
					
				}
				
				this.refresh = function(){
					this._update_fuel_indicator();
					this._update_power_indicator();
					this._update_capacitor_indicator();
					
				}
			}
			return new ui();
			
		}
	}
	this.EnergyCoreController.device_types = "power";
	this.TurretController  = function(mesh, device_id){
		this.process = function(action){
			//console.log("CHO", action.type === SHOOT, action.type == SHOOT, action.type)
			var turret = mesh.type.devices[device_id];
			if(action.name == 'reload'){
				
				// console.log("process > REALODING:", action);
				mesh.setDeviceSetting( device_id, "is_reloading" , action.ts ); 
				mesh.setDeviceSetting( device_id, 'magazine', turret.magazine_capacity);
			}
			
			if (action.name == 'fire'){
				
				
				//console.log("FIRED");
				
				
				var T = Controller.T();
				
				
				var seed = Math.random() // Это зерно будет использоваться для вычисления вероятностей и оно должно быть записано в сообщение - чтобы позволить серверу вычислить параметры попадания детерминированно
				// console.log(action)
				// Теперь высляем вектор выстрела в мировых координатах
				var shoot_vec = new T.Vector3();
				shoot_vec.fromArray(action.wmouse);

				//dist
				// For all targets:
				// calculate closest distance and time to that 
				// console.log("ACTOR", actor);
				
				//var C = S.mesh_for(actor_guid);
				//var object = C.json
				//var actor = S.actors[actor_guid];
				
				
				//var wp = object.workpoints[actor.control.workpoint];
				
				var last_shot_time = mesh.getDeviceSetting(device_id, "last_shot_time")
				var is_reloading = mesh.getDeviceSetting(device_id, "is_reloading"  ); 
				var _mag = mesh.getDeviceSetting(device_id, "magazine")
				
				// console.log("SERV act before", action);
				// console.log("LOG TIMES", is_reloading, last_shot_time,  action.ts - is_reloading, action.ts - last_shot_time);
				
				if( (action.ts -  is_reloading) < mesh.type.devices[device_id].turret_reload_rate){
					return ;
				}
				//console.log("SERV act - reloaded", action);
				
				if(_mag == 0){
					return ;
				}
				//console.log("SERV act full mag", action);
				
				if (last_shot_time){
					// console.log("last shot time", last_shot_time,(action.ts - last_shot_time ) < C.json.turrets[wp.turret].turret_shoot_rate );
					if((action.ts - last_shot_time ) < mesh.type.devices[device_id].turret_shoot_rate){
						// console.log('no shoot');
						return; // this turret cannot shoot now
					}
				}
				//console.log("SERV act shoot freely", action);
				
				//console.log("BOOOSH!");
				var shoot_impulse = mesh.type.devices[device_id].shoot_impulse;
				// TODO Применить выстрел к собственному импульсу - 
				
				
				mesh.setDeviceSetting(device_id, "last_shot_time", action.ts);
				mesh.alterDeviceSetting(device_id, 'magazine', function(v){
                    console.log("mag");
					return v - 1;
				})
				//console.log("Now let's see, did we get somebody");
				
				var turret = mesh.type.devices[ device_id ] ;
				
				var turret_position_vector = new T.Vector3();
				turret_position_vector.fromArray( turret.position );
				
				var bullet_pos = mesh.position.clone()
				bullet_pos.add(  turret_position_vector.clone() )

				var BULLET_MASS = 1;
				
				shoot_vec.sub(bullet_pos.clone()) // Направление выстерла
				shoot_vec.multiplyScalar( shoot_impulse / BULLET_MASS ); // скорость выстрела
				
				// Надо составить список мешей, через которые проходит луч траектории движения снаряда с учетом вероятности попадания
				var collidables = [];
				_.each(mesh._scene.meshes, function(tmesh, i){
					if(i ==  mesh.GUID) return;
					
					var target_pos = tmesh.position.clone();
					var target_impulse = tmesh.impulse.clone();
					var target_velocity = target_impulse.multiplyScalar(1/tmesh.mass);
					
					// Увеличим скорость во много-много раз
					target_pos.sub( bullet_pos );
					target_velocity.sub( shoot_vec );
					
					var dot = target_pos.dot(target_velocity);
					
					
					var cosp = dot/( target_pos.length() * target_velocity.length() )
					var sinp = Math.sqrt(1 - cosp*cosp);
					
					var v = Math.abs(cosp) * target_velocity.length();
					// console.log(v, target_pos.length());
					var time = target_pos.length() / v 
					var distance = sinp * target_pos.length(); // Максимальная дистанция, в которой пройдет снаряд от корабля
					
					//console.log("distance and time", distance, time);
					
					// Решение о попадании надо принимать здесь
					//  distance Может уменьшиться в зависимости от скиллов игрока и характеристик оружия
					
					// Сравнение с геометрическими размерами тела:
					var boundRadius = tmesh.geometry.boundingSphere;
					// console.log("SPHERE", boundRadius.radius, distance);
					//console.log(target_velocity.toArray(), shoot_vec.toArray());
					if(distance < boundRadius.radius){
						// hit 
						collidables.push({time: time, mesh:tmesh, distance:distance})
						
					}
					
					
					// Синус - это мера попадания. При умножении её на вектор позиции мы узнаем на какой дистанции пройдет снаряд от цели
					// Косинус дает представление о времени  до контакта. Если косинус отрицательный - значит  
					// console.log("sin and cos", target_pos.toArray(), mesh.position.toArray(), sinp, cosp);
					
				});
				// Теперь, надо запихнуть это событие в очередь процессинга:
				// 1. Событие - импульс на нас, которое может включать также измение состояний внутренних приборов - например количество патронов
				// 2. В случае попадания - отправить в будущее событие об изменении импульса и состояния цели.
				
				if (collidables.length > 0){
					var  col = _.sortBy(collidables, function(i){ return i.time})[0]
					var  tmesh = col.mesh // Попали!
					//console.log("We got your ASS");
					
					var action_processor = function(){
						// console.log("here we will process the hit");
						var shield_hp = shoot_impulse * 0.7;
						var armor_hp  = shoot_impulse * 0.8;
						var hull_hp = shoot_impulse * 1.05;
						var sh_seq = tmesh.shields.concat(tmesh.armors)
						sh_seq.push(tmesh.type.hull_device)
						
						var rec = function(seq){
							if (seq.length == 0){return};
							var f = seq[0];
							var dev = mesh.type.devices[f]
							
							var tail = seq.slice(1);
							var hp;
							if (dev.shield_type == 'armor'){hp = shoot_impulse * 0.7}
							if (dev.shield_type == 'shield'){hp = shoot_impulse * 0.8}
							if (dev.shield_type == 'hull'){hp = shoot_impulse * 1.05}
							
							
							tmesh.alterDeviceSetting(f, "capacity", function(v){
								if (v <= 0){ rec(tail); return 0;}
								var nv = v - hp;
								if(nv <= 0){ return 0 }else{return nv};
							})
						}
						//console.log('launch req');
						rec(sh_seq);
						//console.log("HERE's OUR RESULTS")
						// DEBUG"
						_.each(sh_seq, function(d){
							var sh = tmesh.getDeviceSetting(d, "capacity")
							var dev = tmesh.type.devices[d];
							//console.log("DEBUGGING SHOTS", d, dev.name, sh);
						})
						//ENDOF DEBUG
						
						
						
						
					}
					tmesh.startVirtualDeviceAction(action_processor, action.ts + col.time, action.ident + col.time);
					
					
					
				}
				
			}
			
		}
		this.getUI = function(W){
    		var ui = function(){
    			this.rules_height = 140
                this.onAction = function(W, scene_guid, action){
                    var three_scene = W.three_scenes[scene_guid];
                    
                    var expl = SpriteUtils.createExposionObject(
                                    "#" + action.mesh + "_"+action.ident, 
                                    action.ts, 
                                    action.wmouse, 
                                    10,
                                    three_scene, 
                                    W);
                },
                this.construct = function(){
    				this.cont = $('<div>').css({'position':'fixed',
    								// 'border': '1px solid red',
    								'width':"66px",
    								'height': '170px',
    								'top':40,
    								'left':50,
    								'background-color':'white'}).appendTo('body');
		
    				var rul_cont = $('<div>').css({
    					"width":  "100%",
    					"height": this.rules_height + 'px',
    					'background-color':'blue'

    				}).appendTo(this.cont);

    				var bul_cont = $('<div>').css({
    					"width":  "100%",
    					"height": (170 - this.rules_height) + "px",
    					'background-color':'green'
    				}).appendTo(this.cont);

    				var auto_track_switch = $('<div>').css({'width':'22px',
    														'height':'22px',
    														'border-radius':'11px',
    														'float':'left',
    														'background-color':'white'}).appendTo(rul_cont);
    				this.magazine_indicator = $('<div>').css(
    					{'width':'22px',
    					'height':  this.rules_height +  'px',
    					'float':'left',
    					'background-color':'red'}).appendTo(rul_cont);
    				this.time_indicator = $('<div>').css(
    					{'width':'22px',
    					'height':  this.rules_height+  'px',
    					'float':'left',
    					'background-color':'red'}
    				) .appendTo(rul_cont);

    			}
    			this._set_magazine_capacity = function(){
    				// var O = W.scenes[actor.scene].meshes[actor.control.object_guid];
    				//var wp = O.json.workpoints[actor.control.workpoint];
    				var mag_cap = mesh.type.devices[device_id].magazine_capacity;
    				var _mag    = mesh.getDeviceSetting(device_id, "magazine");
    				if (! _mag) _mag = 0;
		
    				var percentage = _mag/ mag_cap;
                    // console.log(this.magazine_indicator);
    				if(_mag  == 0){
    					this.magazine_indicator.height("1px");
    					this.magazine_indicator.css('background-color','red')
			
    				}else{
                        // console.log("hh", device_id, percentage * this.rules_height)
    					this.magazine_indicator.height(percentage * this.rules_height);
    					this.magazine_indicator.css('background-color','green')
    				}
		
		
		
		
    			}
    			this._set_readiness_timer = function(){
    				var rate = mesh.type.devices[device_id].turret_shoot_rate;
    				var reload_rate = mesh.type.devices[device_id].turret_reload_rate;
		
    				var _ts  = mesh.getDeviceSetting(device_id, "last_shot_time");
    				var ir_ts = mesh.getDeviceSetting(device_id, "is_reloading");
    				var now  = new Date().getTime();
                    // console.log(_ts, ir_ts, now);
    				var ir_diff = now - ir_ts;
    				if(ir_diff > reload_rate){
    					var _mag    = mesh.getDeviceSetting(device_id, "magazine");
		
    					var diff = now - _ts;
    					if(_mag === 0 ){
    						percentage = 0;
    					}else{
    						if(diff > rate){
    							var percentage = 1;
    						} else{
    							var percentage =  (diff / rate);
    						}
			
    					}
			
    				}else{
    					percentage = ir_diff/reload_rate;
    				}
		
		
    				this.time_indicator.height(percentage * this.rules_height);
		
		
    			}
    			this.refresh = function(){
    				this._set_readiness_timer();
    				this._set_magazine_capacity();
    			}
    		}

    		var UI = new ui();
    		return UI;
		}
	}
	this.TurretController.device_types = "turret";
	this.VirtualDeviceController = function(mesh, device_id){
		this.getUI = function(){}
		this.process = function(action){
			// Call it;
			// console.log("okey - we could do thing here",action);
			
			mesh._foreign_procs[action.ts]();
		}
	}
	this.VirtualDeviceController.device_types = "virtual";
	
	var controllersMap = {}
	for(i in this){
		controllersMap[this[i].device_types] = this[i];
	}
	this.controllersMap = controllersMap;
	// console.log(">>", this.controllersMap);

}
var cc = new Controllers();
Controller.deviceControllers = cc;
module.exports = Controller
//var TurretController = new CTurretController()
//CPilotController.prototype = {constructor:CPilotController}
//var PilotController = new CPilotController();

//console.log(TurretController.act, PilotController.act)
