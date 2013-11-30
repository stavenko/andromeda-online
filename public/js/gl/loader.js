function loadModel(json){
	var vertices = json.vertices
	var quads = [];
	var tris = [];
	console.log("WTF",json)
	var stream_points = json.faces.length;
	var pos = 0
	var tris = [];
	var quads= [], quad_count=0, tri_count=0;
	var faces = 0;
	function isSet(i, pos){
		return i & (1 << pos);
	}
	while (pos < stream_points){
		var type = json.faces[pos];
		isQuad = isSet(type, 0); // Квадрат или треугольник
		hasMat = isSet(type, 1); // имеет индекс материала
		hasFUV = isSet(type, 2); // текстурные координаты 
		hasFVUV= isSet(type, 3)
		hasFN  = isSet(type, 4); // Нормаль полщадки
		hasFVN = isSet(type, 5); // нормали вершин
		hasFC  = isSet(type, 6); // цвет площадки
		hasFVC = isSet(type, 7); // цвет вершин
		pos++;
		
		if (isQuad){
			quads.push( json.faces[pos]  )
			quads.push( json.faces[pos+1])
			quads.push( json.faces[pos+3])
			
			quads.push( json.faces[pos+1])
			quads.push( json.faces[pos+2])
			quads.push( json.faces[pos+3])
			
			faces += 2;
			pos += 4
			
			if(hasFVUV) pos+=4
			if(hasFVN) pos+=4
			if(hasFVC) pos+=4
			quad_count += 1
			
			
		}else{
			tris.push( json.faces[pos]   )
			tris.push( json.faces[pos+1] )
			tris.push( json.faces[pos+2] )
			
			faces += 1
			pos += 3
			
			if(hasFVUV) pos+=3
			if(hasFVN) pos+=3
			if(hasFVC) pos+=3
			tri_count +=1
			
		}
		if(hasMat) pos+=1
		if(hasFUV) pos+=1
		if(hasFN)  pos+=1
		if(hasFC)  pos+=1
		
		
				  
	}
	return {vertex_buffer:vertices, tri_faces:tris, quad_faces:quads, total_face : faces, quads:quad_count, tris: tri_count}
}