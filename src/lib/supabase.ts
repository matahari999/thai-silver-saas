import { createClient } from '@supabase/supabase-js';

function isBuildTime(): boolean {
  return typeof window === 'undefined' &&
    process.env.NODE_ENV === 'production' &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-build.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-build-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
  db: { schema: 'public' },
});

export function getServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    if (isBuildTime()) return createClient(supabaseUrl, 'placeholder-service-key', {
      auth: { persistSession: false },
      db: { schema: 'public' },
    });
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' },
  });
}
