var InputServiceGetter = (function(){
    var InputService = function( ){
        var mouseState = {x:0, y:0};
        this.mouseState = mouseState;
        var that = this;
        document.addEventListener( 'mousemove', function(e){
            mouseState.x = e.x;
            mouseState.y = e.y;
        }, false );
        RendererGetter().domElement().addEventListener('mouseup', function(e){
            that.input( 'lmouse', false)
            
        });
        RendererGetter().domElement().addEventListener('mousedown', function(e){
            that.input( 'lmouse', true)
        });
        document.addEventListener('keydown', function(e){
            var code = e.keyCode;
            that.input( code, true)
        }, false);
        document.addEventListener('keyup', function(e){
            var code = e.keyCode;
            that.input(code, false)
        }, false);
        this.keyCodes = {};
        this.keyMap = null;
        this.setKeyMap = function(keyMap){
            this.keyMap = keyMap;
        }
        this.viewportService = ViewportServiceGetter()

        this.getMouseProjectionArray = function(){
            return this.viewportService.project(this.mouseState);
        }
        this.viewports = null;
        this.setActiveScene = function(scene){
            this.scene = scene;

        }
        this.input = function(keycode, up_or_down){
            var ts = new Date().getTime();
            if(up_or_down) {// down == true
                this.keyCodes[keycode] = {in_action:true, ts:ts};
            }else{
                if(this.keyCodes[keycode]){
                    var t = this.keyCodes[keycode].ts;
                    this.keyCodes[keycode].in_action = false;
                    this.keyCodes[keycode].ts = ts;
                    this.keyCodes[keycode].delta = ts - t;
                }
            }
        }
        var syncronizer = SynchronizerGetter();
        this.getLatestActions = function( sceneGuid, now ){
            if( this.scene.sceneGuid != sceneGuid){
                console.info("wrong scene for input");
                return [] ;
            }
            if(this.keyMap == null){ 
                console.warn("no keymap");
                return; 
            }
            var actions = [];
            var that = this;
            _.each(this.keyCodes, function(k_action, keycode){
                if(k_action.in_action){
                    var delta = now - k_action.ts;
                    var ts = now;
                    k_action.ts = now;
                }else{
                    var delta = k_action.delta;
                    var ts = k_action.ts;
                    delete this.keyCodes[keycode];
                }
                var action = _.clone(self.actions[keycode]);
                if(keycode in that.keyMap){
                    var act_desc  = that.keyMap[keycode];
                    var new_action = {
                        mesh : act_desc.mesh,
                        dev : act_desc.device,
                        name: act_desc.name,
                        ts :ts,
                        ident: ts + synchronizer.getCurrentTimeDiff() + synchronizer.getAverageLatencity(),
                        delta: delta/1000,
                        wmouse: that.getMouseProjectionArray()
                    }
                    actions.push(new_action);
                }
            });
            return actions;
        }
    };
    var InputServiceCache = null;
    var getter = function(){
        if(InputServiceCache == null){
            InputServiceCache = new InputService();
        }
        return InputServiceCache;
    }
    return getter;
})();
