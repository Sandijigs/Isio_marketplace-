# Isio

**Africa's makers. The world's market.**

Isio (Urhobo for *stars*) is a marketplace where African creatives sell handmade work and creative services to buyers anywhere in the world. AI turns a photo and a few words, in English, Pidgin or the creative's own language, into a listing buyers understand. Buyers pay through PayPal, straight into the creative's own account.

Built for the [PayPal AI Hackathon 2026](https://paypalaihackathon.devpost.com/). New project, started 4 October 2026.

## Why

In January 2026 PayPal reopened Nigeria through a partnership with Paga: Nigerians can now receive PayPal payments and withdraw them in naira. But access isn't income. A beadworker in Warri still has no storefront, no English product description, no sense of how to price for a buyer in Toronto, and no way to be found. Isio closes that gap.

## How it works

**For creatives:** photograph a piece, say a few words about it, and Isio drafts the listing (title, story in your voice, category, a suggested price with the reasoning). You change anything and publish. Services work too: buyers send a commission request, Isio organises it into a clear brief, you send a quote, and the deposit and balance are paid through PayPal.

**For buyers:** browse, or tell the shopping assistant what you're looking for. Pay with PayPal. The creative is paid directly; Isio never holds the money.

## How Isio uses PayPal

- **PayPal Orders v2** (create, approve, capture) with each order paid directly to the creative's PayPal account (`payee`).
- **Webhooks**, verified with PayPal's signature check, as the source of truth for captures, denials and refunds.
- **JS SDK v6** buttons for in-context checkout (planned).
- **PayPal Agent Toolkit** via MCP for the creative's copilot: tracking and dispute drafts (stretch).

## How Isio uses AI

- **Listing studio:** Claude (via the Vercel AI SDK) reads the photos and the creative's notes and returns a structured draft. It never invents materials, history or cultural claims, and nothing is published without the creative's edits and approval.
- **Commission briefs:** turns a buyer's free-form request into deliverables, measurements, deadline and the questions the creative should ask.
- **Shopping assistant (agentic commerce):** searches the catalogue with tools, explains its picks, and prepares a PayPal checkout. The buyer always approves the payment in PayPal; the agent can't.
- Every AI call is logged so creatives can see exactly what was drafted.

## Status

Early build, developed in public during the hackathon.

- [x] Foundation: app, database, payment and AI providers with demo modes, tests
- [x] Design system and landing page (phone and desktop)
- [ ] Accounts, creative profiles and storefronts
- [ ] Listings and browse
- [ ] PayPal checkout end to end (sandbox)
- [ ] AI listing studio
- [ ] Commissions
- [ ] Shopping assistant
- [ ] Hosted demo

## Run it locally

You need Node.js 22 or newer and pnpm (`corepack enable pnpm`).

```bash
pnpm install
pnpm db:migrate   # creates the embedded database in ./.data
pnpm dev          # http://localhost:3000
```

That's all. With no configuration Isio runs in **demo mode**: an embedded Postgres database, simulated PayPal payments and simulated AI drafts, clearly labelled on screen. Check what's live at [localhost:3000/api/health](http://localhost:3000/api/health).

### Use the real PayPal sandbox and live AI

Copy `.env.example` to `.env.local` and fill in what you have:

- **PayPal sandbox:** `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`. Step-by-step in [docs/PAYPAL_SETUP.md](docs/PAYPAL_SETUP.md).
- **AI:** `ANTHROPIC_API_KEY`.
- **Database:** `DATABASE_URL` for a hosted Postgres (Supabase, Neon). Optional locally.

Restart `pnpm dev`. Each integration switches on as soon as its keys are present.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the app in development |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm test` | Run the tests (offline, no keys needed) |
| `pnpm typecheck` / `pnpm lint` | Type and lint checks |
| `pnpm db:generate` | Create a migration after changing `src/db/schema.ts` |
| `pnpm db:migrate` | Apply migrations (embedded DB or `DATABASE_URL`) |

## Tech

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Drizzle ORM with PGlite (embedded) or Postgres, PayPal Orders v2 REST API, Vercel AI SDK with Claude, Vitest.

## Project structure

```
src/
  app/               pages and API routes (fonts/ holds the self-hosted typeface)
  assets/demo/       sample photos for the landing page
  components/
    landing/         landing page sections
    site/            header, footer, logo
    ui/              small shared building blocks
  db/                schema, client, migrations runner
  lib/               env and money helpers
  services/
    catalog/         creatives, listings, browse
    commerce/        checkout, orders, commissions, webhooks
    payments/        PayPal Orders v2 client and demo provider
    ai/              Claude provider, demo provider, prompts, schemas
  types/shared.ts    shared data shapes
drizzle/             SQL migrations
docs/                setup guides
```

## Credits

- Typeface: [Bricolage Grotesque](https://github.com/ateliertriay/bricolage) by Mathieu Triay, under the SIL Open Font License (`src/app/fonts/OFL.txt`).
- Photos in `src/assets/demo/` are used with permission for the demo. Maker names and towns shown with them are samples.

## License

Code: [MIT](LICENSE). The photos in `src/assets/demo/` are not covered by the MIT licence; their rights stay with their owners.
