import { streamText, tool, createGateway, convertToModelMessages, stepCountIs } from "ai";
import type { UIMessage } from "ai";
import { z } from "zod";
import claimsJson from "@/claims.json";
import type { Claim } from "@/lib/types";

// Vercel AI Gateway — auto-uses OIDC on Vercel, API key for local dev
const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

const CLAIMS_DATA = claimsJson as Claim[];

function findClaim(claimId: string): Claim | undefined {
  return CLAIMS_DATA.find(
    (c) => c.claimId.toLowerCase() === claimId.toLowerCase()
  );
}

const SYSTEM_PROMPT = `You are Claims Review Assistant, an expert medical billing specialist assistant helping a billing team recover denied and unpaid insurance claims.

Your role:
- Help billing specialists analyze denied/rejected/underpaid claims
- Suggest actionable next steps with clear clinical and administrative reasoning
- Draft professional appeal letters and correspondence
- Always be concise and specific — this is a professional tool, not a chatbot

Critical behavioral rules:
1. ALWAYS call lookupClaim before analyzing any specific claim. Never analyze from memory.
2. When suggesting an action, ALWAYS use the suggestAction tool so the human sees a structured approval card. After calling suggestAction, STOP — do not call updateClaimStatus. The UI handles the status update when the human approves.
3. When drafting an appeal or letter, ALWAYS use the draftAppeal tool — never just write the letter in chat text.
4. Use updateClaimStatus ONLY when the human explicitly asks to change a claim's status (e.g. "mark this as resolved", "write this off"). Do NOT call it automatically after suggestAction.
5. You SUGGEST — you never unilaterally make decisions. The human must explicitly confirm all status changes.
6. Be direct and specific. Cite denial codes, CPT codes, and specific payer rules.
7. Keep responses concise. Do not restate information already visible in the claim cards.

Domain knowledge:
- CO-197: Missing prior authorization — can request retroactive auth, file appeal with auth documentation
- CO-50: Medical necessity — requires clinical documentation, peer-to-peer review, or functional improvement evidence
- CO-4: Invalid modifier — typically a clean resubmission with corrected coding
- CO-18: Duplicate claim — resubmit with modifier 76/77 if genuinely a separate service
- CO-29: Timely filing — only appealable if delay was payer's fault; otherwise write-off is likely best
- CO-22: Coordination of benefits — need EOB from primary payer, or update payer records if coverage ended
- CO-45: Allowed amount — check contracted rate vs billed; unbundling issues require modifier review
- CO-97: Bundled procedure — check CCI edits; some bundled codes can be unbundled with correct modifiers
- CO-11: Out of network — verify if emergency exception applies, or if patient can be counseled
- CO-16: Missing information — clean resubmit with correct/complete fields
- CO-167: Invalid diagnosis — update to more specific ICD-10 that supports medical necessity

When you start a conversation, greet the user briefly and ask how you can help with the claim.`;

export async function POST(req: Request) {
  let messages: UIMessage[];
  try {
    const body = await req.json();
    messages = body.messages;
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid request: messages must be an array" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
  const result = streamText({
    model: gateway("openai/gpt-4o-mini"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages, {
      ignoreIncompleteToolCalls: true,
    }),
    // Allow up to 5 agentic steps so the AI can chain:
    // lookupClaim → suggestAction / draftAppeal / updateClaimStatus
    stopWhen: stepCountIs(5),
    tools: {
      // Server-side tool: executes immediately, returns claim data
      lookupClaim: tool({
        description:
          "Retrieve full details of a specific claim by its ID. Always call this before analyzing a claim.",
        inputSchema: z.object({
          claimId: z.string().describe("The claim ID, e.g. CLM-1001"),
        }),
        execute: async ({ claimId }) => {
          const claim = findClaim(claimId);
          if (!claim) {
            return {
              error: `Claim ${claimId} not found. Available IDs: ${CLAIMS_DATA.map((c) => c.claimId).join(", ")}`,
            };
          }
          return { claim };
        },
      }),

      // Client-side tools: rendered as interactive cards, require human interaction
      suggestAction: tool({
        description:
          "Analyze a claim and suggest a specific resolution action. This renders a structured card with Approve/Reject buttons that the human must interact with. Use this whenever you want to propose a next step.",
        inputSchema: z.object({
          claimId: z.string().describe("The claim ID to analyze"),
          action: z
            .enum(["appeal", "resubmit", "call_payer", "write_off", "request_peer_review", "submit_documentation", "update_cob"])
            .describe("The recommended action type"),
          label: z.string().describe("Short human-readable label for the action, e.g. 'File a formal appeal'"),
          reasoning: z
            .string()
            .describe("Clear explanation of why this action is recommended, referencing specific denial codes and clinical context"),
          urgency: z.enum(["high", "medium", "low"]).describe("How urgently this action should be taken"),
          steps: z
            .array(z.string())
            .describe("Ordered list of concrete steps the biller should take to execute this action"),
        }),
      }),

      draftAppeal: tool({
        description:
          "Generate a professional appeal letter or correspondence draft for a claim. Renders an editable card so the human can review and modify before using. Use this when an appeal, resubmission cover letter, or payer correspondence is needed.",
        inputSchema: z.object({
          claimId: z.string().describe("The claim ID this letter is for"),
          letterType: z
            .enum(["appeal", "resubmission", "peer_to_peer_request", "cob_update", "retroactive_auth"])
            .describe("Type of letter or correspondence to draft"),
          subject: z.string().describe("Subject line for the letter"),
          body: z
            .string()
            .describe(
              "Full professional letter body. Include: date placeholder, recipient salutation, clear opening statement, clinical/administrative argument, specific evidence cited, requested action, and professional closing. Use \\n for line breaks."
            ),
        }),
      }),

      updateClaimStatus: tool({
        description:
          "Record a status update for a claim after the human has explicitly approved the action. This renders a confirmation card — the actual update only happens when the human clicks Confirm. Only call this after the human has agreed to take an action.",
        inputSchema: z.object({
          claimId: z.string().describe("The claim ID to update"),
          status: z
            .enum(["denied", "rejected", "pending", "underpaid", "resolved", "written_off"])
            .describe("The new status to set"),
          notes: z
            .string()
            .describe("Brief notes documenting what action was taken and why"),
        }),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "AI service unavailable";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
