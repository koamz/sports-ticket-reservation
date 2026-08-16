import { ReservationRepository } from '../repositories/reservationRepository.js';
import { TicketService } from './ticketService.js';
import { ElasticsearchService } from './elasticsearchService.js';

export class ReservationService {

  static async reserve(userId, ticketId) {
    const expiresAt =
      new Date(Date.now() + 10 * 60 * 1000);

    const reservation =
      await ReservationRepository.createReservation(
        userId,
        ticketId,
        expiresAt
      );

    await ElasticsearchService.syncTicket(ticketId);
    await TicketService.clearTicketCache(ticketId);

    return reservation;
  }

  static async pay(userId, reservationId) {
    const {
      payment,
      ticket_id
    } =
      await ReservationRepository.payReservation(
        userId,
        reservationId,
        'card'
      );

    await ElasticsearchService.syncTicket(ticket_id);
    await TicketService.clearTicketCache(ticket_id);

    return payment;
  }

  static calculatePenalty(matchTimeStr) {
    const matchTime = new Date(matchTimeStr);

    const hoursLeft =
      (matchTime - Date.now()) /
      (1000 * 60 * 60);

    if (hoursLeft <= 0) {
      return {
        allowed: false,
        error: 'Match has already started or finished.'
      };
    }

    if (hoursLeft < 3) {
      return {
        allowed: true,
        penalty_percentage: 100,
        refund_percentage: 0
      };
    }

    if (hoursLeft < 24) {
      return {
        allowed: true,
        penalty_percentage: 30,
        refund_percentage: 70
      };
    }

    return {
      allowed: true,
      penalty_percentage: 10,
      refund_percentage: 90
    };
  }

  static async checkPenalty(userId, reservationId) {

    const reservation =
      await ReservationRepository.findReservationForCancel(
        userId,
        reservationId
      );

    if (!reservation) {
      const error =
        new Error('Reservation not found.');

      error.code = 'RESERVATION_NOT_FOUND';

      throw error;
    }

    const penaltyResult =
      this.calculatePenalty(reservation.match_time);

    return {
      reservation_id: reservation.reservation_id,
      allowed: penaltyResult.allowed,
      penalty_percentage:
        penaltyResult.penalty_percentage ?? null,
      refund_percentage:
        penaltyResult.refund_percentage ?? null,
      error: penaltyResult.error ?? null
    };
  }

  static async cancelAndRefund(userId, reservationId) {

    const res =
      await ReservationRepository.findReservationForCancel(
        userId,
        reservationId
      );

    if (
      !res ||
      res.reservation_status !== 'paid'
    ) {
      throw new Error(
        'Only successfully paid reservations can be cancelled.'
      );
    }

    const penaltyResult =
      this.calculatePenalty(res.match_time);

    if (!penaltyResult.allowed) {
      throw new Error(penaltyResult.error);
    }

    const refundAmount =
      res.price *
      (penaltyResult.refund_percentage / 100);

    await ReservationRepository.processCancelAndRefund(
      userId,
      reservationId,
      res.ticket_id,
      refundAmount
    );

    await ElasticsearchService.syncTicket(
      res.ticket_id
    );

    await TicketService.clearTicketCache(
      res.ticket_id
    );

    return {
      message: 'Ticket cancelled successfully.',
      original_price: res.price,
      penalty_percentage:
        penaltyResult.penalty_percentage,
      refunded_amount: refundAmount
    };
  }

  static async getBookings(userId) {
    return await ReservationRepository.getBookings(userId);
  }

  static async adminGetReservations() {
    return await ReservationRepository.adminGetReservations();
  }

  static async adminUpdateReservation(
    reservationId,
    status,
    adminId
  ) {
    return await ReservationRepository.adminUpdateReservationStatus(
      reservationId,
      status,
      adminId
    );
  }
}