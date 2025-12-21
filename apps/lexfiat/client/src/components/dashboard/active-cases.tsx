import { Clock, Flag, CheckCircle, RotateCcw, Timer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import RedFlagsPanel from "./red-flags-panel";

interface ActiveCasesProps {
  cases?: Array<{
    id: string;
    title: string;
    caseNumber?: string;
    clientName: string;
    court?: string;
    caseType: string;
    status: string;
    balanceDue?: number;
    unbilledHours?: number;
    updatedAt: string;
  }>;
  redFlags?: Array<{
    id: string;
    caseId?: string;
    type: string;
    description: string;
    severity: string;
  }>;
  isLoading: boolean;
}

export default function ActiveCases({ cases, redFlags, isLoading }: ActiveCasesProps) {
  if (isLoading) {
    return (
      <>
        <div className="lg:col-span-2">
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
        <div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </>
    );
  }

  // Sample featured case (Johnson v Johnson) if no real cases
  const featuredCase = cases?.[0] || {
    id: "sample-case",
    title: "Johnson v Johnson",
    caseNumber: "21-123456-DM",
    clientName: "Sarah Johnson",
    court: "Oakland County Circuit Court",
    caseType: "Family Law",
    status: "Active",
    balanceDue: 324750, // $3,247.50 in cents
    unbilledHours: 420, // 4.2 hours in 10ths
    updatedAt: new Date().toISOString(),
  };

  const caseRedFlags = redFlags?.filter(flag => flag.caseId === featuredCase.id) || [
    {
      id: "rf1",
      type: "allegation",
      description: "New Domestic Violence Allegations: Previously undisclosed incidents mentioned in filing",
      severity: "critical",
    },
    {
      id: "rf2", 
      type: "deadline",
      description: "Emergency Custody Request: Seeking immediate removal of children",
      severity: "critical",
    },
    {
      id: "rf3",
      type: "disclosure",
      description: "Asset Concealment Claims: New evidence of hidden financial accounts",
      severity: "high",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      description: "TRO Motion Received - HIGH PRIORITY",
      detail: "Opposing counsel filed emergency motion • Response due in 48 hours",
      time: "15 minutes ago",
      severity: "critical",
    },
    {
      id: 2,
      description: "Draft Response Generated",
      detail: "AI analysis complete • Response ready for review",
      time: "18 minutes ago",
      severity: "normal",
    },
  ];

  const workflowStatus = [
    {
      name: "Email Monitoring",
      status: "Active",
      progress: 94,
      color: "bg-light-green",
      statusColor: "text-light-green",
      detail: "142 emails processed today",
    },
    {
      name: "Document Analysis", 
      status: "Processing",
      progress: 67,
      color: "bg-aqua",
      statusColor: "text-aqua",
      detail: "3 documents in queue",
    },
    {
      name: "Clio Sync",
      status: "Complete",
      progress: 100,
      color: "bg-light-green",
      statusColor: "text-light-green", 
      detail: "Last sync: 2 min ago",
    },
  ];

  const recentDocuments = [
    { name: "TRO_Motion_Johnson.pdf", status: "complete" },
    { name: "Discovery_Response_Martinez.docx", status: "processing" },
    { name: "Settlement_Offer_Davis.pdf", status: "pending" },
  ];

  return (
    <>
      {/* Featured Case: Johnson v Johnson */}
      <div className="lg:col-span-2 bg-charcoal rounded-xl p-6 border border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-warm-white">{featuredCase.title}</h3>
            <p className="text-gray-400 text-sm">
              {featuredCase.court} • {featuredCase.caseType}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-alert-red px-3 py-1 rounded-full text-xs font-medium text-white">
              TRO FILED
            </span>
            <span className="bg-navy px-3 py-1 rounded-full text-xs text-warm-white">
              {featuredCase.status}
            </span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-navy rounded-lg p-4 mb-4">
          <h4 className="font-medium mb-3 flex items-center text-warm-white">
            <Clock className="mr-2 text-aqua h-4 w-4" />
            Recent Activity
          </h4>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.severity === 'critical' ? 'bg-alert-red' : 'bg-aqua'
                }`}></div>
                <div>
                  <p className="text-sm font-medium text-warm-white">{activity.description}</p>
                  <p className="text-xs text-gray-400">{activity.detail}</p>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Red Flags Panel */}
        <RedFlagsPanel redFlags={caseRedFlags} />

        {/* Action Items */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Balance Due: <span className="text-warm-white font-medium">
              ${((featuredCase.balanceDue || 0) / 100).toFixed(2)}
            </span> • 
            Unbilled Hours: <span className="text-warm-white font-medium">
              {((featuredCase.unbilledHours || 0) / 100).toFixed(1)}
            </span>
          </div>
          <button className="bg-aqua text-navy px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-400 transition-colors">
            Review Draft Response
          </button>
        </div>
      </div>

      {/* Workflow Status */}
      <div className="bg-charcoal rounded-xl p-6 border border-gray-600">
        <h3 className="text-lg font-semibold mb-4 text-warm-white">Workflow Status</h3>
        
        <div className="space-y-4">
          {workflowStatus.map((workflow) => (
            <div key={workflow.name} className="bg-navy rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-warm-white">{workflow.name}</span>
                <span className={`text-xs ${workflow.statusColor}`}>{workflow.status}</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className={`${workflow.color} h-2 rounded-full transition-all duration-300`} 
                  style={{ width: `${workflow.progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 mt-1">{workflow.detail}</p>
            </div>
          ))}
        </div>

        {/* Recent Documents */}
        <div className="mt-6">
          <h4 className="font-medium mb-3 text-warm-white">Recent Documents</h4>
          <div className="space-y-2">
            {recentDocuments.map((doc, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-300 truncate">{doc.name}</span>
                {doc.status === 'complete' && <CheckCircle className="text-light-green h-4 w-4" />}
                {doc.status === 'processing' && <RotateCcw className="text-aqua h-4 w-4 animate-spin" />}
                {doc.status === 'pending' && <Timer className="text-gray-400 h-4 w-4" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
