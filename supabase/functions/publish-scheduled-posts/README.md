# Publish Scheduled Posts Edge Function

Denne Edge Function håndterer automatisk udgivelse af planlagte LinkedIn opslag.

## 🎯 Funktionalitet

- **Finder planlagte opslag** der skal udgives nu (±1 minut buffer)
- **Behandler posts parallelt** for optimal performance
- **Håndterer op til 200+ opslag** på samme tidspunkt
- **Kun ét API kald** per opslag (billeder er allerede uploadet)

## 🚀 Deployment

### Forudbetinger

1. Supabase CLI installeret
2. Logget ind på Supabase CLI (`supabase login`)
3. Projektet linket (`supabase link --project-ref ixbgjwmnhxpkyraodyxy`)

### Deploy Edge Function

```bash
# Fra projektets rod directory
supabase functions deploy publish-scheduled-posts
```

### Verificer Deployment

```bash
# Test funktionen manuelt
supabase functions invoke publish-scheduled-posts \
  --method POST \
  --body '{}'
```

## ⚙️ Konfiguration

Edge Functionen bruger automatisk:
- `SUPABASE_URL` - Automatisk sat af Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Automatisk sat af Supabase

Disse environment variables er automatisk tilgængelige i alle Edge Functions og kræver ingen konfiguration.

## 📊 Monitoring

### Tjek Cron Job Status

```sql
-- Se alle cron jobs
SELECT * FROM cron.job WHERE jobname = 'publish-scheduled-linkedin-posts';

-- Se seneste execution history
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'publish-scheduled-linkedin-posts')
ORDER BY start_time DESC 
LIMIT 10;
```

### Tjek Edge Function Logs

Gå til Supabase Dashboard > Edge Functions > `publish-scheduled-posts` > Logs

### Tjek HTTP Requests

```sql
-- Se seneste HTTP requests fra pg_net
SELECT * FROM net._http_response 
WHERE created > NOW() - INTERVAL '1 hour'
ORDER BY created DESC;
```

## 🔧 Troubleshooting

### Cron Job Kører Ikke

1. Tjek at `pg_cron` extension er enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. Tjek cron job status:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'publish-scheduled-linkedin-posts';
   ```

3. Tjek for fejl i `cron.job_run_details`:
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'publish-scheduled-linkedin-posts')
   AND status != 'succeeded'
   ORDER BY start_time DESC;
   ```

### Edge Function Fejler

1. Tjek Edge Function logs i Supabase Dashboard
2. Verificer at `SUPABASE_SERVICE_ROLE_KEY` er sat korrekt
3. Tjek at billeder er uploadet (`image_upload_status = 'uploaded'`)

### Opslag Udgives Ikke

1. Tjek at `scheduled_for` er sat korrekt (UTC tid)
2. Tjek at `status = 'scheduled'`
3. Tjek at billeder er uploadet (`image_upload_status = 'uploaded'`)
4. Tjek LinkedIn API rate limits

## 📝 Noter

- Cron jobbet kører **hvert minut** (`* * * * *`)
- Edge Functionen har en **5 minut timeout** for batch processing
- Opslag bliver udgivet med en **±1 minut buffer** for timing edge cases
- Alle opslag behandles **parallelt** for optimal performance
