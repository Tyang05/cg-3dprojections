let view;
let ctx;
let scene;
let start_time;

const LEFT =   32; // binary 100000
const RIGHT =  16; // binary 010000
const BOTTOM = 8;  // binary 001000
const TOP =    4;  // binary 000100
const FAR =    2;  // binary 000010
const NEAR =   1;  // binary 000001
const FLOAT_EPSILON = 0.000001;

// Initialization function - called when web page loads
function init() {
    let w = 800;
    let h = 600;
    view = document.getElementById('view');
    view.width = w;
    view.height = h;

    ctx = view.getContext('2d');

    // initial scene... feel free to change this
    scene = {
        view: {
            type: 'perspective',
            prp: Vector3(44, 20, -16),
            srp: Vector3(20, 20, -40),
            vup: Vector3(0, 1, 0),
            clip: [-19, 5, -10, 8, 12, 100]
        },
        models: [
            {
                type: 'generic',
                vertices: [
                    Vector4( 0,  0, -30, 1), // 0 //doesn't work when you do 90, 0 ,-20,
                    Vector4(20,  0, -30, 1), // 1
                    Vector4(20, 12, -30, 1), // 2
                    Vector4(10, 20, -30, 1), // 3
                    Vector4( 0, 12, -30, 1), // 4
                    Vector4( 0,  0, -60, 1), // 5
                    Vector4(20,  0, -60, 1), // 6
                    Vector4(20, 12, -60, 1), // 7 
                    Vector4(10, 20, -60, 1), // 8
                    Vector4( 0, 12, -60, 1)  // 9
                ],
                edges: [
                    [0, 1, 2, 3, 4, 0], // [0,1] [1,2] [2,3] [3,4] [4,0] // 0
                    [5, 6, 7, 8, 9, 5], // [5,6] [6,7] [7,8] [8,9] [9,5] // 1
                    [0, 5], // 2 
                    [1, 6], // 3
                    [2, 7],
                    [3, 8],
                    [4, 9]
                ],
                matrix: new Matrix(4, 4)
            },  
            {
                "type": 'cube',
                "center": [10, 0, -20], //doesn't work with 10,0,-20 or 10,25-20
                "width": 10,
                "height": 10,
                "depth": 10,
                 "animation": {
                        "axis": "y",
                        "rps": 0.5
                    }
            
            },
            {
                "type": "cone",
                "center": [-30, 10, -30],
                "radius": 10,
                "height": 50,
                "sides": 50,
                "animation": {
                             "axis": "y",
                             "rps": 0.5
                         }
            },
            {
                "type": "cylinder",
                "center": [-30, 25, -10],
                "radius": 5,
                "height": 40,
                "sides": 50,
                "animation": {
                    "axis": "y",
                    "rps": 0.5
                }
            },
            {
                "type": "sphere",
                "center": [-15, 40,-55],
                "radius": 20,
                "slices": 20,
                "stacks": 20,
                "animation": {
                    "axis": "y",
                    "rps": 0.5
                }
            }
        ]
    };

    // event handler for pressing arrow keys
    document.addEventListener('keydown', onKeyDown, false);
    
    // start animation loop
    start_time = performance.now(); // current timestamp in milliseconds
    window.requestAnimationFrame(animate);

}

// Animation loop - repeatedly calls rendering code
function animate(timestamp) {
    // step 1: calculate time (time since start)
    let time = timestamp - start_time;
    
    // step 2: transform models based on time
    // TODO: implement this!

    // step 3: draw scene
    drawScene();

    // step 4: request next animation frame (recursively calling same function)
    // (may want to leave commented out while debugging initially)
     //window.requestAnimationFrame(animate);
}

