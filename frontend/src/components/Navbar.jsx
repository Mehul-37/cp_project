import React from 'react';
import './Navbar.css';

const Navbar = ({ activeTab, setActiveTab, theme, setTheme }) => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="var(--primary-accent)" strokeWidth="2"/>
          <circle cx="12" cy="12" r="3" fill="var(--primary-accent)"/>
          <path d="M22 12h-4M12 2v4M12 22v-4M2 12h4" stroke="var(--primary-accent)" strokeWidth="2"/>
        </svg>
        <span className="logo-text">Circuit<span className="logo-highlight">Forge</span></span>
      </div>
      
      <div className="navbar-links">
        <button 
          className={`nav-link ${activeTab === 'builder' ? 'active' : ''}`}
          onClick={() => setActiveTab('builder')}
        >
          Circuit Builder
        </button>
        <button 
          className={`nav-link ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          Component Library
        </button>
        <button 
          className={`nav-link ${activeTab === 'waveform' ? 'active' : ''}`}
          onClick={() => setActiveTab('waveform')}
        >
          Signal Lab
        </button>
      </div>

      <div className="navbar-actions">
        <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="Toggle Theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
