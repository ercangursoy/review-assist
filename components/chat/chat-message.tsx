"use client";

import { toast } from "sonner";
import { useClaims } from "@/lib/claims-context";
import { ClaimLookupCard } from "./tool-results/claim-lookup-card";
import { ActionSuggestionCard } from "./tool-results/action-suggestion-card";
import { AppealDraftCard } from "./tool-results/appeal-draft-card";
import { StatusUpdateCard } from "./tool-results/status-update-card";
import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";
import type { ClaimStatus, Claim } from "@/lib/types";
import type { UIMessage } from "ai";

type AddToolOutputFn = (params: { tool: string; toolCallId: string; output: unknown }) => void;

interface ToolUIPart {
  type: string;
  state: string;
  toolCallId: string;
  input?: Record<string, unknown>;
  output?: unknown;
}

type ActionType = "appeal" | "resubmit" | "call_payer" | "write_off" | "request_peer_review" | "submit_documentation" | "update_cob";

const ACTION_TO_STATUS: Partial<Record<ActionType, ClaimStatus>> = {
  appeal:               "pending",
  resubmit:             "pending",
  write_off:            "written_off",
  request_peer_review:  "pending",
  submit_documentation: "pending",
  update_cob:           "pending",
};

interface Props {
  message: UIMessage;
  addToolOutput: AddToolOutputFn;
  /** Persisted HITL card states, keyed by toolCallId */
  toolStates: Record<string, string>;
  onToolStateChange: (toolCallId: string, state: string) => void;
}

