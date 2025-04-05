//   __    __  ____  ____  ____  ____ 
//  /  \  /  \(  __)(  __)(  __)(  __)  ((
// (  O )(  O )) _)  ) _)  ) _)  ) _)   ))
//  \__\) \__/(__)  (__)  (____)(____)  ☕️
//
// An Open Source P5.js-friendly Quantum simulator!

// NB - this library REQUIRES that you have math.js included as well..
// you need to make sure that this code is BEFORE this library in your HTML file: 
// <script src="https://unpkg.com/mathjs@14.1.0/lib/browser/math.js"></script>

let zero_qubit = math.matrixFromRows([1],[0]);
let one_qubit  = math.matrixFromRows([0],[1]);
let c0 = math.complex(0,0);
let c1 = math.complex(1,0);
let cm1 = math.complex(-1,0);
















// GATES

let I_gate = math.identity(2,2);
let X_gate = math.matrixFromRows([c0,c1],[c1,c0]);
let Z_gate = math.matrixFromRows([c1,c0],[c0,cm1]);
let H_gate = math.matrixFromRows([math.SQRT1_2,math.SQRT1_2],
                                 [math.SQRT1_2,-math.SQRT1_2]);
let S_gate    = math.matrixFromRows([c1,c0], [c0,math.i]);
let Sdag_gate = math.matrixFromRows([c1,c0], [c0, math.multiply(-1,math.i)]);
let T_gate    = math.matrixFromRows([c1,c0],
                                    [c0,math.exp((math.i * math.PI)/4)]);
let Tdag_gate = math.matrixFromRows([c1,c0],
                                    [c0,math.exp((-math.i * math.PI)/4)]);
let V_gate = math.matrixFromRows([math.complex(1,1), math.complex(1,-1)],
                                 [math.complex(1,-1), math.complex(1,1)]);

















function RX_gate(theta){
  let c = math.cos(theta / 2);
  let s = math.multiply(cm1,math.multiply(math.i,math.sin(theta / 2)));
  let mat = math.matrixFromRows([c,s],[s,c]);
  return mat;
}

function RY_gate(theta){
  return math.matrixFromRows(
    [math.cos(theta / 2), math.multiply(cm1,math.sin(theta / 2))],
    [math.sin(theta / 2), math.cos(theta / 2)]);
}

function RZ_gate(theta){
  let x = math.multiply(cm1, math.multiply(math.i, theta))
  let eee = math.exp(math.divide(x,2));
  return math.matrixFromRows([eee, c0], [c0, eee]);
}














// OuterProduct matrices for |0><0| and |1><1| 
//  - these are used in calculating controlled qubits
let OP_0 = math.dotMultiply(zero_qubit,math.transpose(zero_qubit));
let OP_1 = math.dotMultiply(one_qubit, math.transpose(one_qubit));

// Quantum circuit class!
// This has a few nice functions:
// * get_sv - returns the current statevector
// * reset_sv - resets the statevector/circuit
// * add - updates the current statevector with 
//         a new gate on a given qubit
// * add_control - adds a controlled gate with set 
//                 control/gate qubits, and updates 
//                 the statevector
// * measure - generates an array with randomly sampled 
//             values from the circuit
// * measure_strings - generates an array of randomly 
//                     sampled values, converted to the 
//                     correct length binary strings.

class QuantumCircuit {
  constructor(num_qubits){
    this.num_qubits = num_qubits;
    this.sv_size = 2 ** num_qubits;
    this.stateVector = math.transpose(math.identity(1,this.sv_size));
    this.measurement_dist = new Array(100).fill(0);
  }
  
  get_sv(){
    return this.stateVector;
  }
  



















  add(gate, qubit_number){
  // add a gate to the circuit! 
  // NB - we don't just add a gate... we also re-calcaulate
  // the statevector so we don't have to do it later. 😅
    var t;
    (qubit_number == 0) ? t = gate : t = I_gate;
    for(let i = 1; i < this.num_qubits; i++){
      if (i == qubit_number){
        t = math.kron(t, gate);
      } else {
        t = math.kron(t, I_gate);
      }
    }
    this.stateVector = math.multiply(t, this.stateVector);
    this.update_mdist();
  }
  














  add_control(gate, ctrl_qubit, gate_qubit){
    // This is how we can add arbitrary control gates to our circuit.
    // Each control gate has two parts - '0' and '1', which
    // we reference as |0><0| and |1><1| inner products. 
    // So for gate U; CTRL-U = |0><0| I + |1><1| U
    // where 'I' is just identity. 
    //
    // In the code below;
    // t1 is the 'what if ctrl is 0?' matrix
    // t2 is the 'what if ctrl is 1?' matrix
    var t1; var t2;
    if (ctrl_qubit == 0){
      t1 = OP_0;
      t2 = OP_1;
    } else if (gate_qubit == 0) {
      t1 = I_gate;
      t2 = gate;
    } else {
      t1 = I_gate;
      t2 = I_gate;
    }
    for (let i = 1; i < this.num_qubits; i++){
      if (i == gate_qubit){
        t1 = math.kron(t1, I_gate);
        t2 = math.kron(t2, gate);
      } else if (i == ctrl_qubit){
        t1 = math.kron(t1, OP_0);
        t2 = math.kron(t2, OP_1);
      } else {
        t1 = math.kron(t1, I_gate);
        t2 = math.kron(t2, I_gate);
      }
    }
    let t3 = math.add(t1,t2);
    this.stateVector = math.multiply(t3, this.stateVector);
    this.update_mdist();
  }
  










  reset_sv(){
    // the statevector is global for each circuit, and can be
    // reset to |0..> with this
    this.stateVector = math.transpose(math.identity(1,this.sv_size));
  }
  
  get_mdist(){
    // return the measurement distribution
    return this.measurement_dist;
  }
  















  update_mdist(){
    // updates the measurement distribution from the
    // statevector. Randomly sampling this distribution
    // is equivalent to measuring our statevector.
    let nrm = math.map(this.stateVector, math.norm);
    let norm_sq = math.map(nrm, math.square);
    let pos_index = 0;
    for (let i = 0; i < this.sv_size; i++){
      let v = norm_sq._data[i] * 100;
      for (let j = 0; j < v; j++){
        this.measurement_dist[pos_index] = i;
        pos_index++;
      }
    }
  }
  










  measure(num_measurements = 1){
    // randomly sample the distribution defined above.
    // output is as a number.
    let output_arr = [];
    for (let i = 0; i < num_measurements; i++){
      let r = math.randomInt(0,100);
      output_arr.push(this.measurement_dist[r]);
    }
    return output_arr;
  }
  















  measure_strings(num_measurements = 1){
    // Same as measure()... except it will
    // output the measurement as a binary string!
    let output_arr = [];
    for (let i = 0; i < num_measurements; i++){
      let r = math.randomInt(0,100);
      let rv = this.measurement_dist[r];
      output_arr.push(rv.toString(2).padStart(this.num_qubits, '0'));
    }
    return output_arr;
  }
  













  get_byte(){
    // make a byte of random data from our circuit.
    // achieved by repeating measure() and shifting.
    if (this.num_qubits >= 8){
      return this.measure() & 0xFF;
    }
    var output = 0;
    var nq_log2 = math.floor(math.log2(this.num_qubits));
    var num_runs = 5 - nq_log2;
    if (num_runs == 5) {num_runs = 8;}
    for (let i = 0; i < num_runs; i++){
      var t = this.measure();
      t <<= (this.num_qubits * i);
      output += t;
    }
    return output & 0xFF;
  }
}