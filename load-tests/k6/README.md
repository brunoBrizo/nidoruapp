# k6 Backend Load-Test Scaffold

This scaffold reserves the backend load-test entry points for RevenueCat webhooks, sync, catalog, and entitlement paths. It is intentionally not a CI gate until those endpoints exist.

Run it against a local or staging backend with:

```sh
BASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=local-service-role-key pnpm loadtest:k6:backend
```
