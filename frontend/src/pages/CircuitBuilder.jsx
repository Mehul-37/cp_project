import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Group, Path, Circle, Line as KonvaLine } from 'react-konva';
import { PREBUILT_CIRCUITS } from '../data/PrebuiltCircuits';
import './CircuitBuilder.css';

const GATE_SHAPES = {
  AND: "M0,0 h15 a15,15 0 0,1 15,15 a15,15 0 0,1 -15,15 h-15 v-30z",
  OR: "M0,0 q10,15 0,30 q20,0 30,-15 q-10,-15 -30,-15",
  NOT: "M0,0 l25,15 l-25,15 v-30",
  NAND: "M0,0 h15 a15,15 0 0,1 15,15 a15,15 0 0,1 -15,15 h-15 v-30z",
  NOR: "M0,0 q10,15 0,30 q20,0 30,-15 q-10,-15 -30,-15",
  XOR: "M-5,0 q10,15 0,30 M0,0 q10,15 0,30 q20,0 30,-15 q-10,-15 -30,-15",
  XNOR: "M-5,0 q10,15 0,30 M0,0 q10,15 0,30 q20,0 30,-15 q-10,-15 -30,-15",
  INPUT: "M0,0 h30 v30 h-30 v-30",
  OUTPUT: "M15,15 m-15,0 a15,15 0 1,0 30,0 a15,15 0 1,0 -30,0"
};

const GATE_INPUT_PORTS = { AND: 2, OR: 2, NAND: 2, NOR: 2, XOR: 2, XNOR: 2, NOT: 1, INPUT: 0, OUTPUT: 1 };
let idCounter = 100; // start higher to avoid collisions with presets

