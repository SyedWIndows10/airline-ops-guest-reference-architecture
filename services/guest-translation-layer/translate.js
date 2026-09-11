// The Ops -> Guest field mapping lives here, and only here (ADR 0002). If a guest-facing
// service needs a new field, the change is reviewed here, not by giving that service a
// direct subscription to an Ops-domain topic.
const DISRUPTION_TYPE_TO_GUEST_SUMMARY = {
  DELAY: 'FLIGHT_DELAYED',
  CANCELLATION: 'FLIGHT_CANCELLED',
  DIVERSION: 'FLIGHT_DIVERTED',
  MECHANICAL: 'FLIGHT_DELAYED',
};

function toGuestEvent(reaccommodationEvent, { newEventId }) {
  return {
    eventId: newEventId(),
    correlationId: reaccommodationEvent.correlationId,
    eventTime: new Date().toISOString(),
    guestId: reaccommodationEvent.guestId,
    originalFlightNumber: reaccommodationEvent.originalFlightNumber,
    originalFlightDate: reaccommodationEvent.originalFlightDate,
    disruptionSummary:
      DISRUPTION_TYPE_TO_GUEST_SUMMARY[reaccommodationEvent.disruptionType] || 'FLIGHT_DELAYED',
    rebookingOptions: reaccommodationEvent.rebookingOptions,
    // Deliberately omitted: tailNumber, crew data, technical fault codes, disruptionReasonCode —
    // none of these are guest-domain concepts. See ADR 0002.
  };
}

module.exports = { toGuestEvent };
