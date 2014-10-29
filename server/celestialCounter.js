
var THR = require('three');

function CelectialCounter(){
    this.celesitals = {};

    this.init = function(Celestial){

    }
    this.getCurrent = function(celestial, time){

    }

    this.on = function(celestialGuid, timeout, callback){

    }
    this.tick = function(ts){

    }


    this._calcE = function(e, M, accuracy){
        var Enew=1;
        var Eold=0;
        var Etemp=0;
        var E=0;
        //change the value in the next line for different accuracy
        //of value of E found from M
        while(Math.abs(Enew-Eold) > accuracy){
            Etemp=Enew;
            Enew=M+e*Math.sin(Eold);
            Eold=Etemp;
        }
        E=Enew;
        return E;
    }

    this.trueAnom = function (ec,E,dp) {

        var S=Math.sin(E);

        var C=Math.cos(E);

        var fak=Math.sqrt(1.0-ec*ec);

        var phi=Math.atan2(fak*S,C-ec) //  /K;

        return Math.round(phi*Math.pow(10,dp))/Math.pow(10,dp);

    }
    this._planeCoords = function(celestial, time){

        if(celestial.orbit == undefined){
            console.error("orbit is not defined for", celestial.name);
            return;
        }


        var ph = celestial.orbit.t0 ; // + time of last sightSeeing
        var e = celestial.orbit.e;
        if(e == undefined ){ e = 1.0; }
        var a = celestial.orbit.a;
        var ptime = time + ph;
        var T = celestial.orbit.T ;
        //var M =  -Math.PI/2 + ptime * Math.PI / (T/2) ;
        var M = ptime * Math.PI / (T/2) ;
        //  console.log("M", M);
        var E = this._calcE(e, M, 0.0000001) ;
        var phi = this.trueAnom(e, E, 7) ;
        var R   = a*(1-e*e)/(1+e*Math.cos(phi));
        phi += celestial.orbit.P;
        var pos = new THR.Vector3(R * Math.cos(phi), R* Math.sin(phi), 0);
        return pos;
    }

    this._position = function(celestial, time){
        if(celestial.orbit == undefined){
            console.error("orbit is not defined for", celestial.name);
            return;
        }
        var m = this._getRotationMatrix(celestial.orbit.n);
        var q = new THR.Quaternion();
        q.setFromRotationMatrix(m);
        var pos = this._planeCoords(celestial, time);


        pos.applyQuaternion(q);

        return pos;
    }
    this._getRotationMatrix = function(normal){
        // rotation relative to z axis;
        var n = new THR.Vector3().fromArray(normal);
        n.normalize();
        var Z = new THR.Vector3(0,0,-1);
        var axis = Z.clone().cross(n.clone() ) ;
        axis.normalize();
        var angl = Math.acos(Z.dot(n));
        var m = new THR.Matrix4();

        m.makeRotationAxis(axis, angl);
        return m;
    }

}


module.exports = CelectialCounter;
