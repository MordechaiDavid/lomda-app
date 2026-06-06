import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../lib/providers';

export const metadata: Metadata = {
  title: 'Lomda - Enterprise Learning Management',
  description: 'Mobile-first learning platform for organizations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
