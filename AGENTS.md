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

Use current Codex session skills/plugins when relevant. Treat the lists below as routing rules, not a checklist to load all matching skills.

Routing workflow:

1. Identify the work surface first: repo/codebase reasoning, UI, Expo/mobile runtime, React Native performance, Supabase/Postgres, security, CI/CD, observability, growth/content, documents/media, or final verification.
2. Check project-local skills before global/plugin skills. If `.agents/skills/<skill-name>/SKILL.md` exists, prefer that exact skill for matching work even when a similarly named global skill is visible.
3. Load the smallest useful set. Use one primary skill for the main surface, then add platform, security, or verification skills only when the task actually crosses those boundaries.
4. Announce the skill choices briefly before using them, including why each one applies. If an obvious skill is intentionally skipped, say why.
5. If a skill or plugin is listed in this file but not visible in the current session, use the current session's discovery mechanism when available. If discovery cannot expose it, read the project-local `SKILL.md` directly when it exists, otherwise continue with the closest available fallback and state the gap.

Project-local skill rules:

- Project-local skills live under `.agents/skills/` and are tracked in `skills-lock.json`.
- When a task matches a project-local skill, prefer the exact local skill name over a similarly named global/plugin skill.
- If the current Codex session does not list a local skill that exists in `.agents/skills/`, read `.agents/skills/<skill-name>/SKILL.md` directly and follow it.
- Keep routing specific: use the narrowest matching skill instead of loading broad adjacent skills.
- Re-check `skills-lock.json` and `.agents/skills/` when updating this routing section because the local inventory can change between sessions.

Repo and source-of-truth routing:

- For architecture, dependency, or cross-module questions, start with `graphify-out/GRAPH_REPORT.md` and `graphify-out/wiki/index.md` when present, then inspect the actual code/docs needed to verify the answer.
- For "how does X relate to Y" questions, prefer `graphify query`, `graphify path`, or `graphify explain` before text search.
- For implementation tasks, use Graphify for orientation, then verify behavior against live source files and tests. Do not rely only on the graph when changing code.
- After modifying code or docs in this repo, run `graphify update .` unless the user explicitly says not to.

UI/frontend work:

- For any task that creates, changes, or reviews UI, screens, components, visual styling, layout, or interaction details, always check the UI impact before completion.
- Use `frontend-design` as the primary skill for layout, hierarchy, visual language, and design-system direction.
- Pair `make-interfaces-feel-better` with `frontend-design` when the task includes polish details: typography, spacing, surfaces, motion, hit areas, optical alignment, empty states, and interaction feel.
- Add project-local `ui-ux-pro-max` when the task needs deeper UX/product-pattern reasoning, mobile flow structure, accessibility/touch checks, design systems, or cross-platform consistency.
- Add `expo:building-native-ui` for Expo UI/navigation implementation, and add `vercel-react-native-skills` or `react-native-best-practices` when React Native performance, native components, lists, images, animations, or state subscriptions are involved.
- Use `imagegen-frontend-mobile` only when the requested output is a mobile app concept image, screen render, flow mockup, or visual direction artifact. Do not use it for code implementation.
- Verify the rendered UI when feasible: use Browser/Playwright for local web targets, Expo/Test Android/iOS simulator tooling for mobile targets, or state exactly what blocked visual verification.

Security-sensitive work:

- Apply the `Security-first defaults` section before coding whenever the change touches user input, auth, authorization, database access, local SQLite, storage, network calls, secrets, telemetry, CI/CD, dependency/configuration, or file operations.
- Use `code-security` for secure implementation review and `owasp-security` for auth, API, access-control, injection, data exposure, logging, and insecure-design checks.
- Add `supabase` and `supabase-postgres-best-practices` for Supabase, Postgres, RLS, SQL, migrations, and database performance. Include denied-access, cross-user, invalid-input, and policy-denied tests when those paths are affected.
- Use `semgrep` only for planned static analysis after presenting target paths, rulesets, output directory, scan mode, and metrics/telemetry posture.
- Use `ghost-scan-secrets` before commits/releases or when env/config/auth files changed; use `ghost-scan-deps` for dependency/CVE review; use `ghost-scan-code` for deeper code-path SAST.
- Stop for explicit user approval before running tools that upload code, dependency inventory, lockfiles, secrets candidates, or scan results to external services.

Expo, mobile runtime, and React Native routing:

- Use `expo:native-data-fetching` for API calls, auth flows, offline/local-first data, request lifecycles, and mobile data synchronization.
- Use `expo:expo-api-routes` only when implementing or reviewing Expo Router API routes.
- Use `expo:expo-deployment`, `expo:expo-cicd-workflows`, `expo:expo-dev-client`, or `expo:codex-expo-run-actions` for builds, EAS profiles, submissions, native dev clients, and CI/CD.
- Use `expo:expo-module`, `expo:expo-ui-swift-ui`, `expo:expo-ui-jetpack-compose`, or `expo:use-dom` only for native module/bridge work or platform-native UI surfaces.
- Use `react-native-best-practices` for React Native runtime performance: JS/render work, lists, images, native memory, bundle size, FPS, TTI, jank, and profiling.
- Use `vercel-react-native-skills` for implementation patterns and reviews around navigation, native dependencies, design-system components, pressables, lists, animations, Reanimated, and React Compiler constraints.
- Use `test-android-apps:android-emulator-qa` or `test-android-apps:android-performance` when Android emulator proof, screenshots, logs, or device-performance evidence is required.

Data, backend, hosting, and observability routing:

- Supabase/Postgres: use project-local `supabase` first, then `supabase-postgres-best-practices` for schema, RLS, SQL, indexes, migrations, locks, query plans, or performance. Also apply `code-security` and `owasp-security` for exposed data or access-control paths.
- Sentry: use `sentry:sentry` for inspecting Sentry issues/events and for observability workflow questions. For telemetry code changes, also apply the security defaults to avoid leaking sensitive session, account, device, or health-adjacent data.
- Netlify/Cloudflare: use the narrowest hosting skill for the platform and task, such as config, deploy, functions, caching, image CDN, Workers, Durable Objects, or Wrangler. Verify current platform docs for deployment syntax or vendor behavior that may have changed.
- OpenAI Developers: use OpenAI-specific skills only for OpenAI API, Agents SDK, ChatGPT app, troubleshooting, or API key setup work.

Growth, launch, App Store, and monetization routing:

- Use growth skills only when the request is about acquisition, launch, public content, conversion, retention, monetization, App Store presence, or growth measurement. Do not load them for ordinary implementation work.
- Use `aso` for App Store metadata and organic app discovery, `seo-audit` for diagnosing existing search issues, `seo` for general search optimization, `ai-seo` for LLM/AI-search visibility, and `programmatic-seo` for scaled SEO page systems.
- Use `marketing-psychology`, `product-marketing`, `copywriting`, or `copy-editing` for positioning, public copy, launch messaging, onboarding/paywall copy, and conversion-focused text.
- Use `analytics`, `cro`, `ab-testing`, `signup`, `onboarding`, `paywalls`, `pricing`, `referrals`, `churn-prevention`, `emails`, `lead-magnets`, and `popups` only for growth funnel, monetization, retention, or experiment work.
- Use `cold-email`, `sales-enablement`, and `revops` only for B2B or partnership motions.

Repo, docs, media, and productivity routing:

- Use `github:github` for GitHub repo, issue, PR, and release workflows; `github:gh-address-comments` for review comments; `github:gh-fix-ci` for failing GitHub CI; and `github:yeet` only when the user asks to publish local changes.
- Use `github-actions-docs` for GitHub Actions syntax, workflows, permissions, caching, matrixes, and CI/CD YAML. Pair it with platform deployment skills when CI/CD touches Expo, Netlify, Cloudflare, or other vendors.
- Use Google Drive skills only for connected Drive/Docs/Sheets/Slides work. Use local `documents:documents`, `spreadsheets:Spreadsheets`, `presentations:Presentations`, and `pdf` for local files in those formats.
- Use `imagegen` for raster image generation/editing; `imagegen-frontend-mobile` for mobile app UI renders; `hyperframes` or `video` for generated motion/video assets; and `image` for marketing image work.
- Use `computer-use:computer-use`, Browser, or Chrome only when the user asks for local app/browser interaction or when rendered verification requires it.

Verification and workflow routing:

- Use `verification-before-completion` or `superpowers:verification-before-completion` before claiming work is complete, fixed, passing, or ready.
- Use `superpowers:test-driven-development` when adding a feature or bugfix where a focused test can define the desired behavior before implementation.
- Use `superpowers:systematic-debugging` when investigating an unexpected failure, flaky test, regression, or unclear runtime behavior.
- Use `superpowers:writing-plans` for multi-step implementation plans and `superpowers:executing-plans` when following an existing written plan.
- Use subagent workflow skills only when the user explicitly asks for agents, delegation, or parallel agent work.

The remaining lists are a quick-reference inventory. Route with the rules above first.

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
- Mobile app screen/flow image generation: `imagegen-frontend-mobile`
- Marketing image/video content: `image`, `video`, `hyperframes`
- OpenAI docs and API guidance: `openai-docs`
- Plugin creation: `plugin-creator`
- Skill creation: `skill-creator`
- Skill installation/discovery: `skill-installer`, `find-skills`
- Completion proof: `verification-before-completion`, `superpowers:verification-before-completion`

