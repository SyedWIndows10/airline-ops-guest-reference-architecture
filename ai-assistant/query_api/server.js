const express = require('express');
const { answerQuestion } = require('./answer');

const app = express();
app.use(express.json());

app.post('/ask', async (req, res) => {
  const { question } = req.body || {};
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Request body must include a "question" string.' });
  }

  try {
    const response = await answerQuestion(question);
    res.json(response);
  } catch (err) {
    res.status(422).json({ error: err.message });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

module.exports = app;
