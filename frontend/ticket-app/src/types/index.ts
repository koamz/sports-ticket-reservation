export type Sport = 'Football' | 'Volleyball' | 'Basketball';

export interface User {
  first_name: string;
  last_name: string;
  [key: string]: unknown;
}

export interface Ticket {
  id: number;
  sport_name_fa: Sport | string;
  home_team_fa: string;
  away_team_fa: string;
  venue_name_fa: string;
  city_name_fa: string;
  match_time: string;
  price: string | number;
}

export interface TicketSuggestion {
  home_team_fa: string;
  away_team_fa: string;
  venue_name_fa: string;
}

export type BookingStatus = 'paid' | 'pending' | 'cancelled';

export interface Booking {
  reservation_id: number;
  home_team: string;
  away_team: string;
  price: string | number;
  reservation_status: BookingStatus;
}

export interface TicketFilters {
  homeTeam: string;
  sport: string;
  city: string;
}

export interface OtpVerifyResponse {
  token: string;
}

export interface CancelResponse {
  refunded_amount: number;
}