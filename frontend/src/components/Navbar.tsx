'use client';

import { useRef, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLang } from '../lib/i18n';
import { apiService } from '../lib/apiService';
import { useQuery } from '@tanstack/react-query';

const HIDDEN_PATHS = ['/login', '/learn'];

const ROLE_LABEL: Record<string, { he: string; color: string }> = {
  admin:    { he: 'מנהל מערכת', color: 'bg-red-100 text-red-700' },
  trainer:  { he: 'מדריך',       color: 'bg-purple-100 text-purple-700' },
  employee: { he: 'עובד',        color: 'bg-blue-100 text-blue-700' },
  viewer:   { he: 'צופה',        color: 'bg-gray-100 text-gray-600' },
};

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const hidden =
    pathname === '/' ||
    HIDDEN_PATHS.some((p) => pathname.startsWith(p));

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiService.getCurrentUser().then((r) => r.data.data.user),
    retry: false,
    enabled: !hidden
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    try { await apiService.logout(); } finally { router.push('/login'); }
  };

  if (hidden) return null;

  const isTrainer = ['admin', 'trainer'].includes(user?.role ?? '');
  const roleInfo = ROLE_LABEL[user?.role ?? ''] ?? { he: user?.role ?? '', color: 'bg-gray-100 text-gray-600' };

  const navLinks = [
    { href: '/dashboard', label: t('דשבורד', 'Dashboard') },
    { href: '/courses',   label: t('לומדות', 'Courses') },
    ...(isTrainer ? [{ href: '/dashboard/campaigns', label: t('קמפיינים', 'Campaigns') }] : []),
    ...(user?.role === 'admin' ? [{ href: '/dashboard/admin/users', label: t('משתמשים', 'Users') }] : []),
  ];

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">

        {/* Logo */}
        <a href="/dashboard" className="flex items-center gap-2 font-bold text-blue-600 text-base select-none flex-shrink-0">
          <span className="text-xl">📖</span>
          <span className="hidden sm:inline">{t('לומדה', 'Lomda')}</span>
        </a>

        {/* Nav links */}
        <div className="flex items-center gap-1 mx-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive(link.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* User menu */}
        {user && (
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors group"
            >
              {/* Avatar circle */}
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {initials(user.name)}
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-gray-800 leading-tight max-w-24 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 leading-tight">{roleInfo.he}</p>
              </div>
              <svg
                className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${menuOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="absolute left-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50">
                {/* User info header */}
                <div className="px-4 py-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {initials(user.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${roleInfo.color}`}>
                        {roleInfo.he}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isActive(link.href)
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>

                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t('יציאה מהמערכת', 'Sign out')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
