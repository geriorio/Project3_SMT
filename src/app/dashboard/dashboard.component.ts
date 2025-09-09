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
              <div class="row-header clickable" (click)="openStatusDetail('Order Placed')">
                Order Placed
                <span class="expand-icon">→</span>
              </div>
              <div class="row-content">
                @for (order of getLatestOrdersByStatus('Order Placed', MAX_DISPLAY_ITEMS); track order.OrderNum) {
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
              <div class="row-header clickable" (click)="openStatusDetail('Credit Review')">
                Credit Review
                <span class="expand-icon">→</span>
              </div>
              <div class="row-content">
                @for (order of getLatestOrdersByStatus('Credit Review', MAX_DISPLAY_ITEMS); track order.OrderNum) {
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
              <div class="row-header clickable" (click)="openStatusDetail('Delivery Planning')">
                Delivery Planning
                <span class="expand-icon">→</span>
              </div>
              <div class="row-content">
                @for (order of getLatestOrdersByStatus('Delivery Planning', MAX_DISPLAY_ITEMS); track order.OrderNum) {
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
              <div class="row-header clickable" (click)="openStatusDetail('Dispatched for Delivery')">
                Dispatched for Delivery
                <span class="expand-icon">→</span>
              </div>
              <div class="row-content">
                @for (order of getLatestOrdersByStatus('Dispatched for Delivery', MAX_DISPLAY_ITEMS); track order.OrderNum) {
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
      height: 100vh;
      background: #f5f5f5;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding: 0;
      margin: 0;
    }

    .dashboard-header {
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 0.25rem 0;
      flex: 0 0 auto;
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
      font-size: 1.25rem;
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
      flex: 1;
      width: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .board {
      display: grid;
      grid-template-rows: repeat(4, 1fr);
      gap: 2px;
      height: 100%;
      overflow: hidden;
      padding: 2px;
      background: #e9ecef;
    }

    .board-row {
      background: white;
      padding: 0;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
      margin: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
      width: 100%;
    }

    .row-header {
      font-size: 1rem;
      font-weight: 600;
      color: #333;
      border-bottom: 1px solid #e9ecef;
      padding: 4px 8px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex: 0 0 auto;
    }

    .row-content {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(10, minmax(145px, 1fr));
      grid-template-rows: repeat(2, 1fr);
      gap: 4px;
      padding: 4px;
      overflow: hidden;
      min-height: 0;
      align-items: stretch;
      justify-content: start;
      width: calc(100% - 16px);
      max-width: 1500px;
    }

    /* Untuk layar 1080p */
    @media screen and (min-width: 1920px) {
      .row-content {
        grid-template-columns: repeat(10, minmax(180px, 1fr));
        max-width: 1900px;
      }
    }

    /* Untuk layar 4K */
    @media screen and (min-width: 3840px) {
      .row-content {
        grid-template-columns: repeat(10, minmax(360px, 1fr));
        max-width: 3800px;
        gap: 8px;
        padding: 8px;
      }

      .order-number {
        font-size: 1.75rem !important;
      }

      .order-name {
        font-size: 1.5rem !important;
      }

      .time-remaining {
        font-size: 1.4rem !important;
      }
    }

    /* Untuk layar 8K */
    @media screen and (min-width: 7680px) {
      .row-content {
        grid-template-columns: repeat(10, minmax(720px, 1fr));
        max-width: 7600px;
        gap: 16px;
        padding: 16px;
      }

      .order-number {
        font-size: 3.5rem !important;
      }

      .order-name {
        font-size: 3rem !important;
      }

      .time-remaining {
        font-size: 2.8rem !important;
      }
    }

    .order-rectangle {
      width: 100%;
      height: 100%;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      font-weight: 600;
      cursor: pointer;
      position: relative;
      text-align: center;
      padding: 2px;
      margin: 0;
    }

    .order-rectangle:hover {
      transform: scale(1.02);
    }

    .order-content {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      height: 100%;
      width: 100%;
      padding: 1px;
    }

    .order-number {
      font-size: 0.875rem;
      line-height: 1.2;
      margin: 0;
      font-weight: 800;
      padding: 1px;
    }

    .order-name {
      font-size: 0.75rem;
      line-height: 1.2;
      margin: 0;
      padding: 1px;
      font-weight: 600;
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: center;
    }

    .time-remaining {
      font-size: 0.7rem;
      line-height: 1.2;
      margin: 0;
      padding: 1px;
      font-weight: 600;
      width: 100%;
      text-align: center;
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
        width: 100px;
        height: 50px;
      }

      .order-number {
        font-size: 0.7rem;
      }

      .order-name {
        font-size: 0.5rem;
      }

      .time-remaining {
        font-size: 0.4rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly MAX_DISPLAY_ITEMS = 20; // Konstanta untuk jumlah maksimum item per section
  orders: ApiOrderItem[] = [];
  isLoading = true;
  error = '';
  currentUser: User | null = null;
  private countdownInterval: any;
  private refreshInterval: any;
  currentTime = new Date();
  selectedFilter = 'today'; // Default filter

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeComponent();
  }

  ngOnDestroy() {
    this.cleanupTimers();
  }

  private initializeComponent() {
    this.currentUser = this.authService.getCurrentUser();
    this.fetchOrders();
    this.startTimers();
  }

  private cleanupTimers() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  private startTimers() {
    // Clear existing timers before starting new ones
    this.cleanupTimers();
    
    // Start countdown timer - updates every second
    this.startLiveCountdown();
    
    // Start auto refresh timer - refreshes every 5 minutes
    this.startAutoRefresh();
  }

  private startLiveCountdown() {
    this.countdownInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  private startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.refreshData();
    }, 300000); // 5 minutes
  }

  private refreshData() {
    // Set loading state
    this.isLoading = true;
    
    // Refresh user data and fetch new orders
    this.currentUser = this.authService.getCurrentUser();
    this.fetchOrders();
    
    // Note: No need to restart timers as they continue running
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
          const dummyOrder: ApiOrderItem = {
            OrderNum: 123456,
            CustomerID: "123456",
            Name: "Ini Dummy",
            CreateDate: "2025-09-08T15:20:00.000",
            OrderDate: "2025-09-03T00:00:00",
            NeedByDate: "2025-09-03T00:00:00",
            Status: "Credit Review"
          };
          
          const dummyOrder2: ApiOrderItem = {
            OrderNum: 567890,
            CustomerID: "567890",
            Name: "Ini Cuma Dummy",
            CreateDate: "2025-09-07T02:20:00.000",
            OrderDate: "2025-09-03T00:00:00",
            NeedByDate: "2025-09-03T00:00:00",
            Status: "Dispatched for Delivery"
          };

          const dummyOrder3: ApiOrderItem = {
            OrderNum: 999999,
            CustomerID: "567890",
            Name: "Ini Cuma Dummy YA",
            CreateDate: "2025-09-09T09:55:00.000",
            OrderDate: "2025-09-03T00:00:00",
            NeedByDate: "2025-09-03T00:00:00",
            Status: "Dispatched for Delivery"
          };
          
          this.orders.push(dummyOrder);
          this.orders.push(dummyOrder2);
          this.orders.push(dummyOrder3);
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

  getLatestOrdersByStatus(status: string, limit: number = 20): ApiOrderItem[] {
    // Tampilkan semua data asli dengan filter tanggal dan custom sorting
    const filteredOrders = this.orders
      .filter(order => order.Status === status && this.isWithinDateFilter(order));
    
    // Custom sorting berdasarkan color class
    const sortedOrders = filteredOrders.sort((a, b) => {
      const colorA = this.getColorClass(a);
      const colorB = this.getColorClass(b);
      const timeRemainingA = this.getTimeRemainingMs(a);
      const timeRemainingB = this.getTimeRemainingMs(b);
      
      // Group by color first
      if (colorA !== colorB) {
        const colorOrder: { [key: string]: number } = { 'color-red': 0, 'color-yellow': 1, 'color-green': 2 };
        return colorOrder[colorA] - colorOrder[colorB];
      }
      
      // Within same color, sort by time
      if (colorA === 'color-green' || colorA === 'color-yellow') {
        // Hijau & Kuning: time left paling sedikit ke paling banyak
        return timeRemainingA - timeRemainingB;
      } else if (colorA === 'color-red') {
        // Merah: overdue tertinggi ke terendah (most negative to least negative)
        return timeRemainingA - timeRemainingB;
      }
      
      return 0;
    });
    
    return sortedOrders.slice(0, limit);
  }

  getTimeRemainingMs(order: ApiOrderItem): number {
    if (!order.CreateDate) return 0;
    
    const createDate = new Date(order.CreateDate);
    const deadline = new Date(createDate.getTime() + (48 * 60 * 60 * 1000)); // +48 jam
    return deadline.getTime() - this.currentTime.getTime();
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
      // Format overdue: hanya timer tanpa kata OVERDUE
      return `${daysStr}:${hoursStr}:${minutesStr}:${secondsStr}`;
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

  openStatusDetail(status: string) {
    // Buka halaman baru dengan query parameter untuk status
    const url = `/dashboard/detail?status=${encodeURIComponent(status)}&filter=${this.selectedFilter}`;
    window.open(url, '_blank');
  }

  logout() {
    this.authService.logout();
    window.location.href = '/login';
  }
}
