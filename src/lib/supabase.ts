import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || '';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = url.startsWith('https://') && key.length > 10;

// Create client or mock
export const supabase = isSupabaseConfigured 
  ? createClient(url, key)
  : (null as any); // fallback handled gracefully in hooks and pages
