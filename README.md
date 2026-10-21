# OneEnergy – frontend mockup

A clickable mockup of OneEnergy Phase 1 (Dashboard, SIAP, SISKA, SI-CREW, E-DOC, SINAR, SIGUNA), built from `PRD-OneEnergy.md` and `TRD-OneEnergy.md`. It has no backend: all data is generated in the browser from a fixed seed, and "today" is pinned to 21 Oct 2026. Changes you make last until you reload the page.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static files in dist/
```

## Navigation

The home page shows one card per module (Dashboard, SIAP, SISKA, SI-CREW, E-DOC, SINAR, SIGUNA). A card opens the module page (`#/m/<module>`), which lists its features; a feature opens the screen itself, with a breadcrumb back. A module with a single feature (Dashboard) skips its module page and opens the feature (`#/dashboard`). Module renames from the PRD: SIMON → Dashboard, SIKA → SISKA, SIKRU → SI-CREW, SIDOK → E-DOC (Electronic Document). Cards and features the current role may not use are hidden. Modules and features are defined in `src/modules/registry.tsx`.

The search box in the navbar finds modules, features, vessels and crew by code, name or task (for example "renew", "sign on", "audit"); on phones it opens from the search icon. When nothing matches, searches and filtered tables show `public/not-found.jpg`. The vessel table has a Details button per row instead of clickable rows. The login page uses `public/tongkang.jpeg` as its background. Two-step sign-in (2FA) is not part of this mockup. Phase 2 to 4 modules (SIRAWAT, SILAYAR, SIPEKA, SIPENA, SIKEU, SILAPOR, SIPATUH, SIMITRA, SIGRASI) appear as cards under their phase; each opens an "under development" page (`public/develop.jpg`) with what the module will do and the gate it waits for.

The account menu (square avatar, top right) opens My profile (`#/profile`: details, permissions, own recent changes, change password) and the step-by-step user guide (`#/guide`, content in `src/modules/guideContent.ts`).

## Create, edit and delete

| Module | Create | Edit | Delete |
| --- | --- | --- | --- |
| SISKA | Add vessel (full particulars) | Edit vessel (from its Details page), Edit asset, Change status | Delete vessel: ends its pair, signs crew off, keeps documents |
| SI-CREW | Add crew member (with personal data), New contract, Sign on | Edit crew, Edit personal data | Delete crew member: signs them off, keeps documents |
| E-DOC | Add document, Renew (new version), New document type | Correct (fix a typo), Edit document type, Required documents | Delete document: the previous version becomes current |
| SIGUNA | New user, Add vessel type, Add rank | Edit user (several roles), Roles and permissions, Configuration, master data | Deactivate user (users are never deleted) |
| SINAR | — | Templates, recipients, escalation | — |

Every delete asks for a reason, and every change is written to the audit log. Document Admin can now add and edit vessels too (`vessel.write`), following the PRD onboarding step where the Document Admin fills in vessel data.

Every table pages at 10 rows (10, 25 or 50 per page); the operations board pages at 12 cards and the permission matrix shows one permission group at a time.

Layout and type (Atkinson Hyperlegible and Barlow Condensed, header bar, hero with the diagonal cut, bordered cards) follow `jiep_digi_ms/wwwroot/css`. Colours come from the logo in `public/logo.svg`: charcoal `#504E4E` for the header and hero, orange `#F36D25` for highlights, and a darker orange `#C2500F` for buttons and links so white text on them stays readable. Fonts are copied into `public/fonts`.

## Demo accounts

The app opens on the login page. Pick a demo account (any password works) and sign in; you return to the page you asked for. The session lasts for the browser tab: a refresh keeps you signed in, a new tab or Log out sends you back to the login page.

Once in, click the square avatar at the top right and use "Demo: view as another user" to switch roles. A link with `?as=<user id>` (e.g. `#/readiness?as=u-budi`) skips the login and opens as that user, which is handy for sharing a specific screen. The same menu has My profile, Read User Guidance and Log out.

| User | Role | What to show |
| --- | --- | --- |
| Hendra Wijaya (`u-hendra`) | Management | Fleet overview, 70-vessel grid, expiry buckets |
| Rina Wulandari (`u-rina`) | Document Admin | Task list, renewing a document |
| Sari Handayani (`u-sari`) | Crewing / HR | Personal data and contracts (the only role allowed to see them) |
| Budi Santoso (`u-budi`) | Operation | Readiness cards, departure-date check, vessel status |
| Andi Pratama (`u-andi`) | IT | Failed notifications, reassigning reminders, roles, audit log |
| Maya Kusuma (`u-maya`) | Asset | Vessel asset tab |

## A five-minute demo

1. As Hendra: open the Dashboard card. It shows how many vessels are ready, need attention or are not ready.
2. As Budi: open a red vessel, then use "Check a departure date" (+30 days) to see what will expire before departure.
3. As Rina: click "Renew" on an expired document and use the sample scan. The vessel turns green in SIAP and the dashboard numbers change straight away.
4. As Budi, open a crew member: the Personal and Contract tabs are locked. Switch to Sari to see them.
5. As Andi: the System dashboard flags reminders failing for an inactive user. Reassign them in SINAR, then see your own changes at the top of the audit log.

## Structure

- `src/data/` – types, master data (document types, ranks, roles, templates), seeded dummy data
- `src/lib/rules.ts` – document status and readiness rules (client copy of `vw_dokumen_status` / `fn_alasan_kesiapan`)
- `src/store.tsx` – in-memory store standing in for the API; every change writes an audit entry
- `src/modules/registry.tsx` – module cards and their features
- `src/modules/<module>/` – screens per module
- `src/i18n/en.ts` – shared UI vocabulary (English); page copy is still inline
