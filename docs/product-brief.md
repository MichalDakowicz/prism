# PRISM product brief

Updated: 2026-10-20
Phase: final design selected; Android implementation handoff

## Purpose

Give a regular gym-goer a beautiful Android app that makes strength milestones and training plans easy to understand. The visual muscle map should be a useful planning tool, not just decoration.

## Audience and release approach

- Serve the owner personally first.
- Leave room to make the app shareable later.
- Public accounts, social features, and a public launch are not current requirements.

## Role alongside the existing workout app

The owner already uses **Liftoff** to follow training plans and log workouts. PRISM should record PRs and support creating, editing, and viewing plans. It should not duplicate full set-by-set workout logging.

Any desired handoff, import, or export with Liftoff remains undecided. Compatibility has not been researched or promised.

## Confirmed capabilities

1. Manually record and review personal records, prioritizing the heaviest single while accepting weight × reps when that is the available record.
2. Compare strength relative to bodyweight using a table-based, tiered experience inspired by Strength Level and the supplied screenshots. The actual scoring data source and calculation method are not yet selected.
3. Offer simple guided plan creation and a more detailed advanced editor, with both muscle-first and training-split-first entry points.
4. Support making training plans easier or harder through separate controls for load, sets/reps, exercise choice, and session length.
5. Display an animated 2D full-body muscle map with front/back views and selectable muscle regions.
6. Use muscle selection to focus planning and the displayed muscles, such as choosing arms.
7. Provide a chatbot using Gemini through its API. It can read PRISM records, plans, and the owner's profile and training preferences, and independently prepare plan edits that require user confirmation before saving.
8. Prioritize a polished Android mobile experience.
9. Maintain a personal training profile covering goals, experience, days per week, session length, equipment, preferred split, and favorite/avoided exercises. Include optional constraints and rest/recovery context.
10. Store records, profile, and plans on the phone. A hosted backend, cloud sync, and a public account are not first-version requirements.
11. Explore reading rest/sleep context through the Android Google health-data connection used by the owner's Xiaomi band. Health Connect is the proposed integration route; exact record availability must be verified on the device.

## Experience goals

- Make adding a PR quick and make progress easy to revisit.
- Keep plans readable on a phone in a gym.
- Make muscle selection directly useful when building a plan.
- Let the owner choose planning depth without maintaining separate copies of the same plan.
- Let Gemini use profile, record, and plan context; make proposed plan edits concrete and reviewable before confirmation.

These are proposed quality goals, not final acceptance criteria.

## PR and comparison direction

- A measured heaviest single is the primary strength milestone.
- A weight × reps record is supported when a single is unavailable.
- Strength comparisons should account for bodyweight.
- Whether and how to derive an estimated single from a rep record remains undecided.
- Show named strength tiers and bodyweight comparisons in the style of the supplied Strength Level reference. Detailed outputs and any percentile feature depend on the selected source.

The owner invited necessary additions. Selected defaults: save bodyweight alongside each PR to preserve historical context, retain original weight × reps entries, and clearly distinguish measured singles from any estimates. These are reversible product defaults, not a selected estimation formula.

The screenshots are product references, not confirmed personal measurements. The displayed age, bodyweight, and lift must not be used to populate the owner's profile. See [strength scoring](strength-scoring.md) for reference findings and [coaching and planning](coaching-and-planning.md) for the requested Gemini behavior.

## Boundaries

- No full workout logger in the current scope.
- Target device: Nothing Phone (3a) Pro, Android. The exact Android version and Xiaomi companion app are not yet recorded.
- No hosted backend is required for the personal first version. The local storage implementation, Android stack, and Gemini model remain unselected.
- No final strength score formula or comparison dataset has been selected.
- The muscle display is animated 2D with front/back views; visual style and region detail remain open.
- The user has supplied the final design in `design/project/`. Its nine screens are the visual reference for Android implementation; prototype values are not personal records or a selected strength-standards dataset.

## Selected design

The final design uses near-black surfaces, yellow accents, condensed display headings, monospaced statistics, detailed front/back anatomy, physical plate-loading visuals, and floating bottom navigation for Lifts, Body, Plans, and Coach. The app remains named PRISM; `loadout-*` filenames are source identifiers.

See the [screen inventory](design-brief.md) and [implementation handoff](design-handoff.md). Android implementation must preserve local data, confirmation before plan changes, and measured/estimated PR distinctions. Weekly muscle volumes shown in the design refer to saved plans rather than completed workout logs.
