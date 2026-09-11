import { Routes } from '@angular/router';
import { OpsDashboardComponent } from './ops-dashboard/ops-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'ops-dashboard', pathMatch: 'full' },
  { path: 'ops-dashboard', component: OpsDashboardComponent },
];
