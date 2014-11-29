window.Viewport = function( config ){

    this.config = config;


    this.doDrawUI = function(){
        return this.config.drawUI;

    };

    this.bind = function( view ){
        this.view = view;

    }
}