# Smart Grain Warehouse

IoT and Edge-AI based Smart Grain Warehouse Monitoring System for Indian farmers, using ESP32, TinyML, and Firebase.

## What the app does

- Uses one warehouse route at a time; enter its ID at the home page. Another warehouse can be opened by entering its ID.
- Lists bins from `warehouses/{warehouseId}/binIndex/{binId}` and reads only each indexed bin's `metadata` and `latest` nodes for the overview.
- Loads at most the latest 200 `history` entries only on an individual bin page.
- Shows email/password sign-in, explicit no-data/read-error/sensor-error states, per-bin grain filtering, and device-reported TinyML output.
- Does not seed sample readings or infer an offline state when the device has not reported one.
- Does not provide a grain safety assessment until a grain profile has reviewed limits and a cited source.

The app is read-only. Bin metadata and the bin index must be provisioned through a trusted process. Browser users cannot write to Realtime Database.

## Realtime Database layout

Each warehouse uses these nodes:

```text
warehouses/{warehouseId}/binIndex/{binId}: true
warehouses/{warehouseId}/bins/{binId}/metadata
warehouses/{warehouseId}/bins/{binId}/latest
warehouses/{warehouseId}/bins/{binId}/history
```

`metadata` must include `binId`, `grainType`, and `deviceId`. `latest` and each history entry can contain `temperatureC`, `humidityPercent`, `gasRawAdc` or a calibrated `gasValue` with `gasUnit`, `timestamp`, `riskLabel`, `riskScore`, `modelVersion`, and a device connectivity state. The client accepts `deviceStatus`, `connectivityStatus`, or `deviceConnectivityStatus` for that state; coordinate the final field names and timestamp format with Member 1 before deploying device firmware.

The app does not convert gas values or risk scores. It displays the device-provided risk label/score as model output, not as a scientifically validated prediction. History entries need a timestamp to appear in the chart.

## Grain profiles

The initial profile registry is in `src/domain/grainProfiles.js`. Rice, wheat, maize, ragi, jowar, and bajra are listed with no thresholds or source. Add other varieties there or they can still be displayed when present in bin metadata. To enable assessment, a reviewed, grain-specific source and minimum/maximum temperature and humidity limits are required; otherwise the UI keeps the condition as not assessed.

## Local setup

1. Install a supported Node.js LTS release and npm.
2. Install dependencies:

   ```sh
   npm install
   ```

3. Copy `.env.example` to `.env.local`. Create a Firebase web app and fill in its client configuration:

   ```dotenv
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_DATABASE_URL=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_APP_ID=
   VITE_FIREBASE_RULES_DEPLOYED=false
   ```

   The Firebase web app settings are client configuration, not Admin SDK credentials. Never put a service-account key or another server secret in a `VITE_` variable, the browser, or the ESP32 firmware. `.env.local` is ignored by Git.

4. In Firebase Console, enable the Email/Password sign-in provider and create accounts for approved dashboard users. A trusted Admin SDK process must assign each approved user's `dashboardReader: true` custom claim. The app has no self-registration and never assigns claims itself. Until the claim exists, it will not open a database connection.
5. Review `database.rules.json`, then deploy it with the Firebase CLI after selecting your own project:

   ```sh
   firebase login
   firebase use --add
   firebase deploy --only database
   ```

   The rules deny access by default. Dashboard reads require the `dashboardReader: true` custom claim. Writes to `latest`/`history` require a trusted token carrying both `deviceWriter: true` and a `binId` claim matching the target bin. `metadata` and `binIndex` writes are denied. A trusted server-side claim issuer/provisioning process is required for dashboard and device claims; it must keep Admin credentials off the device and out of this frontend.

6. Only after deploying and reviewing the rules and provisioning the trusted claim process, set `VITE_FIREBASE_RULES_DEPLOYED=true` in `.env.local` and restart Vite. This local flag is a startup interlock, not a replacement for Firebase Security Rules.
7. Start the app and enter a warehouse ID that has an authenticated-readable bin index:

   ```sh
   npm run dev
   ```

   Add each provisioned bin to the index as `true`. If the index has not been provisioned, the dashboard will show an empty state and will not scan the full `bins` tree.

## Checks

```sh
npm test
npm run build
```
