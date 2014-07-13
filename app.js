var app = require('express')()
  , config= require('./config')
  , _     = require('underscore')
  , crypto = require('crypto')
  , express= require('express')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , RedisStore = require('connect-redis')(express)
  , stylus = require('stylus')
  , flash = require('connect-flash')
  , nodemailer = require('nodemailer')
  , server = require('http').Server(app)
  , ios = require('socket.io') // (server)
  
  //, Mission = require("./server/missions.js")
  //, Sc  = require("./server/scene.js")
  //, Core = require('./server/core.js').Core
  //, Simulation = require('./server/core.js').Simulation
  , browserify_express = require('browserify-express')
  //, Worker = require('webworker-threads').Worker
  , fork = require('child_process').fork
  , path = require('path');
  
  
  
  
var DEBUG = false;


// var app = express()

smtp_settings = {service:'Gmail', 
				 auth:{
					user:'stavenko@gmail.com', 
					pass:'tekjayqrsunjmypo'}}

transport = nodemailer.createTransport('SMTP', smtp_settings)

email = {
	from: 'stavenko@gmail.com',
	to:'',
	subject: '',
	text: '',
	html:''
}
function compile(str, path) {
	return stylus(str).set('filename', path)
		
}

var users = [
      { id: 1, username: 'stavenko@gmail.com', password: '123', email: 'stavenko@gmail.com' , auth_hash:''}
    , { id: 2, username: 'vg.stavenko@yandex.ru', password: 'birthday', email: 'vg.stavenko@yandex.ru', auth_hash:'' }
];
  
// Authentication stuff  
//var DEBUG = false;
function findById(id, fn) {
  var idx = id - 1;
  if (users[idx]) {
    fn(null, users[idx]);
  } else {
    fn(new Error('User ' + id + ' does not exist'));
  }
}

function findByUsername(username, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.username === username) {
		//console.log('found user')
      return fn(null, user);
    }
  }
  return fn(null, null);
}
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});  
  
passport.use(new LocalStrategy(
  function(username, password, done) {
	  //console.log("we");
	  
    // asynchronous verification, for effect...
    process.nextTick(function () {
		// console.log("iiha");
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
		  // console.log(err, user);
        if (err) { return done(err); }
		
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
		sha1 = crypto.createHash('sha1')
		sha1.update(user.password + user.username + new Date())
		user.auth_hash = sha1.digest('hex');
		// console.log(user)
        return done(null, user);
      })
    });
  }
));
function ensureAuthenticated(req, res, next) {
	// if (DEBUG) {return next()};	
	if (req.isAuthenticated()) { return next(); }
		res.redirect('/auth/login/')
}

app.configure(function(){
	app.set('views', __dirname + '/views')
	app.set('view engine', 'jade')
	app.use(express.favicon(path.join(__dirname, 'public/img/favicon.ico')));
	app.use(express.logger('dev'))
	app.use(express.compress());
	app.use(stylus.middleware(
		{ 	src: __dirname + '/public'
			, compile: compile
		}
	))
	app.use(express.static(__dirname + '/public'))
    
	app.use(express.cookieParser());
	app.use(express.bodyParser());
    app.use(express.session({ secret: 'keyboard cat', store: new RedisStore({
        port: config.redisPort,
        host: config.redisHost,
        db: config.redisDatabase,
        pass: config.redisPassword}) }));
	
	app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
	
    
    /*
    
    var engineBundle = browserify_express({
        entry: __dirname + '/server/entry.js',
		ignore: ["./three.min.node.js", "./three.node.js"],
        watch: __dirname + '/server/',
        mount: '/appjs/engine.js',
        verbose: true,
        minify: false,
        bundle_opts: { debug: true }, // enable inline sourcemap on js files 
        write_file: __dirname + '/public/js/gl/engine.js'
    });
    
    app.use(engineBundle);
    var clientBundle = browserify_express({
        entry: __dirname + '/client/entry.js',
		ignore: ["./three.min.node.js", "./three.node.js"],
        watch: __dirname + '/client/',
        mount: '/appjs/client.js',
        verbose: true,
        minify: false,
        bundle_opts: { debug: true }, // enable inline sourcemap on js files 
        write_file: __dirname + '/public/js/gl/client.js'
    });

    // app.use( clientBundle );
    */
	
    app.use(app.router);
	
})

// var server = http.Server(app)
//console.log(ios)

var io =  ios.listen(server, {log:false});

var port = process.env.HTTP_RC_OS_PORT || 3002;
server.listen(port)







