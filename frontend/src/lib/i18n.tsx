'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Lang = 'he' | 'en';

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (he: string, en: string) => string;
  dir: 'rtl' | 'ltr';
}

const LangContext = createContext<LangContextType>({
  lang: 'he',
  setLang: () => {},
  t: (he) => he,
  dir: 'rtl'
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('he');

  useEffect(() => {
    const saved = localStorage.getItem('app-lang') as Lang | null;
    if (saved === 'en' || saved === 'he') setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('app-lang', l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'he' ? 'rtl' : 'ltr';
    document.body.style.direction = l === 'he' ? 'rtl' : 'ltr';
  };

  const t = (he: string, en: string) => (lang === 'he' ? he : en);
  const dir = lang === 'he' ? 'rtl' : 'ltr';

  return (
    <LangContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
