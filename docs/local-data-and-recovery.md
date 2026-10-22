# Local data and recovery

Updated: 2026-10-20
Status: implemented; initial integration research is retained below

## Current implementation

Validated JSON data persists through a serialized AsyncStorage queue. Export/restore uses Android share/document pickers; replacement requires confirmation. Secrets and Health Connect records are excluded. Remove PR entry acts on one record only, with confirmation and recovery through Profile → Archived PRs. Other entries for the same exercise remain unchanged. User data is preserved during APK updates.

PR videos can be HTTPS/HTTP links or gallery clips selected with Android's system picker. Clips up to 1 GB are copied into PRISM's private document directory; only app-owned copies can be removed. Archives retain attachments. JSON backups include links and local file metadata, not binary clips; restoring elsewhere requires reattaching missing local videos. Video links/file paths are excluded from Gemini context. The source gallery file is never changed.

The personal Gemini key is stored in native SecureStore and entered through Profile. The ignored development `.env` is never bundled. Direct requests use the user's selected `gemini-3.8-flash`. Optional Health Connect sleep access and sharing with Coach are separate opt-ins, both off by default. Automated testing has not granted/read private sleep data.

## Confirmed constraints

- Personal data lives on the phone. The owner has no hosting available for now.
- Target device: Nothing Phone (3a) Pro, Android.
- The owner uses a Xiaomi band and reports a Google health-data connection through Android activity settings, described as the successor to Google Fit.
- Rest/recovery context should be available to the profile and planning experience where data exists.

## Phone data scope

Store PR history, profile, saved plans, plan revisions, settings, and any explicitly retained recovery summaries locally. Core PR entry and plan viewing/editing must remain usable without internet. Gemini needs an online connection; chat failure must not block local features or discard drafts.

Selected practical defaults: user-controlled backup/export and restore, with secrets excluded; plan undo; dated bodyweight context with each PR. Backup location and file format remain to be chosen. Cross-device cloud sync and sign-in are deferred.

## Proposed Google health-data route

Health Connect is the proposed on-device integration route. This maps the user's description to an Android integration candidate; it does not confirm which records their band app actually shares.

Google describes Health Connect as an on-device health-data platform with per-app permissions. An app can read available records through its Android API without a PRISM-hosted server. [Android architecture](https://developer.android.com/health-and-fitness/health-connect/architecture)

Health Connect supports sleep-session records, with optional sleep stages. Availability must be checked, and reading sleep requires user-granted access that can later be revoked. [Sleep sessions](https://developer.android.com/health-and-fitness/health-connect/features/sleep-sessions)

Research checked: 2026-10-20. Actual sleep coverage depends on the installed companion app, its sharing settings, and the data it has recorded. Do not promise direct Xiaomi-band support, automatic sleep collection by PRISM, or access to every metric.

## First recovery scope

- Optional read-only sleep context: last available sleep duration, date, and source.
- Optional manually entered rest/soreness notes when useful, with clear separation from imported records.
- Clear unavailable/permission-denied/no-record states. Missing sleep is never treated as zero sleep or poor recovery.
- Ask only for data types used by an enabled feature. Extra metrics such as heart rate or HRV are not first-version commitments.
- No invented readiness percentage or medical interpretation.
- Rest data does not authorize background plan edits; proposed plan changes still require confirmation.
- Separate the setting for reading health data from the setting for including a recovery summary in Gemini context.

## Integration verification before development

Identify the companion app and Android version, check Health Connect availability and shared record types on the device, then choose permissions and refresh behavior. A rest-summary mockup is illustrative until these checks succeed.

## Gemini credentials and no-hosting constraint

The development key is stored in the ignored project `.env`; successful real Gemini calls have also been verified through the phone's SecureStore credential. The environment file is excluded from the application bundle. Google warns against hardcoding API keys in mobile applications. [Gemini key guidance](https://ai.google.dev/gemini-api/docs/api-key)

No requirement to rent or operate a server is being introduced. Public distribution and shared credentials would need a separate technical decision later.
