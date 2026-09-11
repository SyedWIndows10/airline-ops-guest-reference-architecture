const { EventClient } = require('@airline-ops/shared');
const { CHANNELS, dispatchToChannel } = require('./channels');

const IN_TOPIC = 'guest.itinerary-reaccommodated';

const client = new EventClient({ clientId: 'notification-dispatcher' });

async function handleGuestEvent(guestEvent) {
  console.log(
    `[notification-dispatcher] fanning out ${guestEvent.disruptionSummary} for ${guestEvent.guestId} ` +
      `(correlationId=${guestEvent.correlationId})`
  );
  for (const channel of CHANNELS) {
    dispatchToChannel(channel, guestEvent);
  }
}

async function main() {
  console.log(`[notification-dispatcher] subscribing to "${IN_TOPIC}"`);
  await client.consume({
    groupId: 'notification-dispatcher',
    topics: [IN_TOPIC],
    handler: handleGuestEvent,
  });
}

main().catch((err) => {
  console.error('[notification-dispatcher] fatal error', err);
  process.exit(1);
});
