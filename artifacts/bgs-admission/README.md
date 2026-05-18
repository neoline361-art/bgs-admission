# BGS Admission Connect

**A free, open-source web application for BGS PU College admission management.**

College: BGS PU College, Hanumanthpura, Shidlaghatta, Karnataka 562105  
Code: MC0118

---

## How It Works

- **Student scans QR code** → Opens website → Clicks Apply → Fills form → Gets Application ID
- **Staff scans same QR** → Clicks Staff Login → Enters username + PIN + CAPTCHA → Sees dashboard

---

## Setup Instructions

### Step 1: Supabase Setup (Free)

1. Go to [https://supabase.com](https://supabase.com) and create a **free account**
2. Click **New Project** → name it `bgs-admission` → set a database password → click Create
3. Wait ~2 minutes for the project to be ready
4. Go to: **SQL Editor** → **New Query**
5. Open `supabase/schema.sql` from this folder
6. **Copy the entire contents** and paste into the SQL editor
7. Click **Run** (green button) — this creates all tables, triggers, and default staff accounts
8. Go to: **Settings → API**
9. Copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### Step 2: Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

### Step 3: Run Locally

```bash
npm install
npm run dev
```

Open: [http://localhost:5173](http://localhost:5173)

### Step 4: Build for Production

```bash
npm run build
```

Output is in the `dist/` folder.

---

## Deploy to Vercel (Free)

1. Push your code to GitHub
2. Go to [https://vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Select your repository
4. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
5. Click **Deploy**
6. Done! Share the Vercel URL with students (or generate a QR code from the Office Dashboard)

---

## Default Login Credentials

> **Important:** These are default accounts seeded by the SQL schema. Change PINs after first login using the Admin Dashboard.

| Username | PIN  | Role    | Dashboard              |
|----------|------|---------|------------------------|
| `admin`  | Use Admin dashboard → Staff Management to set | admin   | `/admin`  |
| `kumar`  | —    | teacher | `/teacher`             |
| `radha`  | —    | teacher | `/teacher`             |
| `office1`| —    | office  | `/office`              |

> **Note:** The seed data in `schema.sql` contains example PIN hashes. You must add staff through the Admin Dashboard after setup to have working credentials. The Admin Dashboard → Staff Management → Add Staff creates properly hashed PINs automatically.

**Quickest way to get started:**
1. Run the schema SQL
2. Go to `/staff/login`
3. The `admin` account will not work until you add a real admin user via Supabase directly
4. In Supabase SQL Editor, run:

```sql
-- Add an admin with PIN 1234 (change after first use!)
-- First get the hash by running this in browser console:
-- async function h(pin) {
--   const enc = new TextEncoder();
--   const buf = await crypto.subtle.digest("SHA-256", enc.encode(pin + "bgs_salt_2026"));
--   return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
-- }
-- console.log(await h("1234"));
-- Then insert with that hash.

INSERT INTO staff (username, name, pin_hash, role, is_active)
VALUES ('admin', 'Administrator', 'HASH_FROM_CONSOLE', 'admin', true)
ON CONFLICT (username) DO UPDATE SET pin_hash = EXCLUDED.pin_hash;
```

---

## Customizing

### Villages

Edit `src/lib/constants.ts` → `VILLAGES` array. Add or remove village names.

### Courses

Edit `src/lib/constants.ts` → `COURSES` array. Each entry has `value` and `label`.

### Staff

Use the **Admin Dashboard** → **Staff Management** to:
- Add new staff (name, username, PIN, role)
- Edit PINs
- Activate/deactivate accounts

### Message Templates

Edit `src/lib/constants.ts` → `MESSAGE_TEMPLATES` object.

### College Information

Edit `src/lib/constants.ts` → top constants (`COLLEGE_NAME`, `COLLEGE_LOCATION`, etc.)

---

## Tech Stack

| Layer    | Technology                     | License  |
|----------|--------------------------------|----------|
| Frontend | React 19 + Vite                | MIT      |
| Styling  | Tailwind CSS 3.4               | MIT      |
| Routing  | Wouter                         | MIT      |
| Icons    | Lucide React                   | ISC      |
| Backend  | Supabase (PostgreSQL)          | Apache 2 |
| Export   | SheetJS (xlsx)                 | Apache 2 |
| QR Code  | qrcode.react                   | MIT      |

**Zero paid tools. Zero premium plugins. Everything free forever.**

---

## Pages & Routes

| Route           | Description                        | Access    |
|-----------------|------------------------------------|-----------|
| `/`             | Landing page (Apply or Staff Login)| Public    |
| `/apply`        | Student application form           | Public    |
| `/apply/success`| Application submitted confirmation | Public    |
| `/staff/login`  | Staff login (username + PIN + CAPTCHA) | Public |
| `/teacher`      | Teacher dashboard                  | Teacher   |
| `/office`       | Office dashboard (full control)    | Office    |
| `/admin`        | Admin dashboard + analytics        | Admin     |

---

## Features

- **Student Application Form**: No login required. Auto-generates Application ID (BGS-2026-XXXX)
- **Staff Login**: Username + 4-digit PIN + CAPTCHA (visual distortion, no math)
- **Teacher Dashboard**: Assigned applications, status updates, WhatsApp, Notes
- **Office Dashboard**: All applications, bulk actions, assign teachers, fix meetings, export
- **Admin Dashboard**: Analytics, village/course/teacher summaries, staff management
- **Export**: CSV, Excel (.xlsx), LibreOffice (.ods), Print
- **WhatsApp**: One-click message with pre-filled templates (wa.me links)
- **Real-time**: New applications appear instantly without page refresh
- **QR Code**: Share application link via QR from Office/Admin dashboard
- **Multilingual**: English (Kannada toggle can be added by editing constants)

---

## Security Notes

This application uses Supabase's **anon key** for all operations. This is appropriate for an internal school tool where:
- The application form is intentionally public
- Staff authentication is done at the application level (PIN verification)
- The data (student applications) is not financial or highly sensitive

For higher security, you can enable more restrictive RLS policies in Supabase.

---

## Support

This is open-source software. For customization or deployment help, refer to the code.
