const { v4: uuidv4 } = require('uuid');

/** Generates a new correlation ID for an originating event (e.g. flight.disrupted.v1). */
function newCorrelationId() {
  return uuidv4();
}

/** Every event gets its own eventId; correlationId is threaded through unchanged from the originating event. */
function newEventId() {
  return uuidv4();
}

module.exports = { newCorrelationId, newEventId };
