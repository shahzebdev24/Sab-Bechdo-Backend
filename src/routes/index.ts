import { Router } from 'express';
import authRoutes from '@modules/auth/auth.routes.js';
import usersRoutes from '@modules/users/users.routes.js';
import adsRoutes from '@modules/ads/ads.routes.js';
import mediaRoutes from '@modules/media/media.routes.js';
import wishlistRoutes from '@modules/wishlist/wishlist.routes.js';
import reviewsRoutes from '@modules/reviews/reviews.routes.js';
import engagementRoutes from '@modules/engagement/engagement.routes.js';
import notificationsRoutes from '@modules/notifications/notifications.routes.js';
import chatRoutes from '@modules/chat/chat.routes.js';
import offersRoutes from '@modules/offers/offers.routes.js';
import adminRoutes from '@modules/admin/admin.routes.js';
import categoriesRoutes from '@modules/categories/categories.routes.js';
import healthRoutes from '../health/health.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/ads', adsRoutes);
router.use('/media', mediaRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/engagement', engagementRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/chat', chatRoutes);
router.use('/offers', offersRoutes);
router.use('/admin', adminRoutes);
router.use('/categories', categoriesRoutes);
router.use('/', healthRoutes);

export default router;