// Main drawing code - use information contained in variable `scene`
function drawScene() {
    // For each model, for each edge
    
    var nPer = mat4x4Perspective(scene.view.prp, scene.view.srp, scene.view.vup, scene.view.clip);
    

    // The vertices array which contains sets of vertices from each individual models.
    // e.g. vertices[0] = model[0] sets of vertices, vertices[1] = model[1] sets of vertices and so forth
    let vertices = [];
    let counter = 0;
    // For loop iterate and access all the given vertices
    // Use the given vertices and multiply it by matrix(mPer)
    for (let i = 0; i < scene.models.length; i++){
        // These if statements are converting models of specific types into generic models that hold their edges and verticies
        // Functions being called are at the bottom of this file
        if(scene.models[i].type == "cube") {
            scene.models[i] = drawCube(scene.models[i]);
        } else if(scene.models[i].type == "cone") {
            scene.models[i] = drawCone(scene.models[i]);
        } else if(scene.models[i].type == "cylinder") {
            scene.models[i] = drawCylinder(scene.models[i]);
        } else if(scene.models[i].type == "sphere") {
            scene.models[i] = drawSphere(scene.models[i]);
        }
        // The set of vertices for the current model
        let verticesTemp = [];
        // For loop iterate through all the vertices and multiply by nPer
        for (let j = 0; j < scene.models[i].vertices.length; j++) {
            verticesTemp[j] = nPer.mult(scene.models[i].vertices[j]);
        }
        // Add vertices to the verticesTemp
        vertices.push(verticesTemp);
    }

    // Go through all possible edges and take each vertices of the given edges
    // to clip and draw them onto the scene.
    for (let i = 0; i < scene.models.length; i++){
        for (let j = 0; j < scene.models[i].edges.length; j++) {
            for (let k = 0; k < scene.models[i].edges[j].length-1; k++) {
                // Here, I think we are referencing the actual vertices, so just to be safe,
                // this is now a reference to the actual vertices (if that is the case)
                let hold_pt0 = vertices[counter][scene.models[i].edges[j][k]];
                let hold_pt1 = vertices[counter][scene.models[i].edges[j][k + 1]];

                // Create the 2 new points with references to hold_pts data.
                let pt0 = new Vector3(hold_pt0.data[0], hold_pt0.data[1], hold_pt0.data[2]);
                let pt1 = new Vector3(hold_pt1.data[0], hold_pt1.data[1], hold_pt1.data[2]);

                // Create line
                let line = {pt0:pt0, pt1:pt1};

                // Clip the line
                line = clipLinePerspective(line, (-1*scene.view.clip[4]) / scene.view.clip[5]);

                // Set points to be a vector that contain the newly clipped values
                pt0 = Vector4(line.pt0.x, line.pt0.y, line.pt0.z, line.pt0.w);
                pt1 = Vector4(line.pt1.x, line.pt1.y, line.pt1.z, line.pt1.w);

                // Multiply the points by mPer (turn into view scene)
                let mPer = mat4x4MPer();
                pt0 = mPer.mult(pt0);
                pt1 = mPer.mult(pt1);

                // Convert points to to World Coordinate
                let viewToWorld = new Matrix(4,4);
                mat4x4ProjectionToWindow(viewToWorld, view.width, view.height);
                pt0 = viewToWorld.mult(pt0);
                pt1 = viewToWorld.mult(pt1);

                // Define points values to draw
                let x1 = pt0.data[0] / pt0.data[3];
                let y1 = pt0.data[1] / pt0.data[3]
                let x2 = pt1.data[0] / pt1.data[3];
                let y2 = pt1.data[1] / pt1.data[3]

                // Draw the line
                drawLine(x1, y1, x2, y2);
            }
        }
        counter++;
    }

}

// Get outcode for vertex (parallel view volume)
function outcodeParallel(vertex) {
    let outcode = 0;
    if (vertex.x < (-1.0 - FLOAT_EPSILON)) {
        outcode += LEFT;
    }
    else if (vertex.x > (1.0 + FLOAT_EPSILON)) {
        outcode += RIGHT;
    }
    if (vertex.y < (-1.0 - FLOAT_EPSILON)) {
        outcode += BOTTOM;
    }
    else if (vertex.y > (1.0 + FLOAT_EPSILON)) {
        outcode += TOP;
    }
    if (vertex.z < (-1.0 - FLOAT_EPSILON)) {
        outcode += FAR;
    }
    else if (vertex.z > (0.0 + FLOAT_EPSILON)) {
        outcode += NEAR;
    }
    return outcode;
}

