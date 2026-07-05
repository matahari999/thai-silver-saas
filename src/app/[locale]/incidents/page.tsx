'use client';

import { getTranslations } from '@/i18n';
import type { Locale, Incident } from '@/types';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const severityBadge: Record<string, string> = {
  minor: 'badge-info',
  moderate: 'badge-warning',
  severe: 'badge-danger',
  critical: 'badge-danger',
};

export default function IncidentsPage({ params }: { params: { locale: string } }) {
  const locale = (params.locale === 'en' ? 'en' : 'th') as Locale;
  const t = getTranslations(locale);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  useEffect(() => { loadIncidents(); }, [filterType]);

  async function loadIncidents() {
    setLoading(true);
    try {
      let query = supabase.from('incidents')
        .select('*, profiles!reported_by(full_name_en, full_name_th)')
        .order('incident_date', { ascending: false });
      if (filterType) query = query.eq('incident_type', filterType);
      const { data } = await query;
      if (data) setIncidents(data);
    } catch { /* silent */ } finally { setLoading(false); }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{t.incident.pageTitle}</h1>
        <button className="btn btn-primary">{t.incident.add}</button>
      </div>

      <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ maxWidth: '250px' }}>
          <option value="">{locale === 'en' ? 'All types' : 'ทุกประเภท'}</option>
          <option value="fall">{t.incident.fall}</option>
          <option value="hospital_visit">{t.incident.hospitalVisit}</option>
          <option value="emergency">{t.incident.emergency}</option>
          <option value="injury">{t.incident.injury}</option>
          <option value="behavioral">{t.incident.behavioral}</option>
          <option value="medication_error">{t.incident.medicationError}</option>
          <option value="other">{t.incident.other}</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}><span className="loading-spinner" /></div>
        ) : incidents.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>{t.common.noData}</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>{t.incident.title}</th>
                  <th>{t.incident.type}</th>
                  <th>{t.incident.severity}</th>
                  <th>{t.incident.date}</th>
                  <th>{t.incident.guardianNotified}</th>
                  <th>{t.incident.reportedBy}</th>
                  <th>{t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map(inc => (
                  <tr key={inc.id}>
                    <td style={{ fontWeight: 500 }}>
                      {locale === 'en' ? inc.title_en : inc.title_th}
                    </td>
                    <td><span className="badge badge-info">{t.incident[inc.incident_type as keyof typeof t.incident] || inc.incident_type}</span></td>
                    <td><span className={`badge ${severityBadge[inc.severity] || 'badge-default'}`}>{t.incident[inc.severity as keyof typeof t.incident]}</span></td>
                    <td style={{ fontSize: '0.8125rem' }}>{new Date(inc.incident_date).toLocaleDateString()}</td>
                    <td>{inc.guardian_notified ? <span className="badge badge-success">{t.common.yes}</span> : <span className="badge badge-default">{t.common.no}</span>}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{(inc as any).profiles?.full_name_en || '-'}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm">{t.common.edit}</button>
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
