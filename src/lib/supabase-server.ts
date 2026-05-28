import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configuradas');
    }
    _client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return _client;
}
