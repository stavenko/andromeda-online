var ViewportServiceGetter = (function(){

    var Service = function(){
        this.viewports = {};
        this.renderer = RendererGetter();

        this.readConfig = function(){
            var w34 = this.renderer.width/4 * 3;
            var w4  = this.renderer.width/4;
            var h3  = this.renderer.height/2;

            return [
                {
                    l:0, t:0, 
                    w:this.renderer.width, h:this.renderer.height, 
                    drawUI: true, name:"default"
                },
                {l:w34, t:h3*2, w:w4, h:h3, name:"topleft"},
                {l:w34, t:h3, w:w4, h:h3, name:"centerleft"},
                {l:w34, t:0, w:w4, h:h3, name:"bottomleft"}
            ];
        }
        this.setup = function(){
            var that = this;
            _.each(this.readConfig(), function(config){
                var viewport = new Viewport(config);
                that.viewports[config.name] = viewport;
            });
        }
        this.project = function( mouseState ){
            console.warn("mouse projection over viewports is not implemented");
        }

    
        this.getViewports= function(){
            return this.viewports; 
        }
        this.bindViews = function( viewsCollection ){
            var bindConfig = Settings().getViewportBindings();
            var that = this;
            _.each(bindConfig, function(viewportName, bindString ){
                var vp = that.viewports[viewportName];
                var v  = viewsCollection.getByGlobalName(bindString);
                vp.bind( v );
            })
            // InputServiceGetter().setViewports( this.getViewports());
            InputServiceGetter()
            .setActiveScene( this.viewports["default"].view.scene);


        }
    }

    var sc = null;
    return function(){
        if(sc == null){
            sc = new Service();
        }
        return sc;
    }
   

})()
