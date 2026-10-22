# PRISM final design handoff

Updated: 2026-10-20
Status: source inspection complete; implementation specification

## Reference and interpretation

Use the nine boards listed in [the final design brief](design-brief.md). Their 390 × 844 dimensions and exact source styling define the baseline visual language. Preserve the supplied files. App name remains PRISM.

Values labeled **observed** below come from source HTML/component logic. **Implementation rules** fill native behavior and missing states while preserving the agreed product scope. They are not claims that the export already implements them.

## Visual tokens — observed

| Token | Source value | Use |
| --- | --- | --- |
| `color.canvas` | `#0B0B0E` | Main background and dark text on yellow actions. |
| `color.surface` | `#141417` | Cards, grouped fields, tuning sheet. |
| `color.surfaceInset` | `#121215` | Exercise rows and inset surfaces. |
| `color.surfaceRaised` | `#1E1E25` | Context chips and secondary controls. |
| `color.accent` | `#F2C200` | Primary actions, changed values, anatomy focus. |
| `color.text` | `#F2F1F7` | Primary text and selected light controls. |
| `color.textSecondary` | `#A8A6A0` | Labels, dates, descriptions. |
| `color.textMuted` | `#7E7D8C` | Inactive metadata and excluded context. |
| `color.navInactive` | `#9A99A8` | Inactive bottom navigation. |
| `color.border` | White at 6–14% opacity | Surface and outlined-control separation. |
| `font.display` | Big Shoulders Display, 700/800/900 | Heavy condensed headings and values. |
| `font.body` | Manrope, 400–800 | Body copy, exercise names, controls. |
| `font.numeric` | IBM Plex Mono, 500/600 | Statistics, labels, dates, equipment metadata. |
| `type.screenTitle` | Display 44 px / 1 line height, weight 900 | Main screen titles; Profile uses 46 px. |
| `type.liftValue` | Display 104 px / 0.8, weight 900 | Main lift-card value. |
| `type.prInput` | Display 112 px / 0.9, weight 900 | New PR numeric input. |
| `type.metadata` | Mono 10–12 px | Compact labels and data. |
| `space.screenInset` | 20 px; selected forms use 16 px | Main horizontal content inset. |
| `radius.card` | 10–16 px | Record cards and grouped content. |
| `radius.sheet` | 28 px top corners | Plan tuning and coach sheets. |
| `radius.navigation` | 34 px | Floating bottom navigation. |

Plate palette: 25 kg red `#D42A2A`, 20 kg blue `#2A62D4`, 15 kg yellow `#F2C200`, 10 kg green `#1F9A56`, 5 kg light `#E8E8E8`, 2.5 kg red, 1.25 kg gray `#B8B8B8`. Black-plate preference changes fills to `#0A0A0C` with `#4A4A52` edges. Keep numeric weight labels in both styles.

## App shell and routes

Observed main tabs: **Lifts → Body → Plans → Coach**. Profile opens from Lifts. New PR and New Plan use focused subflows with a close/back action. Body opens a muscle overview; that opens an appropriately focused builder. Lifts opens lift-specific history.

Navigation is inset 20 px, 68 px high, 24 px above the board bottom. Its source fill is `rgba(24,24,32,0.82)`, with an 18 px backdrop blur and an 8%-white border. Active tabs use a light pill and dark icon/text. Plan tuning presents a bottom sheet instead of visible main navigation.

Native rule: use actual status/navigation insets and keyboard insets. Treat the reference positions as composition anchors rather than absolute physical-screen coordinates. Navigation, sheets, and the keyboard must not hide editable fields or primary actions.

## Components and data contracts

| Component | Inputs | Behavior |
| --- | --- | --- |
| `LiftCard` | Exercise, best record, record kind, dated bodyweight, optional score, plate style | Opens that exercise's history; carousel preserves its selected position. |
| `LoadedBar` | Total load, bar weight, plate inventory/style, unit | Renders symmetric plate pairs and a readable per-side description. |
| `PlatePicker` | Available plates and selected pairs | Adds a pair, removes a pair, clears, or changes bar; typed weight remains authoritative when not representable. |
| `StrengthResult` | Exercise, comparison context, actual standards result or unavailable state | Tier, bodyweight multiple, optional next-tier gap; never fabricate missing benchmarks. |
| `AnatomyMap` | Front/back SVG paths, selected muscles, planned set totals | Selects named regions; supports accessible text alternatives and multiple selection in the builder. |
| `PlanPreview` | Saved plan or draft, selected day, exercise rows | Tuning changes a draft, with changed values visibly marked. |
| `TuneControls` | Load, volume, movement choices, duration settings | Separate controls; previews any relationships or secondary effects. |
| `CoachProposal` | Plan/version, proposed changes, explanation, excluded context | Reject, revise, or confirm; confirmation applies only the reviewed draft and creates an undo version. |
| `ProfileSettings` | Training/profile fields, units, rest settings, plate style | Stores real local settings and propagates them to every relevant screen. |

