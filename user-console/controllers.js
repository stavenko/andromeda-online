app.controller('UserAllAssets', function($scope, $log, $location, moduleUrls){
    
    var url = $scope.$parent.location.url();
    
    var node = moduleUrls[url];
    
    // $scope.$parent.selected_node = node;
    
    
    $scope.assets = [
    {name:'ble-bla', type:'ship', loc:{}},
    {name:'white Widow', type:'ship', loc:{}},
    {name:'Mavericks', type:'rockets', loc:{ }}
    ]  
    
    
})
app.controller("rootCont", function($scope){
    $scope.hello = "Hello";
})