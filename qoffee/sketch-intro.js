//   __    __  ____  ____  ____  ____ 
//  /  \  /  \(  __)(  __)(  __)(  __)
// (  O )(  O )) _)  ) _)  ) _)  ) _) 
//  \__\) \__/(__)  (__)  (____)(____)    
//
// QOFFEE!
// An Open Source P5.js-friendly Quantum simulator!

function make_quantum(theta, q){
    // with a new theta value, we have to reset the circuit
    // so we reset the StateVector to (1,0,0,...)
    // and then rebuild the circuit from scratch with the new theta value...
    // It really doesn't take long for just a few qubits!
    q.reset_sv();
    q.add(H_gate,0);
    q.add(RX_gate(theta*math.PI),1);
    q.add_control(X_gate,0,1);
  }
  
  function setup() {
    createCanvas(400, 400);
    // noLoop();
    q = new QuantumCircuit(2);
    q.add(H_gate,0);
    q.add(X_gate,1);
    q.add_control(X_gate,0,1);
    // console.log(q.get_sv());
    // console.log(q.get_mdist());
    background(205);
  }
  
  let prev_mouseX;
  
  function draw() {
    // Move the mouse to change the entanglement in the circuit! 
    // Closer to the left == balls the same colour!
    // closer to the right == balls different colours!
    if (mouseX != prev_mouseX){
      // if (mouseX % 5 != 0){
      //   return;
      // }
      make_quantum(mouseX/400, q);
      prev_mouseX = mouseX;
      
      // now make updated quantum!
      let r = q.measure()[0];
      if (r%2 == 0){fill('red')} else {fill('blue')}
      circle(100, 200, 75);
      if ((r>>1)%2 == 0){fill('red')} else {fill('blue')}
      circle(300, 200, 75);
    }
  }