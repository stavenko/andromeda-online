window.RendererGetter = (function(){
    "use strict";
    var Renderer = function(){
        var width   = document.body.clientWidth;
        var body = document.body,
            html = document.documentElement;
        var height = Math.max( body.scrollHeight, body.offsetHeight, 
                               html.clientHeight, html.scrollHeight, 
                               html.offsetHeight );

        this.height = height;
        this.width = width;
        console.info('Init renderer', width, height, document.body);
        this.glRenderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
        this.glRenderer.setSize( width, height );
        this.glRenderer.setClearColor(new THREE.Color(0x000000));
        document.body.appendChild(this.glRenderer.domElement);

        this.glRenderer.gammaInput = true;
        this.glRenderer.gammaOutput = true;
        this.glRenderer.autoClear = true ;

        this.glRenderer.physicallyBasedShading = true;
        
                                            


        this.domElement = function(){
            return this.glRenderer.domElement;
        }

        this.render = function ( viewPort ){
            this.glRenderer.setViewport(viewPort.config.l, viewPort.config.t, viewPort.config.w, viewPort.config.h)
            this.renderSkyBox( viewPort );
            this.renderCelestialScene( viewPort );
            this.renderScene( viewPort );
        }

        this.renderSkyBox = function( viewport ){
            var matrixOfPlayer = viewport.camera.parent.matrix.clone();
            var matrixOfCamera = viewport.camera.matrix.clone();
            matrixOfPlayer.multiply(matrixOfCamera);
            var rotationMatrix = new THREE.Matrix4().extractRotation(matrixOfPlayer);
            var q = new THREE.Quaternion().setFromRotationMatrix(rotationMatrix);
            viewport.skyBoxCamera.rotation.setFromQuaternion(q);


            
            // console.warn("Skybox is not rendered yet");
        }
        this.renderCelestialScene = function(){
            // console.warn("Celestial objects is not rendered yet");
        }
        this.renderScene = function(viewport){
            var scene = viewport.view.scene.three_scene;
            var camera = viewport.camera;
            this.glRenderer.render(scene, camera);
        }
         
    }

    var sc = null;
    return function(){
        if(sc == null ){
            sc = new Renderer();
        }
        return sc;
    }

})();
