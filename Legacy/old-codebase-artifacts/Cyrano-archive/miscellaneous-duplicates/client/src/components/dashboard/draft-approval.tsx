import { Edit3, Check, X, Send, MessageSquare, Clock, User } from "lucide-react";
import { useState } from "react";

interface DraftApprovalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DraftApproval({ isOpen, onClose }: DraftApprovalProps) {
  const [selectedDraft, setSelectedDraft] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [draftContent, setDraftContent] = useState("");

  const drafts = [
    {
      id: 1,
      recipient: "opposing.counsel@lawfirm.com",
      subject: "Re: TRO Motion - Johnson v Johnson Case",
      priority: "urgent",
      aiAnalysis: "Critical deadline response required. AI detected aggressive language in opposing counsel's motion and recommends measured but firm response.",
      originalEmail: "We demand immediate compliance with our TRO motion...",
      draftResponse: `Dear Counsel,

Thank you for your correspondence dated [date] regarding the Temporary Restraining Order motion in Johnson v Johnson.

After careful review of your motion, we respectfully disagree with several key assertions. Specifically:

1. The statutory requirements for emergency relief have not been satisfied
2. No irreparable harm has been demonstrated with sufficient specificity
3. The proposed restraining order is overly broad and would cause substantial hardship

We will be filing our formal response within the prescribed timeframe and look forward to addressing these matters before the Court.

Respectfully yours,
Mekel S. Miller, Esq.`,
      redFlags: ["Tight deadline - 47 hours", "Opposing counsel using aggressive language"],
      confidence: 94
    },
    {
      id: 2,
      recipient: "client.johnson@email.com",
      subject: "Update on Your Case Status",
      priority: "medium",
      aiAnalysis: "Client update regarding case progress. Tone should be reassuring but realistic.",
      originalEmail: "I'm worried about the TRO. What happens next?",
      draftResponse: `Dear Mr. Johnson,

I wanted to provide you with an update on your case following the TRO motion filed by opposing counsel.

Please don't be overly concerned - this is a standard litigation tactic, and we have strong grounds for opposition. We are preparing a comprehensive response that addresses each of their claims.

The timeline is manageable, and I will keep you informed of all developments. We should schedule a brief call this week to discuss strategy.

Best regards,
Mekel S. Miller, Esq.`,
      redFlags: [],
      confidence: 89
    }
  ];

  const currentDraft = drafts[selectedDraft];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-navy bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-warm-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-slate-blue px-6 py-4 border-b-2 border-steel-blue">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-warm-white tracking-wide">DRAFT RESPONSE REVIEW & APPROVAL</h2>
              <p className="text-sm text-accent-gold font-medium">LexFiat AI-Generated Legal Communications</p>
            </div>
            <button 
              onClick={onClose}
              className="text-warm-white hover:text-accent-gold transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Draft List Sidebar */}
          <div className="w-80 bg-light-blue border-r-2 border-steel-blue overflow-y-auto">
            <div className="p-4">
              <h3 className="font-bold text-deep-navy mb-4 tracking-wide">PENDING DRAFTS ({drafts.length})</h3>
              <div className="space-y-3">
                {drafts.map((draft, index) => (
                  <div
                    key={draft.id}
                    onClick={() => setSelectedDraft(index)}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-300 shadow-md ${
                      selectedDraft === index 
                        ? 'bg-professional-blue bg-opacity-20 border-2 border-accent-gold shadow-lg' 
                        : 'bg-warm-white border-2 border-steel-blue hover:border-accent-gold hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        draft.priority === 'urgent' 
                          ? 'bg-alert-red text-white' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {draft.priority.toUpperCase()}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-charcoal" />
                        <span className="text-xs text-charcoal">2h ago</span>
                      </div>
                    </div>
                    
                    <p className="font-semibold text-sm text-deep-navy mb-1">
                      {draft.subject}
                    </p>
                    <p className="text-xs text-steel-blue mb-2 font-medium">
                      To: {draft.recipient}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-3 w-3 text-accent-gold" />
                        <span className="text-xs text-accent-gold font-bold">
                          AI: {draft.confidence}%
                        </span>
                      </div>
                      {draft.redFlags.length > 0 && (
                        <div className="w-2 h-2 bg-alert-amber rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Draft Review Area */}
          <div className="flex-1 flex flex-col">
            {/* Draft Header Info */}
            <div className="bg-light-navy p-4 border-b border-light-gray">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-navy">{currentDraft.subject}</h3>
                  <p className="text-sm text-charcoal">To: {currentDraft.recipient}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-charcoal">AI Confidence:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-light-gray rounded-full h-2">
                      <div 
                        className="bg-light-green h-2 rounded-full"
                        style={{ width: `${currentDraft.confidence}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-light-green">
                      {currentDraft.confidence}%
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              <div className="bg-warm-white rounded-lg p-3 mb-3">
                <h4 className="text-sm font-semibold text-navy mb-2">AI Legal Analysis</h4>
                <p className="text-sm text-charcoal">{currentDraft.aiAnalysis}</p>
              </div>

              {/* Red Flags */}
              {currentDraft.redFlags.length > 0 && (
                <div className="bg-alert-red bg-opacity-10 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-alert-red mb-2">Attention Required</h4>
                  <div className="space-y-1">
                    {currentDraft.redFlags.map((flag, index) => (
                      <p key={index} className="text-sm text-alert-red">• {flag}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Draft Content Editor */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                  {/* Original Email */}
                  <div>
                    <h4 className="font-semibold text-navy mb-3 flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Original Email</span>
                    </h4>
                    <div className="bg-light-gray rounded-lg p-4 h-48 overflow-y-auto">
                      <p className="text-sm text-charcoal whitespace-pre-wrap">
                        {currentDraft.originalEmail}
                      </p>
                    </div>
                  </div>

                  {/* Draft Response */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-navy flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>AI Draft Response</span>
                      </h4>
                      <button
                        onClick={() => {
                          setEditMode(!editMode);
                          if (!editMode) setDraftContent(currentDraft.draftResponse);
                        }}
                        className="flex items-center space-x-1 text-aqua hover:text-blue-600 transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span className="text-sm">Edit</span>
                      </button>
                    </div>
                    
                    {editMode ? (
                      <textarea
                        value={draftContent}
                        onChange={(e) => setDraftContent(e.target.value)}
                        className="w-full h-48 p-4 border border-light-navy rounded-lg resize-none text-sm text-navy focus:outline-none focus:ring-2 focus:ring-aqua"
                        placeholder="Edit the draft response..."
                      />
                    ) : (
                      <div className="bg-warm-white border border-light-navy rounded-lg p-4 h-48 overflow-y-auto">
                        <p className="text-sm text-navy whitespace-pre-wrap">
                          {currentDraft.draftResponse}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-light-navy p-4 border-t border-light-gray">
              <div className="flex items-center justify-between">
                <div className="text-sm text-charcoal">
                  Review and approve to send via Gmail API
                </div>
                <div className="flex items-center space-x-3">
                  <button className="flex items-center space-x-2 px-4 py-2 bg-light-gray hover:bg-gray-300 text-navy rounded-lg transition-colors">
                    <X className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors">
                    <Edit3 className="h-4 w-4" />
                    <span>Edit & Save</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 px-6 py-2 bg-light-green hover:bg-green-600 text-white rounded-lg transition-colors font-semibold">
                    <Check className="h-4 w-4" />
                    <span>Approve & Send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}