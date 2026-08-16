import { useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import type { OtpVerifyResponse } from '../types';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onRequestOtp: (contact: string) => Promise<void>;
  onVerifyOtp: (contact: string, code: string) => Promise<OtpVerifyResponse>;
}

export default function AuthModal({ open, onClose, onRequestOtp, onVerifyOtp }: AuthModalProps) {
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [contact, setContact] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const reset = () => {
    setStep('request');
    setContact('');
    setCode('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleRequest = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onRequestOtp(contact);
      setStep('verify');
    } catch {
      setError('ارسال کد تایید با خطا مواجه شد. دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onVerifyOtp(contact, code);
      handleClose();
    } catch (err) {
      const message = err instanceof ApiError ? (err.data as { error?: string })?.error : undefined;
      setError(message || 'کد تایید اشتباه است.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-pitch-950/60 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm rise-in overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-pitch-900 px-6 py-5 text-mist-50">
          <p className="text-xs text-turf-400 font-semibold">ورود به سامانه</p>
          <h3 className="mt-1 text-lg font-extrabold">
            {step === 'request' ? 'ورود سریع با کد یک‌بار مصرف' : 'کد ارسال‌شده را وارد کنید'}
          </h3>
        </div>

        <div className="px-6 py-6">
          {step === 'request' ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label htmlFor="auth-contact" className="mb-1.5 block text-sm text-slate-500">
                  ایمیل یا شماره تلفن
                </label>
                <input
                  id="auth-contact"
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="ali@gmail.com"
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none transition focus:border-turf-500"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-turf-500 py-2.5 text-sm font-bold text-white transition hover:bg-turf-600 disabled:opacity-60"
              >
                {loading ? 'در حال ارسال…' : 'ارسال کد تایید'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label htmlFor="auth-code" className="mb-1.5 block text-sm text-slate-500">
                  کد ۶ رقمی
                </label>
                <input
                  id="auth-code"
                  type="text"
                  required
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-center font-score text-2xl tracking-[0.4em] outline-none transition focus:border-turf-500"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-turf-500 py-2.5 text-sm font-bold text-white transition hover:bg-turf-600 disabled:opacity-60"
              >
                {loading ? 'در حال بررسی…' : 'تایید و ورود'}
              </button>
              <button
                type="button"
                onClick={() => setStep('request')}
                className="w-full text-xs text-slate-500 hover:underline"
              >
                تغییر شماره یا ایمیل
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={handleClose}
            className="mt-4 w-full text-xs text-slate-400 hover:underline"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}