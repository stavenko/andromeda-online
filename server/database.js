// get user-related objects

// Максимальная высота орбиты - 4 * радиус космического тела
// минимальная высота орбиты - 5% от радиуса космического тела
// Шаг высот - 300 км
// Шаг фаз - Math.PI / 5
// Вектора нормалей орбит жестко заданы в северной полусфере. 
// нормаль и отрицательная нормаль - это одна и та же орбита. Такие объекты нельзя размещать на одно высоте

var Utils = require("./utils");
var _ = require('underscore');
var GravitationalConstant = 6.67384 * Math.pow( 10,-11);

var _PRE_GUIDS = 
[
      "4ac0c711-1ea9-42df-a0f2-bb57ac767650"
     ,'74946f5b-0ba6-45a8-8b29-3685d0a60092'
     ,'74946f5b-0ba6-45a8-8b39-3685d0a50094'
     ,'74946f5b-0bb6-45a8-8b49-3685d0a40096'
     ,'74946f5b-0bc6-45a8-8b59-3685d0a30097'
     ,'74946f5b-0bd6-45a8-8b69-3685d0a20090'
     ,'74946f5b-0be6-45a8-8b79-3685d0a10092' ]


var Celestials = {
    '64946f5b-0bd6-45a8-8b69-3685d0a20090': {
        R:6.9551 *Math.pow(10,8), // 1.392 * Math.pow(10,9),
        M:1.9891 * Math.pow(10,30),
        GUID:'64946f5b-0bd6-45a8-8b69-3685d0a20090',
        type:"star",
        name:"sun",
        position:[0,0,0]
    },
    '64946f5b-0bd6-45a8-8b69-3685d0a20091':{
        type:"planet",
        M: 1.8986 * Math.pow(10,27),
        R: 69911000,
        name:"jupiter",
        GUID:'64946f5b-0bd6-45a8-8b69-3685d0a20091',
        orbit:{celestial:'64946f5b-0bd6-45a8-8b69-3685d0a20090',
               e:0.048775,
               a:7.785472*Math.pow(10,8), 
               P:(275.066/360*(2*Math.PI)),
               T: 4332.589 * 24 * 60 * 60,
               n: [0.6545084971874736,0.5877852522924731,-0.47552825814757665],
            t0 :0 }
        
    },
    '64946f5b-0bd6-45a8-8b69-3685d0a20092':{
        type:"moon",
        name:"ganimed",
        R: 2634100,
        M: 1.4819*Math.pow(10,23),
        GUID:'64946f5b-0bd6-45a8-8b69-3685d0a20092',
        orbit:{
            celestial:'64946f5b-0bd6-45a8-8b69-3685d0a20091',
            e: 0.0013,
            a: 1070400, // large semiaxis
            n: [0.6545084971874736,0.5877852522924731,-0.47552825814757665], // orbit plane normal
            P: 0, // perihelium argument
            T: 7.15455296 * 24 * 60 * 60, // Period
            t0:0 // phase of orbit on first sightseeing
        }
    }
}

var Users = [
      { id:1
    , name:"Orion"
    }
    , { id:2
    , name:"Destroyer"
    }
]

var Orbit1 = {
            is_predefined: true,
            C: '64946f5b-0bd6-45a8-8b69-3685d0a20092',
            a:  3,  // 0<= a <= (Math.floor( celestial_radius*2 ) / height_step - min_height )  min_height + a * height_step
            n:  12, // 0<= n < 66;  Normal to orbit plane: there're 66 normals
            t0: 2  // t0 <= n < 5; phase = T/5 * t0;
        
}

var Orbit2 = {
            is_predefined: true,
            C: '64946f5b-0bd6-45a8-8b69-3685d0a20091',
            a:  5,  
            n:  12, 
            t0: 1
        
     
        
}
var psource = {
	fuel_cell_capacity: 500, // Объем топлива
	fuel_consumption_performance: 1, // Удельная энергия топлива - 
	max_power: 6000, // Максимальная мощность источника энергии - Дж (Вт.с)
	min_power:0, // Минимальная мощность источника энергии
	powerup_speed:2, // Скорость увеличения мощности источника - джоули в секунду
	powerdown_speed:2, // Скорость уменьшения мощности источника
	capacitor:360000 // Емкость конденсатора

};

