"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useClaims } from "@/lib/claims-context";
import { getDaysUntilDeadline, getUrgencyLevel, formatCurrency } from "@/lib/claims-data";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, ACTIVE_STATUSES, CLOSED_STATUSES } from "@/lib/claim-status";
import type { Claim, ClaimStatus } from "@/lib/types";
import { Search, AlertTriangle, Zap, List, XCircle, Ban, Clock, MinusCircle, Archive } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type FilterStatus = ClaimStatus | "all" | "active" | "closed";
const FILTERS: { key: FilterStatus; label: string; icon: LucideIcon }[] = [
  { key: "active",    label: "Active",    icon: Zap },
  { key: "all",       label: "All",       icon: List },
  { key: "denied",    label: "Denied",    icon: XCircle },
  { key: "rejected",  label: "Rejected",  icon: Ban },
  { key: "pending",   label: "Pending",   icon: Clock },
  { key: "underpaid", label: "Underpaid",  icon: MinusCircle },
  { key: "closed",    label: "Closed",    icon: Archive },
];

const CHATS_KEY = "joyful_chats_v2";

function getWorkedClaimIds(): Set<string> {
  try {
    const stored = JSON.parse(localStorage.getItem(CHATS_KEY) ?? "{}") as Record<string, unknown[]>;
    return new Set(Object.entries(stored).filter(([, msgs]) => msgs.length > 0).map(([id]) => id));
  } catch {
    return new Set();
  }
}

export function ClaimsSidebar() {
  const { claims, selectedClaimId, selectClaim } = useClaims();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("active");
  const [workedIds, setWorkedIds] = useState<Set<string>>(new Set());

  // On mount: if URL has ?claim=, honour it; otherwise push the default selection
  useEffect(() => {
    const claimFromUrl = searchParams.get("claim");
    if (claimFromUrl && claims.find((c) => c.claimId === claimFromUrl)) {
      selectClaim(claimFromUrl);
    } else if (selectedClaimId) {
      router.replace(`?claim=${selectedClaimId}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Read which claims have chat history from localStorage (client-only)
  useEffect(() => {
    setWorkedIds(getWorkedClaimIds());
  }, [selectedClaimId]); // refresh whenever selection changes so new chats are reflected

  function handleSelectClaim(claimId: string) {
    selectClaim(claimId);
    router.replace(`?claim=${claimId}`, { scroll: false });
  }

  const counts = claims.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {} as Record<ClaimStatus, number>);

  const activeCount = ACTIVE_STATUSES.reduce((sum, s) => sum + (counts[s] ?? 0), 0);

  const closedCount = CLOSED_STATUSES.reduce((sum, s) => sum + (counts[s] ?? 0), 0);

  function getFilterCount(key: FilterStatus): number {
    if (key === "all") return claims.length;
    if (key === "active") return activeCount;
    if (key === "closed") return closedCount;
    return counts[key as ClaimStatus] ?? 0;
  }

  const filtered = claims.filter((c) => {
    const matchesStatus =
      filterStatus === "all"    ? true :
      filterStatus === "active" ? ACTIVE_STATUSES.includes(c.status) :
      filterStatus === "closed" ? CLOSED_STATUSES.includes(c.status) :
      c.status === filterStatus;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.claimId.toLowerCase().includes(q) ||
      c.patient.name.toLowerCase().includes(q) ||
      c.payer.name.toLowerCase().includes(q) ||
      (c.denialReason ?? "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <aside className="bg-background flex flex-col h-full overflow-hidden">
      {/* Header + Search */}
      <div className="px-3 py-2.5 border-b border-border shrink-0 space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[0.8125rem] font-semibold text-foreground">Claims</h2>
          <span className="text-[0.6875rem] text-muted-foreground tabular-nums">{filtered.length} shown</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search claims…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-[0.8125rem] rounded-md border border-border bg-muted/50 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring focus:bg-background transition"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-3 py-1.5 border-b border-border flex flex-wrap gap-1">
        {FILTERS.map(({ key, label, icon: Icon }) => {
          const isActive = filterStatus === key;
          const count = getFilterCount(key);
          if (count === 0 && key !== "active" && key !== "all") return null;
          return (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={cn(
                "flex items-center gap-1 text-[0.6875rem] px-2 py-1 rounded-md transition-colors",
                isActive
                  ? "bg-foreground text-background font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              )}
            >
              <Icon className="w-3 h-3" />
              {label}
              <span className={cn("ml-0.5 tabular-nums", isActive ? "text-background/60" : "text-muted-foreground/50")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="py-1">
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-center text-[0.8125rem] text-muted-foreground">
              No claims match your search
            </p>
          )}
          {filtered.map((claim) => (
            <ClaimRow
              key={claim.claimId}
              claim={claim}
              isSelected={claim.claimId === selectedClaimId}
              hasChat={workedIds.has(claim.claimId)}
              onClick={() => handleSelectClaim(claim.claimId)}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

function ClaimRow({
  claim,
  isSelected,
  hasChat,
  onClick,
}: {
  claim: Claim;
  isSelected: boolean;
  hasChat: boolean;
  onClick: () => void;
}) {
  const urgency = getUrgencyLevel(claim.filingDeadline);
  const daysLeft = getDaysUntilDeadline(claim.filingDeadline);
  const { label, dot } = STATUS_CONFIG[claim.status];

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2.5 transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        isSelected
          ? "bg-foreground/[0.08] border-l-[3px] border-l-foreground pl-[9px]"
          : "hover:bg-muted/80"
      )}
    >
      <div className="grid grid-cols-[1fr_auto] gap-x-2.5 items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dot)} />
            <span className="text-[0.625rem] uppercase tracking-wider font-medium text-muted-foreground">{label}</span>
            {urgency === "critical" && (
              <AlertTriangle className="w-3 h-3 text-rose-500 flex-shrink-0" />
            )}
            {hasChat && (
              <span
                title="AI review started"
                className="ml-auto flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500"
              />
            )}
          </div>
          <p className={cn(
            "text-[0.8125rem] truncate",
            isSelected ? "text-foreground font-semibold" : "text-foreground/80 font-medium"
          )}>
            {claim.patient.name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[0.6875rem] text-muted-foreground font-mono">{claim.claimId}</span>
            {claim.denialReason && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-[0.6875rem] text-muted-foreground truncate">{claim.denialReason}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-0.5 pt-0.5">
          <span className={cn(
            "text-[0.8125rem] whitespace-nowrap tabular-nums",
            isSelected ? "text-foreground font-bold" : "text-foreground/80 font-semibold"
          )}>
            {formatCurrency(claim.totalBilledAmount)}
          </span>
          {claim.filingDeadline && daysLeft !== null && (
            <span
              className={cn(
                "text-[0.625rem] tabular-nums whitespace-nowrap",
                urgency === "critical"
                  ? "text-rose-600 font-medium"
                  : urgency === "high"
                  ? "text-orange-600"
                  : "text-muted-foreground"
              )}
            >
              {daysLeft < 0 ? "Expired" : `${daysLeft}d`}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
