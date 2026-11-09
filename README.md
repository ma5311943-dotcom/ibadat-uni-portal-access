# Student Lookup

A dark-themed Android-first React Native app built with Expo. Enter a
registration number, the app Base64-encodes it, calls the student API, and
renders the returned record in a modern card layout.

## Features

- Prominent registration-number search with keyboard submit and loading state
- UTF-8-safe Base64 encoding with no extra polyfill or Base64 dependency
- Configurable API base URL through Expo environment variables
- Handles loading, 404, network, timeout, auth, and malformed-response states
- Dark UI with pure black background, `#121212` cards, and cyan accents
- Responsive result grid for Android phones and tablets
- Parses the server-rendered page into profile, photo, event ticket, transport,
  exam seating, and fee sections
- Full-screen photo viewer with safe-area layout and Back controls
- Full-screen fee drawer with per-invoice cards, responsive columns, and Back
  controls at both the top and bottom
- Also accepts JSON student records, including common wrappers
- Optional student photo, status badge, extra fields, and a fixed campus note
- Safe-area support for edge-to-edge Android screens, including modals

## Dependencies

- Expo SDK 58 / React Native 0.88 / React 19
- `@expo/vector-icons` for the Ionicons icon set
- `expo-font` required by the icon set
- `react-native-safe-area-context` for status/navigation bar insets
- `expo-splash-screen` for a black native splash screen
- `expo-status-bar` for light status-bar content

No Base64 library is required. The app includes a small UTF-8-safe encoder at
`src/utils/base64.js`, so it works even when `btoa` or `Buffer` is unavailable.
If you prefer a package, `react-native-base64` or `base-64` can replace it.

## Project structure

```text
.
├── App.js
├── app.json
├── .env.example
└── src
    ├── api
    │   └── studentApi.js          # URL building, fetch, timeout, error mapping
    ├── components
    │   ├── CampusNote.js          # Fixed note shown below the lookup
    │   ├── ConfigNotice.js        # Missing .env warning
    │   ├── EmptyState.js
    │   ├── ErrorState.js
    │   ├── FeeViewer.js           # Full-screen invoice drawer
    │   ├── LoadingState.js
    │   ├── PhotoViewer.js         # Full-screen student photo
    │   ├── SearchPanel.js
    │   └── StudentCard.js
    ├── hooks
    │   └── useStudentLookup.js    # Search state machine and request cancellation
    ├── screens
    │   └── StudentLookupScreen.js
    ├── theme
    │   └── colors.js
    └── utils
        ├── base64.js
        ├── fees.js                # Invoice status and summaries
        ├── studentRecord.js       # Tolerant JSON normalization
        └── studentHtml.js         # Student details page parser
```

## 1. Configure the API URL

Edit `.env` in the project root:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-api-domain.com
```

The value can be the API origin or the full `/student-details` endpoint. If the
path is missing, the app adds it once. The encoded registration number is then
appended:

```text
GET {resolved-api-base}/student-details/{url-encoded-base64(registrationNumber)}
```

Example request:

```text
Registration number: REG-12345
Base64:              UkVHLTEyMzQ1
Request URL:         https://your-api-domain.com/student-details/UkVHLTEyMzQ1
```

Notes:

- Trailing slashes on `EXPO_PUBLIC_API_BASE_URL` are ignored.
- The app automatically adds `/student-details` when the configured URL does not
  already end with that path.
- The Base64 value is URL-encoded as a path segment for safety. Normal frameworks
  decode the parameter back to the original Base64 before your handler runs.
- Variables prefixed with `EXPO_PUBLIC_` are embedded in the app bundle. Do not
  put API secrets in them. Keep private authorization on a backend/proxy.
- Android blocks cleartext HTTP by default. Use HTTPS for the API. For a local
  HTTP server, use an emulator address such as `http://10.0.2.2:3000` and apply
  an Expo/Android cleartext configuration for development only.
- Restart Expo after changing `.env`. Use `npx expo start --clear` if an old
  value is cached.

The repository's `.env` is intentionally ignored by Git; `.env.example` is the
shareable template.

## 2. Install

Requirements:

