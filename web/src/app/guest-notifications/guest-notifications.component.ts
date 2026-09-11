import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { GuestNotification } from '../shared/models';
import { MockFeedService } from '../shared/mock-feed.service';

@Component({
  selector: 'app-guest-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './guest-notifications.component.html',
})
export class GuestNotificationsComponent {
  notifications$: Observable<GuestNotification[]>;

  constructor(private feed: MockFeedService) {
    this.notifications$ = this.feed.getGuestNotifications();
  }
}
