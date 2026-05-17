-- AceLink — wipe all CRM pipeline data (run in Supabase SQL Editor)
-- Then run: python scripts/reset_and_seed_acelink_demo.py

DELETE FROM crm_activity_logs;
DELETE FROM workbench_reviews;
DELETE FROM follow_ups;
DELETE FROM agent_runs;
DELETE FROM meeting_transcripts;
-- DELETE FROM policy_violations;  -- uncomment if table exists
DELETE FROM ai_metrics;
DELETE FROM leads;
