window.KeyStateManager = function( keyMap, synchronizer ){

    if(keyMap == undefined){
        console.error(" Keymap not given");
        return;
    }
    if(syncronizer == undefined){
        console.error("Syncing is not set up");
        return;
    }

    var mouseState = {x:0, y:0};

    this.mouseState = mouseState;

    var that = this;

    document.addEventListener( 'mousemove', function(e){
        mouseState.x = e.x;
        mouseState.y = e.y;
    }, false );




    this.renderer.domElement.addEventListener('mouseup', function(e){

        that.input( 'lmouse', false)
    });

    this.renderer.domElement.addEventListener('mousedown', function(e){

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
    this.input = function(keycode, up_or_down){
        var ts = new Date().getTime();


        if(up_or_down) {// down == true
            this.keyCodes[keycode] = {in_action:true, ts:ts};
        }else{
            if(this.keyCodes[keycode]){
                // Пользователь мог нажать кнопку мыши в одном месте - а отпустить над другим.
                var t = this.keyCodes[keycode].ts;
                this.keyCodes[keycode].in_action = false;
                this.keyCodes[keycode].ts = ts;
                this.keyCodes[keycode].delta = ts - t;
            }
        }
    }
    this.getLatestActions = function( now ){

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

            if(keycode in keyMap){
                var act_desc  = keyMap[keycode];
                var new_action = {
                    mesh : act_desc.mesh,
                    dev : act_desc.device,
                    name: act_desc.name,
                    ts :ts,
                    ident: ts + synchronizer._time_diff + synchronizer.avg_latencity,
                    delta: delta/1000,
                    wmouse: that.getMouseProjectionArray()
                }
                actions.push(new_action);
            }
        });
        return actions;
    }
};