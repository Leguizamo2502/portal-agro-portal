// src/app/features/admin/dashboard/models/admin-dashboard.model.ts

export interface OrderStatusBucket {
  status: string;
  count: number;
}

export interface OrderFunnel {
  totalOrders: number;
  buckets: OrderStatusBucket[];
}

export interface PaymentSummary {
  pendingAcceptance: number;
  awaitingPaymentProof: number;
  paymentProofPendingReview: number;
  readyForDelivery: number;
  completedWithProof: number;
}

export interface CatalogSummary {
  activeProducers: number;
  totalProducts: number;
  publishedProducts: number;
  lowStockProducts: number;
  categories: number;
  favorites: number;
}

export interface TopProducerStat {
  producerId: number;
  producerName: string;
  completedOrders: number;
  totalRevenue: number;
}

export interface TopProductStat {
  productId: number;
  productName: string;
  completedOrders: number;
  totalUnits: number;
  totalRevenue: number;
}

export interface AdminDashboard {
  orderFunnel: OrderFunnel;
  payments: PaymentSummary;
  catalog: CatalogSummary;
  topProducers: TopProducerStat[];
  topProducts: TopProductStat[];
}
