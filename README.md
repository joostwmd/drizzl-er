# drizzl-er

Single-page app for visualizing **Drizzle ORM** schema source as entity–relationship diagrams. Everything runs in the browser (Vite + React).

## Features

- **TypeScript** — Type safety across the monorepo
- **TanStack Router** — File-based routing
- **Tailwind CSS** — Styling
- **shadcn/ui** — UI primitives in `apps/web`
- **React Flow** — Canvas for the diagram
- **@drizzl-er/drizzle-schema-graph** — Parses Drizzle-flavored TypeScript into graph data (no database)
- **Turborepo** — Monorepo tasks

## Getting Started

```bash
pnpm install
pnpm dev:web
```

Open the URL Vite prints (see `apps/web/vite.config.ts` for the dev port).

### Optional: GitHub link in the header

Set in `apps/web` (e.g. `.env.local`):

```bash
VITE_GITHUB_REPO_URL=https://github.com/your-org/your-repo
```

## UI Customization

The frontend lives in `apps/web`. Global design tokens and Tailwind live in one place:

- **Global CSS / theme tokens:** `apps/web/src/index.css`
- **shadcn-style components:** `apps/web/src/components/ui/*`
- **shadcn CLI config:** `apps/web/components.json` — the `"style"` field (e.g. `radix-nova`) is the **registry preset** used when you run `npx shadcn add`. It only affects **newly generated** files; it does not retroactively change existing components. Older presets such as **base-lyra** ship a lot of `rounded-none` in templates so corners ignore your `--radius` tokens. This project uses **`radix-nova`** plus theme radii (`rounded-md` / `rounded-lg` / etc.) so controls follow `index.css`.

### Add more components

Always run the CLI from `apps/web` so it reads `components.json` (style + `css: src/index.css`):

```bash
cd apps/web && npx shadcn@latest add accordion dialog popover sheet table
```

If a new component still looks square, either switch `"style"` in `components.json` to another registry preset or adjust the generated classes to use `rounded-md` / `rounded-lg` like the rest of the kit.

Import UI primitives with the `@/` alias:

```tsx
import { Button } from "@/components/ui/button";
```

## Project Structure

```
drizzl-er/
├── apps/
│   └── web/                  # Vite + React + TanStack Router
├── packages/
│   ├── drizzle-schema-graph/ # Schema → graph conversion
│   ├── env/                  # Vite env validation (@t3-oss/env-core)
│   └── config/               # Shared TypeScript config
```

## Scripts

- `pnpm run dev` — All packages’ `dev` tasks (usually just the web app)
- `pnpm run dev:web` — Web app only
- `pnpm run build` — Production build
- `pnpm run check-types` — Typecheck across workspaces
- `pnpm run test` — Tests (e.g. `drizzle-schema-graph`)
