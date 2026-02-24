"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Check, X, Pencil, Copy } from "lucide-react";

type LetterType = "appeal" | "resubmission" | "peer_to_peer_request" | "cob_update" | "retroactive_auth";

const LETTER_LABELS: Record<LetterType, string> = {
  appeal:               "Appeal Letter",
  resubmission:         "Resubmission Cover Letter",
  peer_to_peer_request: "Peer-to-Peer Request",
  cob_update:           "COB Update Request",
  retroactive_auth:     "Retroactive Authorization Request",
};

interface Props {
  args: {
    claimId: string;
    letterType: LetterType;
    subject: string;
    body: string;
  };
  state: "pending" | "accepted" | "discarded";
  onAccept: (editedBody: string) => void;
  onDiscard: () => void;
}

export function AppealDraftCard({ args, state, onAccept, onDiscard }: Props) {
  const [editedBody, setEditedBody] = useState(args.body);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(editedBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card overflow-hidden text-[0.8125rem] border-l-[3px] border-l-foreground/25 transition-opacity",
        state === "discarded" && "opacity-50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-foreground truncate">
            {LETTER_LABELS[args.letterType]}
          </span>
          <span className="text-[0.75rem] text-muted-foreground flex-shrink-0">{args.claimId}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {state === "accepted" && (
            <span className="flex items-center gap-1 text-[0.6875rem] text-emerald-700 font-medium">
              <Check className="w-3.5 h-3.5" /> Accepted
            </span>
          )}
          {state === "discarded" && (
            <span className="flex items-center gap-1 text-[0.6875rem] text-muted-foreground font-medium">
              <X className="w-3.5 h-3.5" /> Discarded
            </span>
          )}
        </div>
      </div>

      <div className="px-3.5 py-3 space-y-3">
        {/* Subject */}
        <div>
          <p className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Subject
          </p>
          <p className="font-medium text-foreground">{args.subject}</p>
        </div>

        {/* Body */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider">
              Letter Body
            </p>
            {state === "pending" && (
              <button
                onClick={() => setIsEditing((v) => !v)}
                className="flex items-center gap-1 text-[0.6875rem] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="w-3 h-3" />
                {isEditing ? "Done" : "Edit"}
              </button>
            )}
          </div>
          {isEditing && state === "pending" ? (
            <Textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              rows={12}
              className="text-[0.8125rem] font-mono leading-relaxed resize-y"
            />
          ) : (
            <div className="bg-muted rounded border border-border/80 px-3 py-2.5 whitespace-pre-wrap text-[0.8125rem] leading-relaxed font-mono text-foreground max-h-60 overflow-y-auto">
              {editedBody}
            </div>
          )}
        </div>

        {/* Actions */}
        {state === "pending" && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => onAccept(editedBody)}
              className="h-8 px-4 text-[0.75rem] gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Accept Draft
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="h-8 px-4 text-[0.75rem] gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDiscard}
              className="h-8 px-4 text-[0.75rem] gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
              Discard
            </Button>
          </div>
        )}

        {state === "accepted" && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="h-8 px-4 text-[0.75rem] gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy letter"}
          </Button>
        )}
      </div>
    </div>
  );
}
