var ViewCollection = function(){
    this.views={},
    this.viewOrder= [],
    this.identityMap = {},
    this.byGlobalName ={},
    this.add= function(identity, globalName ,view, actor, UI){
        if(!(identity  in this.views)){
            this.views[identity] = view;
            this.viewOrder.push(identity);
        }
        this.byGlobalName[globalName] = view;
        this.views[identity].addActor( actor );
        this.views[identity].addUI( UI );
    },
    this.get= function(id){
        return this.views[id];

    },
    this.getByGlobalName = function(name){
        return this.byGlobalName[name];
    },
    this.getIx =function(ix){
        var n = this.viewOrder[ix];
        return this.get(n);
    }

}
