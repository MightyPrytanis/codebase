import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DebugTest() {
  const [clickCount, setClickCount] = useState(0);
  const [testMessage, setTestMessage] = useState("React Event Test");

  const handleClick = () => {
    setClickCount(prev => prev + 1);
    setTestMessage(`Clicked ${clickCount + 1} times - React is working!`);
    console.log("Button clicked successfully!");
  };

  return (
    <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg z-50">
      <h3 className="font-bold">Debug Test</h3>
      <p data-testid="debug-message">{testMessage}</p>
      <Button 
        onClick={handleClick}
        className="mt-2 bg-white text-red-500 hover:bg-gray-100"
        data-testid="debug-button"
      >
        Test Click ({clickCount})
      </Button>
    </div>
  );
}