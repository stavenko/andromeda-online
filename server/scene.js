var fs    = require('fs');
var u = require('./utils');
var THR = require('three');
var Controller = require('./controller');
var AObject = require('./object');
var EQ = require("./event_queue");

var _     = require('underscore');

var SceneObject = function(threeScene, W){
	this.description= "Scene routines";
	this.GUID =  u.make_guid();
	// this.broadcaster = broadcaster;


    this.use_client_rendering = false;
    if(threeScene !== undefined && W !== undefined){
    	this.W = W;
    	this.three_scene = threeScene;
        this.use_client_rendering = true;
    }
    
	this._create();
	
};
Scene = {constructor: SceneObject}
if(typeof window === 'undefined'){
	Scene.THREE = THR; // Saveing THREE.js as part of scene - this step could be done on a certain platform
	Scene.do_prepare_rendering = false
	Scene.ajax_load_models = false
	Scene.need_update_matrix = true
	Scene.localActions = false
	var is_browser = false;
	
	
}else{
	var is_browser = true;
	Scene.THREE = THREE;
	Scene.do_prepare_rendering = true;
	Scene.ajax_load_models = true;
	Scene.need_update_matrix = false;
	Scene.localActions = true;
	Scene.INPUT_TIMESTEP = 0.0700; // seconds
	Scene.time_since_last_actions_acquired = 0;
	
	// Scene.save_meshes_past = true
	
	
}

Scene.get_actor = function(actor_guid){
	return this.get_actors()[actor_guid];
}


Scene.mesh_for = function(actor_guid){
	var actor = this.actors[actor_guid];
	return this.meshes[actor.control.object_guid]
}

Scene.create = function(){
	this._create();
	
	return this;
}

Scene._create = function(){
	this.clock = new (this.THREE.Clock)();
	this.time_inc  = 0;
	this.tick_counter = 0;
	this._scene_object_cache = {};
	this._scene_obj_actors={};
	this._network_messages = [];
    this._last_user_activity = new Date().getTime();
	this._last_server_report = {};
	this.loaded_objects_count = 0;
	this._model_cache = {};
    
    
	this._server_sync_queue = [];
	this._server_last_sended = 0;
	this.meshes = {};
    this.actors = {};
	this.loader =  new this.THREE.JSONLoader();
	this.total_objects_count = 0;
	
	this.mesh_last_states = {}
	this.mesh_actions = {};
	this._target_aq = 0.01; // seconds to get to sync target
	this.is_loaded = false
	this._d = false
    
	
}
/*
Scene.update_from_world = function(){
	// globalx-y-z - galaxy coords with 1 meter accuracy
	var closest_scene_with_distance = this.get_closest_scene(this.gx, this.gy, this.gz);
	// if closest_scene is not null - we must inject object with actors to that scene - it's already_loaded
	// else - We finding objects for that scene
				
	var objects_within_coords = this.get_objects_in(this.gx, this.gy, this.gz); // Загрузка объектов в сцену из глобального мира
	
	var objects = {}
	for ( var i = 0; i < objects_within_coords.length ; i++ ){
		objects[ objects_within_coords[i].GUID ] =   objects_within_coords[i];
	}
	_.extend(this._scene.objects, objects)
	
	this._scene.sunDirection = [0,1,0]
	this._scene.sunLightColor = [Math.random(), 0.8, 0.9] // HSL
	this._scene.coords =[ this.gx, this.gy, this.gz ]
	
    
	
	return this
	
}
*/

Scene.get_actors = function(){
	return this.actors
}

Scene.get_object = function(guid){
	return this.meshes[guid].type;
}

Scene.get_json = function(){
	return this._scene
}
Scene.get_closest_scene = function(){
	return undefined
}
Scene.get_objects_in = function(){
	return [];
}
Scene.join_object = function( object ){
    
	this.load_object(object, object.GUID);
	

}
Scene.join_actor = function( actor ){



	this.actors[actor.GUID] = actor;
	if(this.actor_wp_ix === undefined){
		this.actor_wp_ix = {}
		
	}else{
		if (this.actor_wp_ix[actor.control.object_guid] === undefined){
			this.actor_wp_ix[actor.control.object_guid] = {}
		}else{
			this.actor_wp_ix[actor.control.object_guid][actor.wp] = actor;
		}
	}
	return this
	
    
}


Scene.addActions = function(mesh_guid, actions){
	this.mesh_actions[mesh_guid] = actions
}
Scene.getActions = function(){
	return this.mesh_actions;
}

