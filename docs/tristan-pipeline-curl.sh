#!/usr/bin/env bash
# ONE lead: tristanhancock@gmail.com — run from WSL/Git Bash in SupervityR2/
# Usage: bash docs/tristan-pipeline-curl.sh
#    or: bash docs/tristan-pipeline-curl.sh legal   (skip step 1, set LEAD_ID first)

set -euo pipefail

BASE="${BASE:-http://127.0.0.1:8001}"
SECRET="${SECRET:-igenuinelydontcareaboutthis}"

hdr=(-H "Content-Type: application/json" -H "X-Webhook-Secret: ${SECRET}")

echo "=== Health ==="
curl -s "${BASE}/api/orchestrator/health" | jq . 2>/dev/null || curl -s "${BASE}/api/orchestrator/health"
echo

if [[ "${1:-}" != "legal" && "${1:-}" != "payment" && "${1:-}" != "check" ]]; then
  echo "=== Step 1: lead_created (welcome email) ==="
  RESP=$(curl -s -X POST "${BASE}/api/orchestrator/webhook/lead" \
    "${hdr[@]}" \
    -d '{
      "event": "lead_created",
      "source": "manual_curl_test",
      "lead_payload": {
        "name": "Tristan Hancock",
        "email": "tristanhancock@gmail.com",
        "phone": "9819861904",
        "company": "Ovelia Health",
        "project_type": "website",
        "budget": "around 5 lakhs",
        "timeline": "by October 2026",
        "availability": ["Thursday 7pm"]
      }
    }')
  echo "$RESP" | jq . 2>/dev/null || echo "$RESP"
  LEAD_ID=$(echo "$RESP" | sed -n 's/.*"lead_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
  if [[ -z "${LEAD_ID}" ]]; then
    echo "ERROR: no lead_id in response — fix Step 1 before continuing"
    exit 1
  fi
  echo "LEAD_ID=${LEAD_ID}"
  export LEAD_ID
  echo
fi

LEAD_ID="${LEAD_ID:-}"
if [[ -z "${LEAD_ID}" ]]; then
  echo "ERROR: LEAD_ID is empty. Run Step 1 first, then:"
  echo "  export LEAD_ID='your-uuid-from-step-1'"
  exit 1
fi
echo "Using LEAD_ID=${LEAD_ID}"

if [[ "${1:-}" != "payment" && "${1:-}" != "check" ]]; then
  echo "=== Step 2: phase/legal (contract email) ==="
  curl -s -X POST "${BASE}/api/orchestrator/phase/legal" \
    "${hdr[@]}" \
    -d "{
      \"lead_id\": \"${LEAD_ID}\",
      \"transcript_payload\": {
        \"project_description\": \"Marketing website with blog, CMS, contact form for Ovelia Health. Budget 5 lakhs INR. Launch October 2026.\",
        \"scoped_budget\": \"500000\",
        \"scoped_timeline\": \"October 2026\",
        \"meeting_transcript_summary\": \"Scope and contract review agreed this week.\"
      }
    }" | jq . 2>/dev/null || true
  echo
fi

if [[ "${1:-}" != "check" ]]; then
  echo "=== Step 3: phase/payment (payment link email) ==="
  curl -s -X POST "${BASE}/api/orchestrator/phase/payment" \
    "${hdr[@]}" \
    -d "{\"lead_id\": \"${LEAD_ID}\", \"deposit_amount_usd\": 150000}" \
    | jq . 2>/dev/null || true
  echo
fi

echo "=== Step 4: check (monitor) ==="
curl -s -X POST "${BASE}/api/orchestrator/check" \
  "${hdr[@]}" \
  -d "{
    \"action\": \"check\",
    \"lead_id\": \"${LEAD_ID}\",
    \"client_email\": \"tristanhancock@gmail.com\",
    \"client_name\": \"Tristan Hancock\",
    \"silence_threshold_days\": 4
  }" | jq . 2>/dev/null || true

echo
echo "Done. LEAD_ID=${LEAD_ID}"
