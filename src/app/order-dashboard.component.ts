import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderDashboardService } from './order-dashboard.service';
import { KeysPipe } from './keys.pipe';

@Component({
  selector: 'app-order-dashboard',
  standalone: true,
  templateUrl: './order-dashboard.component.html',
  styleUrls: ['./order-dashboard.component.css'],
  imports: [CommonModule, KeysPipe]
})
export class OrderDashboardComponent implements OnInit {
  orders: any[] = [];
  loading = true;
  error: string | null = null;

  private orderService = inject(OrderDashboardService);

  ngOnInit(): void {
    this.loading = true;
    this.error = null;
    this.orderService.getOrders().subscribe({
      next: (data) => {
        console.log('Data received:', data);
        // Ekstrak data dari struktur API response
        if (data?.Result?.Results) {
          this.orders = data.Result.Results;
        } else if (Array.isArray(data)) {
          this.orders = data;
        } else {
          this.orders = [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching data:', err);
        this.error = 'Gagal mengambil data: ' + (err.message || 'Unknown error');
        this.loading = false;
      }
    });
  }

  formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return value.toString();
  }

  getOrderStatus(order: any): string {
    // Logic untuk menentukan status order berdasarkan data
    if (order.status) {
      return order.status;
    } else if (order.completed) {
      return 'Completed';
    } else if (order.pending) {
      return 'Pending';
    } else {
      return 'Active';
    }
  }

  getStatusClass(order: any): string {
    const status = this.getOrderStatus(order).toLowerCase();
    if (status.includes('completed') || status.includes('success')) {
      return 'status-success';
    } else if (status.includes('pending') || status.includes('waiting')) {
      return 'status-warning';
    } else if (status.includes('cancelled') || status.includes('failed')) {
      return 'status-danger';
    } else {
      return 'status-info';
    }
  }
}
