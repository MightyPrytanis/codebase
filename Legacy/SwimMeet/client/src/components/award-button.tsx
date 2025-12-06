import { useState, useCallback } from "react";

interface AwardButtonProps {
  responseId: string;
  awardType: string;
  onAward: (responseId: string, awardType: string) => void;
}

export function AwardButton({ responseId, awardType, onAward }: AwardButtonProps) {
  const [isAwarded, setIsAwarded] = useState(false);
  
  const handleAward = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log(`Awarding ${awardType} to ${responseId}`);
    
    setIsAwarded(true);
    onAward(responseId, awardType);
    
    // Visual feedback
    setTimeout(() => setIsAwarded(false), 2000);
  }, [responseId, awardType, onAward]);
  
  return (
    <button 
      className={`award-button ${awardType} ${isAwarded ? 'awarded' : ''} px-2 py-1 rounded m-1 border-2 font-bold transition-all ${
        awardType === 'gold' ? 'bg-yellow-400 border-yellow-600 hover:bg-yellow-500' :
        awardType === 'silver' ? 'bg-gray-300 border-gray-500 hover:bg-gray-400' :
        awardType === 'bronze' ? 'bg-orange-400 border-orange-600 hover:bg-orange-500' :
        awardType === 'finished' ? 'bg-green-400 border-green-600 hover:bg-green-500' :
        awardType === 'quit' ? 'bg-red-400 border-red-600 hover:bg-red-500' :
        awardType === 'titanic' ? 'bg-blue-400 border-blue-600 hover:bg-blue-500' : 'bg-gray-200'
      }`}
      onClick={handleAward}
      type="button"
    >
      {awardType.toUpperCase()}
      {isAwarded && ' ✓'}
    </button>
  );
}