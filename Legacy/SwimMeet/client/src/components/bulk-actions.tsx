import { useCallback } from "react";

interface BulkActionsProps {
  selectedResponses: string[];
  onBulkAction: (action: string, selectedResponses: string[]) => void;
}

export function BulkActions({ selectedResponses, onBulkAction }: BulkActionsProps) {
  const handleBulkAction = useCallback((action: string) => {
    console.log(`Bulk action ${action} on:`, selectedResponses);
    onBulkAction(action, selectedResponses);
  }, [selectedResponses, onBulkAction]);
  
  return (
    <div className="bulk-actions flex gap-2 p-4 bg-gray-50 rounded-lg">
      <button 
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => handleBulkAction('submit-all')}
        disabled={selectedResponses.length === 0}
      >
        Submit All to Group ({selectedResponses.length})
      </button>
      <button 
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        onClick={() => handleBulkAction('fact-check-all')}
        disabled={selectedResponses.length === 0}
      >
        Fact Check All
      </button>
      <button 
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        onClick={() => handleBulkAction('export')}
        disabled={selectedResponses.length === 0}
      >
        Export Responses
      </button>
    </div>
  );
}