import type { User } from '../types';

interface HeaderProps {
  user: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

export default function Header({ user, onLoginClick, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-pitch-900 text-mist-50 shadow-lg shadow-pitch-950/20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-turf-500 text-sm font-black">
            ⚑
          </span>
          <div className="leading-tight">
            <h1 className="text-base font-extrabold tracking-tight sm:text-lg">
              سامانه ملی رزرواسیون مسابقات ورزشی
            </h1>
            <p className="text-[11px] text-slate-400">بلیط دیدار امشب، صف نداره</p>
          </div>
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold sm:inline">
              خوش آمدید، {user.first_name} {user.last_name}
            </span>
            <button
              onClick={onLogout}
              className="rounded-full bg-pitch-700 px-3.5 py-1.5 text-xs font-bold text-mist-50 transition hover:bg-red-500/80"
            >
              خروج
            </button>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="rounded-full bg-amber-ticket px-4 py-1.5 text-xs font-bold text-pitch-950 transition hover:bg-amber-ticket-dark"
          >
            ورود / ثبت‌نام
          </button>
        )}
      </div>
    </header>
  );
}