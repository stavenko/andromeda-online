var Cons = function(auth_hash){
	var origin = window.location.origin
	//console.log("What if I try to do it twice");
	this.socket =  io.connect(origin);
	this.auth_hash = auth_hash;
	this._my_missions = {};
	var self = this;
	this.socket.on('connected', function(){
		// console.log("auth_hash", auth_hash);
		self.socket.emit("auth_hash_console", {auth:auth_hash})
		
		// console.log('ok');
	})
}

var ___tmp = function(){

					//var mesh = W.scenes[actor.scene].meshes[actor.control.object_guid];
					// var scene = W.scenes[actor.scene];
					
					
					//var json = mesh.json 
					// OR
					var p1 = [-110, 100, 40];
					var p2 = [500, 200, -50];
					var c = 0.2
					var p1 = _.map(p1,function(v){return v*c});
					var p2 = _.map(p2,function(v){return v*c});;
					
					var psource = {
						fuel_cell_capacity: 500, // Объем топлива
						fuel_consumption_performance: 1, // Удельная энергия топлива - 
						max_power: 6000, // Максимальная мощность источника энергии - Дж (Вт.с)
						min_power:0, // Минимальная мощность источника энергии
						powerup_speed:2, // Скорость увеличения мощности источника - джоули в секунду
						powerdown_speed:2, // Скорость уменьшения мощности источника
						capacitor:360000 // Емкость конденсатора

					};
					var shields_desc = {
						"armor":[{
							effective_impulse:300,
							capacity:4000,
							charge_rate:500
			
						}],
						"shield":[{
							size: 5000,
							consumption: 40,
							capacitor:10000,
							charge_rate: 1000
			
						}],
						thermal:[{
							passive_dissipation:50,
							performance: 0.5,
							consumption: 1000,
							adsobtion:200,
							capacity:4000
						}]
					};
					var json = {type:'ship',
					 "ship_type":"Default",
						 model_3d:'/models/StarCruiser.js',
						 physical:{
							 pos:p1,
							 rot:{to:p2},
						 },
					 
						 "cameras":{
								"front":{
									"label":"main",
									"position": [0,0.5,0],
									"direction":[0,0,-1]
									},
								"back":{
										"label":"main",
										"position": [0,0.5,2],
										"direction":[0,0,1]
										}
									},
						"turrets":{
							"front":{"type":"ballistic",
									 "position": [0,0.5,0],
								 	 "magazine_capacity": 100,
								 	 "turret_shoot_rate": 2000,
									 "turret_reload_rate": 10000
								 },
							"back":{"type":"ballistic",
									 "position": [0,0,2],
								 	 "magazine_capacity": 100,
								 	 "turret_shoot_rate": 2000,
									 "turret_reload_rate": 10000
								 }

						},
						"workpoints":{
							"Piloting":{
									"views": ["front","back"],
									"type":"pilot",
									},
							"Front turret":
									{
									"views":["front"],
									"type":"turret",
									"turret":"front"
									},
						
							"Back turret":{
									"views":["back"],
									"type":"turret",
									"turret":"back"
						
									},
						
			
								},
								"power_source":psource,
								shields:shields_desc,
								
						'engines': {
							'rotation':{
								'x+':{consumption:1000, performance:0.8 },
								'x-':{consumption:1000, performance:0.8 },
			
								'y+':{consumption:1000, performance:0.8 },
								'y-':{consumption:1000, performance:0.8 },
			
								'z+':{consumption:1000, performance:0.8 },
								'z-':{consumption:1000, performance:0.8 }
							},
							'propulsion':{
								'x+':{consumption:10, performance:0.8 },
								'x-':{consumption:10, performance:0.8 },
			
								'y+':{consumption:10, performance:0.8 },
								'y-':{consumption:10, performance:0.8 },
			
								'z+':{consumption:5000, performance:0.8 },
								'z-':{consumption:5000, performance:0.8 }
							}
						} ,
						'mass': 10000,
						'GUID':"BBBB"
					}
					var send_away = function(engine, value){
						var sett =  "eng_" + engine + "_power"
						scene.makeActorSetting(actor, sett, value) // This one should go through networking
						
					}
					var set_val = function(engine, value){
						var sett =  "eng_" + engine + "_power"
						scene.addSettingToScene(actor, sett, value)
						// mesh.saveWorkpointValue(actor.control.workpoint, sett, value);
					}
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
					
					
					
					_.each(json.engines, function(engines, engine_type){
						
						_.each(engines, function(engine_props, en){
							var et = engine_type;
							var ea = en;
							var engine_name = et + "_" + ea;
							
							var e1 = $("<div>").css({
								width:300,
								height:40
								}).appendTo(cont);
						
							$('<div>').css({'float':'left', 'color':'#bbb'}).width(40).text(ea).appendTo(e1) 
					
							//var swc = $('<div>').css({'float':'left', width:30,'margin-left':10}).appendTo(e1);
					
							//var sw = $('<input type="checkbox">').appendTo(swc);
					
							var slc =  $('<div>').css({'float':'left', width:120,'margin-left':10}).appendTo(e1);
							
							var i;
							
							var pc = new PowerControlWidget({container:slc[0], starting_percent:-0.4, end_percent:1.5,progress_value:0,
								change: function( val ) {
									// send_away(engine_name, val);
								},
								slide: function(val){ 
									//i.val(ui.value);
									// set_val(engine_name, val);
									this.set_progress_value(val);
								}
									
							});

						})
					})
				}
				

