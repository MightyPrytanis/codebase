import { Search, Gavel, AlertTriangle, FolderOpen, Handshake, Plus, RefreshCw, Settings } from "lucide-react";

export default function Sidebar() {
  const workflowModules = [
    { icon: Search, name: "Legal Document Intelligence", active: true, color: "text-aqua" },
    { icon: Gavel, name: "Case Initiation", active: false, color: "text-gray-400" },
    { icon: AlertTriangle, name: "Emergency Response", active: false, color: "text-alert-red" },
    { icon: FolderOpen, name: "Discovery Management", active: false, color: "text-gray-400" },
    { icon: Handshake, name: "Settlement Negotiation", active: false, color: "text-gray-400" },
  ];

  const quickActions = [
    { icon: Plus, name: "New Case Analysis", color: "text-aqua" },
    { icon: RefreshCw, name: "Refresh Gmail", color: "text-aqua" },
    { icon: Settings, name: "Module Settings", color: "text-aqua" },
  ];

  const apiConnections = [
    { name: "Gmail API", status: "Active", color: "text-light-green" },
    { name: "Clio API", status: "Connected", color: "text-light-green" },
    { name: "Westlaw", status: "Standby", color: "text-aqua" },
  ];

  return (
    <aside className="w-60 bg-charcoal border-r border-gray-600 p-5">
      {/* Workflow Modules */}
      <div className="mb-6">
        <h3 className="text-base font-semibold mb-3 text-warm-white">Active Modules</h3>
        <div className="space-y-2">
          {workflowModules.slice(0, 4).map((module) => {
            const IconComponent = module.icon;
            return (
              <div
                key={module.name}
                className={`flex items-center space-x-2 p-2 rounded-md transition-colors cursor-pointer ${
                  module.active 
                    ? 'bg-navy border border-aqua' 
                    : 'bg-gray-700 hover:bg-navy'
                }`}
              >
                <IconComponent className={`h-3 w-3 ${module.color}`} />
                <span className="text-xs text-warm-white">{module.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h3 className="text-base font-semibold mb-3 text-warm-white">Quick Actions</h3>
        <div className="space-y-1">
          {quickActions.slice(0, 2).map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.name}
                className="w-full text-left p-2 text-xs hover:bg-navy rounded-md transition-colors flex items-center space-x-2"
              >
                <IconComponent className={`h-3 w-3 ${action.color}`} />
                <span className="text-warm-white">{action.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* API Connections Status */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-400">Connections</h4>
        <div className="space-y-1">
          {apiConnections.map((connection) => (
            <div key={connection.name} className="flex items-center justify-between text-xs">
              <span className="text-warm-white">{connection.name}</span>
              <div className="flex items-center space-x-1">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  connection.status === 'Active' || connection.status === 'Connected' 
                    ? 'bg-light-green' 
                    : 'bg-aqua'
                }`}></div>
                <span className={connection.color}>{connection.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
