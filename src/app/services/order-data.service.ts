import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface ApiOrderItem {
  OrderNum: number;
  CustomerID: string;
  Name: string;
  CreateDate: string | null;
  OrderDate: string;
  NeedByDate: string;
  Status: string;
  PONum: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderDataService {
  private ordersData = new BehaviorSubject<ApiOrderItem[]>([]);
  private lastFetchTime = 0;
  
  // Observable untuk components subscribe
  orders$ = this.ordersData.asObservable();

  constructor() {}

  // Set data dari dashboard
  setOrders(orders: ApiOrderItem[]) {
    this.ordersData.next(orders);
    this.lastFetchTime = Date.now();
  }

  // Get current data
  getOrders(): ApiOrderItem[] {
    return this.ordersData.value;
  }

  // Check if data is available (tidak perlu API call)
  hasData(): boolean {
    return this.ordersData.value.length > 0;
  }

  // Check if data is fresh (untuk auto-refresh logic jika diperlukan)
  isDataFresh(maxAgeMinutes: number = 5): boolean {
    return (Date.now() - this.lastFetchTime) < (maxAgeMinutes * 60 * 1000);
  }

  // Clear data (untuk logout atau refresh)
  clearData() {
    this.ordersData.next([]);
    this.lastFetchTime = 0;
  }
}
