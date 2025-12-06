// Pure HTML test - bypassing React entirely
export function RawHtmlTest() {
  return (
    <div 
      style={{ border: '3px solid purple', padding: '20px', margin: '20px' }}
      dangerouslySetInnerHTML={{
        __html: `
          <h2>RAW HTML TEST</h2>
          <button onclick="alert('RAW HTML WORKS!')" style="padding: 15px 25px; font-size: 16px; background-color: purple; color: white; border: none; cursor: pointer;">
            RAW HTML BUTTON
          </button>
          <br><br>
          <button onclick="console.log('Raw HTML console test')" style="padding: 15px 25px; font-size: 16px; background-color: orange; color: white; border: none; cursor: pointer;">
            RAW CONSOLE LOG
          </button>
        `
      }}
    />
  );
}