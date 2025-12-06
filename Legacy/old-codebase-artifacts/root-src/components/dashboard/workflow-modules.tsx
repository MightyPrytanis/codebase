import { Brain, AlertTriangle, FolderOpen, Handshake, Gavel, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface WorkflowModulesProps {
  dashboardStats?: {
    documentsProcessed: number;
    redFlagsFound: number;
    responsesGenerated: number;
    pendingRequests: number;
    upcomingDeadlines: number;
    newConsultations: number;
    intakeForms: number;
    monthlyRevenue: number;
    averageResolutionTime: number;
  };
  isLoading: boolean;
}

export default function WorkflowModules({ dashboardStats, isLoading }: WorkflowModulesProps) {
  const modules = [
    {
      title: "Document Intelligence",
      description: "AI-powered document analysis",
      icon: Brain,
      borderColor: "border-aqua",
      iconBg: "bg-aqua bg-opacity-20",
      iconColor: "text-aqua",
      buttonColor: "bg-navy hover:bg-gray-700 text-aqua",
      stats: [
        { label: "Processed Today", value: dashboardStats?.documentsProcessed || 47 },
        { label: "Red Flags Found", value: dashboardStats?.redFlagsFound || 8, color: "text-alert-red" },
        { label: "Responses Generated", value: dashboardStats?.responsesGenerated || 12, color: "text-light-green" },
      ],
      buttonText: "View Analysis Dashboard",
      active: true,
    },
    {
      title: "Emergency Response",
      description: "TRO, injunctions, urgent motions",
      icon: AlertTriangle,
      borderColor: "border-alert-red",
      iconBg: "bg-alert-red bg-opacity-20",
      iconColor: "text-alert-red",
      buttonColor: "bg-alert-red hover:bg-red-600 text-white",
      alert: "ACTIVE: Johnson TRO",
      alertDetail: "Response deadline: 47 hours",
      buttonText: "Handle Emergency Filing",
      active: true,
    },
    {
      title: "Discovery Management",
      description: "Automated discovery tracking",
      icon: FolderOpen,
      borderColor: "border-gray-600",
      iconBg: "bg-gray-600",
      iconColor: "text-gray-300",
      buttonColor: "bg-navy hover:bg-gray-700 text-gray-300",
      stats: [
        { label: "Pending Requests", value: dashboardStats?.pendingRequests || 3 },
        { label: "Upcoming Deadlines", value: dashboardStats?.upcomingDeadlines || 2, color: "text-yellow-400" },
      ],
      buttonText: "Manage Discovery",
      active: false,
    },
    {
      title: "Settlement Negotiation",
      description: "Mediation & settlement support",
      icon: Handshake,
      borderColor: "border-light-green",
      iconBg: "bg-light-green bg-opacity-20",
      iconColor: "text-light-green",
      buttonColor: "bg-light-green hover:bg-green-400 text-navy",
      alert: "NEW: Davis Settlement Offer",
      alertDetail: "$75,000 - Analysis ready",
      buttonText: "Review Settlement",
      active: true,
    },
    {
      title: "Case Initiation",
      description: "New case workflow automation",
      icon: Gavel,
      borderColor: "border-gray-600",
      iconBg: "bg-gray-600",
      iconColor: "text-gray-300",
      buttonColor: "bg-navy hover:bg-gray-700 text-gray-300",
      stats: [
        { label: "New Consultations", value: dashboardStats?.newConsultations || 2 },
        { label: "Intake Forms", value: dashboardStats?.intakeForms || 1, color: "text-aqua" },
      ],
      buttonText: "Start New Case",
      active: false,
    },
    {
      title: "Analytics & Insights",
      description: "Practice performance metrics",
      icon: BarChart3,
      borderColor: "border-gray-600",
      iconBg: "bg-gray-600",
      iconColor: "text-gray-300",
      buttonColor: "bg-navy hover:bg-gray-700 text-gray-300",
      stats: [
        { label: "Monthly Revenue", value: `+${dashboardStats?.monthlyRevenue || 15.3}%`, color: "text-light-green" },
        { label: "Case Resolution Time", value: `${dashboardStats?.averageResolutionTime || 142} days avg` },
      ],
      buttonText: "View Analytics",
      active: false,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {modules.map((module) => {
        const IconComponent = module.icon;
        
        return (
          <div key={module.title} className={`bg-charcoal rounded-lg p-5 border ${module.borderColor}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-warm-white">{module.title}</h3>
                <p className="text-xs text-gray-400">{module.description}</p>
              </div>
              <div className={`w-10 h-10 ${module.iconBg} rounded-lg flex items-center justify-center`}>
                <IconComponent className={`${module.iconColor} h-5 w-5`} />
              </div>
            </div>

            {/* Alert Section */}
            {module.alert && (
              <div className={`${module.iconBg} rounded-md p-2 mb-3`}>
                <p className={`text-xs ${module.iconColor} font-medium`}>{module.alert}</p>
                <p className="text-xs text-gray-300 mt-0.5">{module.alertDetail}</p>
              </div>
            )}

            {/* Stats Section - Simplified */}
            {module.stats && (
              <div className="space-y-2 mb-3">
                {module.stats.slice(0, 2).map((stat, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{stat.label}</span>
                    <span className={`font-medium ${stat.color || 'text-warm-white'}`}>
                      {typeof stat.value === 'number' ? stat.value : stat.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button className={`w-full ${module.buttonColor} transition-colors py-2 rounded-md text-xs font-medium`}>
              {module.buttonText}
            </button>
          </div>
        );
      })}
    </div>
  );
}
