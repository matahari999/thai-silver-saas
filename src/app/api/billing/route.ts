import { NextResponse } from 'next/server';
import { supabase, getServiceClient } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const status = searchParams.get('status');
    const patientId = searchParams.get('patient_id');

    let query = supabase.from('invoices').select('*, patients(first_name_en, first_name_th, last_name_en, last_name_th)');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    if (status) query = query.eq('status', status);
    if (patientId) query = query.eq('patient_id', patientId);
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ data, count });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const serviceClient = getServiceClient();

    const { data: invoiceNumber } = await serviceClient.rpc(
      'generate_invoice_number',
      { p_tenant_id: body.tenant_id }
    );

    const { data, error } = await supabase
      .from('invoices')
      .insert({ ...body, invoice_number: invoiceNumber })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create invoice' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    if (updateData.status === 'paid' && !updateData.paid_at) {
      updateData.paid_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update invoice' },
      { status: 500 }
    );
  }
}
