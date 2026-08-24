# Build Progress

Tracks progress against PRD §46 Development Phases.

## Phase 1 — Foundation ✅

- [x] Full data model for all PRD §33 entities (`prisma/schema.prisma`)
- [x] PostgreSQL via Prisma 7 driver adapters (`@prisma/adapter-pg`)
- [x] Authentication (Auth.js v5, credentials + bcrypt, JWT sessions)
- [x] Route protection (`src/proxy.ts` — Next 16 renamed `middleware.ts`)
- [x] Roles (7 roles per PRD §5/§29) + role-based nav filtering
- [x] Organization settings (Owner-only)
- [x] User management: create user, assign role, activate/deactivate
- [x] Navigation shell (sidebar + topbar) matching PRD §21
- [x] Placeholder pages for every nav destination, labeled with their phase
- [x] Owner dashboard wired to real (currently empty) DB counts
- [x] Seed script for first Organization + Owner account

Not yet built (later phases): 2FA.

## Phase 2 — CRM ✅

- [x] Leads: create, edit, delete, status pipeline, contact-attempt logging
- [x] Pipeline board (grouped by status, pipeline value)
- [x] Follow-ups view (overdue / due today / upcoming)
- [x] Clients: create, edit, detail page with linked weddings
- [x] Lead → Client + Wedding conversion (reuses existing client or creates new)

## Phase 3 — Wedding Operations ✅

- [x] Weddings: create, edit, status, detail page with tabs (PRD §22 layout)
- [x] Functions: create, edit, delete, per wedding
- [x] Tasks: create, edit, delete, status, priority; My Tasks + Team Tasks views
- [x] Team assignment per wedding
- [x] Timeline items per wedding

## Phase 4 — Vendors ✅

- [x] Vendor directory: create, edit, activate/deactivate, category filter
- [x] Vendor detail page: history (current bookings, previous weddings, total business value) per PRD §10.3
- [x] Vendor bookings: book a vendor onto a wedding/function, status pipeline, remove

## Phase 5 — Finance ✅

- [x] Budget categories per wedding: planned/committed/actual, variance, totals
- [x] Client payments: schedule, record (auto status Paid/Partially Paid), delete
- [x] Vendor payments: schedule against a vendor booking, record, delete
- [x] Financial summary per wedding (contract value, costs, receivables, payables, estimated/actual profit) per PRD §13.2
- [x] Global Finance nav pages: client payments, vendor payments, budgets (cross-wedding)

## Phase 6 — Guests & Documents ✅

- [x] Guests: create, edit, delete, per wedding, with per-function attendance
- [x] Guest RSVP status tracking (Pending/Confirmed/Declined) with inline update
- [x] Guest stats (total/confirmed/pending/declined) per wedding + global overview page
- [x] Document upload (local disk storage) scoped to leads/clients/weddings/vendors/tasks
- [x] Protected document download route (auth-checked) + delete (uploader/Owner only)
- [x] Global Documents nav page (cross-record list)

## Phase 7 — Dashboard & Reporting ✅

- [x] Owner dashboard: real counts, linked to relevant pages
- [x] Sales dashboard: pipeline stats, follow-ups due, my open leads
- [x] Planner dashboard: active weddings, functions in 30 days, my tasks, overdue tasks
- [x] Finance dashboard: outstanding receivables/payables, overdue + due-soon payments
- [x] Calendar: month grid of wedding dates, function dates, task due dates, client/vendor payment due dates
- [x] Reports: Sales / Weddings / Vendors / Finance / Operations tabs with real aggregates
- [x] Notification center: bell icon with unread count, notifications page, mark read / mark all read
- [x] Notification triggers wired for task assignment and wedding team assignment
- [x] Due-date notification triggers (lead follow-ups, client/vendor payments,
      unconfirmed vendor bookings) via `/api/cron/daily-notifications`,
      guarded by `CRON_SECRET` and de-duplicated per day
- [x] CSV export per Reports tab and on the Leads / Client Payments / Vendor
      Payments lists (`/api/export/[dataset]`, hand-rolled `src/lib/csv.ts`)
- [x] Global search across leads, clients, weddings, vendors (topbar search box → `/search`)

## Phase 8 — QA & Deployment ✅

- [x] Permission testing: verified role-based nav filtering, finance
      page/tab guards (`CAN_VIEW_FINANCE`), finance mutation guards
      (`requireFinanceAccess`), Owner-only Settings pages, and role-home
      redirect (`/dashboard` now routes non-Owners to their role dashboard)
      — checked end-to-end by logging in as a non-privileged (Operations)
      test account and confirming Finance is inaccessible/hidden
- [x] Financial data testing: verified financial summary math, payment
      status transitions, and budget variance across the wedding detail
      page and global Finance/Reports views with real recorded transactions
- [x] Mobile/responsive testing: added a mobile navigation drawer
      (`MobileNav` + `NavLinks` shared with the desktop `Sidebar`) — the app
      previously had no way to navigate on screens under 768px; verified
      dashboard, forms and the new drawer render correctly at 375px width
- [x] Workflow testing: exercised the lead → client → wedding → functions →
      tasks → vendors → finance → guests → documents flow live in-browser
      across all phases of this build
- [x] Security review: confirmed uploaded-file paths use randomly
      generated names (no user-controlled path traversal), document
      downloads require an authenticated session, server actions validate
      input with Zod, and mutation actions enforce role checks server-side
      (not just hidden in the UI)
- [x] Backup & recovery documented in the root `README.md` (`pg_dump`/
      `pg_restore` commands, uploads directory backup)
- [x] Production deployment checklist documented in the root `README.md`

Known scope decision: the app is single-tenant per deployment (one
Organization, per the PRD's "private tool for one company" framing) and
does not enforce cross-organization data isolation — see README.

## Phase 9 — Remaining PRD surface ✅

- [x] Meetings UI (log/list) on lead, client and wedding detail pages
- [x] Communication notes UI (PRD §19.3) on lead, client and wedding detail pages
- [x] Proposals and Negotiations sections on the lead detail page
- [x] WhatsApp click-to-chat and phone click-to-call links (PRD §19.1/§19.2)
- [x] Vendor rating input wired into vendor create/edit
- [x] Owner-initiated password reset (temporary password shown once) plus
      self-service password change under Settings → Profile