devices = [
// Engines first
//0
{type:'engine', name:'x-', engine_type:'rotation', consumption:1000, performance:0.8, unit:[-1, 0, 0], actions:{impulse:{default_key:87}, power:{} } },
//1
{type:'engine', name:'x+', engine_type:'rotation', consumption:1000, performance:0.8, unit:[1, 0, 0], actions:{impulse:{default_key:83}, power:{} }},

//2
{type:'engine', name:'y+', engine_type:'rotation', consumption:1000, performance:0.8, unit:[0, 1, 0], actions:{impulse:{default_key:65}, power:{} }},
//3
{type:'engine', name:'y-', engine_type:'rotation', consumption:1000, performance:0.8, unit:[0, -1, 0], actions:{impulse:{default_key:68}, power:{} }},
//4

{type:'engine', name:'z+', engine_type:'rotation', consumption:1000, performance:0.8, unit:[0, 0, 1], actions:{impulse:{default_key:90}, power:{} }},
//5
{type:'engine', name:'z-', engine_type:'rotation', consumption:1000, performance:0.8, unit:[0, 0, -1], actions:{impulse:{default_key:67}, power:{} }},

//6
{type:'engine', name:'z+', engine_type:'propulsion', consumption:5000, performance:0.8, unit:[0, 0, -1], actions:{impulse:{default_key:38}, power:{} }},
//7
{type:'engine', name:'z-', engine_type:'propulsion', consumption:5000, performance:0.8, unit:[0, 0, 1], actions:{impulse:{default_key:40}, power:{} }},

// Shields & engine
//8
{type:'power',  name:'Power Source', powerup_speed:2, powerdown_speed:2, capacitor:360000, max_power:6000, min_power:0, actions:{power:{}} },
//9
{type:'shield', name:'Armor',shield_type:'armor', effective_impulse:300, capacity:4000, capacitor:4000, charge_rate:500, repair_rate:300, performance:0.5, actions:{power:{}, toggle:{is_switch:true} }},
//10
{type:'shield', name:'Shield',shield_type:'shield', capacity:5000, capacitor:10000, charge_rate:1000, setup_energy:3000, actions:{power:{}, toggle:{is_switch:true} }},
//11
{type:'shield', name:'Thermal',shield_type:'thermal', effective_impulse:300, actions:{power:{}, toggle:{is_switch:true} }},

// turrets, bays, drones, launchers
//12
{type:'turret', name:"Front turret", position: [0,0.5,0], magazine_capacity: 100, turret_shoot_rate:2000, turret_reload_rate:10000, shoot_impulse:320, actions:{fire:{ default_key:'lmouse'}, reload:{default_key:82} } },
//13
{type:'turret', name:"back turret", position: [0,0,2], magazine_capacity: 100, turret_shoot_rate:2000, turret_reload_rate:10000, shoot_impulse:320, actions:{fire:{ default_key:'lmouse'}, reload:{default_key:82} } },
//14
{type:"virtual", name:"Foreign action virtual device", actions:{"process":{}}},
//15
{type:"hull", name:"Hull hp", shield_type:'hull', capacity:1000, actions:{}}


]
var shields = {
	"armor":[9],
	"shield":[10],
	thermal:[]
};
engines = {
	'rotation':[0,1,2,3,4,5],
	'propulsion':[6,7]
}

var PreviousState = {
    world:{	
        position: [0,100,0],
        rotation: [0,0,0],
        impulse:  [0,0,0],
        angular_impulse: [0,0,0]
    },

    devices:[
        {power:1},
        {power:1},
        {power:1},
        {power:1},
        {power:1},
        {power:1},

        {power:1},
        {power:1},

        {capacitor:0, power:1},

        {power:0.1, capacity:100, state:false, reserve_capacity:0},
        {power:0.1, capacity:100, state:false, reserve_capacity:0},
        {power:0.0, capacity:0},

        {magazine:30, last_shot_time:0, is_reloading:0},
        {magazine:30, last_shot_time:0, is_reloading:0},
        {},
        {capacity:200}
    ]	
};
var ST = {
    type:'ship',
    "sub_type":"rookie_ship",
    model_3d:'/models/StarCruiser.js',

    "cameras":{
        "front":{
            "label":"main",
            "position": [0,0.5,0],
            "direction":[0,0,-1]
        },
        "back":{
            "label":"main",
            "position": [0,0.5,2],
            "direction":[0,0,1]
        }
    },
    devices:devices,
    power_source:8,
    foreign_processor:14,
    hull_device:15,
    shields:shields,
    'engines': engines,
    'mass': 10000,
    'GUID':_PRE_GUIDS[0],
    "workpoints":{
        "Piloting":{
            "views": ["front","back"],
            "type":"pilot",
            devices:[0,1,2,3,4,5,6,7,8,9,10,11]
        },
        "Front turret":{
            "views": ["front"],
            "type":  "turret",
            "turret":"front",
            devices:[12]
        },
        "Back turret":{
            "views":["back"],
            "type":"turret",
            "turret":"back",
            devices:[13]
        }
    }
}
var ShipTypes = {
    "rookie":ST
}


