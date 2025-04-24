
-- Enable REPLICA IDENTITY FULL for the profiles table to ensure complete row data
ALTER TABLE IF EXISTS public.profiles REPLICA IDENTITY FULL;

-- Enable REPLICA IDENTITY FULL for the reports table to ensure complete row data
ALTER TABLE IF EXISTS public.reports REPLICA IDENTITY FULL;

-- Add tables to the supabase_realtime publication to activate real-time functionality
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
