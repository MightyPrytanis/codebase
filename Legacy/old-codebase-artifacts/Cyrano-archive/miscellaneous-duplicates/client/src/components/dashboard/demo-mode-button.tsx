import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Play, Sparkles, FileText, Scale, Mail, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface DemoScenario {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  duration: string;
}

const demoScenarios: DemoScenario[] = [
  {
    id: "family-law-crisis",
    title: "Emergency Family Law Response",
    description: "Urgent custody modification with deadline pressure and emotional client communications",
    icon: <AlertTriangle className="w-5 h-5" />,
    features: [
      "Critical deadline tracking",
      "Emotional client email analysis", 
      "Multi-AI cross-checking",
      "Priority task automation"
    ],
    duration: "2 min exploration"
  },
  {
    id: "probate-complexity",
    title: "Complex Probate Administration",
    description: "Multi-beneficiary estate with contested assets and court filing requirements",
    icon: <Scale className="w-5 h-5" />,
    features: [
      "Document classification",
      "Red flag detection",
      "Court deadline management",
      "Beneficiary communication"
    ],
    duration: "3 min exploration"
  },
  {
    id: "comprehensive-workflow",
    title: "Full Workflow Intelligence",
    description: "Complete LexFiat experience with all features active across multiple case types",
    icon: <Sparkles className="w-5 h-5" />,
    features: [
      "Gmail monitoring simulation",
      "AI-powered draft generation",
      "Workflow pipeline visualization",
      "Cross-case pattern analysis"
    ],
    duration: "5 min exploration"
  }
];

export function DemoModeButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loadDemo = useMutation({
    mutationFn: async (scenarioId: string) => {
      const response = await fetch("/api/demo/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: scenarioId }),
      });
      if (!response.ok) throw new Error("Failed to load demo");
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Demo data loaded successfully:", data);
      
      // Invalidate specific queries to refresh the dashboard with demo data
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/red-flags"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      
      // Force refetch immediately
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/cases"] });
        queryClient.refetchQueries({ queryKey: ["/api/red-flags"] });
        queryClient.refetchQueries({ queryKey: ["/api/dashboard/stats"] });
      }, 100);
      
      const scenario = demoScenarios.find(s => s.id === selectedScenario);
      
      toast({
        title: `✨ ${scenario?.title} Demo Active`,
        description: `Loaded ${data.casesLoaded} cases, ${data.documentsLoaded} documents, and ${data.redFlagsLoaded} red flags. Explore LexFiat's Legal Intelligence in action!`,
        duration: 8000,
      });
      
      setIsDialogOpen(false);
      setSelectedScenario(null);
      
      // Add a follow-up toast to guide exploration
      setTimeout(() => {
        toast({
          title: "🔍 Explore Demo Features",
          description: "Check the workflow pipeline, review red flags, and see how LexFiat's AI analyzes legal documents automatically.",
          duration: 6000,
        });
      }, 2000);
    },
    onError: () => {
      toast({
        title: "Demo Load Failed",
        description: "Unable to load demo data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const clearDemo = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/demo/clear", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to clear demo");
      return response.json();
    },
    onSuccess: () => {
      // Invalidate specific queries to refresh the dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/red-flags"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      
      toast({
        title: "Demo Data Cleared",
        description: "All demo data has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Clear Failed",
        description: "Unable to clear demo data. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white w-full sm:w-auto"
          >
            <Play className="w-4 h-4 mr-2" />
            Demo Mode
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gold flex items-center">
              <Sparkles className="w-6 h-6 mr-3" />
              LexFiat Demo Mode
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-base">
              Explore LexFiat's Legal Intelligence with realistic scenarios. Choose a demo to see how our 
              Adaptive Workflow Intelligence transforms legal practice management.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            <div className="mb-4 p-4 bg-blue-950/50 border border-blue-800 rounded-lg">
              <h3 className="text-lg font-semibold text-gold mb-2 flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                Experience LexFiat's Legal Intelligence
              </h3>
              <p className="text-sm text-slate-300">
                Each scenario demonstrates how LexFiat's Adaptive Workflow Intelligence transforms legal practice management 
                with AI-powered document analysis, automated red flag detection, and intelligent task prioritization.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {demoScenarios.map((scenario) => (
                <Card 
                  key={scenario.id} 
                  className={`bg-slate-700 border-slate-600 cursor-pointer transition-all duration-200 hover:border-gold ${
                    selectedScenario === scenario.id ? 'border-gold bg-slate-600' : ''
                  }`}
                  onClick={() => setSelectedScenario(scenario.id)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-white">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                          {scenario.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{scenario.title}</h3>
                          <p className="text-sm text-slate-300 font-normal mt-1">
                            {scenario.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge variant="outline" className="border-blue-500 text-blue-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {scenario.duration}
                        </Badge>
                        {selectedScenario === scenario.id && (
                          <CheckCircle className="w-5 h-5 text-gold" />
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <h4 className="font-medium text-gold text-sm">Features Demonstrated:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {scenario.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm text-slate-300">
                            <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-600 space-y-3 sm:space-y-0">
              <div className="text-sm text-slate-400">
                Demo data includes realistic legal scenarios but uses fictional case information
              </div>
              
              <div className="flex space-x-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => clearDemo.mutate()}
                  disabled={clearDemo.isPending}
                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white flex-1 sm:flex-initial"
                >
                  Clear Demo Data
                </Button>
                
                <Button
                  onClick={() => selectedScenario && loadDemo.mutate(selectedScenario)}
                  disabled={!selectedScenario || loadDemo.isPending}
                  className="bg-gold hover:bg-gold/90 text-slate-900 flex-1 sm:flex-initial"
                >
                  {loadDemo.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Demo
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DemoModeButton;