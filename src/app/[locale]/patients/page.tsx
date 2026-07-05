'use client';

import { getTranslations } from '@/i18n';
import type { Locale, Patient } from '@/types';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PatientsPage({ params }: { params: { locale: string } }) {
  const locale = (params.locale === 'en' ? 'en' : 'th') as Locale;
  const t = getTranslations(locale);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadPatients();
  }, [search]);

  async function loadPatients() {
    setLoading(true);
    try {
      let query = supabase.from('patients').select('*').eq('is_active', true);
      if (search) {
        query = query.or(
          `first_name_en.ilike.%${search}%,last_name_en.ilike.%${search}%,first_name_th.ilike.%${search}%,last_name_th.ilike.%${search}%`
        );
      }
      const { data } = await query.order('created_at', { ascending: false });
      if (data) setPatients(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{t.patient.title}</h1>
        <button className="btn btn-primary">{t.patient.add}</button>
      </div>

      <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <input
          className="form-input"
          placeholder={t.patient.search}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <span className="loading-spinner" />
          </div>
        ) : patients.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            {t.common.noData}
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>{locale === 'en' ? 'Name' : 'ชื่อ-นามสกุล'}</th>
                  <th>{t.patient.phone}</th>
                  <th>{t.patient.gender}</th>
                  <th>{t.patient.bloodType}</th>
                  <th>{locale === 'en' ? 'Created' : 'สร้างเมื่อ'}</th>
                  <th>{t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {locale === 'en'
                          ? `${p.first_name_en} ${p.last_name_en}`
                          : `${p.first_name_th} ${p.last_name_th}`}
                      </div>
                    </td>
                    <td>{p.phone}</td>
                    <td>{t.patient[p.gender]}</td>
                    <td><span className="badge badge-info">{p.blood_type || '-'}</span></td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" style={{ marginRight: '0.5rem' }}>
                        {t.common.edit}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
