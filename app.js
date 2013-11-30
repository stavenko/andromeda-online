var app = require('express')()
  , express= require('express')

  , stylus = require('stylus')
  , flash = require('connect-flash')
  , nodemailer = require('nodemailer')
  , server = require('http').Server(app)
  , ios = require('socket.io') // (server)
  , path = require('path');
  

var DEBUG = false;

var v = new THREE.Vector3(0,1,0)

v.multiplyScalar(5);
console.log(v);

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
	app.use(flash());
    app.use(app.router);
	
})

// var server = http.Server(app)
//console.log(ios)

var io =  ios.listen(server);


server.listen(3002)

io.on('connection', function(socket){
	console.log('connected', socket)
	
	socket.emit("resp", {resp:"onse"})
	
	socket.on("data", function(data){
		console.log("data", data)
	})
})


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

app.get('/webgl-test/', function(req,res){
	res.render('webgl-test', {   })
})
app.get('/scenes/:name/', function(req,res){
	var objects_count = 10;
	var objs = []
	var vectors = ['pos', 'vel', 'acc',  'rot',    'avel', 'aacc'];
	var limits  = [100, 2,        0.1,     Math.PI, 0    ,   0];
	
	
	for(var c =0; c< objects_count; c++){	
		var obj = {
			"physical":{},
			"cameras":{
					"front":{
						"label":"main",
						"position": [0,0,0],
						"direction":[0,0,-1]
						},
					"back":{
							"label":"main",
							"position": [0,0,2],
							"direction":[0,0,100]
							}
						
			},
			'engines':{
				'rotation':{
					'x+':1,'x-':1,
					'y+':1,'y-':1,
					'z+':1,'z-':1
				},
				'propulsion':{
					'x+':1,'x-':1,
					'y+':1,'y-':1,
					'z+':10,'z-':10
				}
			},
			
			'mass': 10,
			
			
			
			
			//"direction":[1,0,0],
			"model": "/models/StarCruiser.js"
		}
		if (c == 0) obj.direction = [0,0,-1]
		else obj.direction = [0,0,-1]
		
		for (var j =0; j < vectors.length; j++){
			var v = vectors[j]
			var vv = []
			for (var i = 0; i < 3; i++){
				vv[i] =  (Math.random() * limits[j]) - limits[j]/2
			}
			obj.physical[v] = vv;
		}
		
		objs.push(obj)
	}
	// Add pivot cubes
	poses = [[20,20,20], [20,-20,20], [-20,20,20], [-20,-20,20],
			 [20,20,-20], [20,-20,-20], [-20,20,-20], [-20,-20,-20],
	 ]
	 limits[1]=0
	for(var c =0; c< 8; c++){	
		var obj = {
			"physical":{},
			"cameras":
			{
					"front":{
						"label":"main",
						"position": [0,0,0],
						"direction":[0,0,-1]
						},
					"back":{
							"label":"main",
							"position": [0,0,0],
							"direction":[0,0,10]
							}
						
			},
			"direction":[1,0,0],
			mass:1000,
			
			"model": "/models/sp.js"
		}
		for (var j =1; j < vectors.length; j++){
			var v = vectors[j]
			var vv = []
			for (var i = 0; i < objects_count; i++){
				vv[i] =  (Math.random() * limits[j]) - limits[j]/2
			}
			obj.physical[v] = vv;
		}
		obj.physical.pos = poses[c]
		
		objs.push(obj)
	}		
	
	var scene = {
		"actors":{"__":{
					 	"control": {"oid":0,"vp":"back"}
						}
				},
		"controllers":{
			"front":{"types":["turret", "launcher", 'pilot'], "camera": "front"},
			"back" :{"types":["turret", "launcher"], "camera": "back"}
		}
			}
				
	scene.objects = objs;
	res.end(JSON.stringify(scene));
				
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