## Screen behavior

### Lifts

Observed: horizontally snapping 330 px cards with 10 px gaps, primary profile/add actions, colored tier badge, plate illustration, next-tier plate breakdown, and recent PR rows. The carousel's next-tier section follows its selected exercise.

Implementation rules: use the saved exercise ID in history navigation; do not send every card to the same bench-press record. Prioritize measured singles while clearly labeling cards based on rep records and estimated 1RM. A tier-up badge requires a valid previous/current standards comparison. With no records, show one clear Add PR action. A missing standards source keeps record/history features usable and displays score unavailability.

### New PR and plate loading

Observed: direct numeric entry; 15/20 kg bars; 25, 20, 15, 10, 5, 2.5, 1.25 kg plate-pair controls; remove pair/clear; rep stepper from 1 to 12; measured-versus-estimated note; bodyweight snapshot; save action. Typed weights can display a closest-load/remainder note.

Implementation rules: exercise selection must work; save writes a real dated local record. Keep weight, reps, bodyweight snapshot, exercise variant, and record kind. Validate finite positive values and rep bounds; retain original rep data. A below-bar typed weight or a remainder must be explained without silently rounding the saved lift. Plate loading is a barbell-specific aid: do not force a fictitious bar into dumbbell, machine, or bodyweight records. Decimal input and kg/lb conversion must be consistent. Multiple taps on Save must not create duplicate records.

### Lift history

Observed: best measured single with record date and bodyweight, loaded bar, measured/estimated progress traces, chronological entries, and a five-tier standards table. The source explicitly labels its standards as samples.

Implementation rules: keep measured and estimated series distinct; do not replace the best measured single with an estimate. Use per-record bodyweight in historical comparisons. Provide readable chart descriptions and a record list containing the same data. Zero, one, many, and corrected/deleted-record states need consistent chart/list behavior. Source/formula versions must be identifiable.

### Body and muscle overview

Observed: detailed front/back SVG anatomy; selectable regions; selected white outline; planned-volume color ramp; selected muscle summary; a group view with focused anatomy, sets/week, plan/exercise counts, and links to relevant plan days.

Observed weekly-volume ramp: zero `#202027`; 1–4 `#40350D`; 5–8 `#7D6409`; 9–12 `#C29A06`; 13+ `#F2C200`.

Implementation rules: derive these from saved **planned** sets, not actual completed workout logs or inferred recovery. Normalize aliases such as `trapezius`/`traps`. Document how primary/secondary muscle contributions count; group totals and unique set counts are different quantities and must be labeled consistently. Pass the selected group into its overview/builder rather than always opening Arms. Provide a named muscle list as an alternative to tapping SVG regions. Preserve source anatomy proportions and path detail.

### Plans and tuning

Observed: selected plan, stacked day card, exercise preview, changed-value highlights, and a tuning sheet with **Load**, **Sets / reps**, **Exercise choice**, and **Session length**. Sheet actions are Reset and Apply. Sample load steps are ±5%; the prototype derives duration from sample set totals.

Implementation rules: start from the saved plan, not fixed sample exercises. Preview changes without mutating it. Reset restores the current draft to its saved baseline. Apply persists the reviewed changes and an undo snapshot. Independent controls must not silently rewrite unrelated variables; when duration depends on other changes, display the resulting edits. The sample duration calculation and step limits are not selected training/scoring algorithms. Preserve guided/advanced editing even though the export concentrates on the tuning flow.

### New plan

Observed: muscle and split entry tabs; multi-select anatomy and removable chips; filtered exercise library with add/remove controls; 3–6 days/week; Arms Focus, Push/Pull/Legs, Upper/Lower, Full Body templates; weekly schedule preview; next-step action. Coach mode changes with context: review selected exercises, generate from selected muscles, or draft a full plan. Each suggestion supports Apply/Skip, and generated drafts support Try again/Use this draft.

Implementation rules: muscle selection and exercise selection stay consistent; removing a muscle must not silently leave incompatible hidden exercises in the saved plan. Empty selection/exercise states need a clear next action or disabled Next with a reason. Drafts remain editable and unsaved until the user saves/uses them. A full-plan draft must preserve the requested schedule and profile constraints. Template examples are starting points, not a completed real generator.

### Coach

Observed: context chips for Profile, PRs, selected plan/day, and rest note; before/after plan edits; unchanged exercises; Reject, Revise, Apply; applied/rejected status and Undo; message composer.

