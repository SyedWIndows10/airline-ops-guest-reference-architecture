# AI Guardrails — SOP/Manual Assistant

This assistant answers questions against a small set of mock SOP/manual documents using retrieval-augmented generation (RAG). Because its answers can influence real operational decisions (e.g. "what's the procedure for a diversion due to medical emergency"), it is designed around three guardrails rather than shipped as a plain chatbot. See [ADR 0005](../docs/03-adr/0005-ai-guardrails-for-sop-assistant.md) for the decision record.

## 1. Mandatory citation

Every answer must include the source document and section it was drawn from. If the retrieved context doesn't contain a clear answer, the assistant says so explicitly rather than generating a plausible-sounding but ungrounded answer. `query_api` refuses to return a response with zero citations — see `query_api/answer.js`'s `requireCitations` check.

## 2. Human-approval boundary

This assistant answers **informational** questions about documented procedure. It does not take or recommend an operational action on its own authority (e.g. it will not say "cancel flight AA123" — it will say "SOP §4.2 states a diversion should be considered when..."). Any output that reads as a directive rather than a citation is a design bug, not an acceptable edge case.

## 3. Audit log

Every query, retrieved context, and response is logged with a timestamp and correlation ID so that "what did the assistant tell someone, and what was it grounded in" is answerable after the fact — the same traceability principle applied to every other event in this system (see `schemas/README.md`'s `correlationId` convention).

## What's mocked vs. real in this reference implementation

- **Real:** the embed → store → retrieve → cite pipeline, running against 3-4 short mock SOP documents.
- **Mocked:** the embedding/completion model calls are stubbed with a deterministic local function rather than calling a live Azure OpenAI endpoint, so this repo runs with zero API keys and zero cost. Swapping in a real model call is a single-function change — see `query_api/llmClient.js`.
