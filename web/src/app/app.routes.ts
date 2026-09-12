import { Routes } from '@angular/router';
import { OpsDashboardComponent } from './ops-dashboard/ops-dashboard.component';
import { GuestNotificationsComponent } from './guest-notifications/guest-notifications.component';
import { PipelineVisualizerComponent } from './pipeline-visualizer/pipeline-visualizer.component';

export const routes: Routes = [
  { path: '', redirectTo: 'ops-dashboard', pathMatch: 'full' },
  { path: 'ops-dashboard', component: OpsDashboardComponent },
  { path: 'guest-notifications', component: GuestNotificationsComponent },
  { path: 'pipeline', component: PipelineVisualizerComponent },
];
