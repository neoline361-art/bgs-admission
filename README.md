<div align="center">
  <h1>BGS Admission Connect</h1>
  <p><strong>Open-source admission management for PU colleges</strong></p>
  <p>Students scan a QR → apply without login → get Application ID.<br>Staff login → role-based dashboards to manage, track, and communicate.</p>

  <p>
    <a href="https://github.com/neoline361-art/bgs-admission/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue?style=flat-square" alt="License"></a>
    <a href=".github/workflows/ci.yml"><img src="https://img.shields.io/badge/CI-passing-brightgreen?style=flat-square" alt="CI"></a>
    <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-blueviolet?style=flat-square" alt="PRs"></a>
  </p>
</div>

---

A production-ready application for managing student admissions at BGS PU College, Hanumanthpura, Shidlaghatta, Karnataka.

Built with **React 19 + Vite + Supabase (PostgreSQL)**. Zero paid tools.

## Pages & Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Landing page (Apply or Staff Login) | Public |
| `/apply` | Student application form | Public |
| `/apply/success` | Application submitted confirmation | Public |
| `/staff/login` | Staff login (username + PIN + CAPTCHA) | Public |
| `/teacher` | Teacher dashboard (assigned apps, status updates, WhatsApp) | Teacher |
| `/office` | Office dashboard (all apps, bulk actions, assign teachers, export) | Office |
| `/admin` | Admin dashboard (analytics, staff management) | Admin |

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/neoline361-art/bgs-admission.git
cd bgs-admission
pnpm install

# 2. Set up Supabase
#    - Create a free account at https://supabase.com
#    - Create a new project → wait ~2 minutes
#    - Open SQL Editor → paste supabase/schema.sql → Run
#    - Go to Settings → API → copy Project URL + anon key

# 3. Configure environment
cp artifacts/bgs-admission/.env.example artifacts/bgs-admission/.env
# Edit .env with your Supabase URL and anon key

# 4. Start the dev server
pnpm --filter @workspace/bgs-admission run dev

# 5. Open http://localhost:5173
```

## Tech Stack

| Layer | Technology | License |
|-------|-----------|---------|
| Frontend | React 19 + Vite + TypeScript | MIT |
| Styling | Tailwind CSS 3.4 | MIT |
| Backend | Supabase (PostgreSQL + Row Level Security) | Apache 2 |
| Export | SheetJS (CSV, Excel, ODS) | Apache 2 |
| QR Code | qrcode.react | MIT |

## Wake the Database

Supabase free tier pauses after 7 days of inactivity. To wake it:

```bash
./scripts/wake-db.sh
```

Or set up a cron job (`crontab -e`):
```
0 */6 * * * /path/to/bgs-admission/scripts/wake-db.sh
```

## Default Credentials

After running the schema SQL, the following staff accounts are created:

| Username | PIN | Role |
|----------|-----|------|
| `kumar` | 1234 | Teacher |
| `radha` | 5678 | Teacher |
| `office1` | 9012 | Office |
| `admin` | Set via Admin Dashboard | Admin |

**Change PINs after first login!**

## Features

- Student application form with auto-generated ID (BGS-2026-XXXX)
- Role-based dashboards (Teacher, Office, Admin)
- Visual CAPTCHA on staff login
- Real-time updates via Supabase Postgres Changes
- One-click WhatsApp messages with pre-filled templates
- Export to CSV, Excel, ODS
- QR code sharing
- Staff management (add/edit/disable)

## License

Apache 2.0 — see [LICENSE](LICENSE).

---

<div align="center">
  <sub>BGS PU College · Hanumanthpura, Shidlaghatta, Karnataka 562105 · MC0118</sub>
</div>
