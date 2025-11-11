export interface NotificationListItem {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createAt: string;
  relatedType?: string | null;
  relatedRoute?: string | null;
}

export interface CreateNotificationRequest {
  userId: number;
  title: string;
  message: string;
  relatedType?: string | null;
  relatedRoute?: string | null;
}
