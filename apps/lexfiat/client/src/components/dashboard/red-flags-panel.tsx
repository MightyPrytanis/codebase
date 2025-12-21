import { Flag } from "lucide-react";

interface RedFlagsPanelProps {
  redFlags: Array<{
    id: string;
    type: string;
    description: string;
    severity: string;
  }>;
}

export default function RedFlagsPanel({ redFlags }: RedFlagsPanelProps) {
  if (!redFlags || redFlags.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-red-500 to-orange-500 bg-opacity-10 border border-alert-red rounded-lg p-4 mb-4">
      <h4 className="font-medium mb-3 text-alert-red flex items-center">
        <Flag className="mr-2 h-4 w-4" />
        Red Flags Detected
      </h4>
      <div className="space-y-2">
        {redFlags.map((flag) => (
          <div key={flag.id} className="text-sm">
            <span className="font-medium text-warm-white">• {flag.description.split(':')[0]}:</span>
            <span className="text-gray-300 ml-1">
              {flag.description.split(':').slice(1).join(':').trim()}
            </span>
          </div>
        ))}
      </div>
      <button className="text-sm text-aqua hover:underline mt-3">
        Review Detailed Analysis →
      </button>
    </div>
  );
}
