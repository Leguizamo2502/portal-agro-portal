import { Injectable, inject, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import './driver-js-custom.css';

@Injectable({
  providedIn: 'root'
})
export class DriverJsService {
  private router = inject(Router);
  private openedElements: HTMLElement[] = [];
  private originalStates: Map<HTMLElement, boolean> = new Map();
  private driverInstance: any;
  
  /**
   * JSON centralizado de tours para cada ruta
   */
  
  private tours: Record<string, DriveStep[]> = {
    '/home': [
      { element: '#carouselExampleFade', popover: { title: 'Carrusel', description: 'Aquí se muestran los banners.', side: 'bottom' as const } },
      { element: '#latest-additions', popover: { title: 'Últimos Agregados', description: 'Productos agregados recientemente.', side: 'top' as const } },
      { element: '#featured-products', popover: { title: 'Productos Destacados', description: 'Nuestros productos más recomendados.', side: 'top' as const } }
    ],
    '/home/product': [
      { element: '#filters', popover: { title: 'Filtros', description: 'Usa los filtros para buscar productos por nombre o productor.', side: 'right' as const } },
      { element: '#category-select', popover: { title: 'Categorías', description: 'Selecciona la categoría de productos que deseas ver.', side: 'bottom' as const } },
      { element: '#List-Products', popover: { title: 'Listado de productos', description: 'Aquí aparecen los productos disponibles según tus filtros.', side: 'left' as const } },
      { element: '#pagination', popover: { title: 'Paginación', description: 'Aquí podrás ver la siguiente sección de los demás productos.', align: 'end', side: 'right' as const } }
    ],
    '/account/info': [
      { element: '#Info-basic', popover: { title: 'Información Básica', description: 'Aquí se mostrará la información básica que registraste.', side: 'top' as const } },
      { element: '#actions-S', popover: { title: 'Acciones', description: 'Desde aquí puedes actualizar tus datos o cambiar la contraseña.', side: 'left', align: 'start' } },
      { element: '#update-Account-btn', popover: { title: 'Actualizar Información', description: 'Ahí podrás actualizar tus datos personales.', side: 'top' as const } },
      { element: '#changePassword-btn', popover: { title: 'Cambiar Contraseña', description: 'Ahí podrás cambiar la contraseña.', side: 'top' as const } }
    ],
    '/account/info/updateDataBasic': [
      { element: '#Info-Account-Update', popover: { title: 'Actualizar Datos Básicos', description: 'Aquí podrás modificar tus datos personales.', side: 'top', align: 'start' } },
      { element: '#firstName-field', popover: { title: 'Nombres', description: 'Ingresa tus nombres tal como aparecen en tu documento de identidad.', side: 'right' } },
      { element: '#lastName-field', popover: { title: 'Apellidos', description: 'Ingresa tus apellidos completos.', side: 'right' } },
      { element: '#phoneNumber-field', popover: { title: 'Teléfono', description: 'Introduce tu número de teléfono (10 dígitos).', side: 'right' } },
      { element: '#department-field', popover: { title: 'Departamento', description: 'Selecciona el departamento donde vives.', side: 'right' } },
      { element: '#city-field', popover: { title: 'Ciudad', description: 'Selecciona la ciudad correspondiente al departamento elegido.', side: 'right' } },
      { element: '#address-field', popover: { title: 'Dirección', description: 'Ingresa tu dirección exacta.', side: 'top' } },
      { element: '#actions', popover: { title: 'Acciones', description: 'Acá podrás guardar o cancelar los cambios.', side: 'top' } }
    ],
    '/account/info/changePassword': [
      { element: '#title-form', popover: { title: 'Formulario de cambio de contraseña', description: 'Aquí puedes actualizar tu contraseña.', side: 'bottom' } },
      { element: '#current-password-field', popover: { title: 'Contraseña actual', description: 'Debes ingresar tu contraseña actual.', side: 'right' } },
      { element: '#new-password-field', popover: { title: 'Nueva contraseña', description: 'Ingresa tu nueva contraseña cumpliendo las reglas.', side: 'right' } },
      { element: '#confirm-password-field', popover: { title: 'Confirmar contraseña', description: 'Repite la nueva contraseña.', side: 'right' } },
      { element: '#form-actions', popover: { title: 'Acciones', description: 'Guarda o cancela los cambios.', side: 'top' } }
    ],
    '/account/favorite': [
      { element: '#favorite-title', popover: { title: 'Sección de favoritos', description: 'Aquí verás los productos marcados como favoritos.', side: 'bottom' } },
      { element: '#favorite-list', popover: { title: 'Lista de productos favoritos', description: 'Tus productos favoritos aparecerán aquí.', side: 'right' } },
      { element: '#favorite-empty', popover: { title: 'Sin productos favoritos', description: 'Si aún no tienes productos, verás este mensaje.', side: 'top' } }
    ],
    '/account/orders/:code': [
      { element: '#order-header', popover: { title: 'Detalle del Pedido', description: 'Información completa del pedido.', side: 'bottom' } },
      { element: '#order-summary', popover: { title: 'Resumen', description: 'Producto, precio, cantidad y total.', side: 'right' } },
      { element: '#order-delivery', popover: { title: 'Entrega', description: 'Estos son los datos personales del cliente para que reciva el producto.', side: 'right' } },
      { element: '#order-payment', popover: { title: 'Comprobante de Pago', description: 'Acá deberás revisar el comprobante. También aparecerá con la fecha.', side: 'top' } },
      {
      element: '#drv-btn-chat',
      popover: {
        title: 'Chat con el Productor',
        description: 'Haz clic para abrir el chat y comunicarte directamente con el Productor (podrás Escribir al productor cuando acepte el comprobante).'
      }
    }
    ],
    '/account/producer/summary':[
      {element:'#producer-layout-summary', popover:{ title: 'Panel principal', description: 'Aquí podrás visualizar un resumen general y gestionar los pedidos realizados por tus clientes.', side:'over'}},
      {element:'#nav-smy-mang', popover:{ title: 'Barra de navegación', description: 'Usa esta barra para moverte entre el resumen, la gestión de productos y tus fincas.', side:'bottom'}},
      {element:'#mat-tab-link-0', popover:{ title: 'Resumen', description: 'Consulta el estado de tus pedidos y accede fácilmente a la información de tu perfil.', side:'top'}},
      {element:'#mat-tab-link-1', popover:{ title: 'Gestión', description: 'Administra tus productos y fincas: edita, agrega o elimina lo que necesites con facilidad.', side:'top'}},
      {element:'#show-my-profile', popover:{ title: 'Ver perfil', description: 'Visualiza la información de tu perfil de productor y revisa tus datos personales.', side:'top'}},
      {element:'#update-my-profile', popover:{ title: 'Actualizar perfil', description: 'Modifica tus datos personales o información de contacto cuando lo necesites.', side:'top'}},
      {element:'#totalOrder', popover:{title:'Total de pedidos', description:'Consulta todos los pedidos de tus clientes y revisa cuáles están pendientes o completados.',side:'top'}},
      {element:'#pendings', popover:{title:'Pendientes', description:'Gestiona los pedidos que aún no han sido completados y realiza el seguimiento correspondiente.',side:'top'}},
      {element:'#dashboard', popover:{title:'Productos más vendidos', description:'Visualiza los productos con mayor demanda y analiza cuáles son los más populares entre tus clientes.',side:'top'}},
      {element:'#dashboard-table', popover:{title:'Tabla de estadísticas', description:'Observa de forma gráfica la cantidad promedio de productos vendidos en tus pedidos.',side:'top'}},
    ],
    '/account/producer/management/product':[
      {element:'#nav-smy-mang', popover:{ title: 'Barra de navegación', description: 'Usa esta barra para moverte entre el resumen, la gestión de productos y tus fincas.', side:'bottom'}},
      {element:'#mat-tab-link-0', popover:{ title: 'Resumen', description: 'Consulta el estado de tus pedidos y accede fácilmente a la información de tu perfil.', side:'top'}},
      {element:'#mat-tab-link-1', popover:{ title: 'Gestión', description: 'Administra tus productos y fincas: edita, agrega o elimina lo que necesites con facilidad.', side:'top'}},
      {element:'#mat-tab-link-2', popover:{ title:'Productos', description:'En esta sección podrás gestionar tus productos.', side:'top'}},
      {element:'#mat-tab-link-3', popover:{ title:'Fincas', description:'En esta sección podrás gestionar tus fincas afilada', side:'top'}},
      {element:'#create-product', popover:{title: 'Crear Producto', description:'Haz clic aquí para crear un nuevo producto y publicarlo en tu catálogo, visible para los usuarios del portal.'}},
      {element:'#content-cards', popover:{title:'Panel de gestión', description:'Aquí verás todos los productos que has añadido. Desde este panel puedes gestionarlos fácilmente.', side:'bottom'}},
      {element:'#cards', popover:{title:'Listado de productos', description:'Cada tarjeta representa un producto. Desde aquí podrás revisar sus detalles y realizar acciones sobre ellos.'}},
      {element:'#edit-Btn', popover:{title:'Editar producto', description:'Modifica la información del producto: cambia su nombre, descripción, precio o imagen.', side:'top'}},
      {element:'#stock', popover:{title:'Actualizar stock', description:'Usa este botón para modificar la cantidad disponible de cada producto y mantener tu inventario actualizado.', side:'top'}},
      {element:'#delete-Btn', popover:{title:'Eliminar producto', description:'Elimina un producto de tu catálogo de manera rápida y segura. Se te pedirá confirmación antes de borrar.', side:'top'}}
    ],
    '/account/producer/management/farm':[
      {element:'#nav-smy-mang', popover:{ title: 'Barra de navegación', description: 'Usa esta barra para moverte entre el resumen, la gestión de productos y tus fincas.', side:'bottom'}},
      {element:'#mat-tab-link-0', popover:{ title: 'Resumen', description: 'Consulta el estado de tus pedidos y accede fácilmente a la información de tu perfil.', side:'top'}},
      {element:'#mat-tab-link-1', popover:{ title: 'Gestión', description: 'Administra tus productos y fincas: edita, agrega o elimina lo que necesites con facilidad.', side:'top'}},
      {element:'#mat-tab-link-2', popover:{ title:'Productos', description:'En esta sección podrás gestionar tus productos.', side:'top'}},
      {element:'#mat-tab-link-3', popover:{ title:'Fincas', description:'En esta sección podrás gestionar tus fincas afilada', side:'top'}},
      {element:'#create-farm', popover:{title: 'Crear Finca', description:'Haz clic aquí para crear un nuevo finca, visible para los usuarios del portal al entrar al perfíl del productor.'}},
      {element:'#cards', popover:{ title: 'listado de fincas', description: 'quí podrás visualizar todas tus fincas registradas y acceder rápidamente a su información general.'}},
      {element:'#edit-btn-farm', popover:{ title: 'Editar Finca', description: 'Haz clic para modificar los datos de la finca seleccionada, como su nombre, ubicación o características.'}},
      {element:'#delete-btn-farm', popover:{ title: 'Eliminar Finca', description: 'Permite eliminar una finca de tu listado. Esta acción es permanente. Se te pedirá confirmación antes de borrar.'}}
    ],
    '/account/become-producer':[
      {element:'#user-become-producer', popover:{ title:'Conviértete en Productor', description:'En esta sección podrás podrás ver las instrucciones para convertirte en productor y empezar a ofrecer productos '}},
      {element:'#Become-producer', popover:{ title:'Convertirme en Productor', description:'Este botón te llevará a un formulario para que puedas completarlos con los datos'}}
    
    ],
    '/account/orders':[
      {element:'#user-product-list', popover:{ title:'Mis Pedidos', description:'Aquí puedes ver todos los pedidos que has realizado, junto con su estado y detalles principales.'}},
      {element:'#list-user', popover:{ title:'Listado de pedidos', description:'Muestra el historial completo de tus pedidos, permitiéndote revisarlos.'}},
      {element:'#view-detail', popover:{ title:'Ver Detalle', description:'Haz clic para ver la información completa del pedido seleccionado, incluyendo productos, cantidades y estado.'}}
    
    ],
    '/home/product/profile/:id':[
      {element:'#profile', popover:{ title:'Perfil', description:'Aquí podrás ver la información principal del productor, incluyendo su nombre, ubicación y datos básicos.'}},
      {element:'#orders-complete', popover:{ title:'Pedidos completados', description:'Consulta todos los pedidos que este productor ha entregado. Útil para evaluar su nivel de actividad y compromiso.'}},
      {element:'#review', popover:{ title:'Calificación', description:'Revisa las valoraciones que otros usuarios han dejado sobre el productor y su calidad de servicio.'}},
      {element:'#description', popover:{ title:'Descripción', description:'Aquí encontrarás una descripción detallada del productor, su experiencia, trayectoria y tipo de productos que ofrece.'}},
      {element:'#farms', popover:{ title:'Fincas', description:'Explora las fincas asociadas al productor y conoce su ubicación, características y producción.'}},
      {element:'#products', popover:{ title:'Productos', description:'Explora las fincas asociadas al productor y conoce su ubicación, características y producción.'}},
      {element:'#social', popover:{ title:'Redes sociales', description:'Accede a las redes sociales del productor para conocer más sobre su trabajo y mantenerse en contacto.'}},
    ],
    '/account/producer/orders/:code': [
    {
      element: '#drv-order-number',
      popover: {
        title: 'Número del pedido',
        description: 'Aquí puedes ver el identificador único de este pedido.'
      }
    },
    {
      element: '#drv-summary',
      popover: {
        title: 'Resumen del pedido',
        description: 'Encuentra los detalles principales del pedido: producto, cantidad, subtotal y total.'
      }
    },
    {
      element: '#drv-delivery',
      popover: {
        title: 'Datos de entrega',
        description: 'Aquí verás la información del destinatario, teléfono y dirección.'
      }
    },
    {
      element: '#drv-times',
      popover: {
        title: 'Tiempos del pedido',
        description: 'En esta sección se muestran las fechas de creación y decisiones tomadas.'
      }
    },
    {
      element: '#drv-btn-reject',
      popover: {
        title: 'Rechazar pedido',
        description: 'Haz clic aquí si no puedes aceptar este pedido.'
      }
    },
    {
      element: '#drv-btn-accept',
      popover: {
        title: 'Aceptar pedido',
        description: 'Presiona este botón para aceptar el pedido y continuar el proceso.'
      }
    },
    {
      element: '#drv-btn-back',
      popover: {
        title: 'Volver atrás',
        description: 'Regresa a la lista de pedidos usando este botón.'
      }
    },
    {
      element: '#drv-btn-chat',
      popover: {
        title: 'Chat con el consumidor',
        description: 'Haz clic para abrir el chat y comunicarte directamente con el consumidor (el chat se activara al confirmar el comprobante).'
      }
    }
  ]

  };

  // Obtiene los pasos del tour según la ruta actual
  private getSteps(): DriveStep[] | null {
    const currentUrl = this.router.url.split('?')[0];
    let steps = this.tours[currentUrl];

    if (!steps && currentUrl.startsWith('/account/orders/')) {
      steps = this.tours['/account/orders/:code'];
    }

    if (!steps && currentUrl.startsWith('/home/product/profile/')) {
      steps = this.tours['/home/product/profile/:id'];
    }
    if (!steps && currentUrl.startsWith('/account/producer/orders/')) {
    steps = this.tours['/account/producer/orders/:code'];
    }
    return steps || null;
  }


  startTour(steps?: DriveStep[]) {
    const tourSteps = steps || this.getSteps();
    if (!tourSteps || !tourSteps.length) {
      console.warn(' No hay pasos definidos para el tour.');
      return;
    }

    this.driverInstance = driver({
      showProgress: true,
      progressText: '{{current}} de {{total}}',
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Finalizar',
      steps: tourSteps,
    });

    this.driverInstance.drive();
  }
}
