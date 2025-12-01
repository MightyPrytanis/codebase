import React, { useEffect, useState } from 'react';
import './middleboro-glass-ocean.css';
import './piquette.css';

const weatherOptions = [
  { type: 'default', label: 'Default', emoji: '☀️' },
  { type: 'snow', label: 'Snow', emoji: '❄️' },
  { type: 'autumn', label: 'Autumn', emoji: '🍂' },
  { type: 'rain', label: 'Rain', emoji: '🌧️' },
  { type: 'fog', label: 'Fog', emoji: '🌫️' }
];

function SunlightAnimation() {
  // Uses CSS/SVG overlays for the dappled sunlight effect.
  return (
    <svg
      style={{position: 'absolute',top: 0,left: 0,width: '100%',height: '100%',pointerEvents: 'none',zIndex: 2}}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="dappling1" cx="60%" cy="30%" r="0.9">
          <stop offset="0%" stopColor="#ffffff33" />
          <stop offset="100%" stopColor="#f8f7f30c" />
        </radialGradient>
        <radialGradient id="dappling2" cx="30%" cy="60%" r="1.0">
          <stop offset="0%" stopColor="#f8f7f31c" />
          <stop offset="100%" stopColor="#f8f7f307" />
        </radialGradient>
      </defs>
      <ellipse fill="url(#dappling1)" rx="50%" ry="34%" cx="60%" cy="30%">
        <animate attributeName="cx" values="60%;65%;60%" dur="9s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="27%;36%;27%" dur="12s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse fill="url(#dappling2)" rx="52%" ry="30%" cx="30%" cy="60%">
        <animate attributeName="cx" values="30%;40%;30%" dur="13s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="60%;67%;60%" dur="9s" repeatCount="indefinite"/>
      </ellipse>
    </svg>
  );
}

export default function MiddleboroDemo() {
  const [weather, setWeather] = useState('default');
  useEffect(() => {
    document.documentElement.setAttribute('data-weather',
      weather === 'default' ? '' : weather
    );
  }, [weather]);

  return (
    <div className="piquette-theme middleboro-ui" style={{position:'relative',minHeight:'100vh',overflow:'hidden'}}>
      <SunlightAnimation/>
      <div style={{position:'relative',zIndex:3,padding:'3rem 1rem 1rem 1rem',maxWidth:800,margin:'auto'}}>
        <h1 style={{fontSize:'2rem',color:'var(--middleboro-brown)',marginBottom:'0.5em'}}>Middleboro UI — Live Demo</h1>
        <label style={{display:'block',margin:'1rem 0 0.5rem', fontWeight:600}}>Weather / Season</label>
        <div style={{display:'flex',gap:10,marginBottom:24}}>
          {weatherOptions.map(opt => (
            <button key={opt.type} onClick={() => setWeather(opt.type)} style={{padding:'0.3em 1.4em',fontSize:'1.2em',borderRadius:6,border:'1px solid var(--middleboro-tan)',background: weather===opt.type?'var(--middleboro-tan)':'#fff',color:'var(--middleboro-brown)',cursor:'pointer'}}>
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
        <div style={{margin:'2em 0',borderRadius:18,background:'var(--glass-light)',boxShadow:'var(--shadow-standard)',padding:'2rem'}}>
          <h2 style={{color:'var(--middleboro-blue)',marginBottom:6}}>Your Day at a Glance</h2>
          <hr style={{margin:'0.8em 0',borderColor:'var(--middleboro-beige)'}}/>
          <p style={{color:'var(--middleboro-black)',fontSize:'1.18em'}}>Meetings, legal research tasks, and reminders show up here. Alerts use <span style={{background:'var(--holiday-mayhem)',color:'#fff',padding:'0.2em 0.5em',borderRadius:'0.7em'}}>Holiday Mayhem</span> purple for urgent moments.</p>
          <ul style={{margin:'1em 0 0 0',color:'var(--middleboro-red)'}}>
            <li>Court filing deadline <span style={{fontWeight:700,color:'var(--holiday-mayhem)'}}>TODAY</span></li>
            <li>Discovery due tomorrow</li>
          </ul>
        </div>
        <footer style={{fontSize:'0.95em',marginTop:'3em',textAlign:'center',opacity:0.80}}>Middleboro-UI & Piquette adapted demo — palette & animation by user story, {new Date().getFullYear()}</footer>
      </div>
    </div>
  );
}
