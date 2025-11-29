import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { AdminDashboard, OrderFunnel, PaymentSummary, CatalogSummary, TopProducerStat, TopProductStat } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl + 'admin/dashboard'

  constructor() { }

  getOverview(top: number = 5): Observable<AdminDashboard> {
    const params = new HttpParams().set('top', top);
    return this.http.get<AdminDashboard>(`${this.baseUrl}/overview`, { params });
  }

  getOrderFunnel(): Observable<OrderFunnel> {
    return this.http.get<OrderFunnel>(`${this.baseUrl}/orders`);
  }

  getPaymentSummary(): Observable<PaymentSummary> {
    return this.http.get<PaymentSummary>(`${this.baseUrl}/payments`);
  }

  getCatalogSummary(): Observable<CatalogSummary> {
    return this.http.get<CatalogSummary>(`${this.baseUrl}/catalog`);
  }

  getTopProducers(limit: number = 5): Observable<{ items: TopProducerStat[]; total: number }> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<{ items: TopProducerStat[]; total: number }>(
      `${this.baseUrl}/top-producers`,
      { params }
    );
  }

  getTopProducts(limit: number = 5): Observable<{ items: TopProductStat[]; total: number }> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<{ items: TopProductStat[]; total: number }>(
      `${this.baseUrl}/top-products`,
      { params }
    );
  }
}
