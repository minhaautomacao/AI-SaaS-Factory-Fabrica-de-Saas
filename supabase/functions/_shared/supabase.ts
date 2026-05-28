import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';

let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_client) {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas');
    _client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return _client;
}
