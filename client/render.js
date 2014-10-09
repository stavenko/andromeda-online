window.World.render = function(vp,geom){
	this.redrawSun(vp)
	// console.log(vp)
	this.renderer.setViewport(geom.l, geom.t, geom.w, geom.h)
	//console.log("BLBLB",this.three_scenes,vp.scene);
	this.redrawSky(vp)
	if(this.scenes[vp.scene]._action_on_the_run_var){
		console.log('render M');
	}
    this._cur_cam = vp.three_camera;
	//this.276
	// er.276
	// ( this.three_scenes[vp.scene], vp.three_camera );

    // console.log(this.three_scenes, vp.three_camera);

	
    this.renderer.render(this.three_scenes[vp.scene], vp.three_camera);
	
	
}

window.World.redrawSky = function(vp){


    var mp = vp.three_camera.parent.matrix.clone()
	var m = vp.three_camera.matrix.clone()
	mp.multiply(m)
	var mr = new THREE.Matrix4().extractRotation(mp)
	var rot = new THREE.Euler().setFromRotationMatrix(mr)
	
	// console.log(vp.three_camera)
	this.skyBoxCamera[vp.scene].rotation.copy( rot );


	//this.renderer.setViewport(vp.geom.l, vp.geom.t, vp.geom.w, vp.geom.h);


    this.renderer.render( this.skyboxScenes[vp.scene], this.skyBoxCamera[vp.scene] );
	// renderer.render( scene, camera );
	// console.log(this.skyBox.position)
	
}

window.World.get_main_viewport = function(){
	//console.log(this._main_viewport);
	return this._viewports[this._main_viewport];
}
window.World._init_vps = function(){
	var mvp = this._viewports[this._main_viewport];
	var self = this;
	// console.log(mvp);
	mvp.geom = {t:0, l:0, w:this.vp_width, h:this.vp_height};
	mvp.three_camera = this.makeCamera(mvp)
	_.each(mvp.UIS, function(ui){
		ui.construct();
	})
	// this.
	_.each(mvp.actors, function(actor){
		// get actions for this actor
		// console.log(self.sceneActions);
        var scene_guid = self.actorScene[actor.GUID];
		var total_actions = self.sceneActions[scene_guid][actor.control.object_guid][actor.control.workpoint];
		_.each(total_actions, function(action){
			if(action.default_key){
				self._input_keymap[action.default_key] = action;
			}
		})
		// console.log(total_actions);
	})
	
	this.three_scenes[mvp.scene].add(this.cur);
	this.initSpace(mvp);
	
	
	var self = this;
	self.Inputs = new Controller.LocalInputActor(self, self.socket)
	// self._contrallable = self.controllable();
	
	_.each(this._additional_vps, function(vp_name,i){
		var vp = self._viewports[vp_name];
		vp.geom = self._additional_vps_geom[i]
		vp.three_camera = self.makeCamera(vp)
		self.initSpace(vp);
		
		
	})
	
}

window.World.setupCameras = function(){
	var self = this;
	// Сначала составим список уникальных вьюпортов - сцена-объект-камера
	self._viewports = {}
	self._viewport_amount = 0;
	var is_first = true;
	// var cmap = Controller.ControllersActionMap();
	console.log("setting up cameras with", self.actors);
	_.each(self.actors, function(actor){
		//console.log(actor)
		var wp = actor.control.workpoint;
        var scene_guid = self.actorScene[actor.GUID];
		console.log("scenes", self.scenes, scene_guid);
		var views = self.scenes[scene_guid].get_object(actor.control.object_guid).workpoints[wp].views
		var mesh = self.scenes[scene_guid].meshes[actor.control.object_guid];
		var uis = mesh.getUIForWP(wp);
		
		_.each(views, function(view){
			var vp_hash = scene_guid + actor.control.object_guid + view;
			if (is_first){
				self._main_viewport = vp_hash;
			}
			// console.log(" show me ", actor);
			if(!(vp_hash in self._viewports)){
				var vp = {scene:scene_guid, object:actor.control.object_guid, camera: view, actors:[actor], UIS:uis}
				self._viewports[vp_hash] = vp
				self._viewport_amount +=1;
			}else{
				self._viewports[vp_hash].actors.push(actor);
				var U = self._viewports[vp_hash].UIS;
                // console.log( U, U.concat(uis), uis ) ;
				self._viewports[vp_hash].UIS = U.concat(uis);
				
			}
		})
	})
	// self._main_viewport = 0;
	// console.log("VP",self._viewports[self._main_viewport]);
	//self._viewports[self._main_viewport]
	self._init_vps();
	var sel = document.getElementById('viewports-select');
	sel.innerHtml = "";
	_.each(self._viewports, function(vp,k){
		var opt = document.createElement('option')
		opt.value = k;
		opt.appendChild(document.createTextNode(vp.camera))
		sel.appendChild(opt)
	})
	
	
}



