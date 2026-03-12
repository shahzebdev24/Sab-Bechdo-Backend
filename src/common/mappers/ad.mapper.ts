import { AdDocument } from '@models/ad.model.js';

export interface AdResponse {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  condition: string;
  owner: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    username?: string;
  };
  photoUrls: string[];
  videoUrl?: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };
  status: string;
  views: number;
  isFavorite?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AdMapper {
  static toResponse(ad: AdDocument, isFavorite?: boolean): AdResponse {
    return {
      id: ad._id.toString(),
      title: ad.title,
      description: ad.description,
      price: ad.price,
      currency: ad.currency,
      category: ad.category,
      condition: ad.condition,
      owner: {
        id: ad.owner._id?.toString() || ad.owner.toString(),
        name: (ad.owner as any).name || '',
        email: (ad.owner as any).email || '',
        avatarUrl: (ad.owner as any).avatarUrl,
        username: (ad.owner as any).username,
      },
      photoUrls: ad.photoUrls,
      videoUrl: ad.videoUrl,
      location: ad.location,
      status: ad.status,
      views: ad.views,
      isFavorite,
      createdAt: ad.createdAt,
      updatedAt: ad.updatedAt,
    };
  }
}
