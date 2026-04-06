import React, { useState, useRef, useEffect } from 'react';
import './WaveformVisualizer.css';

const API_URL = "http://localhost:5000/api";

const WaveformVisualizer = ({ circuitGates, circuitWires }) => {
  const canvasRef = useRef(null);
  
  const [selectedInput, setSelectedInput] = useState('');
  const [cycles, setCycles] = useState(4);
  const [frequency, setFrequency] = useState(1);
  const [timeline, setTimeline] = useState(null);
  const [propDelay, setPropDelay] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);

  const inputNodes = circuitGates.filter(g => g.type === 'INPUT');

  const runSimulation = async () => {
    if (!selectedInput) return alert("Please link a circuit input first.");
    setIsSimulating(true);

    const logicGates = circuitGates.filter(g => g.type !== 'INPUT' && g.type !== 'OUTPUT');
    const outputNodes = circuitGates.filter(g => g.type === 'OUTPUT');

    const mappedGates = [...logicGates, ...outputNodes].map(gate => {
      const inWires = circuitWires.filter(w => w.to === gate.id);
      inWires.sort((a,b) => a.toPort - b.toPort);
      return {
        id: gate.id,
        type: gate.type === 'OUTPUT' ? 'AND' : gate.type,
        inputs: inWires.map(w => w.from)
      };
    });

    try {
      // Fetch timeline simulation
      const simRes = await fetch(`${API_URL}/simulate_timing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clock_input: selectedInput, num_cycles: cycles, current_inputs: {}, gates: mappedGates })
      });
      const data = await simRes.json();
      setTimeline(data.timeline);

      // Fetch analysis to get metrics for delay
       const analyzeRes = await fetch(`${API_URL}/analyze`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ inputs: inputNodes.map(g=>g.id), gates: mappedGates, outputs: outputNodes.map(g=>g.id) })
       });
       const aData = await analyzeRes.json();
       setPropDelay(aData.metrics.propagationDelay || 0);

    } catch(err) {
       console.error(err);
       alert("Simulation Failed");
    } finally {
       setIsSimulating(false);
    }
  };

  useEffect(() => {
    if (!timeline || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    
    // figure out headers
    const headers = Object.keys(timeline[0] || {}).sort((a,b) => {
        if (a.startsWith('INPUT') && !b.startsWith('INPUT')) return -1;
        if (!a.startsWith('INPUT') && b.startsWith('INPUT')) return 1;
        if (a.startsWith('OUTPUT') && !b.startsWith('OUTPUT')) return 1;
        if (!a.startsWith('OUTPUT') && b.startsWith('OUTPUT')) return -1;
        return a.localeCompare(b);
    });

    const nRows = timeline.length;
    const width = Math.max(800, nRows * 50 + 150);
    const height = headers.length * 60 + 50;
    
    canvasRef.current.width = width;
    canvasRef.current.height = height;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0,0,width,height);

    // x-axis steps
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for(let i=0; i<nRows; i++) {
        ctx.beginPath();
        ctx.moveTo(150 + i*50, 0);
        ctx.lineTo(150 + i*50, height);
        ctx.stroke();
    }

    headers.forEach((header, idx) => {
        const yBase = 50 + idx * 60;
        let color = '#a855f7'; 
        if (header.startsWith('INPUT')) color = '#06b6d4'; 
        if (header.startsWith('OUTPUT')) color = '#22c55e'; 

        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px monospace';
        const label = header.replace('INPUT_', '').replace('OUTPUT_', '');
        ctx.fillText(label, 20, yBase);

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        let prevVal = null;

        for(let r=0; r<nRows; r++) {
            const val = timeline[r][header];
            const x = 150 + r*50;
            const y = val ? yBase - 25 : yBase;
            if (r === 0) {
               ctx.moveTo(x, y);
            } else {
               if (prevVal !== val) {
                  ctx.lineTo(x, prevVal ? yBase - 25 : yBase);
               }
               ctx.lineTo(x, y);
            }
            if(r < nRows - 1) ctx.lineTo(x + 50, y);
            prevVal = val;
        }
        ctx.stroke();
    });

  }, [timeline]);

  return (
    <div className="wv-container" style={{display: 'flex'}}>
      <div className="wv-sidebar" style={{width: '300px', padding: '1.5rem', background: '#0f172a', borderRight: '1px solid #1e293b'}}>
        <h3 style={{color: 'var(--primary-accent)', marginBottom: '1.5rem'}}>Signal Generator</h3>
        
        <div style={{marginBottom: '1rem'}}>
          <label style={{color: '#64748b', fontSize: '12px', display: 'block', marginBottom: '0.3rem'}}>Link to Circuit Input</label>
          <select 
             style={{width: '100%', padding: '0.5rem', background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '4px'}}
             value={selectedInput} onChange={e=>setSelectedInput(e.target.value)}
          >
            <option value="" disabled>Select an input node...</option>
            {inputNodes.map(n => <option key={n.id} value={n.id}>{n.id.replace('INPUT_','')}</option>)}
          </select>
        </div>

        <div style={{marginBottom: '1rem'}}>
          <label style={{color: '#64748b', fontSize: '12px', display: 'block', marginBottom: '0.3rem'}}>Wave Type</label>
          <select style={{width: '100%', padding: '0.5rem', background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '4px'}}>
             <option value="square">Square (Clock)</option>
          </select>
        </div>

        <div style={{marginBottom: '1rem'}}>
          <label style={{color: '#64748b', fontSize: '12px', display: 'block', marginBottom: '0.3rem'}}>Number of Cycles ({cycles})</label>
          <input type="range" min="1" max="16" value={cycles} onChange={e=>setCycles(Number(e.target.value))} style={{width: '100%'}}/>
        </div>

        <div style={{marginBottom: '2rem'}}>
          <label style={{color: '#64748b', fontSize: '12px', display: 'block', marginBottom: '0.3rem'}}>Frequency ({frequency} Hz)</label>
          <input type="range" min="1" max="100" value={frequency} onChange={e=>setFrequency(Number(e.target.value))} style={{width: '100%'}}/>
        </div>

        <button className="btn" style={{width: '100%'}} onClick={runSimulation} disabled={isSimulating}>
           {isSimulating ? 'Running...' : '▶ Run Simulation'}
        </button>

      </div>
      
      <div className="wv-main" style={{flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column'}}>
         <h2 style={{marginBottom: '1rem'}}>Timing Interaction</h2>
         
         {!timeline ? (
           <div style={{padding: '3rem', textAlign: 'center', background: '#0f172a', border: '1px dashed #1e293b', borderRadius: '6px', color: '#64748b'}}>
              Link an input and run the simulation to view signals.
           </div>
         ) : (
           <>
              <div style={{overflowX: 'auto', border: '1px solid #1e293b', borderRadius: '6px'}}>
                 <canvas ref={canvasRef} />
              </div>
              
              <div style={{marginTop: '2rem', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem'}}>
                 <div>
                    <h4 style={{color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '12px'}}>Estimated Response Time</h4>
                    <div style={{fontSize: '24px', fontWeight: 'bold', color: '#ef4444'}}>{propDelay} <span style={{fontSize: '14px', fontWeight: 'normal', color: '#94a3b8'}}>gate-delay units</span></div>
                 </div>
                 <div style={{height: '50px', flex: 1, position: 'relative'}}>
                     <div style={{position: 'absolute', top: '24px', left: 0, right: 0, height: '2px', background: '#334155'}} />
                     <div style={{position: 'absolute', top: '10px', left: '0%', paddingLeft: '5px', color: '#06b6d4', fontSize: '12px'}}>Input changes</div>
                     <div style={{position: 'absolute', top: '20px', left: '0', width: '2px', height: '10px', background: '#06b6d4'}} />
                     
                     <div style={{position: 'absolute', top: '10px', right: '0%', paddingRight: '5px', color: '#22c55e', fontSize: '12px', textAlign: 'right'}}>Output stabilizes</div>
                     <div style={{position: 'absolute', top: '20px', right: '0', width: '2px', height: '10px', background: '#22c55e'}} />
                     
                     <div style={{position: 'absolute', top: '27px', left: '50%', transform: 'translateX(-50%)', color: '#ef4444', fontSize: '12px'}}>
                        ← visual propagation span →
                     </div>
                 </div>
              </div>
           </>
         )}
      </div>
    </div>
  );
};

export default WaveformVisualizer;
