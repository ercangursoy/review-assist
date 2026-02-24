"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

type ActionType =
  | "appeal"
  | "resubmit"
  | "call_payer"
  | "write_off"
  | "request_peer_review"
  | "submit_documentation"
  | "update_cob";

const ACTION_LABEL: Record<ActionType, string> = {
  appeal:               "File Appeal",
  resubmit:             "Resubmit Claim",
  call_payer:           "Call Payer",
  write_off:            "Write Off",
  request_peer_review:  "Request Peer-to-Peer",
  submit_documentation: "Submit Documentation",
  update_cob:           "Update COB",
};

const URGENCY_CONFIG = {
  high:   { label: "High priority",   dot: "bg-rose-500",      text: "text-rose-600" },
  medium: { label: "Medium priority", dot: "bg-amber-500",     text: "text-amber-600" },
  low:    { label: "Low priority",    dot: "bg-foreground/30", text: "text-muted-foreground" },
};

interface Props {
  args: {
    claimId: string;
    action: ActionType;
    label: string;
    reasoning: string;
    urgency: "high" | "medium" | "low";
    steps: string[];
  };
  state: "pending" | "approved" | "rejected";
  onApprove: () => void;
  onReject: () => void;
}

export function ActionSuggestionCard({ args, state, onApprove, onReject }: Props) {
  const urgency = URGENCY_CONFIG[args.urgency];

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card overflow-hidden text-[0.8125rem] border-l-[3px] border-l-primary transition-opacity",
        state === "rejected" && "opacity-50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-foreground truncate">
            {args.label || ACTION_LABEL[args.action]}
          </span>
          <span className="text-muted-foreground flex-shrink-0 text-[0.75rem]">{args.claimId}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className={cn("flex items-center gap-1 text-[0.6875rem]", urgency.text)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", urgency.dot)} />
            {urgency.label}
          </span>
          {state === "approved" && (
            <span className="flex items-center gap-1 text-[0.6875rem] text-emerald-700 font-medium">
              <Check className="w-3.5 h-3.5" /> Approved
            </span>
          )}
          {state === "rejected" && (
            <span className="flex items-center gap-1 text-[0.6875rem] text-muted-foreground font-medium">
              <X className="w-3.5 h-3.5" /> Rejected
            </span>
          )}
        </div>
      </div>

      <div className="px-3.5 py-3 space-y-3">
        {/* Reasoning */}
        <div>
          <p className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            AI Reasoning
          </p>
          <p className="text-[0.8125rem] leading-relaxed text-foreground">{args.reasoning}</p>
        </div>

        {/* Steps */}
        {args.steps.length > 0 && (
          <div>
            <p className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Steps
            </p>
            <ol className="space-y-1">
              {args.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-muted text-foreground text-[0.625rem] flex items-center justify-center font-semibold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-[0.8125rem] text-foreground leading-snug">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Actions */}
        {state === "pending" && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={onApprove}
              className="h-8 px-4 text-[0.75rem] gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              className="h-8 px-4 text-[0.75rem] gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
              Reject
            </Button>
          </div>
        )}

        {state === "approved" && (
          <p className="text-[0.75rem] text-emerald-700 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            Action approved — proceed with the steps above.
          </p>
        )}
      </div>
    </div>
  );
}
