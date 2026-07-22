# Contributing

## Prerequisites

- Node.js 22+
- pnpm (latest)
- Supabase account (free tier)

## Setup

```bash
git clone https://github.com/neoline361-art/bgs-admission.git
cd bgs-admission
pnpm install
cp artifacts/bgs-admission/.env.example artifacts/bgs-admission/.env
# Edit .env with your Supabase credentials
pnpm --filter @workspace/bgs-admission run dev
```

## Before Submitting

1. `pnpm run typecheck` — passes
2. `pnpm --filter @workspace/bgs-admission run build` — passes
3. Format with `prettier --write .`

## Commit Messages

```
<type>(<scope>): <description>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
