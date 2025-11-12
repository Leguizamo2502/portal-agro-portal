import { Injectable, NgZone } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment.development';
import { NotificationListItemDto } from '../../../models/notifications/notification.model';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

@Injectable({
  providedIn: 'root',
})
export class NotificationHubService {
  private hub?: HubConnection;
  private readonly status$ = new BehaviorSubject<ConnectionStatus>(
    'disconnected'
  );
  private readonly notifications$ = new Subject<NotificationListItemDto>();

  constructor(private readonly zone: NgZone) {}

  /** Observable con el estado de la conexión */
  connectionStatus(): Observable<ConnectionStatus> {
    return this.status$.asObservable();
  }

  /** Stream de notificaciones en tiempo real */
  onNotification(): Observable<NotificationListItemDto> {
    return this.notifications$.asObservable();
  }

  /** Inicia (o reutiliza) la conexión con SignalR */
  async connect(): Promise<void> {
    if (!this.hub) {
      this.hub = this.buildConnection();
    }

    if (!this.hub) {
      return;
    }

    if (
      this.hub.state === HubConnectionState.Connected ||
      this.hub.state === HubConnectionState.Connecting
    ) {
      return;
    }

    this.zone.run(() => this.status$.next('connecting'));

    try {
      await this.hub.start();
      this.zone.run(() => this.status$.next('connected'));
    } catch (error) {
      console.error('Error al conectar con el hub de notificaciones', error);
      this.zone.run(() => this.status$.next('disconnected'));
      throw error;
    }
  }

  /** Detiene la conexión */
  async disconnect(): Promise<void> {
    if (!this.hub) {
      return;
    }

    try {
      await this.hub.stop();
    } finally {
      this.zone.run(() => this.status$.next('disconnected'));
      this.hub = undefined;
    }
  }

  private buildConnection(): HubConnection {
    const hubUrl = this.resolveHubUrl();

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    connection.on(
      'NewNotification',
      (notification: NotificationListItemDto) => {
        this.zone.run(() => this.notifications$.next(notification));
      }
    );

    connection.onreconnecting(() => {
      this.zone.run(() => this.status$.next('reconnecting'));
    });

    connection.onreconnected(() => {
      this.zone.run(() => this.status$.next('connected'));
    });

    connection.onclose(() => {
      this.zone.run(() => this.status$.next('disconnected'));
    });

    return connection;
  }

  private resolveHubUrl(): string {
    try {
      return new URL('/hubs/notifications', environment.apiUrl).toString();
    } catch {
      return '/hubs/notifications';
    }
  }
}
