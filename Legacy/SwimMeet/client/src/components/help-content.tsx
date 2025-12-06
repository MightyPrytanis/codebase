import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export function HelpContent() {
  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-varsity-bold mb-2">AI Analysis Platform Guide</h2>
        <p className="text-slate-600">Professional multi-model AI analysis and verification system</p>
        <p className="text-sm text-orange-600 mt-2 font-medium">⚠️ This application is currently in development</p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-600 rounded"></div>
              Freestyle Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>Submit queries for simultaneous analysis across multiple AI models. Compare responses for accuracy, completeness, and different perspectives.</p>
            <div className="bg-blue-50 p-3 rounded text-sm">
              <strong>Best for:</strong> Research questions, creative problems, technical analysis, opinion gathering
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-5 h-5 bg-green-600 rounded"></div>
              Backstroke Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>The AI Integrity Project's Human/AI Interaction Protocol, a straightforward set of 'Ten Rules' for ethical engagement that values truth, user sovereignty, and efficient task completion. Most AI models cannot be relied upon to consistently apply these best practices to themselves, because they are routinely overruled by internal imperatives, hidden from the user, that value factors like appearances, engagement, and revenue over honesty and real user value. Instead of fighting those tendencies, we have AI models apply the protocols not to themselves, but to their competition. As it turns out, they are only too happy to critique the output of other models.</p>
            <div className="bg-green-50 p-3 rounded text-sm">
              <strong>Process:</strong> Original response → Independent verification → Detailed accuracy assessment with citations and confidence scores
            </div>
            <div className="text-xs text-slate-600">
              Applies rigorous standards for truth, citations, error correction, and source verification.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-5 h-5 bg-purple-600 rounded"></div>
              Relay Collaboration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>Multi-stage collaborative problem-solving where AI models build on each other's responses, refine solutions, and synthesize final comprehensive answers.</p>
            <div className="bg-purple-50 p-3 rounded text-sm">
              <strong>Workflow:</strong> Initial responses → Iterative refinement → Final synthesis → Quality assessment
            </div>
            <div className="text-xs text-slate-600">
              Ideal for complex problems requiring multiple perspectives and iterative improvement.
            </div>
            <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
              <strong>Integration Request:</strong> Need additional AI models? Submit requests for new provider integrations via the Support section.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Response Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Copy:</strong> Copy response text</div>
              <div><strong>Fact Check:</strong> Verify with web search</div>
              <div><strong>Humanize:</strong> Make language more natural</div>
              <div><strong>Reply:</strong> Generate follow-up response</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Response Rating System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Gold Medal:</strong> Exceptional quality</div>
              <div><strong>Silver Medal:</strong> High quality</div>
              <div><strong>Bronze Medal:</strong> Good quality</div>
              <div><strong>Finished:</strong> Adequate completion</div>
              <div><strong>Quit:</strong> Gave up or stopped trying</div>
              <div><strong>Titanic:</strong> Complete disaster</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Setup & Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>Add your API keys in Setup to enable additional AI providers. Currently supported:</p>
            <div className="grid grid-cols-2 gap-1 text-sm">
              <div>• OpenAI (ChatGPT)</div>
              <div>• Anthropic (Claude)</div>
              <div>• Google (Gemini)</div>
              <div>• Perplexity (Search)</div>
              <div>• Microsoft (Copilot)</div>
              <div>• xAI (Grok)</div>
              <div>• DeepSeek</div>
              <div>• Meta (Llama)</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">MCP Integration Ready</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">This platform is designed for future deployment in MCP (Model Context Protocol) environments, allowing other applications to connect and utilize the verification and collaboration features.</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pt-4">
        <Button variant="outline" size="sm">
          <ExternalLink className="h-4 w-4 mr-2" />
          View Documentation
        </Button>
      </div>
    </div>
  );
}