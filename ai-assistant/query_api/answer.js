const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { retrieve } = require('./vectorStore');
const { generateAnswer } = require('./llmClient');

const AUDIT_LOG_PATH = path.join(__dirname, '..', '_store', 'audit-log.jsonl');

// Guardrail 1 (guardrails.md): never return an answer with zero citations.
function requireCitations(retrievedChunks) {
  if (retrievedChunks.length === 0) {
    throw new Error('No retrieved context — refusing to answer without citations.');
  }
}

function appendAuditLog(entry) {
  fs.mkdirSync(path.dirname(AUDIT_LOG_PATH), { recursive: true });
  fs.appendFileSync(AUDIT_LOG_PATH, JSON.stringify(entry) + '\n');
}

// Guardrail 3 (guardrails.md): every query/response is audit-logged with a correlation ID.
async function answerQuestion(question) {
  const correlationId = randomUUID();
  const retrievedChunks = retrieve(question, 2);
  requireCitations(retrievedChunks);

  const { text, grounded } = generateAnswer(question, retrievedChunks);

  const response = {
    correlationId,
    question,
    answer: text,
    grounded,
    citations: retrievedChunks.map((c) => ({ source: c.source, title: c.title, score: Number(c.score.toFixed(3)) })),
  };

  appendAuditLog({ ...response, timestamp: new Date().toISOString() });
  return response;
}

module.exports = { answerQuestion };
