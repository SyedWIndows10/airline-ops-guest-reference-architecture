// Small, deliberately mock set of disruptions standing in for a real OCC feed.
const MOCK_DISRUPTIONS = [
  {
    flightNumber: 'AA123',
    flightDate: '2026-09-11',
    originAirport: 'JFK',
    destinationAirport: 'LAX',
    disruptionType: 'DELAY',
    disruptionReasonCode: 'WEATHER',
    tailNumber: 'N12345',
    estimatedDelayMinutes: 95,
    affectedPassengerCount: 178,
  },
  {
    flightNumber: 'AA456',
    flightDate: '2026-09-11',
    originAirport: 'ORD',
    destinationAirport: 'DFW',
    disruptionType: 'MECHANICAL',
    disruptionReasonCode: 'MAINTENANCE',
    tailNumber: 'N67890',
    estimatedDelayMinutes: 240,
    affectedPassengerCount: 142,
  },
  {
    flightNumber: 'AA789',
    flightDate: '2026-09-11',
    originAirport: 'MIA',
    destinationAirport: 'BOS',
    disruptionType: 'CANCELLATION',
    disruptionReasonCode: 'CREW_UNAVAILABLE',
    tailNumber: 'N24680',
    affectedPassengerCount: 210,
  },
];

module.exports = { MOCK_DISRUPTIONS };
