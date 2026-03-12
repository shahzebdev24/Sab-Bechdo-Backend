import * as offersRepository from './offers.repository.js';
import * as adsRepository from '../ads/ads.repository.js';
import * as chatService from '../chat/chat.service.js';
import * as notificationsService from '../notifications/notifications.service.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '@core/errors/app-error.js';
import { OfferDocument, OFFER_STATUS } from '@models/offer.model.js';
import { CreateOfferDto, UpdateOfferStatusDto, ListOffersQueryDto } from './offers.validation.js';

export const createOffer = async (
  dto: CreateOfferDto,
  fromUserId: string
): Promise<OfferDocument> => {
  const { adId, amount, message } = dto;

  // Load ad to get owner
  const ad = await adsRepository.findById(adId);
  if (!ad) {
    throw new NotFoundError('Ad not found');
  }

  const toUserId = ad.owner._id?.toString() || ad.owner.toString();

  // Prevent offers on own ads
  if (fromUserId === toUserId) {
    throw new BadRequestError('You cannot make an offer on your own ad');
  }

  // Prevent offers on sold/archived ads
  if (ad.status === 'sold' || ad.status === 'archived') {
    throw new BadRequestError('Cannot make offers on sold or archived ads');
  }

  // Create offer
  const offer = await offersRepository.create({
    adId,
    fromUserId,
    toUserId,
    amount,
    currency: ad.currency,
    message,
  });

  // Create notification for ad owner
  await notificationsService.createNotification(
    toUserId,
    'offer',
    'New offer on your ad',
    `Someone offered ${ad.currency} ${amount} for "${ad.title}"`,
    { adId, offerId: offer._id.toString(), amount }
  );

  // Optionally create/get conversation and add system message
  try {
    await chatService.createOrGetConversation(fromUserId, {
      sellerId: toUserId,
      adId,
    });
  } catch (error) {
    // Silently fail if conversation creation fails
  }

  return offer;
};

export const listSentOffers = async (
  userId: string,
  query: ListOffersQueryDto
): Promise<{
  offers: OfferDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const { page, limit } = query;
  const { offers, total } = await offersRepository.findSentOffers(userId, page, limit);

  return {
    offers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const listReceivedOffers = async (
  userId: string,
  query: ListOffersQueryDto
): Promise<{
  offers: OfferDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const { page, limit } = query;
  const { offers, total } = await offersRepository.findReceivedOffers(userId, page, limit);

  return {
    offers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const listOffersByAd = async (
  adId: string,
  userId: string,
  query: ListOffersQueryDto
): Promise<{
  offers: OfferDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  // Verify user owns the ad
  const ad = await adsRepository.findById(adId);
  if (!ad) {
    throw new NotFoundError('Ad not found');
  }

  const ownerId = ad.owner._id?.toString() || ad.owner.toString();
  if (ownerId !== userId) {
    throw new ForbiddenError('You can only view offers on your own ads');
  }

  const { page, limit } = query;
  const { offers, total } = await offersRepository.findOffersByAd(adId, userId, page, limit);

  return {
    offers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const updateOfferStatus = async (
  offerId: string,
  userId: string,
  dto: UpdateOfferStatusDto
): Promise<OfferDocument> => {
  const { status } = dto;

  const offer = await offersRepository.findById(offerId);
  if (!offer) {
    throw new NotFoundError('Offer not found');
  }

  // Check if offer is still pending
  if (offer.status !== OFFER_STATUS.PENDING) {
    throw new BadRequestError('Can only update pending offers');
  }

  const fromUserId = offer.fromUser._id?.toString() || offer.fromUser.toString();
  const toUserId = offer.toUser._id?.toString() || offer.toUser.toString();

  // Authorization rules
  if (status === OFFER_STATUS.CANCELLED) {
    // Only fromUser can cancel
    if (userId !== fromUserId) {
      throw new ForbiddenError('Only the offer sender can cancel');
    }
  } else if (status === OFFER_STATUS.ACCEPTED || status === OFFER_STATUS.REJECTED) {
    // Only toUser can accept/reject
    if (userId !== toUserId) {
      throw new ForbiddenError('Only the ad owner can accept or reject offers');
    }
  }

  // Update status
  const updatedOffer = await offersRepository.updateStatus(offerId, status);
  if (!updatedOffer) {
    throw new NotFoundError('Offer not found');
  }

  // Send notification to the other party
  const notifyUserId = userId === fromUserId ? toUserId : fromUserId;
  const statusMessages = {
    accepted: 'Your offer was accepted!',
    rejected: 'Your offer was rejected',
    cancelled: 'Offer was cancelled',
  };

  await notificationsService.createNotification(
    notifyUserId,
    'offer',
    'Offer status updated',
    statusMessages[status],
    { offerId, status, adId: offer.ad.toString() }
  );

  return updatedOffer;
};
