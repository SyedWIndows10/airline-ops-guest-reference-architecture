# ADR 0005: AI guardrails for the SOP assistant

## Status
Accepted

## Context
`ai-assistant/` answers questions against SOP/manual documents using RAG. Because its answers can shape real operational decisions during a disruption, an ungrounded or directive-sounding answer is a safety concern, not just a quality one. The naive approach — call a chat completion model with retrieved context and return whatever text comes back — has no mechanism to prevent hallucinated or ungrounded answers, and no mechanism to prove after the fact what the assistant told someone.

## Decision
Three guardrails are enforced in code, not just in a prompt:

1. **Mandatory citation** — `query_api/answer.js`'s `requireCitations` refuses to return an answer with zero retrieved context, and every answer names its source document/section.
2. **Human-approval boundary** — the assistant is scoped to answering informational questions about documented procedure; it does not issue operational directives. This is a design constraint on what the service does, not a prompt instruction the model could ignore.
3. **Audit log** — every question, retrieved context, and answer is logged with a correlation ID (`ai-assistant/_store/audit-log.jsonl`), so "what did the assistant tell someone, and what was it grounded in" is answerable after the fact.

See [ai-assistant/guardrails.md](../../ai-assistant/guardrails.md) for the full detail and what's mocked vs. real in this reference implementation.

## Options considered

**A — Direct prompt-only guardrails ("please always cite your sources") (rejected)**
- Nothing stops the model from generating a fluent, uncited, or directive answer; the guardrail is advisory, not enforced.
- No structural mechanism exists to prove what happened after the fact.

**B — Guardrails enforced in the retrieval/response code path (accepted)**
- `requireCitations` throws before generation runs if retrieval returned nothing — the failure mode is a refusal, not a hallucination.
- The audit log is written by the service itself, independent of what the model claims it did.
- Costs a small amount of latency and code complexity in exchange for guardrails that hold even if the underlying model changes.

## Consequences
- Swapping the stubbed local embedding/completion functions (`query_api/embedding.js`, `query_api/llmClient.js`) for a live model API does not require touching the guardrail logic in `answer.js` — the guardrails are structural, not model-specific.
- The "informational only, not directive" boundary is a product/scope decision that must be re-validated any time the assistant's scope grows (e.g. if it were ever extended toward recommending an action).