- Node.js 22.13 or newer (Expo SDK 58 minimum)
- npm (bundled with Node)
- For a local native build: Android Studio with the Android SDK and build tools
  required by SDK 58, plus a configured emulator or a USB-debugging device

Install JavaScript dependencies:

```bash
npm install
```

## 3. Run on Android

### Option A - Fastest: Expo Go

1. Start the dev server:

   ```bash
   npx expo start
   ```

2. Press `a` to open the Android emulator, or scan the QR code with the Expo Go
   app on your Android phone (phone and computer must be on the same network).

All dependencies in this project are included in Expo Go, so no custom native
build is required for development.

### Option B - Local native debug build

Use this to build and install the app locally with the Android toolchain:

```bash
npx expo run:android
```

Or with the included script:

```bash
npm run android:build
```

The first run generates the native `android/` folder using Continuous Native
Generation, compiles the debug build, and installs it on the running emulator or
connected device. Do not edit generated `android/` or `ios/` folders manually;
configure native behavior in `app.json` or config plugins.

### Optional: Cloud build for a shareable APK/AAB

EAS builds the Android artifact in the cloud without Android Studio:

```bash
npx eas-cli@latest build --platform android
```

Follow the prompts to sign in and configure a build profile. Use
`--profile preview` after adding an APK preview profile in `eas.json` if you
want an installable APK instead of an AAB.

## 4. Verify the project

```bash
npm run lint
npx tsc --noEmit
```

## Response formats

The configured endpoint currently returns a server-rendered student details
page. The app reads the profile header (name, registration number, program,
semester, session, and photo) and renders dedicated sections for the event
ticket, transport, exam seating, and fee records. Event, transport, and seating
details appear inline; the photo and fee records open in full-screen viewers.
Fee rows are grouped into current, previous, and transport invoice sections.
HTML parsing lives in `src/utils/studentHtml.js`, and invoice status helpers live
in `src/utils/fees.js`.

The client also accepts JSON. It supports a direct student object or common
wrappers such as `data`, `student`, `result`, `record`, `records`, or `details`.
Arrays use the first record. Field names are matched case-insensitively and
support camelCase, snake_case, and PascalCase.

Example JSON:

```json
{
  "success": true,
  "data": {
    "name": "Ayesha Khan",
    "registrationNumber": "REG-12345",
    "department": "Computer Science",
    "semester": 4,
    "session": "Fall-2026",
    "status": "Active",
    "email": "ayesha@example.com",
    "phone": "03001234567",
    "cgpa": 3.82,
    "section": "A",
    "batch": "2024",
    "campus": "Main Campus"
  }
}
```

Core JSON fields are normalized in `src/utils/studentRecord.js`. Any
unrecognized, non-empty fields are displayed under **More details** on the
student card, so additional API fields do not require UI changes. JSON records
without `feeGroups` simply omit the fee button and fee section.

If the JSON API uses different key names, add them to `FIELD_ALIASES` in that
file. If it returns a different envelope, add the wrapper key to `WRAPPER_KEYS`.
If the student page layout changes, update the section landmarks in
`src/utils/studentHtml.js`.

## Error states

- **Registration number not found**: API returned HTTP 404 or an explicit
  not-found message.
- **Connection problem / Request timed out**: network failure or no response
  within 15 seconds.
- **Access denied / Too many requests**: HTTP 401/403/429.
- **Unexpected response**: successful HTTP response without a readable student
  page or JSON record.
- **API endpoint not configured**: `.env` is missing the base URL.

## Troubleshooting

- **`API endpoint not configured` banner**: set
  `EXPO_PUBLIC_API_BASE_URL` in `.env`, stop Expo, and start it again.
- **404 for a number that exists**: the app appends `/student-details`
  automatically. Confirm the endpoint expects the Base64 value in the final path
  segment and that the student page is reachable without a login redirect.
- **Network request fails on emulator**: `localhost` inside the emulator points
  to the emulator itself. Use your computer's LAN IP. The Android emulator maps
  the host machine to `10.0.2.2`.
- **Base64 mismatch**: the app trims leading/trailing whitespace and encodes the
  registration number as UTF-8. A-Z casing is preserved.
- **Stale `.env` value**: run `npx expo start --clear` and reload the app.
