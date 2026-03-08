import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface TickerItem {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  text: string;
  time: string;
  onClick?: () => void;
}

interface PriorityTickerProps {
  items?: TickerItem[];
}

const defaultItems: TickerItem[] = [
  {
    id: 'emergency-motion-001',
    priority: 'critical',
    text: 'Johnson v Johnson - Emergency Motion Filed',
    time: '2 min ago'
  },
  {
    id: 'hearing-notice-002',
    priority: 'high',
    text: 'Hartley Estate - Court Hearing Notice',
    time: '15 min ago'
  },
  {
    id: 'document-review-003',
    priority: 'medium',
    text: 'Smith Family Trust - Document Review',
    time: '1 hour ago'
  },
  {
    id: 'system-status-004',
    priority: 'low',
    text: 'System: All AI providers operational',
    time: '2 hours ago'
  }
];

export default function PriorityTicker({ items = defaultItems }: PriorityTickerProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (items.length === 0) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) return null;

  const getPriorityClasses = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-[#B35C5C] border-[#9E4B4B] border-l-[#8F3F3F]';
      case 'high':
        return 'bg-[#B56C6C] border-[#9E4B4B]';
      case 'medium':
        return 'bg-[#B56C6C] border-[#9E4B4B]';
      case 'low':
        return 'bg-[#B56C6C] border-[#9E4B4B]';
      default:
        return 'bg-[#B56C6C] border-[#9E4B4B]';
    }
  };

  return (
    <div className="bg-[#B35C5C] border-4 border-[#9E4B4B] border-l-8 border-l-[#8F3F3F] rounded-none p-4 mb-4 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-white" />
        <h3 className="text-xl font-semibold text-white">Priority Alerts</h3>
      </div>
      
      <div className="h-[42px] relative overflow-hidden">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`absolute top-0 left-0 right-0 flex items-center gap-4 p-2 ${getPriorityClasses(item.priority)} rounded transition-all duration-500 ${
              index === activeIndex
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-5'
            }`}
            onClick={item.onClick}
            style={{ cursor: item.onClick ? 'pointer' : 'default' }}
          >
            <AlertTriangle className="h-4 w-4 text-white flex-shrink-0" />
            <span className="text-white font-semibold flex-1">{item.text}</span>
            <span className="text-white text-sm flex-shrink-0">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );

}
