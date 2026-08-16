import { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import SearchFilters from './components/SearchFilters';
import Dashboard from './components/Dashboard';
import { useAuth } from './hooks/useAuth';
import { useTickets } from './hooks/useTickets';
import { useBookings } from './hooks/useBookings';
import { api, ApiError } from './api/client';

export default function App() {
  const { token, user, isAuthenticated, requestOtp, verifyOtp, logout } = useAuth();
  const { tickets, loading, filters, setFilter, suggestions, setSuggestions, search } = useTickets();
  const { bookings, pay, cancel, load: loadBookings } = useBookings(token);
  const [authOpen, setAuthOpen] = useState(false);

  const handleSelectSuggestion = (value: string) => {
    setFilter('homeTeam', value);
    setSuggestions([]);
    search({ homeTeam: value });
  };

  const handleReserve = async (ticketId: number) => {
    if (!isAuthenticated || !token) {
      setAuthOpen(true);
      return;
    }
    try {
      await api.reservations.reserve(ticketId, token);
      alert('صندلی با موفقیت به مدت ۱۰ دقیقه برای شما رزرو شد. لطفا نسبت به پرداخت هزینه اقدام کنید.');
      loadBookings();
      search();
    } catch (err) {
      const message = err instanceof ApiError ? (err.data as { error?: string })?.error : undefined;
      alert(message || 'خطا در رزرو بلیط.');
    }
  };

  const handlePay = async (reservationId: number) => {
    try {
      await pay(reservationId);
      alert('پرداخت موفقیت‌آمیز بود. بلیط شما صادر شد.');
      search();
    } catch {
      alert('خطا در عملیات پرداخت.');
    }
  };

  const handleCancel = async (reservationId: number) => {
    if (!confirm('آیا مایل به کنسل کردن بلیط خود بر اساس قوانین جریمه کنسلی هستید؟')) return;
    try {
      const data = await cancel(reservationId);
      alert(`کنسلی تایید شد. مبلغ ${data.refunded_amount.toLocaleString('fa-IR')} ریال پس از جریمه به حساب شما برگشت داده شد.`);
      search();
    } catch (err) {
      const message = err instanceof ApiError ? (err.data as { error?: string })?.error : undefined;
      alert(message || 'خطا در لغو بلیط.');
    }
  };

  return (
    <div className="min-h-screen bg-mist-50">
      <Header user={user} onLoginClick={() => setAuthOpen(true)} onLogout={logout} />
      <Hero />

      <main className="mx-auto max-w-6xl px-4 pb-16">
        <SearchFilters
          filters={filters}
          setFilter={setFilter}
          suggestions={suggestions}
          onSelectSuggestion={handleSelectSuggestion}
          onSearch={() => search()}
        />

        <section className="mt-8">
          <h2 className="mb-4 text-lg font-extrabold text-ink-900">مسابقات ورزشی در دسترس</h2>
        </section>

        {isAuthenticated && (
          <Dashboard bookings={bookings} onPay={handlePay} onCancel={handleCancel} />
        )}
      </main>

    
    </div>
  );
}