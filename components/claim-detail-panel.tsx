"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useClaims } from "@/lib/claims-context";
import { formatCurrency, formatDate, getDaysUntilDeadline, getUrgencyLevel } from "@/lib/claims-data";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, TERMINAL_STATUSES } from "@/lib/claim-status";
import { AlertTriangle, Check, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClaimStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: ClaimStatus; label: string; short: string }[] = [
  { value: "resolved",    label: "Resolved — payment recovered",     short: "✓ Resolved"    },
  { value: "written_off", label: "Written Off — forfeiting payment", short: "✗ Written Off" },
  { value: "pending",     label: "Pending — action in progress",     short: "↻ Set Pending" },
];

const QUICK_ACTIONS = [
  { value: "resolved"    as ClaimStatus, label: "Resolve",     Icon: Check,     activeBg: "bg-emerald-600", activeText: "text-white",      hoverClass: "hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200" },
  { value: "written_off" as ClaimStatus, label: "Write Off",   Icon: X,         activeBg: "bg-foreground",  activeText: "text-background", hoverClass: "hover:bg-muted hover:text-foreground hover:border-foreground/20" },
  { value: "pending"     as ClaimStatus, label: "Set Pending", Icon: RotateCcw, activeBg: "bg-amber-500",   activeText: "text-white",      hoverClass: "hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200" },
] as const;

