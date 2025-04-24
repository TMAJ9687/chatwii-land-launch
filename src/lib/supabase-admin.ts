
// WARNING: This file should be used ONLY server-side in edge functions
// NEVER import this file in client-side code!
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Create a Supabase client with the service role key (elevated privileges)
export const supabaseAdmin = createClient<Database>(
  'https://eicsmwtzldydzdscvxtj.supabase.co',
  // This should be replaced with the actual service role key in your edge functions
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);
