import claimsJson from "@/claims.json";
import type { Claim, UrgencyLevel } from "./types";

export const CLAIMS_DATA: Claim[] = claimsJson as Claim[];

export function getClaimById(claimId: string): Claim | undefined {
  return CLAIMS_DATA.find((c) => c.claimId === claimId);
}

export function getDaysUntilDeadline(filingDeadline: string | null): number | null {
  if (!filingDeadline) return null;
  const deadline = new Date(filingDeadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function getUrgencyLevel(filingDeadline: string | null): UrgencyLevel {
  const days = getDaysUntilDeadline(filingDeadline);
  if (days === null) return "none";
  if (days < 0) return "critical";
  if (days <= 30) return "critical";
  if (days <= 60) return "high";
  if (days <= 90) return "medium";
  return "low";
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
