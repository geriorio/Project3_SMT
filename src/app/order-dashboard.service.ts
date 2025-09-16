import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrderDashboardService {
  private apiUrl = 'https://epictestapp.samator.com/KineticTest2/api/v2/efx/SGI/FSMT069OrderDash/GetOrders';
  private apiKey = 'MtW5QmpH660283OeMjCoRhgvZf2WBe1nbJMT3bTyJfuhB';
  private username = 'epicorWebAPI';
  private password = 'epicorWebAPI';

  constructor(private http: HttpClient) {}

  getOrders(): Observable<any> {
    const headers = new HttpHeaders({
      'x-api-key': this.apiKey,
      'Authorization': 'Basic ' + btoa(`${this.username}:${this.password}`),
      'Content-Type': 'application/json'
    });
    
    // Coba POST request dengan body kosong
    return this.http.post(this.apiUrl, {}, { headers });
  }
}
