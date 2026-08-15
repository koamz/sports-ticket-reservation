import { ReservationService } from '../services/reservationService.js';

export const ReservationController = {
  async reserve(req, res) {
    try {
      const { ticketId } = req.body;
      const result = await ReservationService.reserve(req.user.id, ticketId);
      res.status(201).json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  async pay(req, res) {
    try {
      const { reservationId } = req.body;
      const result = await ReservationService.pay(req.user.id, reservationId);
      res.status(200).json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  async checkPenalty(req, res) {
    try {
      // این متد می‌تواند زمان مسابقه را از دیتابیس یا سرویس رزرو دریافت کند
      // به عنوان نمونه ساختار پاسخ جریمه:
      res.status(200).json({ message: 'Use cancel endpoint to check penalty dynamically.' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async cancel(req, res) {
    try {
      const { reservationId } = req.body;
      const result = await ReservationService.cancelAndRefund(req.user.id, reservationId);
      res.status(200).json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  async getBookings(req, res) {
    try {
      // پیاده‌سازی دریافت تاریخچه رزروها از طریق لایه ریپازیتوری یا سرویس
      res.status(200).json({ message: 'Bookings list endpoint.' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async adminGetReservations(req, res) {
    try {
      res.status(200).json({ message: 'Admin reservations list.' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async adminUpdateReservation(req, res) {
    try {
      res.status(200).json({ message: 'Reservation updated by admin.' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
};