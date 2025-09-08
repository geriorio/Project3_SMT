import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { AuthService, User } from '../services/auth.service';
import { Router } from '@angular/router';

interface ApiResponse {
  Result: {
    Errors: any[];
    ExecutionInfo: any[];
    Results: ApiOrderItem[];
  };
}

interface ApiOrderItem {
  OrderNum: number;
  CustomerID: string;
  Name: string;
  CreateDate: string | null;
  OrderDate: string;
  NeedByDate: string;
  Status: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="dashboard-container">
      <!-- Header with user info -->
      <header class="dashboard-header">
        <div class="header-content">
          <h1>Order Tracking Board</h1>
          <div class="user-info">
            <img [src]="currentUser?.picture" [alt]="currentUser?.name" class="user-avatar">
            <span class="user-name">{{ currentUser?.name }}</span>
            <button (click)="logout()" class="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <!-- Main content -->
      <div class="board-container">
        @if (error) {
          <div class="error-message">{{ error }}</div>
        } @else if (isLoading) {
          <div class="loading">Loading orders...</div>
        } @else {
          <div class="board">
            <!-- Order Placed -->
            <div class="board-row">
              <div class="row-header">Order Placed</div>
              <div class="row-content">
                @for (order of getLatestOrdersByStatus('Order Placed', 20); track order.OrderNum) {
                  <div class="order-circle status-placed" [title]="'Order: ' + order.OrderNum + '\\nCustomer: ' + order.CustomerID">
                    <div class="order-number">{{ order.OrderNum }}</div>
                    <div class="time-remaining">{{ getTimeRemaining(order) }}</div>
                  </div>
                }
              </div>
            </div>

            <!-- Credit Review -->
            <div class="board-row">
              <div class="row-header">Credit Review</div>
              <div class="row-content">
                @for (order of getLatestOrdersByStatus('Credit Review', 20); track order.OrderNum) {
                  <div class="order-circle status-credit" [title]="'Order: ' + order.OrderNum + '\\nCustomer: ' + order.CustomerID">
                    <div class="order-number">{{ order.OrderNum }}</div>
                    <div class="time-remaining">{{ getTimeRemaining(order) }}</div>
                  </div>
                }
              </div>
            </div>

            <!-- Delivery Planning -->
            <div class="board-row">
              <div class="row-header">Delivery Planning</div>
              <div class="row-content">
                @for (order of getLatestOrdersByStatus('Delivery Planning', 20); track order.OrderNum) {
                  <div class="order-circle status-planning" [title]="'Order: ' + order.OrderNum + '\\nCustomer: ' + order.CustomerID">
                    <div class="order-number">{{ order.OrderNum }}</div>
                    <div class="time-remaining">{{ getTimeRemaining(order) }}</div>
                  </div>
                }
              </div>
            </div>

            <!-- Dispatched for Delivery -->
            <div class="board-row">
              <div class="row-header">Dispatched for Delivery</div>
              <div class="row-content">
                @for (order of getLatestOrdersByStatus('Dispatched', 20); track order.OrderNum) {
                  <div class="order-circle status-dispatched" [title]="'Order: ' + order.OrderNum + '\\nCustomer: ' + order.CustomerID">
                    <div class="order-number">{{ order.OrderNum }}</div>
                    <div class="time-remaining">{{ getTimeRemaining(order) }}</div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: #f5f5f5;
    }

    .dashboard-header {
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 1rem 0;
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 1rem;
    }

    .dashboard-header h1 {
      color: #333;
      margin: 0;
      font-size: 1.5rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
    }

    .user-name {
      font-weight: 500;
      color: #333;
    }

    .logout-btn {
      background: #dc3545;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .logout-btn:hover {
      background: #c82333;
    }

    .board-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .board {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .board-row {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .row-header {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #333;
      border-bottom: 2px solid #e9ecef;
      padding-bottom: 0.5rem;
    }

    .row-content {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .order-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
      position: relative;
    }

    .order-circle:hover {
      transform: scale(1.05);
    }

    .order-number {
      font-size: 0.875rem;
      line-height: 1;
    }

    .time-remaining {
      font-size: 0.625rem;
      opacity: 0.9;
      margin-top: 2px;
    }

    .status-placed { background: #28a745; }
    .status-credit { background: #ffc107; color: #333; }
    .status-planning { background: #17a2b8; }
    .status-dispatched { background: #6f42c1; }

    .loading, .error-message {
      text-align: center;
      padding: 2rem;
      font-size: 1.125rem;
    }

    .error-message {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 1rem;
      }

      .order-circle {
        width: 60px;
        height: 60px;
      }

      .order-number {
        font-size: 0.75rem;
      }

      .time-remaining {
        font-size: 0.5rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  orders: ApiOrderItem[] = [];
  isLoading = true;
  error = '';
  currentUser: User | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.fetchOrders();
  }

  fetchOrders() {
    const url = 'https://epictestapp.samator.com/KineticTest2/api/v2/efx/SGI/FSMT069OrderDash/GetOrders';
    const username = 'christo';
    const password = 'Chr15topherb@';
    const basicAuth = 'Basic ' + btoa(`${username}:${password}`);
    
    const headers = new HttpHeaders({
      'x-api-key': 'MtW5QmpH660283OeMjCoRhgvZf2WBe1nbJMT3bTyJfuhB',
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Authorization': basicAuth
    });

    this.http.post<ApiResponse>(url, {}, { headers }).subscribe({
      next: (response) => {
        if (response?.Result?.Results) {
          this.orders = response.Result.Results;
          this.error = '';
        } else {
          this.error = 'No data received from API';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('API Error:', err);
        this.error = 'Failed to load orders. Please try again.';
        this.isLoading = false;
      }
    });
  }

  getLatestOrdersByStatus(status: string, limit: number): ApiOrderItem[] {
    return this.orders
      .filter(order => order.Status === status)
      .sort((a, b) => new Date(b.OrderDate).getTime() - new Date(a.OrderDate).getTime())
      .slice(0, limit);
  }

  getTimeRemaining(order: ApiOrderItem): string {
    if (!order.NeedByDate) return '';
    
    const needBy = new Date(order.NeedByDate);
    const now = new Date();
    const diffMs = needBy.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffMs < 0) {
      return 'Overdue';
    } else if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    } else {
      return `${diffHours}h`;
    }
  }

  logout() {
    this.authService.logout();
    window.location.href = '/login';
  }
}
