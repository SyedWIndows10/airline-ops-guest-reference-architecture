export type DisruptionType = 'DELAY' | 'CANCELLATION' | 'DIVERSION' | 'MECHANICAL';
export type LegalityStatus = 'LEGAL' | 'AT_RISK' | 'ILLEGAL_REQUIRES_REPLACEMENT';
export type GuestDisruptionSummary = 'FLIGHT_DELAYED' | 'FLIGHT_CANCELLED' | 'FLIGHT_DIVERTED';

/** Mirrors the ODS current-state row shape written by etl/ingest_events_to_lakehouse.py. */
export interface FlightDisruptionRow {
  flightNumber: string;
  flightDate: string;
  disruptionType: DisruptionType;
  disruptionReasonCode: string;
  estimatedDelayMinutes: number | null;
  affectedPassengerCount: number | null;
  legalityStatus: LegalityStatus;
  correlationId: string;
  updatedAt: string;
}

/** Mirrors guest.itinerary-reaccommodated.v1 — see schemas/guest.itinerary-reaccommodated.v1.schema.json. */
export interface GuestNotification {
  guestId: string;
  originalFlightNumber: string;
  originalFlightDate: string;
  disruptionSummary: GuestDisruptionSummary;
  rebookingOptions: { optionId: string; flightNumber: string; departureTime: string; arrivalTime: string }[];
  eventTime: string;
}
