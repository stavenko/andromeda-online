window.World = function(auth_hash, user_id){
    this.auth_hash = auth_hash;
    this.user_id = user_id;

    this.isStopped = false; 


    this.initRenderer();
    this.initCustomUpdater();
    this.setupViewports();

    var checkContext = function(){
        var that = this;

        this.startSceneLoading()
        .then(function(){
            console.info("Go loading");
            that.initViews();
            console.info("Views inited");
            that.initSyncing();
            console.info("Syncing inited");
            that.setupNetworkListeners();
            console.info("network listeners set up");
        })
        .then(function(){
            console.info("Go simulation");
            that.startSimulation();
        })
        .fail(function(reason){
            console.warn( reason );
            setTimeout( checkContext, 3000 );
            that.clear();
            delete that;

        })
        .catch(function(e){
            console.error(e);
            that.clear();
        }).done();
    };

    checkContext = checkContext.bind(this);
    checkContext();

};

window.World.prototype = _.extend(window.World.prototype, {
    
    clear: function(){
        if (this.scenes){
            console.info('clearing scenes');
            for (var i in this.scenes){
                this.scenes[i].clear();
                this.scenes[i]= null;
                delete this.scenes[i];
            }
            
        }

        if(! (this.synchronizer)){
            this.synchronizer = SynchronizerGetter();

        }
        this.synchronizer.stop();

    },
    initRenderer : function(){
        this.renderer = new RendererGetter();
    },
    setupViewports : function(){
        this.viewportService = ViewportServiceGetter();
        this.viewportService.setup();

    },

    startSceneLoading : function(){
        var scenePromise = GameContextLoader ( SocketServiceGetter() )
        var that = this;
        that.scenes = {};
        that.actors = {};
        that.actorScene = {};
        return scenePromise.then(function(context){
            _.each(context.scenes, function(sceneDescription){
                that.scenes[sceneDescription.scene.GUID] = sceneDescription.scene;
                _.each(sceneDescription.actors, function(actor){
                    if(context.currentUserActors.indexOf(actor.GUID) !== -1){ // actor.GUID in context.currentUserActors
                        that.actors[actor.GUID] = actor;
                        that.actorScene[actor.GUID] = sceneDescription.scene;
                    }
                });
            });
        })
    },

    initViews: function(){
        var that = this;
        var viewCollection = new ViewCollection();
        _.each(this.actors, function(actor){
            var scene = that.actorScene[actor.GUID];
            var views = scene
                .get_object(actor.control.object_guid)
                .workpoints[actor.control.workpoint].views;
            var object = scene.get_object(actor.control.object_guid)
            var mesh = scene.meshes[actor.control.object_guid];
            var uis = mesh.getUIForWP(actor.control.workpoint);
            _.each(views, function(viewName){
                var viewGlobalName = [object.type, object.sub_type, actor.control.workpoint, viewName].join('.');
                var viewIdentity = scene.GUID + actor.control.object_guid + viewName;
                var view = new View(scene, viewName, object, mesh );
                viewCollection.add(viewIdentity, viewGlobalName, view, actor, uis );

            });

        });

        this.viewCollection = viewCollection;
        this.viewportService.bindViews(this.viewCollection);

    },

    initSyncing: function(){

        console.info("Syncronizer inited");

        this.synchronizer = SynchronizerGetter();
        this.synchronizer.start();
    },

    setupNetworkListeners: function(){

        var socketService = SocketServiceGetter();
        var that = this;
        socketService.addListener("F", function( data ){
            if(data.scene in that.scenes){
                that.scenes[data.scene]
                    .addNetworkMessage(data.a)
            }

        });
        socketService.addListener("ALM", function( data ){
            if(data.scene in that.scenes){
                that.scenes[data.scene].sync(data.almanach);
            }
        });
    },
    initCustomUpdater : function(){
    
        this.customUpdaters = CustomUpdaterGetter();
    },
    makeSceneTicks : function(){
        _.each(this.scenes, function( scene, guid ){
            scene.tick();
        })
    },
    animate: function(){
        this.makeSceneTicks();
        this.customUpdaters.update();
        var that = this;
        _.each(this.viewportService.getViewports(), function(viewPort){
            // console.log("animate");
            if(viewPort.view){
                that.renderer.render(viewPort);
            }
        })
        if(!this.isStopped){
            requestAnimationFrame(this.animate.bind(this) );

        }
            

    },
    startSimulation: function(){
        if(this.isStopped){
            this.isStopped = false;
        }
        requestAnimationFrame(this.animate.bind(this));
    },
    stopAnimation : function(){
        this.isStopped = true;
    }
});
