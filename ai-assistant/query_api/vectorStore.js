const fs = require('fs');
const path = require('path');
const { embed, cosineSimilarity } = require('./embedding');

const STORE_PATH = path.join(__dirname, '..', '_store', 'vector_store.json');

function loadStore() {
  if (!fs.existsSync(STORE_PATH)) {
    throw new Error(
      `Vector store not found at ${STORE_PATH}. Run "python ingest_manuals.py" from ai-assistant/ first.`
    );
  }
  return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
}

/** Returns the top-k chunks by cosine similarity to the query. */
function retrieve(query, k = 2) {
  const store = loadStore();
  const queryVector = embed(query, store.dims);
  const scored = store.chunks.map((chunk) => ({
    ...chunk,
    score: cosineSimilarity(queryVector, chunk.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

module.exports = { retrieve };
