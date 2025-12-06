import { useState, useEffect } from "react";

// Button Functionality Test - Must work perfectly before any other development
export default function ButtonTest() {
  const [counters, setCounters] = useState({
    red: 0,
    green: 0,
    blue: 0
  });

  // Load counters from localStorage on mount
  useEffect(() => {
    const savedCounters = localStorage.getItem('buttonTestCounters');
    if (savedCounters) {
      setCounters(JSON.parse(savedCounters));
    }
  }, []);

  // Save to localStorage whenever counters change
  useEffect(() => {
    localStorage.setItem('buttonTestCounters', JSON.stringify(counters));
  }, [counters]);

  const handleButtonClick = (color: 'red' | 'green' | 'blue') => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${color.toUpperCase()} button clicked at ${timestamp}`);
    
    setCounters(prev => ({
      ...prev,
      [color]: prev[color] + 1
    }));
  };

  const resetCounters = () => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`RESET button clicked at ${timestamp}`);
    setCounters({ red: 0, green: 0, blue: 0 });
  };

  return (
    <div style={{
      padding: '40px',
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{
        textAlign: 'center',
        color: '#333',
        marginBottom: '30px'
      }}>
        Button Functionality Test
      </h1>
      
      <p style={{
        textAlign: 'center',
        color: '#666',
        marginBottom: '40px'
      }}>
        Each button should increment its counter, log to console, and persist after refresh.
      </p>

      <div style={{
        display: 'flex',
        gap: '20px',
        justifyContent: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => handleButtonClick('red')}
          style={{
            padding: '15px 25px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: '#dc2626',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            minWidth: '120px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          Red: {counters.red}
        </button>

        <button
          onClick={() => handleButtonClick('green')}
          style={{
            padding: '15px 25px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: '#16a34a',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            minWidth: '120px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          Green: {counters.green}
        </button>

        <button
          onClick={() => handleButtonClick('blue')}
          style={{
            padding: '15px 25px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: '#2563eb',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            minWidth: '120px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          Blue: {counters.blue}
        </button>
      </div>

      <div style={{
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <button
          onClick={resetCounters}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            color: '#666',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Reset All Counters
        </button>
      </div>

      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: '#f9fafb'
      }}>
        <h3 style={{ color: '#374151', margin: '0 0 10px 0' }}>Test Instructions:</h3>
        <ol style={{ color: '#6b7280', margin: 0, paddingLeft: '20px' }}>
          <li>Click each colored button and verify its counter increments</li>
          <li>Open browser console (F12) and verify click logs appear</li>
          <li>Refresh the page and verify counters persist</li>
          <li>Use Reset button to clear all counters</li>
        </ol>
        
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#fff',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#374151'
        }}>
          <strong>Current Total Clicks:</strong> {counters.red + counters.green + counters.blue}
        </div>
      </div>
    </div>
  );
}