// Get outcode for vertex (perspective view volume)
function outcodePerspective(vertex, z_min) {
    let outcode = 0;
    if (vertex.x < (vertex.z - FLOAT_EPSILON)) {
        outcode += LEFT;
    }
    else if (vertex.x > (-vertex.z + FLOAT_EPSILON)) {
        outcode += RIGHT;
    }
    if (vertex.y < (vertex.z - FLOAT_EPSILON)) {
        outcode += BOTTOM;
    }
    else if (vertex.y > (-vertex.z + FLOAT_EPSILON)) {
        outcode += TOP;
    }
    if (vertex.z < (-1.0 - FLOAT_EPSILON)) {
        outcode += FAR;
    }
    else if (vertex.z > (z_min + FLOAT_EPSILON)) {
        outcode += NEAR;
    }
    return outcode;
}

// Clip line - should either return a new line (with two endpoints inside view volume) or null (if line is completely outside view volume)
function clipLineParallel(line) {
    let result = null;
    let p0 = Vector3(line.pt0.x, line.pt0.y, line.pt0.z); 
    let p1 = Vector3(line.pt1.x, line.pt1.y, line.pt1.z);
    let out0 = outcodeParallel(p0);
    let out1 = outcodeParallel(p1);
    
    // TODO: implement clipping here!
    while(true) {
        //Case 1: Trival Accept
        if((out0 | out1) == 0) {
            result = line;
            break;
        }
        // Case 2: Trivial Reject. Return null
        else if((out0 & out1) != 0) {
            return null;
        } else {
            let outcode = null;
            if (out0 != 0) {
                outcode = out0;
            } else {
                outcode = out1;
            }
            //console.log(outcode);

            /* BOUNDS: 
            LEFT: x = -1, RIGHT: x = 1
            BOTTOM: y = -1, TOP: y = 1
            FAR: z = -1, NEAR z = 0
            */
            let x,y,z,t = null;
            let dx = p1.x - p0.x;
            let dy = p1.y - p0.y;
            let dz = p1.z - p0.z;

            if (outcode & LEFT) {
                console.log("Clip Parallel Left");
                x = -1;
                y = p0.y + ((x - p0.x) * dy) / dx;
                z = p0.z + ((x - p0.x) * dz) / dx;
            } else if (outcode & RIGHT) {
                console.log("Clip Parallel Right");
                x = 1;
                y = p0.y + ((x - p0.x) * dy) / dx;
                z = p0.z + ((x - p0.x) * dz) / dx;
            } else if (outcode & BOTTOM) {
                console.log("Clip Parallel Bottom");
                y = -1;
                x = p0.x + ((y - p0.y) * dx) / dy;
                z = p0.z + ((y - p0.y) * dz) / dy;
            } else if (outcode & TOP) {
                console.log("Clip Parallel Top");
                y = 1;
                x = p0.x + ((y - p0.y) * dx) / dy;
                z = p0.z + ((y - p0.y) * dz) / dy;
            } else if (outcode & FAR) {
                console.log("Clip Parallel Far");
                z = -1;
                y = p0.y + ((z - p0.z) * dy) / dz;
                x = p0.x + ((z - p0.z) * dx) / dz;
            } else if (outcode & NEAR) {
                console.log("Clip Parallel Near");
                z = 0;
                y = p0.y + ((z - p0.z) * dy) / dz;
                x = p0.x + ((z - p0.z) * dx) / dz;
            }

            if(outcode == out0) {
                p0.x = x;
                p0.y = y;
                p0.z = z;
                out0 = outcodeParallel(p0);
            }

            // Else, it do the same but for out1
            else {
                p1.x = x;
                p1.y = y;
                p1.z = z;
                out1 = outcodeParallel(p1);
            }

            line.pt0 = p0;
            line.pt1 = p1;
            result = line;
        }
    }
    return result;
}

