import type { ClaimStatus } from "./types";

export const STATUS_CONFIG: Record<ClaimStatus, { label: string; dot: string; text: string }> = {
  denied:      { label: "Denied",      dot: "bg-rose-500",       text: "text-rose-600" },
  rejected:    { label: "Rejected",    dot: "bg-orange-500",     text: "text-orange-600" },
  pending:     { label: "Pending",     dot: "bg-amber-500",      text: "text-amber-600" },
  underpaid:   { label: "Underpaid",   dot: "bg-foreground/30",  text: "text-muted-foreground" },
  resolved:    { label: "Resolved",    dot: "bg-emerald-500",    text: "text-emerald-600" },
  written_off: { label: "Written Off", dot: "bg-foreground/20",  text: "text-muted-foreground" },
};

export const TERMINAL_STATUSES: ClaimStatus[] = ["resolved", "written_off"];
export const ACTIVE_STATUSES: ClaimStatus[] = ["denied", "rejected", "pending", "underpaid"];
export const CLOSED_STATUSES: ClaimStatus[] = ["resolved", "written_off"];
