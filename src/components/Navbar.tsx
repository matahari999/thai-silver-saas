'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { Translations } from '@/i18n/en';
import type { Locale } from '@/types';

export default function Navbar({ locale, t }: { locale: Locale; t: Translations }) {
  const pathname = usePathname();
  const otherLocale = locale === 'en' ? 'th' : 'en';
  const switchPath = pathname.replace(`/${locale}`, `/${otherLocale}`);
  const [menuOpen, setMenuOpen] = useState(false);

  const mainLinks = [
    { href: `/${locale}`, label: t.nav.dashboard },
    { href: `/${locale}/patients`, label: t.nav.patients },
    { href: `/${locale}/rooms`, label: t.nav.rooms },
    { href: `/${locale}/daily-care`, label: t.nav.dailyCare },
    { href: `/${locale}/incidents`, label: t.nav.incidents },
    { href: `/${locale}/appointments`, label: t.nav.appointments },
    { href: `/${locale}/billing`, label: t.nav.billing },
    { href: `/${locale}/reports`, label: t.nav.reports },
  ];

  function isActive(href: string) {
    if (href === `/${locale}`) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav style={{
      background: 'var(--bg-white)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link href={`/${locale}`} style={{
            fontWeight: 700,
            fontSize: '1.125rem',
            color: 'var(--primary)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}>
            {t.app.name}
          </Link>
          <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto' }} className="nav-links">
            {mainLinks.map(link => (
              <Link key={link.href} href={link.href} style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: isActive(link.href) ? 'var(--primary)' : 'var(--text-secondary)',
                background: isActive(link.href) ? 'var(--primary-light)' : 'transparent',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="lang-switch">
            <Link
              href={switchPath}
              className={locale === 'en' ? 'active' : ''}
              style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none' }}
            >
              EN
            </Link>
            <Link
              href={switchPath}
              className={locale === 'th' ? 'active' : ''}
              style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none' }}
            >
              TH
            </Link>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setMenuOpen(!menuOpen)}>
            {t.nav.settings}
          </button>
        </div>
      </div>
    </nav>
  );
}
