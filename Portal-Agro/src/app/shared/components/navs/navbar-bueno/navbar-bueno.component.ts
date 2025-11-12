import { Component, inject, OnDestroy, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-navbar-bueno',
  standalone: true,
  imports: [RouterLink, MatIcon, CommonModule, IfLoggedInDirective, ButtonComponent, IfLoggedOutDirective, NotificationsMenuComponent],
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

  // Inyección de DriverjService
  driverService = inject(DriverJsService);

  
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
  private tours: Record<string, any[]> = {
    '/home': [
      { element: '#carrusel', popover: { title: 'Carrusel', description: 'Aquí se muestran los banners.', side: 'bottom' as const } },
      { element: '#ultimosAgregados', popover: { title: 'Últimos Agregados', description: 'Productos agregados recientemente.', side: 'top' as const }},
      {
      element: '#productosDestacados',
      popover: {
        title: 'Productos Destacados',
        description: 'Nuestros productos más recomendados.',
        side: 'top' as const
      }
    },
    {
      element: '#explorarBtn',
      popover: {
        title: 'Explorar Productos',
        description: 'Haz clic aquí para ir a la página de todos los productos.',
        side: 'center' as const
      }
    }
    ],
    '/home/product': [
    {
      element: '#filtros',
      popover: {
        title: 'Filtros',
        description: 'Usa los filtros para buscar productos por nombre o productor.',
        side: 'right' as const
      }
    },
    {
      element: '#categoria-select',
      popover: {
        title: 'Categorías',
        description: 'Selecciona la categoría de productos que deseas ver.',
        side: 'bottom' as const
      }
    },
    {
      element: '#listaProductos',
      popover: {
        title: 'Listado de productos',
        description: 'Aquí aparecen los productos disponibles según tus filtros.',
        side: 'left' as const
      }
    },
    {element: '#pagination',
      popover:{
        title: 'Paginación',
        description:'Aqui podrás ver la siguiente sección de los demás productos',
        align: 'end',
        side: 'right' as const
      }
    },
  ],
    '/account/info': [
      {element: '#Info-basic',
      popover:{
        title:'Información Básica',
        description:'Aquí se mostrara la información básica que registraste al registrarte',
        position:'top' as const
      },
    },
    {element:'#actions-S',
      popover:{
        title:'Acciones',
        description:'Desde aquí puedes actualizar tus datos o cambiar la contraseña.',
        side: "left",
        align: "start",
      },
    },
    {
      element:'#update-Account-btn',
      popover:{
        title:'Actualizar Información',
        description:'Ahí podrás actualizar tus datos personales.',
        align:'start',
        side:'top' as const
      },
    },
    {
      element:'#changePassword-btn',
      popover:{
        title:'Cambiar Contraseña',
        description:'Ahí podrás cambiar la contraseña.',
        align:'start',
        side:'top' as const
      },
    },
  ],
  '/account/info/updateDataBasic':[
  {
    element: '#Info-Account-Update',
    popover: {
      title: 'Actualizar Datos Básicos',
      description: 'Aquí podrás modificar tus datos personales.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '#firstName-field',
    popover: {
      title: 'Nombres',
      description: 'Ingresa tus nombres tal como aparecen en tu documento de identidad.',
      side: 'right',
      align: 'center',
    },
  },
  {
    element: '#lastName-field',
    popover: {
      title: 'Apellidos',
      description: 'Ingresa tus apellidos completos.',
      side: 'right',
      align: 'center',
    },
  },
  {
    element: '#phoneNumber-field',
    popover: {
      title: 'Teléfono',
      description: 'Introduce tu número de teléfono (10 dígitos).',
      side: 'right',
      align: 'center',
    },
  },
  {
    element: '#department-field',
    popover: {
      title: 'Departamento',
      description: 'Selecciona el departamento donde vives.',
      side: 'right',
      align: 'center',
    },
  },
  {
    element: '#city-field',
    popover: {
      title: 'Ciudad',
      description: 'Selecciona la ciudad correspondiente al departamento elegido.',
      side: 'right',
      align: 'center',
    },
  },
  {
    element: '#address-field',
    popover: {
      title: 'Dirección',
      description: 'Ingresa tu dirección exacta para que podamos ubicarte correctamente.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '#actions',
    popover: {
      title: 'Acciones',
      description: 'acá podrás guardar o cancelar los cambios.',
      side: 'top',
      align: 'start',
    },
  },
  ],
  '/account/info/changePassword':[
  {
    element: '#title-form',
    popover: {
      title: 'Formulario de cambio de contraseña',
      description: 'Aquí puedes actualizar tu contraseña de manera segura.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '#current-password-field',
    popover: {
      title: 'Contraseña actual',
      description: 'Debes ingresar tu contraseña actual para confirmar que eres tú.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '#new-password-field',
    popover: {
      title: 'Nueva contraseña',
      description: 'Ingresa tu nueva contraseña cumpliendo las reglas de seguridad.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '#confirm-password-field',
    popover: {
      title: 'Confirmar contraseña',
      description: 'Repite la nueva contraseña para asegurarte de que no tenga errores.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '#form-actions',
    popover: {
      title: 'Acciones',
      description: 'Guarda los cambios o cancela para volver atrás.',
      side: 'top',
      align: 'center'
    },
  },
  ],
  '/account/favorite':[
  {
    element: '#favorite-title',
    popover: {
      title: 'Sección de favoritos',
      description: 'Aquí podrás ver todos los productos que marcaste como favoritos.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '#favorite-list',
    popover: {
      title: 'Lista de productos favoritos',
      description: 'Tus productos favoritos aparecerán aquí con detalles y opciones.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '#favorite-empty',
    popover: {
      title: 'Sin productos favoritos',
      description: 'Si aún no tienes productos en favoritos, verás este mensaje.',
      side: 'top',
      align: 'center'
    }
  }
  ],
  '/account/orders/:code': [
    {
    element: '#order-header',
    popover: {
      title: 'Detalle del Pedido',
      description: 'Aquí verás la información completa de tu pedido.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '#order-head',
    popover: {
      title: 'Encabezado del pedido',
      description: 'Muestra el número del pedido y el estado actual.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '#order-summary',
    popover: {
      title: 'Resumen',
      description: 'Incluye producto, precio, cantidad, subtotal y total.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '#order-delivery',
    popover: {
      title: 'Entrega',
      description: 'Aquí verás los datos de envío: destinatario, dirección y ciudad.',
      side: 'left',
      align: 'start'
    }
  },
  {
    element: '#order-payment',
    popover: {
      title: 'Comprobante de Pago',
      description: 'Muestra el comprobante subido y te permite agregar uno nuevo si aplica.',
      side: 'top',
      align: 'center'
    }
  },
  {
    element: '#order-producer',
    popover: {
      title: 'Notas del productor',
      description: 'Si el productor dejó comentarios o un motivo de decisión, aparecerán aquí.',
      side: 'top',
      align: 'start'
    }
  },
  {
    element: '#order-actions',
    popover: {
      title: 'Confirmar recepción',
      description: 'Cuando el pedido llegue, podrás confirmar o reportar un problema.',
      side: 'top',
      align: 'center'
    }
  },
  {
    element: '#order-cancel',
    popover: {
      title: 'Cancelar pedido',
      description: 'En algunos estados podrás cancelar el pedido directamente.',
      side: 'top',
      align: 'center'
    }
  }
  ]
  };

  startTour() {
  const currentRoute = this.router.url.split('?')[0]; // elimina query params
  let steps = this.tours[currentRoute];
  if (!steps && currentRoute.startsWith('/account/orders/')) {
    steps = this.tours['/account/orders/:code'];
  }
  steps = steps || [];
  if (steps.length > 0) {
    this.driverService.startTour(steps);
  } else {
    console.warn('No hay tour definido para esta ruta:', currentRoute);
  }
}

}
