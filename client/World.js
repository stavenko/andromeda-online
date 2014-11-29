window.World = function(auth_hash, user_id){
    this.auth_hash = auth_hash;
    this.user_id = user_id;

    this.initRenderer();
    this.setupViewports();
    this.initNetworking();

    var checkContext = function(){
        var that = this;
        this.startSceneLoading()
        .then(function(){
            console.info("Go loading");
            that.initViews();
            that.collectActions();
            that.initSyncing();
            that.initKeymapping(that.getKeyBinding(), that.getSynchronizer() );
        })
        .then(function(){
            console.info("Go simulation");
            this.startSimulation();
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
            }

        }
    },
    initRenderer : function(){
        this.renderer = new Renderer();
    },
    setupViewports : function(){
        var w34 = this.renderer.width/4 * 3;
        var w4  = this.renderer.width/4;
        var h3  = this.renderer.height/2;

        var viewportConfigs = [
            {l:0, t:0, w:this.renderer.width, h:this.renderer.height, drawUI: true},
            {l:w34, t:h3*2, w:w4, h:h3},
            {l:w34, t:h3, w:w4, h:h3},
            {l:w34, t:0, w:w4, h:h3}
        ];
        var viewPorts = [];
        _.each(viewportConfigs, function(config){
            viewPorts.push( new Viewport(config) );
        });
        this.viewPorts = viewPorts;

    },

    initKeymapping: function(keymap, synchronizer){
        this.keyStateManager = new KeyStateManager(keymap, synchronizer);
    },
    initNetworking: function(){
        this.networkManager = new NetworkManager();
    },
    startSceneLoading : function(){
        var scenePromise = GameContextLoader (this.networkManager.socketService);
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
        var viewCollection = {
            views:{},
            viewOrder: [],
            identityMap : {},
            add: function(identity, view, actor, UI){
                if(!(identity  in this.views)){
                    this.views[identity] = view;
                    this.viewOrder.push(identity);
                }
                this.views[identity].addActor( actor );
                this.views[identity].addUI( UI );
            },
            get: function(id){
                return this.views[id];

            },
            getIx :function(ix){
                var n = this.viewOrder[ix];
                return this.get(n);
            }
        };
        _.each(this.actors, function(actor){
            var scene = that.actorScene[actor.GUID];
            var views = scene
                .get_object(actor.control.object_guid)
                .workpoints[actor.control.workpoint].views;
            var mesh = scene.meshes[actor.control.object_guid];
            var uis = mesh.getUIForWP(actor.control.workpoint);
            _.each(views, function(viewName){
                var viewIdentity = scene.GUID + actor.control.object_guid + viewName;
                var view = new View(scene.GUID, viewName );
                viewCollection.add(viewIdentity, view, actor, uis );

            });

        });

        this.viewCollection = viewCollection;
        this.viewPorts[0].bind(this.viewCollection.getIx(0));

    },
    collectActions:function(){
        var that = this;
        _.each(this.viewPorts, function(vp){
            if(vp.doDrawUI() && vp.view){
                var view = vp.view;
                _.each(view.actors, function(a){
                    var actions = that.actorScene[a.GUID].getActions()[a.control.object_guid];

                    //var scene_actions = that.scene[a.scene_guid
                    console.info("actions ", actions, a );
                });
            }
        });
    },
    initSyncing: function(){
        console.info("Syncronizer inited");
        this.synchronizer = new Synchronizer();
        this.synchronizer.syncLoop();
    }


});
