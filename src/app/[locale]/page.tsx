'use client';

import { getTranslations } from '@/i18n';
import type { Locale } from '@/types';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type DashboardStats = {
  totalResidents: number;
  availableBeds: number;
  todayCareCompleted: number;
  pendingInvoices: number;
  monthlyRevenue: number;
  recentIncidents: number;
};

export default function DashboardPage({ params }: { params: { locale: string } }) {
  const locale = (params.locale === 'en' ? 'en' : 'th') as Locale;
  const t = getTranslations(locale);
  const [stats, setStats] = useState<DashboardStats>({
    totalResidents: 0, availableBeds: 0, todayCareCompleted: 0,
    pendingInvoices: 0, monthlyRevenue: 0, recentIncidents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const today = new Date().toISOString().split('T')[0];
        const monthStart = new Date();
        monthStart.setDate(1);
        const monthStartStr = monthStart.toISOString().split('T')[0];

        const [
          patientsRes, bedsRes, careRes, invoicesRes, revenueRes, incidentsRes,
        ] = await Promise.all([
          supabase.from('patients').select('id', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('beds').select('id', { count: 'exact', head: true }).eq('status', 'vacant'),
          supabase.from('daily_care_records').select('id', { count: 'exact', head: true }).eq('care_date', today),
          supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('invoices').select('amount').eq('status', 'paid').gte('paid_at', monthStartStr),
          supabase.from('incidents').select('id', { count: 'exact', head: true }).gte('incident_date', monthStartStr),
        ]);

        const monthlyRevenue = (revenueRes.data || []).reduce(
          (sum, inv) => sum + Number(inv.amount), 0
        );

        setStats({
          totalResidents: patientsRes.count || 0,
          availableBeds: bedsRes.count || 0,
          todayCareCompleted: careRes.count || 0,
          pendingInvoices: invoicesRes.count || 0,
          monthlyRevenue,
          recentIncidents: incidentsRes.count || 0,
        });
      } catch { /* silent */ } finally { setLoading(false); }
    }
    loadStats();
  }, []);

  const cards = [
    { label: t.dashboard.totalResidents, value: stats.totalResidents, color: 'var(--primary)' },
    { label: t.dashboard.availableBeds, value: stats.availableBeds, color: 'var(--secondary)' },
    { label: t.dashboard.todayCareCompleted, value: stats.todayCareCompleted, color: '#1e88e5' },
    { label: t.dashboard.pendingInvoices, value: stats.pendingInvoices, color: 'var(--warning)' },
    { label: t.dashboard.revenue, value: `฿${stats.monthlyRevenue.toLocaleString()}`, color: 'var(--danger)' },
    { label: t.dashboard.recentIncidents, value: stats.recentIncidents, color: '#8e24aa' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
        {t.nav.dashboard}
      </h1>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {cards.map(card => (
          <div key={card.label} className="card" style={{ borderLeft: `4px solid ${card.color}` }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              {card.label}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {loading ? <span className="loading-spinner" /> : card.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            {t.dashboard.upcomingAppointments}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t.common.noData}</p>
        </div>
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            {t.dashboard.recentIncidents}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t.common.noData}</p>
        </div>
      </div>
    </div>
  );
}
