import { Injectable } from '@angular/core';
import { Observable, interval, map, startWith } from 'rxjs';
import { FlightDisruptionRow, GuestNotification } from './models';

/**
 * Stands in for a real read API backed by the ODS (see etl/) and by consuming
 * guest.itinerary-reaccommodated.v1 directly. A production version of this
 * service would call a small BFF/read API over HTTP or a WebSocket subscription
 * fed by the same Kafka topics services/* publish to — wiring that up is out of
 * scope for this reference implementation (see README "what I'd do differently").
 */
@Injectable({ providedIn: 'root' })
export class MockFeedService {
  private readonly mockDisruptions: FlightDisruptionRow[] = [
    {
      flightNumber: 'AA123',
      flightDate: '2026-09-11',
      disruptionType: 'DELAY',
      disruptionReasonCode: 'WEATHER',
      estimatedDelayMinutes: 95,
      affectedPassengerCount: 178,
      legalityStatus: 'AT_RISK',
      correlationId: 'c-aa123',
      updatedAt: new Date().toISOString(),
    },
    {
      flightNumber: 'AA456',
      flightDate: '2026-09-11',
      disruptionType: 'MECHANICAL',
      disruptionReasonCode: 'MAINTENANCE',
      estimatedDelayMinutes: 240,
      affectedPassengerCount: 142,
      legalityStatus: 'ILLEGAL_REQUIRES_REPLACEMENT',
      correlationId: 'c-aa456',
      updatedAt: new Date().toISOString(),
    },
    {
      flightNumber: 'AA789',
      flightDate: '2026-09-11',
      disruptionType: 'CANCELLATION',
      disruptionReasonCode: 'CREW_UNAVAILABLE',
      estimatedDelayMinutes: null,
      affectedPassengerCount: 210,
      legalityStatus: 'LEGAL',
      correlationId: 'c-aa789',
      updatedAt: new Date().toISOString(),
    },
  ];

  private readonly mockGuestNotifications: GuestNotification[] = [
    {
      guestId: 'GUEST-AA123-2026-09-11',
      originalFlightNumber: 'AA123',
      originalFlightDate: '2026-09-11',
      disruptionSummary: 'FLIGHT_DELAYED',
      rebookingOptions: [
        { optionId: 'AA123-REBOOK-1', flightNumber: 'AA901', departureTime: '2026-09-11T21:00:00Z', arrivalTime: '2026-09-12T02:00:00Z' },
        { optionId: 'AA123-REBOOK-2', flightNumber: 'AA902', departureTime: '2026-09-12T06:00:00Z', arrivalTime: '2026-09-12T11:00:00Z' },
      ],
      eventTime: new Date().toISOString(),
    },
    {
      guestId: 'GUEST-AA789-2026-09-11',
      originalFlightNumber: 'AA789',
      originalFlightDate: '2026-09-11',
      disruptionSummary: 'FLIGHT_CANCELLED',
      rebookingOptions: [
        { optionId: 'AA789-REBOOK-1', flightNumber: 'AA911', departureTime: '2026-09-11T20:00:00Z', arrivalTime: '2026-09-12T00:00:00Z' },
      ],
      eventTime: new Date().toISOString(),
    },
  ];

  getFlightDisruptions(): Observable<FlightDisruptionRow[]> {
    return interval(5000).pipe(startWith(0), map(() => this.mockDisruptions));
  }

  getGuestNotifications(): Observable<GuestNotification[]> {
    return interval(5000).pipe(startWith(0), map(() => this.mockGuestNotifications));
  }
}
