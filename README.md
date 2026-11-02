# MeshPay React Native App

MeshPay is an Expo Android frontend connected to the Spring Boot API in the sibling `UPI_Without_Internet` project. It does not use Bluetooth or connect to a bank or live UPI provider. Payment screens are review-only; this build does not send or settle money.

## Start the backend

In a separate terminal, run:

```powershell
cd ..\UPI_Without_Internet
.\mvnw.cmd spring-boot:run
```

The backend listens on port 8080 by default and uses an in-memory H2 database unless `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` configure another database. Its payment pipeline remains a software simulator; no funds are transferred. Bank linking and live UPI verification stay unavailable until an authorized provider is configured.

## Run on Android

Install Node.js LTS, Android Studio, and an Android emulator (or the Expo Go app on a device). From this folder, run:

```bash
npm install
npx expo install --fix
npx expo start
```

Press `a` in the Expo terminal to open the Android emulator, or scan the QR code with Expo Go. For a native Android project, run `npx expo prebuild` followed by `npx expo run:android`.

The Scan screen is a placeholder: camera scanning is not implemented. Payment QR generation and payment submission are unavailable until a PSP/acquirer and recipient settlement routing are approved.

Set `EXPO_PUBLIC_API_URL` in `.env` to the backend address. Use HTTPS for deployed backends. For local Android development only, use `http://10.0.2.2:8080` in an emulator or the computer's LAN IP on a physical phone; the Expo config enables Android cleartext traffic only when that URL uses HTTP. Keep both devices on the same network and restart Expo after changing the URL.

The Wallet screen links a bank account only after SMS OTP verification to the phone number on the signed-in account. Account verification requires the configured Cashfree Secure ID integration and an IFSC; sandbox responses remain pending and are not treated as live verification. Account Aggregator consent and balance retrieval are not implemented. Keep provider credentials on the backend only.
The bank picker displays bundled snapshots of each bank's public website favicon so the icons work offline. These marks identify the selected bank; they do not mean an account is linked or verified.

For browser-based Expo development on `http://localhost:8081`, the backend allows that origin (and `http://127.0.0.1:8081`) for API requests. Set the backend's `APP_CORS_ALLOWED_ORIGINS` environment variable to a comma-separated origin allowlist if using a different web origin.

## Project layout

- `src/screens` contains the app screens, including login and account creation forms.
- `src/components` contains reusable UI and network diagram components.
- `src/data` can hold static app configuration; it contains no user or financial records.
- `src/services` separates authentication, contacts, payment, transaction, bank-account, and mesh operations through the configured REST client.
- `src/context` holds backend-provided transaction state for the current app session.

Login and account creation call `/api/auth/login` and `/api/auth/signup`. Recipient search calls `POST /api/recipients/lookup`; a user can explicitly save a discoverable record with `POST /api/recipients/saved`, then sync their saved snapshot with `GET /api/recipients/sync`. Users manage exact-number lookup opt-in through `GET/PUT /api/recipients/me/discoverability`. These app-directory records are not OTP or bank verified. Lookup is authenticated and rate limited; records are returned only after the recipient opts in. `GET /api/recipients/provider-status` reports that live verification is not configured.

The app keeps explicitly saved recipient names and MeshPay IDs in an owner-scoped SQLite cache for offline recipient identification. A salted hash of the normalized phone number is used as the local lookup key. Cached entries older than 30 days are marked stale. Native session restore uses SecureStore; web session restore uses browser local storage. A saved profile is retained in offline mode when the backend is unreachable or rejects its token; sign in again to restore online access after a token is rejected. Explicit logout clears the saved session. Browser storage is accessible to scripts running on the same origin, so production web deployments should also use appropriate XSS protections. Cached records never indicate bank verification. A server directory record can be cached only after the user chooses “Save for offline.”

Run backend tests with `.\mvnw.cmd test` from the backend project. Tests use an isolated in-memory H2 database with `create-drop`; they do not use the configured development database.
