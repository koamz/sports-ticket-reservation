import type {
  Booking,
  CancelResponse,
  OtpVerifyResponse,
  Ticket,
  TicketFilters,
  TicketSuggestion,
  User,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions {
  method?: string;
  body?: Record<string, unknown>;
  token?: string | null;
  params?: Record<string, string | undefined>;
}

async function request<T>(path: string, { method = 'GET', body, token, params }: RequestOptions = {}): Promise<T> {
  let url = `${API_BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '') as [string, string][]
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError((data as { error?: string })?.error || 'خطای ناشناخته', res.status, data);
  }
  return data as T;
}

export const api = {
  auth: {
    requestOtp: (contact: string) =>
      request<void>('/auth/otp/request', { method: 'POST', body: { contact } }),
    verifyOtp: (contact: string, code: string) =>
      request<OtpVerifyResponse>('/auth/otp/verify', { method: 'POST', body: { contact, code } }),
  },
  user: {
    profile: (token: string) => request<User>('/user/profile', { token }),
    bookings: (token: string) => request<Booking[]>('/user/bookings', { token }),
  },
  tickets: {
    autocomplete: (q: string) =>
      request<TicketSuggestion[]>('/tickets/autocomplete', { params: { q } }),
    search: (filters: Partial<TicketFilters>) =>
      request<Ticket[]>('/tickets/search', { params: filters }),
  },
  reservations: {
    reserve: (ticketId: number, token: string) =>
      request<void>('/reservations/reserve', { method: 'POST', body: { ticketId }, token }),
    pay: (reservationId: number, token: string) =>
      request<void>('/reservations/pay', { method: 'POST', body: { reservationId }, token }),
    cancel: (reservationId: number, token: string) =>
      request<CancelResponse>('/reservations/cancel', {
        method: 'POST',
        body: { reservationId },
        token,
      }),
  },
};