window.World.redrawSun = function(vp){
	var m = this.scenes[vp.scene].meshes[vp.object]
	
	var sd = new THREE.Vector3().fromArray([0,1,0]).multiplyScalar(10); 
	//console.log(sd, this.scenes[vp.scene]._scene.sunDirection);
	
	this.flares[vp.scene].position = m.position.clone().add(sd)
	// console.log(this.flares[vp.scene].position)
}

window.World.makeCamera = function(vp ){
	var self = this;
	//var actor = self.get_current_actor()
	
	// console.log("SET CAMERA");
	// var controllable = self.controllable()
	// var wp  		 = actor.control.workpoints
	// var vp        	 = actor.control.viewport;
	
	var scene = vp.scene
	var object_id = vp.object
	var port = vp.camera
	var mesh = self.scenes[scene].meshes[object_id]
	var object = self.scenes[scene].get_object(object_id)
	
	var camera = new THREE.PerspectiveCamera(45, vp.geom.w / vp.geom.h, 1, 1000);
	
	var vp_pos    	 = new THREE.Vector3();
	var vp_rot  	 = new THREE.Vector3();
	// console.log(object, camera);
	vp_pos.set.apply(vp_pos, object.cameras[port].position)
	vp_rot.set.apply(vp_rot, object.cameras[port].direction)
	
	var cam_base = new THREE.Vector3(0,0,-1);
	var axis = new THREE.Vector3()
	axis.crossVectors(cam_base, vp_rot)
	var ag = Math.acos(cam_base.dot(vp_rot)/ cam_base.length() / vp_rot.length())
	 //console.log(axis.length() === 0 && cam_base.equals( vp_rot ) )
	if(axis.length() === 0 && !cam_base.equals( vp_rot ) ){
		axis = new THREE.Vector3(0,1,0)
		ag = Math.PI;
		
	}
	//console.log(axis,ag, vp_rot);
	//console.log(vp_rot)
	camera.rotateOnAxis(axis, ag)
	
	camera.position = vp_pos; // controllable.position.clone().add(vp_pos)
	mesh.add(camera)
	return camera
	
	
}

window.World.setup_scene = function(scene){
	material = new THREE.MeshBasicMaterial({
	   color: 0xff0000,
	   wireframe: true
	});
	// console.log(scene._scene)
	
	var sunDirection = new THREE.Vector3().fromArray([0,1,0]) ;
	//this.sunLightColor = [0.1, 0.7, 0.5];
	
	var ambientLight = new THREE.AmbientLight(0x010101);
	this.three_scenes[scene.GUID].add(ambientLight);

	var light = new THREE.DirectionalLight( 0xFFFFee, 1 );
	// console.log("COLOR",scene._scene.sunLightColor);
	light.color.setHSL.apply(light.color, [Math.random(), 0.8, 0.9] );
	light.position = sunDirection

	this.three_scenes[scene.GUID].add( light );
	this.initSun(scene)
	
	this.sceneActions[scene.GUID] = scene.getActions(); // Здесь будут все акции по всем сценам
	// Где-то здесь можно привязать контроллы
	
}


window.World.bindCamera = function(){
	
	var self = this;
	// console.log(self.actors);
	var actor 		 = self.get_current_actor();
	//console.log(actor.control);
	var controllable = self.meshes()[ actor.control.object_guid ];
	controllable.add( self.camera )
	self.setCamera();
	
}


window.World.go = function(){
	var self = this;
	var last_timestamp = false;
	var first_loop = true;
	var time_inc = 0
	// self.mouse_projection_vec = new THREE.Vector3();
	// var _3d_scene = self.setup_scene(self.scene._3scene)
	var _d = false
	self.setupCameras();
	
	
	
	// var _time_interv = 
	
	var makeTicks = function(){
		_.each(self.scenes, function(s, g){
			//console.log("recount ",g);
			s.tick()
			//console.log("is made syncy"); 
		})
	}
	
	
    var animate = function(){
        // if (self.total_objects_count === self.loaded_objects_count){
        makeTicks();
        //console.log(self._viewports)
        var mvp = self.get_main_viewport();
        var geom = self._main_vp_geom
        // console.log("RENDER");
        // Before rendering let's update our uniforms;
        _.each(self._uniform_updaters, function(f, name){
            f();
        })
        self.mouse_projection_vec.set( ( self.mouse_x/ geom.w ) * 2 - 1, - ( self.mouse_y / geom.h ) * 2 + 1, 0.99 );
        
        self.render(mvp, geom);
        _.each(mvp.UIS, function(ui){
        	ui.refresh();
        })
        
        self.p.unprojectVector( self.mouse_projection_vec, mvp.three_camera );

        self.cur.position.copy( self.mouse_projection_vec );
        //console.log(self.mouse_projection_vec);


        _.each(self._additional_vps, function(vp_name, i){
            var vp = self._viewports[vp_name];
            self.render(vp, self._additional_vps_geom[i])
        })
        //}
            
		SL.redraw();
    
		requestAnimationFrame(animate)
    	
    }
	requestAnimationFrame(animate);
	
}