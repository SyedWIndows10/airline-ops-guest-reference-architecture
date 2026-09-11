// Stubbed channel senders. A production version would call an app-push provider,
// an SMS gateway, and an email/CRM platform, each with its own retry/backoff and
// delivery-receipt handling — tracked via an outbox table per README "what I'd do
// differently" rather than fire-and-forget from the consumer.
const CHANNELS = ['APP_PUSH', 'SMS', 'EMAIL'];

function dispatchToChannel(channel, guestEvent) {
  const message = messageFor(guestEvent);
  console.log(`  [${channel}] -> ${guestEvent.guestId}: "${message}"`);
}

function messageFor(guestEvent) {
  const optionCount = guestEvent.rebookingOptions.length;
  switch (guestEvent.disruptionSummary) {
    case 'FLIGHT_CANCELLED':
      return `Your flight ${guestEvent.originalFlightNumber} was cancelled. We found ${optionCount} rebooking option(s) for you.`;
    case 'FLIGHT_DIVERTED':
      return `Your flight ${guestEvent.originalFlightNumber} was diverted. We found ${optionCount} rebooking option(s) for you.`;
    default:
      return `Your flight ${guestEvent.originalFlightNumber} is delayed. We found ${optionCount} rebooking option(s) in case you'd like to switch.`;
  }
}

module.exports = { CHANNELS, dispatchToChannel };
