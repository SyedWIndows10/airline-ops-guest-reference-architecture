// Stubbed "generation" step — deterministic template, no live model call.
// Swap this single function for a real Azure OpenAI (or other) chat completion
// call to go from reference implementation to production. See guardrails.md.
function generateAnswer(question, retrievedChunks) {
  if (retrievedChunks.length === 0 || retrievedChunks[0].score < 0.05) {
    return {
      text: "I don't have a documented procedure that answers this confidently. Please consult a duty manager.",
      grounded: false,
    };
  }

  const top = retrievedChunks[0];
  return {
    text: `Per ${top.source} — "${top.title}": ${summarize(top.text)}`,
    grounded: true,
  };
}

function summarize(sectionText) {
  const body = sectionText.replace(/^##.*\n/, '').trim();
  const firstSentence = body.split(/(?<=[.])\s/)[0];
  return firstSentence;
}

module.exports = { generateAnswer };
