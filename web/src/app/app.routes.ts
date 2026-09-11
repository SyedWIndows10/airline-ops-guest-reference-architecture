import { Routes } from '@angular/router';
import { OpsDashboardComponent } from './ops-dashboard/ops-dashboard.component';
import { GuestNotificationsComponent } from './guest-notifications/guest-notifications.component';

export const routes: Routes = [
  { path: '', redirectTo: 'ops-dashboard', pathMatch: 'full' },
  { path: 'ops-dashboard', component: OpsDashboardComponent },
  { path: 'guest-notifications', component: GuestNotificationsComponent },
];