// Clip line - should either return a new line (with two endpoints inside view volume) or null (if line is completely outside view volume)
function clipLinePerspective(line, z_min) {
    let result = null;
    let p0 = Vector3(line.pt0.x, line.pt0.y, line.pt0.z);
    let p1 = Vector3(line.pt1.x, line.pt1.y, line.pt1.z);
    let out0 = outcodePerspective(p0, z_min);
    let out1 = outcodePerspective(p1, z_min);

    // Keep looping until case is either accept or reject
    while(true) {
        // Case 1: Trivial Accept. Return the line as it is
        if((out0 | out1) == 0) {
            result = line;
            break;
        }
        // Case 2: Trivial Reject. Return null
        else if((out0 & out1) != 0) {
            result = null;
            break;
        } else {
            // BOUNDS: LEFT = z, RIGHT = -z, BOTTOM y = z, TOP = -z, FAR z = 1, NEAR z = z_min
            let outcode = null;
            let x,y,z = null;
            let t = null;

            // At least one of the two outcode is != 0 meaning its vertex is outside the view volume.
            if(out0 != 0) {
                outcode = out0;
            } else {
                outcode = out1;
            }

            // Check via LEFT plane, calculate its new interception points and decrement outcode
            if(outcode & LEFT) {
                t = (-p0.x + p0.z) / ((p1.x - p0.x) - (p1.z - p0.z));

                x = ((1-t) * p0.x) + (t * p1.x);
                y = ((1-t) * p0.y) + (t * p1.y);
                z = ((1-t) * p0.z) + (t * p1.z);
            }
            // Check via RIGHT plane, calculate its new interception points and decrement outcode
            else if(outcode & RIGHT) {
                                    // Flipped points for negative change in slope
                t = (p0.x + p0.z) / ((p0.x - p1.x) - (p0.z - p1.z));

                x = ((1-t) * p0.x) + (t * p1.x);
                y = ((1-t) * p0.y) + (t * p1.y);
                z = ((1-t) * p0.z) + (t * p1.z);
            }
            // Check via BOTTOM plane, calculate its new interception points and decrement outcode
            else if(outcode & BOTTOM) {
                t = (-p0.y + p0.z) / ((p1.y - p0.y) - (p1.z - p0.z));

                x = ((1-t) * p0.x) + (t * p1.x);
                y = ((1-t) * p0.y) + (t * p1.y);
                z = ((1-t) * p0.z) + (t * p1.z);
            }
            // Check via TOP plane, calculate its new interception points and decrement outcode
            else if(outcode & TOP) {
                                    // Flipped points for negative change in slope
                t = (p0.y + p0.z) / ((p0.y - p1.y) - (p0.z - p1.z));

                x = ((1-t) * p0.x) + (t * p1.x);
                y = ((1-t) * p0.y) + (t * p1.y);
                z = ((1-t) * p0.z) + (t * p1.z);
            }
            // Check via FAR plane, calculate its new interception points and decrement outcode
            else if(outcode & FAR) {
                // Flipped points for negative change in slope
                t = (p0.z - z_min) / (p0.z- p1.z);

                x = ((1-t) * p0.x) + (t * p1.x);
                y = ((1-t) * p0.y) + (t * p1.y);
                z = ((1-t) * p0.z) + (t * p1.z);
            }
            // Check via NEAR plane, calculate its new interception points and decrement outcode
            else {
                t = (-p0.z - 1) / (p1.z- p0.z);

                x = ((1-t) * p0.x) + (t * p1.x);
                y = ((1-t) * p0.y) + (t * p1.y);
                z = ((1-t) * p0.z) + (t * p1.z);
            }

            // Check if outcode is out0, if so change out0 to become the new outcode
            // and its p0 to the new (x,y,z)
            if(outcode == out0) {
                p0.x = x;
                p0.y = y;
                p0.z = z;
                out0 = outcodePerspective(p0,z_min);
            }

            // Else, it do the same but for out1
            else {
                p1.x = x;
                p1.y = y;
                p1.z = z;
                out1 = outcodePerspective(p1,z_min);
            }

            line.pt0 = p0;
            line.pt1 = p1;
            result = line;
        }
    }

    return result;
}


// Called when user presses a key on the keyboard down 
function onKeyDown(event) {
    let n = scene.view.prp.subtract(scene.view.srp);
    n.normalize();

    let u = scene.view.vup.cross(n);
    u.normalize();

    let v = n.cross(u);

    switch (event.keyCode) {
        case 37: // LEFT Arrow
            console.log("left");
            break;
        case 39: // RIGHT Arrow
            console.log("right");
            break;
        case 65: // A key
            console.log("A");
            scene.view.prp = scene.view.prp.add(u);
            scene.view.srp = scene.view.srp.add(u);
            break;
        case 68: // D key
            console.log("D");
            scene.view.prp = scene.view.prp.subtract(u);
            scene.view.srp = scene.view.srp.subtract(u);
            break;
        case 83: // S key
            console.log("S");
            scene.view.prp.z -= 2;
            scene.view.srp.z -= 2;
            break;
        case 87: // W key
            console.log("W");
            scene.view.prp.z += 2;
            scene.view.srp.z += 2;
            break;
    }
}

