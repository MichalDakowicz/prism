# PRISM decision log

Dates use the user's Europe/Warsaw calendar.

| ID | Date | Decision | Consequence |
| --- | --- | --- | --- |
| D-001 | 2026-10-20 | Use the name **PRISM**. | Create `C:\stuff\prism` for this project. No acronym expansion or name-availability claim has been agreed. |
| D-002 | 2026-10-20 | Plan before coding; compare HTML design directions before Android development. | Current work is documentation and product discovery. |
| D-003 | 2026-10-20 | Build for personal use first, with room to share later. | Do not assume public-launch or multi-user requirements. |
| D-004 | 2026-10-20 | Record PRs and view plans; use the existing app for workout execution and logging. | Exclude full workout logging from current scope. Identify the other app before discussing integrations. |
| D-005 | 2026-10-20 | Support both guided/advanced planning and easier/harder workouts. | Treat editing complexity and workout difficulty as distinct controls. |
| D-006 | 2026-10-20 | Use Gemini API for the chatbot. | Resolve chat behavior, data access, and API setup during discovery and technical planning. |
| D-007 | 2026-10-20 | Prioritize Android and a polished mobile experience. | Evaluate design directions in phone-sized layouts. Android implementation approach remains open. |
| D-008 | 2026-10-20 | The existing workout app is **Liftoff**. | Liftoff handles plan execution and workout logging. Import, export, and handoff are still undecided; no compatibility claim is made. |
| D-009 | 2026-10-20 | The heaviest single matters most; weight × reps is sometimes the only available record. | Prioritize measured singles while supporting rep-based PR entries. Any conversion to estimated singles remains undecided. |
| D-010 | 2026-10-20 | Strength comparisons should be relative to bodyweight. | Include bodyweight in the comparison requirements. Exact score methods and historical bodyweight handling remain open. |
| D-011 | 2026-10-20 | Use an animated **2D front/back** muscle display. | Design exploration should use 2D front/back anatomy rather than compare 2D with rotatable 3D. |
| D-012 | 2026-10-20 | Gemini can read PRISM plans and records and use the owner's profile, needs, preferences, and training approach. | Add a personal training profile. Field selection and context controls remain to be defined. |
| D-013 | 2026-10-20 | Gemini can prepare plan edits independently, with user confirmation required to save them. | Separate proposed edits from the saved plan. Confirmation applies the reviewed changes; rejecting leaves the plan unchanged. |
| D-014 | 2026-10-20 | Offer both muscle-first and training-split-first planning. | Provide two entry points into the same planning experience. Guided and advanced editing remain available. |
| D-015 | 2026-10-20 | Use Strength Level and the supplied screenshots as the reference for table-based strength results. | Include named tiers and bodyweight comparisons in the product direction. Preserve the screenshots and research source options; no direct integration, dataset reuse, or exact numerical parity has been agreed. |
| D-016 | 2026-10-20 | Store the supplied Gemini API key in the project-local `.env`. | Use `GEMINI_API_KEY`, exclude secret environment files through `.gitignore`, and keep the actual credential out of documents, design samples, and app bundles. Runtime integration remains deferred. |
| D-017 | 2026-10-20 | Accept the suggested training-profile fields and add rest/recovery context. | Include goals, experience, schedule, equipment, split, exercise preferences, constraints, and optional rest context. The owner invited useful necessary additions. |
| D-018 | 2026-10-20 | Use separate workout-adjustment controls. | Expose load, sets/reps, exercise choice, and session length independently; preview any related changes. |
| D-019 | 2026-10-20 | Store app data on the phone; no hosting is available. | Keep the personal first version usable without a hosted app backend or account. Cloud sync is deferred. Gemini still uses its remote API. |
| D-020 | 2026-10-20 | Add practical defaults under the owner's invitation to fill necessary details. | Preserve bodyweight context per PR, retain original rep entries, label estimates, share one plan across editor modes, support plan undo and manual backup/restore, and allow manual rest context if no imported record exists. These defaults remain adjustable. |
| D-021 | 2026-10-20 | Target Nothing Phone (3a) Pro; the owner uses a Xiaomi band with an Android Google health-data connection. | Evaluate Health Connect for rest/sleep reads on the device. Exact Android version, companion app, and available sleep records remain unverified. |
| D-022 | 2026-10-20 | The owner rejected all three initial visual proposals and paused design to find another reference. | Obsidian, Volt, and Porcelain are not approved designs. |
| D-023 | 2026-10-20 | The owner supplied the final design in `prism/design/`. | Adopt `design/project/canvas.json` and its nine `loadout-*.dc.html` screens as the visual source of truth. Design selection is complete. |
| D-024 | 2026-10-20 | Preserve PRISM as the app name while adopting the supplied visual system. | `Loadout` in file/board labels is a source identifier, not a user-requested rename. Preserve source filenames and map them to PRISM routes in the handoff. |
| D-025 | 2026-10-20 | Incorporate the final design's plate entry, plate-style preference, PR history, and planned-volume anatomy views into the product specification. | Keep existing scope: local records and plans, no full workout logging, explicit confirmation of coach plan edits, and no invented benchmark scores. |

| D-026 | 2026-10-20 | Implement the approved design using React Native with Expo; helper packages are authorized. | The Android app lives under `mobile/`; Expo Router and generated native projects are used. |
| D-027 | 2026-10-20 | The connected phone may be used through ADB for installation and testing. | Build locally and sideload a standalone APK; preserve credentials and clear only synthetic test data. |
| D-028 | 2026-10-20 | Use Gemini **3.8 Flash**. | Set `gemini-3.8-flash` as the default and phone model. No automatic fallback to another model. |

| D-029 | 2026-10-20 | Keep user-selected plate sizes; 20 kg plates must not become 25 kg equivalents. | Persist exact paired layout/bar weight with each new barbell PR. Typed totals still permit automatic layout. |
| D-030 | 2026-10-20 | Use the supplied FitnessVolt strength-data source. | Add explicit public API lookups, visible CC BY 4.0 attribution, separate competition/gym populations and cached results. |
| D-031 | 2026-10-20 | Add removal, clarified by D-033 below. | Initial whole-lift interpretation was superseded before final delivery. |
| D-032 | 2026-10-20 | Attach PR videos from links or the phone gallery. | One optional replaceable/removable attachment per record; private local playback or external web links. No hosting required. |
| D-033 | 2026-10-20 | Remove individual PR entries, not whole history. | Replace the whole-lift action with a per-entry trash control and confirmation. Other history entries stay; removed entries remain recoverable in Profile. |

| D-034 | 2026-10-20 | Allow choosing Gym or Competition for the displayed strength number. | Add a saved Profile preference controlling headline percentiles and FitnessVolt badges. Reuse both cached populations; show unavailable when the selected one is absent. |

## Decision discipline

Record user answers here and update the affected feature and discovery entries. Keep suggestions labeled as ideas until accepted. If a decision changes, preserve the old decision and add the replacement with its reason.
