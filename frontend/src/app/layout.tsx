import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../lib/providers';
import { Navbar } from '../components/Navbar';

export const metadata: Metadata = {
  title: 'לומדה — מערכת הדרכה ארגונית',
  description: 'פלטפורמת למידה ארגונית להפצת לומדות ומעקב ציות',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
