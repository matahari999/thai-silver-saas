'use client';

import { getTranslations } from '@/i18n';
import type { Locale } from '@/types';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage({ params }: { params: { locale: string } }) {
  const locale = (params.locale === 'en' ? 'en' : 'th') as Locale;
  const t = getTranslations(locale);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw new Error(authError.message);
      router.push(`/${locale}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
            {t.app.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            {t.app.tagline}
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">{t.auth.email}</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t.auth.password}</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={{
              background: '#fce8e6',
              color: '#c62828',
              padding: '0.75rem',
              borderRadius: 'var(--radius)',
              fontSize: '0.8125rem',
              marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }}
            disabled={loading}
          >
            {loading ? <span className="loading-spinner" /> : t.auth.login}
          </button>

          <div style={{ textAlign: 'center', fontSize: '0.8125rem' }}>
            <a href="#" style={{ color: 'var(--primary)' }}>{t.auth.forgotPassword}</a>
            <span style={{ color: 'var(--text-secondary)', margin: '0 0.5rem' }}>|</span>
            <a href="#" style={{ color: 'var(--primary)' }}>{t.auth.signUp}</a>
          </div>
        </form>

        <div className="lang-switch" style={{ marginTop: '1.5rem', justifyContent: 'center', width: '100%' }}>
          <a
            href="/en/login"
            className={locale === 'en' ? 'active' : ''}
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', textDecoration: 'none', width: '50%', textAlign: 'center' }}
          >
            English
          </a>
          <a
            href="/th/login"
            className={locale === 'th' ? 'active' : ''}
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', textDecoration: 'none', width: '50%', textAlign: 'center' }}
          >
            ภาษาไทย
          </a>
        </div>
      </div>
    </div>
  );
}