Implementation rules: build actual Gemini requests from enabled context only. The mock reply is an example, not advice or real history. Connected/online status must reflect reality. Changing a chip changes the context sent to the model, not only chip styling. Validate proposed exercises/parameters, show a concrete review, and apply it atomically only after confirmation. Detect a plan that changed since the proposal was created. Revision is a new draft; cancellation leaves the plan intact. Network failure preserves the user's message and local plan.

### Profile

Observed: bodyweight snapshot explanation, kg/lb, strength/size/both goal, days/week/session length/experience, equipment chips, preferred/avoided exercises, separate Health Connect and rest-sharing switches, colored/black plates, backup/restore, local key setting.

Implementation rules: all values come from real editable local data. Numbers in the design are not the owner's profile. Start health reads disabled until platform permission is granted; rest sharing defaults off. Missing sleep means no record, never poor recovery. Health access and Gemini sharing remain separate settings. Units and plate style apply across all screens. Backup/restore must actually round-trip profile/PRs/plans and exclude the API key. Key entry is private/masked; do not package the development `.env` into an APK.

## Motion — observed and native requirements

| Element | Trigger | Observed source behavior | Native requirement |
| --- | --- | --- | --- |
| Anatomy fill | Selection/state change | 400 ms, ease | Preserve selection clarity; do not rely on color alone. |
| Body reveal | Front/back view | Scan over 900 ms, cubic-bezier(.4,0,.2,1), with scan line | Match visual intent without hiding the selected name or losing focus. |
| Selected muscle | Selected state | White-outline pulse over 1.8 s, repeating | Honor system reduced-motion/animation settings; keep a static selected outline when disabled. |
| Carousel dots | Card selection | Width/color transition over 250 ms, ease | Track the actual settled card and announce selection accessibly. |
| Plate stacks / sheets | Load or mode change | Animated source classes | Preserve final geometry; exact timings can follow platform motion when unspecified. |

## Native layout, content, and accessibility rules

- At the 390 × 844 reference size, preserve the hierarchy, type character, yellow/black contrast, source anatomy, and primary-action placement.
- At narrower widths, wrap labels/chips and reflow plate controls; do not scale the entire app or crop fixed 390 px boards.
- At larger text sizes, allow scrolling and flexible rows. Weight input must fit long/decimal values and leave units/reps readable.
- On larger windows, constrain reading width while keeping bottom actions and safe insets correct; no new tablet/desktop app is required.
- Long exercise/plan names may use a single-line preview with full text in details; required form labels and error messages must wrap.
- Use native semantics for tabs, switches, sliders, numeric inputs, and dialogs. Provide enlarged touch targets around small source controls, visible focus, and meaningful icon labels.
- Announce completed saves, selected muscles, proposal results, and validation errors; avoid announcing every animation frame or slider tick.
- Empty, loading, unavailable, permission-denied, failed-save, no-network, missing-key, missing-standards, and no-health-record states need explicit UI using this visual language.

## Implementation gaps and dependencies

1. All nine files reference missing `support.js`. `DCLogic`, bindings, loops, and conditionals depend on it. The export has not been independently interaction-tested in a browser. This does not prevent using its HTML, styles, SVG, and logic as references.
2. Save PR, plan Apply, backup/restore, API-key Change, and several picker controls are present visually without production persistence/integration. Component-state changes are not a shared app database.
3. Standards are hardcoded sample arrays; bodyweight and record values are examples. Actual data sourcing is still open. Do not copy these as authoritative tables.
4. The add-record estimate and some displayed history/card estimates do not use one consistent method. Select and test one estimation policy separately; retain originals and label estimates.
5. Body/group counts and weekly volumes are examples. Real values must use one documented saved-plan calculation.
6. The prototype's declared display preferences do not automatically establish cross-screen persistence. App settings must be shared.
7. Core requirements such as full manual/advanced plan editing, validation, and offline/error states extend beyond the illustrated boards and must be implemented without inventing another visual direction.

## Development sequence

1. Native visual tokens, fonts, route shell, and faithful reusable plate/anatomy components.
2. Local profile, settings, PR entry/history, and backup/restore with meaningful persistence tests.
3. Saved plan model, guided/manual builder, planned-volume maps, tuning drafts, confirmation, and undo.
4. Live Gemini chat with explicit context and structured reviewable edits, using a personal credential path that requires no owner-hosted server.
5. Optional Health Connect reads with permission/no-record handling on the target phone.
6. A verified standards provider and one versioned estimated-1RM policy; keep scoring visibly unavailable until configured rather than invent results.

No Android build or live API/health integration is created by this handoff.
