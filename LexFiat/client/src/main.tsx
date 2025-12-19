import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

try {
  createRoot(rootElement).render(<App />);
} catch (error) {
  console.error("Failed to render app:", error);
  // Sanitize error message to prevent XSS
  // Apply iterative replacement to avoid incomplete multi-character sanitization
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  let sanitizedMessage = errorMessage;
  let previous: string;
  
  // Apply entity encoding repeatedly until no changes occur
  do {
    previous = sanitizedMessage;
    sanitizedMessage = sanitizedMessage
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  } while (sanitizedMessage !== previous);
  
  rootElement.innerHTML = `
    <div style="color: white; padding: 20px; font-family: monospace;">
      <h1>Error Loading LexFiat</h1>
      <p>${sanitizedMessage}</p>
      <p>Check the browser console for more details.</p>
    </div>
  `;
}