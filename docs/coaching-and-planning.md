# PRISM coaching and planning

Updated: 2026-10-20
Status: requirements draft; no implementation

The selected final [design handoff](design-handoff.md) adds concrete builder, tuning, context-chip, and proposal-review behavior to these requirements. Prototype replies and profile values are examples.

## Confirmed product behavior

- Gemini powers the chatbot through its API.
- It can read PRISM's PR records and training plans.
- It can use the owner's profile, needs, goals, preferences, and training approach.
- It can independently prepare edits to a plan. User confirmation is required before those edits change a saved plan.
- Plan creation offers both muscle-first and training-split-first entry points.
- Both guided and advanced editing are wanted, separately from easier/harder workout adjustments.
- Load, sets/reps, exercise choice, and session length have separate adjustment controls.
- Personal data lives on the phone. Gemini calls require connectivity; local plans and PR entry must remain usable without chat.

## Profile fields

The owner accepted the suggested field set and invited necessary additions. Exact field requirements and input design remain adjustable.

| Area | Candidate fields | Purpose |
| --- | --- | --- |
| Training goals | Strength, hypertrophy, focus muscles, priorities | Give planning a clear purpose. |
| Training background | Experience and preferred training style | Tailor explanations and planning depth. |
| Schedule | Training days, session length, preferred split | Keep plans usable in the owner's routine. |
| Equipment | Available gym/home equipment | Support relevant exercise suggestions. |
| Preferences | Favorite exercises, exercises to avoid, other stated constraints | Reflect how the owner wants to train. |
| Strength comparisons | Bodyweight and any age/comparison-group fields required by the selected source | Provide the context needed to score a lift. |
| Units | Preferred weight units | Keep records and plans consistent. |
| Rest/recovery | Available sleep context, optional subjective rest/soreness notes | Add context without inventing a physiological readiness score. |

No profile values have been supplied. Screenshot values are reference examples only.

## Gemini plan-edit flow

The confirmation requirement is agreed. The following flow makes that requirement concrete; the preview presentation remains open for design.

1. The owner asks for a change, or Gemini suggests one using the available context.
2. Gemini prepares a draft with the affected days, exercises, and parameters.
3. PRISM shows the proposed changes and their stated reason before saving.
4. The owner confirms, rejects, or requests revisions.
5. Confirmation applies the reviewed changes. Rejection leaves the saved plan unchanged. A revision remains a draft until confirmed.

Gemini's permission to read context or suggest a change is not permission to save unconfirmed edits. Background plan rewrites are not part of this flow.

## Two plan-creation entry points

### Muscle-first

Start from the animated 2D front/back body, select a region or muscle groups, then open the builder with that focus. The requested example is an arms-focused plan that displays the relevant muscles.

### Split-first

Start from a training split, then edit its days and exercises. Candidate templates such as push/pull/legs, upper/lower, and full body are ideas; the initial template list has not been selected.

### Shared planning experience

Both entry points lead into the same saved-plan model. Guided and advanced editors operate on that plan. This consistency rule is selected under the owner's invitation to add useful necessities.

## Separate workout-adjustment controls

- **Load:** edit planned weight or intensity without silently rewriting other parameters.
- **Sets/reps:** edit planned volume and repetition targets.
- **Exercise choice:** swap a movement while respecting selected muscles, equipment, and stated preferences.
- **Session length:** adjust a time target; any related plan changes appear in the preview.

If a requested change requires changes to other parameters, show those explicitly before applying them. These controls edit a plan; they do not introduce workout logging. Exercise rest intervals are a separate plan parameter from the owner's sleep/recovery data.

## Rest context and Gemini

The owner's target device is Nothing Phone (3a) Pro and they use a Xiaomi band with an Android Google health-data connection. Health Connect is the proposed on-device route, pending verification of the companion app's actual shared records. See [local data and recovery](local-data-and-recovery.md).

Imported health context and a manually entered rest note remain distinguishable. Connecting a data source and including a recovery summary in Gemini context are separate settings. Missing sleep data must not be treated as poor sleep, fatigue, or a reason to rewrite a plan.

## Open decisions

- Which profile inputs are required, optional, and editable?
- How does the app show which context Gemini is using?
- What can the owner exclude from the context?
- What are the exact ranges and defaults for the separate workout-adjustment controls?
- Previous versions/undo are selected as a practical default; choose the retention detail during implementation.
- Which split templates and exercise controls belong in the first release?
- Is any Liftoff handoff needed? No integration is currently assumed.
- A Gemini API key has been supplied and stored locally in `.env` as `GEMINI_API_KEY`; secret environment files are excluded by `.gitignore`. No API requests have been made. The model and runtime credential handling remain unselected. The personal version must not depend on the owner hosting a server. Do not include the real credential in design samples or an Android app bundle.
