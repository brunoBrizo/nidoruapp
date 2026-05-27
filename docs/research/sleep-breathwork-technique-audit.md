# Sleep and breathwork technique audit

Date: 2026-05-26

Scope: Current documentation and implementation for sleep, wind-down, Rescue Me, breathing, ambient sound, and related relaxation techniques. This is product guidance, not medical advice or a clinical protocol.

## Evidence baseline

- Chronic insomnia treatment is not the product's current claim surface. ACP recommends CBT-I as the initial treatment for chronic insomnia, and AASM recommends multicomponent CBT-I for chronic insomnia with conditional support for relaxation therapy as one component. The app should keep its wellness positioning unless it later builds a clearly clinical CBT-I program with clinician-grade safety, exclusion, and escalation flows.
- Slow breathing before bedtime has plausible and growing evidence as a low-cost sleep-conducive relaxation technique. A 2026 systematic review found better self-reported sleep duration and quality across small studies, while objective sleep outcomes were mixed. This supports calm, careful claims, not guaranteed sleep improvement.
- Breathwork for stress and mood has broader support than breathwork for objectively improving sleep. A 2023 meta-analysis of randomized controlled trials found breathwork associated with lower self-reported stress versus controls, but the effect base is heterogeneous.
- Coherent or resonant breathing around the 5-6 breaths/min family remains a reasonable daily practice pattern. Use the exact app cadence consistently: 5.5s inhale and 5.5s exhale.
- Cyclic sighing / physiological sigh has promising acute-arousal and mood evidence from a 2023 randomized trial, but it is not yet a proven sleep or panic-treatment protocol. Keep it post-MVP or present it as an optional short reset with careful safety copy.
- Continuous white/pink/brown noise is defensible as masking and user preference. Systematic reviews do not support strong sleep-improvement claims. Avoid implying special clinical efficacy for 432 Hz tones, binaural/delta tracks, or colored noise.

## Current implementation check

| Technique | Current app use | Assessment | Decision |
| --- | --- | --- | --- |
| 4-7-8 Sleep | `packages/domain/src/index.ts` defines 4s inhale, 7s hold, 8s exhale for sleep and Rescue Me | Reasonable as a long-exhale bedtime cadence, but evidence is thinner than general slow breathing and breath holds can feel bad for some users | Keep. Use "bedtime relaxation" language. Add a future hold-skip or "stop if dizzy/uncomfortable" guardrail before making it more prominent |
| Box Breathing | 4/4/4/4, calm/focus and racing-thoughts wind-down | Reasonable grounding pattern. Sleep-specific and anxiety-treatment claims are too strong | Keep for calm/focus. Avoid "military-grade" and "anxiety control" claims |
| Coherent Breathing / Daily Calm | Domain uses 5.5s in / 5.5s out for Daily Calm and wake-up-fewer-times wind-down | Aligned with slow/resonant breathing practice; some UI copy drifted to 5s or 4.5s | Keep and standardize all visible copy to 5.5 in / 5.5 out |
| Diaphragmatic Breathing | 4s inhale / 6s exhale, stress reset | Good low-risk stress relaxation option; less direct as a sleep treatment | Keep. Consider offering it as an easier alternative when users dislike breath holds |
| Physiological Sigh | Domain marks it post-MVP and not in current library | Promising for short acute arousal reduction, but not enough to replace established MVP flows | Keep post-MVP. If introduced, use "short reset" copy and validate safety/comfort first |
| Body scan / body relaxation | Wind-Down docs and UI include a body relax step | Strong fit for bedtime wind-down, especially when thoughts feel busy | Expand before adding more breath techniques. Prefer progressive muscle relaxation or simple body scan copy over diagnostic insomnia language |
| Ambient sound / colored noise | Sleep Sound Mixer includes nature, white/pink/brown noise, 432 Hz tone, and delta-wave binaural | Good for masking and preference; weak evidence for broad sleep claims | Keep as preference tools. Do not sell tones or binaural tracks as scientifically proven sleep enhancers |
| Sleep stories | Post-MVP low-stimulation narrative content | Reasonable cognitive-distraction and routine-support pattern | Keep post-MVP with low-stimulation UX and no treatment claims |

## Documentation updates from this audit

- Standardized documentation guidance for coherent breathing around the domain cadence: `5.5 in · 5.5 out`.
- Replaced documentation language that implied deterministic nervous-system, panic, anxiety, insomnia, HRV, sound-frequency, or guaranteed sleep outcomes with softer wellness, routine, preference, and self-observed-pattern language.
- Softened product and source-document claims around 4-7-8, box breathing, physiological sigh, body scan, sequential wind-down benefits, insight cards, sound mixer copy, challenges, sleep stories, onboarding, and growth/App Store wording.

## Final app-copy alignment check

The built Feature 01-05 app surfaces have been re-checked against this audit. Home, Breathe, onboarding personalization, first-session reflection, Rescue Me, Wind-Down, shared i18n strings, and shared domain copy now avoid diagnostic, treatment, deterministic sleep, autonomic, panic-outcome, and special sound-frequency efficacy claims.

Remaining risky terms in code search are limited to internal identifiers, validation schemas, tests, source quotes, or explicit guardrails. For example, `anxiety_relief` remains a local plan identifier, `daily_practice_hrv` remains internal taxonomy, and 432 Hz / delta-wave sound IDs remain catalog identifiers without efficacy copy.

## Recommended next product changes

- Add a short safety affordance for hold-based breathing: "Skip holds or stop if you feel dizzy, breathless, or uncomfortable." Make it visible before 4-7-8 becomes a first-run default for more users.
- Add an alternate no-hold fallback for Rescue Me and bedtime, likely diaphragmatic or coherent breathing, for users who find 4-7-8 activating.
- Make the Wind-Down "racing thoughts" branch more explicitly body-scan or progressive-muscle-relaxation oriented. This is a better evidence fit than adding more breath patterns.
- Keep the product's "not CBT-I / not medical treatment" positioning. If persistent insomnia, suspected sleep apnea, severe anxiety, pregnancy, cardiopulmonary disease, faintness, or panic symptoms are in scope later, add clinician-seeking guidance and exclusion rules before making stronger claims.
- Treat 432 Hz and delta-wave binaural tracks as experimental/preference audio. They should not be premium proof points unless future evidence justifies the claim.

## Sources checked

- ACP chronic insomnia guideline / recommendation: https://www.acponline.org/acp-newsroom/acp-recommends-cognitive-behavioral-therapy-as-initial-treatment-for-chronic-insomnia
- AASM behavioral and psychological insomnia guideline: https://pmc.ncbi.nlm.nih.gov/articles/PMC7853203/
- AASM 2026 combination-treatment guideline: https://pmc.ncbi.nlm.nih.gov/articles/PMC13076838/
- Slow breathing before bedtime systematic review: https://www.sciencedirect.com/science/article/pii/S1087079226000560
- Breathwork for stress and mental health meta-analysis: https://www.nature.com/articles/s41598-022-27247-y
- Cyclic sighing / structured respiration randomized trial: https://pubmed.ncbi.nlm.nih.gov/36630953/
- Noise as a sleep aid systematic review: https://pubmed.ncbi.nlm.nih.gov/33007706/
- Diaphragmatic breathing systematic review: https://www.sciencedirect.com/science/article/pii/S0965229925001931

Note: The evidence above was retrieved from primary-source web, PubMed, PMC, Nature, and ScienceDirect pages.
