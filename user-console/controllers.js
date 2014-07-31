app.controller('UserAllAssets', ["$scope", "socketPromise", function($scope, socketPromise){
    socketPromise.get("A", {user_id: true }).then(function(res){
        $scope.assets = res;
        // console.log("RESOLVED", res)
    });
    $scope.d = ["a"]
    
    $scope.connect = function(position){
        // TODO Убрать возможность нажимать на кнопку еще хоть раз
        // TODO Заставлять гореть эту кнопку только если действительно не подключен     
        console.log("connect recv");
        position.user_id = true;
        socketPromise.request("C", position).then(function(res){
            console.log("something to return", res);
        })
        // console.log(position);
    }
    
    $scope.shippositions = function(ship){
        //console.log(">>G", ship);
        socketPromise.get("T", {"type": ship.ship_type} ).then(function(res){
            // console.log(res);
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