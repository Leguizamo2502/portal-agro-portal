export interface ConsumerRatingModel {
  id: number;
  orderId: number;
  producerId: number;
  userId: number;
  rating: number;
  comment?: string | null;
  createAt: string;
  customerFullName: string;
  customerEmail: string;
}

export interface ConsumerRatingStatsModel {
  averageRating: number | null;
  ratingsCount: number;
}

export interface ConsumerRatingCreateModel {
  rating: number;
  comment?: string | null;
  rowVersion: string;
}