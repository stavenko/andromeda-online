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
		
		var PCC = $('#here-we-put-demos').css({"width":"400","height":50, "background-color":"hsla(205,100%,55%,1)"});
		var pc = new PowerControlWidget({container:PCC[0], starting_percent:-0.5, end_percent:1.5,progress_value:1.2345,
			slide:function(val){
				console.log("V", val);
			},
			
		});
		
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