/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState, useEffect } from "react";
import "@/styles/dashboard-html.css";

export default function FooterBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    // Auto-hide after 5 seconds if not hovering
    if (isOpen && !isHovering) {
      const timer = setTimeout(() => setIsOpen(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isHovering]);

  return (
    <>
      {/* Persistent Tab - slides up when mouse approaches bottom edge */}
      {!isOpen && (
        <div 
          className="footer-banner-tab"
          onMouseEnter={() => setIsOpen(true)}
        >
          <div className="footer-tab-content">
            <span>Legal Notice</span>
          </div>
        </div>
      )}

      {/* Banner */}
      <div
        className={`footer-banner ${isOpen ? 'open' : ''}`}
        onMouseEnter={() => {
          setIsOpen(true);
          setIsHovering(true);
        }}
        onMouseLeave={() => {
          setIsHovering(false);
        }}
      >
        <div className="footer-banner-content">
          <div className="footer-banner-text">
            <p>
              <strong>AI-generated content is subject to error</strong> and may be incomplete or inaccurate. 
              Always verify all information and research results before use, especially for legal or confidential matters. 
              The developers and Cognisint, LLC expressly disclaim liability for any harm or loss caused by AI errors. 
              For details, review our <a href="/assets/ai-errors-policy.html" target="_blank">AI Errors, Fraud, and Abuse Policy</a>.
            </p>
            <div className="footer-banner-links">
              <strong>Copyright 2025 Cognisint LLC</strong> | 
              <span style={{ display: 'none' }}>LexFiat@cognisint.com</span>
              <a href="mailto:LexFiat@cognisint.com" style={{ color: '#60A5FA', textDecoration: 'none' }}>
                Contact: LexFiat@cognisint.com
              </a>
            </div>
          </div>
          <button className="close-footer-banner" onClick={() => setIsOpen(false)}>×</button>
        </div>
      </div>
    </>
  );

}