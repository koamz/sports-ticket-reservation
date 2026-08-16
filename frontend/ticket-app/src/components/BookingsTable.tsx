import type { Booking, BookingStatus } from '../types';

const STATUS_STYLE: Record<BookingStatus, string> = {
  paid: 'bg-turf-500/10 text-turf-600',
  pending: 'bg-amber-ticket/15 text-amber-ticket-dark',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  paid: 'پرداخت شده',
  pending: 'در انتظار پرداخت',
  cancelled: 'لغو شده',
};

interface BookingsTableProps {
  bookings: Booking[];
  onPay: (reservationId: number) => void;
  onCancel: (reservationId: number) => void;
}

export default function BookingsTable({ bookings, onPay, onCancel }: BookingsTableProps) {
  if (bookings.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-400">
        هنوز بلیطی رزرو نکرده‌اید. از بالا یک مسابقه پیدا کنید و صندلی‌تان را رزرو کنید.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-right text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs text-slate-400">
            <th className="p-3 font-semibold">شناسه رزرو</th>
            <th className="p-3 font-semibold">مسابقه</th>
            <th className="p-3 font-semibold">قیمت پرداختی</th>
            <th className="p-3 font-semibold">وضعیت</th>
            <th className="p-3 font-semibold">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.reservation_id} className="border-b border-slate-100 hover:bg-mist-50">
              <td className="p-3 font-score text-slate-500">{b.reservation_id}</td>
              <td className="p-3 font-bold text-ink-900">
                {b.home_team} <span className="text-slate-400 font-normal">در برابر</span>{' '}
                {b.away_team}
              </td>
              <td className="p-3 font-score text-turf-600">
                {parseFloat(String(b.price)).toLocaleString('fa-IR')} ریال
              </td>
              <td className="p-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[b.reservation_status] || ''}`}>
                  {STATUS_LABEL[b.reservation_status] || b.reservation_status}
                </span>
              </td>
              <td className="p-3">
                <div className="flex gap-1.5">
                  {b.reservation_status === 'pending' && (
                    <button
                      onClick={() => onPay(b.reservation_id)}
                      className="rounded-full bg-turf-500 px-3 py-1 text-xs font-bold text-white transition hover:bg-turf-600"
                    >
                      پرداخت
                    </button>
                  )}
                  {b.reservation_status === 'paid' && (
                    <button
                      onClick={() => onCancel(b.reservation_id)}
                      className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white transition hover:bg-red-600"
                    >
                      کنسلی بلیط
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}