Web, frontend, and browser skills:

- Accessibility: `accessibility`
- Best practices: `best-practices`
- Browser automation: `browser:browser`, `chrome:Chrome`, `playwright`, `browser-use`
- Core Web Vitals/performance: `core-web-vitals`, `performance`, `web-quality-audit`
- Frontend app build/test: `build-web-apps:frontend-app-builder`, `build-web-apps:frontend-testing-debugging`
- Frontend design and UI polish: `frontend-design`, `make-interfaces-feel-better`, `ui-ux-pro-max` (use together for UI work when relevant)
- React/Next.js: `build-web-apps:react-best-practices`
- shadcn: `build-web-apps:shadcn`
- Stripe: `build-web-apps:stripe-best-practices`
- Site architecture and schema: `site-architecture`, `schema`
- SEO: `seo` for general search optimization, `seo-audit` for technical/on-page SEO audits and ranking diagnostics, `ai-seo` for AI search visibility and LLM citations, and `programmatic-seo` for SEO pages at scale

Expo and mobile skills:

- Expo UI/navigation: `expo:building-native-ui`
- Expo API/data/auth/offline work: `expo:native-data-fetching`
- Expo API routes: `expo:expo-api-routes`
- Expo builds, deployment, and CI/CD: `expo:expo-deployment`, `expo:expo-cicd-workflows`, `expo:expo-dev-client`, `expo:codex-expo-run-actions`
- Expo modules and native UI bridges: `expo:expo-module`, `expo:expo-ui-jetpack-compose`, `expo:expo-ui-swift-ui`, `expo:use-dom`
- Expo styling/upgrades: `expo:expo-tailwind-setup`, `expo:upgrading-expo`
- React Native implementation/performance: `react-native-best-practices`, `vercel-react-native-skills` for components, lists, images, animations, state subscriptions, native dependencies, bundle size, memory, FPS, TTI, and jank investigations
- Android QA/performance: `test-android-apps:android-emulator-qa`, `test-android-apps:android-performance`

Growth, launch, App Store, and monetization skills:

- Use these only when the request is about acquisition, launch, public content, conversion, retention, monetization, App Store presence, or growth measurement; do not load them for ordinary implementation work.
- Product and customer research: `customer-research`, `competitor-profiling`, `competitors`, `product-marketing`, `marketing-psychology`
- App Store and organic discovery: `aso`, `seo`, `seo-audit`, `ai-seo`, `schema`, `site-architecture`, `programmatic-seo`
- Launch and acquisition: `launch`, `marketing-ideas`, `directory-submissions`, `community-marketing`, `social`, `content-strategy`, `copywriting`, `copy-editing`, `image`, `video`, `hyperframes`, `ads`, `ad-creative`, `co-marketing`
- Conversion, monetization, and retention: `analytics`, `cro`, `ab-testing`, `signup`, `onboarding`, `paywalls`, `pricing`, `referrals`, `churn-prevention`, `emails`, `lead-magnets`, `free-tools`, `popups`
- B2B or partnership motions only: `cold-email`, `sales-enablement`, `revops`

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
- GitHub Actions documentation: `github-actions-docs`
- Google Drive/Docs/Sheets/Slides: `google-drive:google-drive`, `google-drive:google-docs`, `google-drive:google-drive-comments`, `google-drive:google-sheets`, `google-drive:google-slides`
- Local documents/spreadsheets/presentations/PDFs: `documents:documents`, `spreadsheets:Spreadsheets`, `presentations:Presentations`, `pdf`
- Graphify: `graphify`
- Computer use: `computer-use:computer-use`

Security and agent workflow skills:

- Secure coding and OWASP: `code-security`, `owasp-security`
- Security scanning and triage: `semgrep`, `ghost-scan-code`, `ghost-scan-secrets`, `ghost-scan-deps`, `codex-security:security-scan`, `codex-security:threat-model`, `codex-security:finding-discovery`, `codex-security:attack-path-analysis`, `codex-security:validation`, `codex-security:fix-finding`
- Superpowers workflow: `superpowers:using-superpowers`, `superpowers:brainstorming`, `superpowers:writing-plans`, `superpowers:executing-plans`, `superpowers:test-driven-development`, `superpowers:systematic-debugging`, `superpowers:requesting-code-review`, `superpowers:receiving-code-review`, `superpowers:finishing-a-development-branch`, `superpowers:subagent-driven-development`, `superpowers:dispatching-parallel-agents`, `superpowers:using-git-worktrees`, `superpowers:writing-skills`
