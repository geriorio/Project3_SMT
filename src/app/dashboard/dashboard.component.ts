import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="dashboard-container">
      <!-- Header with user info -->
      <header class="dashboard-header">
        <div class="header-content">
          <div class="header-left">
            <h1>Order Tracking Board</h1>
            <div class="live-indicator">
              <span class="live-dot"></span>
              LIVE {{ currentTime | date:'HH:mm:ss' }}
            </div>
          </div>
          <div class="header-right">
            <div class="filter-section">
              <label for="filter-select" class="filter-label">Filter by:</label>
              <select 
                id="filter-select"
                [(ngModel)]="selectedFilter" 
                class="filter-dropdown">
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="3months">3 Months</option>
                <option value="6months">6 Months</option>
                <option value="year">1 Year</option>
              </select>
            </div>
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
                  <div class="order-rectangle" 
                       [class]="getColorClass(order)" 
                       [title]="'Order: ' + order.OrderNum + '\\nCustomer: ' + order.CustomerID + '\\nName: ' + order.Name + '\\nTime remaining: ' + getTimeRemaining(order)">
                    <div class="order-content">
                      <div class="order-number">{{ order.OrderNum }}</div>
                      <div class="order-name">{{ order.Name }}</div>
                      @if (getColorClass(order) === 'color-yellow' || getColorClass(order) === 'color-red') {
                        <div class="time-remaining">{{ getTimeRemaining(order) }}</div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Credit Review -->
            <div class="board-row">
              <div class="row-header">Credit Review</div>
              <div class="row-content">
                @for (order of getLatestOrdersByStatus('Credit Review', 20); track order.OrderNum) {
                  <div class="order-rectangle" 
                       [class]="getColorClass(order)" 
                       [title]="'Order: ' + order.OrderNum + '\\nCustomer: ' + order.CustomerID + '\\nName: ' + order.Name + '\\nTime remaining: ' + getTimeRemaining(order)">
                    <div class="order-content">
                      <div class="order-number">{{ order.OrderNum }}</div>
                      <div class="order-name">{{ order.Name }}</div>
                      @if (getColorClass(order) === 'color-yellow' || getColorClass(order) === 'color-red') {
                        <div class="time-remaining">{{ getTimeRemaining(order) }}</div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Delivery Planning -->
            <div class="board-row">
              <div class="row-header">Delivery Planning</div>
              <div class="row-content">
                @for (order of getLatestOrdersByStatus('Delivery Planning', 20); track order.OrderNum) {
                  <div class="order-rectangle" 
                       [class]="getColorClass(order)" 
                       [title]="'Order: ' + order.OrderNum + '\\nCustomer: ' + order.CustomerID + '\\nName: ' + order.Name + '\\nTime remaining: ' + getTimeRemaining(order)">
                    <div class="order-content">
                      <div class="order-number">{{ order.OrderNum }}</div>
                      <div class="order-name">{{ order.Name }}</div>
                      @if (getColorClass(order) === 'color-yellow' || getColorClass(order) === 'color-red') {
                        <div class="time-remaining">{{ getTimeRemaining(order) }}</div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Dispatched for Delivery -->
            <div class="board-row">
              <div class="row-header">Dispatched for Delivery</div>
              <div class="row-content">
                @for (order of getLatestOrdersByStatus('Dispatched for Delivery', 20); track order.OrderNum) {
                  <div class="order-rectangle" 
                       [class]="getColorClass(order)" 
                       [title]="'Order: ' + order.OrderNum + '\\nCustomer: ' + order.CustomerID + '\\nName: ' + order.Name + '\\nTime remaining: ' + getTimeRemaining(order)">
                    <div class="order-content">
                      <div class="order-number">{{ order.OrderNum }}</div>
                      <div class="order-name">{{ order.Name }}</div>
                      @if (getColorClass(order) === 'color-yellow' || getColorClass(order) === 'color-red') {
                        <div class="time-remaining">{{ getTimeRemaining(order) }}</div>
                      }
                    </div>
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
      width: 100%;
      margin: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 0.5rem;
    }

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-section {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #333;
      margin: 0;
    }

    .filter-dropdown {
      background: #f8f9fa;
      color: #333;
      border: 1px solid #dee2e6;
      padding: 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      min-width: 120px;
    }

    .filter-dropdown:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .dashboard-header h1 {
      color: #333;
      margin: 0;
      font-size: 1.5rem;
    }

    .live-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #28a745;
      font-weight: 600;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      background: #28a745;
      border-radius: 50%;
      animation: blink 1s infinite;
    }

    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0.3; }
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
      width: 100%;
      margin: 0;
      padding: 0.5rem;
    }

    .board {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .board-row {
      background: white;
      border-radius: 4px;
      padding: 0.5rem;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
      margin: 0;
    }

    .row-header {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #333;
      border-bottom: 1px solid #e9ecef;
      padding-bottom: 0.25rem;
    }

    .row-content {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      padding: 0;
      margin: 0;
    }

    .order-rectangle {
      width: 180px;
      height: 80px;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease-in-out;
      position: relative;
      text-align: center;
      padding: 0;
      margin: 0;
    }

    .order-rectangle:hover {
      transform: scale(1.02);
    }

    .order-content {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      width: 100%;
      padding: 0;
      margin: 0;
    }

    .order-number {
      font-size: 1.1rem;
      line-height: 1;
      margin: 0;
      font-weight: 800;
      padding: 0;
    }

    .order-name {
      font-size: 1rem;
      line-height: 1;
      margin: 0;
      padding: 0;
      font-weight: 600;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .time-remaining {
      font-size: 0.8rem;
      opacity: 1;
      line-height: 1;
      word-break: break-word;
      text-align: center;
      white-space: pre-line;
      margin: 0;
      padding: 0;
      font-weight: 600;
    }

    /* Styling khusus untuk overdue text - DIHAPUS untuk fokus fungsionalitas */

    .status-placed { background: #28a745; }
    .status-credit { background: #ffc107; color: #333; }
    .status-planning { background: #17a2b8; }
    .status-dispatched { background: #6f42c1; }

    /* Color coding berdasarkan CreateDate + 48 jam */
    .color-green { 
      background: #28a745; 
      color: white;
    } /* >12 jam */
    .color-yellow { 
      background: #ffc107; 
      color: #333;
    } /* >0 <=12 jam */
    .color-red { 
      background: #dc3545; 
      color: white;
    } /* <=0 jam */

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

      .header-right {
        order: 2;
        flex-direction: column;
        gap: 0.5rem;
      }

      .filter-dropdown {
        min-width: 100px;
        font-size: 0.8rem;
      }

      .order-rectangle {
        width: 140px;
        height: 60px;
      }

      .order-number {
        font-size: 0.8rem;
      }

      .order-name {
        font-size: 0.6rem;
      }

      .time-remaining {
        font-size: 0.5rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  orders: ApiOrderItem[] = [];
  isLoading = true;
  error = '';
  currentUser: User | null = null;
  private countdownInterval: any;
  currentTime = new Date();
  selectedFilter = 'today'; // Default filter

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.fetchOrders();
    this.startLiveCountdown();
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  startLiveCountdown() {
    // Update setiap 1 detik untuk live countdown
    this.countdownInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
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
          
          // Tambahkan dummy data untuk testing
          // const dummyOrder: ApiOrderItem = {
          //   OrderNum: 123456,
          //   CustomerID: "123456",
          //   Name: "Ini Dummy",
          //   CreateDate: "2025-09-08T15:20:00.000",
          //   OrderDate: "2025-09-03T00:00:00",
          //   NeedByDate: "2025-09-03T00:00:00",
          //   Status: "Credit Review"
          // };
          
          // const dummyOrder2: ApiOrderItem = {
          //   OrderNum: 567890,
          //   CustomerID: "567890",
          //   Name: "Ini Cuma Dummy",
          //   CreateDate: "2025-09-07T02:20:00.000",
          //   OrderDate: "2025-09-03T00:00:00",
          //   NeedByDate: "2025-09-03T00:00:00",
          //   Status: "Dispatched for Delivery"
          // };
          
          // this.orders.push(dummyOrder);
          // this.orders.push(dummyOrder2);
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
    // Tampilkan semua data asli dengan filter tanggal
    return this.orders
      .filter(order => order.Status === status && this.isWithinDateFilter(order))
      .sort((a, b) => new Date(b.CreateDate || '').getTime() - new Date(a.CreateDate || '').getTime())
      .slice(0, limit);
  }

  getTimeRemaining(order: ApiOrderItem): string {
    if (!order.CreateDate) return 'No Date';
    
    // CreateDate + 48 jam
    const createDate = new Date(order.CreateDate);
    const deadline = new Date(createDate.getTime() + (48 * 60 * 60 * 1000)); // +48 jam
    const diffMs = deadline.getTime() - this.currentTime.getTime();
    
    const absDiffMs = Math.abs(diffMs);
    const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((absDiffMs % (1000 * 60)) / 1000);
    
    const daysStr = days.toString().padStart(2, '0');
    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');
    
    if (diffMs <= 0) {
      // Format overdue: OVERDUE (sedang) dan timer (sedang)
      return `OVERDUE\n${daysStr}:${hoursStr}:${minutesStr}:${secondsStr}`;
    } else {
      // Format normal: timer (sedang)
      return `${daysStr}:${hoursStr}:${minutesStr}:${secondsStr}`;
    }
  }

  getColorClass(order: ApiOrderItem): string {
    if (!order.CreateDate) return 'color-red';
    
    // CreateDate + 48 jam
    const createDate = new Date(order.CreateDate);
    const deadline = new Date(createDate.getTime() + (48 * 60 * 60 * 1000)); // +48 jam
    const diffMs = deadline.getTime() - this.currentTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours > 12) {
      return 'color-green'; // >12 jam - hijau
    } else if (diffHours > 0) {
      return 'color-yellow'; // >0 <=12 jam - kuning
    } else {
      return 'color-red'; // <=0 jam - merah
    }
  }

  setFilter(filter: string) {
    this.selectedFilter = filter;
  }

  isWithinDateFilter(order: ApiOrderItem): boolean {
    if (!order.CreateDate) return false;
    
    const createDate = new Date(order.CreateDate);
    const now = new Date();
    
    switch (this.selectedFilter) {
      case 'today':
        return createDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        return createDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return createDate >= monthAgo;
      case '3months':
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        return createDate >= threeMonthsAgo;
      case '6months':
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        return createDate >= sixMonthsAgo;
      case 'year':
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return createDate >= yearAgo;
      default:
        return true;
    }
  }

  logout() {
    this.authService.logout();
    window.location.href = '/login';
  }
}
