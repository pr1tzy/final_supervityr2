# AceLink agent testing

## .env (required)

```env
SUPERVITY_WORKFLOW_CRM=019e321b-e1f0-7000-898b-b92f9fb3f46f
SUPERVITY_WORKFLOW_EMAIL=019e3222-57ff-7000-9dee-8a06e682bfde
SUPERVITY_WORKFLOW_LEGAL=019e3226-d968-7000-91a0-59b2dd8a71c0
SUPERVITY_WORKFLOW_PAYMENT=019e3229-2cd5-7000-b286-6f32eb5aae64
SUPERVITY_WORKFLOW_CHECK=019e3234-6c3a-7000-8142-cb43d8073ebd
SUPERVITY_ACTIVE_ORG=AceLink Software Solutions Pvt LTD
SUPERVITY_MOCK_MODE=false
```

## Python (recommended)

```bash
cd SupervityR2
python scripts/test_all_agents.py          # full A→E
python scripts/test_all_agents.py crm      # one agent
python scripts/test_all_agents.py check <lead_id>
```

## Agent A fix (Supabase)

If you see `SUPABASE_URL or SUPABASE_TOKEN is empty` on Auto:

1. In workflow **A**, add inputs: `input_supabase_url`, `input_supabase_token` (text).
2. Wire them to your Supabase HTTP / tool step (not only `request_json`).
3. Or store Supabase URL + **service role** key in Auto workflow credentials.

John already sends: `request_json` (includes supabase inside JSON) + `input_supabase_url` + `SUPABASE_URL` aliases.

## Agent E fix (Slack)

Use a real Slack channel ID/name, or make Slack optional in the workflow so check still returns `notifications[]` when Slack fails.
