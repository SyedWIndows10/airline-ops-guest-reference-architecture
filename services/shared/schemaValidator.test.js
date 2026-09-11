const test = require('node:test');
const assert = require('node:assert');
const { assertValid } = require('./schemaValidator');
const { newCorrelationId, newEventId } = require('./correlationId');

test('valid flight.disrupted.v1 payload passes validation', () => {
  const payload = {
    eventId: newEventId(),
    correlationId: newCorrelationId(),
    eventTime: new Date().toISOString(),
    flightNumber: 'AA123',
    flightDate: '2026-09-11',
    originAirport: 'JFK',
    destinationAirport: 'LAX',
    disruptionType: 'DELAY',
    disruptionReasonCode: 'WEATHER',
    tailNumber: 'N12345',
  };
  assert.doesNotThrow(() => assertValid('flight.disrupted.v1.schema.json', payload));
});

test('invalid flight.disrupted.v1 payload fails validation', () => {
  const payload = { flightNumber: 'AA123' };
  assert.throws(() => assertValid('flight.disrupted.v1.schema.json', payload));
});
