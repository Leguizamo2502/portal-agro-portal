import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  OrderChatMessageDto,
  OrderChatMessagesPageDto,
} from '../../models/chat/chat.model';
import { OrderChatService } from '../../services/orderChat/order-chat.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-order-chat',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './order-chat.component.html',
  styleUrl: './order-chat.component.css',
})
export class OrderChatComponent implements OnInit, OnDestroy {
  @Input({ required: true }) orderCode!: string;

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  loading = false;
  sending = false;
  error?: string;

  messages: OrderChatMessageDto[] = [];
  hasMore = false;
  total = 0;

  // Paginación simple
  private pageSize = 50;
  private skip = 0;

  newMessage = '';

  // ====== Estado del chat desde backend ======
  isChatEnabled = false;
  isChatClosed = false;
  canSendMessages = false;
  chatDisabledReason?: string | null;
  chatClosedReason?: string | null;
  chatEnabledAt?: string | null;
  chatClosedAt?: string | null;

  constructor(private chatSrv: OrderChatService) {}

  ngOnInit(): void {
    this.loadInitial();
  }

  ngOnDestroy(): void {
    if (this.orderCode) {
      this.chatSrv.stopConnection(this.orderCode).catch(() => {});
    }
  }

  // ================== Carga inicial ==================
  private loadInitial(): void {
    this.loading = true;
    this.error = undefined;

    this.chatSrv
      .getMessages(this.orderCode, this.skip, this.pageSize)
      .subscribe({
        next: (page: OrderChatMessagesPageDto) => {
          this.applyPage(page);
          this.loading = false;

          // Conectar solo si el chat está habilitado y no cerrado
          if (this.isChatEnabled && !this.isChatClosed) {
            this.setupSignalR();
          }

          setTimeout(() => this.scrollToBottom(), 0);
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message ?? 'No se pudo cargar el chat.';
        },
      });
  }

  private applyPage(page: OrderChatMessagesPageDto): void {
    this.messages = page.messages ?? [];
    this.total = page.total;
    this.hasMore = page.hasMore;
    this.skip = this.messages.length;

    this.isChatEnabled = page.isChatEnabled;
    this.isChatClosed = page.isChatClosed;
    this.canSendMessages = page.canSendMessages;
    this.chatDisabledReason = page.chatDisabledReason;
    this.chatClosedReason = page.chatClosedReason;
    this.chatEnabledAt = page.chatEnabledAt || undefined;
    this.chatClosedAt = page.chatClosedAt || undefined;
  }

  private setupSignalR(): void {
    this.chatSrv
      .startConnection(this.orderCode, (message) =>
        this.onRealtimeMessage(message)
      )
      .catch((err) => {
        console.error('No se pudo iniciar la conexión de chat', err);
      });
  }

  private onRealtimeMessage(message: OrderChatMessageDto): void {
    const exists = this.messages.some((m) => m.id === message.id);
    if (!exists) {
      this.messages.push(message);
      this.total++;

      setTimeout(() => this.scrollToBottom(), 0);
    }
  }

  loadMore(): void {
    if (!this.hasMore || this.loading) {
      return;
    }

    this.loading = true;

    this.chatSrv
      .getMessages(this.orderCode, this.skip, this.pageSize)
      .subscribe({
        next: (page) => {
          this.messages = this.messages.concat(page.messages ?? []);
          this.total = page.total;
          this.hasMore = page.hasMore;
          this.skip = this.messages.length;

          // Por si el estado cambió
          this.isChatEnabled = page.isChatEnabled;
          this.isChatClosed = page.isChatClosed;
          this.canSendMessages = page.canSendMessages;
          this.chatDisabledReason = page.chatDisabledReason;
          this.chatClosedReason = page.chatClosedReason;
          this.chatEnabledAt = page.chatEnabledAt || undefined;
          this.chatClosedAt = page.chatClosedAt || undefined;

          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.error =
            err?.error?.message ?? 'No se pudieron cargar más mensajes.';
        },
      });
  }

  // ================== Envío ==================
  send(): void {
  const text = this.newMessage.trim();
  if (!text || this.sending) {
    return;
  }

  this.sending = true;
  this.error = undefined;

  // guardo el texto por si hay error
  const pendingText = this.newMessage;

  this.chatSrv.sendMessage(this.orderCode, { message: text }).subscribe({
    next: () => {
      // NO agregamos el mensaje aquí.
      // Solo limpiamos el input y dejamos que SignalR lo inserte.
      this.newMessage = '';
      this.sending = false;
      // el mensaje llegará por onRealtimeMessage(...)
    },
    error: (err) => {
      this.sending = false;
      this.error =
        err?.error?.message ??
        'No se pudo enviar el mensaje. Intenta nuevamente.';

      // si quieres, dejas el texto escrito para reintentar
      this.newMessage = pendingText;
    },
  });
}

  trackById(_: number, item: OrderChatMessageDto): number {
    return item.id;
  }

  onEnter(ev: Event): void {
    const e = ev as KeyboardEvent;

    if (e.shiftKey) {
      return;
    }

    e.preventDefault();
    this.send();
  }

  private scrollToBottom(): void {
    if (!this.scrollContainer) return;

    const native = this.scrollContainer.nativeElement;
    native.scrollTop = native.scrollHeight;
  }
}
