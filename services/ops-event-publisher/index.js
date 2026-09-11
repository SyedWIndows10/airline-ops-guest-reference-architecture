const { EventClient, assertValid, newCorrelationId, newEventId } = require('@airline-ops/shared');
const { MOCK_DISRUPTIONS } = require('./mockDisruptions');

const TOPIC = 'flight.disrupted';
const PUBLISH_INTERVAL_MS = Number(process.env.PUBLISH_INTERVAL_MS || 10000);

const client = new EventClient({ clientId: 'ops-event-publisher' });

function buildEvent(mockDisruption) {
  return assertValid('flight.disrupted.v1.schema.json', {
    eventId: newEventId(),
    correlationId: newCorrelationId(),
    eventTime: new Date().toISOString(),
    ...mockDisruption,
  });
}

async function publishOne(index) {
  const mockDisruption = MOCK_DISRUPTIONS[index % MOCK_DISRUPTIONS.length];
  const event = buildEvent(mockDisruption);
  await client.publish(TOPIC, event);
  console.log(
    `[ops-event-publisher] published ${event.disruptionType} for ${event.flightNumber} ` +
      `(correlationId=${event.correlationId})`
  );
}

async function main() {
  console.log(`[ops-event-publisher] starting, publishing to "${TOPIC}" every ${PUBLISH_INTERVAL_MS}ms`);
  let i = 0;
  await publishOne(i++);
  setInterval(() => publishOne(i++).catch((err) => console.error('[ops-event-publisher] publish failed', err)), PUBLISH_INTERVAL_MS);
}

main().catch((err) => {
  console.error('[ops-event-publisher] fatal error', err);
  process.exit(1);
});
