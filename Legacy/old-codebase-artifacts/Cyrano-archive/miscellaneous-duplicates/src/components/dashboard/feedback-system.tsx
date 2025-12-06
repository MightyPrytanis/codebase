import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Bug, Lightbulb, Settings, Send } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function FeedbackSystem() {
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  
  const { toast } = useToast();

  const submitFeedback = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We'll review it soon.",
      });
      setOpen(false);
      setFeedbackType("");
      setTitle("");
      setDescription("");
      setPriority("medium");
    },
  });

  const handleSubmit = () => {
    if (!feedbackType || !title || !description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    submitFeedback.mutate({
      type: feedbackType,
      title,
      description,
      priority,
    });
  };

  const feedbackTypes = [
    { value: "bug", label: "Bug Report", icon: Bug, color: "text-red-400" },
    { value: "feature", label: "Feature Request", icon: Lightbulb, color: "text-yellow-400" },
    { value: "improvement", label: "Improvement", icon: Settings, color: "text-blue-400" },
    { value: "comment", label: "General Feedback", icon: MessageSquare, color: "text-green-400" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-gold">Submit Feedback to Development Team</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="feedback-type" className="text-slate-300">Feedback Type</Label>
            <Select value={feedbackType} onValueChange={setFeedbackType}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select feedback type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {feedbackTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value} className="text-white hover:bg-slate-700">
                      <span className="flex items-center">
                        <Icon className={`w-4 h-4 mr-2 ${type.color}`} />
                        {type.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title" className="text-slate-300">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of your feedback"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-slate-300">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of your feedback, including steps to reproduce for bugs"
              rows={4}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div>
            <Label htmlFor="priority" className="text-slate-300">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="low" className="text-white hover:bg-slate-700">Low</SelectItem>
                <SelectItem value="medium" className="text-white hover:bg-slate-700">Medium</SelectItem>
                <SelectItem value="high" className="text-white hover:bg-slate-700">High</SelectItem>
                <SelectItem value="urgent" className="text-white hover:bg-slate-700">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {feedbackType === "bug" && (
            <div className="bg-red-900/20 border border-red-700 p-3 rounded-lg">
              <p className="text-red-300 text-sm">
                <strong>For bugs:</strong> Please include steps to reproduce, expected behavior, 
                and actual behavior. Screenshots or error messages are helpful.
              </p>
            </div>
          )}

          <div className="bg-slate-700 p-3 rounded-lg">
            <p className="text-slate-300 text-sm">
              <strong>Contact Developer:</strong> For immediate assistance, reach out to the 
              development team directly. Your feedback helps improve LexFiat for all users.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={submitFeedback.isPending}
              className="flex-1 bg-gold hover:bg-gold/90 text-slate-900"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitFeedback.isPending ? "Submitting..." : "Submit Feedback"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}