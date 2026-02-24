# Joyful AI: Claims Review Assistant

An AI-powered claims review assistant for healthcare billing specialists. Review denied and unpaid insurance claims with AI guidance, while keeping humans firmly in control of every decision.

**Live Demo**: *(deployment URL)*

---

## Running Locally

```bash
# Install dependencies
yarn install

# Set up environment
cp .env.local.example .env.local
# Add your AI_GATEWAY_API_KEY (from Vercel dashboard > AI > Settings)

# Start dev server
yarn dev
# Open http://localhost:3000
```

Requires Node.js 18+ and Yarn 4. For local dev, set `AI_GATEWAY_API_KEY` in `.env.local`. On Vercel, the AI Gateway uses OIDC, so no env vars are needed.

---

## Technical Choices

**Next.js 16 (App Router).** Server components, API routes, and Vercel deployment in a single setup. The App Router's streaming support pairs naturally with the AI SDK.

**Vercel AI SDK v6 + AI Gateway.** v6's `UIMessage` type and `DynamicToolUIPart` provide first-class support for rendering tool calls as interactive UI components rather than raw JSON. Three of the four tools are client-side (no `execute`), meaning they render structured cards that the human must interact with before the conversation continues. The AI Gateway provides free credits on Vercel deployments. Model: `gpt-4o-mini` for fast, cost-effective responses.

**shadcn/ui + Tailwind CSS v4.** Production-quality accessible components with full design control. Custom text sizing uses `rem` units for accessibility.

**React Context + localStorage.** No database needed. Claims state, chat history, and tool interaction states all persist to `localStorage`. Chat messages are keyed per claim ID; tool states are keyed by unique tool call IDs. Only status overrides are stored; original claim data always comes from `claims.json`.

---

## Product & Design Choices

**Three-Column Layout.** Desktop shows a resizable sidebar (claims queue), claim detail panel, and AI chat side-by-side. Drag handles allow resizing. On tablet, the detail and chat panels share space via tabs. On mobile, the full screen is dedicated to one view at a time with a back button and tab navigation.

**Human-in-the-Loop Tiering.** Four interaction patterns, tiered by risk level:

1. **Instant render**: `lookupClaim` executes server-side and displays data immediately (read-only, no confirmation needed)
2. **Approve/Reject cards**: `suggestAction` renders structured action cards with reasoning, urgency badge, and step-by-step instructions; the AI cannot proceed until the human responds
3. **Editable drafts**: `draftAppeal` renders the letter in an editable textarea with copy-to-clipboard; billers refine before accepting
4. **Explicit confirmation**: `updateClaimStatus` shows a confirmation card with a write-off warning; the status change only fires on human click

There are two paths to update a claim's status: (a) approve an AI-suggested action, which maps the action type to the appropriate status automatically, or (b) use the manual quick-action buttons in the detail panel for direct control.

**Trade-offs.** With more time I'd add: batch operations ("fix all modifier issues"), an audit trail for AI interactions, richer search (by denial code, payer), and end-to-end tests for the HITL flow.

---

## AI Integration

**Tool Design.** Each tool has a bounded responsibility. `lookupClaim` is the grounding tool; the system prompt requires the AI to call it before any analysis, preventing hallucination. `suggestAction` and `draftAppeal` render structured UI rather than free text, making suggestions machine-readable and interactive. `updateClaimStatus` is the only mutation tool and is never auto-executed; a system prompt rule explicitly prevents chaining it after suggestions.

**System Prompt.** Encodes domain expertise for 11 denial codes (CO-197, CO-50, CO-4, etc.), behavioral constraints (always use tools, never decide unilaterally), and the critical rule that `suggestAction` is terminal: the UI handles status updates on approval, not the AI.

**Reliability.** Input validation and try/catch on the API route return structured errors instead of unhandled crashes. `ignoreIncompleteToolCalls` in message conversion prevents SDK errors from unanswered client-side tools. `ErrorBoundary` components wrap the chat and workspace for graceful degradation. `stopWhen: stepCountIs(5)` caps agentic loops.

---

## Bonus Features Implemented

- **Streaming AI responses** via `toUIMessageStreamResponse`
- **Keyboard shortcut**: Enter to send
- **Urgency indicators**: color-coded badges, pulsing critical alerts for approaching deadlines
- **Persistent state**: claims, chat history, and tool states survive page refresh
- **Error handling**: ErrorBoundary, API validation, toast notifications
- **Mobile-responsive layout**: adaptive 1/2/3-column layout across mobile, tablet, and desktop
