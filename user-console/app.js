var app = angular.module("user-console",["treeControl",'ngRoute']);

/*
app.run(["$rootScope","$location", function($rootScope, $location){
    $rootScope['user-console-globals']['$location'] = $location;
}])

*/


var uMap = {
        '':{ label:"Главная","controller": 'rootCont', "templateUrl":"/templates/Root.html"},
        "assets":{ label:"Активы", "controller": 'UserAllAssets', "templateUrl":"/templates/UserAllAssets.html"},
        "ships":{ label:"Мои корабли", "parent":"assets", "controller": 'UserShips', "templateUrl":"/templates/UserShips.html"},
        "goods":{ label:"Разные вещи", "parent":"assets", "controller": 'UserAssets', "templateUrl":"/templates/UserAssets.html"},
        
        "market":{ label:"Рынок", "controller": 'MarketCont', "templateUrl":"/templates/Market.html"},
        "production":{ label:"Производство", "controller": 'ProductionCont', "templateUrl":"/templates/Production.html"},
        "ownProd":{ label:"Собственные фабрики", parent:'production',  "controller": 'OwnPlantsCont', "templateUrl":"/templates/OwnPlants.html"},
        
        "missions":{ label:"Миссии", "controller": 'MissionsCont', "templateUrl":"/templates/Missions.html"},
        "mission-constructor":{ label:"Конструктор миссий", parent:'missions', "controller": 'MissionConstructorCont', "templateUrl":"/templates/MissionConstructor.html"}
        
}

app.constant("moduleUrlMap", uMap)


var getUrls = function(map){
    var url_list = {}

    var getUrl = function(addr, obj, map){
        var na = obj.parent;
        if (parent in map[na]){
            root = getUrl(na, map[na], map);
        }else{
            root = '/';
        }
        return root + na + "/" +addr;
    }

    for(var addr in map){
        var obj = map[addr];
        if('parent' in obj){
            var u = getUrl(addr, obj, map);
        }else{
            var u = "/" + addr;
        }
        // console.log("R",u);
        var no = {url:u, _name: addr,  label:obj.label, ang:{controller:obj.controller, templateUrl:obj.templateUrl }};
        if('parent' in obj){
            no.parent = obj.parent;
        }
        url_list[u] = no;
    }
    return url_list;

}
var getUrlTree = function(map){
    // Надо составить индекс типа
    // {"/url/":[1,2] } - Цифры - это индексы итемов в дереве с чилдренами
    var tree = [];
    var objs = {};
    var roots = [];
    for (var item  in map){
        var obj = map[item];
        obj.children = []
        objs[obj._name] = obj;
        if('parent' in obj){
            // console.log("objs", objs, obj.parent, obj._name);
            objs[obj.parent].children.push(obj);
            // console.log(objs[obj.parent].children);
        }else{
            roots.push(obj._name);
            
        };
    }
    var rtree = [];
    for(var r in roots){
        // console.log("fuck", r);
        rtree.push( objs[roots[r]])
        
    }
    return rtree;
    
}
// getUrlTree(getUrls(uMap));

app.constant("moduleUrls", getUrls(uMap));
app.constant("navTree", getUrlTree(getUrls(uMap) ) );

app.config(["$routeProvider", "moduleUrlMap",  function($routeProvider, moduleUrlMap){
    
    var rp = $routeProvider;
    var map  = getUrls(moduleUrlMap);
    // console.log(">>", map);
    for(var url in map){
        // console.log(url);
        rp =  rp.when(url, map[url].ang)
    }
    // rp.otherwise({redirectTo:"/"})

}]);

