# Grants Portal

A web application for managing community grant applications. Features a public-facing application form that can be embedded in external websites, and a protected admin portal for reviewing applications, updating statuses, adding comments, and managing admin users.

## Key Technologies

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start (React 19, TanStack Router) |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| Database | Netlify Database (managed Postgres) via Drizzle ORM |
| Authentication | Netlify Identity |
| Icons | Lucide React |
| Deployment | Netlify |

## Features

- **Public Grant Application Form** — Multi-section form collecting applicant details, project information, budget, and impact details. Designed to be embedded in external websites via iframe.
- **Admin Dashboard** — Overview of application statistics (total, by status, funding amounts).
- **Application Management** — Search, filter, and view applications. Update application status (Submitted, Under Review, Approved, Declined, More Info Needed).
- **Comments** — Admin users can add comments to individual applications for internal discussion.
- **Admin User Management** — Add and remove admin users by email. First authenticated user is automatically registered as admin.
- **Authentication** — Netlify Identity with email/password and OAuth (Google, GitHub). Microsoft/O365 SSO can be configured as an external OAuth provider in Netlify Identity settings.

## Running Locally

```bash
npm install
npm run dev
```

> **Note:** Authentication via Netlify Identity does not work on localhost. Deploy to Netlify (even a branch preview) to test the admin portal login flow.

## Embedding the Application Form

Add this iframe to any website to embed the grant application form:

```html
<iframe
  src="https://your-site.netlify.app/apply"
  width="100%"
  height="800"
  frameborder="0"
  style="border: none; max-width: 800px;"
></iframe>
```

## Project Structure

```
db/                     # Database schema and client
  schema.ts             # Drizzle ORM table definitions
  index.ts              # Database client initialization
drizzle.config.ts       # Drizzle Kit configuration
netlify/
  database/migrations/  # Auto-generated SQL migrations
  functions/            # Netlify Functions (Identity webhooks)
src/
  components/           # Reusable UI components
  lib/                  # Auth utilities and Identity context
  middleware/           # TanStack Start middleware (auth)
  routes/               # File-based routes
    admin/              # Admin portal pages
    admin.tsx           # Admin layout with sidebar and auth guard
    apply.tsx           # Public grant application form
    login.tsx           # Login page
    index.tsx           # Landing page
  server/               # Server functions (CRUD operations)
  styles.css            # Global styles with Tailwind
```

## Microsoft/O365 Authentication

Netlify Identity supports external OAuth providers. To enable Microsoft/O365 SSO:

1. Register an application in Azure Active Directory
2. Configure the OAuth provider in your Netlify site's Identity settings (Project configuration > Identity > External providers)
3. Users can then sign in using their O365 credentials

See the [Netlify Identity docs](https://docs.netlify.com/security/secure-access-to-sites/identity/) for detailed external provider configuration.
