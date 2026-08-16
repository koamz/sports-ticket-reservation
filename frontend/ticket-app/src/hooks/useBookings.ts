import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Booking } from '../types';

export function useBookings(token: string | null) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.user.bookings(token);
      setBookings(data || []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const pay = useCallback(
    async (reservationId: number) => {
      if (!token) return;
      await api.reservations.pay(reservationId, token);
      await load();
    },
    [token, load]
  );

  const cancel = useCallback(
    async (reservationId: number) => {
      if (!token) throw new Error('not authenticated');
      const data = await api.reservations.cancel(reservationId, token);
      await load();
      return data;
    },
    [token, load]
  );

  return { bookings, loading, load, pay, cancel };
}