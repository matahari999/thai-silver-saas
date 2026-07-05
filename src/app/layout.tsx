import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SilverCare Thailand - Premium Elderly Care',
  description: 'แพลตฟอร์มจัดการดูแลผู้สูงอายุระดับพรีเมียม',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SilverCare',
  },
  applicationName: 'SilverCare Thailand',
  keywords: ['elderly care', 'nursing home', 'ผู้สูงอายุ', 'สถานดูแลผู้สูงอายุ'],
  authors: [{ name: 'SilverCare Thailand' }],
  category: 'healthcare',
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    siteName: 'SilverCare Thailand',
    title: 'SilverCare Thailand - Premium Elderly Care',
    description: 'แพลตฟอร์มจัดการดูแลผู้สูงอายุระดับพรีเมียม',
  },
};

export const viewport: Viewport = {
  themeColor: '#1a73e8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <link rel="icon" href="/icons/icon-192x192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