// console.log("do we have this loaded twice?");
var Assets = [{
    GUID: _PRE_GUIDS[1],
    type:"ship",
    sub_type:"rookie",
    location:{ g:{type:"orbit", orbit:Orbit1}},
    last_state: PreviousState,
    owner: 1
},{

    GUID: _PRE_GUIDS[2],
    type:"ship",
    sub_type:"rookie",
    location:{g:{type:"coords", coordinates:{}}},
    last_state: PreviousState,
    owner:1
},
{

    GUID: _PRE_GUIDS[4],
    type:"ship",
    ship_type:"rookie",
    location:{ g:{type:"orbit", orbit:Orbit2}},
    last_state: PreviousState,
    owner:1
},
{
    GUID: _PRE_GUIDS[3],
    type:"ship",
    ship_type:"rookie",
    location:{ g:{type:"orbit", orbit:Orbit2}},
    last_state: PreviousState,
    owner: 2
}
]

var AssetOwnerIx = function(){
    var IX = {};
    for(var ix =0 ; ix <  Assets. length; ix++){
        var a = Assets[ix];
        if (a.owner in IX){
            IX[a.owner].push(ix);
        }else{
            IX[a.owner] = [ix];
            
        }
    }
    return IX;
}()
var AssetsIx = function(){
    var IX = {};
    for(var ix =0 ; ix <  Assets. length; ix++){
        var a = Assets[ix];
        IX [a.GUID] = ix;
    }
    return IX;
}()

var AssetLocationIx = function(){
   var IX = {};
   for(var ix =0 ; ix <  Assets. length; ix++){
       var a = Assets[ix];
       var key = _pack_location(a.location.g);
       if (key in IX){
           IX[key].push(ix);
       }else{
           IX[key] = [ix];
           
       }
   }
   return IX;
    
}()

function getShipType(type_name, callback){
    callback(ShipTypes[type_name]);
    
}

function _pack_location(gLocation){
    if(gLocation.type === 'orbit'){
        var o = gLocation.orbit;
        var key = [o.C, o.a, o.t0, o.n];
        
    }else{
        var o = gLocation.coordinates;
        var key = [o.C, o.a, o.d];
    }
    return key.join("");
    
}
function getAssetsInLocation(gLocation){
    
    var key = _pack_location(gLocation.g);
    return _.map(AssetLocationIx[key], function(ix){return Assets[ix];})
    
    
}


function getAssetsFor(user_id){

    return  _.map(AssetOwnerIx[user_id], function(ix){return Assets[ix]})

}
function getAssets_(id){
    //console.log("IX",id, AssetsIx[id], AssetsIx);
    return Assets[AssetsIx[id]];
}
function DB(){

    var getCelestial = function (c_guid){
        return Celestials[c_guid];
    
    };

    this.getRelatedCelestials = function (celestial_guid, callback){
        // Find the celestial, which corresponds to the solar system
        console.log("celestial", celestial_guid);
        var C, lst = [];
        C = getCelestial(celestial_guid.GUID);
        lst.push(C);
        while(C.type !== 'star'){
            C = getCelestial(C.orbit.celestial);
            lst.push(C);
        }
        callback(lst);
    };

    this.getCelestials = function (query, callback){
        // Find the celestial, which corresponds to the solar system
        var C;
        C = getCelestial(query.GUID);
        callback(C);
    };

    this.getAssets = function getAssets(query, callback){
        //console.log("Q for A", query);
        if (query.user_id)
            callback( getAssetsFor(query.user_id) )
        if (query.id){
            // console.log(getAssets);
            callback( getAssets_(query.id) )
        }
        if (query.location){
            callback(getAssetsInLocation(query.location));
        }
    };
    this.getUsers = function(q, callback){
        callback(Users);
    }
    this.getType =function(q, cb){
        getShipType(q.type, cb);
        
    }
    this.query = function(type, query, callback){
        if(type === "U"){
            return this.getUsers(query, callback);
        }else if (type === "A"){
            return this.getAssets(query, callback);
        }else if (type === "celectial-recursive") {
            return this.getRelatedCelestials(query, callback);
        }else if (type === "celestials"){
            return this.getCelestials(query, callback);
        }else if (type === "B"){
            return this.getBookmarks(query,callback);
        }else if (type === "T"){
            // console.log("Getting type of it");
            return this.getType(query, callback);
    }
        
    }
}



module.exports = new DB()
