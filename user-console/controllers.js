app.controller('UserAllAssets', ["$scope", "socketPromise", "$q", function($scope, socketPromise, $q){
    socketPromise.get("A", {user_id: true }).then(function(res){
        $scope.assets = res;
        var promises = [];
        console.log(res);
        angular.forEach(res, function(asset, ix){
            console.log(asset);
            if(asset.location){
                var g = asset.location.g;
                if(g.orbit){
                    promises.push(socketPromise.get("celestials",{"GUID": g.orbit.C })
                        .then(function(a){console.log(a); return a;}) );
                }
                if(g.coordinates){
                    console.log("coordinates", g.coordinates);
                }
            }
        })
        $q.all(promises).then(function(cels){
            var celestials = {};
            angular.forEach(cels, function(C){
                celestials[C.GUID] = C;
            })
            $scope.celestials = celestials;

        })

    });
    $scope.d = ["a"];
    
    $scope.connect = function(position){
        // TODO Убрать возможность нажимать на кнопку еще хоть раз
        // TODO Заставлять гореть эту кнопку только если действительно не подключен     
        console.log("connect recv");
        position.user_id = true;
        socketPromise.request("C", position).then(function(res){
            console.log("something to return", res);
        })
    }
    
    $scope.shippositions = function(ship){
        socketPromise.get("T", {"type": ship.sub_type} ).then(function(res){
            $scope.positions =[]
            angular.forEach(res.workpoints, function(wp, wp_name){
                $scope.positions.push({name:wp_name, type:wp.type, object_guid: ship.GUID});
            })
        })
    }
    
    
}])

//app.controller("ShipPositionCont", ["$scope", "socketPromise", function($scope, socketPromise){
// }])

app.controller("rootCont", function($scope){
    $scope.hello = "Hello";
})
