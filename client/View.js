window.View = function(scene, viewName, controllableObject, controllabelMesh){
    this.actors = {};
    this.UIS = [];
    this.scene= scene;
    this.viewName = viewName;
    this.object = controllableObject;
    this.mesh = controllabelMesh;

    this.skyboxScene = new THREE.Scene();
    this.celestialScene = new THREE.Scene();


    this.bind = function(vp){
        this.viewport = vp;
    }
    this.unbindViewport = function(){
        this.mesh.remove(this.viewport.camera)
        this.viewport = undefined;
    }


    this.addActor = function( actor ){
        this.actors[actor.GUID] = actor;

    };
    this.addUI = function( ui ){
        this.UIS.push( ui );
    }


}
