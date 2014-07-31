var chai = require("chai");
var db = require("../server/database.js");




describe("When taking database values", function(){
    var users;
    it("must be two users", function(){
        db.getUsers({}, function(u){
            users = u;
            chai.expect(users.length).to.equal(2);
        });
    })
    it("number of ships for first user should be 3", function(){
        var ships = db.getAssets({user_id:users[0].id}, function(ships){
            // console.log(ships);
            chai.expect(ships.length).to.equal(3);
            
        });
    })

    it("number of ships for second user should be 1", function(){
        db.getAssets({user_id:users[1].id}, function(ships){
            
            chai.expect(ships.length).to.equal(1);
            
        });
    })
    
    it("ship should have orbit or far-away coordinates",function(){
        // get first user ship
        chai.should()
        db.getAssets({user_id:users[0].id}, function(ass){
            var ship = ass[0]
            
            ship.should.have.property("location");
            if((ship.location.g.type === 'coords' ) ){
            
                chai.expect(ship.location.g).to.have.property('coordinates');
            
            }
            if( (ship.location.g.type === 'orbit' )){
                chai.expect(ship.location.g).to.have.property('orbit');
            } 
            
        }) 
        
        
    })
    it("owner with id=2 must have one ship", function(){
        db.getAssets({user_id:2}, function(ships){
            
            chai.expect(ships.length).to.equal(1);
        })
    })
    it("owner with id=2 has ship orbiting jupiter", function(){
        db.getAssets({user_id:2}, function(ships){
            chai.expect(ships[0].location.g.orbit.C).to.equal('jupiter');
        })
    })
    
    
})