export function ChatMessage({ message, addToolOutput, toolStates, onToolStateChange }: Props) {
  const { updateClaimStatus } = useClaims();
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar dot */}
      <div
        className={cn(
          "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5",
          isUser
            ? "bg-primary text-primary-foreground text-[0.625rem] font-semibold"
            : "bg-foreground text-background"
        )}
      >
        {isUser ? "U" : <Bot className="w-3.5 h-3.5" />}
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0 space-y-2", isUser && "items-end flex flex-col")}>
        {message.parts.map((part, i) => {
          const p = part as ToolUIPart;

          // ── Text ─────────────────────────────────────────────────────────
          if (part.type === "text") {
            const displayText = isUser
              ? part.text.replace(/\n\n\(Current claim: CLM-\d+\)$/, "")
              : part.text;
            if (!displayText.trim()) return null;
            return (
              <div
                key={i}
                className={cn(
                  "rounded-lg px-3.5 py-2.5 text-[0.8125rem] leading-relaxed max-w-2xl",
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground"
                )}
              >
                <MessageText text={displayText} />
              </div>
            );
          }

          // ── lookupClaim — server-side, state = output-available ───────────
          if (part.type === "tool-lookupClaim") {
            if (p.state !== "output-available" || !p.output) return null;
            return (
              <div key={i} className="max-w-2xl w-full">
                <ClaimLookupCard result={p.output as { claim?: Claim; error?: string }} />
              </div>
            );
          }

          // ── suggestAction — client-side, state = input-available ──────────
          if (part.type === "tool-suggestAction") {
            if (p.state === "input-streaming") return null;
            if (!p.input?.action) return null;
            type SuggestArgs = {
              claimId: string;
              action: ActionType;
              label: string;
              reasoning: string;
              urgency: "high" | "medium" | "low";
              steps: string[];
            };
            const args = p.input as SuggestArgs;
            const toolCallId: string = p.toolCallId;
            const state = (toolStates[toolCallId] as "pending" | "approved" | "rejected") ?? "pending";

            return (
              <div key={i} className="max-w-2xl w-full">
                <ActionSuggestionCard
                  args={args}
                  state={state}
                  onApprove={() => {
                    const newStatus = ACTION_TO_STATUS[args.action];
                    if (newStatus) {
                      updateClaimStatus(args.claimId, newStatus, `Action approved: ${args.label}`);
                    }
                    onToolStateChange(toolCallId, "approved");
                    addToolOutput({ tool: "suggestAction", toolCallId, output: { approved: true, action: args.action } });
                    toast.success(`Action approved: ${args.label}`);
                  }}
                  onReject={() => {
                    onToolStateChange(toolCallId, "rejected");
                    addToolOutput({ tool: "suggestAction", toolCallId, output: { approved: false } });
                    toast("Action rejected", { description: args.label });
                  }}
                />
              </div>
            );
          }

          // ── draftAppeal — client-side, state = input-available ────────────
          if (part.type === "tool-draftAppeal") {
            if (p.state === "input-streaming") return null;
            if (!p.input?.body) return null;
            type DraftArgs = {
              claimId: string;
              letterType: "appeal" | "resubmission" | "peer_to_peer_request" | "cob_update" | "retroactive_auth";
              subject: string;
              body: string;
            };
            const args = p.input as DraftArgs;
            const toolCallId: string = p.toolCallId;
            const state = (toolStates[toolCallId] as "pending" | "accepted" | "discarded") ?? "pending";

            return (
              <div key={i} className="max-w-2xl w-full">
                <AppealDraftCard
                  args={args}
                  state={state}
                  onAccept={(editedBody) => {
                    onToolStateChange(toolCallId, "accepted");
                    addToolOutput({ tool: "draftAppeal", toolCallId, output: { accepted: true, finalBody: editedBody } });
                    toast.success("Appeal draft accepted");
                  }}
                  onDiscard={() => {
                    onToolStateChange(toolCallId, "discarded");
                    addToolOutput({ tool: "draftAppeal", toolCallId, output: { accepted: false } });
                    toast("Draft discarded");
                  }}
                />
              </div>
            );
          }

          // ── updateClaimStatus — client-side, state = input-available ──────
          if (part.type === "tool-updateClaimStatus") {
            if (p.state === "input-streaming") return null;
            if (!p.input?.claimId) return null;
            type StatusArgs = { claimId: string; status: ClaimStatus; notes: string };
            const args = p.input as StatusArgs;
            const toolCallId: string = p.toolCallId;
            const state = (toolStates[toolCallId] as "pending" | "confirmed" | "cancelled") ?? "pending";

            return (
              <div key={i} className="max-w-2xl w-full">
                <StatusUpdateCard
                  args={args}
                  state={state}
                  onConfirm={() => {
                    updateClaimStatus(args.claimId, args.status, args.notes);
                    onToolStateChange(toolCallId, "confirmed");
                    addToolOutput({ tool: "updateClaimStatus", toolCallId, output: { confirmed: true, claimId: args.claimId, status: args.status } });
                    toast.success(`Status updated to ${args.status.replace("_", " ")}`);
                  }}
                  onCancel={() => {
                    onToolStateChange(toolCallId, "cancelled");
                    addToolOutput({ tool: "updateClaimStatus", toolCallId, output: { confirmed: false } });
                    toast("Status update cancelled");
                  }}
                />
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

function InlineFormat({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={j} className="text-[0.75rem] bg-muted px-1 py-0.5 rounded font-mono">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={j}>{part}</span>;
      })}
    </>
  );
}

function MessageText({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: { content: string; ordered: boolean; num?: string }[] = [];

  function flushList() {
    if (listItems.length === 0) return;
    const isOrdered = listItems[0].ordered;
    const Tag = isOrdered ? "ol" : "ul";
    elements.push(
      <Tag key={`list-${elements.length}`} className={cn("space-y-0.5 my-1", isOrdered ? "list-decimal" : "list-disc", "pl-4")}>
        {listItems.map((item, i) => (
          <li key={i} className="text-[0.8125rem] leading-relaxed">
            <InlineFormat text={item.content} />
          </li>
        ))}
      </Tag>
    );
    listItems = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const orderedMatch = line.match(/^\s*(\d+)[.)]\s+(.+)/);
    const bulletMatch = line.match(/^\s*[-*•]\s+(.+)/);

    if (orderedMatch) {
      if (listItems.length > 0 && !listItems[0].ordered) flushList();
      listItems.push({ content: orderedMatch[2], ordered: true, num: orderedMatch[1] });
    } else if (bulletMatch) {
      if (listItems.length > 0 && listItems[0].ordered) flushList();
      listItems.push({ content: bulletMatch[1], ordered: false });
    } else {
      flushList();
      if (!line.trim()) {
        elements.push(<br key={`br-${i}`} />);
      } else {
        elements.push(
          <p key={`p-${i}`} className="mb-0.5 last:mb-0">
            <InlineFormat text={line} />
          </p>
        );
      }
    }
  }
  flushList();

  return <>{elements}</>;
}
