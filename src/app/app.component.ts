import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OrderDashboardComponent } from './order-dashboard.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, OrderDashboardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'PROJECT3_SMT';
}
