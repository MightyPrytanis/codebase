/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { X, ExternalLink, Book, Code, HelpCircle, FileText } from "lucide-react";

interface HelpMenuProps {
  onClose: () => void;
}

const documentationLinks = [
  {
    title: "Cyrano Engines User Guide",
    description: "User-facing guide to Cyrano engines and modules",
    url: "/docs/guides/CYRANO_ENGINES_USER_GUIDE.md",
    icon: Book,
    audience: "All users"
  },
  {
    title: "Arkiver Documentation",
    description: "Complete Arkiver documentation and guides",
    url: "#",
    icon: FileText,
    audience: "All users"
  },
  {
    title: "Project Documentation Index",
    description: "Overview of all documentation and how to use it",
    url: "#",
    icon: HelpCircle,
    audience: "All project stakeholders"
  }
];

export default function HelpMenu({ onClose }: HelpMenuProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#2C3E50' }}>Arkiver Documentation</h2>
              <p className="text-sm font-medium" style={{ color: '#5B8FA3' }}>Complete project documentation and guides</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Documentation Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documentationLinks.map((doc, index) => {
              const IconComponent = doc.icon;
              
              return (
                <a
                  key={index}
                  href={doc.url}
                  target={doc.url.startsWith('http') ? '_blank' : undefined}
                  rel={doc.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-500 transition-all duration-300 hover:shadow-lg group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center border-2 group-hover:bg-blue-50 transition-all duration-300" style={{ borderColor: '#5B8FA3' }}>
                      <IconComponent className="h-6 w-6" style={{ color: '#5B8FA3' }} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-bold group-hover:text-blue-600 transition-colors" style={{ color: '#2C3E50' }}>
                          {doc.title}
                        </h3>
                        {doc.url.startsWith('http') && (
                          <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        {doc.description}
                      </p>
                      
                      <div className="text-xs font-medium" style={{ color: '#5B8FA3' }}>
                        For: {doc.audience}
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Project Status */}
          <div className="mt-8 bg-gray-50 p-6 rounded-lg border" style={{ borderColor: '#5B8FA3' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#2C3E50' }}>Project Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Phase:</span>
                <span className="font-semibold ml-2" style={{ color: '#2C3E50' }}>Beta Release</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold ml-2" style={{ color: '#2C3E50' }}>Active Development</span>
              </div>
            </div>
          </div>

          {/* Core Principles */}
          <div className="mt-6 bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#2C3E50' }}>Key Features</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full mt-2" style={{ backgroundColor: '#5B8FA3' }}></div>
                <span className="text-gray-700"><strong style={{ color: '#2C3E50' }}>Document Processing</strong> - Upload and extract structured data from documents</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full mt-2" style={{ backgroundColor: '#5B8FA3' }}></div>
                <span className="text-gray-700"><strong style={{ color: '#2C3E50' }}>AI Insights</strong> - Generate insights using advanced AI models</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full mt-2" style={{ backgroundColor: '#5B8FA3' }}></div>
                <span className="text-gray-700"><strong style={{ color: '#2C3E50' }}>Integrity Monitoring</strong> - Monitor AI outputs for drift and bias</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full mt-2" style={{ backgroundColor: '#5B8FA3' }}></div>
                <span className="text-gray-700"><strong style={{ color: '#2C3E50' }}>Workflow Archaeology</strong> - Reconstruct processing workflows</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

}
)