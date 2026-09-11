// Stubbed Flight Time Limitation (FTL) evaluation — NOT a real regulatory rule engine.
// Real FTL rules depend on duty start time, flight/duty period tables, rest history,
// and augmented-crew rules that vary by regulator (FAA/EASA/etc). This stub exists to
// prove the fan-out pattern (ADR 0001), not to model aviation regulation correctly.
function evaluateLegality(disruptionEvent) {
  const delay = disruptionEvent.estimatedDelayMinutes || 0;

  if (disruptionEvent.disruptionType === 'CANCELLATION') {
    return { legalityStatus: 'LEGAL', notes: 'Flight cancelled — no further duty period to evaluate.' };
  }
  if (delay >= 180) {
    return {
      legalityStatus: 'ILLEGAL_REQUIRES_REPLACEMENT',
      notes: `Estimated delay of ${delay}m exceeds duty period limit — replacement crew required.`,
    };
  }
  if (delay >= 60) {
    return {
      legalityStatus: 'AT_RISK',
      notes: `Estimated delay of ${delay}m brings crew close to duty period limit — monitor.`,
    };
  }
  return { legalityStatus: 'LEGAL', notes: 'Within normal duty period limits.' };
}

module.exports = { evaluateLegality };
