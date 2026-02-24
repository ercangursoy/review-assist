"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/claim-status";
import { Check, X, AlertTriangle } from "lucide-react";
import type { ClaimStatus } from "@/lib/types";

interface Props {
  args: {
    claimId: string;
    status: ClaimStatus;
    notes: string;
  };
  state: "pending" | "confirmed" | "cancelled";
  onConfirm: () => void;
  onCancel: () => void;
}

export function StatusUpdateCard({ args, state, onConfirm, onCancel }: Props) {
  const { label, dot, text } = STATUS_CONFIG[args.status];

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card overflow-hidden text-[0.8125rem] border-l-[3px] border-l-amber-400 transition-opacity",
        state === "cancelled" && "opacity-50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">Status Update</span>
          <span className="text-[0.75rem] text-muted-foreground">{args.claimId}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {state === "pending" && (
            <span className="text-[0.6875rem] text-amber-700 font-medium">Awaiting confirmation</span>
          )}
          {state === "confirmed" && (
            <span className="flex items-center gap-1 text-[0.6875rem] text-emerald-700 font-medium">
              <Check className="w-3.5 h-3.5" /> Confirmed
            </span>
          )}
          {state === "cancelled" && (
            <span className="flex items-center gap-1 text-[0.6875rem] text-muted-foreground font-medium">
              <X className="w-3.5 h-3.5" /> Cancelled
            </span>
          )}
        </div>
      </div>

      <div className="px-3.5 py-3 space-y-3">
        {/* Proposed change */}
        <div>
          <p className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Proposed Status
          </p>
          <span className={cn("inline-flex items-center gap-1.5 text-[0.8125rem] font-medium", text)}>
            <span className={cn("w-2 h-2 rounded-full flex-shrink-0", dot)} />
            {label}
          </span>
        </div>

        {/* Notes */}
        {args.notes && (
          <div>
            <p className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Notes
            </p>
            <p className="text-[0.8125rem] text-foreground leading-snug bg-muted rounded border border-border/80 px-3 py-2">
              {args.notes}
            </p>
          </div>
        )}

        {/* Write-off warning */}
        {args.status === "written_off" && state === "pending" && (
          <div className="flex items-start gap-2 pl-2.5 border-l-2 border-amber-400 bg-amber-50 rounded-r py-2 pr-2.5 text-[0.75rem] text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              Writing off this claim forfeits payment. This action cannot be undone without manually
              resetting the status.
            </span>
          </div>
        )}

        {/* Actions */}
        {state === "pending" && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={onConfirm}
              className="h-8 px-4 text-[0.75rem] gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Confirm Update
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              className="h-8 px-4 text-[0.75rem] gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </Button>
          </div>
        )}

        {state === "confirmed" && (
          <p className="text-[0.75rem] text-emerald-700 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            Status updated successfully.
          </p>
        )}
      </div>
    </div>
  );
}
