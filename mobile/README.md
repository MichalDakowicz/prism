# PRISM for Android

Personal strength companion built with React Native, Expo SDK 58, TypeScript and Expo Router. The approved design lives in `../design/project` and remains the visual reference.

## Run locally

Use Node 22+, JDK 21, Android SDK platform 37.0, Build Tools 37.0.0, NDK 27.1.12297006 and CMake 3.31.6. Android 9/API 28 is the minimum runtime. Native Health Connect requires a custom Android build; Expo Go is insufficient.

```powershell
cd C:\stuff\prism\mobile
npm ci
npm run lint
npm run typecheck
npm test
npm run android
```

For development on a connected phone, `adb reverse tcp:8081 tcp:8081` connects Metro over USB. A release APK embeds JavaScript and fonts and runs without a development server.

## Build a standalone APK on this machine

```powershell
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME = 'C:\Users\MSI\AppData\Local\Android\Sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:NODE_ENV = 'production'
npm run prebuild
Push-Location android
.\gradlew.bat :app:assembleRelease -PreactNativeArchitectures=arm64-v8a --console=plain
Pop-Location
& "$env:ANDROID_HOME\platform-tools\adb.exe" install -r android/app/build/outputs/apk/release/app-release.apk
```

This personal test build uses Expo's generated debug signing key even in the release variant. It is suitable for sideload testing, not a Play Store release. Keep the signing identity stable for future updates. The CMake config plugin selects a newer Ninja toolchain and shortens object paths for Windows. Change native settings through `app.config.ts` or plugins; generated `android/` is not source.

## App behavior

- **Lifts:** enter a measured single or 2–12 rep record, snapshot bodyweight/date/comparison attributes, inspect history and remove individual mistakes. Chosen plate pairs retain their exact sizes/order, including 20 kg plates. Each history row has Remove PR entry, with confirmation and recovery in Profile; other entries remain untouched. Attach one video link or gallery clip per PR, during entry or from an existing history entry. Measured singles take precedence over estimates. Load is per dumbbell for dumbbell exercises; bodyweight movements record added load.
- **Body:** animated front/back muscle selection and planned primary-muscle sets across saved plans. It does not infer recovery or completed workouts.
- **Plans:** start from muscles or a split, edit guided/advanced details, tune four separate controls, review changes and undo revisions. Liftoff remains the workout logger.
- **Coach:** direct Gemini requests from the phone. Choose context per message; recent chat is also included. AI proposals require a review and explicit confirmation, with revision checks and validation before saving.
- **Profile:** preferences, optional Health Connect sleep sessions, standards import, backup export/restore and archived PR recovery.

There are no accounts, hosted services, analytics or built-in sample records. Local JSON data is validated before storage and before restore. Storage writes are serialized and awaited before reporting success.

## Gemini credentials

The repository-root `.env` contains the supplied local `GEMINI_API_KEY`, excluded from Git. The app never bundles this file or reads an `EXPO_PUBLIC` key. Enter the key in Profile; native Expo SecureStore stores it on the phone. Exported backups exclude the key. The web preview only keeps a key in memory.

`scripts/check-gemini.cjs` is an explicit, optional network diagnostic that reads the local environment file without printing the key. Normal tests mock the API and use no quota. `scripts/phone.cjs provision-key` can enter that local key into the observed masked PRISM profile field for authorized device testing.

Gemini model ID is editable. Initial model is `gemini-3.8-flash`, verified available during implementation. Model availability and quotas depend on the supplied account. The response grammar is compact; stricter Zod and exercise/schedule validation runs locally. Failed requests preserve the composer and never apply plan changes.

## Health and backups

Sleep reads require native Android permission, requested only after turning on the Profile switch. Reading health data and allowing rest context for Coach are separate. Rest sharing starts off. The Xiaomi companion app must actually write sleep sessions to Health Connect. Session duration describes its recorded interval, not necessarily time asleep. No sleep data is copied into backups.

Export a JSON backup through Android's share sheet. Restore validates the entire file and asks before replacing local data. Backups include profile notes and chat, so choose a private destination. SecureStore credentials remain separate.

Gallery video selection uses the Android system picker, without requesting camera/microphone or broad gallery access. Videos up to 1 GB are copied into private persistent app storage; removing an attachment deletes only PRISM's copy. Archiving a record keeps its video. JSON backups contain video links/local attachment metadata, not video binaries. After restoring onto another phone, missing clips must be attached again. Video links open externally; gallery clips play locally with native controls and fullscreen. Gemini receives neither video links nor file names; no video analysis/upload is performed.

## Strength tiers

FitnessVolt's public API supplies opt-in rankings for bench press, squat, deadlift and overhead press. Comparison inputs use historical PR bodyweight and a measured/estimated 1RM; age/group fall back to Profile when absent on the record. Competition and self-reported gym percentiles remain separate. Results are cached locally; refresh is available after one hour. Unsupported variants retain bodyweight ratios and optional custom standards. API errors never modify the PR.

Powered by FitnessVolt, licensed CC BY 4.0: https://fitnessvolt.com/strength-standards/strength-data/. The API score/tier is a population ranking, distinct from FitnessVolt's editorial five-level standards tables. Custom threshold tables can still be imported; see `../docs/standards-format.md`. No normative data or synthetic scores are bundled. `node scripts/check-fitnessvolt.cjs` performs an explicit public API check with synthetic inputs; normal tests mock requests.

Profile → Strength score selects Gym or Competition for the headline /100 number and FitnessVolt lift badges. Save Profile to apply. Switching uses cached population percentiles without another API request. Both populations remain visible in details; an unavailable selected cohort shows no number rather than falling back. The API tier is shown only for the population it describes. Existing profiles default to Competition; the choice is included in backups.
