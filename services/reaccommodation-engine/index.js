const { EventClient, newEventId } = require('@airline-ops/shared');
const { generateOptions, mockGuestForFlight } = require('./mockRebooking');

const IN_TOPIC = 'flight.disrupted';
// Internal Ops-domain topic — not guest-facing. guest-translation-layer subscribes
// here and is the only thing allowed to turn this into a guest-facing event (ADR 0002).
const OUT_TOPIC = 'ops.reaccommodation-generated';

const client = new EventClient({ clientId: 'reaccommodation-engine' });

async function handleDisruption(disruptionEvent) {
  if (disruptionEvent.disruptionType === 'DELAY' && (disruptionEvent.estimatedDelayMinutes || 0) < 60) {
    return; // short delays don't need rebooking options
  }

  const outEvent = {
    eventId: newEventId(),
    correlationId: disruptionEvent.correlationId,
    eventTime: new Date().toISOString(),
    guestId: mockGuestForFlight(disruptionEvent),
    originalFlightNumber: disruptionEvent.flightNumber,
    originalFlightDate: disruptionEvent.flightDate,
    disruptionType: disruptionEvent.disruptionType,
    rebookingOptions: generateOptions(disruptionEvent),
  };

  await client.publish(OUT_TOPIC, outEvent);
  console.log(
    `[reaccommodation-engine] generated ${outEvent.rebookingOptions.length} options for ` +
      `${outEvent.originalFlightNumber} (correlationId=${outEvent.correlationId})`
  );
}

async function main() {
  console.log(`[reaccommodation-engine] subscribing to "${IN_TOPIC}"`);
  await client.consume({
    groupId: 'reaccommodation-engine',
    topics: [IN_TOPIC],
    handler: handleDisruption,
  });
}

main().catch((err) => {
  console.error('[reaccommodation-engine] fatal error', err);
  process.exit(1);
});
