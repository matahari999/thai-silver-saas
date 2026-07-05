'use client';

import { getTranslations } from '@/i18n';
import type { Locale, DailyCareRecord } from '@/types';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const shiftLabels = { morning: 'เช้า', afternoon: 'บ่าย', evening: 'เย็น', all_day: 'ทั้งวัน' } as const;
const moodLabels = { happy: 'มีความสุข', neutral: 'ปกติ', sad: 'เศร้า', anxious: 'กังวล', agitated: 'กระสับกระส่าย' } as const;

export default function DailyCarePage({ params }: { params: { locale: string } }) {
  const locale = (params.locale === 'en' ? 'en' : 'th') as Locale;
  const t = getTranslations(locale);
  const [records, setRecords] = useState<DailyCareRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadRecords();
  }, [selectedDate]);

  async function loadRecords() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('daily_care_records')
        .select('*, profiles!staff_id(full_name_en, full_name_th)')
        .eq('care_date', selectedDate)
        .order('shift');
      if (data) setRecords(data);
    } catch { /* silent */ } finally { setLoading(false); }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{t.dailyCare.title}</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="date"
            className="form-input"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ width: '180px' }}
          />
          <button className="btn btn-primary">{t.dailyCare.add}</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}><span className="loading-spinner" /></div>
        ) : records.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>{t.common.noData}</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>{locale === 'en' ? 'Resident' : 'ผู้พักอาศัย'}</th>
                  <th>{t.dailyCare.shift}</th>
                  <th>{t.dailyCare.mealStatus}</th>
                  <th>{t.dailyCare.medicationGiven}</th>
                  <th>{t.dailyCare.bathroomAssist}</th>
                  <th>{t.dailyCare.bathingAssist}</th>
                  <th>{t.dailyCare.mood}</th>
                  <th>{t.dailyCare.staff}</th>
                  <th>{t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.resident_id.slice(0, 8)}...</td>
                    <td><span className="badge badge-info">{locale === 'en' ? r.shift : (shiftLabels[r.shift] || r.shift)}</span></td>
                    <td>
                      <span className={`badge ${r.meal_status === 'complete' ? 'badge-success' : r.meal_status === 'partial' ? 'badge-warning' : r.meal_status === 'none' ? 'badge-danger' : 'badge-default'}`}>
                        {r.meal_status ? t.dailyCare[`meal${r.meal_status.charAt(0).toUpperCase() + r.meal_status.slice(1)}` as keyof typeof t.dailyCare] || r.meal_status : '-'}
                      </span>
                    </td>
                    <td>{r.medication_given ? <span className="badge badge-success">{t.common.yes}</span> : <span className="badge badge-default">{t.common.no}</span>}</td>
                    <td>{r.bathroom_assist ? <span className="badge badge-success">{t.common.yes}</span> : '-'}</td>
                    <td>{r.bathing_assist ? <span className="badge badge-success">{t.common.yes}</span> : '-'}</td>
                    <td>{r.mood ? <span className="badge badge-info">{locale === 'en' ? r.mood : (moodLabels[r.mood as keyof typeof moodLabels] || r.mood)}</span> : '-'}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{(r as any).profiles?.full_name_en || '-'}</td>
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
