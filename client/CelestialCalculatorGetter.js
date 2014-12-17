var CelestialCalculatorGetter = (function(){
var PredefinedOrbitalPlanes = [[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[-0.3090169943749474,0.9510565162951535,0],[-0.24999999999999994,0.9510565162951535,0.1816356320013402],[-0.09549150281252627,0.9510565162951535,0.2938926261462365],[0.09549150281252627,0.9510565162951535,0.2938926261462365],[0.24999999999999992,0.9510565162951535,0.18163563200134025],[0.3090169943749474,0.9510565162951535,3.784366729417715e-17],[0.24999999999999994,0.9510565162951535,-0.18163563200134017],[0.09549150281252632,0.9510565162951535,-0.2938926261462365],[-0.09549150281252623,0.9510565162951535,-0.2938926261462365],[-0.24999999999999992,0.9510565162951535,-0.18163563200134025],[-0.3090169943749474,0.9510565162951535,-7.56873345883543e-17],[-0.5877852522924731,0.8090169943749473,0],[-0.47552825814757677,0.8090169943749473,0.3454915028125263],[-0.1816356320013402,0.8090169943749473,0.5590169943749475],[0.1816356320013402,0.8090169943749473,0.5590169943749475],[0.47552825814757665,0.8090169943749473,0.3454915028125264],[0.5877852522924731,0.8090169943749473,7.198293276126593e-17],[0.47552825814757677,0.8090169943749473,-0.3454915028125262],[0.1816356320013403,0.8090169943749473,-0.5590169943749473],[-0.18163563200134014,0.8090169943749473,-0.5590169943749475],[-0.47552825814757665,0.8090169943749473,-0.3454915028125264],[-0.5877852522924731,0.8090169943749473,-1.4396586552253185e-16],[-0.8090169943749473,0.5877852522924731,0],[-0.6545084971874736,0.5877852522924731,0.47552825814757677],[-0.24999999999999994,0.5877852522924731,0.7694208842938133],[0.24999999999999994,0.5877852522924731,0.7694208842938133],[0.6545084971874735,0.5877852522924731,0.4755282581475768],[0.8090169943749473,0.5877852522924731,9.907600723509855e-17],[0.6545084971874736,0.5877852522924731,-0.47552825814757665],[0.2500000000000001,0.5877852522924731,-0.7694208842938132],[-0.24999999999999986,0.5877852522924731,-0.7694208842938133],[-0.6545084971874735,0.5877852522924731,-0.4755282581475768],[-0.8090169943749473,0.5877852522924731,-1.981520144701971e-16],[-0.9510565162951535,0.3090169943749474,0],[-0.7694208842938133,0.3090169943749474,0.5590169943749475],[-0.2938926261462365,0.3090169943749474,0.9045084971874736],[0.2938926261462365,0.3090169943749474,0.9045084971874736],[0.7694208842938132,0.3090169943749474,0.5590169943749476],[0.9510565162951535,0.3090169943749474,1.1647083181762659e-16],[0.7694208842938133,0.3090169943749474,-0.5590169943749473],[0.2938926261462367,0.3090169943749474,-0.9045084971874735],[-0.2938926261462364,0.3090169943749474,-0.9045084971874736],[-0.7694208842938132,0.3090169943749474,-0.5590169943749476],[-0.9510565162951535,0.3090169943749474,-2.3294166363525317e-16],[-1,0,0],[-0.8090169943749473,0,0.5877852522924731],[-0.3090169943749474,0,0.9510565162951535],[0.3090169943749474,0,0.9510565162951535],[0.8090169943749472,0,0.5877852522924732],[1,0,1.224646798818428e-16],[0.8090169943749473,0,-0.587785252292473],[0.30901699437494756,0,-0.9510565162951534],[-0.3090169943749473,0,-0.9510565162951535],[-0.8090169943749472,0,-0.5877852522924732],[-1,0,-2.449293597636856e-16]]
var G = 6.6738480 * Math.pow(10, −11);

    var CelestialCalculator = function(){
        this.celestials = {};
        this.positions = {};
        
        this.addCelestial = function(celestialDescription, timeOut){
            this.celestials[celestialDescription.GUID] = celestialDescription;
            this.celestials[celestialDescription.GUID].timeout = timeout;
            this.celestialNames[celestialDescription.name] = celestialDescription.GUID;
        }

        this.getRelatedPosition = function( position, celestialName ){
            var celestialPosition = this.getPosition(celestialName);
            return celestialPosition.sub(position);
        }

        this.getPosition = function(celestialName){
            var guid = this.celestialNames[celestialName];
            var position = this._getPosition(guid);
        }

        this._getPosition(guid){
            var n = Date.now();
            var c = this.celestials[guid];
            var t = c.timeout;
            var pos = this.positions[guid];
            if(n - pos.time > t){
                pos = {vector: this._calculate(guid, n),
                       time:n
                };
                this.positions[guid] = pos;
            }
            return this.positions[guid].vector;
           
        }

        this._calculate = function(guid, n){
            var C = this.celestials[guid];
            if(C.orbit){
                var position = this._position(C, n); // Zero-relative;
                var parentPosition = _getPosition(C.C)
                return parentPosition.clone().add(position);
            }else{
                return new THREE.Vector3().fromArray( position ) ;
            }
        }

        this._calcE = function(e, M, accuracy){
            var Enew=1;
            var Eold=0;
            var Etemp=0;
            var E=0;
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
            if(celestial.orbit.is_predefined){
                // we need some additional parameters to calculate orbit params;
                var parentCelectial = this.celestials[celestial.orbit.C];
                var min_height = parentCelectial.R * 0.05; // %5 of planet radius - minimum height of orbit;
                var height_step = parentCelectial.R * 0.01; // height step is 1% of planet R
                var n = PredefinedOrbitalPlanes[celestial.orbit.n];
                var e = 1;
                var a = min_height + celestial.orbit.a * height_step;
                var mu = G * parentCelectial.M;
                var T = 2 * Math.PI * Math.sqrt( a*a*a / mu )
                var P = 0;
                var ph  = celestial.orbit.t0 * T/5;  
            }else{
                var ph = celestial.orbit.t0 ; // + time of last sightSeeing
                var e = celestial.orbit.e;
                if(e == undefined ){ e = 1.0; }
                var a = celestial.orbit.a;
                var T = celestial.orbit.T ;
                var P =celestial.orbit.P;
            }
            var ptime = time + ph;
            var M = ptime * Math.PI / (T/2) ;
            var E = this._calcE(e, M, 0.0000001) ;
            var phi = this.trueAnom(e, E, 7) ;
            var R   = a*(1-e*e)/(1+e*Math.cos(phi));
            phi += P;
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

    var ccc = null;

    return function(){
        if(ccc == null){
            ccc = new CelestialCalculator();
        }
    }



})()
