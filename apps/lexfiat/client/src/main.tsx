import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { createSafeTextElement, escapeHtml } from "./lib/dom-xss-security";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

try {
  createRoot(rootElement).render(<App />);
} catch (error) {
  console.error("Failed to render app:", error);
  
  // Use safe DOM manipulation instead of innerHTML
  // Clear existing content
  rootElement.textContent = '';
  
  // Create error container
  const container = document.createElement("div");
  container.style.cssText = "color: white; padding: 20px; font-family: monospace;";
  
  // Create heading safely
  const heading = createSafeTextElement("h1", "Error Loading LexFiat");
  
  // Create error message paragraph safely
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  const messagePara = createSafeTextElement("p", errorMessage);
  
  // Create help text paragraph
  const helpPara = createSafeTextElement("p", "Check the browser console for more details.");
  
  // Append elements safely
  container.appendChild(heading);
  container.appendChild(messagePara);
  container.appendChild(helpPara);
  rootElement.appendChild(container);
}