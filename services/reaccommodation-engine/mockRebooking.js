// Stub: generates plausible-looking rebooking options without any real seat/fare
// inventory logic. A real implementation would query the reservation system for
// available inventory on alternate flights and rank by fare class, connection
// time, and guest loyalty tier.
function generateOptions(disruptionEvent) {
  const baseDate = new Date(`${disruptionEvent.flightDate}T00:00:00Z`);
  const options = [1, 2].map((n) => {
    const departure = new Date(baseDate.getTime() + (18 + n * 3) * 60 * 60 * 1000);
    const arrival = new Date(departure.getTime() + 5 * 60 * 60 * 1000);
    return {
      optionId: `${disruptionEvent.flightNumber}-REBOOK-${n}`,
      flightNumber: `${disruptionEvent.flightNumber.slice(0, 2)}${900 + n}`,
      departureTime: departure.toISOString(),
      arrivalTime: arrival.toISOString(),
    };
  });
  return options;
}

// Mock guest lookup — a real implementation would query the PSS for every guest
// booked on the affected flight. This stub generates one representative guest.
function mockGuestForFlight(disruptionEvent) {
  return `GUEST-${disruptionEvent.flightNumber}-${disruptionEvent.flightDate}`;
}

module.exports = { generateOptions, mockGuestForFlight };
