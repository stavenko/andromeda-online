// get user-related objects

// Максимальная высота орбиты - 4 * радиус космического тела
// минимальная высота орбиты - 5% от радиуса космического тела
// Шаг высот - 300 км
// Шаг фаз - Math.PI / 5
// Вектора нормалей орбит жестко заданы в северной полусфере. 
// нормаль и отрицательная нормаль - это одна и та же орбита. Такие объекты нельзя размещать на одно высоте


var GravitationalConstant = 6.67384 * Math.pow( 10,-11);

var Celestials = {
    sun: {
        R:6.9551·Math.pow(10,8), // 1.392 * Math.pow(10,9),
        M:1.9891 * Math.pow(10,30),
        type:"star"
    },
    jupiter:{
        type:"planet",
        M: 1.8986 * Math.pow(10,27),
        R: 69911000,
        orbit:{celestial:"sun", 
               e:0.048775, 
               a:7.785472*Math.pow(10,8), 
               P:(275.066/360*(2*Math.PI)),
               T: 4332.589 * 24 * 60 * 60,
               n: [0,1,0],
               t0 :0 }
        
    },
    ganimed:{
        type:"moon",
        R: 2634100,
        M: 1.4819·Math.pow(10,23),
        orbit:{
            celestial:"jupiter",
            e: 0.0013,
            a: 1070400,
            n: [0,1,0],
            P: 0,
            T: 7.15455296 * 24 * 60 * 60,
            t0:0
        }
    }
}

function getCelestial(c_guid){
    return Celestials[c_guid];
    
}

function getRelatedCelestials(celestial_guid){
    // Find the celestial, which corresponds to the solar system 
    var C, lst;
    C = getCelestial(celestial_guid);
    lst.push(C);
    while(C.type !== 'star'){
        C = getCelestial(C.orbit.celestial);
        lst.push(C);
    }
    return lst
}

function getAssets(user_guid, object_types){
    
    
    ship_orbit = {
        C: "ganimed", 
        a:  7000000,  // LargeSemiAxis
        e:  0.01,
        n:  [0,0,1], //Normal to orbit plane
        t0: 15*60,   // initial orbital phase
        P:  0,       // Perihelium argument 
        
    }
    
    var ship = {
        type:"ship", 
        ship_type:"rock_flyer", 
        location: {type:"orbit" }
                
    } // ship consists of it type, its name and it's state;
    // but here we're just giving back it's name and location
    
    return [ship];
    
    
}