export type ClaimStatus = "denied" | "rejected" | "pending" | "underpaid" | "resolved" | "written_off";

export interface Patient {
  name: string;
  dateOfBirth: string;
  memberId: string;
}

export interface Provider {
  name: string;
  npi: string;
  specialty: string;
  facility: string;
}

export interface Payer {
  name: string;
  payerId: string;
}

export interface LineItem {
  cptCode: string;
  description: string;
  modifier?: string;
  units: number;
  billedAmount: number;
  allowedAmount: number | null;
  paidAmount: number;
}

export interface PriorAction {
  date: string;
  type: string;
  description: string;
  outcome: string;
}

export interface Claim {
  claimId: string;
  patient: Patient;
  provider: Provider;
  payer: Payer;
  dateOfService: string;
  dateSubmitted: string;
  lineItems: LineItem[];
  totalBilledAmount: number;
  totalAllowedAmount: number | null;
  totalPaidAmount: number;
  status: ClaimStatus;
  denialReason: string | null;
  denialCode: string | null;
  payerNotes: string | null;
  priorActions: PriorAction[];
  filingDeadline: string | null;
  // Fields added by the app at runtime
  notes?: string;
  resolvedAt?: string;
}

export interface SuggestedAction {
  action: "appeal" | "resubmit" | "call_payer" | "write_off" | "request_peer_review" | "submit_documentation" | "update_cob";
  label: string;
  reasoning: string;
  urgency: "high" | "medium" | "low";
  steps: string[];
}

export type UrgencyLevel = "critical" | "high" | "medium" | "low" | "none";
