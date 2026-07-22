#!/usr/bin/env bash
# ============================================================
# BGS Admission Connect - Wake Supabase Database
# ============================================================
# Pings the free-tier Supabase instance to wake it from sleep.
# Schedule: every 6 hours via cron to keep it warm.
# ============================================================

set -euo pipefail

SUPABASE_URL="https://iznztuqzzfwmzykwgoou.supabase.co"
ANON_KEY="${VITE_SUPABASE_ANON_KEY:-placeholder}"

echo "Waking Supabase: $SUPABASE_URL ..."

# -s silent, -o /dev/null discard body, -w %{http_code} output status
# --connect-timeout 10 — don't hang forever if sleeping
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  --connect-timeout 15 \
  --max-time 30 \
  "${SUPABASE_URL}/auth/v1/settings" \
  -H "apikey: ${ANON_KEY}" 2>/dev/null || echo "000")

case "$STATUS" in
  200|400)
    echo "✅ Database awake! (HTTP $STATUS)"
    ;;
  000)
    echo "⏳ No response — database may be sleeping."
    echo "   Visit https://supabase.com/dashboard/project/iznztuqzzfwmzykwgoou"
    echo "   Opening the project in the dashboard wakes it automatically."
    ;;
  *)
    echo "⚠️  Unexpected HTTP $STATUS — check dashboard."
    ;;
esac
