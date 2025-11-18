import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import Swal from 'sweetalert2';

import { OrderService } from '../../../products/services/order/order.service';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { StatusTranslatePipe } from '../../../../shared/pipes/StatusTranslatePipe/status-translate-pipe.pipe';
import { FormsModule } from '@angular/forms';
import { ConsumerRatingCreateModel } from '../../../products/models/consumerRating/consumerRating.model';
import { OrderDetailModel } from '../../../products/models/order/order.model';

@Component({
  selector: 'app-producer-order-detail',
  imports: [CommonModule, ButtonComponent, StatusTranslatePipe, FormsModule],
  templateUrl: './producer-order-detail.component.html',
  styleUrl: './producer-order-detail.component.css',
})
export class ProducerOrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordersSrv = inject(OrderService);

  code!: string;
  detail?: OrderDetailModel;
  loading = true;

  // ======= Rating del cliente =======
  stars = [1, 2, 3, 4, 5];
  rating = 0;
  comment = '';
  savingRating = false;

  ngOnInit(): void {
    this.code = String(this.route.snapshot.paramMap.get('code'));
    if (!this.code) {
      this.router.navigateByUrl('/account/producer/orders');
      return;
    }
    this.loadDetail();
  }

  loadDetail(): void {
    this.loading = true;
    this.ordersSrv
      .getDetailForProducer(this.code)
      .pipe(take(1))
      .subscribe({
        next: (d) => {
          this.detail = d;

          // Si ya hay calificación, inicializa rating y comentario
          if (d.consumerRating) {
            this.rating = d.consumerRating.rating;
            this.comment = d.consumerRating.comment ?? '';
          } else {
            this.rating = 0;
            this.comment = '';
          }

          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          Swal.fire(
            'Error',
            err?.error?.message ?? 'No se pudo cargar el pedido.',
            'error'
          );
        },
      });
  }

  // ======= Habilitadores de acciones por estado =======
  get canAcceptReject(): boolean {
    return this.detail?.status === 'PendingReview';
  }
  get canMarkPreparing(): boolean {
    return this.detail?.status === 'PaymentSubmitted';
  }
  get canMarkDispatched(): boolean {
    return this.detail?.status === 'Preparing';
  }
  get canMarkDelivered(): boolean {
    return this.detail?.status === 'Dispatched';
  }

  // ======= Rating: helpers =======
  get isAlreadyRated(): boolean {
    return !!this.detail?.consumerRating;
  }

  setRating(value: number): void {
    if (this.savingRating) return;
    this.rating = value;
  }

  onRateCustomer(): void {
    if (!this.detail) return;

    if (this.detail.status !== 'Completed') {
      Swal.fire(
        'No permitido',
        'Solo puedes calificar cuando la orden está completada.',
        'info'
      );
      return;
    }

    if (this.rating < 1 || this.rating > 5) {
      Swal.fire(
        'Calificación inválida',
        'Selecciona una calificación entre 1 y 5.',
        'warning'
      );
      return;
    }

    const body: ConsumerRatingCreateModel = {
      rating: this.rating,
      comment: this.comment?.trim() || null,
      rowVersion: this.detail.rowVersion,
    };

    this.savingRating = true;

    Swal.fire({
      title: 'Guardando...',
      text: 'Registrando la calificación del cliente.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    this.ordersSrv
      .rateCustomer(this.code, body)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.savingRating = false;
          Swal.close();

          // Actualiza la calificación en el detalle con lo que devuelve el backend
          if (this.detail) {
            this.detail.consumerRating = res.data;
          }

          Swal.fire(
            'Calificación registrada',
            'La calificación del cliente se guardó correctamente.',
            'success'
          );
        },
        error: (err) => {
          this.savingRating = false;
          Swal.close();
          Swal.fire(
            'Error',
            err?.error?.message ?? 'No se pudo registrar la calificación.',
            'error'
          );
        },
      });
  }

  // ======= Chip de estado (clases CSS) =======
  chipClass(
    status: string
  ):
    | 'pending'
    | 'accepted'
    | 'progress'
    | 'completed'
    | 'rejected'
    | 'disputed' {
    const s = (status || '').toLowerCase();

    if (s === 'pendingreview' || s === 'deliveredpendingbuyerconfirm')
      return 'pending';

    if (
      s === 'acceptedawaitingpayment' ||
      s === 'paymentsubmitted' ||
      s === 'preparing' ||
      s === 'dispatched'
    ) return 'progress';

    if (s === 'completed') return 'completed';
    if (s === 'rejected' || s === 'expired' || s === 'cancelledbyuser')
      return 'rejected';
    if (s === 'disputed') return 'disputed';

    return 'accepted';
  }

  openReceipt(): void {
    const url = this.detail?.paymentImageUrl;
    if (url) window.open(url, '_blank');
  }

  // ======= Acciones =======
  async accept(): Promise<void> {
    if (!this.detail) return;

    const { value: notes, isConfirmed } = await Swal.fire({
      title: 'Aceptar pedido',
      input: 'textarea',
      inputLabel: 'Notas al cliente (opcional)',
      inputPlaceholder: 'Escribe notas internas o para el cliente…',
      inputAttributes: { 'aria-label': 'Notas' },
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
      preConfirm: (v) => (v ? String(v).trim() : ''),
    });

    if (!isConfirmed) return;

    Swal.fire({
      title: 'Procesando...',
      text: 'Aceptando el pedido.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    this.ordersSrv
      .acceptOrder(this.code, {
        notes: notes || undefined,
        rowVersion: this.detail.rowVersion,
      })
      .pipe(take(1))
      .subscribe({
        next: async () => {
          Swal.close();
          await Swal.fire('OK', 'Pedido aceptado.', 'success');
          this.loadDetail();
        },
        error: (err) => {
          Swal.close();
          const msg = err?.error?.message || 'No se pudo aceptar.';
          Swal.fire('Error', msg, 'error');
        },
      });
  }

  async reject(): Promise<void> {
    if (!this.detail) return;

    const { value: reason, isConfirmed } = await Swal.fire<string>({
      title: 'Rechazar pedido',
      input: 'textarea',
      inputLabel: 'Motivo (requerido)',
      inputPlaceholder: 'Explica por qué se rechaza…',
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      inputValidator: (v) => {
        const txt = (v ?? '').toString().trim();
        if (txt.length < 5)
          return 'El motivo debe tener al menos 5 caracteres.';
        return undefined;
      },
    });

    if (!isConfirmed || !reason) return;

    Swal.fire({
      title: 'Procesando...',
      text: 'Rechazando el pedido.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    this.ordersSrv
      .rejectOrder(this.code, {
        reason,
        rowVersion: this.detail.rowVersion,
      })
      .pipe(take(1))
      .subscribe({
        next: async () => {
          Swal.close();
          await Swal.fire('OK', 'Pedido rechazado.', 'success');
          this.loadDetail();
        },
        error: (err) => {
          Swal.close();
          const msg = err?.error?.message || 'No se pudo rechazar.';
          Swal.fire('Error', msg, 'error');
        },
      });
  }

  markPreparing(): void {
    if (!this.detail) return;

    Swal.fire({
      title: 'Actualizando...',
      text: 'Marcando la orden como en preparación.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    this.ordersSrv
      .markPreparing(this.code, this.detail.rowVersion)
      .pipe(take(1))
      .subscribe({
        next: async () => {
          Swal.close();
          await Swal.fire('OK', 'Orden en preparación.', 'success');
          this.loadDetail();
        },
        error: (err) => {
          Swal.close();
          Swal.fire(
            'Error',
            err?.error?.message ?? 'No se pudo marcar.',
            'error'
          );
        },
      });
  }

  markDispatched(): void {
    if (!this.detail) return;

    Swal.fire({
      title: 'Actualizando...',
      text: 'Marcando la orden como despachada.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    this.ordersSrv
      .markDispatched(this.code, this.detail.rowVersion)
      .pipe(take(1))
      .subscribe({
        next: async () => {
          Swal.close();
          await Swal.fire('OK', 'Orden despachada.', 'success');
          this.loadDetail();
        },
        error: (err) => {
          Swal.close();
          Swal.fire(
            'Error',
            err?.error?.message ?? 'No se pudo marcar.',
            'error'
          );
        },
      });
  }

  markDelivered(): void {
    if (!this.detail) return;

    Swal.fire({
      title: 'Actualizando...',
      text: 'Marcando la orden como entregada...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    this.ordersSrv
      .markDelivered(this.code, this.detail.rowVersion)
      .pipe(take(1))
      .subscribe({
        next: async () => {
          Swal.close();
          await Swal.fire(
            'OK',
            'Orden entregada (pendiente de confirmación del cliente).',
            'success'
          );
          this.loadDetail();
        },
        error: (err) => {
          Swal.close();
          Swal.fire(
            'Error',
            err?.error?.message ?? 'No se pudo marcar.',
            'error'
          );
        },
      });
  }
}
