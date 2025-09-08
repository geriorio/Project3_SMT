import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

interface OrderItem {
  id: number;
  status: 'orderPlaced' | 'waitingCK' | 'waitingSJ' | 'enroute';
  timestamp: Date;
  deadline?: Date;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <main class="board-container">
      <h1>{{ title }}</h1>
      <div class="board">
        <div class="board-row">
          <div class="row-header">Order Placed</div>
          <div class="row-content">
            @for (order of getOrdersByStatus('orderPlaced'); track order.id) {
              <div class="order-circle" [class]="getTimeStatusClass(order)">
                <div>{{ order.id }}</div>
                <div class="time-remaining">{{ getTimeRemaining(order) }}</div>
              </div>
            }
          </div>
        </div>

        <div class="board-row">
          <div class="row-header">Waiting for CK</div>
          <div class="row-content">
            @for (order of getOrdersByStatus('waitingCK'); track order.id) {
              <div class="order-circle" [class]="getTimeStatusClass(order)">
                <div>{{ order.id }}</div>
                <div class="time-remaining">{{ getTimeRemaining(order) }}</div>
              </div>
            }
          </div>
        </div>

        <div class="board-row">
          <div class="row-header">Waiting for SJ</div>
          <div class="row-content">
            @for (order of getOrdersByStatus('waitingSJ'); track order.id) {
              <div class="order-circle" [class]="getTimeStatusClass(order)">
                <div>{{ order.id }}</div>
                <div class="time-remaining">{{ getTimeRemaining(order) }}</div>
              </div>
            }
          </div>
        </div>

        <div class="board-row">
          <div class="row-header">Enroute</div>
          <div class="row-content">
            @for (order of getOrdersByStatus('enroute'); track order.id) {
              <div class="order-circle" [class]="getTimeStatusClass(order)">
                <div>{{ order.id }}</div>
                <div class="time-remaining">{{ getTimeRemaining(order) }}</div>
              </div>
            }
          </div>
        </div>
      </div>
    </main>
    <router-outlet />
  `,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Order Tracking Board';

  orders: OrderItem[] = [
    { id: 1, status: 'orderPlaced', timestamp: new Date(), deadline: this.addDays(new Date(), 2) },
    { id: 2, status: 'orderPlaced', timestamp: new Date(), deadline: this.addDays(new Date(), 1) },
    { id: 3, status: 'waitingCK', timestamp: new Date(), deadline: this.addHours(new Date(), 8) },
    { id: 4, status: 'waitingSJ', timestamp: new Date(), deadline: this.addDays(new Date(), 2) },
    { id: 5, status: 'enroute', timestamp: new Date(), deadline: this.addHours(new Date(), 5) },
    { id: 6, status: 'orderPlaced', timestamp: new Date(), deadline: this.addDays(new Date(), 3) },
  ];

  getOrdersByStatus(status: OrderItem['status']): OrderItem[] {
    return this.orders.filter(order => order.status === status);
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }

  getTimeRemaining(order: OrderItem): string {
    if (!order.deadline) return '';
    
    const now = new Date();
    const diffMs = order.deadline.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}hrs`;
    } else {
      return `${diffHours}hrs`;
    }
  }

  getTimeStatusClass(order: OrderItem): string {
    if (!order.deadline) return '';
    
    const now = new Date();
    const diffHours = (order.deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours <= 10) {
      return 'status-red';
    } else if (diffHours <= 24) {
      return 'status-amber';
    } else {
      return 'status-green';
    }
  }
}
