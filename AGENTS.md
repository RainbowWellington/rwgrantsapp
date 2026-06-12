# AGENTS.md

This document provides an overview of the project structure for developers and AI agents working on this codebase.

## Project Overview

A Grants Portal application with a public-facing grant application form (embeddable via iframe) and a protected admin portal for managing applications, updating statuses, adding comments, and managing admin users. Authentication is handled by Netlify Identity.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start |
| Frontend | React 19, TanStack Router v1 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| Database | Netlify Database (Postgres) via Drizzle ORM |
| Authentication | Netlify Identity (@netlify/identity) |
| Icons | Lucide React |
| Language | TypeScript 5.7 (strict mode) |
| Deployment | Netlify |

## Directory Structure

```
├── db/
│   ├── schema.ts              # Drizzle ORM table definitions (applications, comments, adminUsers)
│   └── index.ts               # Database client initialization (drizzle-orm/netlify-db)
├── drizzle.config.ts          # Drizzle Kit config (migrations output to netlify/database/migrations)
├── netlify/
│   ├── database/
│   │   └── migrations/        # Auto-generated SQL migrations (DO NOT edit applied migrations)
│   └── functions/
│       └── identity-signup.ts # Netlify Identity webhook for new user signups
├── src/
│   ├── components/
│   │   ├── CallbackHandler.tsx # Handles OAuth redirect tokens in URL hash
│   │   └── StatusBadge.tsx    # Application status badge component + status constants
│   ├── lib/
│   │   ├── auth.ts            # getServerUser server function for SSR auth
│   │   └── identity-context.tsx # Client-side React context for Netlify Identity
│   ├── middleware/
│   │   └── identity.ts        # TanStack Start middleware (identityMiddleware, requireAuthMiddleware)
│   ├── routes/
│   │   ├── __root.tsx         # Root layout: IdentityProvider, CallbackHandler, global styles
│   │   ├── index.tsx          # Landing page with links to apply and admin login
│   │   ├── apply.tsx          # Public grant application form (embeddable via iframe)
│   │   ├── login.tsx          # Login page (email/password + OAuth)
│   │   ├── admin.tsx          # Admin layout with sidebar, auth guard, auto-register first admin
│   │   └── admin/
│   │       ├── index.tsx      # Admin dashboard with application statistics
│   │       ├── applications.tsx # Applications list with search and status filter
│   │       ├── applications/
│   │       │   └── $id.tsx    # Application detail: view data, change status, add comments
│   │       └── users.tsx      # Admin user management (add/remove by email)
│   ├── server/
│   │   ├── applications.ts   # Server functions: submit, list, get, update status, stats
│   │   ├── comments.ts       # Server functions: get and add comments
│   │   └── admin-users.ts    # Server functions: CRUD admin users, auto-register first admin
│   ├── router.tsx             # TanStack Router setup
│   └── styles.css             # Global Tailwind CSS styles
├── .env                       # VITE_NETLIFY_SITE_URL for Netlify Identity
├── netlify.toml               # Build config + headers for iframe embedding
├── package.json
├── tsconfig.json
└── vite.config.ts             # Vite plugins: TanStack Start, React, Tailwind, Netlify
```

## Key Concepts

### Authentication Architecture

- **Netlify Identity** handles user authentication via the `@netlify/identity` package
- Server-side auth: `getServerUser()` reads the `nf_jwt` cookie during SSR
- Client-side auth: `useIdentity()` hook from `IdentityProvider` context
- Admin authorization: checked against the `admin_users` database table
- First user to log in is automatically registered as admin (bootstrap flow)
- Microsoft/O365 SSO can be added by configuring an external OAuth provider in Netlify Identity settings

### Database Schema

Three tables in Netlify Database (Postgres):
- `applications` — Grant application submissions with all form fields and status
- `comments` — Admin comments linked to applications via foreign key
- `admin_users` — Email-based admin authorization list

Schema changes require running `npx drizzle-kit generate` to create migrations in `netlify/database/migrations/`.

### Embeddable Form

The `/apply` route is designed to work inside an iframe. The `netlify.toml` includes permissive `X-Frame-Options` and `Content-Security-Policy` headers for this route.

### Application Statuses

- `submitted` — Initial status when applicant submits
- `under_review` — Admin has started reviewing
- `approved` — Grant approved
- `declined` — Grant declined
- `more_info_needed` — Additional information requested

### File-Based Routing (TanStack Router)

Routes are defined by files in `src/routes/`:
- `__root.tsx` — Root layout wrapping all pages
- `index.tsx` — Route for `/`
- `admin.tsx` — Layout route for `/admin/*` (renders sidebar + Outlet)
- `admin/*.tsx` — Child routes under the admin layout

### Server Functions

All database operations go through TanStack Start server functions in `src/server/`. These use the `requireAuthMiddleware` for admin-only operations. The public `submitApplication` function has no auth requirement.

## Development Commands

```bash
npm run dev              # Start dev server (port 3000, Netlify dev on 8888)
npx drizzle-kit generate # Generate migrations after schema changes
```

## Conventions

### Naming
- Components: PascalCase
- Server functions: camelCase
- Routes: kebab-case files
- Database columns: snake_case (Postgres convention)

### Styling
- Tailwind CSS utility classes
- Consistent rounded corners (rounded-lg, rounded-xl, rounded-2xl)
- Indigo as primary color, gray for neutrals

### TypeScript
- Strict mode enabled
- Import paths use `@/` alias
- `.js` extension in imports for ES module compatibility

### State Management
- React hooks for local state
- Server functions for data fetching
- No global client-side store needed