const TimingCanvas = ({ truthTable }) => {
  const canvasRef = useRef(null);
  const [playhead, setPlayhead] = useState(0);
  
  const headers = truthTable.headers;
  const rows = truthTable.rows;
  const nRows = rows.length;
  
  const width = Math.max(500, nRows * 30 + 100);
  const height = headers.length * 50 + 40;

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for(let i=0; i<nRows; i++) {
        ctx.beginPath();
        ctx.moveTo(100 + i*30, 0);
        ctx.lineTo(100 + i*30, height - 40);
        ctx.stroke();
    }

    // Signals
    headers.forEach((header, idx) => {
        const yBase = 40 + idx * 50;
        let color = '#a855f7'; // violet intermediate
        if (header.startsWith('INPUT')) color = '#06b6d4'; // cyan
        if (header.startsWith('OUTPUT')) color = '#22c55e'; // green

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        const label = header.replace('INPUT_', '').replace('OUTPUT_', '');
        ctx.fillText(label, 10, yBase);

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        let prevVal = null;
        for(let r=0; r<nRows; r++) {
            const val = rows[r][idx];
            const x = 100 + r*30;
            const y = val ? yBase - 15 : yBase;
            if (r === 0) {
               ctx.moveTo(x, y);
            } else {
               if (prevVal !== val) {
                  ctx.lineTo(x, prevVal ? yBase - 15 : yBase); // vertical edge
               }
               ctx.lineTo(x, y);
            }
            if(r < nRows - 1) {
                ctx.lineTo(x + 30, y);
            }
            prevVal = val;
        }
        ctx.stroke();
    });

    // Playhead
    const px = 100 + playhead * 30;
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.moveTo(px, 0);
    ctx.lineTo(px, height - 40);
    ctx.stroke();

  }, [truthTable, playhead, width, height]);

  const handleMouseMove = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left + canvasRef.current.parentElement.scrollLeft;
      if (mx >= 100 && mx <= 100 + nRows*30) {
          const step = Math.floor((mx - 100) / 30);
          if (step >= 0 && step < nRows) setPlayhead(step);
      }
  };

  return (
    <div>
       <div style={{display: 'flex', justifyContent: 'flex-end', padding: '0.5rem', fontSize: '11px', gap: '0.5rem'}}>
         <span style={{color: '#06b6d4'}}>■ Input</span>
         <span style={{color: '#a855f7'}}>■ Intermediate</span>
         <span style={{color: '#22c55e'}}>■ Output</span>
       </div>
       <div style={{overflowX: 'auto', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px'}}>
         <canvas 
            ref={canvasRef} 
            width={width} 
            height={height} 
            onMouseMove={handleMouseMove} 
            style={{cursor: 'crosshair'}}
         />
       </div>
       <div style={{marginTop: '1rem', background: '#1e293b', padding: '0.5rem', borderRadius: '4px'}}>
          <strong>State at Step {playhead}:</strong>
          <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem', fontSize: '12px', fontFamily: 'monospace'}}>
             {headers.map((h, i) => (
                 <span key={i} style={{color: rows[playhead] ? (rows[playhead][i] ? '#22c55e' : '#ef4444') : '#fff'}}>
                    {h.replace('INPUT_','').replace('OUTPUT_','')}: {rows[playhead] ? (rows[playhead][i] ? '1' : '0') : '-'}
                 </span>
             ))}
          </div>
       </div>
    </div>
  );
};

const CircuitBuilder = ({ gates, setGates, wires, setWires }) => {
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  
  const [drawingWire, setDrawingWire] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const [evalValues, setEvalValues] = useState({});
  const [insights, setInsights] = useState(null);
  const [activeTab, setActiveTab] = useState('expression');
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // Truth table pagination
  const [ttPage, setTtPage] = useState(0);
  const TT_ROWS_PER_PAGE = 16;

  const getPointerPosition = (e) => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    stage.setPointersPositions(e);
    return stage.getPointerPosition();
  };

  const API_URL = "http://localhost:5000/api";

  const calculateDepths = () => {
    const depths = {};
    gates.filter(g=>g.type==='INPUT').forEach(g=> depths[g.id] = 0);
    gates.filter(g=>g.type!=='INPUT').forEach(g=> depths[g.id] = -1);

    let changed = true;
    for(let it=0; it<100 && changed; it++) {
        changed = false;
        gates.forEach(g => {
            if (g.type === 'INPUT') return;
            const inWires = wires.filter(w=> w.to === g.id);
            if (inWires.length === 0) return;
            const inDepths = inWires.map(w => depths[w.from]);
            if (inDepths.includes(-1)) return;
            const myDepth = Math.max(...inDepths) + 1;
            if (depths[g.id] !== myDepth) {
                depths[g.id] = myDepth;
                changed = true;
            }
        });
    }
    return depths;
  };

  const evaluateCircuit = async () => {
    setIsEvaluating(true);
    const inputNodes = gates.filter(g => g.type === 'INPUT');
    const inputsMap = {};
    inputNodes.forEach(n => inputsMap[n.id] = evalValues[n.id] || false);

    const logicGates = gates.filter(g => g.type !== 'INPUT' && g.type !== 'OUTPUT');
    const outputNodes = gates.filter(g => g.type === 'OUTPUT');

    const mappedGates = [...logicGates, ...outputNodes].map(gate => {
      const inWires = wires.filter(w => w.to === gate.id);
      inWires.sort((a,b) => a.toPort - b.toPort);
      return {
        id: gate.id,
        type: gate.type === 'OUTPUT' ? 'AND' : gate.type,
        inputs: inWires.map(w => w.from)
      };
    });

    try {
      const [evalRes, analyzeRes] = await Promise.all([
         fetch(`${API_URL}/evaluate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inputs: inputsMap, gates: mappedGates }) }),
         fetch(`${API_URL}/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inputs: inputNodes.map(g=>g.id), gates: mappedGates, outputs: outputNodes.map(g=>g.id) }) })
      ]);
      
      const evalData = await evalRes.json();
      const analyzeData = await analyzeRes.json();
      
      setInsights(analyzeData);

      // Animate Evaluation
      const depths = calculateDepths();
      const maxDepth = Math.max(...Object.values(depths), 0);
      
      setEvalValues({}); // Clear current states to show wave
      
      let initialT = 0;
      for(let d=0; d<=maxDepth; d++) {
          setTimeout(() => {
              setEvalValues(prev => {
                  const nextVals = {...prev};
                  gates.forEach(g => {
                      if (depths[g.id] === d) {
                          nextVals[g.id] = evalData.values[g.id];
                      }
                  });
                  return nextVals;
              });
          }, initialT);
          initialT += 150; // 150ms delay per depth level
      }

    } catch (err) {
      console.error("Evaluation failed", err);
      alert("Backend API not reachable or error occurred.");
    } finally {
      setTimeout(()=>setIsEvaluating(false), 500); 
    }
  };

  // Canvas Interactions
  const handleDrop = (e) => {
    e.preventDefault();
    if (!containerRef.current) return;
    stageRef.current.setPointersPositions(e);
    const pos = stageRef.current.getPointerPosition();
    const gateType = e.dataTransfer.getData('gateType');
    if (gateType && pos) {
      setGates([...gates, { id: `${gateType}_${idCounter++}`, type: gateType, x: pos.x - 30, y: pos.y - 30, inputs: GATE_INPUT_PORTS[gateType] }]);
    }
  };

  const handlePortClick = (e, gateId, portType, portIdx) => {
    e.cancelBubble = true;
    if (e.evt) e.evt.stopPropagation();
    if (portType === 'out') {
      const pos = getPointerPosition(e.evt);
      setDrawingWire({ fromNodeId: gateId, fromPortIdx: portIdx, startPos: pos });
    } else if (portType === 'in' && drawingWire) {
      if (drawingWire.fromNodeId !== gateId) {
        setWires([...wires, { id: `w_${idCounter++}`, from: drawingWire.fromNodeId, fromPort: drawingWire.fromPortIdx, to: gateId, toPort: portIdx }]);
      }
      setDrawingWire(null);
    }
  };

  const handleGateMouseDown = (e, gate) => {
    if (e.evt.button === 2 && gate.type !== 'OUTPUT') {
      e.cancelBubble = true;
      e.evt.preventDefault();
      setDrawingWire({ fromNodeId: gate.id, fromPortIdx: 0, startPos: { x: gate.x + 60, y: gate.y + 30 } });
      setMousePos(getPointerPosition(e.evt));
    }
  };

  const handleGateMouseUp = (e, gate) => {
    if (e.evt.button === 2 && drawingWire) {
      e.cancelBubble = true;
      if (drawingWire.fromNodeId !== gate.id && gate.type !== 'INPUT') {
         const pos = getPointerPosition(e.evt);
         let toPort = 0;
         if (gate.inputs === 2) toPort = Math.abs(pos.y - (gate.y + 15)) < Math.abs(pos.y - (gate.y + 45)) ? 0 : 1;
         setWires([...wires, { id: `w_${idCounter++}`, from: drawingWire.fromNodeId, fromPort: drawingWire.fromPortIdx, to: gate.id, toPort }]);
      }
      setDrawingWire(null);
    }
  };

  const handleInputToggle = (e, id) => {
    if (e.type === 'click') setEvalValues(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getWirePath = (wire) => {
    const fromGate = gates.find(g => g.id === wire.from);
    const toGate = gates.find(g => g.id === wire.to);
    if (!fromGate || !toGate) return [];
    const fromX = fromGate.x + 60;
    const fromY = fromGate.y + 30; 
    const toX = toGate.x;
    const toY = toGate.y + (toGate.inputs === 2 ? [15, 45][wire.toPort] : 30);
    return [fromX, fromY, fromX + 40, fromY, toX - 40, toY, toX, toY];
  };

  const loadTemplate = (templateKey) => {
    const template = PREBUILT_CIRCUITS[templateKey];
    if (template) {
      setGates(JSON.parse(JSON.stringify(template.gates)));
      setWires(JSON.parse(JSON.stringify(template.wires)));
      setEvalValues({});
      setInsights(null);
    }
  };

  return (
    <div className="cb-layout">
      {/* Sidebar - Component Palette */}
      <aside className="cb-sidebar">
        <h3>Components</h3>
        <div className="gate-palette">
          {Object.keys(GATE_INPUT_PORTS).map(type => (
            <div key={type} className={`palette-item ${type}`} draggable onDragStart={(e) => e.dataTransfer.setData('gateType', type)}>
              <div className="palette-symbol">
                <svg width="40" height="40" viewBox="0 0 60 60">
                   <path d={GATE_SHAPES[type] || ""} stroke="var(--primary-accent)" strokeWidth="2" fill="none" transform="translate(15,15)"/>
                   {(type === 'NAND' || type === 'NOR' || type === 'XNOR') && <circle cx="48" cy="30" r="4" fill="none" stroke="var(--primary-accent)" strokeWidth="2"/>}
                   {(type === 'NOT') && <circle cx="44" cy="30" r="4" fill="none" stroke="var(--primary-accent)" strokeWidth="2"/>}
                </svg>
              </div>
              <span>{type}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Canvas Area */}
      <div className="cb-canvas-container" ref={containerRef} onDrop={handleDrop} onDragOver={e=>e.preventDefault()}>
        <Stage 
          width={window.innerWidth - 650} 
          height={window.innerHeight - 80} 
          ref={stageRef}
          onMouseMove={e => drawingWire && setMousePos(getPointerPosition(e.evt))}
          onMouseUp={() => setDrawingWire(null)}
          onContextMenu={e => e.evt.preventDefault()}
        >
          <Layer>
            {gates.length === 0 && (
              <Text text="Drag components here. Right-click and drag to connect." x={0} y={200} width={window.innerWidth - 650} align="center" fill="#64748b" fontSize={16} fontStyle="italic" />
            )}
            
            {/* Wires */}
            {wires.map(wire => {
              const state = evalValues[wire.from];
              const color = state === true ? '#00ff88' : (state === false ? '#ff3366' : '#64748b');
              const shadowProps = state === true ? { shadowColor: '#00ff88', shadowBlur: 10, shadowOpacity: 0.8 } : {};
              return (
                <KonvaLine key={wire.id} points={getWirePath(wire)} stroke={color} strokeWidth={3} bezier tension={0.4} {...shadowProps} />
              );
            })}

            {drawingWire && (
              <KonvaLine points={[ drawingWire.startPos.x, drawingWire.startPos.y, drawingWire.startPos.x + 40, drawingWire.startPos.y, mousePos.x - 40, mousePos.y, mousePos.x, mousePos.y ]} stroke="#94a3b8" strokeWidth={2} dash={[10, 5]} bezier tension={0.4} />
            )}

            {/* Gates */}
            {gates.map(gate => {
              const isON = evalValues[gate.id] === true;
              const isOFF = evalValues[gate.id] === false;
              let mainColor = '#3b82f6';
              let shadowProps = {};
              if (isON) { mainColor = '#00ff88'; shadowProps = { shadowColor: '#00ff88', shadowBlur: 15, shadowOpacity: 0.6 }; }
              if (isOFF) { mainColor = '#ff3366'; shadowProps = { shadowColor: '#ff3366', shadowBlur: 15, shadowOpacity: 0.5 }; }

              return (
                <Group key={gate.id} x={gate.x} y={gate.y} draggable
                  onDragMove={e => setGates(gates.map(g => g.id === gate.id ? { ...g, x: e.target.x(), y: e.target.y() } : g))}
                  onContextMenu={e => handleGateMouseDown(e, gate)}
                  onDblClick={() => { setGates(gates.filter(g => g.id !== gate.id)); setWires(wires.filter(w => w.from !== gate.id && w.to !== gate.id)); }}
                  onMouseDown={e => handleGateMouseDown(e, gate)}
                  onMouseUp={e => handleGateMouseUp(e, gate)}
                  onClick={e => gate.type === 'INPUT' && handleInputToggle(e, gate.id)}
                >
                  <Rect width={60} height={60} fill="#1e293b" stroke={mainColor} strokeWidth={2} cornerRadius={5} {...shadowProps} />
                  <Text text={gate.type} x={0} y={-18} width={60} fill="#64748b" align="center" fontFamily="monospace" fontSize={12} />
                  <Path data={GATE_SHAPES[gate.type] || ""} stroke={mainColor} strokeWidth={2} x={gate.type === 'INPUT' || gate.type === 'OUTPUT' ? 15 : 10} y={15} />
                  
                  {(gate.type === 'NAND' || gate.type === 'NOR' || gate.type === 'XNOR') && <Circle cx={GATE_SHAPES[gate.type].includes('M-5') ? 48 : 45} cy={30} r={4} stroke={mainColor} strokeWidth={2}/>}
                  {(gate.type === 'NOT') && <Circle cx={39} cy={30} r={4} stroke={mainColor} strokeWidth={2}/>}

                  {gate.inputs === 2 && [15, 45].map((y, i) => <Circle key={i} x={0} y={y} r={6} fill={mainColor} />)}
                  {gate.inputs === 1 && <Circle x={0} y={30} r={6} fill={mainColor} />}
                  {gate.type !== 'OUTPUT' && <Circle x={60} y={30} r={6} fill={mainColor} />}
                  
                  {gate.type === 'INPUT' && <Text text={isON ? "1" : (isOFF ? "0" : "?")} x={0} y={23} width={60} align="center" fill={mainColor} fontFamily="monospace" fontWeight="bold" fontSize={16} />}
                  {gate.type === 'OUTPUT' && <Circle x={30} y={30} r={20} fill={isON ? '#00ff88' : (isOFF ? '#ff3366' : '#334155')} />}
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>

      {/* Right Panel - Analysis Dashboard */}
      <aside className="cb-panel" style={{width: '450px', overflowY: 'auto'}}>
        <h3>Controls</h3>
        
        <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem'}}>
           <select 
              style={{ padding: '0.5rem', background: '#0f172a', color: '#fff', border: '1px solid #1e293b', borderRadius: '4px' }}
              onChange={(e) => { if(e.target.value) loadTemplate(e.target.value); e.target.value = ''; }} defaultValue=""
            >
              <option value="" disabled>Load Pre-built Circuit...</option>
              {Object.keys(PREBUILT_CIRCUITS).map(key => <option value={key} key={key}>{PREBUILT_CIRCUITS[key].name}</option>)}
            </select>
            <div style={{display: 'flex', gap: '0.5rem'}}>
               <button className="btn" style={{flex: 1}} onClick={evaluateCircuit} disabled={isEvaluating}>{isEvaluating ? '⚡ Running...' : '⚡ Evaluate State'}</button>
               <button className="btn" style={{flex: 1}} onClick={()=>{ localStorage.setItem('circuit_save', JSON.stringify({gates,wires})); alert('Saved!'); }}>💾 Save</button>
               <button className="btn" style={{flex: 1}} onClick={()=>{ const d = localStorage.getItem('circuit_save'); if(d) { const p = JSON.parse(d); setGates(p.gates); setWires(p.wires); }}}>📂 Load</button>
               <button className="btn" style={{flex: 1, borderColor: '#ef4444', color: '#ef4444'}} onClick={()=>{setGates([]); setWires([]); setInsights(null); setEvalValues({});}}>🗑 Clear</button>
            </div>
        </div>

        {insights ? (
          <div className="insights-container" style={{animation: 'fadeIn 0.3s ease'}}>
            <h4>Analysis Dashboard</h4>
            <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', marginBottom: '1rem', width: '100%', overflowX: 'auto', gap: '0.2rem' }}>
              {['expression', 'truth_table', 'metrics', 'timing', 'simplify'].map(tab => (
                 <button 
                   key={tab}
                   onClick={() => setActiveTab(tab)} 
                   style={{ padding: '0.5rem', flexShrink: 0, background: 'none', border: 'none', borderBottom: activeTab === tab ? '2px solid var(--primary-accent)' : '2px solid transparent', color: activeTab === tab ? 'var(--primary-accent)' : '#94a3b8', cursor: 'pointer', transition: '0.2s' }}
                 >
                   {tab.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                 </button>
              ))}
            </div>
            
            <div className="insights-content" style={{minHeight: '300px'}}>
               {/* EXPRESSION TAB */}
               {activeTab === 'expression' && insights.levels && (
                 <div>
                   {Object.entries(insights.levels).map(([outId, lvls]) => (
                     <div key={outId} style={{marginBottom: '1.5rem'}}>
                        <h5 style={{color: '#06b6d4', marginBottom: '0.5rem'}}>{outId.replace('OUTPUT_','')} Breakdown</h5>
                        {lvls.map((lvlData, i) => (
                           <div key={i} style={{marginBottom: '0.5rem', paddingLeft: '10px', borderLeft: `3px solid hsl(${i*40}, 70%, 60%)`}}>
                              <span style={{fontSize: '11px', color: '#64748b'}}>Level {lvlData.level}</span>
                              {lvlData.formulas.map((f, j) => (
                                 <div key={j} style={{fontFamily: 'monospace', fontSize: '13px', background: '#0f172a', padding: '0.3rem', borderRadius: '3px', marginTop: '0.2rem'}}>{f}</div>
                              ))}
                           </div>
                        ))}
                     </div>
                   ))}
                   {Object.keys(insights.levels).length === 0 && <p style={{color: '#64748b'}}>No output expressions generated.</p>}
                 </div>
               )}

               {/* TRUTH TABLE TAB */}
               {activeTab === 'truth_table' && insights.truth_table && (
                  <div>
                    <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: 'monospace'}}>
                       <thead>
                         <tr style={{background: '#1e293b'}}>
                           {insights.truth_table.headers.map((h, i) => <th key={i} style={{padding: '0.5rem', color: '#06b6d4', textAlign: 'center'}}>{h.replace('INPUT_','').replace('OUTPUT_','')}</th>)}
                         </tr>
                       </thead>
                       <tbody>
                         {insights.truth_table.rows.slice(ttPage * TT_ROWS_PER_PAGE, (ttPage+1) * TT_ROWS_PER_PAGE).map((row, i) => {
                            // Highlight if any output column is 1
                            const outCols = row.slice(-insights.metrics.outputCount || 0);
                            const hasHighOut = outCols.some(val => val === 1 || val === true);
                            return (
                             <tr key={i} style={{background: i%2===0 ? '#0f172a' : '#1e293b', boxShadow: hasHighOut ? 'inset 0 0 10px rgba(34, 197, 94, 0.2)' : 'none'}}>
                               {row.map((cell, j) => (
                                  <td key={j} style={{padding: '0.5rem', textAlign: 'center', color: cell ? '#00ff88' : '#ff3366'}}>{cell ? '1' : '0'}</td>
                               ))}
                             </tr>
                            )
                         })}
                       </tbody>
                    </table>
                    {insights.truth_table.rows.length > TT_ROWS_PER_PAGE && (
                       <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '1rem'}}>
                          <button className="btn sm" disabled={ttPage===0} onClick={()=>setTtPage(t=>t-1)}>Prev</button>
                          <span>Page {ttPage+1} of {Math.ceil(insights.truth_table.rows.length / TT_ROWS_PER_PAGE)}</span>
                          <button className="btn sm" disabled={(ttPage+1)*TT_ROWS_PER_PAGE >= insights.truth_table.rows.length} onClick={()=>setTtPage(t=>t+1)}>Next</button>
                       </div>
                    )}
                  </div>
               )}

               {/* METRICS TAB */}
               {activeTab === 'metrics' && insights.metrics && (
                 <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                    {[
                      {label: "Total Gates", val: insights.metrics.gateCount},
                      {label: "Circuit Depth", val: insights.metrics.maxDepth},
                      {label: "Total Connections", val: insights.metrics.totalConnections},
                      {label: "Inputs", val: insights.metrics.inputCount},
                      {label: "Outputs", val: insights.metrics.outputCount},
                      {label: "Propagation Delay", val: `${insights.metrics.propagationDelay} units`}
                    ].map(m => (
                       <div key={m.label} style={{background: '#0f172a', padding: '1rem', borderRadius: '6px', border: '1px solid #1e293b'}}>
                          <div style={{fontSize: '11px', color: '#64748b', textTransform: 'uppercase'}}>{m.label}</div>
                          <div style={{fontSize: '18px', fontWeight: 'bold', color: 'var(--primary-accent)', marginTop: '0.3rem'}}>{m.val}</div>
                       </div>
                    ))}
                    <div style={{gridColumn: '1 / -1', background: '#0f172a', padding: '1rem', borderRadius: '6px', border: '1px solid #1e293b'}}>
                       <div style={{fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem'}}>Gate Breakdown</div>
                       <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                         {Object.entries(insights.metrics.gateBreakdown || {}).map(([k,v]) => (
                            <span key={k} style={{background: '#1e293b', padding: '0.3rem 0.6rem', borderRadius: '12px', fontSize: '13px'}}>{k}: {v}</span>
                         ))}
                       </div>
                    </div>
                 </div>
               )}

               {/* TIMING TAB */}
               {activeTab === 'timing' && insights.truth_table && (
                  <TimingCanvas truthTable={insights.truth_table} />
               )}

               {/* SIMPLIFY TAB */}
               {activeTab === 'simplify' && insights.simplifications && (
                 <div>
                    {Object.entries(insights.simplifications).map(([out, data]) => (
                       <div key={out} style={{marginBottom: '2rem'}}>
                          <h4 style={{color: '#22c55e'}}>{out.replace('OUTPUT_', '')} Simplification</h4>
                          <div style={{padding: '0.8rem', background: '#0f172a', borderRadius: '4px', fontFamily: 'monospace', marginBottom: '1rem'}}>
                            <div style={{color: '#64748b', fontSize: '11px'}}>ORIGINAL</div>
                            {data.original}
                          </div>
                          
                          {data.is_minimal ? (
                             <p style={{color: '#a855f7', fontStyle: 'italic'}}>Expression is already in minimal form.</p>
                          ) : (
                             <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem'}}>
                               {data.steps.map((step, idx) => (
                                  <div key={idx} style={{display: 'flex', gap: '1rem', alignItems: 'center', background: '#1e293b', padding: '0.8rem', borderRadius: '4px'}}>
                                     <div style={{width: '24px', height: '24px', background: '#06b6d4', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold'}}>{idx+1}</div>
                                     <div style={{flex: 1}}>
                                        <div style={{color: '#06b6d4', fontSize: '11px', marginBottom: '0.2rem'}}>{step.rule}</div>
                                        <div style={{fontFamily: 'monospace', fontSize: '13px'}}>{step.expression}</div>
                                     </div>
                                  </div>
                               ))}
                               <div style={{padding: '0.8rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', borderRadius: '4px', fontFamily: 'monospace'}}>
                                  <div style={{color: '#22c55e', fontSize: '11px', marginBottom: '0.2rem'}}>FINAL SIMPLIFIED</div>
                                  {data.final}
                               </div>
                             </div>
                          )}
                       </div>
                    ))}
                 </div>
               )}

            </div>
          </div>
        ) : (
          <div style={{padding: '2rem', textAlign: 'center', color: '#64748b', border: '1px dashed #1e293b', borderRadius: '6px', marginTop: '1rem'}}>
             Evaluate state to view Analysis Dashboard
          </div>
        )}
      </aside>
    </div>
  );
};

export default CircuitBuilder;
