const crypto = require('crypto');

const EMBEDDING_DIMS = 64;

// Mirrors ingest_manuals.py's deterministic_embedding() so a query embeds into
// the same vector space as the stored chunks. See guardrails.md for why this
// hashing-trick embedding stands in for a real embedding API call.
function embed(text, dims = EMBEDDING_DIMS) {
  const vector = new Array(dims).fill(0);
  const words = (text.toLowerCase().match(/[a-z]+/g) || []);
  for (const word of words) {
    const hash = crypto.createHash('md5').update(word, 'utf-8').digest('hex');
    const bucket = Number(BigInt('0x' + hash) % BigInt(dims));
    vector[bucket] += 1.0;
  }
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return norm > 0 ? vector.map((v) => v / norm) : vector;
}

function cosineSimilarity(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // both vectors are already L2-normalized, so dot product = cosine similarity
}

module.exports = { embed, cosineSimilarity, EMBEDDING_DIMS };
