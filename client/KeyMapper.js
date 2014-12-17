var KeyMapper = function( viewPorts){
    this.viewPorts = viewPorts
    _.each(this.viewPorts, function(vp){
        if(vp.doDrawUI()){
            vp.view.actors
        }
    })

    

}
