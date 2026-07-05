'use client';

import { getTranslations } from '@/i18n';
import type { Locale, Appointment } from '@/types';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const statusBadge: Record<string, string> = {
  scheduled: 'badge-info',
  confirmed: 'badge-success',
  in_progress: 'badge-warning',
  completed: 'badge-default',
  cancelled: 'badge-danger',
};

export default function AppointmentsPage({ params }: { params: { locale: string } }) {
  const locale = (params.locale === 'en' ? 'en' : 'th') as Locale;
  const t = getTranslations(locale);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadAppointments();
  }, [filterStatus]);

  async function loadAppointments() {
    setLoading(true);
    try {
      let query = supabase.from('appointments').select('*');
      if (filterStatus) query = query.eq('status', filterStatus);
      query = query.order('appointment_date', { ascending: true });
      const { data } = await query;
      if (data) setAppointments(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{t.appointment.title}</h1>
        <button className="btn btn-primary">{t.appointment.add}</button>
      </div>

      <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <select
          className="form-select"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ maxWidth: '250px' }}
        >
          <option value="">{locale === 'en' ? 'All statuses' : 'ทุกสถานะ'}</option>
          <option value="scheduled">{t.appointment.scheduled}</option>
          <option value="confirmed">{t.appointment.confirmed}</option>
          <option value="in_progress">{t.appointment.inProgress}</option>
          <option value="completed">{t.appointment.completed}</option>
          <option value="cancelled">{t.appointment.cancelled}</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <span className="loading-spinner" />
          </div>
        ) : appointments.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            {t.common.noData}
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>{locale === 'en' ? 'Title' : 'หัวข้อ'}</th>
                  <th>{t.appointment.date}</th>
                  <th>{t.appointment.startTime}</th>
                  <th>{t.appointment.endTime}</th>
                  <th>{t.appointment.location}</th>
                  <th>{t.appointment.status}</th>
                  <th>{t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 500 }}>
                      {locale === 'en' ? a.title_en : a.title_th}
                    </td>
                    <td>{new Date(a.appointment_date).toLocaleDateString()}</td>
                    <td>{a.start_time.slice(0, 5)}</td>
                    <td>{a.end_time.slice(0, 5)}</td>
                    <td>{locale === 'en' ? a.location_en : a.location_th}</td>
                    <td>
                      <span className={`badge ${statusBadge[a.status] || 'badge-default'}`}>
                        {t.appointment[a.status as keyof typeof t.appointment] || a.status}
                      </span>
                    </td>
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
