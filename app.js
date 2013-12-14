var app = require('express')()
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
  
  , Mission = require("./server/missions.js")
  , Sc  = require("./server/scene.js")
  , Con = require("./server/controller.js")
  , Core = require('./server/core.js')
  , browserify_express = require('browserify-express')
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
	app.use(stylus.middleware(
		{ 	src: __dirname + '/public'
			, compile: compile
		}
	))
	app.use(express.static(__dirname + '/public'))
    
	app.use(express.cookieParser());
	app.use(express.bodyParser());
    app.use(express.session({ secret: 'keyboard cat', store: new RedisStore }));
	
	app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
	
    var bundle = browserify_express({
        entry: __dirname + '/server/entry.js',
		ignore: ["./three.min.node.js", "./three.node.js"],
        watch: __dirname + '/server/',
        mount: '/appjs/main.js',
        verbose: true,
        //minify: true,
        bundle_opts: { debug: true }, // enable inline sourcemap on js files 
        write_file: __dirname + '/public/js/gl/main.js'
    });

    app.use(bundle);
	
    app.use(app.router);
	
})

// var server = http.Server(app)
//console.log(ios)

var io =  ios.listen(server, {log:false});


server.listen(3002)


// Login - Это объект авторизации - привязка аккуанта
// Actor - Это объект контроля, сверху - привязан к авторизации - снизу - к объектам мира
var SCENES = {} // guid : scene
var MISSIONS= {} // guid : mission
// var LOGINS = {} // login : [{object, scene, mission}] map
var ACTORS = {} // login: actor map (actor - is a repr of object, that controls some aspect of a object of some scene)
var SOCKET_AUTH_MAP = {} // auth_hash: login  - This is for authencitation purpose
var SOCKET_MAP = {} // login: socket
// var SCENE_SOCKET_MAP = {} // SCENE_GUID: Socket
var Controllers = {} // login: NetworkController

var Globals = {
	Scenes:SCENES,
	Missions:MISSIONS,
	Actors:ACTORS,
	Sockets:SOCKET_MAP
}


new Core(Globals).launch();

io.on('connection', function(socket){
	socket.emit('connected',{})
	
	var newActortoSceneBcast = function(Scene, actor){
		var new_actor = Scene.actors[actor]
		//console.log(new_actor)
		_.each(SOCKET_MAP, function(s,k){
			//console.log("LOOP", k , _(Scene.get_actors()).keys());
			if (_(Scene.get_actors()).keys().indexOf(k) != -1){
				//console.log("emit>")
				s.emit("join_actor", new_actor)
			}
			
		})
	}
	
	socket.on("auth_hash", function(data){
		//console.log(data)
		var login = SOCKET_AUTH_MAP[data.auth];
		
		// console.log("AUTH_INFO", SOCKET_AUTH_MAP, data);
		if (login === undefined){
			console.log("yep, undef")
			socket.emit('server_fault', {})
		}else{
			//var auth_info = LOGINS[login]
			//var scene = SCENES[auth_info.scene]
			//var mission = MISSIONS[auth_info.mission]
			//if (!scene.is_loaded){
			//	scene.load();
			//}
			//console.log("This is logins", LOGINS[login]);
			var acts = []
			_.each(ACTORS[login], function(as, scguid){
				// console.log(as, scguid);
				_.each(as, function(a){
					acts.push(a);
					
				})
			})
			
			socket.emit("actors", acts ) // Сцену на этом этапе не грузим. Просто выдаем клиентам возможные варианты вьюпортов
			SOCKET_MAP[login] = socket // one socket per login | several actors per socket
			//	
			//	console.log('acted');
		}

		
		var sendToSceneClients = function(action,on_off){
			// console.log(SOCKET_MAP)
			//console.log("AU", auth_info);
			//if (auth_info)
			var S = SCENES[action.actor.scene]
			// TODO Убрать лишние отправки по дублирущим акторам одного логина: они и так ему прилетят
			
			_.each(S.get_actors(), function(a,alogin){
				// console.log("AA",a);
				if (alogin !== login){
					// console.log("sending to", alogin, SOCKET_MAP)
					var socket = SOCKET_MAP[alogin]
					if(on_off)socket.emit('player_controls_on', action)
					else socket.emit("player_controls_off", action)
				}
			})					
				

			
		}
		var applyAction = function(action_, on_off, login){
			var action = action_.action;
			var actor = action_.actor
			var na = Controllers[login]
			// console.log("acting", Controllers)
			
			na.act(SCENES[actor.scene], action, on_off, actor)
		}
		
		socket.on('control_on', function(data){
			// to_others = {login:login, action:data}
			applyAction(data, true, login)
			sendToSceneClients(data, true);
			
		})
		socket.on('control_off', function(data){
			//to_others = {login:login, action:data}
			applyAction(data, false, login)
			sendToSceneClients(data, false);
		})
		// socket.on
		socket.on('request_scenes', function(scenes){
			var scs = {}
			console.log("requested scenes",scenes)
			_.each(scenes.scenes, function(guid){
				
				var sc = SCENES[guid] // Акторы уже здесь
				// console.log("SCENE MUSt be not loaded", SCENES, guid)
				if (!sc.is_loaded){
					// console.log('load it');
					
					sc.load()
					
					// share_info(null, null, sc, login)
				}
				// console.log("ok");
				scs[guid] = sc._scene 
				//newActortoSceneBcast(scene, login);
				var na = Con.NetworkActor(SCENES, socket, function(){
					//console.log('wwweeee')
				
				})			
				Controllers[login] = na
				
			})

			socket.emit('scenes', scs)
			//console.log('sent');
			
		})

	})
})




