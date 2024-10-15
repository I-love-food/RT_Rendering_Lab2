FLOAT_SIZE = 4
next_color = null;
next_shape = null;
max_depth = 100000.0;
depth = max_depth
step = 1.0

global_transformation = false;

color_dict = {
    'r': ["red", [1, 0, 0]],
    'g': ["green", [0, 1, 0]],
    'b': ["blue", [0, 0, 1]]
}
shape_dict = {
    'v': "Vertical line",
    't': "Triangle",
    'q': "Square",
    'h': "Horizontal line",
    "p": "Point"
}

canvas = document.querySelector("#c");
gl = canvas.getContext("webgl");
if (!gl) {
    alert("WebGL is not supported.")
}
vertex_shader = create_shader(gl, gl.VERTEX_SHADER, vertex_shader_code);
fragment_shader = create_shader(gl, gl.FRAGMENT_SHADER, fragment_shader_code);
program = create_program(gl, vertex_shader, fragment_shader);
position_loc = gl.getAttribLocation(program, "a_position")
transform_loc = gl.getUniformLocation(program, 'trans_mat');
depth_loc = gl.getUniformLocation(program, 'depth');
color_loc = gl.getUniformLocation(program, 'color');
proj_loc = gl.getUniformLocation(program, 'ortho_proj');


gl.enableVertexAttribArray(position_loc);

/**
 * Intersection check
 * Basic shape vbo, [[transformation1, color, depth], [transformation2, color, depth], ...]
 * 
 */
activate_info = [] // type, count
shapes = ['t', 'q', 'p', 'h', 'v']
datas = [
    [ // triangle
        [-0.1, -0.07],
        [0.1, -0.07],
        [0, 0.13]
    ],
    [ // square
        [0.1, 0.1],
        [-0.1, 0.1],
        [-0.1, -0.1],
        [-0.1, -0.1],
        [0.1, -0.1],
        [0.1, 0.1]
    ],
    [ // point
        [0.01, 0.01],
        [-0.01, 0.01],
        [-0.01, -0.01],
        [-0.01, -0.01],
        [0.01, -0.01],
        [0.01, 0.01]
    ],
    [ // horizontal line
        [0.1, 0.01],
        [-0.1, 0.01],
        [-0.1, -0.01],
        [-0.1, -0.01],
        [0.1, -0.01],
        [0.1, 0.01]
    ],
    [ // vertical line
        [0.01, 0.1],
        [-0.01, 0.1],
        [-0.01, -0.1],
        [-0.01, -0.1],
        [0.01, -0.1],
        [0.01, 0.1]
    ],
]
shape_table = {}
for(let i = 0; i < shapes.length; i ++){
    shape_name = shapes[i]
    shape_data = datas[i].flat(Infinity);
    vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape_data), gl.STATIC_DRAW);
    shape_table[shape_name] = [
        vbo,
        datas[i].length,
        [] // [transformation1, color, depth], [transformation2, color, depth]
    ]
}

var ortho_projection = new Projection2(canvas.width, canvas.height);

