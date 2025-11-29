import { inject, Injectable, NgZone } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { OrderChatMessageCreateDto, OrderChatMessageDto, OrderChatMessagesPageDto } from '../../models/chat/chat.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OrderChatService {
  private hubConnection?: signalR.HubConnection;
  private readonly baseUrl = environment.apiUrl + 'orders/';
  private readonly http = inject(HttpClient);
  private readonly zone = inject(NgZone);

  constructor() {}
  getMessages(
    orderCode: string,
    skip = 0,
    take = 50
  ): Observable<OrderChatMessagesPageDto> {
    const url = `${this.baseUrl}${orderCode}/chat/messages`;
    return this.http.get<OrderChatMessagesPageDto>(url, {
      params: { skip, take },
    });
  }

  sendMessage(
    orderCode: string,
    payload: OrderChatMessageCreateDto
  ): Observable<OrderChatMessageDto> {
    const url = `${this.baseUrl}${orderCode}/chat/messages`;
    return this.http.post<OrderChatMessageDto>(url, payload);
  }

  // ========== SIGNALR ==========

  startConnection(
    orderCode: string,
    onMessage: (msg: OrderChatMessageDto) => void
  ): Promise<void> {
    if (this.hubConnection) {
      return Promise.resolve();
    }

 
    const hubUrl = (environment as any).hubUrl
      ? (environment as any).hubUrl + 'orders/chat'
      : environment.apiUrl.replace('/api/v1/', '/hubs/orders/chat');

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        withCredentials: true, // si usas cookies auth
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on(
      'ReceiveMessage',
      (orderCodeFromHub: string, message: OrderChatMessageDto) => {
        // Seguridad mínima: solo procesar mensajes del pedido actual
        if (orderCodeFromHub !== orderCode) {
          return;
        }

        // Asegurar que el callback se ejecute dentro de Angular
        this.zone.run(() => onMessage(message));
      }
    );

    return this.hubConnection
      .start()
      .then(() => this.hubConnection!.invoke('JoinOrderRoom', orderCode))
      .catch((err) => {
        console.error('Error al conectar al hub de chat', err);
        throw err;
      });
  }

  async stopConnection(orderCode: string): Promise<void> {
    if (!this.hubConnection) {
      return;
    }

    try {
      await this.hubConnection.invoke('LeaveOrderRoom', orderCode);
    } catch (err) {
      console.warn('Error al salir del room del pedido', err);
    }

    await this.hubConnection.stop();
    this.hubConnection = undefined;
  }
}
