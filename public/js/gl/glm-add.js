mat4.multiplyVec4 = function(mat, vec, dest) {
        if(!dest) { dest = vec }
        
        var x = vec[0], y = vec[1], z = vec[2], w = vec[3];
        
        dest[0] = mat[0]*x + mat[4]*y + mat[8]*z + mat[12]*w;
        dest[1] = mat[1]*x + mat[5]*y + mat[9]*z + mat[13]*w;
        dest[2] = mat[2]*x + mat[6]*y + mat[10]*z + mat[14]*w;
        dest[3] = mat[3]*x + mat[7]*y + mat[11]*z + mat[15]*w;
        
        return dest;
};

mat4.inverse = function(mat, dest) {
        if(!dest) { dest = mat; }
        
        // Cache the matrix values (makes for huge speed increases!)
        var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
        var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
        var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
        var a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15];
        
        var b00 = a00*a11 - a01*a10;
        var b01 = a00*a12 - a02*a10;
        var b02 = a00*a13 - a03*a10;
        var b03 = a01*a12 - a02*a11;
        var b04 = a01*a13 - a03*a11;
        var b05 = a02*a13 - a03*a12;
        var b06 = a20*a31 - a21*a30;
        var b07 = a20*a32 - a22*a30;
        var b08 = a20*a33 - a23*a30;
        var b09 = a21*a32 - a22*a31;
        var b10 = a21*a33 - a23*a31;
        var b11 = a22*a33 - a23*a32;
        
        // Calculate the determinant (inlined to avoid double-caching)
        var invDet = 1/(b00*b11 - b01*b10 + b02*b09 + b03*b08 - b04*b07 + b05*b06);
        
        dest[0] = (a11*b11 - a12*b10 + a13*b09)*invDet;
        dest[1] = (-a01*b11 + a02*b10 - a03*b09)*invDet;
        dest[2] = (a31*b05 - a32*b04 + a33*b03)*invDet;
        dest[3] = (-a21*b05 + a22*b04 - a23*b03)*invDet;
        dest[4] = (-a10*b11 + a12*b08 - a13*b07)*invDet;
        dest[5] = (a00*b11 - a02*b08 + a03*b07)*invDet;
        dest[6] = (-a30*b05 + a32*b02 - a33*b01)*invDet;
        dest[7] = (a20*b05 - a22*b02 + a23*b01)*invDet;
        dest[8] = (a10*b10 - a11*b08 + a13*b06)*invDet;
        dest[9] = (-a00*b10 + a01*b08 - a03*b06)*invDet;
        dest[10] = (a30*b04 - a31*b02 + a33*b00)*invDet;
        dest[11] = (-a20*b04 + a21*b02 - a23*b00)*invDet;
        dest[12] = (-a10*b09 + a11*b07 - a12*b06)*invDet;
        dest[13] = (a00*b09 - a01*b07 + a02*b06)*invDet;
        dest[14] = (-a30*b03 + a31*b01 - a32*b00)*invDet;
        dest[15] = (a20*b03 - a21*b01 + a22*b00)*invDet;
        
        return dest;
};