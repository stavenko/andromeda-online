app.controller("userConstructionCont", ["$scope","socketListeners", function($scope,  ws){
    
    ws.register("bookmarked-objects", function(message){
        console.log(message);
        $scope.bookmarkedObjects = message.objects;
        
    })
    
}])