-- Create waitlist_signups table for email collection
CREATE TABLE public.waitlist_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'landing_page',
  notified_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public signup)
CREATE POLICY "Anyone can signup for waitlist"
ON public.waitlist_signups
FOR INSERT
WITH CHECK (true);

-- Only authenticated admins can view (we'll handle admin check separately)
CREATE POLICY "Admins can view waitlist"
ON public.waitlist_signups
FOR SELECT
USING (auth.uid() IN (
  SELECT user_id FROM profiles WHERE subscription_status = 'admin'
));