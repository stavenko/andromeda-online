window.GameContextLoader = function(socketService){

    var scenePromises  = [];
    var celestialPromises = [];

    var scenes_in_process = [];

    var contextActors = [];
    var returnDefer = Q.defer();

    socketService.request("CTX", {user_id:true})
        .then(function(context){
            console.log("CONTEXT", context);
            _.each(context.contexts, function(scene_desc, actor_guid){
                var objectPromises = [];
                contextActors.push(actor_guid);
                var scene_guid = scene_desc.GUID;
                var sceneDef = Q.defer();
                if(scenes_in_process.indexOf( scene_guid  ) !== -1){
                    return;
                }else{

                    scenes_in_process.push(scene_guid);
                    scenePromises.push(sceneDef.promise)
                }
                var objects = scene_desc.objects;
                var scene_actors = scene_desc.actors;
                if(scene_desc.location.g.orbit){
                    celestialPromises.push(
                        socketService.get("celectial-recursive", {GUID: scene_desc.location.g.orbit.C})
                    );
                }
                _.each(objects, function(oguid) {
                    var p = socketService.get("A", {id: oguid})
                        .then(function (obj) {
                            return socketService.get("T", {type: obj.sub_type})
                                .then(function (t) {
                                    obj.sub_type = t;
                                    return obj;
                                })
                        });
                    objectPromises.push(p);
                });
                Q.all(objectPromises).then(function(objects){
                    console.log("II", objects);
                    var threeScene =  new THREE.Scene();
                    var scene = new Scene(threeScene, self);
                    scene.GUID = scene_guid;
                    scene.onLoadCallback = function(){
                        sceneDef.resolve({
                            scene:scene,
                            threeScene: threeScene,
                            actors: scene_desc.actors
                        });
                    };
                    _.each(scene_actors, function(act){
                        scene.join_actor(act);
                    });

                    _.each(objects, function(obj){
                        scene.join_object(obj, obj.GUID);
                    });
                }).catch(function(e){
                    console.error(e);
                });
            });

            if( scenePromises.length == 0){
                returnDefer.reject("No scenes to load");
            }else{
                Q.all( scenePromises).then(function(scenes){
                    returnDefer.resolve({scenes:scenes, currentUserActors: contextActors});
                });
            }

        })
        .catch(function(e){
            console.error(e);
        });




    return returnDefer.promise;

}
