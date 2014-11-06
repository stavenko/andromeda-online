window.GameContextLoader = function(socketService){

    var scenePromises  = [];
    var celestialPromises = [];

    var scenes_in_process = [];

    var contextActors = [];


    socketService.request("CTX", {user_id:true})
        .then(function(context){
            _.each(context.contexts, function(scene_desc, actor_guid){
                var objectPromises = [];
                contextActors.push(actor_guid);

                var scene_guid = scene_desc.GUID;
                if(scenes_in_process.indexOf( scene_guid  ) !== -1){
                    return;
                }else{
                    scenes_in_process.push(scene_guid);
                }
                var objects = scene_desc.objects;

                var scene_actors = scene_desc.actors;

                if(scene_desc.location.g.orbit){
                    celestialPromises.push(
                        socketService.socket_srv.get("celectial-recursive", {GUID: scene_desc.location.g.orbit.C})
                    );
                }
                _.each(objects, function(oguid) {
                    var p = socketService.get("A", {id: oguid})
                        .then(function (obj) {
                            return socketService.get("T", {type: obj.ship_type})
                                .then(function (t) {
                                    obj.ship_type = t;
                                    return obj;
                                })
                        });
                    objectPromises.push(p);
                });
                Q.all(objectPromises).then(function(objects){

                    self.three_scenes[scene_guid] = new THREE.Scene();
                    var scene = new Scene(self.three_scenes[scene_guid], self);
                    scene.GUID = scene_guid;
                    var sceneDef = Q.defer();
                    scene.onLoadCallback = function(){
                        //self.setup_scene(scene);
                        scenePromises.push(sceneDef.resolve({scene:scene, actors: scene_desc.actors, objects:objects} ));
                    }
                    scenePromises.push(sceneDef.promise)

                });
            })

        });

    if( scenePromises.length == 0){
        console.error("Scene promise array is empty");
    }
    return Q.all( scenePromises).then(function(scenes){
        return {scenes:scenes, currentUserActors: contextActors};
    });
}