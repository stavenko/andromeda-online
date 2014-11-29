window.View = function(sceneGUID, viewName){
    this.actors = {};
    this.UIS = [];
    this.sceneGUID = sceneGUID;
    this.viewName = viewName;

    this.addActor = function( actor ){
        this.actors[actor.GUID] = actor;

    };
    this.addUI = function( ui ){
        this.UIS.push( ui );
    }


}