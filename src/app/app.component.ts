import { Component, OnInit } from '@ang              @for (order of getLatestOrdersByStatus('Order Placed', 20); track order.OrderNum) {
                <div class="order-circle status-placed" [title]="'Order: ' + order.OrderNum + '\nCustomer: ' + order.CustomerID">
                  <div class="order-number">{{ order.OrderNum }}</div>
                  <div class="time-remaining">{{ getTimeRemaining(order) }}</div>
                </div>
              }core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';

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
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="board-container">
      <h1>{{ title }}</h1>
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
                <div class="order-circle status-review" [title]="'Order: ' + order.OrderNum + '\\nCustomer: ' + order.CustomerID">
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
              @for (order of getLatestOrdersByStatus('Dispatched for Delivery', 20); track order.OrderNum) {
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
  `,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Order Tracking Board';
  orders: ApiOrderItem[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  getLatestOrdersByStatus(status: string, limit: number): ApiOrderItem[] {
    return this.orders
      .filter(order => order.Status === status)
      .sort((a, b) => {
        // Sort by OrderDate in descending order (newest first)
        const dateA = new Date(a.OrderDate).getTime();
        const dateB = new Date(b.OrderDate).getTime();
        return dateB - dateA;
      })
      .slice(0, limit);
  }

  getTimeRemaining(order: ApiOrderItem): string {
    if (!order.NeedByDate) return '';
    const needByDate = new Date(order.NeedByDate);
    const now = new Date();
    const diffTime = needByDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays}d left`;
  }

  ngOnInit() {
    this.fetchOrders();
  }

  private fetchOrders() {
    // Menggunakan URL yang lebih spesifik
    const baseUrl = 'https://epictestapp.samator.com/KineticTest2/api/v2/efx';
    const endpoint = '/SGI/FSMT069OrderDash/GetOrders';
    const apiUrl = baseUrl + endpoint;
    
    const apiKey = 'MtW5QmpH660283OeMjCoRhgvZf2WBe1nbJMT3bTyJfuhB';
    const username = 'christo';
    const password = 'Chr15topherb@';

    const authHeader = 'Basic ' + btoa(username + ':' + password);
    
    // Request body sesuai dengan format yang diharapkan API
    const requestBody = {
      CompanyID: 'SGI',
      CustomerID: '',
      OrderNum: 0,
      Status: '',
      FromDate: '2023-01-01',
      ToDate: '2025-12-31'
    };

    const options = {
      headers: new HttpHeaders()
        .set('Authorization', authHeader)
        .set('X-API-Key', apiKey)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
    };

    console.log('Fetching orders...');
    console.log('Request body:', requestBody);
    console.log('Auth header:', authHeader);
    
    // Menggunakan interface ApiResponse untuk type checking dan mengirim requestBody
    this.http.post<ApiResponse>(apiUrl, requestBody, options).subscribe({
      next: (response: any) => {
        console.log('Raw response:', response);
        
        try {
          // Coba parse response jika string
          const data = typeof response === 'string' ? JSON.parse(response) : response;
          
          if (data && data.Result && data.Result.Results && Array.isArray(data.Result.Results)) {
            // Format {Result: {Results: [...]}}
            this.orders = data.Result.Results;
            console.log('Orders loaded:', this.orders);
            
            // Check for errors
            if (data.Result.Errors && data.Result.Errors.length > 0) {
              console.warn('API returned errors:', data.Result.Errors);
            }
            
            // Log execution info if available
            if (data.Result.ExecutionInfo && data.Result.ExecutionInfo.length > 0) {
              console.info('Execution info:', data.Result.ExecutionInfo);
            }
          } else {
            console.error('Unexpected data format:', data);
            this.error = 'Unexpected data format received';
            this.orders = [];
          }
        } catch (e) {
          console.error('Error parsing response:', e);
          this.error = 'Error parsing server response';
          this.orders = [];
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching orders:', error);
        this.error = 'Failed to load orders: ' + (error.message || 'Unknown error');
        this.isLoading = false;
      }
    });
  }
}
