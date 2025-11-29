import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../Core/services/auth/auth.service';
import { SidebarService } from '../../../services/sidebar/sidebar.service';
import { IfLoggedInDirective } from "../../../../Core/directives/if-logged-in.directive";
import { ButtonComponent } from "../../button/button.component";
import { IfLoggedOutDirective } from "../../../../Core/directives/if-logged-out.directive";
import { AuthState } from '../../../../Core/services/auth/auth.state';
import { DriverJsService } from '../../../services/driverJS/driver-js.service';
import { Title } from 'chart.js';
import { NotificationListItemDto } from '../../../models/notifications/notification.model';
import { NotificationsMenuComponent } from "../../notifications-menu/notifications-menu.component";
import { NotificationService } from '../../../services/notification/notification.service';
import { NotificationHubService } from '../../../services/notification/notificationHub/notification-hub.service';
import { catchError, finalize, forkJoin, of, Subject, takeUntil } from 'rxjs';
import { MatTooltipModule, MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-navbar-bueno',
  standalone: true,
  imports: [RouterLink, MatIcon, CommonModule, IfLoggedInDirective, ButtonComponent, IfLoggedOutDirective, NotificationsMenuComponent,MatTooltipModule],
  templateUrl: './navbar-bueno.component.html',
  styleUrls: ['./navbar-bueno.component.css']
})
export class NavbarBuenoComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  ath = inject(AuthState);
  router = inject(Router);
  sidebarService = inject(SidebarService);
  private readonly notificationService = inject(NotificationService);
  private readonly notificationHubService = inject(NotificationHubService);
  private readonly destroy$ = new Subject<void>();
  private driverTourService = inject(DriverJsService);
  showTooltip = true;

  
  @ViewChild('tourButton') tooltip!: MatTooltip;

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.tooltip) {
        this.tooltip.show();
        setTimeout(() => {
          this.tooltip.hide();
          this.showTooltip = false;
        }, 5000);
      }
    }, 500);
  }
  
  startTour() {
    this.driverTourService.startTour();
  }
  
  notifications: NotificationListItemDto[] = [];
  notificationsLoading = false;

  ngOnInit(): void {
    this.ath.me$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (me) => {
        if (me) {
          try {
            await this.notificationHubService.connect();
          } catch {
            // La conexión fallida ya se registró en consola, continuamos sin interrumpir el flujo.
          }
          this.loadUnreadNotifications();
        } else {
          this.notifications = [];
          await this.notificationHubService.disconnect();
        }
      });

    this.notificationHubService
      .onNotification()
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => {
        this.notifications = [
          notification,
          ...this.notifications.filter((item) => item.id !== notification.id),
        ].slice(0, 20);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    void this.notificationHubService.disconnect();
  }
  
  get isAccountRoute(): boolean {
    return this.router.url.startsWith('/account');
  }

  toggleSidebar() {
    this.sidebarService.toggle();
  }

  logOut(): void {
    this.authService.LogOut().subscribe({
      next: () => {
        this.ath.clear();
        Swal.fire({
          icon: 'success',
          title: 'Sesión cerrada',
          text: 'Has cerrado sesión correctamente',
          timer: 2000,
          showConfirmButton: false,
        });
        this.router.navigate(['auth/login']);
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al cerrar sesión',
          text: err?.message || 'Ocurrió un error inesperado',
        });
      },
      complete: () => console.log('Logout completo'),
    });
  }

  
  onNotificationsMenuOpened(): void {
    this.loadUnreadNotifications();
  }

  onNotificationOpen(notification: NotificationListItemDto): void {
    this.markNotificationAsRead(notification, true);
  }

  onNotificationMarkRead(notification: NotificationListItemDto): void {
    this.markNotificationAsRead(notification, false);
  }

  onNotificationMarkAll(): void {
    const unread = this.notifications.filter((item) => !item.isRead);
    if (!unread.length) {
      return;
    }

    this.notificationsLoading = true;
    forkJoin(unread.map((item) => this.notificationService.markAsRead(item.id)))
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.notificationsLoading = false)),
        catchError((error) => {
          console.error('No se pudieron marcar todas las notificaciones', error);
          return of(null);
        })
      )
      .subscribe(() => {
        this.notifications = this.notifications.map((item) => ({
          ...item,
          isRead: true,
        }));
      });
  }

  private loadUnreadNotifications(): void {
    this.notificationsLoading = true;
    this.notificationService
      .getUnread()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.notificationsLoading = false)),
        catchError((error) => {
          console.error('No se pudieron obtener las notificaciones', error);
          return of([] as NotificationListItemDto[]);
        })
      )
      .subscribe((items) => {
        this.notifications = items ?? [];
      });
  }

  private markNotificationAsRead(notification: NotificationListItemDto, navigate: boolean): void {
    if (notification.isRead) {
      this.goToNotificationRoute(notification, navigate);
      return;
    }

    this.notificationService
      .markAsRead(notification.id)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('No se pudo marcar la notificación como leída', error);
          return of(undefined);
        })
      )
      .subscribe(() => {
        this.notifications = this.notifications.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item
        );
        this.goToNotificationRoute(notification, navigate);
      });
  }

  private goToNotificationRoute(notification: NotificationListItemDto, navigate: boolean): void {
    if (!navigate || !notification.relatedRoute) {
      return;
    }

    const url = notification.relatedRoute.startsWith('/')
      ? notification.relatedRoute
      : `/${notification.relatedRoute}`;
    this.router.navigateByUrl(url);
  }
}
