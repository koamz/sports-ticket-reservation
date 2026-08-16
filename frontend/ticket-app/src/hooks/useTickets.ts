import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Ticket, TicketFilters, TicketSuggestion } from '../types';

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TicketFilters>({ homeTeam: '', sport: '', city: '' });
  const [suggestions, setSuggestions] = useState<TicketSuggestion[]>([]);

  const search = useCallback(
    async (overrides: Partial<TicketFilters> = {}) => {
      setLoading(true);
      try {
        const merged = { ...filters, ...overrides };
        const data = await api.tickets.search(merged);
        setTickets(data || []);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters]
  );

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = filters.homeTeam;
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      const data = await api.tickets.autocomplete(q);
      setSuggestions(data || []);
    }, 250);
    return () => clearTimeout(t);
  }, [filters.homeTeam]);

  const setFilter = useCallback(<K extends keyof TicketFilters>(key: K, value: TicketFilters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
  }, []);

  return { tickets, loading, filters, setFilter, suggestions, setSuggestions, search };
}