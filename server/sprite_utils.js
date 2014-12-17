



var Mod = {
    
    createExposionObject : function(id, ts, position, size, scene){
        var geom  = new THREE.PlaneGeometry( 1, 1 );
        var TIME_ = 1403660000000;
        var explosion_time = 5000.;
        
        var vshader = [
         'varying vec2 vUv;',
         'uniform vec3 scale;',
         'void main(){',
         '    vUv = uv;',
         '    float rotation = 0.0;',

         '    vec3 alignedPosition = vec3(position.x * scale.x, position.y * scale.y, position.z*scale.z);',
         '    vec2 pos = alignedPosition.xy;',

         '    vec2 rotatedPosition;',
         '    rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;',
         '    rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;',

         '    vec4 finalPosition;',

         '    finalPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );',
         '    finalPosition.xy += rotatedPosition;',
         '    finalPosition = projectionMatrix * finalPosition;',

         '    gl_Position =  finalPosition;',
         '}'
        ].join('\n');
        
        var fshader = [
         'uniform float cur_time;',
         'uniform float beg_time;',
         'uniform float explosion_time;',
         'varying vec2 vUv;',

         'void main(){',

         '    float time_left = cur_time - beg_time;',
         '    float expl_step0 = 0.;',
         '    float expl_step1 = 0.3;',
         '    float expl_max   = 1.;',

         '    float as0 = 0.;',
         '    float as1 = 1.;',
         '    float as2 = 0.;',

         '    float time_perc = clamp( (time_left / explosion_time), 0., 1. ) ;',

         '    float alphap; ',
         '    alphap = mix(as0,as1, smoothstep(expl_step0, expl_step1, time_perc));',
         '    alphap = mix(alphap,as2, smoothstep(expl_step1, expl_max, time_perc));',

         '    vec2 p = vUv;',
         '    vec2 c = vec2(0.5, 0.5);',
         '    float max_g = 1.;',
         '    float dist = length(p - c) * 2. ;',

         '    float step1 = 0.;',
         '    float step2 = 0.2;',
         '    float step3 = 0.3;',
         
         '    float a0 = 1.;',
         '    float a1 = 1.;',
         '    float a2 = 0.7;',
         '    float a3 = 0.0;',
        
         '    vec4 c0 = vec4(1., 1., 1., a0 * alphap);',
         '    vec4 c1 = vec4(0.9, 0.9, 1., a1 * alphap);',
         '    vec4 c2 = vec4(0.7, 0.7, 1., a2 * alphap);',
         '    vec4 c3 = vec4(0., 0., 0., 0.);',
         
         '    vec4 color;',
         '    color = mix(c0, c1, smoothstep(step1, step2, dist));',
         '    color = mix(color, c2, smoothstep(step2, step3, dist));',
         '    color = mix(color, c3, smoothstep(step3, max_g, dist));',

         '    gl_FragColor = color; ',
         '}'
         
         ].join('\n');

        var uniforms = {
					beg_time:   { type: "f", value: ts - TIME_ },
                    cur_time: { type: "f",  value: ts - TIME_ },
                    scale :   {type:"v3", value: new THREE.Vector3(0, 0, 0)},
                    explosion_time:{ type:'f', value: explosion_time }
					//resolution:   { type: "v2", value: new THREE.Vector2() }
				};
        var upd_uniforms = function(){
            var ct = new Date().getTime() - TIME_;
            // console.log("UU", ct)
            uniforms.cur_time.value = ct;
        }
        
        var mat = new THREE.ShaderMaterial( {
					uniforms: uniforms,
					vertexShader: vshader,
					fragmentShader: fshader,
                    transparent: true,
                    blending:THREE.AdditiveBlending

				} );
        
        var mesh = new THREE.Mesh(geom, mat)
        mesh.scale.set(size, size, size);
        uniforms.scale.value = mesh.scale;
        mesh.position.fromArray(position);
        
        var uniformUpdaterName = "exp_" + id + "_" + ts
        var uniformUpdaters = CustomUpdaterGetter();
        
        uniformUpdaters.add( uniformUpdaterName, upd_uniforms);
        var deleter = function(){
            
            uniformUpdaters(uniformUpdaterName);
            scene.remove(mesh)
            
        }
        setTimeout(deleter, explosion_time + 500);
        scene.add(mesh);
        
        return mesh;
        
    },
	makeTextSprite:function( message, parameters ){
		if ( parameters === undefined ) parameters = {};
	
		var fontface = parameters.hasOwnProperty("fontface") ? 
			parameters["fontface"] : "Arial";
	
		var fontsize = parameters.hasOwnProperty("fontsize") ? 
			parameters["fontsize"] : 18;
	
		var borderThickness = parameters.hasOwnProperty("borderThickness") ? 
			parameters["borderThickness"] : 4;
	
		var borderColor = parameters.hasOwnProperty("borderColor") ?
			parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
	
		var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
			parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

		//var spriteAlignment = THREE.SpriteAlignment.topLeft;
		
		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
		context.font = "Bold " + fontsize + "px " + fontface;
    
		// get size data (height depends only on font size)
		var metrics = context.measureText( message );
		var textWidth = metrics.width;
	
		// background color
		context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
									  + backgroundColor.b + "," + backgroundColor.a + ")";
		// border color
		context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
									  + borderColor.b + "," + borderColor.a + ")";

		context.lineWidth = borderThickness;
		this.roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
		// 1.4 is extra height factor for text below baseline: g,j,p,q.
	
		// text color
		context.fillStyle = "rgba(0, 0, 0, 1.0)";

		context.fillText( message, borderThickness, fontsize + borderThickness);
	
		// canvas contents will be used for a texture
		var texture = new THREE.Texture(canvas) 
		texture.needsUpdate = true;

		var spriteMaterial = new THREE.SpriteMaterial( 
			{ map: texture, useScreenCoordinates: false } );
		var sprite = new THREE.Sprite( spriteMaterial );
		sprite.scale.set(20,20,1.0);
		return sprite;	
	},
	roundRect:function(ctx, x, y, w, h, r) 
	{
	    ctx.beginPath();
	    ctx.moveTo(x+r, y);
	    ctx.lineTo(x+w-r, y);
	    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
	    ctx.lineTo(x+w, y+h-r);
	    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
	    ctx.lineTo(x+r, y+h);
	    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
	    ctx.lineTo(x, y+r);
	    ctx.quadraticCurveTo(x, y, x+r, y);
	    ctx.closePath();
	    ctx.fill();
		ctx.stroke();   
	}
}
module.exports=Mod
