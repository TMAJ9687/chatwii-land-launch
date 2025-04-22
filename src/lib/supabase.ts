
import { createClient } from '@supabase/supabase-js';

// Lovable.dev handles credentials automatically
const supabaseUrl = 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