///////////////////////////////////////////////////////////////////////////
// No need to edit functions beyond this point                           //
///////////////////////////////////////////////////////////////////////////

// Called when user selects a new scene JSON file
function loadNewScene() {
    let scene_file = document.getElementById('scene_file');

    console.log(scene_file.files[0]);

    let reader = new FileReader();
    reader.onload = (event) => {
        scene = JSON.parse(event.target.result);
        scene.view.prp = Vector3(scene.view.prp[0], scene.view.prp[1], scene.view.prp[2]);
        scene.view.srp = Vector3(scene.view.srp[0], scene.view.srp[1], scene.view.srp[2]);
        scene.view.vup = Vector3(scene.view.vup[0], scene.view.vup[1], scene.view.vup[2]);

        for (let i = 0; i < scene.models.length; i++) {
            if (scene.models[i].type === 'generic') {
                for (let j = 0; j < scene.models[i].vertices.length; j++) {
                    scene.models[i].vertices[j] = Vector4(scene.models[i].vertices[j][0],
                                                          scene.models[i].vertices[j][1],
                                                          scene.models[i].vertices[j][2],
                                                          1);
                }
            }
            else {
                scene.models[i].center = Vector4(scene.models[i].center[0],
                                                 scene.models[i].center[1],
                                                 scene.models[i].center[2],
                                                 1);
            }
            scene.models[i].matrix = new Matrix(4, 4);
        }
    };
    reader.readAsText(scene_file.files[0], 'UTF-8');
}

// Draw black 2D line with red endpoints 
function drawLine(x1, y1, x2, y2) {
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.fillStyle = '#FF0000';
    ctx.fillRect(x1 - 2, y1 - 2, 4, 4);
    ctx.fillRect(x2 - 2, y2 - 2, 4, 4);
}



//Constant object that gets returned

function generic() {
    return {
    type: "generic",
    vertices: [],
    edges: [],
    matrix: new Matrix(4, 4)
    }
}



function drawCube(modelCube) {
    var cube = generic();
    let center = modelCube.center;
    let height = modelCube.height;
    let width = modelCube.width;
    let depth = modelCube.depth;


    cube.vertices.push(Vector4(center[0]+width/2, center[1],        center[2]+depth/2, 1));
    cube.vertices.push(Vector4(center[0]+width/2, center[1],        center[2]-depth/2, 1));
    cube.vertices.push(Vector4(center[0]-width/2, center[1],        center[2]-depth/2, 1));
    cube.vertices.push(Vector4(center[0]-width/2, center[1],        center[2]+depth/2, 1));
    cube.vertices.push(Vector4(center[0]+width/2, center[1]+height, center[2]+depth/2,  1));
    cube.vertices.push(Vector4(center[0]+width/2, center[1]+height, center[2]-depth/2,  1));
    cube.vertices.push(Vector4(center[0]-width/2, center[1]+height, center[2]-depth/2,  1));
    cube.vertices.push(Vector4(center[0]-width/2, center[1]+height, center[2]+depth/2,  1));

    cube.edges.push([0, 1, 2, 3, 0]);
    cube.edges.push([4, 5, 6, 7, 4]);
    cube.edges.push([0, 4]);
    cube.edges.push([1, 5]);
    cube.edges.push([2, 6]);
    cube.edges.push([3, 7]);
    return cube;
}


