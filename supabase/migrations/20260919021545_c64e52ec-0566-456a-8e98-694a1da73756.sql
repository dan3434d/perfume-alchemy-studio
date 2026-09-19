-- lovable-cron-fallback-reviewed: 1440 runs/day; Stripe webhook is primary, while minute-level reconciliation preserves the existing maximum one-minute recovery window for a missed provider event.
DO $$
DECLARE
  existing_job_id bigint;
BEGIN
  SELECT jobid INTO existing_job_id FROM cron.job WHERE jobname = 'sync-stripe-orders' LIMIT 1;
  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;
END $$;

SELECT cron.schedule(
  'sync-stripe-orders',
  '* * * * *',
  $job$
  SELECT net.http_post(
    url := 'https://www.abdulrahmanperfumes.com.au/api/public/stripe/sync-orders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', current_setting('app.settings.anon_key', true)
    ),
    body := '{}'::jsonb
  );
  $job$
);