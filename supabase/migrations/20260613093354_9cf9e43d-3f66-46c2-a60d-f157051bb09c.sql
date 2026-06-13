CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-stripe-orders') THEN
    PERFORM cron.unschedule('sync-stripe-orders');
  END IF;
END $$;

SELECT cron.schedule(
  'sync-stripe-orders',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://id-preview--6ad8371e-14df-4562-9646-f22b8a3ca3af.lovable.app/api/public/stripe/sync-orders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6ImtveG92dGxvZWNyY2pjcrmhhurIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMzA2MDksImV4cCI6MjA5NjkwNjYwOX0.bIA26nwooYGEar6nEVcbbel3Df42O1vEgeGxRV1iIn0'
    ),
    body := '{}'::jsonb
  );
  $$
);