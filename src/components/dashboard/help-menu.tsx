import { useState } from "react";
import { X, ExternalLink, Book, Code, Palette, HelpCircle } from "lucide-react";

interface HelpMenuProps {
  onClose: () => void;
}

const documentationLinks = [
  {
    title: "Project Overview & Philosophy",
    description: "Vision, philosophy, and business context",
    url: "https://claude.ai/public/artifacts/f29d9053-9d24-4770-a98f-e0e1b3120057",
    icon: Book,
    audience: "Stakeholders, users, decision-makers"
  },
  {
    title: "Technical Implementation Guide", 
    description: "Complete technical specification for development",
    url: "https://claude.ai/public/artifacts/8df7b220-0366-4bb2-9344-20c1b87a8c94",
    icon: Code,
    audience: "Developers, technical implementers, AI assistants"
  },
  {
    title: "Design & User Experience Specifications",
    description: "Visual design and user interface standards", 
    url: "https://claude.ai/public/artifacts/ea1a05f0-681d-468b-aef4-f9423968d3a4",
    icon: Palette,
    audience: "Designers, developers, anyone implementing the UI"
  },
  {
    title: "Project Documentation Index",
    description: "Overview of all documentation and how to use it",
    url: "https://claude.ai/public/artifacts/11912926-a020-4ec1-807d-3b77e0809e01", 
    icon: HelpCircle,
    audience: "All project stakeholders"
  }
];

export default function HelpMenu({ onClose }: HelpMenuProps) {
  return (
    <div className="fixed inset-0 bg-primary-dark bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-card-dark rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-border-gray">
        {/* Header */}
        <div className="bg-primary-light px-6 py-4 border-b border-accent-gold">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-primary">LexFiat Documentation</h2>
              <p className="text-sm text-accent-gold font-medium">Complete project documentation and guides</p>
            </div>
            <button 
              onClick={onClose}
              className="text-primary hover:text-accent-gold transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Documentation Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documentationLinks.map((doc, index) => {
              const IconComponent = doc.icon;
              
              return (
                <a
                  key={index}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-card-light p-6 rounded-lg border border-border-gray hover:border-accent-gold transition-all duration-300 hover:shadow-lg group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-accent-gold bg-opacity-20 rounded-lg flex items-center justify-center border-2 border-accent-gold group-hover:bg-accent-gold group-hover:text-primary-dark transition-all duration-300">
                      <IconComponent className="h-6 w-6 text-accent-gold group-hover:text-primary-dark" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-bold text-primary group-hover:text-accent-gold transition-colors">
                          {doc.title}
                        </h3>
                        <ExternalLink className="h-4 w-4 text-secondary group-hover:text-accent-gold transition-colors" />
                      </div>
                      
                      <p className="text-sm text-secondary mb-3">
                        {doc.description}
                      </p>
                      
                      <div className="text-xs text-accent-gold font-medium">
                        For: {doc.audience}
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Project Status */}
          <div className="mt-8 bg-primary-light p-6 rounded-lg border border-accent-gold">
            <h3 className="text-lg font-bold text-primary mb-4">Project Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-secondary">Domain:</span>
                <span className="text-primary font-semibold ml-2">LexFiat.org (registered)</span>
              </div>
              <div>
                <span className="text-secondary">Phase:</span>
                <span className="text-primary font-semibold ml-2">Pre-MVP UI Prototype</span>
              </div>
              <div>
                <span className="text-secondary">Target User:</span>
                <span className="text-primary font-semibold ml-2">Mekel Miller (Michigan Attorney)</span>
              </div>
              <div>
                <span className="text-secondary">Timeline:</span>
                <span className="text-primary font-semibold ml-2">8-12 weeks to working prototype</span>
              </div>
            </div>
          </div>

          {/* Core Principles */}
          <div className="mt-6 bg-card-light p-6 rounded-lg border border-border-gray">
            <h3 className="text-lg font-bold text-primary mb-4">Key Project Principles</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-accent-gold rounded-full mt-2"></div>
                <span className="text-secondary"><strong className="text-primary">Integration over replacement</strong> - Work with existing tools (Gmail, Clio, Claude)</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-accent-gold rounded-full mt-2"></div>
                <span className="text-secondary"><strong className="text-primary">Human-centered automation</strong> - Enhance attorney capabilities, don't replace judgment</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-accent-gold rounded-full mt-2"></div>
                <span className="text-secondary"><strong className="text-primary">Assembly line workflow</strong> - Clear, logical progression from intake to output</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-accent-gold rounded-full mt-2"></div>
                <span className="text-secondary"><strong className="text-primary">Michigan-specific implementation</strong> - Focus on local courts and practice requirements</span>
              </div>
            </div>
          </div>

          {/* Philosophy Quote */}
          <div className="mt-6 text-center">
            <blockquote className="text-lg font-medium text-accent-gold italic">
              "Automation enables better client relationships rather than replacing them."
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}