Cons.prototype = {
	constructor:Cons,
	_query_mission_positions:function(MGUID){
		this.socket.emit('get-mission-positions', {MGUID:MGUID})
	},
	_start_mission: function(MGUID){
		this.socket.emit('start-mission', {MGUID:MGUID})
		
	},
	_share_position: function(MGUID, pos, share_type){
		this.socket.emit("share-position",{MGUID:MGUID, position:pos, share_type:share_type} )
	},
	_join_position: function(MGUID, pos){
		this.socket.emit("join-position",{MGUID:MGUID, position:pos} )
	},
	_assign_self: function(MGUID, pos){
		console.log("ass", MGUID, pos)
		this.socket.emit("join-position",{MGUID:MGUID, position:pos} )
	},
	
	_copy_position_invite:function(MGUID, pos_id){
		//console.log("SSS");
		var href = window.location.origin
		var params = {};
		params.pos_id = pos_id // workpoint = pos.workpoint;
		//params.object_guid = pos.object_guid;
		params.MGUID = MGUID;
		href += "/invite/?" + $.param(params);
		window.prompt("Copy to clipboard: Ctrl+C, Enter", href);
		//console.log(href);
	},
	// _copy_position_invite: function(MGUID, pos){},
	_draw_player_positions: function(positions){
		$('#player-position-list').find('*').remove();
		var self = this;
		var T = $('<table>').addClass('player-positions table').appendTo('#player-position-list');
		var tr = $('<tr>');
		T.append(tr);
		tr.append($('<th>').text("Тип объекта")); 
		tr.append($('<th>').text("Тип управления")); 
		tr.append($('<th>').text("Команда")); 
		tr.append($('<th>')); 
		
		_.each(positions, function(pos){
			var tr = $('<tr>');
			T.append(tr);
			tr.append($('<td>').text(pos.object_type + ' - '+ pos.object_subtype )); 
			
			tr.append($('<td>').text(pos.workpoint))
			tr.append($('<td>').text(pos.command))
			if(!pos.busy){
				var join = $('<a>').text('Занять').addClass('btn btn-success').click(function(){
					self._join_position(pos.MGUID, pos.id);
				})
				tr.append($('<td>').append(join))
			}else{
				var release = $('<a>').text('Освободить').addClass('btn btn-success').click(function(){
					self._release_position(pos.MGUID, pos.id);
				})
				tr.append($('<td>').append(release))
				
			}
			
			
			
		})
			
	},
	_draw_mission_positions: function(mission_guid,positions){
		// console.log("DRAW");
		$('#mission-position-list').find('*').remove();
		var self = this;
		var T = $('<table>').addClass('mission-positions table').appendTo('#mission-position-list');
		var tr = $('<tr>');
		T.append(tr);
		tr.append($('<th>').text("Тип объекта")); 
		tr.append($('<th>').text("Тип управления")); 
		tr.append($('<th>').text("Команда")); 
		tr.append($('<th>').text("Игрок")); 
		
		_.each(positions, function(pos, i){
			var tr = $('<tr>');
			T.append(tr);
			tr.append($('<td>').text(pos.object_type + ' - '+ pos.object_subtype )); 
			
			tr.append($('<td>').text(pos.workpoint))
			tr.append($('<td>').text(pos.command))
			if(pos.user_id){
				var user = pos.user_id
				var actor_state = "Игрок " + user ;
			}else{
				if (pos.shared !== undefined){
					var actor_state = "Shared ("+ pos.shared +")"
					
				}else{
					var actor_state = "Не назначен";
				}
				
			}
			// sharing 
			var opts = $('<div>').addClass('dropdown')
						.append($('<a id="dLabel" role="button" data-toggle="dropdown" data-target="#" href="/page.html">')
							.html(actor_state + ' <span class="caret"></span>') )
						.append($(' <ul class="dropdown-menu" role="menu" aria-labelledby="dLabel">')
							.append($('<li>').append($("<a>").text("Скопировать инвайт").click(function(){self._copy_position_invite(pos.MGUID, pos.id )}) ))
							.append($('<li>').append($("<a>").text("Сделать публичным").click(function(){self._share_position(pos.MGUID,pos.id,'public') }) )  )
							.append($('<li>').append($("<a>").text("Назначить...").click(function(){self._assign_player(pos.MGUID,pos.id) }) )  )
							.append($('<li>').append($("<a>").text("Назначить мне!").click(function(){self._assign_self(pos.MGUID,pos.id) }) )  )
						)
							
			tr.append($('<td>').append(opts))
			
			// tr.append($('<td>').text(mis.GUID)).click(function(){})
			
			
		})
		
	},
	_redraw_missions: function(){
		
		$('#my-mission-list').find('*').remove();
		var self = this;
		var T = $('<table>').addClass('mission-positions  table').appendTo('#my-mission-list');
		_.each(this._my_missions, function(mis){
			var tr = $('<tr>');
			T.append(tr);
			tr.append($('<td>').text(mis.GUID)).click(function(){
				
				self._query_mission_positions(mis.GUID)
			})
			
			var start_btn = $('<a>').text('Start').addClass('btn btn-success').click(function(){
				self._start_mission(mis.GUID);
			})
			tr.append($('<td>').append(start_btn))
			
			var delete_btn = $('<a>').text('Del').addClass('btn btn-danger').click(function(){
				self._delete_mission(mis.GUID);
			})
			tr.append($('<td>').append(delete_btn))
			
		})
		
	},
	init:function(){
		
		
		
		var self = this;
		$('#create-mission').click(function(){
			// console.log("CM");
			self.socket.emit('create-mission')
		})
		
		self.socket.on('player-missions', function(msg){
			// console.log('missions', msg);
			self._my_missions = msg.missions;
			self._redraw_missions();
			
			// console.log(msg);
		})
		self.socket.on('mission-positions', function(msg){
			// console.log(msg);
			self._draw_mission_positions(msg.MGUID, msg.positions);
			
			// console.log(msg);
		})
		self.socket.on('user-positions', function(msg){
			self._draw_player_positions(msg.positions)
			//console.log("user-positions", msg)
		})
		self.socket.on('user-notify', function(msg){
			// self._draw_player_positions(msg.positions)
			// query_mission_positions:function(MGUID)
			//console.log("user-notify", msg)
		})
		// ___tmp()
		
		/*
		var PCC = $('#here-we-put-demos').css({"width":"400","height":50, "background-color":"hsla(205,100%,55%,1)"});
		var pc = new PowerControlWidget({container:PCC[0], starting_percent:-0.5, end_percent:1.5,progress_value:1.2345,
			slide:function(val){
				console.log("V", val);
			},
			
		});
		*/
		/*
		
		var val = prompt("qqq");
		pc.set_progress_value(parseFloat(val));
		
		var val = prompt("qqq");
		pc.set_progress_value(parseFloat(val));
		
		var val = prompt("qqq");
		pc.set_progress_value(parseFloat(val));
		
		var val = prompt("qqq");
		pc.set_progress_value(parseFloat(val));
		*/
		
	},
	
}