import { AlertTriangle } from "lucide-react";

interface AlertsBannerProps {
  redFlags: Array<{
    id: string;
    type: string;
    description: string;
    severity: string;
    caseId?: string;
  }>;
}

export default function AlertsBanner({ redFlags }: AlertsBannerProps) {
  const criticalFlags = redFlags.filter(flag => flag.severity === 'critical');
  const highFlags = redFlags.filter(flag => flag.severity === 'high');

  return (
    <div className="bg-alert-red bg-opacity-10 border border-alert-red rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="text-alert-red mt-1 h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-alert-red mb-1">
            {redFlags.length} Urgent Documents Require Immediate Attention
          </h3>
          <div className="text-sm text-gray-300 space-y-1">
            {criticalFlags.length > 0 && (
              <p className="text-alert-red font-medium">
                CRITICAL ({criticalFlags.length}): {criticalFlags.slice(0, 2).map(flag => flag.description).join(" • ")}
                {criticalFlags.length > 2 && ` • +${criticalFlags.length - 2} more`}
              </p>
            )}
            {highFlags.length > 0 && (
              <p>
                HIGH PRIORITY ({highFlags.length}): {highFlags.slice(0, 2).map(flag => flag.description).join(" • ")}
                {highFlags.length > 2 && ` • +${highFlags.length - 2} more`}
              </p>
            )}
          </div>
          <button className="text-sm text-aqua hover:underline mt-2">
            Review All Alerts →
          </button>
        </div>
      </div>
    </div>
  );
}
