"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useClaims } from "@/lib/claims-context";
import { ChatMessage } from "./chat-message";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send, Loader2, AlertCircle, Bot, ShieldCheck, ArrowLeft, Search as SearchIcon, FileText, Lightbulb } from "lucide-react";
import type { UIMessage } from "ai";

// ── Storage helpers ──────────────────────────────────────────────────────────

const CHATS_KEY = "joyful_chats_v2";
const TOOL_STATES_KEY = "joyful_tool_states_v2";

function readChats(): Record<string, UIMessage[]> {
  try {
    return JSON.parse(localStorage.getItem(CHATS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeChats(chats: Record<string, UIMessage[]>) {
  try {
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  } catch {}
}

function readToolStates(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(TOOL_STATES_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeToolStates(states: Record<string, string>) {
  try {
    localStorage.setItem(TOOL_STATES_KEY, JSON.stringify(states));
  } catch {}
}

// ── Quick prompts ────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  { label: "Analyze claim", prompt: "Analyze this claim and suggest next steps", icon: SearchIcon },
  { label: "Why denied?", prompt: "Why was this claim denied?", icon: Lightbulb },
  { label: "Draft appeal", prompt: "Draft an appeal letter for this claim", icon: FileText },
];

// ── Component ────────────────────────────────────────────────────────────────

/**
 * This component is always remounted when selectedClaimId changes (key prop in
 * MainContent). Therefore selectedClaimId is FIXED for each instance's lifetime —
 * we can read/write localStorage with no race conditions or switching logic.
 */
export function ChatInterface() {
  const { selectedClaimId } = useClaims();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState("");

  // Suppress EmptyState during the single render before localStorage loads.
  // Without this, SSR renders EmptyState, then the client loads saved messages —
  // causing a visible flash.
  const [hydrated, setHydrated] = useState(false);

  const { messages, sendMessage, addToolOutput, setMessages, status, error } = useChat();

  // HITL card states — persisted globally (toolCallIds are unique across claims)
  const [toolStates, setToolStatesRaw] = useState<Record<string, string>>({});

  const setToolState = useCallback((toolCallId: string, state: string) => {
    setToolStatesRaw((prev) => {
      const next = { ...prev, [toolCallId]: state };
      writeToolStates(next);
      return next;
    });
  }, []);

  const isLoading = status === "streaming" || status === "submitted";

  // Runs once on mount (client-only). selectedClaimId is stable for this
  // instance's lifetime (guaranteed by key prop in MainContent).
  useEffect(() => {
    const saved = selectedClaimId ? (readChats()[selectedClaimId] ?? []) : [];
    if (saved.length > 0) setMessages(saved);
    setToolStatesRaw(readToolStates());
    setHydrated(true);
    inputRef.current?.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist this claim's messages whenever they change.
  // selectedClaimId is stable, so no switching race condition is possible.
  useEffect(() => {
    if (!hydrated || !selectedClaimId) return;
    const chats = readChats();
    chats[selectedClaimId] = messages;
    writeChats(chats);
  }, [messages, hydrated, selectedClaimId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading) return;
    const messageText = selectedClaimId
      ? `${text}\n\n(Current claim: ${selectedClaimId})`
      : text;
    setInputValue("");
    sendMessage({ text: messageText });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleQuickPrompt(prompt: string) {
    const text = selectedClaimId
      ? `${prompt}\n\n(Current claim: ${selectedClaimId})`
      : prompt;
    sendMessage({ text });
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background animate-fade-in">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {!hydrated ? (
          selectedClaimId ? <ChatSkeleton /> : <EmptyState selectedClaimId={null} onQuickPrompt={handleQuickPrompt} />
        ) : !hasMessages ? (
          <EmptyState
            selectedClaimId={selectedClaimId}
            onQuickPrompt={handleQuickPrompt}
          />
        ) : (
          <div className="px-3 sm:px-5 py-4 sm:py-5 space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                addToolOutput={addToolOutput}
                toolStates={toolStates}
                onToolStateChange={setToolState}
              />
            ))}

            {isLoading && (
              <div className="flex gap-2.5">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-foreground flex items-center justify-center mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-background" />
                </div>
                <div className="bg-muted/60 border border-border rounded-lg px-4 py-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-[pulse_1.4s_ease-in-out_infinite]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-[pulse_1.4s_ease-in-out_0.2s_infinite]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-[pulse_1.4s_ease-in-out_0.4s_infinite]" />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 border border-rose-200 bg-rose-50 rounded-md px-3 py-2.5 text-[0.8125rem] text-rose-700">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Something went wrong. Please try again.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border px-3 sm:px-4 pt-2 sm:pt-2.5 pb-2.5 sm:pb-3">
        {selectedClaimId && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {QUICK_PROMPTS.map(({ label, prompt, icon: Icon }) => (
              <button
                key={label}
                onClick={() => handleQuickPrompt(prompt)}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-[0.75rem] pl-2.5 pr-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-foreground/[0.03] transition-colors disabled:opacity-40"
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedClaimId
                ? `Message about ${selectedClaimId}… (Enter to send)`
                : "Select a claim to start"
            }
            disabled={!selectedClaimId || isLoading}
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-md border border-input bg-card px-3 py-2 text-[0.8125rem]",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring",
              "disabled:opacity-50 disabled:cursor-not-allowed max-h-28 overflow-y-auto transition"
            )}
            style={{ minHeight: "38px" }}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!inputValue.trim() || !selectedClaimId || isLoading}
            className="h-[38px] w-[38px] p-0 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </Button>
        </form>
        <p className="text-[0.6875rem] text-muted-foreground mt-1.5">
          All AI-suggested actions require your approval before being applied.
        </p>
      </div>
    </div>
  );
}

// ── Chat skeleton ─────────────────────────────────────────────────────────────

function SkeletonBubble({ isUser, lines = 2 }: { isUser?: boolean; lines?: number }) {
  const widths = ["w-3/4", "w-1/2", "w-5/6", "w-2/3", "w-4/5"];
  return (
    <div className={cn("flex gap-2.5", isUser && "flex-row-reverse")}>
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted animate-pulse mt-0.5" />
      <div className={cn("flex flex-col gap-1.5", isUser && "items-end")}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-3.5 rounded-md bg-muted animate-pulse",
              widths[(i + (isUser ? 2 : 0)) % widths.length]
            )}
          />
        ))}
      </div>
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="px-5 py-5 space-y-5">
      <SkeletonBubble lines={2} />
      <SkeletonBubble isUser lines={1} />
      <SkeletonBubble lines={3} />
      <SkeletonBubble isUser lines={1} />
      <SkeletonBubble lines={2} />
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  selectedClaimId,
  onQuickPrompt,
}: {
  selectedClaimId: string | null;
  onQuickPrompt: (prompt: string) => void;
}) {
  if (!selectedClaimId) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center mb-5">
          <ShieldCheck className="w-6 h-6 text-background" />
        </div>
        <h2 className="text-[0.9375rem] font-semibold text-foreground mb-1.5">Claims Review Assistant</h2>
        <p className="text-[0.8125rem] text-muted-foreground max-w-[280px] leading-relaxed mb-8">
          Select a claim from the sidebar to begin your AI-assisted review.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-sm w-full">
          {[
            { icon: SearchIcon, title: "Analyze", desc: "Deep-dive into claim details" },
            { icon: Lightbulb, title: "Suggest", desc: "Get recommended next steps" },
            { icon: FileText, title: "Draft", desc: "Generate appeal letters" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-4">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <p className="text-[0.75rem] font-medium text-foreground">{title}</p>
              <p className="text-[0.6875rem] text-muted-foreground leading-snug">{desc}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-8 text-muted-foreground">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="text-[0.75rem]">Pick a claim to get started</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center py-16">
      <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center mb-4">
        <Bot className="w-5 h-5 text-background" />
      </div>
      <p className="text-[0.875rem] font-semibold text-foreground mb-0.5">
        {selectedClaimId}
      </p>
      <p className="text-[0.75rem] text-muted-foreground mb-6 max-w-[260px] leading-relaxed">
        What would you like to do with this claim?
      </p>
      <div className="flex flex-col gap-1.5 w-full max-w-[320px]">
        {QUICK_PROMPTS.map(({ label, prompt, icon: Icon }) => (
          <button
            key={label}
            onClick={() => onQuickPrompt(prompt)}
            className="flex items-center gap-2.5 text-[0.8125rem] px-4 py-2.5 rounded-lg border border-border text-left text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-foreground/[0.03] transition-colors"
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