gl.useProgram(program); 
gl.clearColor(0, 0, 0, 1);
gl.enable(gl.DEPTH_TEST);
function render (time) { 
    //Draw loop
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    shapes.forEach(shape => {
        gl.bindBuffer(gl.ARRAY_BUFFER, shape_table[shape][0])
        gl.vertexAttribPointer(position_loc, 2, gl.FLOAT, false, 2 * FLOAT_SIZE, 0)
        insts = shape_table[shape][2]
        insts.forEach(inst => {
            let transform = inst[0];
            let color = inst[1];
            let depth = inst[2];
            gl.uniform1f(depth_loc, depth);
            gl.uniform3f(color_loc, color[0], color[1], color[2]);
            gl.uniformMatrix3fv(transform_loc, false, new Float32Array(transform.matrix(true)));
            gl.uniformMatrix3fv(proj_loc, false, new Float32Array(ortho_projection.matrix(true)));
            gl.drawArrays(gl.TRIANGLES, 0, shape_table[shape][1])
        });
    });

    // draw activate highlight frame
    for(let i = 0; i < activate_info.length; i ++){
        let info = activate_info[i];
        let active_inst = shape_table[info[0]][2][info[1]]
        transform_t = active_inst[0].clone();
        transform_t.scale(1.1, 1.1);
        gl.uniform1f(depth_loc, active_inst[2] + 0.5 / max_depth);
        gl.uniform3f(color_loc, 1, 1, 1);
        gl.uniformMatrix3fv(transform_loc, false, new Float32Array(transform_t.matrix(true)));
        gl.uniformMatrix3fv(proj_loc, false, new Float32Array(ortho_projection.matrix(true)));
        gl.bindBuffer(gl.ARRAY_BUFFER, shape_table[info[0]][0])
        gl.vertexAttribPointer(position_loc, 2, gl.FLOAT, false, 2 * FLOAT_SIZE, 0)
        gl.drawArrays(gl.TRIANGLES, 0, shape_table[info[0]][1])
    }
    requestAnimationFrame(render);
}
requestAnimationFrame(render);


////////////////////////////////// event ///////////////////////////////////
const width_text = document.getElementById('width');
const height_text = document.getElementById('height');
const resize_button = document.getElementById('resize');
const next_color_text = document.getElementById('next_color');
const next_shape_text = document.getElementById('next_shape');
const mode_text = document.getElementById('mode');
const trans_text = document.getElementById('trans');

function add_info(info){
    let flag = false;
    for(let i = 0; i < activate_info.length; i ++){
        if(activate_info[i][0] == info[0] && activate_info[i][1] == info[1])
            flag = true;
    }
    if(!flag)
        activate_info.push(info);
}

function to_world(ndc_pos){
    world_pos = matrix_vector_mul3(ortho_projection.inv_matrix(false), [ndc_pos[0], ndc_pos[1], 1])
    return world_pos;
}

function to_ndc(screen_pos){
    ndc_x = (screen_pos[0] - canvas.width / 2.) * 2. / canvas.width;
    ndc_y = -(screen_pos[1] - canvas.height / 2.) * 2. / canvas.height;
    return [ndc_x, ndc_y];
}

function tri_area(x1, y1, x2, y2, x3, y3) {
    return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2);
}

function inside_triangle(pos, x1, y1, x2, y2, x3, y3){
    px = pos[0]
    py = pos[1]
    const A = tri_area(x1, y1, x2, y2, x3, y3);
    const A1 = tri_area(px, py, x2, y2, x3, y3);
    const A2 = tri_area(x1, y1, px, py, x3, y3);
    const A3 = tri_area(x1, y1, x2, y2, px, py);
    return Math.abs(A -(A1 + A2 + A3)) < 1e-4;
}

function intersect(pos, data){
    for(let i = 0; i < data.length; i += 3){
        let [x1, y1] = data[i]
        let [x2, y2] = data[i + 1]
        let [x3, y3] = data[i + 2]
        if(inside_triangle(pos, x1, y1, x2, y2, x3, y3))
            return true;
    }
    return false;
}

function find_intersection(world_pos){
    // traverse the shapes to find intersection
    let depth = Infinity
    hit_record = null;
    for(let i = 0; i < shapes.length; i ++){
        shape_name = shapes[i];
        shape_data = datas[i];
        insts = shape_table[shape_name][2]
        for(let j = 0; j < insts.length; j ++){
            inst = insts[j];
            transform = inst[0]
            model_pos = matrix_vector_mul3(transform.inv_matrix(false), world_pos)
            hit_flag = intersect(model_pos, shape_data);
            if(hit_flag && inst[2] < depth){
                depth = inst[2];
                hit_record = [shape_name, j];
            }
        }
    }
    
    return hit_record;
}

