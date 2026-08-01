import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { TicketController } from '../controllers/ticketController.js';
import { ReservationController } from '../controllers/reservationController.js';
import { ReportController } from '../controllers/reportController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { ElasticsearchService } from '../services/elasticsearchService.js'; // اضافه کردن الاستیک

const router = Router();

// اندپوینت پیشنهادات هوشمند الاستیک‌سرچ (Autocomplete)
router.get('/tickets/autocomplete', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(200).json([]);
    const suggestions = await ElasticsearchService.autocomplete(q);
    res.status(200).json(suggestions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// مابقی روت‌های قبلی بدون دستکاری مجدداً اعمال می‌شوند...
router.post('/auth/otp/request', UserController.requestOTP);
router.post('/auth/otp/verify', UserController.verifyOTP);
router.post('/auth/signup', UserController.signup);
router.get('/common/cities-venues', UserController.getCitiesAndVenues);
router.get('/tickets/search', TicketController.search);
router.get('/tickets/:id', TicketController.getDetails);
router.get('/user/profile', authenticateToken, UserController.getProfile);
router.put('/user/profile', authenticateToken, UserController.updateProfile);
router.post('/reservations/reserve', authenticateToken, ReservationController.reserve);
router.post('/reservations/pay', authenticateToken, ReservationController.pay);
router.get('/reservations/:id/penalty', authenticateToken, ReservationController.checkPenalty);
router.post('/reservations/cancel', authenticateToken, ReservationController.cancel);
router.get('/user/bookings', authenticateToken, ReservationController.getBookings);
router.post('/reports/submit', authenticateToken, ReportController.create);
router.get('/admin/reservations', authenticateToken, requireRole('support'), ReservationController.adminGetReservations);
router.put('/admin/reservations', authenticateToken, requireRole('support'), ReservationController.adminUpdateReservation);
router.get('/admin/reports', authenticateToken, requireRole('support'), ReportController.adminGetReports);
router.put('/admin/reports', authenticateToken, requireRole('support'), ReportController.adminUpdateReport);

export default router;