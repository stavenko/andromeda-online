World = (function(){
	function Cons(){
		this.name = "Cons";
	}
	return Cons;
})()


window.World.init = function(auth_hash, client_login){
	this.__vpx = 0;
	this.auth_hash = auth_hash;
	this.login = client_login;
	
	// this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
	// this.camera.position.z = 250;
	this.p = new THREE.Projector();
	this.three_scenes = {}
	this.scenes = {};
	this.flares = {};
    this.actors = {};
    this.actorScene = {};
	//  = new THREE.Scene();
	this.clock = new THREE.Clock();
	//this.geometry = new THREE.CubeGeometry(200, 200, 200);
	var sg = new THREE.SphereGeometry(5);
	// var wires = new THREE.MeshBasicMaterial({wireframe:true})
	this.cur = new THREE.Mesh(sg) // , wires);
	this.vp_width = document.body.clientWidth;
	this.vp_height = 400;//document.body.clientHeight;
	this._main_viewport = 0
	this._additional_vps = [];
	this.sceneActions = {};
	this._input_keymap = {};
    this._uniform_updaters = {};
	// var ProtoBuf = dcodeIO.ProtoBuf;
	// this.protobufBuilder = ProtoBuf.loadProtoFile( "/js/gl/client_message.proto" );
	//this._main_viewport_actors = [];
	var h3 = this.vp_height/3
	var w4 = this.vp_width/4
	var w34 = this.vp_width- w4
	this._additional_vps_geom = [
		{l:w34, t:h3*2, w:w4, h:h3},
		{l:w34, t:h3, w:w4, h:h3},
		{l:w34, t:0, w:w4, h:h3},
	
	]
	this._main_vp_geom = {l:0, t:0, w:this.vp_width, h:this.vp_height};
	
	this.skyboxScenes = {};
	this.skyBoxes = {}; //[scene.guid]  = new THREE.Mesh( new THREE.CubeGeometry( 9000, 9000, 9000 ), material );
	this.skyBoxCamera = {};//[scene.guid]
	this.mouse_projection_vec = new THREE.Vector3();
	SL.init();
	var self = this;
	self.pings = [];
	self.pings_instability = [];
	self._time_diffs = [];
    self.latencities = [];
	

	
    
	this.renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
	this.renderer.setSize(this.vp_width, this.vp_height);
	this.renderer.setClearColor(new THREE.Color(0x000000));
	document.body.appendChild(this.renderer.domElement);
	
	this.renderer.gammaInput = true;
	this.renderer.gammaOutput = true;
	this.renderer.autoClear = false;
	this.renderer.physicallyBasedShading = true;
	
	this._camera_rot_q = new THREE.Quaternion();
	
	
	
	document.addEventListener( 'mousemove', function(e){
		self.mouse_x = e.x;
		self.mouse_y = e.y;
	}, false );
	this.renderer.domElement.addEventListener('mouseup', function(e){
		// console.log(e)
		// console.log("MOUSE");
		self.Inputs.input( 'lmouse', false)
	})
	
	this.renderer.domElement.addEventListener('mousedown', function(e){
		// console.log(e)
		self.Inputs.input( 'lmouse', true)
	})
	document.addEventListener('keydown', function(e){
		var code = e.keyCode;
		// console.log(code);
		self.Inputs.input( code, true)
		
		//if(code in self.actions){
		//	var action = self.actions[code]
		//	ControllersActionMap[action.type].act(self, action, true)
		//}else{
			//}
		
	}, false)
	document.addEventListener('keyup', function(e){
		var code = e.keyCode;
		self.Inputs.input(code, false)
		//if(code in self.actions){
		//	var action = self.actions[code]
		//	ControllersActionMap[action.type].act(self, action, false)
		//}else{
			//}
		
	}, false)
	self.init_socket()
	return self;
	
}


window.World.set_actions = function(){
	self.actions = self._default_actions
}

// module.exports.W = window;