Scene.load_object = function(object, ix){
    
    var self = this;
	self.total_objects_count +=1;
    
	
	if (! self.ajax_load_models){
		var m = object.ship_type.model_3d.split('/')[2];
		var model_path= "./public/models/" + m
	}

	
	var rf = function(){
		var with_geom_and_mat = function(geom, mat){
			var m = new self.THREE.Matrix4()
			m.identity()
		
			
			var mesh = AObject(self, geom, mat) ;//self.THREE.Mesh( geom, mat );
			mesh.json = object;
			mesh.load_json();
			var actions = mesh.getActionList();


			self.addActions(object.GUID, actions);
			
			if (self.do_prepare_rendering){
				if (object.type !=='static'){

					var label = SpriteUtils.makeTextSprite("mesh: " + ix);
					label.position = new self.THREE.Vector3(0,0,0);
					mesh.add(label);

				}
				self.three_scene.add( mesh );
		
			}
			
			self.meshes[ object.GUID ] = mesh;
			self.loaded_objects_count +=1;
			self._model_loaded( ix )
		}
		
		
		if(self.ajax_load_models){
			self._get_model(object.ship_type.model_3d,self._ajax_getter, with_geom_and_mat)
		}else{
			self._get_model(model_path, self._fs_getter, with_geom_and_mat)

		}
	}
	setTimeout(rf,1);
}
Scene.load = function(onload, three_scene, W){
	// three scene - is a param for adding meshes to
	var self = this;

	// DEBUG THINGS
	//self.total = new self.THREE.Vector3();
	//self.total_t=0;
	//self.controller_map= Controller.ControllersActionMap()
	self._call_back = onload;
	
    this._server_sync_queue = [];
	this._server_last_sended = 0;
	self.meshes = {}
	self.loader =  new self.THREE.JSONLoader();
	self.total_objects_count = 0;
	
	if(typeof window !== 'undefined'){
		self.three_scene = three_scene
		self.W = W;
	}
	
	
	
},
Scene._ajax_getter=function(name, cb) {

	var self = this;
	self.loader.load( name, function(geom, mat){
		
		var material = new THREE.MeshFaceMaterial( mat );
		//var a = {geom:geom, material:material}
		cb(geom, material);
		
	})
}
Scene._fs_getter=function(name, cb){
	var self = this;
	fs.readFile(name, function(err,data){

		if(err) throw err;
		var json = JSON.parse(data)
        var result = self.loader.parse( json, '' );

		var ld = (function(){
			var material = new self.THREE.MeshFaceMaterial( result.materials );
			cb(result.geometry, material);
		
		})
		setTimeout(ld,1);
	});
}

Scene._get_model = function(name, getter, with_geom_and_mat){
	var self = this;
	var mat_geom_cb = function(geom, mat){
		self._model_cache[name] = {geom:geom, material:mat}
		with_geom_and_mat(geom, mat)
	}
	if (name in self._model_cache){
		var a= self._model_cache[name]
		with_geom_and_mat(a.geom, a.material)
	}else{
		getter.apply(self,[name, mat_geom_cb])
	}
				
}
Scene._delete_object = function(guid){
	var self = this;
	if(self.three_scene){
		self.three_scene.remove(self.meshes[guid]) // удяляем ядро из сцены
	}
	delete self.meshes[ guid ]; // ... из мешей
	delete self._scene_object_cache[ guid ]
	
	
}
Scene._model_loaded = function(ix){

	if (this.loaded_objects_count == this.total_objects_count){
		// scene loaded
		this.is_loaded = true;
		if  (this.onLoadCallback){
			this.onLoadCallback(this)
		}
	}else{


	}
}
Scene.sync = function(sync){
	var self = this;

	self._last_server_report = sync


}
Scene.get = function(){
	return this._scene
}
Scene.get_almanach = function(){

	return this.mesh_last_states
	
}
Scene.createSettingAction =function(actor, setting_name, setting_value, is_switch){

	var action = {
		type: 1000,
		name:setting_name,
		value:setting_value,
		actor:actor.GUID,
		wp : actor.control.workpoint,
		object_guid: actor.control.object_guid,
		scene: actor.scene,
		ts: new Date().getTime(),
		
		controller: "settings"
	}
	if (is_switch){
		action.switch = true;
		delete action.value;
	}
	action.ident = action.ts + this.W._time_diff;
	return action;
	
}

Scene.makeActorSetting = function(actor, setting_name, setting_value, is_switch){
	this._addToServerQueue(this.createSettingAction(actor,setting_name,setting_value,is_switch));
}
Scene.addSettingToScene = function(actor, setting_name, setting_value, is_switch){
	var action = this.createSettingAction(actor, setting_name, setting_value, is_switch);
	var mesh = this.meshes[actor.control.object_guid];
	mesh.eventManager.add(action)
}
Scene.sendAction= function(actor, name, val, is_switch){
	var action = this.createSettingAction(actor, name, val, is_switch);
	var mesh = this.meshes[actor.control.object_guid];
	this._addToServerQueue(action);
	mesh.eventManager.add(action);
	
	
}

