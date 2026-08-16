import BookingsTable from './BookingsTable';
import type { Booking } from '../types';

interface DashboardProps {
  bookings: Booking[];
  onPay: (reservationId: number) => void;
  onCancel: (reservationId: number) => void;
}

export default function Dashboard({ bookings, onPay, onCancel }: DashboardProps) {
  return (
    <section className="rise-in mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-extrabold text-turf-600">داشبورد و تاریخچه خریدهای من</h2>
      <BookingsTable bookings={bookings} onPay={onPay} onCancel={onCancel} />
    </section>
  );
}