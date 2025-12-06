import { useState, useCallback } from "react";

export function EventDiagnostic() {
  const [testCount, setTestCount] = useState(0);
  const [buttonStates, setButtonStates] = useState<Record<string, number>>({});
  
  const testClick = useCallback((buttonName: string) => {
    console.log(`${buttonName} clicked!`);
    console.log('Current testCount:', testCount);
    console.log('Current buttonStates:', buttonStates);
    
    setTestCount(prev => {
      console.log('setTestCount prev:', prev, 'new:', prev + 1);
      return prev + 1;
    });
    
    setButtonStates(prev => {
      const newStates = {
        ...prev,
        [buttonName]: (prev[buttonName] || 0) + 1
      };
      console.log('setButtonStates prev:', prev, 'new:', newStates);
      return newStates;
    });
  }, [testCount, buttonStates]);

  const handleGoldClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Gold button clicked - raw event');
    testClick('gold');
  }, [testClick]);

  const handleDropdownClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Dropdown button clicked - raw event');
    testClick('dropdown');
  }, [testClick]);

  const handleTabClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Tab button clicked - raw event');
    testClick('tab');
  }, [testClick]);
  
  return (
    <div style={{border: '2px solid red', padding: '10px', margin: '10px', backgroundColor: 'white'}}>
      <h3 style={{margin: '0 0 10px 0'}}>EVENT HANDLER TEST - Total Clicks: {testCount}</h3>
      <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
        <button 
          onClick={handleGoldClick}
          onMouseDown={() => console.log('Gold button mousedown')}
          style={{
            margin: '0',
            padding: '10px 15px',
            backgroundColor: '#ffd700',
            border: '2px solid #ffed4e',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
          type="button"
        >
          Gold Test ({buttonStates.gold || 0})
        </button>
        <button 
          onClick={handleDropdownClick}
          onMouseDown={() => console.log('Dropdown button mousedown')}
          style={{
            margin: '0',
            padding: '10px 15px',
            backgroundColor: '#c0c0c0',
            border: '2px solid #d3d3d3',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
          type="button"
        >
          Dropdown Test ({buttonStates.dropdown || 0})
        </button>
        <button 
          onClick={handleTabClick}
          onMouseDown={() => console.log('Tab button mousedown')}
          style={{
            margin: '0',
            padding: '10px 15px',
            backgroundColor: '#cd7f32',
            border: '2px solid #daa520',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
          type="button"
        >
          Tab Test ({buttonStates.tab || 0})
        </button>
      </div>
    </div>
  );
}