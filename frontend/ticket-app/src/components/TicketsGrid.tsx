import TicketCard from './TicketCard';
import type { Ticket } from '../types';

interface TicketsGridProps {
  tickets: Ticket[];
  loading: boolean;
  onReserve: (ticketId: number) => void;
}

export default function TicketsGrid({ tickets, loading, onReserve }: TicketsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200/60" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400">
        هیچ بلیطی مطابق جستجوی شما یافت نشد. فیلترها را تغییر دهید.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {tickets.map((t) => (
        <TicketCard key={t.id} ticket={t} onReserve={onReserve} />
      ))}
    </div>
  );
}