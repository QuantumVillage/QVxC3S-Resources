import pyaudio
import wave
import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator
import sys
import math


FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100
CHUNK = 1024
RECORD_SECONDS = 10
WAVE_OUTPUT_FILENAME = "file.wav"
 
audio = pyaudio.PyAudio()

# EXAMPLE FOR HOW TO USE QISKIT
circ = QuantumCircuit(3)
circ.h(0)
circ.cx(0,1)
circ.cx(0,2)
meas = QuantumCircuit(3, 3)
meas.measure(range(3), range(3))
qc = meas.compose(circ, range(3), front=True)
state = Statevector.from_int(0, 2**3)
state = state.evolve(circ)
backend = AerSimulator()
qc_compiled = transpile(qc, backend)
job_sim = backend.run(qc_compiled, shots=1024)
result_sim = job_sim.result()
counts = result_sim.get_counts(qc_compiled)
print(counts)
# END EXAMPLE

def q_circuit(theta, n=2):
    print(theta)
    n = 2
    circ = QuantumCircuit(n, 1)
    for i in range(n-1):
        circ.cx(i, i+1)
    circ.rz(theta, range(n))
    for i in reversed(range(n-1)):
        circ.cx(i, i+1)
    circ.h(0)
    circ.measure(0,0)
    backend = AerSimulator()
    job = backend.run(transpile(circ, backend), shots=16, memory=True)
    result = job.result()
    memory = result.get_memory()
    out_int = 0
    for bit in memory:
        out_int = (out_int << 1) | int(bit)
    return out_int

print("[i] running...")
   

def voqode(stream):
    avg_stream0 = np.mean(stream[0]) + 1
    n = stream.shape[0]
    try:
        if math.isnan(avg_stream0):
            avg_strem0 = 0.5
        q_int = q_circuit(avg_stream0 / 10, 2)
    except:
        q_int = 1
    q_arr = np.full(stream.shape, np.float32(q_int * 0.00001), dtype=np.float32)
    mod = stream * q_arr
    output = np.zeros(n)
    output += mod
    return output / 500

# start Streaming  
in_stream = audio.open(format=FORMAT, channels=CHANNELS,
                       rate=RATE, input=True,
                       input_device_index=0,
                       frames_per_buffer=CHUNK)
print("[i] Streaming...")

out_stream = audio.open(format=FORMAT,
                        channels=CHANNELS,
                        rate=RATE,
                        output=True,
                        frames_per_buffer=CHUNK)
                        # stream_callback=callback)
frames = []
result = []

for i in range(audio.get_device_count()):
    device_info = audio.get_device_info_by_index(i)
    result.append(device_info.get("name"))
print(result)
 
for i in range(0, int((RATE / CHUNK) * RECORD_SECONDS)):
# while True:
    with np.errstate(invalid='ignore'):
        data = in_stream.read(CHUNK, exception_on_overflow=False)
        frames.append(data)
        in_data = np.frombuffer(data, dtype=np.float32)
        out_data = voqode(in_data)
        out_stream.write(in_data)

 
 
# stop streaming
stream.stop_stream()
stream.close()
audio.terminate()

# Code in case you want to stream to file!
 
# waveFile = wave.open(WAVE_OUTPUT_FILENAME, 'wb')
# waveFile.setnchannels(CHANNELS)
# waveFile.setsampwidth(audio.get_sample_size(FORMAT))
# waveFile.setframerate(RATE)
# waveFile.writeframes(b''.join(frames))
# waveFile.close()