app.get('/webgl-test/', function(req,res){
	res.render('webgl-test', {   })
})


function share_info(req, M, S, user){
	if (M){
		MISSIONS[M.GUID] = M
		// actor_info.mission = M.GUID
	}
	SOCKET_AUTH_MAP[req.session.auth_hashes[user] ] = user
	
	// console.log("sharing", S)
	if (S){
		//console.log("OK");
		SCENES[S.GUID] = S
		// LOGINS[user] = S.get_actors()[user]

	}
}

/*
app.get('/scene/:mission_id/', function(req, res){
	//console.log(req.params.name, SCENES)
	var M = Missions[req.param.mission_id]
	M._scen
	if (Missions[req.param.mission_id]){
		//console.log("cache hit")
		res.end(JSON.stringify(MsSCENES[req.params.id]))
	}else{
		var S = Sc.create();
		S.load();
		var js = S.get()
		SCENES[req.params.name] = js
		res.end(JSON.stringify(js));
	}
})*/
app.get('/world/', ensureAuthenticated, function(req,res){
	// console.log(req.session.auth_hashes);
	res.render('world',{ 'user': req.user, auth_hash: req.session.auth_hashes[req.user.username]})
})
// Adding and joining missions
app.get('/missions/create/', ensureAuthenticated, function(req, res){
	var M = new Mission()
	M.create(req.user.username)
	share_info(req,  M, M._scene, req.user.username )
	// console.log(MISSIONS);
	res.redirect('/console/');
})
app.get('/missions/join/:m_id/', ensureAuthenticated, function(req, res){
	var M = MISSIONS[req.params.m_id]
	var query = req.query;

	M.join_player(req.user.username, query.command, query.object_guid, query.workpoint)
	if(M.ready_to_start){
		
		M.prepare_scene();
		SCENES[M._scene.GUID] = M._scene;
		console.log("WWWWWAT", SCENES);
		
		// Здесь надо запихнуть всех акторов этого логина в массив ACTORS
	}
	if(M._scene_loaded){
		_.each(M._scene.get_actors(), function(arr, login){
			if(ACTORS[ login ] === undefined){
				ACTORS[ login ]  = {}
			}
			
			ACTORS[login][M._scene.GUID] = M._scene.get_actors()[login]
			
		})
		console.log("ACTORS ARRAY", ACTORS)
	}
	
	// share_info(req, M, M._scene, req.user.username )
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
		req.session.auth_hashes[req.user.username] = req.user.auth_hash
		SOCKET_AUTH_MAP[req.session.auth_hashes[user] ] = user
	
		res.redirect('/console/');
	});


app.get('/auth/logout/', function(req, res){
	req.logout();
	res.redirect('/');
});

app.get('/console/', ensureAuthenticated, function(req, res){
	// MMM = {"aaa":{"bbb":"ccc"}}
	//console.log("MIS", MISSIONS)
	var login = req.user.username
	SOCKET_AUTH_MAP[req.session.auth_hashes[login] ] = login
	
	res.render('console', {'missions':MISSIONS, 'user': req.user});
})
app.get('/', function(req, res){
	// MMM = {"aaa":{"bbb":"ccc"}}
	res.render('index', {'missions':MISSIONS, 'user': req.user});
})



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


