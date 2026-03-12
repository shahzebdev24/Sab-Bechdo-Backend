import { ReviewDocument } from '@models/review.model.js';

export interface ReviewResponse {
  id: string;
  seller: string;
  buyer: {
    id: string;
    name: string;
    avatarUrl?: string;
    username?: string;
  };
  ad: {
    id: string;
    title: string;
    photoUrls: string[];
  };
  rating: number;
  comment?: string;
  createdAt: Date;
}

export class ReviewMapper {
  static toResponse(review: ReviewDocument): ReviewResponse {
    return {
      id: review._id.toString(),
      seller: review.seller.toString(),
      buyer: {
        id: (review.buyer as any)._id?.toString() || review.buyer.toString(),
        name: (review.buyer as any).name || '',
        avatarUrl: (review.buyer as any).avatarUrl,
        username: (review.buyer as any).username,
      },
      ad: {
        id: (review.ad as any)._id?.toString() || review.ad.toString(),
        title: (review.ad as any).title || '',
        photoUrls: (review.ad as any).photoUrls || [],
      },
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    };
  }
}