Scene.unload = function(callback){
    console.log("We must now save all object states and report with callback");
    callback();
}

Scene.tick = function(){
	var self = this;
	if(self.tick_num){
		self.tick_num+=1;
	}else{
		self.tick_num = 0;
	}
	var now = new Date().getTime();
    

	var time_left = self.clock.getDelta();
	self.time_inc += time_left;
	
	
	if(self.last_ts === undefined){
		self.last_ts = new Date().getTime();
	}
	if(self.localActions){ // Если это клиент и мы можем управлять склавиатуры
		
		if(self.time_since_last_actions_acquired > self.INPUT_TIMESTEP){
			self.time_since_last_actions_acquired = 0
			var new_actions = self.getLocalActions(now);
			
			if(new_actions.length > 0){
				
				_.each(new_actions, function(a){

					self._addToServerQueue(a);

					self.meshes[a.mesh].eventManager.add(a, a.ident  );
                    

                    
					
				})
			}
			
		}else{
			self.time_since_last_actions_acquired += time_left;
			
		}
	}
	var nm = self.getNetworkActions();
	_.each(nm,function(action){
        // Если у нас есть объект W - то мы должны исполнять акции по времени не учитывая время задержки
		var mesh = self.meshes[action.mesh];
        
        //if(self.W !== undefined){
    		//mesh.eventManager.add(action, action.ident - W._time_diff);
            
            //}else{ // Если нету - значит на сервере - и значит строго
    	mesh.eventManager.add(action, action.ident);
            
            //}
	})

	
	// lastActions = getLastActions
	_.each(self.meshes, function(mesh, i){
		
		if (mesh.type == 'static') return;
		if(self.localActions && (i in self._last_server_report) ){

			
			mesh.recalculate_till_server_report(self._last_server_report[i] , self.W._time_diff);

			
			delete self._last_server_report[i]; 
			
			
		}

		if(self.W){
			var q_now =  now + self.W._time_diff;
		}else{
			var q_now = now;
		}

		mesh.eventManager.process(q_now, function(event){

			mesh.controllers[event.dev].process(event);
            if(self.W){
                if(mesh.uis[event.dev] && mesh.uis[event.dev].onAction){
                    mesh.uis[event.dev].onAction(self.W, self.GUID, event );
                }
            }
			
		})

		if(! is_browser){

		}
		

		
		if(! (self.localActions )){
			
			self.mesh_last_states[i] = mesh.getState();
			
		}
		self.process_physical(mesh, now);
		
		
		
		
	})
	self.last_ts = now
    
    
	
}
Scene.getNetworkActions = function(){
	var ret = _.clone(this._network_messages)
	this._network_messages = [];
	return ret;
}
Scene.getLocalActions = function(now){

		if(this.GUID == this.W.get_main_viewport().scene){
			var acts =this.W.Inputs.getLatestActions(this.GUID, now);  
			if(acts.length > 0){

			}
			return acts;
			
		}else{
			return[];
		}

	
	
	
}
Scene.makeSceneBroadcast = function(action){
	if(this.broadcaster){
		this.broadcaster("mesh-action", this.actors, action);
		
	}
}
Scene.removeObject = function (mesh) {

    if (this.do_prepare_rendering) {
        this.createBlast( mesh );
        this.three_scene.remove(mesh);
        
    }
    delete this.meshes[mesh.json.GUID];
    
    
}

Scene.createBlast = function (mesh) {
    var ts = new Date().getTime();

    SpriteUtils.createExposionObject(
        "#" + mesh.json.GUID + "_" + ts , 
        ts, 
        mesh.position.toArray(), 
        mesh.geometry.boundingSphere.radius * 20,
        this.three_scene, 
        this.W);
}
Scene.process_physical = function(mesh, now){
	mesh.update_static_physical_data(now);
	
}
Scene._addToServerQueue = function(action){
	this.W.sendAction(this.GUID, action);
}
Scene._flushServerQueue = function(){
	var size = this._server_sync_queue.length ;
	var ret = this._server_sync_queue.slice(this._server_last_sended);

	this._server_last_sended = size;
	return {scene:this.GUID, actions:ret};
}
Scene.addNetworkMessage = function(mes){
    this._last_user_activity = new Date().getTime();

	this._network_messages.push(mes) // = this._network_messages.concat(mes)
};
Scene.clear = function(){
    for (var i in this.meshes){

        this.meshes[i].clear();
        this.meshes[i] = null;

    };
    this.three_scene = null;
    this.actors = null;
    this.W = null;
    this.onLoadCallback = null;
    this._scene_object_cache = null;
    for (var mc in this._model_cache){
        delete this._model_cache[mc];

    }
};

SceneObject.prototype = Scene;
module.exports = SceneObject;