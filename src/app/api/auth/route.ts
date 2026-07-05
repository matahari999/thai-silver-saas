import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, action } = body;

    if (action === 'signout') {
      const { error } = await supabase.auth.signOut();
      if (error) return NextResponse.json({ error: error.message }, { status: 401 });
      return NextResponse.json({ success: true });
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'email and password are required' },
        { status: 400 }
      );
    }

    let result: any;
    if (action === 'signup') {
      result = await supabase.auth.signUp({ email, password });
    } else if (action === 'signin') {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 401 });
    }

    return NextResponse.json({ data: result.data || result.session });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
