var CPilotController = function(actor_name){
	this.type='pilot';
	this.action_types=['rotate', 'move']
	function get_axis(a){
		if(a == 'x'){
			axis = new THREE.Vector3(1,0,0)
		}
		if(a == 'y'){
			axis = new THREE.Vector3(0,1,0)
		}
		if(a == 'z'){
			axis = new THREE.Vector3(0,0,1)
		}
		return axis
		
		
	}
	
	this.act = function(W, action, is_down ){
		//console.log('Wat');
		console.log(W.actors[actor_name].control.oid)
		var C = W.meshes[ W.actors[actor_name].control.oid ]
		
	

	
		if (action.type == 'rotate'){
			var a = action.dir == '+'?1:-1;
		
			if (is_down){
				C.put_on("rotation", action.axis+action.dir)
			}else{
				C.put_off("rotation", action.axis+action.dir)
			}
		}
		if (action.type == 'move'){
		
			var a = action.dir == '+'?1:-1;
		
			var m = new THREE.Matrix4()
			if (is_down){
				C.put_on("propulsion", action.axis + action.dir)
			}else{
				C.put_off("propulsion", action.axis + action.dir)
			}
		}
	
		if (action.type == 'rotatec'){
			var a = action.dir == '+'?1:-1;
			var ag = a * 0.1;
			var axis = get_axis(action.axis);
			var _q = new THREE.Quaternion();
			_q.setFromAxisAngle( axis, ag );
			W.camera.quaternion.multiply( _q );
			W.setCamera();
		}
	}
	// return this;
	
};

CPilotController.prototype = {constructor:CPilotController}
var PilotController = new CPilotController("__");

function basicAutoPilotActor(W, id, oid){
	this.targets = ["orbit_object", "close_to_object"];
	this.default_distance = 200
	this.get_foes = function(){
		this.foes = []
		for (var i =0; i < W.meshes.length; i++){
			if(i != id) foes.push({id:id, obj:W.meshes[i]})
			
		}
	}
	
}
function BasicBulletActor(W, id, coid){ 
	// id = is object in the world controllable by this actor
	// coid  MUST BE an object, who shoot this bullet
	this.name = "Basic_actor" + (performance.now())
	this.W;
	this.oid = id
	this.coid = coid
	this.my_mesh = W.meshes[id]
	// console.log(W.meshes, id, W.meshes.length)
	var total_time_in_space = 0;
	var _possible_targets = {};
	
	this.run = function(time_left){
		total_time_in_space += time_left
		if (total_time_in_space > 60){
			W.meshes.splice(id, 1)
			delete W.actors[this.name];
		}
		var vel = this.my_mesh.vel.clone();
		var mpos = this.my_mesh.position.clone();
		
		var thres = 4 * this.my_mesh.vel.length();
		var in_thres = [];
		//console.log("THRes", thres);
		
		for(var i = 0; i< W.meshes.length; i++) {
			if(i === id || i == coid) continue;
			var m = W.meshes[i];
			var mp =  m.position.clone();
			var pd = mp.sub( mpos )
			var ag = Math.acos(pd.dot(vel)/ vel.length() / pd.length())
			if (ag < Math.PI/16)
			{
				// console.log("HH", i, ag, Math.PI/8);
				
			
				var sub = this.my_mesh.clone().position.sub( mp );
				var dist = sub.length()
				if( dist < thres){
					//console.log("OKE");
					if( in_thres.indexOf( i ) === -1 ){
						
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
					}else{
						
						
					}
				}
			}else{
				if(i in _possible_targets){
					// Угол был острый - стал тупой
					// console.log("here!",i);
					// Надо проверить, не пересекает ли отрезок - прошлые координаты - текущие координаты наш меш
					var direction = mpos.clone().sub( _possible_targets[i].last_point)
					var ray = new THREE.Raycaster(_possible_targets[i].last_point, direction.clone().normalize() )
					var isr = ray.intersectObjects([m])
					if (isr.length > 0 && isr[0].distance < direction.length() ){
						//for( var index =0; index<isr.length; index++){
						//	console.log("HERE", isr[index].distance, direction.length())
						///}
						
						
						// console.log("END", isr[0].point);
						m.worldToLocal(isr[0].point) // Теперь это плечо удара
						var impulse = vel.clone().multiplyScalar(this.my_mesh.mass)
						var axis = new THREE.Vector3().crossVectors(isr[0].point, impulse)
						
						var ag = Math.acos(isr[0].point.clone().dot(impulse) / impulse.length() / isr[0].point.length() )
						// Теперь это вращение надо разбить по осям
						var mat = new THREE.Matrix4().makeRotationAxis(axis.normalize(), ag)
						var eul = new THREE.Euler()
						eul.setFromRotationMatrix(mat, "XYZ")
						console.log(i, eul)
						var avel = new THREE.Vector3();
						avel.x = eul.x;
						avel.y = eul.y;
						avel.z = eul.z;
						var ck = isr[0].point.length() * Math.sin(ag - Math.PI/2)
						
						console.log(this.my_mesh.mass / m.mass * (ck * ck ));
						avel.multiplyScalar(this.my_mesh.mass/m.mass * Math.abs(ck))
						
						// Не учитываю массу и плечо... 
						W.meshes[i].avel.x += avel.x
						W.meshes[i].avel.y += avel.y
						W.meshes[i].avel.z += avel.z;
						
						
						
						add_vel = impulse.multiplyScalar( 1/ m.mass);
						console.log(add_vel)
						// Убрать пока скорость
						//W.meshes[i].vel.add(add_vel);
						
						
						//console.log("END LOCAL", isr[0].point);
						//console.log('oke, we shoot it:', i)
						// Now we will just remove object from scene with the bullet
						//W.scene.remove(W.meshes[i])
						
						W.scene.remove(W.meshes[id])
						
						//W.meshes.splice(i, 1);
						W.meshes.splice(id, 1);
						delete W.actors[this.name];
						// bla.bla = 1
					}
				}
				// console.log( ag, Math.PI/8);
				
			}
			
		}
		//bla.bal +=1
		//console.log(bla)
		
		
		// console.log(total_time_in_space ,W.meshes.length, W.actors)
	}
	
	
}


var CTurretController = function(){
	this.act = function(W, action, is_down ){
		if (action.type =='shoot_primary'){
			// var weapon = C.weapons[0];
			var C = W.meshes[ W.actors['__'].control.oid ]
			
			var mpv = W.mouse_projection_vec.clone().sub(C.position)
			//.normalize()
			//.multiplyScalar(1000);
			.multiplyScalar(0.5000);
			
			// console.log('shooting');	
			var cubeGeometry = new THREE.CubeGeometry(1,1,1,1,1,1);
			var wireMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00, wireframe:true } );
			var bullet = new THREE.Mesh( cubeGeometry, wireMaterial );
			bullet.pos = new THREE.Vector3()
			bullet.pos = C.position.clone()
			
			bullet.has_engines = false;
			bullet.vel = mpv//.multiplyScalar(0.10);
			bullet.mass = 0.1;
			W.scene.add( bullet );
			var ix = W.meshes.push( bullet );
			
			var bullet_actor = new BasicBulletActor(W, ix-1, W.actors['__'].control.oid)
			W.actors[bullet_actor.name] = bullet_actor;
			
			
		}
	}
	// return this;
	
};
var TurretController = new CTurretController()

//console.log(TurretController.act, PilotController.act)
var ControllersActionMap = {
	'move': PilotController,
	'rotate':PilotController,
	'rotatec': PilotController,
	'shoot_primary': TurretController
} 