//var SCENES = {} // guid : scene
//var MISSIONS= {} // guid : mission
// var LOGINS = {} // login : [{object, scene, mission}] map
//var LOGINS = {}// login_id: [{s:scene_guid}|{a:actor_guid}]
//var ACTORS = {} // login: actor map (actor - is a repr of object, that controls some aspect of a object of some scene)
// var SCENE_SOCKET_MAP = {} // SCENE_GUID: Socket
var Scenes = {} 
var Sockets = {} // login_guid: web-socket
var ConsoleSockets = {} // login_guid: web-socket
var SocketAuthMap = {} // auth_hash: login  - This is for authencitation purpose


var Globals = {
//	Scenes:SCENES,
//	Missions:MISSIONS,
//	Actors:ACTORS,
//	Sockets:SOCKET_MAP
}


// new Core(Globals).launch();


//simulator.on('message', function(){
	// console.log(arguments);
	//})
	
simulator = fork('./server/worker.js'); 

simulator.send({'hi':'there'});



io.on('connection', function(socket){
	socket.emit('connected',{})
	
	var newActortoSceneBcast = function(Scene, actor){
		var new_actor = Scene.actors[actor]
		_.each(SOCKET_MAP, function(s,k){
			if (_(Scene.get_actors()).keys().indexOf(k) != -1){
				s.emit("join_actor", new_actor)
			}
			
		})
	}
	// КОНСОЛЬ УПРАВЛЕНИЯ
	socket.on("auth_hash_console", function(data){
		//console.log(data)
		var user_id = SocketAuthMap[data.auth];
	
		// console.log("AUTH_INFO", SOCKET_AUTH_MAP, data);
		if (user_id === undefined){
			console.log("yep, undef")
			socket.emit('server_fault', {})
		}else{
			ConsoleSockets[user_id] = socket // one socket per login | several actors per socket
			simulator.send({type:'user-connected', user_id: user_id} )
			
		}
		
		socket.on('create-mission', function(){
			simulator.send({type:'create-mission', mission_type:1, user_id:user_id })
			// res.redirect('/console/');
			
		})
		socket.on('share-position', function(msg){
			simulator.send({type:'share-position',  user_id:user_id, position:msg.position, share_type:msg.share_type, MGUID:msg.MGUID})
			// res.redirect('/console/');
			
		})
		
		socket.on('get-mission-positions', function(msg){
			msg.type='get-mission-positions';
			msg.user_id = user_id;
			simulator.send(msg);
		})
		
		socket.on('join-position', function(msg){
			msg.type = 'join-position';
			msg.user_id = user_id;
			simulator.send(msg);
		})
		
		socket.on('start-mission', function(msg){
			msg.type = 'start-mission';
			msg.user_id = user_id;
			simulator.send(msg);
		})
		
	})
	
	
	
	// СИМУЛЯЦИЯ
	socket.on("auth_hash", function(data){
		//console.log(data)
		var user_id = parseInt(SocketAuthMap[data.auth]);
		
		// console.log("AUTH_INFO", SOCKET_AUTH_MAP, data);
		if (user_id === undefined){
			// console.log("yep, undef")
			socket.emit('server_fault', {})
		}else{
			// var actors = Actors[user_id]
			
			// socket.emit("actors", actors ) // Сцену на этом этапе не грузим. Просто выдаем клиентам возможные варианты вьюпортов
			//console.log("USER_ID", [user_id])
			Sockets[user_id] = socket // one socket per login | several actors per socket
			// console.log("SSSSSS", Sockets);
			simulator.send({type:'request-actors', user_id: user_id} )
			
			//	
		}

		
		var sendToSceneClients = function(action,on_off){
			// console.log(SOCKET_MAP)
			//console.log("AU", auth_info);
			//if (auth_info)
			var S = Scenes[action.actor.scene]
			//console.log("SENDING", S === undefined);
			// console.log("SCENE", S);
			if (S === undefined){return;}
			_.each(S.actors, function(a,aguid){
				//console.log("AA", a.user_id !== user_id, a.user_id != user_id);
				if (a.user_id != user_id){
					//console.log("AB", a.user_id,  user_id);
					var socket = Sockets[a.user_id]
					if(socket === undefined) return;
					if(on_off)socket.emit('player_controls_on', action)
					else socket.emit("player_controls_off", action)
				}
			})					
				

			
		}
		var applyAction = function(action_, on_off){
			simulator.send({type:'action', user_id: user_id, action:action_, on_off:on_off})
			//var action = action_.action;
			//var actor = action_.actor
			//var na = Controllers[login]
			// console.log("acting", Controllers)
			
			//na.act(SCENES[actor.scene], action, on_off, actor)
		}
		
		socket.on('user_actions', function(message){
			/// var scene = message.scene;
			/// var action = message.action;
			// console.log("MESSAGE FROM CL", message); 
			simulator.send({type:'client-actions',data:message, user_id:user_id})
			
		})
		/*
		socket.on('control_on', function(data){
			// to_others = {login:login, action:data}
			applyAction(data, true)
			sendToSceneClients(data, true);
			
		})
		socket.on('control_off', function(data){
			//to_others = {login:login, action:data}
			applyAction(data, false)
			sendToSceneClients(data, false);
		})
		*/
		socket.on("sync_request", function(data){
			var ts = new Date().getTime();
			socket.emit('clock_response', {"ts":ts})
			// console.log("here some control data", data);
			// simulator.send({type:'client-actions',data:data, user_id:user_id})
		})
		socket.on('actor-joined', function(message){
			// console.log("actor-joined");
			simulator.send({type:'actor-joined',user_id:user_id, message:message})
		})
		socket.on('request_scenes', function(scenes){
			// var scs = {}
			// console.log( {user_id:user_id, scenes:scenes});
			simulator.send( {type:'request-scenes',user_id:user_id, scenes:scenes.scenes})
			//_.each(scenes.scenes, function(guid){
				// Надо собрать json-ы всех имеющихся сцен
				
				//var sc = SCENES[guid] // Акторы уже здесь
				//if (!sc.is_loaded){
				//	sc.load()
				//}
				//scs[guid] = sc._scene 
				//var na = Con.NetworkActor(SCENES, socket, function(){
				
					//})			
				// Controllers[login] = na
				
				//})

			// socket.emit('scenes', scs)
			
		})

	})
})

