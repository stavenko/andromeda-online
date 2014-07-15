var _     = require('underscore');


var Simulation = new require('./core').Simulation

var sender = function(message){
	// console.log("some send mes", message);
	process.send(message)
}



var Sim = new Simulation(sender)
Sim.start();

//process.on('message', function() {
//	console.log(arguments, Sim);
//})
// Message types
//  var user_positions = 'user-positions',
 	 


process.on('message', function(msg){
	//console.log(msg)
	var get_mission_positions = function(){
		var ps = Sim.getMissionPositions(msg.MGUID);
		// console.log(ps);
		process.send({type:'mission-positions', positions: ps, MGUID:msg.MGUID, user_id:msg.user_id });
		
	}
    var sendBookmarkedObjects = function(){
        var objs = [
            { 
                name: "Ship building plant",
                type: "plant",
                orbit: {}
            },
            { 
                name: "Cute asteroid",
                type: "rock",
                orbit: {}
            },
            
                
        
        ];
        process.send({type:'bookmarked-objects', objects: objs, user_id:msg.user_id })
        
    }
    
	var send_user_positions = function(){
		var user_positions = Sim.getUserPositions(msg.user_id);
		// console.log("share");
		process.send({type:'user-positions', positions:user_positions, user_id: msg.user_id })
		
	}
	var send_player_missions = function(){
		var ms = Sim.getUserMissions(msg.user_id);
		//console.log("UC", ms, msg);
		process.send({type:'player-missions', missions: ms, user_id:msg.user_id });
		
	}
	var user_notify = function(user_id, message, data){
		var mes = {type:'user-notify', message:message, user_id : user_id }
		_.extend(mes, data)
		process.send(mes)
	}
	
	var bcast_notify = function(message){
		process.send({type:'broadcast', message:message})
	}
	switch(msg.type){
	case 'create-mission':
		// console.log("CR");
		Sim.newMissionInstance(msg.mission_type, msg.user_id, function(mission, this_user_missions){
			//console.log('CM', msg)
			//console.log("this_user_missions", this_user_missions);
			var ms = _.map(this_user_missions, function(m){return m.to_json(); });
			var bmsg = {type:'player-missions', user_id:msg.user_id, missions: ms }
			//console.log('BM', bmsg)
			process.send(bmsg);
		})
		break;
	case 'user-connected':
        // Send him something, he waits:
        sendBookmarkedObjects();
        
		break;
	case 'get-mission-positions':
		get_mission_positions()
		break;
		
	case 'share-position':
		Sim.sharePosition(msg);
		get_mission_positions();
		send_user_positions();
		
		break;
	case 'join-position':
		Sim.joinPosition(msg);
		send_user_positions();
		user_notify(Sim.getMission(msg.MGUID).creator, "player-joined-position", {MGUID:msg.MGUID})
		
		break;
		
	case 'start-mission':
		Sim.startMission(msg);
		var mission = Sim.getMission(msg.MGUID);
		if (mission !== undefined){
			_.each(Sim.getMission(msg.MGUID)._users, function(unneeded, user_id){
				user_notify(user_id, "mission-started", {MGUID:msg.MGUID});
			
			})
		}
		break;
	case 'request-actors':
		var as = Sim.getUserActors(msg.user_id);
		//console.log("requested actors", as);
		process.send({'actors':as, user_id:msg.user_id, type:"actors", recv:'world' })
		break;
	
	case 'request-scenes':
		var as = Sim.getScenes(msg.scenes);
		process.send({'scenes':as, user_id:msg.user_id, type:"scenes", recv:'world' })
		break;
		// case 'action':
		// Sim.action(msg.action, msg.on_off )
		// break;
	case 'actor-joined':
		//console.log("waj", msg);
		Sim.joinActor(msg.message.s, msg.message.a, function(to_actors, actor){
			process.send({type:'actor-joined', to_actors:to_actors, actor:actor})
			
		})
		break;
		
	case 'client-actions':
		// console.log("MSG DATA TO SERVER", msg);
		Sim.performAction(msg.data, function(action, to_actors){
			process.send({type:"player-inputs", action:action, to_actors:to_actors, user_id: msg.user_id })
			// callback with server returned action - need for sending it back to clients
		});
		break;
		
	}
	

	
})
//console.log("W");