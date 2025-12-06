import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";

interface DropdownProps {
  children: React.ReactNode;
  trigger?: React.ReactNode;
  align?: "start" | "end";
}

export function SimpleDropdown({ children, trigger, align = "end" }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 text-slate-400 hover:text-slate-600 rounded"
      >
        {trigger || <MoreVertical className="h-4 w-4" />}
      </button>
      
      {isOpen && (
        <div 
          className={`absolute top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-[8rem] z-50 ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          <div className="py-1">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export function SimpleDropdownItem({ onClick, children, className = "" }: DropdownItemProps) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center ${className}`}
    >
      {children}
    </button>
  );
}