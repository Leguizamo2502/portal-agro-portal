import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationListItemDto, CreateNotificationRequest } from '../../models/notifications/notification.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() { }
  private http = inject(HttpClient);
  private urlBase = environment.apiUrl + 'Notification'

  /** Obtiene las notificaciones no leídas del usuario */
  getUnread(take: number = 20): Observable<NotificationListItemDto[]> {
    return this.http.get<NotificationListItemDto[]>(`${this.urlBase}/unread?take=${take}`);
  }

  /** Obtiene el conteo de notificaciones no leídas */
  countUnread(): Observable<number> {
    return this.http.get<number>(`${this.urlBase}/count`);
  }

  /** Obtiene el historial paginado */
  getHistory(page: number = 1, pageSize: number = 20): Observable<{ items: NotificationListItemDto[]; total: number }> {
    return this.http.get<{ items: NotificationListItemDto[]; total: number }>(
      `${this.urlBase}/history?page=${page}&pageSize=${pageSize}`
    );
  }

  /** Marca una notificación como leída */
  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.urlBase}/${id}/read`, {});
  }

  /** Crea una notificación manualmente (solo para pruebas o administración) */
  create(request: CreateNotificationRequest): Observable<number> {
    return this.http.post<number>(this.urlBase, request);
  }



}
