# Contributing to BGS Admission Connect

Thanks for your interest! This is a free, open-source admission management tool for PU colleges.

## Guidelines

1. Open an issue first for bugs or feature requests
2. Keep PRs focused on one concern
3. Run `pnpm run typecheck` before submitting
4. Run `pnpm run build` to verify the build

## Architecture

- `artifacts/bgs-admission/` — React frontend (Vite + Tailwind)
- `supabase/schema.sql` — Database schema (PostgreSQL)
- `scripts/` — Utility scripts (wake-db, deploy helpers)
