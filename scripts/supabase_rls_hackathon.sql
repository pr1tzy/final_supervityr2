-- Run in Supabase SQL Editor (https://supabase.com/dashboard/project/oswgepszkvaxxskksuxa/sql)
-- Allows backend (anon or service_role) to read/write pipeline tables during hackathon.
-- For production: use service_role key only + tighter policies.

alter table leads enable row level security;
alter table meeting_transcripts enable row level security;
alter table agent_runs enable row level security;
alter table workbench_reviews enable row level security;
alter table crm_activity_logs enable row level security;
alter table follow_ups enable row level security;
alter table ai_metrics enable row level security;

drop policy if exists "hackathon_leads_all" on leads;
create policy "hackathon_leads_all" on leads for all using (true) with check (true);

drop policy if exists "hackathon_transcripts_all" on meeting_transcripts;
create policy "hackathon_transcripts_all" on meeting_transcripts for all using (true) with check (true);

drop policy if exists "hackathon_agent_runs_all" on agent_runs;
create policy "hackathon_agent_runs_all" on agent_runs for all using (true) with check (true);

drop policy if exists "hackathon_workbench_all" on workbench_reviews;
create policy "hackathon_workbench_all" on workbench_reviews for all using (true) with check (true);

drop policy if exists "hackathon_crm_logs_all" on crm_activity_logs;
create policy "hackathon_crm_logs_all" on crm_activity_logs for all using (true) with check (true);

drop policy if exists "hackathon_follow_ups_all" on follow_ups;
create policy "hackathon_follow_ups_all" on follow_ups for all using (true) with check (true);

drop policy if exists "hackathon_metrics_all" on ai_metrics;
create policy "hackathon_metrics_all" on ai_metrics for all using (true) with check (true);
