import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { User } from '../types';

const TOKEN_KEY = 'token';

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!token) {
        setChecking(false);
        return;
      }
      try {
        const profile = await api.user.profile(token);
        if (!cancelled) setUser(profile);
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  const requestOtp = useCallback((contact: string) => api.auth.requestOtp(contact), []);

  const verifyOtp = useCallback(async (contact: string, code: string) => {
    const data = await api.auth.verifyOtp(contact, code);
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    return data;
  }, []);

  return { token, user, checking, isAuthenticated: !!token, requestOtp, verifyOtp, logout };
}