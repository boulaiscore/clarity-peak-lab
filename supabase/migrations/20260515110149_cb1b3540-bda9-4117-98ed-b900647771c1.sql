CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Drop existing job if present, then schedule daily Cognitive Age compute
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'compute-cognitive-age-daily') THEN
    PERFORM cron.unschedule('compute-cognitive-age-daily');
  END IF;
END $$;

SELECT cron.schedule(
  'compute-cognitive-age-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://rqdmhhhkzpwceeznpftn.supabase.co/functions/v1/compute-cognitive-age-daily',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxZG1oaGhrenB3Y2Vlem5wZnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTg1MzksImV4cCI6MjA4MzI5NDUzOX0.Gzyz-Z5Cl0JRFP2uUVz5tlKWZ8zFYfMiS0HrMOMn8Tk'
    ),
    body := '{}'::jsonb
  );
  $$
);