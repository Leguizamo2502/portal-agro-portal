import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import Swal from 'sweetalert2';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { StatusTranslatePipe } from '../../../../shared/pipes/StatusTranslatePipe/status-translate-pipe.pipe';
import { OrderService } from '../../../products/services/order/order.service';
import { ConsumerRatingCreateModel } from '../../../products/models/consumerRating/consumerRating.model';
import { OrderDetailModel } from '../../../products/models/order/order.model';
import { OrderChatComponent } from '../../../../shared/components/order-chat/order-chat.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-producer-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    StatusTranslatePipe,
    FormsModule,
    OrderChatComponent,
    MatIconModule,
  ],
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

  // ======= UI: chat flotante =======
  showChat = false;

  ngOnInit(): void {
    this.code = String(this.route.snapshot.paramMap.get('code'));
    if (!this.code) {
      this.router.navigateByUrl('/account/producer/orders');
      return;
    }
    this.loadDetail();
  }

  // ================== Carga de detalle ==================
  loadDetail(): void {
    this.loading = true;

    this.ordersSrv
      .getDetailForProducer(this.code)
      .pipe(take(1))
      .subscribe({
        next: (d) => {
          this.detail = d;
          this.resetRatingFromDetail();
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.showError(
            err?.error?.message ?? 'No se pudo cargar el pedido.'
          );
        },
      });
  }

  private resetRatingFromDetail(): void {
    if (!this.detail?.consumerRating) {
      this.rating = 0;
      this.comment = '';
      return;
    }

    this.rating = this.detail.consumerRating.rating;
    this.comment = this.detail.consumerRating.comment ?? '';
  }

  // ================== Helpers SweetAlert ==================
  private showLoading(title: string, text: string): void {
    Swal.fire({
      title,
      text,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
  }

  private async showSuccess(message: string): Promise<void> {
    await Swal.fire('OK', message, 'success');
  }

  private showError(message: string): void {
    Swal.fire('Error', message, 'error');
  }

  // ================== Habilitadores por estado ==================
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

  // ================== Rating: helpers ==================
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
      this.showError('Solo puedes calificar cuando la orden está completada.');
      return;
    }

    if (this.rating < 1 || this.rating > 5) {
      this.showError('Selecciona una calificación entre 1 y 5.');
      return;
    }

    const body: ConsumerRatingCreateModel = {
      rating: this.rating,
      comment: this.comment?.trim() || null,
      rowVersion: this.detail.rowVersion,
    };

    this.savingRating = true;
    this.showLoading(
      'Guardando...',
      'Registrando la calificación del cliente.'
    );

    this.ordersSrv
      .rateCustomer(this.code, body)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.savingRating = false;
          Swal.close();

          if (this.detail) {
            this.detail.consumerRating = res.data;
          }

          this.showSuccess(
            'La calificación del cliente se guardó correctamente.'
          );
        },
        error: (err) => {
          this.savingRating = false;
          Swal.close();
          this.showError(
            err?.error?.message ?? 'No se pudo registrar la calificación.'
          );
        },
      });
  }

  // ================== Chip de estado ==================
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
    )
      return 'progress';

    if (s === 'completed') return 'completed';
    if (s === 'rejected' || s === 'expired' || s === 'cancelledbyuser')
      return 'rejected';
    if (s === 'disputed') return 'disputed';

    return 'accepted';
  }

  // ================== Utilidades ==================
  openReceipt(): void {
    const url = this.detail?.paymentImageUrl;
    if (url) window.open(url, '_blank');
  }

  // ================== Acciones de estado ==================
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

    this.showLoading('Procesando...', 'Aceptando el pedido.');

    this.ordersSrv
      .acceptOrder(this.code, {
        notes: notes || undefined,
        rowVersion: this.detail.rowVersion,
      })
      .pipe(take(1))
      .subscribe({
        next: async () => {
          Swal.close();
          await this.showSuccess('Pedido aceptado.');
          this.loadDetail();
        },
        error: (err) => {
          Swal.close();
          const msg = err?.error?.message || 'No se pudo aceptar.';
          this.showError(msg);
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

    this.showLoading('Procesando...', 'Rechazando el pedido.');

    this.ordersSrv
      .rejectOrder(this.code, {
        reason,
        rowVersion: this.detail.rowVersion,
      })
      .pipe(take(1))
      .subscribe({
        next: async () => {
          Swal.close();
          await this.showSuccess('Pedido rechazado.');
          this.loadDetail();
        },
        error: (err) => {
          Swal.close();
          const msg = err?.error?.message || 'No se pudo rechazar.';
          this.showError(msg);
        },
      });
  }

  markPreparing(): void {
    if (!this.detail) return;

    this.showLoading(
      'Actualizando...',
      'Marcando la orden como en preparación.'
    );

    this.ordersSrv
      .markPreparing(this.code, this.detail.rowVersion)
      .pipe(take(1))
      .subscribe({
        next: async () => {
          Swal.close();
          await this.showSuccess('Orden en preparación.');
          this.loadDetail();
        },
        error: (err) => {
          Swal.close();
          this.showError(
            err?.error?.message ?? 'No se pudo marcar la orden.'
          );
        },
      });
  }

  markDispatched(): void {
    if (!this.detail) return;

    this.showLoading(
      'Actualizando...',
      'Marcando la orden como despachada.'
    );

    this.ordersSrv
      .markDispatched(this.code, this.detail.rowVersion)
      .pipe(take(1))
      .subscribe({
        next: async () => {
          Swal.close();
          await this.showSuccess('Orden despachada.');
          this.loadDetail();
        },
        error: (err) => {
          Swal.close();
          this.showError(
            err?.error?.message ?? 'No se pudo marcar la orden.'
          );
        },
      });
  }

  markDelivered(): void {
    if (!this.detail) return;

    this.showLoading(
      'Actualizando...',
      'Marcando la orden como entregada...'
    );

    this.ordersSrv
      .markDelivered(this.code, this.detail.rowVersion)
      .pipe(take(1))
      .subscribe({
        next: async () => {
          Swal.close();
          await this.showSuccess(
            'Orden entregada (pendiente de confirmación del cliente).'
          );
          this.loadDetail();
        },
        error: (err) => {
          Swal.close();
          this.showError(
            err?.error?.message ?? 'No se pudo marcar la orden.'
          );
        },
      });
  }

  // ================== Chat flotante ==================
  toggleChat(): void {
    this.showChat = !this.showChat;
  }
}
