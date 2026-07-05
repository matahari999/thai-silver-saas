import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facility_id');

    let query = supabase.from('rooms')
      .select('*, beds(*)');
    if (facilityId) query = query.eq('facility_id', facilityId);
    query = query.order('floor').order('name_en');

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { beds: bedList, ...roomData } = body;

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();
    if (roomError) throw roomError;

    if (bedList && bedList.length > 0) {
      const bedsWithRoom = bedList.map((b: { bed_number: string; notes?: string }) => ({
        facility_id: roomData.facility_id,
        room_id: room.id,
        bed_number: b.bed_number,
        notes: b.notes || '',
      }));
      const { error: bedsError } = await supabase
        .from('beds')
        .insert(bedsWithRoom);
      if (bedsError) throw bedsError;
    }

    return NextResponse.json({ data: room }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create room' },
      { status: 500 }
    );
  }
}