export function ClaimDetailPanel() {
  const { selectedClaimId, getClaimById, updateClaimStatus } = useClaims();
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<ClaimStatus>("resolved");
  const [note, setNote] = useState("");

  const claim = selectedClaimId ? getClaimById(selectedClaimId) : null;

  if (!claim) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <p className="text-[0.8125rem] text-muted-foreground px-6 text-center">
          Select a claim from the queue to view details.
        </p>
      </div>
    );
  }

  const urgency = getUrgencyLevel(claim.filingDeadline);
  const daysLeft = getDaysUntilDeadline(claim.filingDeadline);
  const { label, dot, text } = STATUS_CONFIG[claim.status];
  const gap = claim.totalBilledAmount - claim.totalPaidAmount;

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn("w-2 h-2 rounded-full shrink-0", dot)} />
            <span className={cn("text-[0.6875rem] font-semibold uppercase tracking-wide shrink-0", text)}>{label}</span>
          </div>
          <span className="text-[0.75rem] font-mono text-muted-foreground shrink-0">{claim.claimId}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[0.9375rem] font-semibold text-foreground truncate">
            {claim.patient.name}
          </span>
          <span className="text-[0.9375rem] font-bold text-foreground tabular-nums shrink-0 ml-3">
            {formatCurrency(claim.totalBilledAmount)}
          </span>
        </div>
      </div>

      {/* Quick-action strip */}
      {!TERMINAL_STATUSES.includes(claim.status) && (
        <div className="px-4 py-2 border-b border-border flex items-center gap-2 flex-wrap shrink-0">
          {QUICK_ACTIONS.map(({ value, label: btnLabel, Icon, activeBg, activeText, hoverClass }) => {
            const isActive = updating && newStatus === value;
            return (
              <button
                key={value}
                onClick={() => { setNewStatus(value); setUpdating(newStatus !== value || !updating ? true : !updating); }}
                className={cn(
                  "flex items-center gap-1.5 text-[0.75rem] font-medium px-3 py-1.5 rounded-md border transition-all whitespace-nowrap",
                  isActive
                    ? cn(activeBg, activeText, "border-transparent shadow-sm")
                    : cn("text-muted-foreground border-border", hoverClass)
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {btnLabel}
              </button>
            );
          })}
        </div>
      )}

      {/* Confirmation form */}
      {updating && !TERMINAL_STATUSES.includes(claim.status) && (
        <div
          className="px-4 py-3 border-b border-border shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-1.5 mb-2.5">
            <label className="text-[0.625rem] font-semibold text-muted-foreground uppercase tracking-widest">
              Note (optional)
            </label>
            <input
              type="text"
              placeholder="Briefly document what was done…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="text-[0.8125rem] rounded-md border border-input bg-background px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-[34px] px-4 text-[0.75rem]"
              onClick={() => {
                updateClaimStatus(claim.claimId, newStatus, note || undefined);
                setUpdating(false);
                setNote("");
                toast.success(`Claim ${claim.claimId} updated to ${STATUS_OPTIONS.find((o) => o.value === newStatus)?.short}`);
              }}
            >
              Confirm — {STATUS_OPTIONS.find((o) => o.value === newStatus)?.short}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-[34px] px-3 text-[0.75rem]"
              onClick={() => { setUpdating(false); setNote(""); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Scrollable detail body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Urgency banner */}
        {urgency === "critical" && daysLeft !== null && (
          <div className="mx-4 mt-3 flex items-center gap-1.5 text-rose-600 bg-rose-50 rounded-md px-3 py-2 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[0.75rem] font-medium">
              {daysLeft < 0 ? "Filing deadline has passed" : `${daysLeft} days until filing deadline`}
            </span>
          </div>
        )}

        {/* Key info grid */}
        <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <SectionLabel>Patient</SectionLabel>
            <p className="text-[0.8125rem] font-medium">{claim.patient.name}</p>
            <p className="text-[0.6875rem] text-muted-foreground">DOB {formatDate(claim.patient.dateOfBirth)}</p>
            <p className="text-[0.6875rem] text-muted-foreground font-mono">{claim.patient.memberId}</p>
          </div>
          <div>
            <SectionLabel>Provider</SectionLabel>
            <p className="text-[0.8125rem] font-medium">{claim.provider.name}</p>
            <p className="text-[0.6875rem] text-muted-foreground">{claim.provider.specialty}</p>
          </div>
          <div>
            <SectionLabel>Payer</SectionLabel>
            <p className="text-[0.8125rem] font-medium">{claim.payer.name}</p>
            <p className="text-[0.6875rem] text-muted-foreground">{claim.payer.payerId}</p>
            {claim.denialCode && (
              <span className="inline-block mt-1 text-[0.625rem] font-mono font-medium px-1.5 py-0.5 rounded border border-border bg-muted text-foreground">
                {claim.denialCode}
              </span>
            )}
          </div>
          <div>
            <SectionLabel>Financials</SectionLabel>
            <div className="space-y-1">
              <Row label="Billed"  value={formatCurrency(claim.totalBilledAmount)} />
              <Row label="Allowed" value={formatCurrency(claim.totalAllowedAmount)} />
              <Row label="Paid"    value={formatCurrency(claim.totalPaidAmount)} />
              {gap > 0 && (
                <Row label="Gap" value={formatCurrency(gap)} valueClass="text-rose-600 font-semibold" />
              )}
            </div>
          </div>
        </div>

        {claim.filingDeadline && (
          <div className="px-4 pb-3">
            <Row
              label="Filing deadline"
              value={formatDate(claim.filingDeadline)}
              valueClass={urgency === "critical" ? "text-rose-600 font-semibold" : undefined}
            />
          </div>
        )}

        <div className="border-t border-border" />

        {/* Denial reason */}
        {claim.denialReason && (
          <div className="px-4 py-3 border-b border-border">
            <SectionLabel>Denial Reason</SectionLabel>
            <p className="text-[0.8125rem] text-foreground leading-relaxed">{claim.denialReason}</p>
          </div>
        )}

        {/* Payer notes */}
        {claim.payerNotes && (
          <div className="px-4 py-3 border-b border-border bg-amber-50/50">
            <SectionLabel className="text-amber-700">Payer Notes</SectionLabel>
            <p className="text-[0.8125rem] text-amber-900 leading-relaxed">{claim.payerNotes}</p>
          </div>
        )}

        {/* Line items */}
        <div className="px-4 py-3 border-b border-border">
          <SectionLabel>Line Items</SectionLabel>
          <div className="mt-1.5 rounded-md border border-border overflow-hidden">
            <table className="w-full text-[0.75rem]">
              <thead>
                <tr className="bg-muted/60 border-b border-border">
                  <th className="text-left px-2.5 py-1.5 font-medium text-muted-foreground">CPT</th>
                  <th className="text-right px-2.5 py-1.5 font-medium text-muted-foreground">Billed</th>
                  <th className="text-right px-2.5 py-1.5 font-medium text-muted-foreground">Paid</th>
                </tr>
              </thead>
              <tbody>
                {claim.lineItems.map((item) => (
                  <tr
                    key={`${item.cptCode}-${item.modifier ?? ""}`}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="px-2.5 py-1.5 font-mono font-medium whitespace-nowrap">
                      {item.cptCode}
                      {item.modifier && (
                        <span className="ml-1 text-[0.625rem] text-muted-foreground">·{item.modifier}</span>
                      )}
                    </td>
                    <td className="px-2.5 py-1.5 text-right tabular-nums text-muted-foreground">
                      {formatCurrency(item.billedAmount)}
                    </td>
                    <td className={cn(
                      "px-2.5 py-1.5 text-right tabular-nums font-medium",
                      item.paidAmount === 0 ? "text-rose-600" : "text-emerald-700"
                    )}>
                      {formatCurrency(item.paidAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Prior actions */}
        {claim.priorActions.length > 0 && (
          <div className="px-4 py-3">
            <SectionLabel>Prior Actions</SectionLabel>
            <div className="mt-1 space-y-2">
              {claim.priorActions.map((action) => (
                <div key={`${action.date}-${action.type}`} className="text-[0.75rem] rounded-md border border-border p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground tabular-nums">{formatDate(action.date)}</span>
                      <span className="text-muted-foreground capitalize">{action.type}</span>
                    </div>
                    <span className={cn(
                      "text-[0.625rem] font-semibold uppercase tracking-wide",
                      action.outcome === "denied"  ? "text-rose-600" :
                      action.outcome === "pending" ? "text-amber-600" :
                                                     "text-emerald-600"
                    )}>
                      {action.outcome}
                    </span>
                  </div>
                  <p className="text-foreground/80 leading-relaxed">{action.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider mb-1", className)}>
      {children}
    </p>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[0.75rem] text-muted-foreground">{label}</span>
      <span className={cn("text-[0.75rem] tabular-nums", valueClass ?? "text-foreground")}>{value}</span>
    </div>
  );
}
