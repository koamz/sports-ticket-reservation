export class Ticket {
  constructor({ id, match_id, category_id, price, total_capacity, remaining_capacity, status }) {
    this.id = id;
    this.matchId = match_id;
    this.categoryId = category_id;
    this.price = parseFloat(price);
    this.totalCapacity = total_capacity;
    this.remainingCapacity = remaining_capacity;
    this.status = status;
  }

  isAvailable() {
    return this.status === 'available' && this.remainingCapacity > 0;
  }
}