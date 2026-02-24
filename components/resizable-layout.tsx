"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useClaims } from "@/lib/claims-context";
import { useBreakpoint } from "@/lib/use-breakpoint";
import { ClaimsSidebar } from "./claims-sidebar";
import { ClaimDetailPanel } from "./claim-detail-panel";
import { ChatInterface } from "./chat/chat-interface";
import { ErrorBoundary } from "./error-boundary";
import { ArrowLeft, FileText, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Desktop drag-resize constants ────────────────────────────────────────────

const SIDEBAR_DEFAULT = 280;
const SIDEBAR_MIN = 240;
const SIDEBAR_MAX = 380;

const DETAIL_DEFAULT = 380;
const DETAIL_MIN = 320;
const DETAIL_MAX = 520;

// ── Drag handle (desktop only) ───────────────────────────────────────────────

function DragHandle({ onDrag }: { onDrag: (delta: number) => void }) {
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      let lastX = e.clientX;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMove = (ev: MouseEvent) => {
        onDrag(ev.clientX - lastX);
        lastX = ev.clientX;
      };

      const onUp = () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [onDrag]
  );

  return (
    <div
      onMouseDown={handleMouseDown}
      className="w-px bg-border cursor-col-resize shrink-0 hover:bg-foreground/15 active:bg-foreground/25 transition-colors
                 relative after:absolute after:inset-y-0 after:-left-[3px] after:w-[7px] after:content-['']"
    />
  );
}

// ── Tab bar for mobile/tablet (detail vs chat) ──────────────────────────────

type ActiveTab = "details" | "chat";

function TabBar({
  active,
  onChange,
  onBack,
}: {
  active: ActiveTab;
  onChange: (tab: ActiveTab) => void;
  onBack?: () => void;
}) {
  return (
    <div className="flex items-center h-11 border-b border-border bg-background shrink-0 px-1">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[0.8125rem] text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md transition-colors mr-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="sr-only sm:not-sr-only">Claims</span>
        </button>
      )}
      <div className="flex gap-0.5 flex-1">
        {([
          { key: "details" as const, label: "Details", icon: FileText },
          { key: "chat" as const, label: "Chat", icon: MessageSquare },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[0.8125rem] font-medium transition-colors",
              active === key
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Layout orchestrator ─────────────────────────────────────────────────────

export function ResizableLayout() {
  const { selectedClaimId, selectClaim } = useClaims();
  const breakpoint = useBreakpoint();
  const router = useRouter();

  // Desktop resize state
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const [detailWidth, setDetailWidth] = useState(DETAIL_DEFAULT);

  // Mobile/tablet tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>("details");

  // On mobile, when a claim is selected, default to details tab
  useEffect(() => {
    if (selectedClaimId) setActiveTab("details");
  }, [selectedClaimId]);

  const handleSidebarDrag = useCallback((delta: number) => {
    setSidebarWidth((w) =>
      Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, w + delta))
    );
  }, []);

  const handleDetailDrag = useCallback((delta: number) => {
    setDetailWidth((w) =>
      Math.min(DETAIL_MAX, Math.max(DETAIL_MIN, w + delta))
    );
  }, []);

  const handleBack = useCallback(() => {
    selectClaim(null);
    router.replace("/", { scroll: false });
  }, [selectClaim, router]);

  // ── Mobile: single full-screen view ────────────────────────────────────

  if (breakpoint === "mobile") {
    if (!selectedClaimId) {
      return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <ClaimsSidebar />
        </div>
      );
    }

    return (
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <TabBar active={activeTab} onChange={setActiveTab} onBack={handleBack} />
        {activeTab === "details" ? (
          <div className="flex-1 min-h-0 overflow-hidden">
            <ClaimDetailPanel key={`detail-${selectedClaimId}`} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <ErrorBoundary fallbackMessage="Chat encountered an error">
              <ChatInterface key={`chat-${selectedClaimId}`} />
            </ErrorBoundary>
          </div>
        )}
      </div>
    );
  }

  // ── Tablet: sidebar + tabbed content ───────────────────────────────────

  if (breakpoint === "tablet") {
    return (
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="w-[280px] shrink-0 h-full overflow-hidden border-r border-border">
          <ClaimsSidebar />
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {selectedClaimId ? (
            <>
              <TabBar active={activeTab} onChange={setActiveTab} />
              {activeTab === "details" ? (
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ClaimDetailPanel key={`detail-${selectedClaimId}`} />
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <ErrorBoundary fallbackMessage="Chat encountered an error">
                    <ChatInterface key={`chat-${selectedClaimId}`} />
                  </ErrorBoundary>
                </div>
              )}
            </>
          ) : (
            <ErrorBoundary fallbackMessage="Chat encountered an error">
              <ChatInterface key="chat-__none__" />
            </ErrorBoundary>
          )}
        </div>
      </div>
    );
  }

  // ── Desktop: 3-column resizable layout ─────────────────────────────────

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <div style={{ width: sidebarWidth }} className="shrink-0 h-full overflow-hidden">
        <ClaimsSidebar />
      </div>

      <DragHandle onDrag={handleSidebarDrag} />

      {selectedClaimId && (
        <>
          <div style={{ width: detailWidth }} className="shrink-0 h-full overflow-hidden">
            <ClaimDetailPanel key={`detail-${selectedClaimId}`} />
          </div>
          <DragHandle onDrag={handleDetailDrag} />
        </>
      )}

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <ErrorBoundary fallbackMessage="Chat encountered an error">
          <ChatInterface key={`chat-${selectedClaimId ?? "__none__"}`} />
        </ErrorBoundary>
      </main>
    </div>
  );
}
