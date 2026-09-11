const { EventClient, assertValid, newEventId } = require('@airline-ops/shared');
const { toGuestEvent } = require('./translate');

const IN_TOPIC = 'ops.reaccommodation-generated';
const OUT_TOPIC = 'guest.itinerary-reaccommodated';

const client = new EventClient({ clientId: 'guest-translation-layer' });

async function handleReaccommodation(reaccommodationEvent) {
  const guestEvent = assertValid(
    'guest.itinerary-reaccommodated.v1.schema.json',
    toGuestEvent(reaccommodationEvent, { newEventId })
  );

  await client.publish(OUT_TOPIC, guestEvent);
  console.log(
    `[guest-translation-layer] translated ${guestEvent.originalFlightNumber} -> ` +
      `${guestEvent.disruptionSummary} for ${guestEvent.guestId} ` +
      `(correlationId=${guestEvent.correlationId})`
  );
}

async function main() {
  console.log(`[guest-translation-layer] subscribing to "${IN_TOPIC}" (the only Ops-domain topic this service reads)`);
  await client.consume({
    groupId: 'guest-translation-layer',
    topics: [IN_TOPIC],
    handler: handleReaccommodation,
  });
}

main().catch((err) => {
  console.error('[guest-translation-layer] fatal error', err);
  process.exit(1);
});
