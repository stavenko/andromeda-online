
object_proto = {
	init_buffers: function(json,scene){
		
		var gl = scene.gl
		var self = this;
		jQuery.ajax({url: json.model,
					dataType:'json',
					success:function(js){
						var result = loadModel(js)
						
						var vb = gl.createBuffer();
						var ti = gl.createBuffer();
						var qi = gl.createBuffer();
						
						gl.bindBuffer(gl.ARRAY_BUFFER, vb)
						gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(result.vertex_buffer), gl.STATIC_DRAW);
						vb.itemSize = 3 
						vb.numItems = result.vertex_buffer.length/3
						
						gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ti)
						gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(result.tri_faces), gl.STATIC_DRAW);
						ti.itemSize = 1
						ti.numItems = result.tri_faces.length
						
						gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, qi)
						gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(result.quad_faces), gl.STATIC_DRAW);
						qi.itemSize = 1
						qi.numItems = result.quad_faces.length
						
						
						
						self.vertex_buffer = vb;
						self.tri_vertex_buffer = ti;
						self.quad_vertex_buffer = qi;
						
						self.buffers_inited = true;
					}
				})
		
		
	},
	draw: function(matrix){
		var gl = this.scene.gl
		this.scene.setMatrixUniforms(matrix);
		//console.log(this.buffers_inited);
		if(this.buffers_inited){
		
			// console.log(this.vertex_buffers[i])
			if(this.tri_vertex_buffer.numItems > 0){
				//console.log('T')
				gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
				gl.vertexAttribPointer(this.scene.shaderProgram.vertexPositionAttribute, this.vertex_buffer.itemSize, gl.FLOAT, false, 0, 0);
				
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.tri_vertex_buffer);
				
				gl.drawElements(gl.TRIANGLES,  this.tri_vertex_buffer.numItems, gl.UNSIGNED_SHORT, 0);
			}
			if(this.quad_vertex_buffer.numItems > 0){
				// console.log('Q');
				gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
				gl.vertexAttribPointer(this.scene.shaderProgram.vertexPositionAttribute, this.vertex_buffer.itemSize, gl.FLOAT, false, 0, 0);
				
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.quad_vertex_buffer);
				
				gl.drawElements(gl.TRIANGLES,  this.quad_vertex_buffer.numItems, gl.UNSIGNED_SHORT, 0);
			}
			
		}
		
	}
	
}
function GObject(json, scene){
	
	this.pos = json.pos;
	this.scene = scene;
	this.init = function(){
		this.init_buffers(json, scene);
	}
	return this;
	
}
GObject.prototype = object_proto;


function Cur(json, scene){
	this.pos = json.pos
	this.scene = scene;
	
	json.model = "/models/cube.js";
	this.init = function(){
		this.init_buffers(json, scene);
	}
	
	return this;
	
}
Cur.prototype = object_proto
