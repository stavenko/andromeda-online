
window.World.load_scene = function (scene_js, onload){
	// console.log('well-well', scene._scene);
	
	// this.scenes = {}
	
	var scene = new Scene()
	
	scene.set_from_json(scene_js)
	
	
	this.scenes[scene.GUID] = scene;
	this.three_scenes[scene.GUID] = new THREE.Scene();
	// console.log("WWW", onload);
	scene.load(onload, this.three_scenes[scene.GUID], this )
	
	// 
	//console.log("loading this scene", scene.GUID);

}

window.World.initSun = function(scene){
	
	var flareColor = new THREE.Color( 0xffffff );
	var sl = _.clone(scene._scene.sunLightColor);
	sl[2] += 0.5
	flareColor.setHSL.apply(flareColor, sl);
	
	var textureFlare0 = THREE.ImageUtils.loadTexture( "/textures/lensflare/lensflare0.png" );
	var textureFlare2 = THREE.ImageUtils.loadTexture( "/textures/lensflare/lensflare2.png" );
	var textureFlare3 = THREE.ImageUtils.loadTexture( "/textures/lensflare/lensflare3.png" );
	
	var lensFlare = new THREE.LensFlare( textureFlare0, 700, 0.0, THREE.AdditiveBlending, flareColor );

	lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
	lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
	lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );

	lensFlare.add( textureFlare3, 60, 0.6, THREE.AdditiveBlending );
	lensFlare.add( textureFlare3, 70, 0.7, THREE.AdditiveBlending );
	lensFlare.add( textureFlare3, 120, 0.9, THREE.AdditiveBlending );
	lensFlare.add( textureFlare3, 70, 1.0, THREE.AdditiveBlending );
	var lensFlareUpdateCallback = function ( object ) {

		var f, fl = object.lensFlares.length;
		var flare;
		var vecX = -object.positionScreen.x * 2;
		var vecY = -object.positionScreen.y * 2;


		for( f = 0; f < fl; f++ ) {

			   flare = object.lensFlares[ f ];

			   flare.x = object.positionScreen.x + vecX * flare.distance;
			   flare.y = object.positionScreen.y + vecY * flare.distance;

			   flare.rotation = 0;

		}

		object.lensFlares[ 2 ].y += 0.025;
		object.lensFlares[ 3 ].rotation = object.positionScreen.x * 0.5 + THREE.Math.degToRad( 45 );

	}
	lensFlare.customUpdateCallback = lensFlareUpdateCallback;
	lensFlare.position = new THREE.Vector3().fromArray(scene._scene.sunDirection).multiplyScalar(500)
	
	
	// this.sunBillboard = new THREE.Sprite(textureFlare0 )
	this.three_scenes[scene.GUID].add(lensFlare)
	this.flares[scene.GUID] = lensFlare;
}
window.World.initSpace  = function(vp){

	var path = "/textures/space/m01_cube";
	var format = 'png';
	var urls = [
		path + '.px.' + format, path + '.nx.' + format,
		path + '.py.' + format, path + '.ny.' + format,
		path + '.pz.' + format, path + '.nz.' + format
	];

	var textureCube = THREE.ImageUtils.loadTextureCube( urls );
	var shader = THREE.ShaderLib[ "cube" ];
	shader.uniforms[ "tCube" ].value = textureCube;

	var material = new THREE.ShaderMaterial( {

		fragmentShader: shader.fragmentShader,
		vertexShader: shader.vertexShader,
		uniforms: shader.uniforms,
		depthWrite: false,
		side: THREE.BackSide

	} );
	this.skyboxScenes[vp.scene] = new THREE.Scene();
	var m = new THREE.Mesh( new THREE.CubeGeometry( 9000, 9000, 9000 ), material );
	this.skyBoxes[vp.scene]   = m
	
	this.skyBoxCamera[vp.scene] = new THREE.PerspectiveCamera(45, vp.geom.w / vp.geom.h, 1, 10000);
	this.skyboxScenes[vp.scene].add(m);
}


// Vieport functions
window.World.make_main = function(scene){
	var sel = document.getElementById('viewports-select');
	this._main_viewport = sel.options[sel.selectedIndex].value;
	this._init_vps()
}
window.World.add_icon = function(scene){
	var sel = document.getElementById('viewports-select');
	add_vp = sel.options[sel.selectedIndex].value;
	if(this._additional_vps.length == 3){
		this._additional_vps[2] == add_vp;
		
	}else{
		this._additional_vps.push(add_vp);
	}
	this._init_vps()
	
	
}

window.World.meshes = function(){
	return this.scene.meshes
}


window.World.controllable = function(){
	var mvp = this.get_main_viewport();
	// console.log("MMM", mvp)
	return this.scenes[mvp.scene].meshes[mvp.object]
}
window.World.mesh_for = function(actor){
	//console.log(">>>",this.meshes()[this.scene.actors[actor].control.object_guid]);
	return this.meshes()[this.scene.actors[actor].control.object_guid]
}


window.World.get_current_actor = function(){
	var self = this;
	return self.scene.actors[self.login]
}