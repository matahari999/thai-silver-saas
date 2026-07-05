import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const residentId = searchParams.get('resident_id');
    const careDate = searchParams.get('care_date');
    const facilityId = searchParams.get('facility_id');

    let query = supabase.from('daily_care_records')
      .select('*, profiles(full_name_en, full_name_th)');
    if (facilityId) query = query.eq('facility_id', facilityId);
    if (residentId) query = query.eq('resident_id', residentId);
    if (careDate) query = query.eq('care_date', careDate);
    query = query.order('care_date', { ascending: false }).order('shift');

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch care records' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('daily_care_records')
      .insert(body)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create care record' },
      { status: 500 }
    );
  }
}
