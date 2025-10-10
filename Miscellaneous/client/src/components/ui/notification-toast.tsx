import { useState, useEffect } from "react";
import { X, Mail } from "lucide-react";

interface NotificationToastProps {
  show: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onAction?: () => void;
  actionText?: string;
}

export default function NotificationToast({ 
  show, 
  title, 
  message, 
  onClose, 
  onAction, 
  actionText = "Review Now →" 
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show && !isVisible) return null;

  return (
    <div 
      className={`fixed bottom-6 right-6 bg-charcoal border border-aqua rounded-lg p-4 max-w-sm shadow-2xl transform transition-transform duration-300 z-50 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-aqua bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Mail className="text-aqua h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm text-warm-white">{title}</p>
          <p className="text-xs text-gray-400 mt-1">{message}</p>
          {onAction && (
            <button 
              onClick={onAction}
              className="text-xs text-aqua hover:underline mt-2"
            >
              {actionText}
            </button>
          )}
        </div>
        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-gray-400 hover:text-gray-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
