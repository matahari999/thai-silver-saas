'use client';

import { getTranslations } from '@/i18n';
import type { Locale, Room, Bed } from '@/types';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type RoomWithBeds = Room & { beds: Bed[] };

export default function RoomsPage({ params }: { params: { locale: string } }) {
  const locale = (params.locale === 'en' ? 'en' : 'th') as Locale;
  const t = getTranslations(locale);
  const [rooms, setRooms] = useState<RoomWithBeds[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRooms(); }, []);

  async function loadRooms() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('rooms')
        .select('*, beds(*)')
        .order('floor')
        .order('name_en');
      if (data) setRooms(data as RoomWithBeds[]);
    } catch { /* silent */ } finally { setLoading(false); }
  }

  const totalBeds = rooms.reduce((sum, r) => sum + (r.beds?.length || 0), 0);
  const occupiedBeds = rooms.reduce((sum, r) =>
    sum + (r.beds?.filter(b => b.status === 'occupied').length || 0), 0
  );
  const availableBeds = rooms.reduce((sum, r) =>
    sum + (r.beds?.filter(b => b.status === 'vacant').length || 0), 0
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{t.room.title}</h1>
        <button className="btn btn-primary">{t.room.add}</button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.room.totalBeds}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalBeds}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--secondary)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.room.availableBeds}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{availableBeds}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.room.occupancyRate}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0}%
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}><span className="loading-spinner" /></div>
      ) : rooms.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>{t.common.noData}</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {rooms.map(room => (
            <div key={room.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                    {locale === 'en' ? room.name_en : room.name_th}
                  </h3>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {locale === 'en' ? 'Floor' : 'ชั้น'} {room.floor} &middot; {t.room[room.room_type as keyof typeof t.room]}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {room.beds?.filter(b => b.status === 'vacant').length > 0 && (
                    <span className="badge badge-success">
                      {room.beds.filter(b => b.status === 'vacant').length} {t.room.vacant}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {room.beds?.map(bed => (
                  <div key={bed.id} style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    background: bed.status === 'occupied' ? '#e6f4ea' :
                                bed.status === 'vacant' ? '#f1f3f4' :
                                bed.status === 'maintenance' ? '#fce8e6' : '#fef7e0',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                  }}>
                    {bed.bed_number}
                    <span style={{ marginLeft: '0.375rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                      {t.room[bed.status as keyof typeof t.room]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
