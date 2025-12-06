import { useState, useCallback } from "react";

interface ActionDropdownProps {
  responseId: string;
  onAction: (responseId: string, action: string) => void;
}

export function ActionDropdown({ responseId, onAction }: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleAction = useCallback((action: string) => {
    console.log(`Action ${action} on response ${responseId}`);
    setIsOpen(false);
    onAction(responseId, action);
  }, [responseId, onAction]);
  
  return (
    <div className="dropdown-container relative">
      <button 
        className="dropdown-trigger p-1 hover:bg-gray-100 rounded"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        type="button"
      >
        ⋮
      </button>
      
      {isOpen && (
        <div className="dropdown-menu absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-[8rem] z-50">
          <button 
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            onClick={() => handleAction('fact-check')}
          >
            Fact Check
          </button>
          <button 
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            onClick={() => handleAction('humanize')}
          >
            Humanize
          </button>
          <button 
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            onClick={() => handleAction('reply')}
          >
            Reply
          </button>
        </div>
      )}
    </div>
  );
}