export class Reservation {
  constructor({ id, user_id, ticket_id, status, reserved_at, expires_at, cancelled_by }) {
    this.id = id;
    this.userId = user_id;
    this.ticketId = ticket_id;
    this.status = status; // pending, paid, cancelled, expired
    this.reservedAt = reserved_at;
    this.expiresAt = expires_at;
    this.cancelledBy = cancelled_by;
  }

  isExpired() {
    return this.status === 'pending' && new Date(this.expiresAt) < new Date();
  }
}