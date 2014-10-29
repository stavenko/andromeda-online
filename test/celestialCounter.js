var chai = require("chai");
var CelestialCounter = require("../server/celestialCounter.js");
var DB = require("../server/database.js");

var CGUIDS = ["64946f5b-0bd6-45a8-8b69-3685d0a20091", '64946f5b-0bd6-45a8-8b69-3685d0a20092'];
describe("THREE LIB", function() {
    var users;
    it("Not undefined", function () {
        chai.expect(CelestialCounter).to.not.be.undefined;

    })
    it("instantiates", function(){
        var c = new CelestialCounter();
        chai.expect(c).to.have.property("_position");
    })
    it("can count planet coords", function(){

        CGUIDS.forEach(function(i){

            DB.getCelestials({"GUID":i}, function(C){
                var c = new CelestialCounter();
                var pos = c._position(C, 0);
                chai.expect(pos).to.not.be.undefined;

            });
        })


    })

    it("full period is the same as the 0", function(){
        CGUIDS.forEach(function(i) {
            DB.getCelestials({"GUID": i}, function (C) {
                chai.expect(C).to.have.property('orbit');

                var c = new CelestialCounter();

                var pos = c._position(C, 0);
                var pos1 = c._position(C, C.orbit.T);
                chai.expect(pos).to.be.deep.equal(pos1);

            });
        })

    })


    it("half period minus period coords /2 == large semiaxis", function(){
        CGUIDS.forEach(function(i) {
            DB.getCelestials({"GUID": i}, function (C) {

                chai.expect(C).to.have.property('orbit');
                var c = new CelestialCounter();

                var pos = c._position(C, 0);

                var pos1 = c._position(C, C.orbit.T / 2);

                var d = pos.clone().sub(pos1);
                var half = d.length() / 2;
                var diff = Math.abs(half - C.orbit.a);
                var diff_p =  (diff / C.orbit.a) * 100;



                chai.expect(diff_p).to.be.below(0.01);

            });
        });

    })





})