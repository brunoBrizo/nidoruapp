## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:

- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

## Security-first defaults

Build this app securely from the beginning. Treat sleep, breathwork, session history, account, billing, analytics, and device identifiers as sensitive user data.

For any code change that touches user input, authentication, authorization, database access, RLS policies, storage, network requests, file operations, local SQLite data, secrets, telemetry, CI/CD, or dependency/configuration changes:

- Use `code-security` before writing or reviewing the code.
- Use `owasp-security` for auth, API, access-control, injection, data-exposure, logging, and insecure-design checks.
- Use the relevant platform skill too, especially `supabase` and `supabase-postgres-best-practices` for Supabase/Postgres/RLS work and Expo skills for mobile runtime work.
- Define the security success criteria before implementation, including abuse cases and denied-access cases where relevant.
- Add or update tests for unauthorized, cross-user, invalid-input, and policy-denied behavior whenever those paths are affected.
- Never rely on client-side checks for authorization. Enforce authorization at the API, database policy, or server boundary.
- Never put service-role keys, secret API keys, signing secrets, private tokens, or privileged Supabase credentials in the mobile app, public web code, checked-in files, logs, Sentry events, PostHog events, screenshots, or generated artifacts.
- Keep local-first UX secure: store only the minimum needed locally, do not store secrets in SQLite, and avoid logging sensitive session details or identifiers.
- Prefer allowlists, typed validation, parameterized queries, least-privilege policies, short-lived tokens, and explicit ownership checks.
- For Supabase exposed schemas, enable RLS on every table and create policies that match the actual access model. Do not use user-editable metadata for authorization. Keep security-definer functions and privileged views out of exposed schemas unless the Supabase skill confirms the safe pattern.
- Before running tools that upload code, dependency inventory, secrets candidates, lockfiles, or scan results to external services, stop and get explicit user approval.

Security scan routing:

- Use `semgrep` for planned static analysis. Present target paths, scan mode, rulesets, output directory, and telemetry posture first; run Semgrep with metrics disabled.
- Use `ghost-scan-code` for deeper SAST review of code paths and OWASP classes.
- Use `ghost-scan-secrets` before commits, releases, or whenever env/config/auth files changed.
- Use `ghost-scan-deps` for dependency/CVE review of lockfiles.
- Use Codex Security skills for structured threat modeling, finding discovery, attack-path analysis, validation, and fix verification.

## Skill routing

Use current Codex session skills/plugins when relevant. Prefer exact skill names below when routing work.

Available plugins:

- Browser
- Build iOS Apps
- Build Web Apps
- Chrome
- ClickUp
- Cloudflare
- Codex Security
- Computer Use
- Documents
- Expo
- GitHub
- Google Drive
- Netlify
- OpenAI Developers
- Presentations
- Sentry
- Spreadsheets
- Supabase
- Superpowers
- Test Android Apps

General skills:

- Image generation/editing: `imagegen`
- OpenAI docs and API guidance: `openai-docs`
- Plugin creation: `plugin-creator`
- Skill creation: `skill-creator`
- Skill installation/discovery: `skill-installer`, `find-skills`
- Completion proof: `verification-before-completion`, `superpowers:verification-before-completion`

Web, frontend, and browser skills:

- Accessibility: `accessibility`
- Best practices: `best-practices`
- Browser automation: `browser:browser`, `chrome:Chrome`, `playwright`
- Core Web Vitals/performance: `core-web-vitals`, `performance`, `web-quality-audit`
- Frontend app build/test: `build-web-apps:frontend-app-builder`, `build-web-apps:frontend-testing-debugging`
- React/Next.js: `build-web-apps:react-best-practices`
- shadcn: `build-web-apps:shadcn`
- Stripe: `build-web-apps:stripe-best-practices`
- SEO: `seo`

Expo and mobile skills:

