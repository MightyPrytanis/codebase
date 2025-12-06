// Ultra-simple test component - no TypeScript, no imports, minimal React
function SimpleTest() {
  return (
    <div style={{ border: '3px solid green', padding: '20px', margin: '20px' }}>
      <h2>SIMPLE TEST</h2>
      <button 
        onClick={() => alert('BUTTON WORKS!')}
        style={{ 
          padding: '15px 25px', 
          fontSize: '16px',
          backgroundColor: 'red',
          color: 'white',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        CLICK ME
      </button>
    </div>
  );
}

export default SimpleTest;