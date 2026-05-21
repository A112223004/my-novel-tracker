import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// 加裝防護鎖：就算打包時讀不到 .env，也不會讓整個專案直接當掉
export const supabase = createClient(supabaseUrl, supabaseAnonKey);