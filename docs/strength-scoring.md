# PRISM strength scoring

Updated: 2026-10-20
Status: implemented in `mobile/`; historical research and initial proposals follow below

## Current implementation

Measured singles take precedence over rep estimates. Rep records use Brzycki for 2–10 reps and Epley for 11–12 reps, version 1, in `mobile/src/domain/strength.ts`; original load/reps and bodyweight snapshots are retained. Plate selections also retain their exact pairs/order rather than being replaced by a greedy equivalent.

Following the owner's supplied FitnessVolt data page, supported exact variants (bench press, squat, deadlift, overhead press) now use its public `/public/rank` API when the user taps Get score. Requests send only exercise, sex comparison group, saved bodyweight, measured/estimated 1RM, units and optional age. Missing PR age/group can use Profile; a lookup-only group can be selected without changing Profile. Different variants/input conventions are not silently substituted.

Display the API score/tier and separate verified competition and self-reported gym percentiles, including their sources and sample sizes. The API population ranking differs from the site's editorial five-level standards. Do not blend populations or derive five-tier boundary weights from the rank response. Cache results locally with comparison inputs and fetch date; allow refresh after one hour. Offline failures preserve PRs and existing cached results.

Attribution is visible in the app: [Powered by FitnessVolt · CC BY 4.0](https://fitnessvolt.com/strength-standards/strength-data/). Source methodology: [FitnessVolt methodology](https://fitnessvolt.com/strength-standards/methodology/). Optional sourced custom threshold tables remain supported, with linear bodyweight interpolation and no extrapolation. Exact parity with Strength Level is not claimed.

## User's requested direction

The owner also requested a Gym / Competition display setting. Profile → Strength score now selects the headline population percentile and FitnessVolt badges. Both cohorts remain visible in details; changing the setting reuses the cached response without a network request. No fallback occurs when the selected cohort is missing. The API tier is displayed only for its matching population. Older profiles default to Competition; export/restore retains the preference.

Prioritize the heaviest measured single, accept weight × reps when that is the available record, and compare strength relative to bodyweight. Use a table-based result experience similar to Strength Level and the supplied screenshots.

This confirms the product direction. It does not establish a direct Strength Level integration or select its data for reuse.

## Supplied visual references

The supplied images are preserved here so they remain available beyond the temporary attachments:

- [Calculator inputs](references/strengthlevel-input-reference.png)
- [Result and tier boundaries](references/strengthlevel-result-reference.png)

The input reference contains comparison group, age, bodyweight, exercise, lift, reps, and units. The result reference combines a named tier, stars, a bodyweight multiple, a comparison percentage, and a threshold table for the current bodyweight.

These are behavioral references, not a request to copy the website's visual design. Values shown in the screenshots are examples, not confirmed profile data or an independent numerical validation case.

## Findings from the reference site

Checked on 2026-10-20 using the site's own pages.

- The main calculator accepts age, bodyweight, exercise, lift, and reps, with a gender selection. It supports entering a single or a multi-rep set. [Calculator](https://strengthlevel.com/)
- The bench press standards page shows exercise-specific thresholds by bodyweight and by age, alongside bodyweight-ratio views. [Bench press standards](https://strengthlevel.com/strength-standards/bench-press)
- The five named levels are Beginner, Novice, Intermediate, Advanced, and Elite. The FAQ associates them with the 5th, 20th, 50th, 80th, and 95th percentiles of its lifting comparison population. The FAQ says that population reflects its active lifter community, rather than the general public. [FAQ](https://strengthlevel.com/faq)
- Its FAQ describes a rep-dependent 1RM estimate using Brzycki, Epley, and a blend between them. This is a reference finding, not a selected PRISM formula or evidence that every detail of the main calculator is reproducible. [FAQ](https://strengthlevel.com/faq)
- The site's terms restrict automated access, systematic collection, and reproducing its calculators/standards without written authorization. An authorized access route or another suitably sourced dataset must be evaluated before selecting an implementation. No bulk data collection has been performed. [Terms: Automated Access and API Usage](https://strengthlevel.com/terms-and-conditions)

## Proposed result experience

Subject to the selected source and the user's review:

1. Show the selected exercise, original PR, comparison bodyweight, and whether the score uses a measured single or an estimate.
2. Show a prominent named strength tier.
3. Show the bodyweight multiple and a compact threshold table or progression scale.
4. Show the distance to the next tier when the threshold is supported.
5. Show a percentile only if the selected dataset and calculation method support it.
6. Make the source, comparison group, and score method discoverable.

A tier label and a bodyweight multiple are distinct outputs. The tier must come from the selected exercise-specific standards rather than an invented universal ratio cutoff.

## Initial calculation questions (resolved for first implementation above)

- Dataset coverage, source version, reuse conditions, and authorized access route.
- Comparison fields and what happens when a field or exercise is unsupported.
- Table lookup and interpolation at bodyweights or ages between published rows.
- Values below the first tier, above the top tier, or outside the dataset's covered range.
- Converting rep-based records into estimated 1RM, including supported rep ranges and visible labeling.
- Historical records use their saved bodyweight snapshot. Age/comparison-group handling and source/formula versioning must be defined with the selected standards source.
- Exercise variants and input conventions, including barbell, per-hand dumbbell, machine, and bodyweight exercises.

Engineering inference: five tier thresholds alone do not determine an exact in-between percentile such as the screenshot's comparison percentage. That output needs an additional distribution model or an explicitly chosen approximation. Exact numerical parity with Strength Level is not established.

## Proposed acceptance criteria for later implementation

- A measured single remains distinguishable from any estimate derived from reps.
- A result uses one identified standards source/version and comparison context.
- Missing or unsupported data is surfaced rather than replaced with invented scores.
- A raw weight/bodyweight ratio is never presented as a population percentile.
- Any approximation, such as interpolation, is identified in the method explanation.

The design's hardcoded values remain sample data, never user records or bundled norms. See [design handoff](design-handoff.md) for visual implementation boundaries.
