import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isValidUrl = (url?: string) => Boolean(url && url.trim().length > 0 && url.startsWith('http'));

const supabaseUrl = isValidUrl(rawUrl) ? rawUrl! : 'https://placeholder.supabase.co';
const supabaseAnonKey = rawKey && rawKey.trim().length > 0 ? rawKey : 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);