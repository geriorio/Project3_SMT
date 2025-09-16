import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { OrderDataService } from '../services/order-data.service';

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
  selector: 'app-status-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="detail-container">
      <!-- Header -->
      <header class="detail-header">
        <div class="header-content">
          <div class="header-left">
            <button (click)="goBack()" class="back-btn">← Back to Dashboard</button>
            <h1>{{ status }} Orders</h1>
          </div>
          <div class="header-center">
            <div class="filter-section">
              <label for="filter-select" class="filter-label">Filter by:</label>
              <select 
                id="filter-select"
                [(ngModel)]="filter" 
                (change)="onFilterChange()"
                class="filter-dropdown">
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="3months">3 Months</option>
                <option value="6months">6 Months</option>
                <option value="year">1 Year</option>
              </select>
            </div>
            <div class="search-section">
              <label for="search-input" class="search-label">Search:</label>
              <input 
                id="search-input"
                type="text"
                [(ngModel)]="searchQuery"
                (input)="onSearchChange()"
                placeholder="Order Number, Customer ID or Name..."
                class="search-input">
              @if (searchQuery) {
                <button (click)="clearSearch()" class="clear-search-btn">×</button>
              }
            </div>
          </div>
          <div class="header-right">
            <div class="stats">
              <span class="total-orders">Total: {{ filteredOrders.length }} orders</span>
              @if (searchQuery) {
                <span class="search-info">({{ orders.length }} total)</span>
              }
            </div>
          </div>
        </div>
      </header>

      <!-- Content -->
      <div class="content-container">
        @if (error) {
          <div class="error-message">{{ error }}</div>
        } @else if (isLoading) {
          <div class="loading">Loading orders...</div>
        } @else {
          <div class="orders-grid">
            @for (order of filteredOrders; track order.OrderNum) {
              <div class="order-card" 
                   [class]="getColorClass(order)">
                <div class="card-header">
                  <span class="order-number">Order #{{ order.OrderNum }}</span>
                  <span class="color-indicator" [class]="getColorClass(order)"></span>
                </div>
                <div class="card-body">
                  <div class="order-info">
                    <div class="info-row">
                      <label>Customer:</label>
                      <span>{{ order.CustomerID }}</span>
                    </div>
                    <div class="info-row">
                      <label>Name:</label>
                      <span>{{ order.Name }}</span>
                    </div>
                    <div class="info-row">
                      <label>Created:</label>
                      <span>{{ order.CreateDate | date:'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                    <div class="info-row">
                      <label>Order Date:</label>
                      <span>{{ order.OrderDate | date:'dd/MM/yyyy' }}</span>
                    </div>
                    <div class="info-row">
                      <label>Need By:</label>
                      <span>{{ order.NeedByDate | date:'dd/MM/yyyy' }}</span>
                    </div>
                    <div class="info-row time-row">
                      <label>Time Remaining:</label>
                      <span class="time-value" [class]="getColorClass(order)">{{ getTimeRemaining(order) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .detail-container {
      min-height: 100vh;
      background: #f5f5f5;
    }

    .detail-header {
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 1rem 0;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-content {
      width: 100%;
      margin: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 1rem;
      gap: 2rem;
    }

    .header-left {
      flex: 1;
    }

    .header-center {
      flex: 0 0 auto;
      display: flex;
      gap: 2rem;
      align-items: center;
    }

    .filter-section, .search-section {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      position: relative;
    }

    .search-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #333;
      margin: 0;
      white-space: nowrap;
    }

    .search-input {
      background: #f8f9fa;
      color: #333;
      border: 1px solid #dee2e6;
      padding: 0.5rem;
      border-radius: 4px;
      font-size: 0.875rem;
      min-width: 200px;
      padding-right: 30px;
    }

    .search-input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    .search-input::placeholder {
      color: #6c757d;
      font-style: italic;
    }

    .clear-search-btn {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      font-size: 1.2rem;
      color: #6c757d;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .clear-search-btn:hover {
      background: #e9ecef;
      color: #333;
    }

    .search-info {
      font-size: 0.875rem;
      color: #6c757d;
      font-weight: normal;
      margin-left: 0.5rem;
    }

    .header-right {
      flex: 1;
      display: flex;
      justify-content: flex-end;
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
      white-space: nowrap;
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

    .back-btn {
      background: #6c757d;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .back-btn:hover {
      background: #5a6268;
    }

    .detail-header h1 {
      color: #333;
      margin: 0;
      font-size: 1.5rem;
    }

    .filter-info {
      font-size: 0.875rem;
      color: #6c757d;
    }

    .stats {
      font-size: 1rem;
      font-weight: 600;
      color: #333;
    }

    .content-container {
      width: 100%;
      margin: 0;
      padding: 1rem;
      height: calc(100vh - 120px);
      overflow-y: auto;
    }

    .orders-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      padding-bottom: 2rem;
    }

    .order-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
      border-left: 4px solid #dee2e6;
    }

    .order-card.color-green {
      border-left-color: #28a745;
    }

    .order-card.color-yellow {
      border-left-color: #ffc107;
    }

    .order-card.color-red {
      border-left-color: #dc3545;
    }

    .card-header {
      background: #f8f9fa;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e9ecef;
    }

    .order-number {
      font-weight: 700;
      font-size: 1.1rem;
      color: #333;
    }

    .color-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
    }

    .color-indicator.color-green {
      background: #28a745;
    }

    .color-indicator.color-yellow {
      background: #ffc107;
    }

    .color-indicator.color-red {
      background: #dc3545;
    }

    .card-body {
      padding: 1rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      padding: 0.25rem 0;
    }

    .info-row label {
      font-weight: 600;
      color: #333;
      min-width: 120px;
    }

    .info-row span {
      color: #6c757d;
      text-align: right;
    }

    .time-row {
      border-top: 1px solid #e9ecef;
      padding-top: 0.75rem;
      margin-top: 0.75rem;
    }

    .time-value {
      font-weight: 700;
      font-size: 1rem;
    }

    .time-value.color-green {
      color: #28a745;
    }

    .time-value.color-yellow {
      color: #856404;
    }

    .time-value.color-red {
      color: #dc3545;
    }

    .loading, .error-message {
      text-align: center;
      padding: 3rem;
      font-size: 1.125rem;
    }

    .error-message {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      margin: 2rem;
    }

    @media (max-width: 1400px) {
      .orders-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 1024px) {
      .orders-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .orders-grid {
        grid-template-columns: 1fr;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .header-center {
        align-self: center;
        order: 2;
        flex-direction: column;
        gap: 1rem;
      }

      .filter-section, .search-section {
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-start;
      }

      .search-input {
        min-width: 250px;
      }

      .header-right {
        align-self: center;
        order: 3;
      }

      .filter-dropdown {
        min-width: 100px;
        font-size: 0.8rem;
      }

      .info-row {
        flex-direction: column;
        gap: 0.25rem;
      }

      .info-row span {
        text-align: left;
      }
    }
  `]
})
export class StatusDetailComponent implements OnInit, OnDestroy {
  allOrders: ApiOrderItem[] = []; // Semua data dari API
  orders: ApiOrderItem[] = []; // Data yang sudah difilter untuk display
  filteredOrders: ApiOrderItem[] = []; // Data setelah search filtering
  isLoading = true;
  error = '';
  status = '';
  filter = 'all';
  searchQuery = ''; // Property untuk search
  private countdownInterval: any;
  currentTime = new Date();

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private authService: AuthService,
    private orderDataService: OrderDataService
  ) {}

  ngOnInit() {
    // Get parameters from URL
    this.route.queryParams.subscribe(params => {
      this.status = params['status'] || 'Order Placed';
      this.filter = params['filter'] || 'all';
    });

    // Cek apakah data sudah tersedia dari dashboard
    if (this.orderDataService.hasData()) {
      // Gunakan data yang sudah ada dari dashboard - NO API CALL
      this.allOrders = this.orderDataService.getOrders();
      this.applyFilters();
      this.isLoading = false;
    } else {
      // Baru API call jika tidak ada data (refresh/direct access)
      this.fetchOrders();
    }
    
    this.startLiveCountdown();
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  onFilterChange() {
    // Client-side filtering only - tidak recall API
    this.applyFilters();
  }

  onSearchChange() {
    this.applySearchFilter();
  }

  clearSearch() {
    this.searchQuery = '';
    this.applySearchFilter();
  }

  applySearchFilter() {
    if (!this.searchQuery.trim()) {
      this.filteredOrders = [...this.orders];
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.filteredOrders = this.orders.filter(order => 
      order.OrderNum.toString().includes(query) ||
      order.CustomerID.toLowerCase().includes(query) ||
      order.Name.toLowerCase().includes(query)
    );
  }

  startLiveCountdown() {
    this.countdownInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  fetchOrders() {
    const url = 'https://epicprodapp.samator.com/Kinetic/api/v2/efx/SGI/FSMT069OrderDash/GetOrders';
    const username = 'epicorWebAPI';
    const password = 'epicorWebAPI';
    const basicAuth = 'Basic ' + btoa(`${username}:${password}`);
    
    const headers = new HttpHeaders({
      'x-api-key': 'W5hczOaOGdc68PcfchvZSvhUmWOf9AX3P6Zhfm0cghdPu',
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Authorization': basicAuth
    });

    this.http.post<ApiResponse>(url, {}, { headers }).subscribe({
      next: (response) => {
        if (response?.Result?.Results) {
          // Simpan semua data dari API
          this.allOrders = response.Result.Results;
          // Simpan ke service untuk sharing
          this.orderDataService.setOrders(this.allOrders);
          // Apply filter untuk display
          this.applyFilters();
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

  applyFilters() {
    // Client-side filtering dan sorting berdasarkan status dan date filter
    this.orders = this.allOrders
      .filter(order => order.Status === this.status && this.isWithinDateFilter(order))
      .sort((a, b) => this.customSort(a, b));
    
    // Apply search filter after date/status filter
    this.applySearchFilter();
  }

  customSort(a: ApiOrderItem, b: ApiOrderItem): number {
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
      // Merah: overdue tertinggi ke terendah
      return timeRemainingA - timeRemainingB;
    }
    
    return 0;
  }

  getTimeRemainingMs(order: ApiOrderItem): number {
    if (!order.CreateDate) return 0;
    
    const createDate = new Date(order.CreateDate);
    const deadline = new Date(createDate.getTime() + (48 * 60 * 60 * 1000));
    return deadline.getTime() - this.currentTime.getTime();
  }

  getTimeRemaining(order: ApiOrderItem): string {
    if (!order.CreateDate) return 'No Date';
    
    const createDate = new Date(order.CreateDate);
    const deadline = new Date(createDate.getTime() + (48 * 60 * 60 * 1000));
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
      return `OVERDUE ${daysStr}:${hoursStr}:${minutesStr}:${secondsStr}`;
    } else {
      return `${daysStr}:${hoursStr}:${minutesStr}:${secondsStr}`;
    }
  }

  getColorClass(order: ApiOrderItem): string {
    if (!order.CreateDate) return 'color-red';
    
    const createDate = new Date(order.CreateDate);
    const deadline = new Date(createDate.getTime() + (48 * 60 * 60 * 1000));
    const diffMs = deadline.getTime() - this.currentTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours > 12) {
      return 'color-green';
    } else if (diffHours > 0) {
      return 'color-yellow';
    } else {
      return 'color-red';
    }
  }

  isWithinDateFilter(order: ApiOrderItem): boolean {
    // Jika filter adalah "all", tampilkan semua data
    if (this.filter === 'all') {
      return true;
    }
    
    if (!order.CreateDate) return false;
    
    const createDate = new Date(order.CreateDate);
    const now = new Date();
    
    switch (this.filter) {
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

  getFilterLabel(): string {
    const filterLabels: { [key: string]: string } = {
      'all': 'All',
      'today': 'Today',
      'week': 'This Week',
      'month': 'This Month',
      '3months': '3 Months',
      '6months': '6 Months',
      'year': '1 Year'
    };
    return filterLabels[this.filter] || 'All';
  }

  goBack() {
    window.close();
  }
}
