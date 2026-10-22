# PRISM

PRISM is a personal Android strength companion for recording PRs, exploring table-based strength tiers and bodyweight comparisons, and building and viewing training plans through an animated 2D front/back muscle map. Gemini will use the owner's training profile, records, and plans to provide context-aware chat and prepare plan edits that require confirmation before saving.

PRISM complements **Liftoff**, the app already used to follow workouts and log sets. PR tracking prioritizes the heaviest single and also accepts weight × reps when a single is unavailable. Full workout logging is outside the current scope.

## Current phase

The Expo/React Native Android app is implemented in [mobile](mobile/README.md), built locally and installed on the connected phone for testing. The final nine-screen design in [design/project](design/project/canvas.json) is the visual source of truth. Records and plans live on the phone, with no hosted backend or cloud-account requirement. See [implementation status](docs/implementation-log.md) for verified behavior and current limits.

## Agreed workflow

1. Choose the name: **PRISM** — complete.
2. Create the project folder and living planning documents — complete.
3. Refine requirements through questions and proposed ideas — core scope captured; technical details tracked in the documents.
4. Explore visual directions — complete; the user rejected the original three proposals and supplied a final design from elsewhere.
5. Adopt the final design — complete; nine source screens are mapped in the handoff.
6. Android development using the selected design and agreed requirements — implemented; device verification and refinement underway.

The design-selection stage is complete. Use the final design and the living requirements together; prototype sample data and unconnected controls are not finished application behavior.

## Planning documents

- [Product brief](docs/product-brief.md): purpose, audience, scope, and intended experience.
- [Feature backlog](docs/feature-backlog.md): requested capabilities and ideas awaiting discussion.
- [Decision log](docs/decision-log.md): confirmed choices and their consequences.
- [Discovery](docs/discovery.md): answered and outstanding questions.
- [Coaching and planning](docs/coaching-and-planning.md): profile context, Gemini plan edits, and the two planning entry points.
- [Strength scoring](docs/strength-scoring.md): the requested score experience, screenshot references, and researched sourcing questions.
- [Local data and recovery](docs/local-data-and-recovery.md): phone storage, backups, rest context, and the Health Connect integration direction.
- [Design brief](docs/design-brief.md): the selected final design and its nine screens.
- [Design handoff](docs/design-handoff.md): visual tokens, screen behavior, native layout rules, and implementation gaps.
- [Implementation status](docs/implementation-log.md): app features, builds, verification and limits.
- [Standards format](docs/standards-format.md): sourced table import format and scoring rules.

These documents should be updated as decisions are made. Proposed ideas are not approved requirements.

## Local configuration

The supplied Gemini credential is stored in the project-local `.env` as `GEMINI_API_KEY`. Secret environment files are excluded by `.gitignore`; `.env.example` documents the variable without a value. Native runtime credentials are entered through the masked Profile field and saved with Expo SecureStore. The key is excluded from source, app bundles and JSON backups. Gemini requests go directly from the phone to Google.