function drawCone(modelCone) {

    let circleArray;
    var cone = generic();
    let n = modelCone.sides;
    let center = modelCone.center;
    let radius = modelCone.radius;
    let height = modelCone.height;

    //Top Point
    cone.vertices.push(Vector4(center[0], center[1]+height, center[2], 1));

    for(let i = 0; i<n; i++) {
        // Each computed Cartesian x,y variable  
        let radian = this.degreesToRadians((360 / n) * i);
        // Each computed Cartesian x,y variable  
        let x0 = (center[0] + radius * Math.cos(radian));
        let z0 = (center[2] + radius * Math.sin(radian));

        radian = this.degreesToRadians((360/n)*(i+1));

        let x1 = (center[0] + radius * Math.cos(radian));
        let z1 = (center[2] + radius * Math.sin(radian));

        let p0 = Vector4(x0, center[1], z0, 1);
        let p1 = Vector4(x1, center[1], z1, 1);
        cone.vertices.push(p0);
        if (i == n-1) {
            cone.vertices.push(p1);
        }
    }

    //Connect each point of the circle to the next point 
    //Connect each point to the point on top
    for (let i = 0; i<cone.vertices.length-2; i++) {
        circleArray = [i+1, i+2];
        let coneArray = [0, i + 1];

        cone.edges.push(circleArray);
        cone.edges.push(coneArray);
    }
    //Connect the first to the last point
    circleArray = [0, cone.vertices.length];

    return cone;
}

function degreesToRadians(degrees) {
    return degrees* Math.PI /180;
}

function drawCylinder(modelCylinder) {
    var cylinder = generic();
    cylinder.matrix= new Matrix(4, 4);

    var n = modelCylinder.sides;
    var center = modelCylinder.center;
    var radius = modelCylinder.radius;
    var height = modelCylinder.height;


    for(var i=0; i<n; i++) {
        // Each computed Cartesian x,y variable
        var radian = this.degreesToRadians((360/n)*i);
        // Each computed Cartesian x,y variable
        var x0 = (center[0] + radius * Math.cos(radian));
        var z0 = (center[2] + radius * Math.sin(radian));

        radian = this.degreesToRadians((360/n)*(i+1));


        var p0 = Vector4(x0, center[1]-height/2, z0, 1);
        //var p1 = Vector4(x1, center[1], z1, 1);

        var p1 = Vector4(x0, center[1]+height/2, z0, 1);
        //var p3 = Vector4(x1, center[1]+height, z1, 1);


        cylinder.vertices.push(p0);
        cylinder.vertices.push(p1);
    }

    //Connect each point of the circle to the next point
    //Connect each point to the point on top
    for (var i=0; i<cylinder.vertices.length; i++) {

        var circleArray = [i, (i+2) % cylinder.vertices.length];
        if (i%2 == 0) {
            var linesArray = [i, i+1];
        }

        cylinder.edges.push(circleArray);
        cylinder.edges.push(linesArray);
    }
    //Connect the first to the last point


    return cylinder;
}





function drawSphere(modelSphere) {
    var sphere = generic();
    sphere.edges = [];
    sphere.vertices = [];
    var n = modelSphere.stacks;
    var radius = modelSphere.radius;
    var center = [0,0,0]; //instead of translating it, just calculate then translate
    var degrees = 360/modelSphere.slices;
    var translating = modelSphere.center;

    for(var i=0; i< modelSphere.slices-.5; i++){
        var rotate = new Matrix(4,4);
        mat4x4Identity(rotate);
        mat4x4RotateY(rotate, degreesToRadians(degrees*i));

        for(var j=0; j<n; j+=.5) {
            var radian = degreesToRadians((360/n)*j);
            var x0 = (center[0] + radius * Math.cos(radian));
            var y0 = (center[1] + radius * Math.sin(radian));
            var z0 = (center[2]);
    
            let pt0 = Vector4(x0,y0,z0,1);

            var translate = new Matrix(4,4);
            mat4x4Identity(translate);
            mat4x4Translate(translate, translating[0], translating[1], translating[2], 1);
            
            var mult_array = [];
            mult_array.push(translate);
            mult_array.push(rotate);
            mult_array.push(pt0);


            var final = [];
            final = Matrix.multiply(mult_array).rawArray();
            let pushed = Vector4(final[0], final[1], final[2], final[3]);

            sphere.vertices.push(pushed);

        }     
    }
    for (var i=0; i<sphere.vertices.length-modelSphere.stacks*2 ; i++){
        //left to right
        sphere.edges.push([i, i+modelSphere.stacks*2]);
    }

    for (var i=0; i<sphere.vertices.length; i++){
        if ((i+1)%(modelSphere.stacks*2) != 0 && (i) % (modelSphere.stacks*2) != 19){
            sphere.edges.push([i,i+1]);

        } 
    }
    
    return sphere;
}