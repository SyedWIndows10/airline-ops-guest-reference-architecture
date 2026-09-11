# AI Assistant — RAG SOP/Manual Assistant

A small, working retrieval-augmented-generation pipeline over mock SOP documents, built around the guardrails in [guardrails.md](guardrails.md): mandatory citation, a human-approval boundary, and an audit log.

## Running it

```bash
# 1. Build the vector store from mock_sops/
python ingest_manuals.py

# 2. Start the query API
cd query_api && npm install && npm start

# 3. Ask it something
curl -X POST http://localhost:4300/ask -H "Content-Type: application/json" \
  -d '{"question": "How soon must guests be notified of a major delay?"}'
```

## What's real vs. mocked

See [guardrails.md](guardrails.md#whats-mocked-vs-real-in-this-reference-implementation) — the retrieve→cite→log pipeline is real and runs end-to-end; the embedding and completion steps are deterministic local stand-ins for a live model API, so the whole thing runs with zero API keys.