is_selection = false;
is_down = false;
start_y = null;

canvas.addEventListener('mousedown', (e) => {
    is_down = true;
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    start_y = y;
});

canvas.addEventListener('mousemove', (e) => {
    if (!is_down) return;
    if (!is_selection) return;
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    let sign = -y + start_y;

    if(global_transformation){
        shapes.forEach(shape => {
            shape_table[shape][2].forEach(inst => {
                inst[0].rotate_g(sign);
            });
        });
    }else{
        for(let i = 0; i < activate_info.length; i ++){
            let info = activate_info[i];
            let active_inst = shape_table[info[0]][2][info[1]]
            active_inst[0].rotate(sign);
        }
    }
    start_y = y;
});

canvas.addEventListener('mouseup', (event) => {
    is_down = false;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    world_pos = to_world(to_ndc([x, y]));
    if(!is_selection){
        if(next_color == null || next_shape == null){
            alert("Please set color and shape to create new shapes.")
            return;
        }
        depth -= 1.;
        console.log(depth)
        shape_table[next_shape][2].push([new Transform2([world_pos[0], world_pos[1]]), color_dict[next_color][1], depth / max_depth]);
        return;
    }
    if(global_transformation) return;
    hit_record = find_intersection(world_pos);
    if(hit_record != null){
        add_info(hit_record);
        console.log(activate_info)
    }
});

canvas.addEventListener('mouseout', () => {
    is_down = false;
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        activate_info = []
    }
    if(event.key === 'S'){
        console.log("scale up")
        if(global_transformation){
            shapes.forEach(shape => {
                shape_table[shape][2].forEach(inst => {
                    inst[0].scale_g(1.1, 1.1);
                });
            });
        }else{
            activate_info.forEach(info => {
                active_inst = shape_table[info[0]][2][info[1]];
                active_inst[0].scale(1.1, 1.1);
            });
        }
    }
    if(event.key === 's'){
        console.log('scale down')
        if(global_transformation){
            shapes.forEach(shape => {
                shape_table[shape][2].forEach(inst => {
                    inst[0].scale_g(1 / 1.1, 1 / 1.1);
                });
            });
        }else{
            activate_info.forEach(info => {
                active_inst = shape_table[info[0]][2][info[1]];
                active_inst[0].scale(1 / 1.1, 1 / 1.1);
            });
        }
    }
    if(shapes.includes(event.key)){
        next_shape = event.key;
        next_shape_text.innerHTML = shape_dict[next_shape];
    }
    if(['r', 'g', 'b'].includes(event.key)){
        if(is_selection){
            activate_info.forEach(info => {
                active_inst = shape_table[info[0]][2][info[1]];
                active_inst[1] = color_dict[event.key][1];
            });
            return;
        }
        next_color = event.key;
        next_color_text.innerHTML = color_dict[next_color][0];
    }
    if(event.key === 'C'){ // toggle create mode
        is_selection ^= true;
        global_transformation = false
        trans_text.innerHTML = "Local"
        if(!is_selection){
            activate_info = []
            mode_text.innerHTML = "Create";
        }else{
            mode_text.innerHTML = "Select";
        }
    }
    if(event.key === 'W'){
        if(!is_selection) return;
        global_transformation = true;
        trans_text.innerHTML = "Global"
    }
    if(event.key === 'w'){
        if(!is_selection) return;
        global_transformation = false;
        trans_text.innerHTML = "Local"
    }
    if(event.key === 'c'){
        shapes.forEach(shape => {
            shape_table[shape][2] = []
        });
        activate_info = []
    }
});

resize_button.addEventListener('click', () => {
    width = Number(width_text.value);
    height = Number(height_text.value);
    if (width >= 1 && height >= 1) {
        canvas.width = width;
        canvas.height = height;
        ortho_projection.set_width(width);
        ortho_projection.set_height(height);
    }else{
        alert("Please give positive size.")
    }
});