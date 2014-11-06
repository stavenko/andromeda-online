window.World = function(){

    this.initRenderer();
    this.setupViewports();
    this.initNetworking();



}

window.World.prototype = _.extend(window.World.prototype, {
    initRenderer : function(){
        this.renderer = new Renderer();
    },
    setupViewports : function(){
        /* viewport geometries = this._additional_vps_geom = [
        {l:w34, t:h3*2, w:w4, h:h3},
        {l:w34, t:h3, w:w4, h:h3},
        {l:w34, t:0, w:w4, h:h3}

        ]
        this._main_vp_geom = {l:0, t:0, w:this.vp_width, h:this.vp_height, use};
        */
        var w34 = this.renderer.width/4 * 3;
        var w4  = this.renderer.width/4;
        var h3  = this.renderer.height/2;

        var viewportConfigs = [
            {l:0, t:0, w:this.renderer.width, h:this.renderer.height, drawUI: true},
            {l:w34, t:h3*2, w:w4, h:h3},
            {l:w34, t:h3, w:w4, h:h3},
            {l:w34, t:0, w:w4, h:h3}
        ]
        var viewPorts = [];
        _.each(viewportConfigs, function(config){
            viewPorts.push( new Viewport(config) );
        })
        this.viewPorts = viewPorts;

    },

    initKeymapping: function(){
        this.keyStateManager = new KeyStateManager();
    },
    initNetworking: function(){
        this.networkManager = new NetworkManager();
    },
    startSceneLoading : function(){
        var scenePromise = GameContextLoader (this.networkManager.socketService);
        var that = this;
        scenePromise.then(function(context){
            _.each(context.scenes, function(sceneDescription){
                _.each(sceneDescription.actors, function(actor){
                    if(context.currentUserActors.indexOf(actor.GUID) !== -1){ // actor.GUID in context.currentUserActors
                        //TODO here we could add this actor to handy someplace
                    }
                    sceneDescription.scene.join_actor(act);
                })
                _.each(sceneDescription.objects, function(object){
                    sceneDescription.scene.join_object(obj, obj.GUID);
                })
            })
        })
        .then(function(){
            console.log("here's we must start super graphics loading")
        })

    }

});