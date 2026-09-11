const app = require('./server');

const PORT = process.env.PORT || 4300;

app.listen(PORT, () => {
  console.log(`[ai-assistant/query_api] listening on http://localhost:${PORT}`);
  console.log('  POST /ask { "question": "..." }');
});
