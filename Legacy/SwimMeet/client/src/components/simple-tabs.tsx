import { useState, useEffect, useRef } from "react";

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function SimpleTabs({ defaultValue, value, onValueChange, children, className = "" }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const currentValue = value !== undefined ? value : internalValue;
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  useEffect(() => {
    const tabsContainer = tabsRef.current;
    if (!tabsContainer) return;

    const handleTabChange = (e: CustomEvent) => {
      handleValueChange(e.detail.value);
    };

    tabsContainer.addEventListener('tab-change', handleTabChange as EventListener);
    
    return () => {
      tabsContainer.removeEventListener('tab-change', handleTabChange as EventListener);
    };
  }, []);

  useEffect(() => {
    const tabsContainer = tabsRef.current;
    if (!tabsContainer) return;

    // Show/hide content based on current value
    const allContent = tabsContainer.querySelectorAll('[data-tab-content]');
    allContent.forEach((content) => {
      const element = content as HTMLElement;
      const contentValue = element.getAttribute('data-tab-content');
      element.style.display = contentValue === currentValue ? 'block' : 'none';
    });

    // Update active state for triggers
    const allTriggers = tabsContainer.querySelectorAll('[data-tab-value]');
    allTriggers.forEach((trigger) => {
      const element = trigger as HTMLElement;
      const triggerValue = element.getAttribute('data-tab-value');
      if (triggerValue === currentValue) {
        element.classList.add('active');
        element.setAttribute('data-state', 'active');
      } else {
        element.classList.remove('active');
        element.setAttribute('data-state', 'inactive');
      }
    });
  }, [currentValue]);

  return (
    <div ref={tabsRef} className={className} data-current-tab={currentValue}>
      {children}
    </div>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function SimpleTabsList({ children, className = "" }: TabsListProps) {
  return (
    <div className={`flex ${className}`}>
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

export function SimpleTabsTrigger({ value, children, className = "", "data-testid": testId }: TabsTriggerProps) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        const tabsContainer = e.currentTarget.closest('[data-current-tab]') as HTMLElement;
        if (tabsContainer) {
          const currentTab = tabsContainer.getAttribute('data-current-tab');
          if (currentTab !== value) {
            tabsContainer.setAttribute('data-current-tab', value);
            // Trigger value change
            const event = new CustomEvent('tab-change', { detail: { value } });
            tabsContainer.dispatchEvent(event);
          }
        }
      }}
      className={className}
      data-testid={testId}
      data-tab-value={value}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function SimpleTabsContent({ value, children, className = "" }: TabsContentProps) {
  return (
    <div 
      className={className} 
      data-tab-content={value}
      style={{ display: 'none' }}
    >
      {children}
    </div>
  );
}