// var Actors = {} // login_guid: [actor_guids]
// 
// var Controllers = {} // login: NetworkController

simulator.on('message', function(msg){
	// console.log("MSGG", msg);
	//console.log('mmm', msg.type)
	if ( msg.type === 'scene_sync' ){
		//console.log("scene_sync", msg);
		var scene_json = Scenes[msg.scene];
		if (scene_json === undefined){
			//console.log("no scene");
			return;  // Незачен синхронизировать сцену для того, кто еще не подключился 
		}
		_.each(Scenes[msg.scene].actors, function(a){
			var sock = Sockets[a.user_id];
			if(sock) sock.emit(msg.type, {scene:msg.scene, almanach:msg.almanach });
		})
		return ;
	}
	if(msg.type === "player-inputs"){
		
		// console.log("how to send back to USERS", msg);
		// FIRST get Scene of this message
		//var scene  = undefined;
		
		var sender_user_id = msg.user_id;
		_.each(msg.to_actors, function(ac){
			// var is_same_actor =  ac.GUID === msg.from_actor;
			var is_same_user  =  parseInt(ac.user_id) === sender_user_id;
			//console.log('USS', [ac.user_id, sender_user_id]);
			if ( is_same_user   ) {
				// console.log("the same");
				return;
			}
			if(ac.user_id in Sockets){
			
				var socket = Sockets[ac.user_id]
				// console.log("DO WE SEND INFO TO THE SAME PH OBJECT");
				socket.emit('player-inputs', msg.action );
				
			}
				
			
			
		})
	}
	if(msg.type === "actor-joined"){
		// console.log("AC_J", Sockets); 
		
		_.each(msg.to_actors, function(ac){
			
			if (ac.GUID !== msg.actor.GUID){
				if (ac.user_id in Sockets){
					
					var socket = Sockets[ac.user_id]
				
					socket.emit('actor-joined', msg.actor );
				}
				
			}
			
		})
	}
	if(msg.type === "mesh-action"){
		_.each(msg.to_actors, function(ac){
			var socket = Sockets[ac.user_id];
			socket.emit('player-inputs', msg.action);
		})
	}
	
	/// Сообщения ниже ни до кого не доберутся если они без пользователя
	
	
	if (msg.user_id == undefined){
		return;
	}
	//console.log("WWW", msg);
	if(msg.recv === 'world'){
		var con_sock = Sockets[msg.user_id];
	}else{
		var con_sock = ConsoleSockets[msg.user_id];
	}
	// console.log("BS", msg);
	con_sock.emit(msg.type, msg);
	if( msg.type ==='scenes'){ // Сцены какого-то игрока
		// Кэшируем сцены напрямую - для того чтобы можно было прямо здесь отдавать всем желающим контролы других игроков - еще до того, 
		// как они полетят в симуляцию
		_.each(msg.scenes, function(scene, guid){
			Scenes[guid] = scene;
		});
		
	}


		
	
})

app.get('/webgl-test/', function(req,res){
	res.render('webgl-test', {   })
})



