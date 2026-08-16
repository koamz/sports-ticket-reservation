import type { TicketFilters, TicketSuggestion } from '../types';

interface SearchFiltersProps {
  filters: TicketFilters;
  setFilter: <K extends keyof TicketFilters>(key: K, value: TicketFilters[K]) => void;
  suggestions: TicketSuggestion[];
  onSelectSuggestion: (value: string) => void;
  onSearch: () => void;
}

export default function SearchFilters({
  filters,
  setFilter,
  suggestions,
  onSelectSuggestion,
  onSearch,
}: SearchFiltersProps) {
  return (
    <section className="rise-in -mt-6 rounded-2xl border border-pitch-800/10 bg-white p-5 shadow-xl shadow-pitch-950/10 sm:p-6">
      <h2 className="mb-4 text-sm font-extrabold text-turf-600">جستجوی پیشرفته مسابقات</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="relative">
          <input
            type="text"
            value={filters.homeTeam}
            onChange={(e) => setFilter('homeTeam', e.target.value)}
            placeholder="نام تیم یا ورزشگاه را تایپ کنید…"
            className="w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none transition focus:border-turf-500"
          />
          {suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelectSuggestion(`${s.home_team_fa} vs ${s.away_team_fa}`)}
                  className="block w-full border-b border-slate-100 p-2.5 text-right text-sm last:border-0 hover:bg-mist-50"
                >
                  {s.home_team_fa} vs {s.away_team_fa}{' '}
                  <span className="text-slate-400">({s.venue_name_fa})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <select
          value={filters.sport}
          onChange={(e) => setFilter('sport', e.target.value)}
          className="rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-turf-500"
        >
          <option value="">نوع ورزش</option>
          <option value="Football">فوتبال</option>
          <option value="Volleyball">والیبال</option>
          <option value="Basketball">بسکتبال</option>
        </select>

        <select
          value={filters.city}
          onChange={(e) => setFilter('city', e.target.value)}
          className="rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-turf-500"
        >
          <option value="">شهر برگزاری</option>
          <option value="Tehran">تهران</option>
          <option value="Isfahan">اصفهان</option>
          <option value="Shiraz">شیراز</option>
        </select>

        <button
          onClick={onSearch}
          className="rounded-lg bg-turf-500 p-2.5 text-sm font-bold text-white transition hover:bg-turf-600"
        >
          اعمال فیلترها
        </button>
      </div>
    </section>
  );
}