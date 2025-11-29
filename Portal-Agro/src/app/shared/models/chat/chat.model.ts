// src/app/features/orders/models/order-chat.model.ts
export interface OrderChatMessageDto {
  id: number;
  message: string;
  sentAtUtc: string;
  senderUserId: number;
  senderType: string;
  isSystem: boolean;
  isMine: boolean;
}

export interface OrderChatMessagesPageDto {
  orderId: number;
  orderCode: string;
  conversationId: number;
  total: number;
  hasMore: boolean;

  // NUEVOS CAMPOS DE ESTADO DEL CHAT
  isChatEnabled: boolean;
  isChatClosed: boolean;
  canSendMessages: boolean;
  chatDisabledReason?: string | null;
  chatClosedReason?: string | null;
  chatEnabledAt?: string | null;
  chatClosedAt?: string | null;

  messages: OrderChatMessageDto[];
}

export interface OrderChatMessageCreateDto {
  message: string;
}
