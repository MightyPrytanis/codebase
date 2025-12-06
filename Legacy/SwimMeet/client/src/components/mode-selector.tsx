import { useCallback } from "react";

interface ModeSelectorProps {
  currentMode: string;
  onModeChange: (mode: string) => void;
}

export function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  const modes = ['dive', 'turn', 'work'];
  
  const handleModeChange = useCallback((mode: string) => {
    console.log(`Switching to ${mode} mode`);
    onModeChange(mode);
  }, [onModeChange]);
  
  return (
    <div className="mode-selector grid w-full grid-cols-3 gap-4 bg-gradient-to-r from-blue-100 to-blue-50 p-2 rounded-lg">
      {modes.map(mode => (
        <button
          key={mode}
          className={`mode-tab flex flex-col items-center space-y-2 py-6 rounded-lg transition-all hover:scale-105 ${
            currentMode === mode 
              ? mode === 'dive' ? 'bg-blue-600 text-white' :
                mode === 'turn' ? 'bg-green-600 text-white' :
                'bg-purple-600 text-white'
              : 'hover:bg-white/50'
          }`}
          onClick={(e) => {
            e.preventDefault();
            handleModeChange(mode);
          }}
          type="button"
        >
          <div className="text-center">
            <span className="font-varsity text-lg">{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
            <p className="text-xs opacity-75">
              {mode === 'dive' ? 'Direct Analysis' : 
               mode === 'turn' ? 'Verification' : 
               'Collaboration'}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}