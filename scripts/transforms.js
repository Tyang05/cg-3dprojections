// create a 4x4 matrix to the parallel projection / view matrix
function mat4x4Parallel(prp, srp, vup, clip) {
    // 1. translate PRP to origin
    let negPRP = new Vector3(-prp.x, -prp.y, -prp.z);
    //console.log(negPRP);

    let translate = new Matrix(4, 4);
    mat4x4Identity(translate);
    // This line is equivalent to T(-prp);
    mat4x4Translate(translate, negPRP.x, negPRP.y, negPRP.z);
    
    // 2. rotate VRC such that (u,v,n) align with (x,y,z)
    let n = prp.subtract(srp);
    n.normalize();

    let u = vup.cross(n);
    u.normalize();

    let v = n.cross(u);

    let rotate = new Matrix(4, 4);
    mat4x4Identity(rotate);
    mat4x4PerspectiveRotate(rotate, u, v, n);
    //console.log("rotate: " + rotate);

    // 3. shear such that CW is on the z-axis
    let left = clip[0];
    let right = clip[1];
    let bottom = clip[2];
    let top = clip[3];
    let near = clip[4];
    let far = clip[5];

    let CW = new Vector3((left + right) / 2, (bottom + top) / 2, -near);
    let DOP = CW.subtract(Vector3(0,0,0));
    //console.log(CW);
    //console.log(DOP);

    let shx = -DOP.x / DOP.z;
    let shy = -DOP.y / DOP.z;

    let shear = new Matrix(4, 4);
    mat4x4Identity(shear);
    mat4x4ShearXY(shear, shx, shy);

    // 4. translate near clipping plane to origin
    let tpar = new Matrix(4, 4);
    mat4x4Identity(tpar);
    mat4x4Translate(tpar, 0, 0, near);

    // 5. scale such that view volume bounds are ([-1,1], [-1,1], [-1,0])
    let Sper = new Vector3(2/(right-left), 2/(top-bottom), 1/(far));
    let scale = new Matrix(4, 4);
    mat4x4Identity(scale);
    mat4x4Scale(scale, Sper.x, Sper.y, Sper.z);

    // Multiply the array of matrices and solve for nPer
    let transform = Matrix.multiply([scale, tpar, shear, rotate, translate]);
    //console.log(transform);
    return transform;
}

// create a 4x4 matrix to the perspective projection / view matrix
function mat4x4Perspective(prp, srp, vup, clip) {
    // 1. translate PRP to origin
    let negPRP = new Vector3(-prp.x, -prp.y, -prp.z);

    let translate = new Matrix(4, 4);
    mat4x4Identity(translate);
    // This line is equivalent to T(-prp);
    mat4x4Translate(translate, negPRP.x, negPRP.y, negPRP.z);

    // 2. rotate VRC such that (u,v,n) align with (x,y,z)
    let n = prp.subtract(srp);
    n.normalize();

    let u = vup.cross(n);
    u.normalize();

    let v = n.cross(u);

    let rotate = new Matrix(4, 4);
    mat4x4Identity(rotate);
    mat4x4PerspectiveRotate(rotate, u, v, n);

    // 3. shear such that CW is on the z-axis
    let left = clip[0];
    let right = clip[1];
    let bottom = clip[2];
    let top = clip[3];
    let near = clip[4];
    let far = clip[5];

    let CW = new Vector3(((left + right) / 2), ((bottom + top) / 2), -near);
    let DOP = CW;

    let shx = (-DOP.x/DOP.z);
    let shy = (-DOP.y/DOP.z);

    let shear = new Matrix(4, 4);
    mat4x4Identity(shear);
    mat4x4ShearXY(shear, shx, shy);

    // 4. scale such that view volume bounds are ([z,-z], [z,-z], [-1,zmin])
    let Sper = new Vector3((2 * near) / ((right - left) * far), (2 * near) / ((top - bottom) * far), (1/far));
    let scale = new Matrix(4, 4);
    mat4x4Identity(scale);
    mat4x4Scale(scale, Sper.x, Sper.y, Sper.z);

    // Create an array of Matrices
    let matrices = new Array();
    matrices.push(scale);
    matrices.push(shear);
    matrices.push(rotate);
    matrices.push(translate);

    // Multiply the array of matrices and solve for nPer
    let transform = Matrix.multiply(matrices);
    return transform;
}

// create a 4x4 matrix to project a parallel image on the z=0 plane
function mat4x4MPar() {
    let mpar = new Matrix(4, 4);
    // mpar.values = ...;
    mpar.values = [1, 0, 0, 0,
                   0, 1, 0, 0,
                   0, 0, 0, 0,
                   0, 0, 0, 1]
    return mpar;
}

// create a 4x4 matrix to project a perspective image on the z=-1 plane
function mat4x4MPer() {
    // mper.values = ...;
    let mper = new Matrix(4, 4);
    mper.values = [1, 0,  0, 0,
                   0, 1,  0, 0,
                   0, 0,  1, 0,
                   0, 0, -1, 0];
    return mper;
}

function please_animate(vertex, degrees, nMatrix, center) {
    
    //translate to center
    var translate_center = new Matrix(4,4);
    mat4x4Identity(translate_center);
    mat4x4Translate(translate_center, -center.x, -center.y, -center.z);
    
    // rotate theta degrees (calculated based on time)
    var rotate_y = new Matrix(4,4);
    mat4x4Identity(rotate_y);
    mat4x4RotateY(rotate_y, degreesToRadians(degrees));
            
    // translate back to where it should be
    var translate_back = new Matrix(4,4);
    mat4x4Identity(translate_back);
    mat4x4Translate(translate_back, center.x, center.y, center.z);
            
    // get final animation matrix
    var mult_array = [];
    mult_array.push(translate_back);
    mult_array.push(rotate_y);
    mult_array.push(translate_center);
    
    var rotate_matrix = Matrix.multiply(mult_array);
    

    //multiply the rotation matrix, nMatrix and current vertex togther for where it should be
    let final_array = [];
    final_array.push(nMatrix);
    final_array.push(rotate_matrix);
    final_array.push(vertex);
    var animation = Matrix.multiply(final_array);
    

    return animation;
}