app.get('/world/', ensureAuthenticated, function(req,res){
	// console.log(req.session.auth_hashes);
	res.render('world',{ 'user': req.user, auth_hash: req.session.auth_hashes[req.user.id]})
})
// Adding and joining missions
// app.get('/missions/create/', ensureAuthenticated, function(req, res){
//	simulator.send({type:'create_mission', mission_type:1, instantiator_id:req.user.id })
// 	res.redirect('/console/');
// })
app.get('/missions/join/:m_id/', ensureAuthenticated, function(req, res){
	var query = req.query;
	
	simulator.send({type:'join_to_mission', guid:req.params.m_id, user:req.user.id, command:query.command, object:query.object_guid, workpoint: query.workpoint})

	res.redirect('/console/');
})
app.get('/missions/get_mission_state/:m_id/', ensureAuthenticated, function(req, res){
	var M = MISSIONS[req.params.m_id]
	res.end(JSON.stringify({ "is_ready": M.ready_to_start }));
})

app.get('/missions/get_positions/:m_id/', ensureAuthenticated, function(req, res){
	var M = MISSIONS[req.params.m_id]
	M.positions(function(poss){
		res.end(JSON.stringify(poss));
		
	})
	
})

app.get('/auth/login/', function(req, res){
	
	res.render('login', {})// { user: req.user, message: req.flash('error') });
});


app.post('/auth/login/',  passport.authenticate('local', { failureRedirect: '/auth/login/', failureFlash: true }),
	function(req, res) {
		console.log(req.session)
		if (req.session.auth_hashes === undefined){
			req.session.auth_hashes = {}; // Правильно будет хранить эти хэши в базе данных. Но пока так
		}
		var user = req.user
		req.session.auth_hashes[req.user.id] = req.user.auth_hash
		SocketAuthMap[req.session.auth_hashes[user.id] ] = user.id
	
		res.redirect('/console/');
	});


app.get('/auth/logout/', function(req, res){
	req.logout();
	res.redirect('/');
});

app.get('/console/', ensureAuthenticated, function(req, res){
	var user = req.user
	user.id = parseInt(user.id);
	SocketAuthMap[req.session.auth_hashes[user.id] ] = user.id; // Грязный хак - обновляем состояние аутентификации из сессии
	res.render('console', { 'user': req.user, auth_hash: req.session.auth_hashes[req.user.id]});
})
app.get('/', function(req, res){
	res.render('index', {'missions':{}, 'user': req.user});
})



/*

app.get('/back-call/', function(req,res){
	var phone = req.query.phone
	var from  = req.query.from
	var tz = req.query.tz
	email.to = 'stavenko@gmail.com'
	email.subject = 'Заказ обратного звонка с сайта ' + from
	email.html = "<h1>Заказ звонка</h1><p>"+phone+"</p> <div><p>Временная зона: "+tz+"</p></div>"
	
	//var phone = req.
	transport.sendMail(email, function(err, resp){
		if(err){
			console.log('ERROR', err)
		}else{
			console.log('SENT', resp.message)
			
		}
		res.end('ok')
	})
})

var printf = function() { 
  var num = arguments.length; 
  var oStr = arguments[0];   
  for (var i = 1; i < num; i++) { 
    var pattern = "\\{" + (i-1) + "\\}"; 
    var re = new RegExp(pattern, "g"); 
    oStr = oStr.replace(re, arguments[i]); 
  } 
  return oStr; 
} 
// printf('The lazy {0} {1} over the {2}', bar3, bar2, bar1); 

var order_tmpl = "<h1> Новый заказ {0}</h1>" +
"<ul>"+
"<li><b>Идентификатор</b>: {1}</li>"+
"<li><b>Имя</b>: {2}</li>"+
"<li><b>Емайл</b>: {3}</li>"+
"<li><b>Телефон</b>: {4}</li>"+
"<li><b>Количество</b>: {5}</li>"+
"<li><b>Временная зона</b>: {6}</li>"+

"</ul>"+
"<div>"+
"0 - 1Вт; 1 - 2Вт; 2 - 3Вт"+

"</div>"

app.post('/order/', function(req, res){
	var phone = req.body.phone;
	var from  = req.body.from;
	var tz = req.body.tz;
	var q = req.body.quantity;
	var email_ = req.body.email;
	var name  = req.body.name;
	var id = req.body.product;
	
	email.to = 'stavenko@gmail.com'
	email.subject = 'Заказ ' + from
	email.html = printf(order_tmpl, from, id, name, email_, phone, q, tz)
	
	//var phone = req.
	transport.sendMail(email, function(err, resp){
		if(err){
			console.log('ERROR', err)
		}else{
			console.log('SENT', resp.message)
			
		}
		res.end('ok')
	})
})
*/

