import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, action } = body;

    if (!email || !password || !action) {
      return NextResponse.json(
        { error: 'email, password, and action are required' },
        { status: 400 }
      );
    }

    let result;
    if (action === 'signup') {
      result = await supabase.auth.signUp({ email, password });
    } else if (action === 'signin') {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else if (action === 'signout') {
      result = await supabase.auth.signOut();
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 401 });
    }

    return NextResponse.json({ data: result.data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
