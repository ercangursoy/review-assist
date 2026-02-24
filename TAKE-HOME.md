# Take-Home Challenge: AI Claims Review Assistant

## Overview

At Joyful, we recover revenue for healthcare practices by working denied and unpaid insurance claims. Our billers review claims, take actions (appeals, resubmissions, payer calls), and document their work — but many of these steps involve repetitive analysis that AI could assist with.

Your task is to build an **AI-powered claims review assistant** — an interactive webapp where an AI helps a billing specialist work through a queue of claims, with the human always in control of final decisions.

## Time Expectation

This challenge is designed to be completed in approximately **2–3 hours**. We value quality over quantity — a polished subset is preferred over a rough complete implementation. If you're running up against the time limit, prioritize depth over breadth — we'd rather see a thoughtful implementation of the core chat and human-in-the-loop flow than shallow coverage of all requirements.

## Constraints

- **AI usage is encouraged** — we expect candidates to use AI coding assistants. We care about the *decisions* you make, not whether you typed every line.
- **Framework**: Your choice (React, Next.js, Svelte, Vue, etc.)
- **AI Provider**: Your choice — we suggest the [Vercel AI SDK](https://sdk.vercel.ai) as a good starting point, but OpenAI SDK, Anthropic SDK, LangChain, or any other approach is fine
- **Component Libraries**: Not required, but encouraged. [shadcn/ui](https://ui.shadcn.com) and [Vercel AI Elements](https://elements.ai-sdk.dev) are great starting points for building polished UIs quickly.
- **Deployment**: Must be accessible via a public URL (Vercel, Netlify, Railway, Fly.io, etc.)
- You don't need a database — loading from the JSON file is fine

## Requirements

### Core (Required)

Build an interactive webapp with:

1. **AI Chat Interface**: A conversational UI where the user can discuss claims with an AI assistant. The AI should be able to:
   - Analyze a claim and explain why it was denied/rejected
   - Suggest a next action (appeal, resubmit, call payer, write off, etc.)
   - Draft appeal language or notes based on the claim details

2. **Custom Tool Calls**: The AI must have at least **2–3 tool calls** it can invoke, such as:
   - `lookupClaim(claimId)` — retrieve claim details from the data file
   - `suggestAction(claimId)` — analyze the claim and propose a resolution with reasoning
   - `draftAppeal(claimId, reason)` — generate appeal letter content
   - `updateClaimStatus(claimId, status, notes)` — record the human's decision
   - Or any other tools you design — creativity is encouraged!

3. **Human-in-the-Loop**: The AI can *suggest* actions, but the human must **explicitly confirm or modify** before any status change is applied. This should be a clear UX pattern (e.g., confirmation cards, approve/reject buttons, inline editing of AI drafts).

4. **Claims Dashboard**: A simple view showing the queue of claims with their statuses, that updates as the user works through them with the AI.

5. **Polished UI**: The app should be styled and feel like a real product, not a raw prototype. We're looking for good visual hierarchy, clear interaction patterns, and thoughtful use of space.

### Bonus (If Time Permits)

- Streaming AI responses
- Keyboard shortcuts or power-user affordances
- Claim priority/urgency indicators
- Batch operations (e.g., "review all duplicate claim denials")
- Persistent state (claim statuses survive page refresh)
- Error handling for AI failures (graceful degradation)
- Mobile-responsive layout

## Provided Data

See `claims.json` for 15 mock healthcare claims. Each claim includes:

- **Claim ID**, patient info, date of service, provider, and payer
- **CPT codes** (procedure codes) with billed/allowed/paid amounts
- **Claim status**: `denied`, `rejected`, `pending`, or `underpaid`
- **Denial/rejection reason and code** (e.g., "Missing prior authorization", "Timely filing limit exceeded")
- **Payer notes** explaining the denial in detail
- **Prior actions** taken on the claim (if any), with outcomes
- **Filing deadline** for appeals/resubmissions

## Deliverables

1. **Working code** pushed to a GitHub repo (can be a fork of this one or a new repo)
2. **Deployed app** accessible via a public URL
3. **Writeup** (~300–500 words, in this README or a separate doc) explaining:
   - How to run your solution locally
   - Technical choices: framework, AI provider/model, state management, deployment — and *why*
   - Product/design choices: how you approached the human-in-the-loop UX, trade-offs you made, what you'd improve with more time
   - AI integration: how you structured tool calls, prompt engineering approach, any challenges with AI reliability

## Evaluation Criteria

We're looking for:

- **Product Thinking & UX**: Does the human-in-the-loop pattern feel natural? Is the workflow intuitive for a non-technical billing specialist?
- **AI Integration & Tool Design**: Are the tool calls well-scoped and purposeful? Does the AI feel helpful without being overbearing?
- **Code Quality & Architecture**: Clean, readable code with appropriate componentization and separation of concerns
- **Visual Design & Polish**: Does the app feel like a real product? Thoughtful use of spacing, typography, and color
- **Communication**: Clear articulation of decisions, trade-offs, and self-awareness about limitations

## Questions?

If anything is unclear, make a reasonable assumption and document it. We're interested in seeing how you approach ambiguity.

---

Good luck! We're excited to see your approach.
