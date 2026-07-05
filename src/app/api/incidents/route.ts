import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facility_id');
    const residentId = searchParams.get('resident_id');
    const incidentType = searchParams.get('incident_type');

    let query = supabase.from('incidents')
      .select('*, profiles!reported_by(full_name_en, full_name_th)');
    if (facilityId) query = query.eq('facility_id', facilityId);
    if (residentId) query = query.eq('resident_id', residentId);
    if (incidentType) query = query.eq('incident_type', incidentType);
    query = query.order('incident_date', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('incidents')
      .insert(body)
      .select()
      .single();
    if (error) throw error;

    // Auto-create notification log for guardian
    if (body.guardian_notified) {
      const { error: notifError } = await supabase
        .from('notification_log')
        .insert({
          facility_id: body.facility_id,
          resident_id: body.resident_id,
          recipient_type: 'email',
          recipient_address: '',
          notification_type: 'incident_alert',
          subject_en: `Incident Report: ${body.title_en}`,
          subject_th: `รายงานเหตุการณ์: ${body.title_th}`,
          body_en: body.description_en,
          body_th: body.description_th,
          status: 'pending',
        });
      if (notifError) console.error('Failed to create notification:', notifError);
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create incident' },
      { status: 500 }
    );
  }
}
