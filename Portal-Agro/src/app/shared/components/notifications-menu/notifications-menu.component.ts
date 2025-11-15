import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { NotificationListItemDto } from '../../models/notifications/notification.model';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notifications-menu',
  imports: [MatIconModule, MatMenuModule, MatButtonModule,
    MatBadgeModule, MatDividerModule, MatProgressSpinnerModule,RouterLink,CommonModule],
  templateUrl: './notifications-menu.component.html',
  styleUrl: './notifications-menu.component.css'
})
export class NotificationsMenuComponent implements OnChanges {
  @Input() items: NotificationListItemDto[] = [];       // lista a mostrar
  @Input() loading = false;                              // spinner en menú
  @Input() pageUrl = '/account/notifications';           // “Ver todas”
  @Input() showMarkAll = true;

  @Output() opened = new EventEmitter<void>();           // para que cargues /unread
  @Output() markAll = new EventEmitter<void>();          // para que pegues /read-all
  @Output() openItem = new EventEmitter<NotificationListItemDto>(); // click item
  @Output() markRead = new EventEmitter<NotificationListItemDto>(); // solo marcar leído

  unreadCount = 0;

  ngOnChanges(): void {
    this.unreadCount = this.items.filter(n => !n.isRead).length;
  }

  timeAgo(value?: string): string {
    if (!value) return '';
    const diff = (Date.now() - new Date(value).getTime()) / 1000;
    if (diff < 60) return 'hace segundos';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    return `hace ${Math.floor(diff / 86400)} d`;
  }

  onOpenMenu(): void { this.opened.emit(); }
  onOpenItem(n: NotificationListItemDto): void { this.openItem.emit(n); }
  onMarkRead(n: NotificationListItemDto): void { this.markRead.emit(n); }
  onMarkAll(): void { this.markAll.emit(); }
}