- Expo UI/navigation: `expo:building-native-ui`
- Expo API/data/auth/offline work: `expo:native-data-fetching`
- Expo API routes: `expo:expo-api-routes`
- Expo builds, deployment, and CI/CD: `expo:expo-deployment`, `expo:expo-cicd-workflows`, `expo:expo-dev-client`, `expo:codex-expo-run-actions`
- Expo modules and native UI bridges: `expo:expo-module`, `expo:expo-ui-jetpack-compose`, `expo:expo-ui-swift-ui`, `expo:use-dom`
- Expo styling/upgrades: `expo:expo-tailwind-setup`, `expo:upgrading-expo`
- Android QA/performance: `test-android-apps:android-emulator-qa`, `test-android-apps:android-performance`

iOS skills:

- App Intents: `build-ios-apps:ios-app-intents`
- Simulator debugging: `build-ios-apps:ios-debugger-agent`
- Performance/leaks: `build-ios-apps:ios-ettrace-performance`, `build-ios-apps:ios-memgraph-leaks`, `build-ios-apps:swiftui-performance-audit`
- SwiftUI UI/refactors: `build-ios-apps:swiftui-liquid-glass`, `build-ios-apps:swiftui-ui-patterns`, `build-ios-apps:swiftui-view-refactor`

Data, backend, hosting, and observability skills:

- Supabase/Postgres: `supabase`, `supabase-postgres-best-practices`, `supabase:supabase`, `supabase:supabase-postgres-best-practices`, `build-web-apps:supabase-postgres-best-practices`
- Sentry: `sentry:sentry`
- Netlify: `netlify:netlify-ai-gateway`, `netlify:netlify-blobs`, `netlify:netlify-caching`, `netlify:netlify-cli-and-deploy`, `netlify:netlify-config`, `netlify:netlify-deploy`, `netlify:netlify-edge-functions`, `netlify:netlify-forms`, `netlify:netlify-frameworks`, `netlify:netlify-functions`, `netlify:netlify-identity`, `netlify:netlify-image-cdn`
- Cloudflare: `cloudflare:agents-sdk`, `cloudflare:building-ai-agent-on-cloudflare`, `cloudflare:building-mcp-server-on-cloudflare`, `cloudflare:cloudflare`, `cloudflare:durable-objects`, `cloudflare:sandbox-sdk`, `cloudflare:web-perf`, `cloudflare:workers-best-practices`, `cloudflare:wrangler`
- OpenAI Developers: `openai-developers:agents-sdk`, `openai-developers:build-chatgpt-app`, `openai-developers:chatgpt-app-submission`, `openai-developers:openai-api-troubleshooting`, `openai-developers:openai-platform-api-key`

Repo, docs, and productivity skills:

- GitHub: `github:github`, `github:gh-address-comments`, `github:gh-fix-ci`, `github:yeet`
- Google Drive/Docs/Sheets/Slides: `google-drive:google-drive`, `google-drive:google-docs`, `google-drive:google-drive-comments`, `google-drive:google-sheets`, `google-drive:google-slides`
- Local documents/spreadsheets/presentations/PDFs: `documents:documents`, `spreadsheets:Spreadsheets`, `presentations:Presentations`, `pdf`
- Graphify: `graphify`
- Computer use: `computer-use:computer-use`

Security and agent workflow skills:

- Secure coding and OWASP: `code-security`, `owasp-security`
- Security scanning and triage: `semgrep`, `ghost-scan-code`, `ghost-scan-secrets`, `ghost-scan-deps`, `codex-security:security-scan`, `codex-security:threat-model`, `codex-security:finding-discovery`, `codex-security:attack-path-analysis`, `codex-security:validation`, `codex-security:fix-finding`
- Superpowers workflow: `superpowers:using-superpowers`, `superpowers:brainstorming`, `superpowers:writing-plans`, `superpowers:executing-plans`, `superpowers:test-driven-development`, `superpowers:systematic-debugging`, `superpowers:requesting-code-review`, `superpowers:receiving-code-review`, `superpowers:finishing-a-development-branch`, `superpowers:subagent-driven-development`, `superpowers:dispatching-parallel-agents`, `superpowers:using-git-worktrees`, `superpowers:writing-skills`
