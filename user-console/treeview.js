app.controller('consoleBrowser',['$scope', "$log", "$location", 'navTree',function($scope, $log, $location, navTree){
    $scope.vaar = "Hello cont";
    $log.log($location.path());
    $scope.location = $location;
   // $scope.route = r;
//     $scope.routeProvider = rp;

    //console.log("navTree", navTree);
    $scope.dataForTheTree = navTree;

    $scope.selected_node = navTree[1];
    
    $scope.showSelected = function(node){
        $log.log("showSelected", node);
        $location.url(node.url);
        
    }
    
}] );

