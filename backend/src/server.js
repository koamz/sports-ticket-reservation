import app from './app.js';
import { ReservationRepository } from './repositories/reservationRepository.js';
import { ElasticsearchService } from './services/elasticsearchService.js'; // اضافه کردن الاستیک

const PORT = process.env.PORT || 3000;

// آماده‌سازی زیرساخت‌های داینامیک الاستیک‌سرچ هنگام روشن شدن وب‌سرور
try {
  await ElasticsearchService.initIndex(); // ساخت ایندکس و مپینگ Autocomplete
  await ElasticsearchService.syncAllTickets(); // کش سراسری بی مغایرت بلیط‌ها
} catch (e) {
  console.error('[STARTUP WARNING] Failed to connect or sync with Elasticsearch:', e.message);
}

// جاب مانیتورینگ اکسپایری رزروها
setInterval(async () => {
  try {
    const expiredCount = await ReservationRepository.expirePendingReservations();
    if (expiredCount.length > 0) {
      console.log(`[RESERVATION CLEANUP] Expired ${expiredCount.length} pending reservations.`);
      // سینک مجدد وضعیت بلیط‌های آزاد شده در الاستیک‌سرچ
      for (const res of expiredCount) {
         await ElasticsearchService.syncTicket(res.ticket_id);
      }
    }
  } catch (e) {
    console.error('Error on reservation cleanup job', e);
  }
}, 60000);

app.listen(PORT, () => {
  console.log(`Server is running with precision on port ${PORT}`);
});