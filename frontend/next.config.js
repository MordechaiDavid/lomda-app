import type { Config } from 'next';
import { i18n } from './next-i18next.config';

const config: Config = {
  reactStrictMode: true,
  swcMinify: true,
  i18n,
  images: {
    domains: ['localhost', 'api.example.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
};

export default config;
