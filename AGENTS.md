## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

## Skill routing

Use these skills when relevant:
- Expo mobile UI/navigation: `expo:building-native-ui`
- Expo API/data/auth/offline work: `expo:native-data-fetching`
- Expo builds, EAS, TestFlight/App Store/Play Store: `expo:expo-deployment`
- React Native performance: `vercel-react-native-skills`
- Next.js web app work: `next-best-practices` and `vercel-react-best-practices`
- Supabase schema, RLS, migrations, SQL, indexes: `supabase-postgres-best-practices`
- Browser/web verification: `webapp-testing`
- Sentry issue/release/source-map work: `sentry-cli`
- Before claiming work is complete: `verification-before-completion`