//   __    __  ____  ____  ____  ____ 
//  /  \  /  \(  __)(  __)(  __)(  __)
// (  O )(  O )) _)  ) _)  ) _)  ) _) 
//  \__\) \__/(__)  (__)  (____)(____)    
//
// QOFFEE!
// An Open Source P5.js-friendly Quantum simulator!

// This work inspired by QC-Paint: https://arxiv.org/pdf/2411.09549v2

function make_quantum(t, q){
  // with a new theta value, we have to reset the circuit
  // so we reset the StateVector to (1,0,0,...)
  // and then rebuild the circuit from scratch with the new theta value...
  // It really doesn't take long for just a few qubits!
  // q.reset_sv(); // don't reset to make it iterative!
  q.add_control(X_gate, 0, 1);
  q.add_control(X_gate, 2, 3);
  q.add(RZ_gate(t), 1);
  q.add(RZ_gate(t), 3);
  q.add_control(X_gate, 0, 1);
  q.add_control(X_gate, 2, 3);
  q.add_control(X_gate, 1, 2);
  q.add(RZ_gate(t), 2);
  q.add_control(X_gate, 1, 2);
  q.add_control(X_gate, 3, 0);
  q.add(RZ_gate(t), 0);
  q.add_control(X_gate, 3, 0);
  for (let i = 0; i < 4; i++){
    q.add(RZ_gate(t), i);
    q.add(RX_gate(t), i);
  }
}

function sort_indices(toSort, n){
  var indices = new Array(n);
  for (var i = 0; i < n; ++i){indices[i] = i;}
  indices.sort(function(a, b){
    let a_z = toSort[a][0];
    let b_z = toSort[b][0];
    let a_abs = math.sqrt((a_z.re ** 2)+(a_z.im ** 2));
    let b_abs = math.sqrt((b_z.re ** 2)+(b_z.im ** 2));
    return a_abs < b_abs ? -1 : a_abs > b_abs ? 1 : 0;
  });
  return indices;
}


let art;
let output;
let N = 16;
let filename_art = "magritte1.jpeg"
// let filename_art = "mona-lisa-resize.jpg"
// let filename_art = "Cavalier.png"

function preload() {
  art = loadImage(filename_art);
  output = loadImage(filename_art);
}

function setup() {
  createCanvas(art.width, art.height);
  noLoop();
  
  q = new QuantumCircuit(4);
  
  let grid_width = art.width / N;
  let grid_height = art.height / N;
  for (let i = 0; i < N; i++){
    make_quantum(i+1, q)
    let id_list = q.get_sv().toArray();
    let s_i = sort_indices(id_list, N);
    for ( let j = 0 ; j < N ; j++){
      output.copy(art, s_i[j] * grid_width, i * grid_height, 
                  grid_width, grid_height, 
                  j * grid_width, i * grid_height, 
                  grid_width, grid_height);
    }
  }
  
  // output.copy(magritte, 0, 0, 100, 100, 200, 200, 100, 100);
  image(output, 0, 0);
  // saveCanvas("art-but-quantum.jpg")
}

function draw() {
  
}