///////////////////////////////////////////////////////////////////////////////////
// 4x4 Transform Matrices                                                         //
///////////////////////////////////////////////////////////////////////////////////

// set value of an existing 4x4 matrix to convert to world coordinate.
function mat4x4ProjectionToWindow(mat4x4, w, h) {
    mat4x4.values = [[w/2,   0, 0, w/2],
                     [0,   h/2, 0, h/2],
                     [0,     0, 1,   0],
                     [0,     0, 0,   1]];
}

// set values of existing 4x4 matrix to align (u,v,n) to (x,y,z)
function mat4x4PerspectiveRotate(mat4x4, u, v, n) {
    mat4x4.values = [[u.x, u.y, u.z, 0],
                     [v.x, v.y, v.z, 0],
                     [n.x, n.y, n.z, 0],
                     [0,     0,   0, 1]];
}

// set values of existing 4x4 matrix to the identity matrix
function mat4x4Identity(mat4x4) {
    mat4x4.values = [[1, 0, 0, 0],
                     [0, 1, 0, 0],
                     [0, 0, 1, 0],
                     [0, 0, 0, 1]];
}

// set values of existing 4x4 matrix to the translate matrix
function mat4x4Translate(mat4x4, tx, ty, tz) {
    // mat4x4.values = ...;
    mat4x4.values = [[1, 0, 0, tx],
                     [0, 1, 0, ty],
                     [0, 0, 1, tz],
                     [0, 0, 0, 1]];
}

// set values of existing 4x4 matrix to the scale matrix
function mat4x4Scale(mat4x4, sx, sy, sz) {
    // mat4x4.values = ...;
    mat4x4.values = [[sx, 0,  0, 0],
                     [0, sy,  0, 0],
                     [0,  0, sz, 0],
                     [0,  0,  0, 1]];
}

function mat4x4RotateV(mat4x4, v, theta) {
    let row0col0 = Math.cos(theta) + Math.pow(v.x, 2) * (1 - Math.cos(theta));
    let row0col1 = v.x * v.y * (1 - Math.cos(theta)) - v.z * Math.sin(theta);
    let row0col2 = v.x * v.z * (1 - Math.cos(theta)) + v.y * Math.sin(theta);

    let row1col0 = v.y * v.x * (1 - Math.cos(theta)) + v.z * Math.sin(theta);
    let row1col1 = Math.cos(theta) + Math.pow(v.y, 2) * (1 - Math.cos(theta));
    let row1col2 = v.y * v.z * (1 - Math.cos(theta)) - v.x * Math.sin(theta);

    let row2col0 = v.z * v.x * (1 - Math.cos(theta)) - v.y * Math.sin(theta);
    let row2col1 = v.z * v.y * (1 - Math.cos(theta)) + v.x * Math.sin(theta);
    let row2col2 = Math.cos(theta) + Math.pow(v.z, 2) * (1 - Math.cos(theta));

    mat4x4.values = [[row0col0, row0col1, row0col2, 0],
                    [row1col0, row1col1, row1col2,  0],
                    [row2col0, row2col1, row2col2,  0],
                    [0,     0,        0,            1]];
}

// set values of existing 4x4 matrix to the rotate about x-axis matrix
function mat4x4RotateX(mat4x4, theta) {
    // mat4x4.values = ...;
    mat4x4.values = [[1,               0,                  0, 0],
                     [0, Math.cos(theta), -(Math.sin(theta)), 0],
                     [0, Math.sin(theta),    Math.cos(theta), 0],
                     [0,               0,                  0, 1]];
}

// set values of existing 4x4 matrix to the rotate about y-axis matrix
function mat4x4RotateY(mat4x4, theta) {
    // mat4x4.values = ...;
    mat4x4.values = [[Math.cos(theta),    0, Math.sin(theta), 0],
                     [0,                  1,               0, 0],
                     [-(Math.sin(theta)), 0, Math.cos(theta), 0],
                     [0,                  0,               0, 1]];
}

// set values of existing 4x4 matrix to the rotate about z-axis matrix
function mat4x4RotateZ(mat4x4, theta) {
    // mat4x4.values = ...;
    mat4x4.values = [[Math.cos(theta), -(Math.sin(theta)), 0, 0],
                     [Math.sin(theta),    Math.cos(theta), 0, 0],
                     [0,                                0, 1, 0],
                     [0,                                0, 0, 1]];
}

// set values of existing 4x4 matrix to the shear parallel to the xy-plane matrix
function mat4x4ShearXY(mat4x4, shx, shy) {
    // mat4x4.values = ...;
    mat4x4.values = [[1, 0, shx, 0],
                     [0, 1, shy, 0],
                     [0, 0,   1, 0],
                     [0, 0,   0, 1]];
}

// create a new 3-component vector with values x,y,z
function Vector3(x, y, z) {
    let vec3 = new Vector(3);
    vec3.values = [x, y, z];
    return vec3;
}

// create a new 4-component vector with values x,y,z,w
function Vector4(x, y, z, w) {
    let vec4 = new Vector(4);
    vec4.values = [x, y, z, w];
    return vec4;
}
