import type { Ticket } from '../types';

const SPORT_LABEL: Record<string, string> = {
  Football: 'فوتبال',
  Volleyball: 'والیبال',
  Basketball: 'بسکتبال',
};

interface TicketCardProps {
  ticket: Ticket;
  onReserve: (ticketId: number) => void;
}

export default function TicketCard({ ticket, onReserve }: TicketCardProps) {
  const dateStr = new Date(ticket.match_time).toLocaleString('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="ticket-stub rise-in grid grid-cols-[1fr_auto] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex flex-col gap-2 p-5">
        <span className="w-fit rounded-full bg-turf-500/10 px-2.5 py-1 text-[11px] font-bold text-turf-600">
          {SPORT_LABEL[ticket.sport_name_fa] || ticket.sport_name_fa}
        </span>
        <h3 className="text-lg font-extrabold text-ink-900">
          {ticket.home_team_fa} <span className="text-slate-400 font-medium">در برابر</span>{' '}
          {ticket.away_team_fa}
        </h3>
        <p className="text-xs text-slate-500">
          ورزشگاه {ticket.venue_name_fa} · {ticket.city_name_fa}
        </p>
        <p className="text-xs text-slate-500">{dateStr}</p>
      </div>

      <div className="ticket-stub__tear flex w-32 flex-col items-center justify-center gap-2 bg-mist-50 p-3 sm:w-36">
        <span className="font-score text-2xl font-bold text-turf-600 sm:text-3xl">
          {parseFloat(String(ticket.price)).toLocaleString('fa-IR')}
        </span>
        <span className="-mt-2 text-[10px] text-slate-400">ریال</span>
        <button
          onClick={() => onReserve(ticket.id)}
          className="w-full rounded-full bg-amber-ticket py-1.5 text-xs font-bold text-pitch-950 transition hover:bg-amber-ticket-dark"
        >
          رزرو صندلی
        </button>
      </div>
    </div>
  );
}