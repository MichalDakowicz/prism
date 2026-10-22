# PRISM feature backlog

Updated: 2026-10-20

**Requested** means the user wants the capability. **Idea** means a proposal awaiting discussion. Implementation is tracked in [implementation log](implementation-log.md).

Latest additions: preserve explicitly selected plate sizes/order; opt-in FitnessVolt public rankings with separate populations; remove individual PR entries through recoverable archives (not a whole-history action); attach, replace, play/open and remove one video per PR using a link or gallery clip. Local clips stay on the phone and are excluded from JSON binary backups and Gemini context.

## Requested capabilities

| ID | Capability | Confirmed intent | Still to decide |
| --- | --- | --- | --- |
| PR-01 | PR records | Prioritize the heaviest single; also accept weight × reps when a single is unavailable. No full workout logging. | Required fields, exercise variants, corrections, and history. |
| PR-02 | Plate-based PR entry | The selected design adds typed weight entry, an animated bar, plate pairs, 15/20 kg bar selection, pair removal, and clear. | Supported equipment, nonrepresentable typed weights, unit conversion, validation, and persistence. |
| PR-03 | Lifts overview and history | The selected design includes lift cards, recent PRs, a next-tier gap, per-side loading visuals, and a measured/estimated history chart. | Score-source availability, data selection, empty history, and chart interactions. |
| SC-01 | Strength scores | Use exercise-specific table-based tiers and bodyweight comparisons, inspired by the supplied Strength Level reference. | Data source, table lookup/interpolation, exercise coverage, rep-record estimation, supported outputs, and explanations. See [scoring notes](strength-scoring.md). |
| PL-01 | Guided planning | Offer both muscle-first and training-split-first entry points. | Inputs, defaults, and how much guidance is offered. |
| PL-02 | Advanced planning | Allow detailed manual plan editing. | Exercise, set, rep, load, rest, schedule, and progression controls. |
| PL-03 | Difficulty adjustment | Provide separate controls for load, sets/reps, exercise choice, and session length. | Exact ranges, how parameters relate, preview behavior, and what stays fixed. |
| PL-04 | Plan viewing | View saved plans while Liftoff handles execution and logging. | Layout and any desired handoff to Liftoff; compatibility is unknown. |
| MB-01 | Animated full-body muscle map | Select muscle sections on an animated 2D body with front/back views. | Region detail, view transition, selection behavior, and animation style. |
| MB-02 | Muscle-focused planning | Use a selection such as arms to create a focused plan and display the relevant muscles. | Multi-select, selected-region display, and links to exercises. |
| MB-03 | Planned weekly muscle volume | The selected design colors anatomy by sets/week and shows muscle-group totals, linked plans, and exercises. | Derive values from saved plans, normalize muscle aliases, and explain primary/secondary-muscle counting. This is not actual workout logging or a recovery score. |
| AI-01 | Gemini chatbot | Read PRISM records, plans, and training profile; independently prepare plan edits that require user confirmation before saving. | Context selection, edit preview details, credentials, model, and operating costs. See [coaching notes](coaching-and-planning.md). |
| PF-01 | Training profile | Include goals, experience, days/week, session length, equipment, split, favorite/avoided exercises, constraints, and rest context. | Required versus optional fields, editing, and context controls. |
| PF-02 | Display preferences | The selected profile includes kg/lb units and colored/black plate styles, shared across relevant screens. | Persistent settings and consistent conversion/rendering. |
| LD-01 | Phone storage | Store personal PRs, plans, profile, and settings on the phone without requiring hosting. | Local database choice, backup format, and restore behavior. |
| HC-01 | Rest/sleep context | Explore optional rest data from the Android health connection used by the owner's Xiaomi band. | Proposed route: Health Connect. Verify actual shared records and permissions on Nothing Phone (3a) Pro. See [recovery notes](local-data-and-recovery.md). |
| UX-01 | Android mobile design | Deliver a beautiful phone-focused experience. | Visual direction, navigation, accessibility, and device support. |

## Ideas to discuss

| ID | Idea | Intended benefit | Status |
| --- | --- | --- | --- |
| I-01 | Pin favorite lifts for quick PR entry | Reduce repeated navigation for the records that matter most. | Idea |
| I-02 | PR timeline and milestone cards | Make progress satisfying to revisit. | Idea |
| I-03 | Explain each strength score | Show what a score means, how it was derived, and when a comparison is unavailable. | Idea |
| I-04 | Preserve one plan across guided and advanced modes | Avoid rebuilding plans when switching editing depth. | Selected default under the owner's invitation to add useful necessities |
| I-05 | Preview easier/harder adjustments and allow undo | Keep plan changes understandable and reversible. | Selected default under the owner's invitation to add useful necessities |
| I-06 | Connect selected muscles to relevant exercises | Turn the body map into a practical planning surface. | Idea |
| I-07 | Let Gemini draft plan changes for review | Help with planning while leaving the owner in control of saved changes. | Accepted; incorporated into AI-01 after discovery round 3 |
| I-08 | Export or hand off plans to Liftoff | Avoid entering the same plan twice, if wanted and if a suitable route exists. | Idea; preference unanswered and compatibility unknown |
| I-09 | Local use and a backup/export option | Support a personal-first app and preserve records. | Phone storage confirmed; manual backup/restore selected as a practical default |
| I-10 | Save bodyweight alongside each PR | Preserve the context for historical strength comparisons when bodyweight changes. | Selected default under the owner's invitation to add useful necessities |
| I-11 | Clearly label measured and estimated singles | Keep a recorded single distinct from any estimate derived from weight × reps. | Selected default; estimation method undecided |

## Not in the current scope

- Full workout sessions with set-by-set logging.
- Social feeds, competitions, public profiles, or subscriptions.
- Direct band pairing, workout logging imports, or Liftoff integration. Optional Health Connect rest reads are a separately requested capability, conditional on available records.
- Cloud accounts, cross-device sync, and hosted app infrastructure for the personal first version.

## Before implementation

Choose the first-release subset with the user. For each selected feature, add concrete behavior and acceptance criteria. Research strength scoring sources and any proposed external-app integration before promising support.
