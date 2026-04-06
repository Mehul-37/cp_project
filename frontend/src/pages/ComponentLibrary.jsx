import React, { useState } from 'react';
import './ComponentLibrary.css';

const COMPONENT_DATA = [
  {
    id: 'resistor',
    name: 'Resistor',
    category: 'Passive',
    symbol: <path d="M0,15 l10,0 l5,-10 l10,20 l10,-20 l10,20 l10,-20 l5,10 l10,0" stroke="var(--primary-accent)" strokeWidth="2" fill="none" />,
    desc: 'A resistor restricts the flow of electrical current. It dissipates power as heat. Governed by Ohm\'s Law: V = IR.',
    params: ['Resistance (Ohms)', 'Power Rating (Watts)', 'Tolerance (%)'],
    Interactive: () => {
      const [val, setVal] = useState(100);
      return (
        <div className="interactive-area">
          <label htmlFor="res-val">R = {val} Ω (Voltage = 5V)</label>
          <input id="res-val" type="range" min="10" max="1000" value={val} onChange={e => setVal(e.target.value)} />
          <div className="result-display highlight">Current (I) = {(5/val).toFixed(4)} A</div>
        </div>
      );
    }
  },
  {
    id: 'capacitor',
    name: 'Capacitor',
    category: 'Passive',
    symbol: <g stroke="var(--primary-accent)" strokeWidth="2" fill="none"><path d="M0,15 h25 M45,15 h25 M25,0 v30 M45,0 v30" /></g>,
    desc: 'Stores electrical energy in an electric field. Blocks DC but passes AC. Used for filtering and timing.',
    params: ['Capacitance (Farads)', 'Max Voltage (V)', 'Dielectric Material'],
    Interactive: () => {
      const [val, setVal] = useState(10);
      return (
        <div className="interactive-area">
          <label htmlFor="cap-val">C = {val} µF (Voltage = 12V)</label>
          <input id="cap-val" type="range" min="1" max="100" value={val} onChange={e => setVal(e.target.value)} />
          <div className="result-display highlight">Charge (Q) = {val * 12} µC</div>
        </div>
      );
    }
  },
  {
    id: 'inductor',
    name: 'Inductor',
    category: 'Passive',
    symbol: <path d="M0,15 h10 a5,5 0 1,1 10,0 a5,5 0 1,1 10,0 a5,5 0 1,1 10,0 h10" stroke="var(--primary-accent)" strokeWidth="2" fill="none" />,
    desc: 'Stores energy in a magnetic field when current flows through it. Opposes changes in current.',
    params: ['Inductance (Henries)', 'Current Rating (A)', 'DCR (Ohms)'],
    Interactive: () => {
      const [val, setVal] = useState(100);
      return (
        <div className="interactive-area">
          <label htmlFor="ind-val">f = {val} Hz (L = 10mH)</label>
          <input id="ind-val" type="range" min="10" max="1000" value={val} onChange={e => setVal(e.target.value)} />
          <div className="result-display highlight">Reactance (X_L) = {(2 * Math.PI * val * 0.01).toFixed(2)} Ω</div>
        </div>
      );
    }
  },
  {
    id: 'diode',
    name: 'Diode',
    category: 'Active',
    symbol: <g stroke="var(--primary-accent)" strokeWidth="2" fill="none"><path d="M0,15 h20 l20,-10 v20 z M40,5 v20 M40,15 h20" /></g>,
    desc: 'Allows current to flow in only one direction (Forward Bias). Blocks current in the opposite direction (Reverse Bias).',
    params: ['Forward Voltage (Vf)', 'Reverse Breakdown (Vr)', 'Max Current (If)'],
    Interactive: () => {
      const [fwd, setFwd] = useState(true);
      return (
        <div className="interactive-area">
          <div className="toggle-group">
             <button className={`btn ${fwd ? 'active-btn' : ''}`} onClick={()=>setFwd(true)}>Forward Bias</button>
             <button className={`btn ${!fwd ? 'active-btn' : ''}`} onClick={()=>setFwd(false)}>Reverse Bias</button>
          </div>
          <div className={`result-display ${fwd ? 'on' : 'off'}`}>
             {fwd ? "Current is FLOWING (ON) (~0.7V drop)" : "Current is BLOCKED (OFF)"}
          </div>
        </div>
      );
    }
  },
  {
    id: 'led',
    name: 'LED (Light Emitting Diode)',
    category: 'Passive',
    symbol: <g stroke="var(--primary-accent)" strokeWidth="2" fill="none"><path d="M0,15 h20 l20,-10 v20 z M40,5 v20 M40,15 h20 M50,5 l10,-10 M60,10 l10,-10" /></g>,
    desc: 'A specialized diode that emits light when current flows through it. Requires a series resistor to limit current.',
    params: ['Color', 'Forward Voltage (~2V)', 'Max Current (~20mA)'],
    Interactive: () => {
      const [on, setOn] = useState(false);
      return (
        <div className="interactive-area">
          <button className={`btn ${on ? 'active-btn' : ''}`} onClick={()=>setOn(!on)}>Toggle Power</button>
          <div className="led-demo" style={{ 
             width: 40, height: 40, borderRadius: '50%', margin: '1rem auto',
             background: on ? 'var(--success-color)' : 'var(--border-color)',
             boxShadow: on ? '0 0 8px var(--success-color)' : 'none',
             transition: 'all 0.3s ease'
          }} />
        </div>
      );
    }
  },
  {
    id: 'npn',
    name: 'BJT (NPN)',
    category: 'Active',
    symbol: <g stroke="var(--primary-accent)" strokeWidth="2" fill="none"><path d="M0,15 h20 v-10 v20 M20,10 l20,-10 M20,20 l20,10 M40,25 l-5,-5 M40,30 v-5 h-5 M40,0 h20 M40,30 h20" /></g>,
    desc: 'NPN Bipolar Junction Transistor. Uses a small current at the base to control a larger current between collector and emitter.',
    params: ['hFE (Gain)', 'Max Vce', 'Max Ic'],
    Interactive: () => {
      const [mode, setMode] = useState('Cutoff');
      return (
        <div className="interactive-area">
          <div className="toggle-group sm">
             {['Cutoff', 'Active', 'Saturation'].map(m => (
               <button key={m} className={`btn ${mode===m ? 'active-btn' : ''}`} onClick={()=>setMode(m)}>{m}</button>
             ))}
          </div>
          <div className="result-display highlight" style={{fontSize: '0.8rem'}}>
             {mode === 'Cutoff' && "OFF status: Base current is zero. No collector current flows."}
             {mode === 'Active' && "Amplifier status: Ic = hFE × Ib. Partial conduction."}
             {mode === 'Saturation' && "ON status: Fully conducting. Acts as a closed switch."}
          </div>
        </div>
      );
    }
  },
  {
    id: 'mosfet-n',
    name: 'MOSFET (N-Channel)',
    category: 'Active',
    symbol: <g stroke="var(--primary-accent)" strokeWidth="2" fill="none"><path d="M0,15 h15 M15,5 v20 M20,5 v5 M20,12.5 v5 M20,20 v5 M20,5 h20 M20,15 h20 M20,25 h20 M40,5 v10 M40,25 v-10 M25,15 l5,-5 v10z M40,0 v5 M40,25 v5" /></g>,
    desc: 'Voltage-controlled switch. A voltage at the gate creates a conductive channel between drain and source.',
    params: ['Vgs(th) (Threshold)', 'Rds(on)', 'Max Id'],
    Interactive: () => {
      const [vg, setVg] = useState(0);
      const isON = vg >= 3.3; // Threshold ~3.3V
      return (
        <div className="interactive-area">
          <label htmlFor="mos-val">Gate Voltage = {vg}V</label>
          <input id="mos-val" type="range" min="0" max="10" step="0.1" value={vg} onChange={e => setVg(e.target.value)} />
          <div className={`result-display ${isON ? 'on' : 'off'}`}>
             {isON ? "MOSFET is ON (Channel Conducts)" : "MOSFET is OFF"}
          </div>
        </div>
      );
    }
  },
  {
    id: 'source-v',
    name: 'Voltage Source',
    category: 'Source',
    symbol: <g stroke="var(--primary-accent)" strokeWidth="2" fill="none"><circle cx="30" cy="15" r="15" /><path d="M25,10 h10 M30,5 v10 M25,20 h10 M0,15 h15 M45,15 h15"/></g>,
    desc: 'Provides a constant voltage difference independent of the current drawn from it.',
    params: ['Voltage (V)', 'Internal Resistance (Ω)'],
    Interactive: () => {
      const [vg, setVg] = useState(5);
      return (
        <div className="interactive-area">
          <label htmlFor="src-val">Vout = {vg}V</label>
          <input id="src-val" type="range" min="0" max="24" value={vg} onChange={e => setVg(e.target.value)} />
          <div className="result-display highlight">{vg > 12 ? "High Voltage Warning ⚡" : "Safe Output Level"}</div>
        </div>
      );
    }
  },
  {
    id: 'opamp',
    name: 'Op-Amp',
    category: 'Active',
    symbol: <g stroke="var(--primary-accent)" strokeWidth="2" fill="none"><path d="M15,0 v30 l30,-15 z M0,10 h15 M0,20 h15 M45,15 h15 M20,10 h6 M20,20 h6 M23,17 v6" /></g>,
    desc: 'High gain electronic voltage amplifier with differential input. Computes the difference between inputs.',
    params: ['Open Block Gain', 'GBW Product', 'Slew Rate'],
    Interactive: () => {
      const [inv, setInv] = useState(false);
      return (
        <div className="interactive-area">
          <button className="btn" onClick={()=>setInv(!inv)}>
             Toggle: {inv ? "Inverting (-)" : "Non-Inverting (+)"}
          </button>
          <div className="result-display highlight">
             Vout = {inv ? "- (Rf/Rin) × Vin" : "(1 + Rf/Rin) × Vin"}
          </div>
        </div>
      );
    }
  }
];

