# PRISM final design

Updated: 2026-10-20
Status: selected by the user; Android implementation has not started

## Source of truth

The user supplied the final design under `prism/design/`. The active source is [design/project/canvas.json](../design/project/canvas.json) and the nine HTML boards it lists. Preserve these files as the supplied design reference.

The application name remains **PRISM**. The source's `Loadout` labels and `loadout-*` filenames do not constitute a rename. The earlier Obsidian, Volt, and Porcelain proposals were rejected.

## Screen inventory

| Screen | Source | Main purpose |
| --- | --- | --- |
| Lifts | [loadout-lifts.dc.html](../design/project/loadout-lifts.dc.html) | Lift-card carousel, plate visuals, next-tier target, recent PRs. |
| New PR | [loadout-add.dc.html](../design/project/loadout-add.dc.html) | Type weight or load plate pairs, choose bar, enter reps, save a PR. |
| Plans and tune | [loadout-plans.dc.html](../design/project/loadout-plans.dc.html) | Preview a plan day and adjust separate difficulty controls before applying. |
| Body | [loadout-body.dc.html](../design/project/loadout-body.dc.html) | Detailed front/back anatomy with planned sets/week and muscle selection. |
| Muscle overview | [loadout-muscle.dc.html](../design/project/loadout-muscle.dc.html) | Isolated muscle-group anatomy, volume breakdown, linked plans, focused-plan entry. |
| New plan | [loadout-build.dc.html](../design/project/loadout-build.dc.html) | Muscle/split entry, exercise selection, weekly schedule, coach review/drafts. |
| Coach | [loadout-coach.dc.html](../design/project/loadout-coach.dc.html) | Context controls, concrete plan-edit proposals, reject/revise/apply/undo. |
| Lift history | [loadout-lift.dc.html](../design/project/loadout-lift.dc.html) | Best measured single, dated records, measured/estimated progress, standards. |
| Profile | [loadout-profile.dc.html](../design/project/loadout-profile.dc.html) | Bodyweight, units, goals, equipment, rest sharing, plate style, backup and key settings. |

## Visual direction

Near-black canvas, yellow accents, condensed heavy headings, monospaced statistics, rounded dark surfaces, floating translucent navigation, physical bar/plate illustrations, and detailed SVG anatomy. Reference boards are 390 × 844.

See [design handoff](design-handoff.md) for exact source tokens, interactions, native adaptation, and states absent from the reference.

## Export and data boundaries

All nine files reference `./support.js`, which is absent from the supplied folder. Their `x-dc`, `sc-for`, `sc-if`, binding expressions, and `DCLogic` classes depend on that runtime for standalone interactivity. Source inspection is complete; interactive behavior has not been browser-verified for this export.

The prototype has sample records, profile values, standards, volume totals, and coach replies. They are design content, not the owner's real data or production integrations. Some controls only navigate or update local component state. Final visual selection does not select their mock scoring algorithms or data sources.
