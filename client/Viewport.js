window.Viewport = function( config ){

    this.config = config;
    this.name = config.name;
    this.keyMap = {};
    this.actions = {};


    this.doDrawUI = function(){
        return this.config.drawUI;
    };

    this.makeCamera = function(){
        var cameraBaseVector = new THREE.Vector3(0,0,-1);
        console.log("making camera" , this.config);
        var camera = new THREE.PerspectiveCamera(45, this.config.w / this.config.h, 1, 1000);
        var axis = new THREE.Vector3();
        var vpRotation = this.view.object.cameras[this.view.viewName].direction;
        var vpPosition = this.view.object.cameras[this.view.viewName].position;

        axis.crossVectors(cameraBaseVector, new THREE.Vector3().fromArray(vpRotation) );
        var rotAngle = Math.acos(cameraBaseVector.dot(new THREE.Vector3().fromArray( vpRotation) ) );
        camera.position.fromArray(vpPosition);


        camera.rotateOnAxis(axis, rotAngle);
        this.camera = camera;
        this.skyBoxCamera    = new THREE.PerspectiveCamera(45, this.config.w / this.config.h, 1, 1000) 
        this.celestialCamera = new THREE.PerspectiveCamera(45, this.config.w / this.config.h, 1, 1000) 
        this.view.mesh.add(camera);
    }

    this.bind = function( view ){
        console.info("BIND", this.view);
        if(this.view){
            this.view.unbindViewport();
        }

        this.view = view;
        var that = this;
        _.each(view.actors, function(a){
            var actions = view.scene.getActions()[a.control.object_guid];
            _.each(actions, function(action){
                if(action.default_key){
                    that.keyMap[action.default_key] = action;
                }
                that.actions[action.name] =  action;
            })
        });
        this.makeCamera();
        this.view.bind(this);
    }

    this.unprojectCoords = function(x, y){
        var vpGeometry = this.config;
        var vpX = x - vpGeometry.l;
        var vpY = y - vpGeometry.t;
        var X = (vpX / vpGeometry.w *2) -1;
        var Y = (vpY / vpGeometry.h *2) +1;
        var result = new THREE.Vector3(X, Y, 0.99 )
        this.projector.unprojectVector(result, this.camera);
        return result.clone();
    }
}
