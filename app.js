var app = require('express')()
  , express= require('express')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy

  , stylus = require('stylus')
  , flash = require('connect-flash')
  , nodemailer = require('nodemailer')
  , server = require('http').Server(app)
  , ios = require('socket.io') // (server)
  , Sc  = require("./scene.js")
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
      { id: 1, username: 'stavenko@gmail.com', password: 'gfhjkm', email: 'stavenko@gmail.com' }
    , { id: 2, username: 'vg.stavenko@yandex.ru', password: 'birthday', email: 'vg.stavenko@yandex.ru' }
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
	  console.log("we");
	  
    // asynchronous verification, for effect...
    process.nextTick(function () {
		console.log("iiha");
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
		  console.log(err, user);
        if (err) { return done(err); }
		
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
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
	
    app.use(express.session({ secret: 'keyboard cat' }));
	
    app.use(express.bodyParser());
	
	app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
	
    app.use(app.router);
	
})

// var server = http.Server(app)
//console.log(ios)

var io =  ios.listen(server);


server.listen(3002)

io.on('connection', function(socket){
	//console.log('connected', socket)
	
	socket.emit("resp", {resp:"onse"})
	
	socket.on("data", function(data){
		//console.log("data", data)
	})
})

/*
app.get('/', function(req,res){
	res.render('index', {   })
})

app.get('/stickclick/', function(req,res){
	res.render('stick-click0', {   })
})

app.get('/ironsamurai/', function(req,res){
	res.render('iron-samurai', {   })
})
app.get('/led-shower/', function(req,res){
	res.render('led-shower-gen', {   })
})
*/



app.get('/webgl-test/', function(req,res){
	res.render('webgl-test', {   })
})

var SCENES = {}

app.get('/scenes/:name/', function(req, res){
	//console.log(req.params.name, SCENES)
	if (req.params.name in SCENES){
		//console.log("cache hit")
		res.end(JSON.stringify(SCENES[req.params.name]))
	}else{
		var S = Sc.create();
		S.load();
		var js = S.get()
		SCENES[req.params.name] = js
		res.end(JSON.stringify(js));
	}
})


app.get('/auth/login/', function(req, res){
	// console.log(req.headers);
	// console.log(">>")
	res.render('login', {})// { user: req.user, message: req.flash('error') });
});


app.post('/auth/login/',  passport.authenticate('local', { failureRedirect: '/auth/login/', failureFlash: true }),
	function(req, res) {
		res.redirect('/console/');
	});


app.get('/auth/logout/', function(req, res){
	req.logout();
	res.redirect('/');
});

app.get('/console/', function(req, res){
	res.render('console');
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


