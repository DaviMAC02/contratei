<p align="center"><img src="public/logo.svg" alt="Contratei" height="64"></p>

# Contratei

Self-hosted contract management for small teams. Track every contract you sign or provide, get alerted before renewals, and let annual price adjustments and auto-renewals run on their own.

## Features

- **Contracts in both directions.** Track contracts where you pay (suppliers) and where you get paid (clients), with value, currency, dates, tags, cost center and file attachments.
- **Renewal alerts.** Email and in-app notifications N days before each renewal, configurable per organization (e.g. 90, 60 and 30 days).
- **Automatic renewals and adjustments.** A daily job renews contracts with auto-renew on, applies fixed-percentage annual adjustments, and keeps a full history of both. See [docs/daily-cron.md](docs/daily-cron.md).
- **Teams.** Multi-organization workspaces with Owner, Admin, Manager and Viewer roles, email invitations and an audit log.
- **Brazil-ready.** CPF and CNPJ validation and address lookup by CEP. The UI is in Brazilian Portuguese.
- **Sign in** with an email magic link or Google.

## Stack

Next.js 15 (App Router) · tRPC · Prisma + PostgreSQL · Auth.js · MUI + Tailwind · Resend for email

## Getting started

Requirements: Node 20+, pnpm 8, Docker (or any PostgreSQL).

```bash
git clone https://github.com/DaviMAC02/contratei.git
cd contratei
pnpm install

cp .env.example .env      # fill in NEXTAUTH_SECRET, RESEND_API_KEY and CRON_SECRET
docker compose up -d      # local PostgreSQL
pnpm db:push              # create the schema
pnpm db:seed              # optional demo data
pnpm dev
```

Open http://localhost:3000. Sign-in links and alerts are sent through [Resend](https://resend.com), so you need an API key and a verified sender for `RESEND_FROM_EMAIL`.

## Project layout

```
prisma/schema.prisma        data model (orgs, contracts, files, alerts, audit log)
src/app/                    routes: (dashboard), auth, api/cron/daily, api/trpc
src/server/routers/         tRPC routers: contract, org, file, notification, auth, session
src/lib/alerts.ts           renewal, adjustment and due-soon logic used by the cron
src/components/features/    page-level UI per feature
```

## Deploying

Any Node host with PostgreSQL works. On Vercel, `vercel.json` already schedules the daily cron. Elsewhere, call `GET /api/cron/daily` once a day with `Authorization: Bearer $CRON_SECRET`.

## License

[MIT](LICENSE)