const ComponentLibrary = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = COMPONENT_DATA.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || c.category === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="container cl-container">
      <div className="cl-header">
        <h2>Component Library</h2>
        <div className="cl-controls">
          <input 
            type="text" 
            aria-label="Search components"
            placeholder="Search components..." 
            className="search-input mono"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="filter-pills">
            {['All', 'Passive', 'Active', 'Source'].map(cat => (
              <button 
                key={cat} 
                className={`pill ${filter === cat ? 'active' : ''}`}
                onClick={() => setFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="cl-grid">
        {filtered.map(comp => (
          <div key={comp.id} className="card comp-card">
            <div className="comp-header">
              <div className="comp-symbol-wrapper">
                 <svg width="70" height="30" viewBox="0 0 70 30">
                    {comp.symbol}
                 </svg>
              </div>
              <div className="comp-title">
                 <h3>{comp.name}</h3>
                 <span className={`badge badge-${comp.category.toLowerCase()}`}>{comp.category}</span>
              </div>
            </div>
            <p className="comp-desc">{comp.desc}</p>
            <div className="comp-params">
              <strong>Key Parameters:</strong>
              <ul>
                {comp.params.map(p => <li key={p}>{p}</li>)}
              </ul>
            </div>
            <div className="divider"></div>
            <comp.Interactive />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComponentLibrary;
