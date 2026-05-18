# Feature: Local-First Offline Sync

Phase: MVP

## Summary

The critical sleep and breathwork experience must work locally before account creation, paywall, backend, or network. Local-first behavior protects the midnight use case, prevents lag, and makes first value reliable. Sync improves backup, personalization, and cross-device use later, but it cannot block breathwork, Rescue Me, audio, or local history.

## User Stories

- As a first-time user, I want to start breathing without signing in.
- As a bedtime user with weak network, I want sounds and sessions to work anyway.
- As a user who later creates an account, I want my local history preserved.
- As a user with sync failure, I want the app to keep working and retry later.

## MVP Scope

- Generate local install identity on launch.
- Store onboarding response, sessions, wind-down runs, check-ins, mixes, streak cache, media catalog state, and sync queue in SQLite.
- Store sensitive tokens or secure values in Secure Store.
- First breath and Rescue Me save locally before any backend call.
- Morning check-in confirms locally immediately.
- Supabase anonymous auth happens after first value or via non-blocking background retry.
- Sync is idempotent and maps server IDs back to local records.
- Failed sync never blocks breathwork, audio, haptics, local history, or Home.

## Out Of Scope

- Required account before first value.
- Custom backend API for simple safe reads/writes that Supabase RLS can handle.
- Real-time sync as a dependency for active sessions.
- Production data in local development.
- Health integrations in MVP.

## Acceptance Criteria

- First session works without account, paywall, backend dependency, or notification permission.
- Rescue Me starts offline from cold app state.
- Default sound pack plays offline.
- Morning check-in save confirms locally immediately.
- Normal online sync items sync within 5 minutes.
- Sync queue failure does not degrade core local flows.
- Anonymous auth retry preserves all local records.

## UX References

- [Product Strategy](../product/product-strategy.md)
- [MVP Scope and Roadmap](../product/mvp-scope-and-roadmap.md)
- [Onboarding Flow Screen-by-Screen](../ux/onboarding-flow-screen-by-screen.md)
- [Onboarding and Retention](../ux/onboarding-retention.md)

## Engineering References

- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Technical Foundation](../architecture/technical-foundation.md)
- [Supabase local development notes in Tech Stack](../architecture/tech-stack-proposal.md#testing-and-ci)

## Data And Backend Needs

- SQLite local tables or stores for:
  - Local install identity.
  - Onboarding response.
  - Breath session history.
  - Wind-down run history.
  - Morning check-ins.
  - Saved sound mixes.
  - Streak cache.
  - Downloaded media catalog state.
  - Sync queue.
- Supabase tables mirror user-owned records with RLS and `user_id`.
- `local_install_links` maps local install IDs to Supabase users.
- `sync_events` stores sync audit/debug events.

## Analytics Events

- `sync_failed`
- Existing feature events should fire from local success, not wait for server sync.

## Edge Cases And Failure States

- If user completes sessions before auth, later account linking must preserve local records.
- If network is unavailable, queue sync and keep local history visible.
- If remote IDs return after sync, map them to local records without duplicates.
- If subscription state cannot be fetched, do not interrupt active breathwork or audio.
- If media metadata cannot refresh, keep playable cached media.

## Task Checklist

- [ ] Add local install identity creation.
- [ ] Add SQLite migration runner.
- [ ] Add local onboarding response storage.
- [ ] Add local breath session storage.
- [ ] Add local wind-down run storage.
- [ ] Add local morning check-in storage.
- [ ] Add local saved mix storage.
- [ ] Add local streak cache.
- [ ] Add local media catalog state.
- [ ] Add sync queue.
- [ ] Add Supabase anonymous auth after first value.
- [ ] Add local-to-user mapping after auth.
- [ ] Add idempotent sync for each local record type.
- [ ] Add retry behavior for failed sync.
- [ ] Verify first session offline.
- [ ] Verify local records survive account linking.
