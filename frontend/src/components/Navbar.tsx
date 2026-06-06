'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLang } from '../lib/i18n';
import { apiService } from '../lib/apiService';
import { useQuery } from '@tanstack/react-query';

const HIDDEN_PATHS = ['/login', '/learn'];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLang();

  // Hide on login, landing (/), and course player (/learn/...)
  const hidden =
    pathname === '/' ||
    HIDDEN_PATHS.some((p) => pathname.startsWith(p));

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiService.getCurrentUser().then((r) => r.data.data.user),
    retry: false,
    enabled: !hidden
  });

  const handleLogout = async () => {
    try { await apiService.logout(); } finally { router.push('/login'); }
  };

  if (hidden) return null;

  const isTrainer = ['admin', 'trainer'].includes(user?.role ?? '');

  const navLinks = [
    { href: '/dashboard', label: t('דשבורד', 'Dashboard') },
    { href: '/courses', label: t('לומדות', 'Courses') },
    ...(isTrainer ? [{ href: '/dashboard/campaigns', label: t('קמפיינים', 'Campaigns') }] : []),
    ...(user?.role === 'admin' ? [{ href: '/dashboard/admin/users', label: t('משתמשים', 'Users') }] : []),
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <a href="/dashboard" className="flex items-center gap-2 font-bold text-blue-600 text-base select-none">
          <span>📖</span>
          <span>{t('לומדה', 'Lomda')}</span>
        </a>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(link.href) && link.href !== '/dashboard'
                  ? 'bg-blue-50 text-blue-700'
                  : pathname === link.href
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right side: user */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 hidden sm:inline truncate max-w-28">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {t('יציאה', 'Sign out')}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
