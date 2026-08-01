import { jest } from '@jest/globals';

// ۱. مسدود کردن کامل لود واقعی لایه‌های بیرونی و الاستیک‌سرچ برای جلوگیری از پرامیس‌های معلق ناهمگام
jest.unstable_mockModule('../../src/repositories/reservationRepository.js', () => {
  return {
    ReservationRepository: {
      findReservationForCancel: jest.fn(),
      processCancelAndRefund: jest.fn()
    }
  };
});

jest.unstable_mockModule('../../src/services/ticketService.js', () => {
  return {
    TicketService: {
      clearTicketCache: jest.fn()
    }
  };
});

// مسدود کردن کدهای الاستیک‌سرچ در این تست واحد
jest.unstable_mockModule('../../src/services/elasticsearchService.js', () => {
  return {
    ElasticsearchService: {
      syncTicket: jest.fn()
    }
  };
});

// ۲. ایمپورت پویای سرویس پس از اعمال ماک‌ها
const { ReservationService } = await import('../../src/services/reservationService.js');

describe('ReservationService Unit Tests - Cancellation Penalty Rules', () => {
  test('6. Should apply 10% penalty if match is more than 24 hours away', () => {
    const matchTime = new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString();
    const penalty = ReservationService.calculatePenalty(matchTime);

    expect(penalty.allowed).toBe(true);
    expect(penalty.penalty_percentage).toBe(10);
    expect(penalty.refund_percentage).toBe(90);
  });

  test('7. Should apply 30% penalty if match is between 3 and 24 hours away', () => {
    const matchTime = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
    const penalty = ReservationService.calculatePenalty(matchTime);

    expect(penalty.allowed).toBe(true);
    expect(penalty.penalty_percentage).toBe(30);
    expect(penalty.refund_percentage).toBe(70);
  });

  test('8. Should apply 100% penalty (no refund) if match is less than 3 hours away', () => {
    const matchTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const penalty = ReservationService.calculatePenalty(matchTime);

    expect(penalty.allowed).toBe(true);
    expect(penalty.penalty_percentage).toBe(100);
    expect(penalty.refund_percentage).toBe(0);
  });

  test('9. Should block cancellation if match has already started', () => {
    const matchTime = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
    const penalty = ReservationService.calculatePenalty(matchTime);

    expect(penalty.allowed).toBe(false);
    expect(penalty.error).toBe('Match has already started or finished.');
  });
});