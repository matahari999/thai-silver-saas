'use client';

import { getTranslations } from '@/i18n';
import type { Locale } from '@/types';
import { useState } from 'react';

export default function ReportsPage({ params }: { params: { locale: string } }) {
  const locale = (params.locale === 'en' ? 'en' : 'th') as Locale;
  const t = getTranslations(locale);
  const [residentId, setResidentId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function generateReport() {
    if (!residentId || !startDate || !endDate) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?resident_id=${residentId}&start_date=${startDate}&end_date=${endDate}`);
      const data = await res.json();
      setReport(data);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{t.report.title}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary">{t.report.dailySummary}</button>
          <button className="btn btn-secondary">{t.report.weeklySummary}</button>
          <button className="btn btn-secondary">{t.report.monthlySummary}</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
            <label className="form-label">{t.report.resident}</label>
            <input
              className="form-input"
              placeholder="Resident ID"
              value={residentId}
              onChange={e => setResidentId(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{locale === 'en' ? 'From' : 'จาก'}</label>
            <input className="form-input" type="date" value={startDate}
              onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{locale === 'en' ? 'To' : 'ถึง'}</label>
            <input className="form-input" type="date" value={endDate}
              onChange={e => setEndDate(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={generateReport} disabled={loading}>
            {loading ? <span className="loading-spinner" /> : t.report.generate}
          </button>
        </div>
      </div>

      {report && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
              {t.report.dailySummary}
              {(report as any).resident && ` - ${locale === 'en'
                ? `${(report as any).resident.first_name_en} ${(report as any).resident.last_name_en}`
                : `${(report as any).resident.first_name_th} ${(report as any).resident.last_name_th}`
              }`}
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm">{t.report.sendToGuardian}</button>
              <button className="btn btn-secondary btn-sm">{t.common.export}</button>
            </div>
          </div>

          {(report as any).summary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.dashboard.todayCareCompleted}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{(report as any).summary.totalDays || 0} {(locale === 'en' ? 'days' : 'วัน')}</div>
              </div>
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.dailyCare.medicationGiven}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{(report as any).summary.medicationAdherence || 0}%</div>
              </div>
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.incident.title}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{(report as any).summary.incidentsCount || 0}</div>
              </div>
            </div>
          )}

          {(report as any).careRecords && (report as any).careRecords.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>{t.dailyCare.title}</h3>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t.dailyCare.careDate}</th>
                      <th>{t.dailyCare.shift}</th>
                      <th>{t.dailyCare.mealStatus}</th>
                      <th>{t.dailyCare.medicationGiven}</th>
                      <th>{t.dailyCare.mood}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report as any).careRecords.map((r: any) => (
                      <tr key={r.id}>
                        <td>{r.care_date}</td>
                        <td><span className="badge badge-info">{r.shift}</span></td>
                        <td>{r.meal_status || '-'}</td>
                        <td>{r.medication_given ? <span className="badge badge-success">{t.common.yes}</span> : t.common.no}</td>
                        <td>{r.mood || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
