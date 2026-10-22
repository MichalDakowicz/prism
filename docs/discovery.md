# PRISM discovery

Updated: 2026-10-20

Ask focused questions in small rounds. Update these answers and the related planning documents before moving forward. No suggested answer should be treated as approval.

## Round 1: scope — answered

### Who should PRISM serve first?

**Answer:** Personal app first; make it shareable later.

### How should it track gym sessions?

**Answer:** Record PRs only and view plans. The owner uses a different app to follow plans and log workouts.

**Effect:** Full workout logging is outside the current scope. Plan creation and editing remain requested.

### What does simpler or harder planning mean?

**Answer:** Both guided/advanced editing and easier/harder workouts.

**Effect:** Editing complexity and training difficulty are separate product concepts.

## Round 2: PR records and the visual core — answered, with handoff preference open

### Which app handles plans and workout logging?

**Answer:** Liftoff.

**Still open:** The owner named the app but did not choose whether PRISM should support importing, exporting, or handing off plans. No integration is assumed.

### Which PRs matter?

**Answer:** The heaviest single matters most, but weight × reps is sometimes the only available option. All strength comparisons should account for bodyweight.

**Effect:** Support both measured singles and rep-based records, with singles as the primary milestone. The exact comparison method and any estimate from rep records remain undecided.

### What form should the muscle display take?

**Answer:** Animated 2D front/back.

**Effect:** Design directions should explore 2D anatomy and animation styles. Rotatable 3D is not part of the requested direction.

## Round 3: coaching, planning, and score presentation — answered

### What can Gemini do?

**Answer:** Read plans and use the owner's profile, needs, wants, and how they train. It can prepare plan edits independently, with user confirmation.

**Effect:** Add a personal training profile. Gemini can use profile, PR, and plan context. Proposed plan edits must be confirmed before changing the saved plan. See [coaching and planning](coaching-and-planning.md).

### Where should guided planning start?

**Answer:** Both selected muscles and training splits.

**Effect:** Offer both entry points, feeding the same plan builder.

### How should strength scores work?

**Answer:** Something like [Strength Level](https://strengthlevel.com/), calculated from standards tables. Two screenshots were supplied as examples of the inputs and results.

**Effect:** Use table-based named tiers and bodyweight comparisons as the product reference. Research the dataset, permitted access route, and calculation method separately from the desired interface. Preserve the screenshots; do not assume their sample values are the owner's personal data. See [strength scoring](strength-scoring.md).

## Round 4: profile, plan controls, and storage — answered

1. **Profile:** Suggested fields are enough; add rest, including data from the owner's Google health-data connection. The owner invited other useful necessary additions.
2. **Workout difficulty:** Separate controls.
3. **Storage:** On the phone; no hosting available for now. No cloud-account requirement for the personal first version.

## Device and visual preferences — answered

- **Device/source:** Nothing Phone (3a) Pro, Xiaomi band, Google health-data connection described as the former Google Fit and activity sharing through Android settings. Exact companion app, OS version, and shared sleep records remain unverified.

## Selected practical defaults

Under the owner's invitation to add necessary details: dated bodyweight context for PRs, retaining original rep entries and labeling estimates, one plan shared across editing modes, plan undo, manual backup/restore, and optional manual rest context. These are adjustable defaults, not assumptions about the owner's actual measurements or routines.

## Later discovery topics

- **Scoring:** Table-based tiers and bodyweight comparisons are confirmed; dataset/access, exact lookup and interpolation rules, historical bodyweight inputs, rep-record estimates, exercise variants, percentile support, and coverage remain open.
- **Plan building:** Days per week, available equipment, muscle selection, exercise choices, and advanced controls.
- **Difficulty:** Separate controls are confirmed; exact ranges and relationships remain to be designed.
- **Muscle map:** Animated 2D front/back is confirmed; region detail, multi-select, animation style, and links to the plan editor remain open.
- **Gemini:** Profile/PR/plan context and confirmed plan edits are requested; required/optional profile inputs, context controls, preview, and runtime API setup remain open.
- **Data:** Phone storage is confirmed. Backup/restore is a selected practical default; cloud sync is deferred.
- **Recovery:** Verify the band companion app, Health Connect availability, shared records, and permissions on the actual device. A missing record is not a fatigue assessment.
- **Preferences:** Units, language, existing records, and accessibility needs.
- **Design:** Color and tone, navigation, animation intensity, and comparison criteria for the HTML directions.
- **First release:** Priority order and which capabilities can wait.

## Current implementation gate

The owner rejected the initial three proposals, paused design, and then supplied the final design under `prism/design/`. The nine screens in `design/project/` are now the selected visual source. See [design brief](design-brief.md) and [handoff](design-handoff.md).

Design selection is complete. Open implementation details remain tracked: actual standards data and estimate rules, Android stack/local storage, live Gemini credential handling, and Health Connect device verification. The source prototype's sample values and incomplete persistence are not evidence that those features are implemented.

The supplied export references a missing `support.js` runtime. Its HTML, SVG assets, styles, and component logic are present and usable as implementation references; standalone interactive preview needs that dependency or a separate preview adapter.
