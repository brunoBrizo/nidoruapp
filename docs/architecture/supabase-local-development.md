# Supabase Local Development

This repo uses a local Supabase stack for development and Docker-backed integration tests. Production, staging, and development data must stay separate.

## Commands

- `pnpm supabase:start` starts the local stack.
- `pnpm supabase:status` prints local URLs and local keys.
- `pnpm supabase:db:reset` reapplies migrations and seed files.
- `pnpm supabase:db:lint` runs Supabase database linting against the local stack.
- `pnpm supabase:migrations:validate` validates that migrations and seeds replay from scratch.
- `pnpm supabase:migrations:list` checks local migration history.
- `pnpm supabase:test:db` runs pgTAP database convention tests.
- `pnpm supabase:functions:serve` serves the starter Edge Function locally.
- `pnpm supabase:functions:test` runs Deno tests for Edge Functions.

Supabase integration commands require Docker access. Run them outside the sandbox when the agent environment cannot access Docker.

## Environments

Development uses `http://127.0.0.1:54321` and local keys from `pnpm supabase:status`. Use `.env.example`, `apps/mobile/.env.example`, `apps/web/.env.example`, and `supabase/.env.local.example` as templates.

Staging and production must use separate Supabase projects. Do not paste staging or production secret keys into local `.env` files. Public clients may only use the publishable key for their own environment.

For the complete service-by-service environment contract, see [Environment Model](environment-model.md).

## Migration Rules

- Create migration files with `pnpm exec supabase migration new <name>`.
- Test migrations with `pnpm supabase:db:reset` before committing.
- Put seed-only data in `supabase/seed/*.sql`.
- Do not add production data to local seed files.
- Put security-definer helpers in private schemas such as `app_private`, never in `public`.

## RLS Conventions

- Every user-owned table has a `user_id`.
- Every table in exposed schemas has RLS enabled.
- Policies specify roles with `to authenticated` or `to anon`.
- User-owned policies use `(select auth.uid()) = user_id` and require an index on `user_id`.
- Update policies need a matching select policy.
- Views exposed to clients use `security_invoker = true`, or stay outside exposed schemas.
- The foundation migration installs a guard that enables RLS automatically for newly created `public` tables. This guard does not replace explicit grants, policies, or indexes.

## Edge Function Harness

`supabase/functions/foundation-health` is a public, non-sensitive health endpoint used to prove local Edge Function serving and tests. Keep webhook and service-to-service functions separate and validate provider signatures or internal keys inside those handlers.
