
-- Enable REPLICA IDENTITY FULL for the profiles table to ensure complete row data
ALTER TABLE IF EXISTS public.profiles REPLICA IDENTITY FULL;

-- Enable REPLICA IDENTITY FULL for the reports table to ensure complete row data
ALTER TABLE IF EXISTS public.reports REPLICA IDENTITY FULL;

-- Make sure messages table has REPLICA IDENTITY FULL for realtime updates
ALTER TABLE IF EXISTS public.messages REPLICA IDENTITY FULL;

-- Make sure blocked_users table has REPLICA IDENTITY FULL for realtime updates
ALTER TABLE IF EXISTS public.blocked_users REPLICA IDENTITY FULL;

-- Add tables to the supabase_realtime publication to activate real-time functionality
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_users;
