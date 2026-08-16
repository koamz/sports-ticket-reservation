import { ReservationService } from '../services/reservationService.js';

export const ReservationController = {
  async reserve(req, res) {
    try {
      const { ticketId } = req.body;

      const result = await ReservationService.reserve(
        req.user.id,
        ticketId
      );

      res.status(201).json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  async pay(req, res) {
    try {
      const { reservationId } = req.body;

      const result = await ReservationService.pay(
        req.user.id,
        reservationId
      );

      res.status(200).json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  async checkPenalty(req, res) {
    try {
      const { id } = req.params;

      const result = await ReservationService.checkPenalty(
        req.user.id,
        id
      );

      res.status(200).json(result);
    } catch (e) {
      if (e.code === 'RESERVATION_NOT_FOUND') {
        return res.status(404).json({
          error: 'Reservation not found.'
        });
      }

      res.status(400).json({
        error: e.message
      });
    }
  },

  async cancel(req, res) {
    try {
      const { reservationId } = req.body;

      const result =
        await ReservationService.cancelAndRefund(
          req.user.id,
          reservationId
        );

      res.status(200).json(result);
    } catch (e) {
      res.status(400).json({
        error: e.message
      });
    }
  },

  async getBookings(req, res) {
    try {
      const result =
        await ReservationService.getBookings(
          req.user.id
        );

      res.status(200).json(result);
    } catch (e) {
      res.status(500).json({
        error: e.message
      });
    }
  },

  async adminGetReservations(req, res) {
    try {
      const result =
        await ReservationService.adminGetReservations();

      res.status(200).json(result);
    } catch (e) {
      res.status(500).json({
        error: e.message
      });
    }
  },

  async adminUpdateReservation(req, res) {
    try {
      const {
        reservationId,
        status
      } = req.body;

      const result =
        await ReservationService.adminUpdateReservation(
          reservationId,
          status,
          req.user.id
        );

      res.status(200).json(result);
    } catch (e) {
      res.status(400).json({
        error: e.message
      });
    }
  }
};