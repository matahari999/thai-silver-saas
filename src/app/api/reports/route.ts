import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const residentId = searchParams.get('resident_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const facilityId = searchParams.get('facility_id');

    if (!residentId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'resident_id, start_date, and end_date are required' },
        { status: 400 }
      );
    }

    const { data: careRecords, error: careError } = await supabase
      .from('daily_care_records')
      .select('*')
      .eq('resident_id', residentId)
      .gte('care_date', startDate)
      .lte('care_date', endDate)
      .order('care_date');

    if (careError) throw careError;

    const { data: incidents, error: incError } = await supabase
      .from('incidents')
      .select('*')
      .eq('resident_id', residentId)
      .gte('incident_date', startDate + 'T00:00:00Z')
      .lte('incident_date', endDate + 'T23:59:59Z')
      .order('incident_date');

    if (incError) throw incError;

    const { data: resident } = await supabase
      .from('patients')
      .select('first_name_en, first_name_th, last_name_en, last_name_th')
      .eq('id', residentId)
      .single();

    // Aggregate care stats
    const totalDays = careRecords?.length || 0;
    const mealsCompleted = careRecords?.filter(r => r.meal_status === 'complete').length || 0;
    const medicationGiven = careRecords?.filter(r => r.medication_given).length || 0;
    const incidentsCount = incidents?.length || 0;

    return NextResponse.json({
      resident,
      period: { start: startDate, end: endDate },
      summary: {
        totalDays,
        mealsCompleted,
        medicationAdherence: totalDays > 0 ? Math.round((medicationGiven / totalDays) * 100) : 0,
        incidentsCount,
      },
      careRecords,
      incidents,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate report' },
      { status: 500 }
    );
  }
}
