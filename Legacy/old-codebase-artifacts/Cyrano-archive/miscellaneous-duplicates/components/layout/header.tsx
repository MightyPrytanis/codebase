import { Bell, Settings, Wifi, Clock, HelpCircle } from "lucide-react";
import { useState } from "react";
import HelpMenu from "../dashboard/help-menu";
import { Logo } from "@/components/ui/logo";

interface HeaderProps {
  attorney?: {
    id: string;
    name: string;
    email: string;
    specialization?: string;
  };
}

export default function Header({ attorney }: HeaderProps) {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <header className="bg-primary-light border-b border-accent-gold px-8 py-6 shadow-lg" style={{ height: '100px' }}>
      <div className="flex items-center justify-between max-w-7xl mx-auto h-full">
        <div className="flex items-center space-x-12">
          {/* LexFiat Logo - New Simplified Edison Bulb Design */}
          <div className="flex items-center space-x-4">
            <Logo size="lg" />
            <div>
              <p className="text-sm text-accent-gold font-semibold -mt-1 tracking-wide">"Legal Intelligence"</p>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="/" className="text-accent-gold font-semibold border-b-2 border-accent-gold pb-1">
              Dashboard
            </a>
            <a href="/logo-showcase" className="text-secondary hover:text-accent-gold transition-colors">
              Logo Showcase
            </a>
            <button 
              onClick={() => setShowHelp(true)}
              className="text-secondary hover:text-accent-gold transition-colors flex items-center space-x-1"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Help</span>
            </button>
          </nav>
        </div>

        {/* Integration Status Pills */}
        <div className="flex items-center space-x-4">
          {/* Gmail Status */}
          <div className="status-pill">
            <div className="w-2 h-2 bg-status-success rounded-full animate-pulse"></div>
            <span className="text-sm text-primary font-medium">Gmail Live</span>
          </div>
          
          {/* Claude Status */}
          <div className="status-pill">
            <div className="w-2 h-2 bg-status-processing rounded-full animate-pulse"></div>
            <span className="text-sm text-primary font-medium">Claude Connected</span>
          </div>
          
          {/* Clio Status */}
          <div className="status-pill">
            <div className="w-2 h-2 bg-status-warning rounded-full"></div>
            <span className="text-sm text-primary font-medium">Clio Syncing</span>
          </div>

          {/* Attorney Profile */}
          <div className="flex items-center space-x-3 bg-card-light px-4 py-2 rounded-lg border border-border-gray">
            <div className="w-10 h-10 rounded-full bg-accent-gold bg-opacity-20 flex items-center justify-center border-2 border-accent-gold">
              <span className="text-sm font-bold text-accent-gold">
                {attorney?.name ? attorney.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'MM'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-sm text-primary">
                {attorney?.name || "Mekel Miller, Esq."}
              </p>
              <p className="text-xs text-secondary">
                {attorney?.specialization || "Family Law"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Help Menu Modal */}
      {showHelp && (
        <HelpMenu onClose={() => setShowHelp(false)} />
      )}
    </header>
  );
}