import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  Play, 
  BookOpen, 
  Settings, 
  MessageSquare, 
  Search, 
  Users, 
  Waves,
  ChevronRight,
  Clock,
  Shield,
  Zap
} from "lucide-react";

interface HelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function HelpModal({ open, onOpenChange }: HelpModalProps) {
  const [activeSection, setActiveSection] = useState("overview");

  const quickStartSteps = [
    {
      title: "Choose Your Swimming Pool",
      description: "Select which AI models you want to compete in your race",
      icon: <Settings className="h-5 w-5" />,
      time: "30 seconds"
    },
    {
      title: "Enter the Starting Blocks",
      description: "Type your question in the prominent query input area",
      icon: <MessageSquare className="h-5 w-5" />,
      time: "1 minute"
    },
    {
      title: "Start the Race",
      description: "Hit 'Start Race' and watch AI swimmers compete for the best answer",
      icon: <Play className="h-5 w-5" />,
      time: "5-30 seconds"
    },
    {
      title: "Judge the Results",
      description: "Compare responses, verify accuracy, and choose the winning answer",
      icon: <Search className="h-5 w-5" />,
      time: "2-5 minutes"
    }
  ];

  const events = [
    {
      name: "Freestyle",
      icon: "🏊‍♂️",
      description: "Fast, direct queries across multiple AI models",
      features: ["Real-time responses", "Multiple AI lanes", "Speed comparison", "Accuracy scoring"]
    },
    {
      name: "Backstroke",
      icon: "🤾‍♂️",
      description: "Look back and verify the accuracy of AI responses",
      features: ["Fact verification", "Source checking", "Cross-referencing", "Reliability scoring"]
    },
    {
      name: "Relay",
      icon: "🏃‍♂️🏃‍♀️",
      description: "Team collaboration between multiple AI models",
      features: ["Conversation chains", "Iterative refinement", "Team strategies", "Baton passing"]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-2xl">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Waves className="h-5 w-5 text-white" />
            </div>
            <span>Swim Meet Help Center</span>
          </DialogTitle>
          <DialogDescription>
            Master the art of AI competition with our comprehensive guide
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeSection} onValueChange={setActiveSection} className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="tips">Pro Tips</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-2xl">🏊‍♂️</span>
                  <span>Welcome to Swim Meet</span>
                </CardTitle>
                <CardDescription>
                  The premier AI racing platform for competitive intelligence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-700 leading-relaxed">
                  Swim Meet transforms AI interaction into an Olympic-style competition. Instead of asking 
                  one AI at a time, you can launch queries across multiple AI "swimmers" simultaneously, 
                  compare their performance, and identify the most accurate and insightful responses.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">Speed</span>
                    </div>
                    <p className="text-sm text-blue-700">Get multiple perspectives in seconds</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">Accuracy</span>
                    </div>
                    <p className="text-sm text-green-700">Cross-verify answers for reliability</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="font-semibold text-purple-800">Choice</span>
                    </div>
                    <p className="text-sm text-purple-700">Your sovereignty over AI selection</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Start Tab */}
          <TabsContent value="quickstart" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Play className="h-5 w-5" />
                  <span>Get Racing in 4 Steps</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quickStartSteps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="text-blue-600">{step.icon}</div>
                          <h3 className="font-semibold text-slate-900">{step.title}</h3>
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {step.time}
                          </Badge>
                        </div>
                        <p className="text-slate-600">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Setup Your Pool</CardTitle>
                <CardDescription>Configure API keys for your preferred AI models</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-amber-600">⚠️</div>
                    <div>
                      <h4 className="font-semibold text-amber-800 mb-1">API Keys Required</h4>
                      <p className="text-amber-700 text-sm">
                        You'll need API keys from AI providers (OpenAI, Anthropic, Google) to enable their swimmers. 
                        Click the "Setup" button in the header to configure your keys securely.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            {events.map((event, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <span className="text-2xl">{event.icon}</span>
                    <span>{event.name} Event</span>
                    {index > 0 && <Badge variant="outline">Coming Soon</Badge>}
                  </CardTitle>
                  <CardDescription>{event.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {event.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2">
                        <ChevronRight className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Pro Tips Tab */}
          <TabsContent value="tips" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-2xl">🏆</span>
                  <span>Championship Strategies</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Query Optimization</h4>
                  <ul className="space-y-1 text-blue-700 text-sm">
                    <li>• Be specific and detailed in your questions</li>
                    <li>• Include context when asking complex questions</li>
                    <li>• Try different phrasings for better results</li>
                  </ul>
                </div>
                <div className="bg-green-50 border-l-4 border-green-400 p-4">
                  <h4 className="font-semibold text-green-800 mb-2">Accuracy Verification</h4>
                  <ul className="space-y-1 text-green-700 text-sm">
                    <li>• Compare responses across multiple AI models</li>
                    <li>• Look for consensus on factual claims</li>
                    <li>• Use the "Humanize & Submit" feature for cross-checking</li>
                  </ul>
                </div>
                <div className="bg-purple-50 border-l-4 border-purple-400 p-4">
                  <h4 className="font-semibold text-purple-800 mb-2">Model Selection</h4>
                  <ul className="space-y-1 text-purple-700 text-sm">
                    <li>• Different models excel at different tasks</li>
                    <li>• GPT-4 for general reasoning and creativity</li>
                    <li>• Claude for analysis and writing</li>
                    <li>• Gemini for factual queries and research</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-6 border-t">
          <Button onClick={() => onOpenChange(false)} className="bg-blue-600 hover:bg-blue-700">
            Ready to Race!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}