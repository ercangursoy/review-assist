"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CLAIMS_DATA } from "./claims-data";
import type { Claim, ClaimStatus } from "./types";

const STORAGE_KEY = "joyful_claims_state";

interface ClaimsContextValue {
  claims: Claim[];
  selectedClaimId: string | null;
  selectClaim: (claimId: string | null) => void;
  updateClaimStatus: (claimId: string, status: ClaimStatus, notes?: string) => void;
  getClaimById: (claimId: string) => Claim | undefined;
}

const ClaimsContext = createContext<ClaimsContextValue | null>(null);

export function ClaimsProvider({ children }: { children: React.ReactNode }) {
  const [claims, setClaims] = useState<Claim[]>(CLAIMS_DATA);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Record<string, { status: ClaimStatus; notes?: string; resolvedAt?: string }> =
          JSON.parse(stored);
        setClaims((prev) =>
          prev.map((claim) => {
            const override = parsed[claim.claimId];
            if (!override) return claim;
            return { ...claim, ...override };
          })
        );
      }
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  // Persist overrides to localStorage whenever claims change
  useEffect(() => {
    if (!hydrated) return;
    const overrides: Record<string, { status: ClaimStatus; notes?: string; resolvedAt?: string }> = {};
    claims.forEach((claim) => {
      const original = CLAIMS_DATA.find((c) => c.claimId === claim.claimId);
      if (
        original &&
        (claim.status !== original.status ||
          claim.notes !== original.notes ||
          claim.resolvedAt !== original.resolvedAt)
      ) {
        overrides[claim.claimId] = {
          status: claim.status,
          notes: claim.notes,
          resolvedAt: claim.resolvedAt,
        };
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  }, [claims, hydrated]);

  function selectClaim(claimId: string | null) {
    setSelectedClaimId(claimId);
  }

  function updateClaimStatus(claimId: string, status: ClaimStatus, notes?: string) {
    setClaims((prev) =>
      prev.map((claim) => {
        if (claim.claimId !== claimId) return claim;
        return {
          ...claim,
          status,
          notes: notes ?? claim.notes,
          resolvedAt: status === "resolved" || status === "written_off"
            ? new Date().toISOString()
            : claim.resolvedAt,
        };
      })
    );
  }

  function getClaimById(claimId: string) {
    return claims.find((c) => c.claimId === claimId);
  }

  return (
    <ClaimsContext.Provider
      value={{ claims, selectedClaimId, selectClaim, updateClaimStatus, getClaimById }}
    >
      {children}
    </ClaimsContext.Provider>
  );
}

export function useClaims() {
  const ctx = useContext(ClaimsContext);
  if (!ctx) throw new Error("useClaims must be used inside ClaimsProvider");
  return ctx;
}
