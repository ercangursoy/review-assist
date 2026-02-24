"use client";

import { formatCurrency, formatDate } from "@/lib/claims-data";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/claim-status";
import type { Claim } from "@/lib/types";

interface Props {
  result: { claim?: Claim; error?: string };
}

export function ClaimLookupCard({ result }: Props) {
  if (result.error) {
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-[0.8125rem] text-rose-700">
        {result.error}
      </div>
    );
  }

  const claim = result.claim;
  if (!claim) return null;

  const gap = claim.totalBilledAmount - claim.totalPaidAmount;

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden text-[0.8125rem] border-l-[3px] border-l-foreground/20">
      {/* Card header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full flex-shrink-0", STATUS_CONFIG[claim.status].dot)} />
          <span className="font-semibold text-foreground">{claim.claimId}</span>
          <span className="text-muted-foreground">{STATUS_CONFIG[claim.status].label}</span>
        </div>
        <span className="font-semibold tabular-nums">{formatCurrency(claim.totalBilledAmount)}</span>
      </div>

      <div className="px-3.5 py-3 space-y-3">
        {/* Patient + Payer */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Patient
            </p>
            <p className="font-medium">{claim.patient.name}</p>
            <p className="text-[0.75rem] text-muted-foreground font-mono">{claim.patient.memberId}</p>
          </div>
          <div>
            <p className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Payer
            </p>
            <p className="font-medium">{claim.payer.name}</p>
            {claim.denialCode && (
              <span className="text-[0.6875rem] font-mono px-1.5 py-0.5 rounded border border-border bg-muted">
                {claim.denialCode}
              </span>
            )}
          </div>
        </div>

        {/* Denial reason */}
        {claim.denialReason && (
          <div className="pl-2.5 border-l-2 border-rose-300 text-[0.75rem] text-muted-foreground">
            {claim.denialReason}
          </div>
        )}

        {/* Financials */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Billed",   value: formatCurrency(claim.totalBilledAmount) },
            { label: "Allowed",  value: formatCurrency(claim.totalAllowedAmount) },
            { label: "Paid",     value: formatCurrency(claim.totalPaidAmount) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-muted rounded border border-border px-2.5 py-2 text-center">
              <p className="text-[0.625rem] text-muted-foreground mb-0.5">{label}</p>
              <p className="font-semibold text-[0.8125rem] tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        {/* Gap + deadline */}
        <div className="flex items-center justify-between text-[0.75rem] text-muted-foreground">
          {gap > 0 && (
            <span>
              Recovery gap:{" "}
              <span className="font-semibold text-rose-600 tabular-nums">
                {formatCurrency(gap)}
              </span>
            </span>
          )}
          {claim.filingDeadline && (
            <span className="ml-auto">
              Appeal deadline:{" "}
              <span className="font-medium text-foreground">{formatDate(claim.filingDeadline)}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
