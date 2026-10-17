# Cloudflare Workers OpenAPI 3.1

This is a Cloudflare Worker with OpenAPI 3.1 using [chanfana](https://github.com/cloudflare/chanfana) and [Hono](https://github.com/honojs/hono).

This is an example project made to be used as a quick start into building OpenAPI compliant Workers that generates the
`openapi.json` schema automatically from code and validates the incoming request to the defined parameters or request body.

## Get started

1. Sign up for [Cloudflare Workers](https://workers.dev). The free tier is more than enough for most use cases.
2. Clone this project and install dependencies with `npm install`
3. Run `wrangler login` to login to your Cloudflare account in wrangler
4. Run `wrangler deploy` to publish the API to Cloudflare Workers

## Project structure

1. Your main router is defined in `src/index.ts`.
2. Each endpoint has its own file in `src/endpoints/`.
3. For more information read the [chanfana documentation](https://chanfana.pages.dev/) and [Hono documentation](https://hono.dev/docs).

## Authentication

All `/api/*` routes require a JWT `Bearer` token, except `POST /api/auth/login`.

Setup:

1. Local secret lives in `.dev.vars` (see `.dev.vars.example`). For production run:
   `npx wrangler secret put AUTH_SECRET`
2. Apply migrations: `npm run db:migrate:local` (or `db:migrate:remote`)
3. Seed a user (no registration endpoint):
   `npm run seed:user -- --email admin@example.com --name Admin --password secret123`
   Add `--remote` to seed the production database.

Usage:

```bash
# Login -> returns { token, token_type, expires_in }
curl -X POST http://localhost:8787/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"secret123"}'

# Call a protected route
curl http://localhost:8787/api/tasks \
  -H 'Authorization: Bearer <token>'

# Current user
curl http://localhost:8787/api/auth/me \
  -H 'Authorization: Bearer <token>'
```

Passwords are hashed with PBKDF2-SHA256 via WebCrypto (`src/shared/password.ts`). The
iteration count is tuned to fit the Workers Free plan 10 ms CPU budget; see the comment
in that file for details.

## Development

1. Run `wrangler dev` to start a local instance of the API.
2. Open `http://localhost:8787/` in your browser to see the Swagger interface where you can try the endpoints.
3. Changes made in the `src/` folder will automatically trigger the server to reload, you only need to refresh the Swagger interface.
