<div align="center">
  <h1>BGS Admission Connect</h1>
  <p><strong>Open-source admission management for PU colleges</strong></p>
  <p>
    <a href="https://github.com/neoline361-art/bgs-admission/actions"><img src="https://img.shields.io/github/actions/workflow/status/neoline361-art/bgs-admission/ci.yml?branch=main&logo=github&label=CI" alt="CI"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue" alt="License"></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node-22%2B-green?logo=node.js" alt="Node 22+"></a>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19"></a>
    <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase" alt="Supabase"></a>
    <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-blueviolet" alt="PRs welcome"></a>
    <a href="CHANGELOG.md"><img src="https://img.shields.io/badge/Changelog-v0.1.0-blue" alt="Changelog"></a>
  </p>
</div>

---

A production-ready web application for managing student admissions at **BGS PU College**, Hanumanthpura, Shidlaghatta, Karnataka.

Built with **React 19 + Vite + Supabase (PostgreSQL)**. Zero paid tools.

## How It Works

1. **Student** scans a QR code → fills application form → gets Application ID
2. **Staff** logs in with username + PIN + CAPTCHA → sees role-based dashboard
3. **Teacher** reviews assigned applications, updates status, sends WhatsApp
4. **Office** manages all applications, assigns teachers, exports data
5. **Admin** manages staff accounts and views analytics

## Tech Stack

| Layer | Technology | License |
|-------|-----------|---------|
| Frontend | React 19 + Vite + TypeScript | MIT |
| Styling | Tailwind CSS 3.4 | MIT |
| UI Library | shadcn/ui | MIT |
| Backend | Supabase (PostgreSQL + RLS) | Apache 2 |
| Export | SheetJS (CSV, Excel, ODS) | Apache 2 |
| QR Code | qrcode.react | MIT |
| Build | pnpm workspaces | MIT |

## Quick Start

```bash
git clone https://github.com/neoline361-art/bgs-admission.git
cd bgs-admission
pnpm install

# 1. Create Supabase project → paste supabase/schema.sql
# 2. Configure environment
cp artifacts/bgs-admission/.env.example artifacts/bgs-admission/.env
# Edit .env with your Supabase URL and anon key

# 3. Start dev server
pnpm --filter @workspace/bgs-admission run dev
# Open http://localhost:5173
```

## Default Credentials

After running `supabase/schema.sql`:

| Username | PIN | Role |
|----------|-----|------|
| `kumar` | 1234 | Teacher |
| `radha` | 5678 | Teacher |
| `office1` | 9012 | Office |
| `admin` | Set via Admin Dashboard | Admin |

**Change PINs after first login.**

## Features

- Student application form with auto-generated ID (`BGS-2026-XXXX`)
- Role-based dashboards (Teacher, Office, Admin)
- Visual CAPTCHA on staff login
- Real-time updates via Supabase Postgres Changes
- One-click WhatsApp messages with pre-filled templates
- Export to CSV, Excel, ODS
- QR code sharing for applications
- Staff management (add/edit/disable)
- Application status tracking: new → assigned → reviewing → decided

## Documentation

| Resource | Description |
|----------|-------------|
| [Wake DB Script](scripts/wake-db.sh) | Prevent Supabase free-tier sleep |
| [Schema](supabase/schema.sql) | Full database schema with RLS |
| [API Spec](lib/api-spec/openapi.yaml) | OpenAPI documentation |

## Project Structure

```
bgs-admission/
├── artifacts/
│   ├── bgs-admission/    # Main React application
│   ├── api-server/       # API server
│   └── mockup-sandbox/   # Design mockup environment
├── lib/
│   ├── api-client-react/ # Generated React API client
│   ├── api-spec/         # OpenAPI specification
│   ├── api-zod/          # Zod validation schemas
│   └── db/               # Database utilities
├── scripts/              # Utility scripts
├── supabase/             # Database schema
├── docs/                 # Documentation
└── assets/               # Images and screenshots
```

## Wake the Database

Supabase free tier pauses after 7 days. Wake it:

```bash
VITE_SUPABASE_ANON_KEY="your_key" ./scripts/wake-db.sh
```

Or set up cron: `0 */6 * * * /path/to/bgs-admission/scripts/wake-db.sh`

## Development

```bash
pnpm run typecheck     # TypeScript checks
pnpm run build         # Full build
npx prettier --check . # Formatting
```

## License

Apache 2.0 — see [LICENSE](LICENSE).

---

<div align="center">
  <sub>BGS PU College · Hanumanthpura, Shidlaghatta, Karnataka 562105 · MC0118</sub>
</div>
