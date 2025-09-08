import { Routes } from '@angular/router';
import { OrderDashboardComponent } from './order-dashboard.component';

export const routes: Routes = [
	{ path: 'dashboard', component: OrderDashboardComponent },
	{ path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
