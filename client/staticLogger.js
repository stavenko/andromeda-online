(function (){
    var StaticLogger = function(){
        this._vals = {}
        this.setValue = function(param, val){
            // console.log(param, val);
            this._vals[param] = val;
        }
        this.init = function(){
            this.cont = $("<div>").css({
                'position':'fixed',
                'top':0,
                'right':0,
                'width':400,
                'bottom':0,
                'background-color':"rgba(0,200,100,0.7)"
            }).appendTo('body');
            // 	console.log(this.cont);

        }
        this.redraw = function(){
            this.cont.find('*').remove();
            //console.log(this._vals);
            for(var i in this._vals){
                //console.log('asda');
                c = $('<div>').appendTo(this.cont)
                l = $('<span>').html(i + "&nbsp;: &nbsp;").css('font-weight','bold').appendTo(c);
                v = $('<span>').text( this._vals[i] ).appendTo(c);
            }
        };
    }
    window.SL = new StaticLogger();

})();

