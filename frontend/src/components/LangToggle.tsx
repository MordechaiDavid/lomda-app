'use client';

import { useLang } from '../lib/i18n';

export function LangToggle() {
  const { lang, setLang } = useLang();

  return (
    <button
      onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
      className="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 bg-white border border-gray-300 shadow-lg rounded-full px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors select-none"
      title={lang === 'he' ? 'Switch to English' : 'עבור לעברית'}
    >
      <span className="text-base leading-none">{lang === 'he' ? '🇮🇱' : '🇬🇧'}</span>
      <span>{lang === 'he' ? 'EN' : 'עב'}</span>
    </button>
  );
}
