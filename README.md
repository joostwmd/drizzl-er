# drizzl-er

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Router, Hono, TRPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - UI primitives live in `apps/web` alongside the app
- **Hono** - Lightweight, performant server framework
- **tRPC** - End-to-end type-safe APIs
- **Node.js** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **SQLite/Turso** - Database engine
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

## Database Setup

This project uses SQLite with Drizzle ORM.

1. Start the local SQLite database (optional):

```bash
pnpm run db:local
```

2. Update your `.env` file in the `apps/server` directory with the appropriate connection details if needed.

3. Apply the schema to your database:

```bash
pnpm run db:push
```

Then, run the development server:

```bash
pnpm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).

## UI Customization

The frontend is a single Vite app (`apps/web`). Global design tokens and Tailwind live in one place:

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
│   ├── web/         # Frontend (React + TanStack Router + shadcn/ui)
│   └── server/      # Backend API (Hono, TRPC)
├── packages/
│   ├── api/                  # API layer / business logic
│   ├── db/                   # Database schema & queries
│   ├── drizzle-schema-graph/ # Schema → graph conversion (shared lib)
│   └── env/                  # Environment validation
```

## Available Scripts

- `pnpm run dev`: Start all applications in development mode
- `pnpm run build`: Build all applications
- `pnpm run dev:web`: Start only the web application
- `pnpm run dev:server`: Start only the server
- `pnpm run check-types`: Check TypeScript types across all apps
- `pnpm run db:push`: Push schema changes to database
- `pnpm run db:generate`: Generate database client/types
- `pnpm run db:migrate`: Run database migrations
- `pnpm run db:studio`: Open database studio UI
- `pnpm run db:local`: Start the local SQLite database
