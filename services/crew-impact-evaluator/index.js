const { EventClient, assertValid, newEventId } = require('@airline-ops/shared');
const { evaluateLegality } = require('./ftlRules');

const IN_TOPIC = 'flight.disrupted';
const OUT_TOPIC = 'crew.legality-check';

const client = new EventClient({ clientId: 'crew-impact-evaluator' });

async function handleDisruption(disruptionEvent) {
  const { legalityStatus, notes } = evaluateLegality(disruptionEvent);

  const outEvent = assertValid('crew.legality-check.v1.schema.json', {
    eventId: newEventId(),
    correlationId: disruptionEvent.correlationId,
    eventTime: new Date().toISOString(),
    flightNumber: disruptionEvent.flightNumber,
    flightDate: disruptionEvent.flightDate,
    legalityStatus,
    affectedCrewCount: disruptionEvent.affectedPassengerCount ? 6 : 0,
    notes,
  });

  await client.publish(OUT_TOPIC, outEvent);
  console.log(
    `[crew-impact-evaluator] ${disruptionEvent.flightNumber} -> ${legalityStatus} ` +
      `(correlationId=${disruptionEvent.correlationId})`
  );
}

async function main() {
  console.log(`[crew-impact-evaluator] subscribing to "${IN_TOPIC}"`);
  await client.consume({
    groupId: 'crew-impact-evaluator',
    topics: [IN_TOPIC],
    handler: handleDisruption,
  });
}

main().catch((err) => {
  console.error('[crew-impact-evaluator] fatal error', err);
  process.exit(1);
});
