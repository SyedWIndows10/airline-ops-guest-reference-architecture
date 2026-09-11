import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { FlightDisruptionRow } from '../shared/models';
import { MockFeedService } from '../shared/mock-feed.service';

@Component({
  selector: 'app-ops-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ops-dashboard.component.html',
})
export class OpsDashboardComponent {
  disruptions$: Observable<FlightDisruptionRow[]>;

  constructor(private feed: MockFeedService) {
    this.disruptions$ = this.feed.getFlightDisruptions();
  }
}
