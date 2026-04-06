import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CircuitBuilder from './pages/CircuitBuilder';
import ComponentLibrary from './pages/ComponentLibrary';
import WaveformVisualizer from './pages/WaveformVisualizer';

function App() {
  const [activeTab, setActiveTab] = useState('builder');
  const [theme, setTheme] = useState('dark');
  const [gates, setGates] = useState([]);
  const [wires, setWires] = useState([]);

  // Apply theme to document body so global background resolves
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const renderContent = () => {
    switch (activeTab) {
      case 'builder': return <CircuitBuilder gates={gates} setGates={setGates} wires={wires} setWires={setWires} />;
      case 'library': return <ComponentLibrary />;
      case 'waveform': return <WaveformVisualizer circuitGates={gates} circuitWires={wires} />;
      default: return <CircuitBuilder gates={gates} setGates={setGates} wires={wires} setWires={setWires} />;
    }
  };

  return (
    <div className="app-container" data-theme={theme}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} setTheme={setTheme} />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
