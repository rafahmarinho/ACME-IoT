# ACME IoT — Industrial IoT & Building Digital Twin Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-SDK_52-black.svg)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-0.76-61DAFB.svg)](https://reactnative.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%26_Auth-3ECF8E.svg)](https://supabase.com/)
[![Three.js](https://img.shields.io/badge/Three.js-3D_Digital_Twin-black.svg)](https://threejs.org/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000.svg)](https://vercel.com/)
[![pnpm](https://img.shields.io/badge/Package_Manager-pnpm-F69220.svg)](https://pnpm.io/)

ACME IoT is an enterprise-grade IoT platform designed for building automation, environmental monitoring, and shadow state device control. Built with **React Native (Expo Router)** for Web, Android, and iOS, backed by **Supabase PostgreSQL & Realtime**, and featuring a high-performance **TypeScript Serverless API on Vercel**.

---

## 🌟 Key Platform Features

- **Light Interface with Indigo Accents**: Clean enterprise design system featuring Indigo (`#4F46E5` / `#6366F1`) accents, Slate surfaces, responsive navigation sidebar (desktop) and touch tab bar (mobile).
- **3D Room Digital Twin Viewer**: Interactive 3D room visualization powered by **Three.js** WebGL with perspective and isometric camera modes, real-time spatial placement of devices, status beacon indicators, and touch/click selection.
- **Desired vs Reported Shadow State**: Complete separation between cloud-commanded target state (*Desired State*) and hardware-reported telemetry (*Reported State*), with live sync status indicators and automatic reconciliation.
- **Multi-Tenant Hierarchy**: Organization ➔ Building ➔ Room ➔ Device hierarchy with organization and zone filtering.
- **5 IoT Device Types**:
  1. **Thermostats**: Target temperature adjustments, heating/cooling/eco mode switches, fan controls.
  2. **Smart Plugs**: Relay ON/OFF switching, active wattage draw (W), voltage (V), lifetime kWh energy metering.
  3. **Temperature Sensors**: High-precision ambient temperatures with 24-hour min/max excursion tracking.
  4. **Humidity Sensors**: Relative humidity percentage (%) and dew point computation.
  5. **Occupancy Sensors**: Radar and PIR motion detection with presence flags and daily detection tallies.
- **Edge Automations Engine**: Configurable Condition/Action rules (e.g. *"If temperature > 24°C, adjust thermostat to 21°C"* or *"Turn off AV plug on room vacancy"*) with run interval cooldowns, execution history, and alert notifications.
- **Interactive Scenarios Lab**: Advance simulation ticks, trigger thermal spikes, simulate packet loss waves (3 devices offline), battery drainage, OTA firmware rollout (+25% per tick), and gateway reconnection.
- **Offline Resilient Mode**: Mobile and web detect connectivity drops. Background updates pause, cached telemetry is rendered in a clean read-only view, and hardware controls are safely locked until reconnection.
- **Role-Based Access Control (RBAC)**:
  - **Owner**: Full system access, team permissions, billing, automations, and hardware controls.
  - **Administrator**: Manage buildings, rooms, devices, automations, and firmware deployments.
  - **Operator**: Live hardware control (switches, thermostats) and alert acknowledgement.
  - **Viewer**: Read-only observation of rooms, 3D twins, and telemetry.

---

## 📁 Project Architecture

```
ACME IoT/
├── .env.example                     # Sample environment variables
├── .npmrc                           # Hoisted node-linker configuration for Metro
├── app.json                         # Expo configuration (Web, iOS, Android)
├── babel.config.js                  # Babel configuration
├── metro.config.js                  # Metro bundler config
├── package.json                     # Project manifest and pnpm scripts
├── tsconfig.json                    # Strict TypeScript configuration
├── vercel.json                      # Vercel deployment rewrites & routing
├── api/                             # Vercel Serverless TypeScript Endpoints
│   ├── automations.ts               # Evaluates automation conditions & dispatches actions
│   ├── device-state.ts              # Queues desired state updates & reconciles shadows
│   ├── simulate-tick.ts             # Advances environmental physics & scenario ticks
│   └── telemetry.ts                 # HTTP ingestion endpoint for edge devices
├── supabase/
│   ├── schema.sql                   # 12 PostgreSQL tables, foreign keys, indexes, and RLS
│   └── seed.sql                     # Demo dataset (2 Organizations, 20 IoT Devices, Alerts, Rules)
├── src/
│   ├── components/
│   │   ├── 3d/
│   │   │   └── Room3DViewer.tsx     # Interactive 3D Room Viewer (Three.js WebGL)
│   │   ├── common/                  # Reusable UI primitives (Button, Card, Badge, Modal, Input)
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Header.tsx           # Org switcher, live connection pill, role selector
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── OfflineBanner.tsx    # Offline notice with reconnection action
│   │   │   ├── Sidebar.tsx          # Desktop navigation sidebar
│   │   │   └── TabBar.tsx           # Mobile bottom touch tab bar
│   │   ├── devices/
│   │   │   ├── DesiredVsReported.tsx # Shadow state side-by-side comparison
│   │   │   ├── DeviceCard.tsx       # Device card with status, battery, telemetry preview
│   │   │   ├── DeviceControls.tsx   # Thermostat slider & Smart plug toggle
│   │   │   └── QRScannerModal.tsx   # QR code scanner simulation & manual provisioning
│   │   └── simulation/
│   │       └── ScenarioControlBar.tsx # Quick-action bar for tick advance & scenarios
│   ├── context/
│   │   ├── AuthContext.tsx          # Supabase auth, roles, and quick role switcher
│   │   ├── NetworkContext.tsx       # Live/offline detection & mobile background pause
│   │   └── OrgContext.tsx           # Organization, building, and room active selection
│   ├── hooks/
│   │   ├── useAlerts.ts             # Alert stream, acknowledge, and resolve
│   │   ├── useAutomations.ts        # Automation rules and active state toggle
│   │   └── useDevices.ts            # Reactive device list and status filters
│   ├── services/
│   │   ├── demoData.ts              # 2 Orgs, 20 Devices, seed state
│   │   ├── simulationService.ts     # Scenarios: HVAC spike, battery drain, offline wave, OTA
│   │   └── supabase.ts              # Supabase client + AsyncStorage offline persistence
│   ├── types/
│   │   └── iot.ts                   # Strongly typed interfaces
│   └── utils/
│       ├── colors.ts                # Light interface tokens with Indigo accents
│       └── formatters.ts            # Temperature, humidity, watts, and relative time formatters
└── app/                             # Expo Router file-based screens
    ├── _layout.tsx                  # Root Providers (Auth, Network, Org)
    ├── (auth)/
    │   ├── login.tsx                # Sign in with email, pass, and quick role demo buttons
    │   ├── register.tsx             # New organization registration
    │   └── forgot-password.tsx      # Password recovery
    └── (app)/
        ├── _layout.tsx              # Responsive App Shell (Sidebar vs TabBar)
        ├── index.tsx                # Dashboard with KPIs, 3D Room Viewer, Quick Actions
        ├── buildings/
        │   ├── index.tsx            # Facilities and buildings overview
        │   └── [id].tsx             # Building detail with zones and rooms
        ├── rooms/
        │   └── [id].tsx             # Room 3D Digital Twin & room devices
        ├── devices/
        │   ├── index.tsx            # Device inventory with search and type/status filters
        │   ├── enroll.tsx           # Dedicated device enrollment screen
        │   └── [id].tsx             # Device detail (desired vs reported, chart, controls, OTA)
        ├── automations/
        │   └── index.tsx            # Condition/action rules, cooldowns, logs
        ├── alerts/
        │   └── index.tsx            # Incidents console (active, acknowledged, resolved)
        ├── events/
        │   └── index.tsx            # Chronological audit & telemetry event stream
        ├── firmware/
        │   └── index.tsx            # OTA fleet updates, flashing progress, rollback
        ├── integrations/
        │   └── index.tsx            # BACnet, AWS IoT shadow, Slack webhooks
        ├── team/
        │   └── index.tsx            # User directory and permissions matrix
        ├── profile.tsx              # User profile, role switch, logout
        └── settings.tsx             # Scenarios lab, advance tick, reset demo data
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v22+ tested)
- **pnpm**: v9.0.0 or higher (`corepack enable pnpm` or `npm i -g pnpm`)

### 2. Installation
Clone the repository and install all dependencies:

```bash
pnpm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your Supabase project credentials (or leave defaults to run the integrated offline/demo persistent engine):

```ini
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
EXPO_PUBLIC_API_URL=https://your-deployment.vercel.app/api
```

> **Note on Standalone / Demo Mode**: If no Supabase URL is specified, ACME IoT automatically activates the **Local Persistence Engine**, seeding all 2 organizations and 20 devices into browser `AsyncStorage`. All controls, automations, state updates, and scenario changes persist across page reloads!

### 4. Run Locally

- **Web Version**:
  ```bash
  pnpm web
  ```
  Open `http://localhost:8081` in your browser.

- **iOS Simulator / Android Emulator**:
  ```bash
  pnpm start
  ```
  Press `i` for iOS Simulator or `a` for Android Emulator.

- **Type Check**:
  ```bash
  pnpm typecheck
  ```

---

## 🗄️ Supabase Database Setup

1. Log into your [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. Navigate to the **SQL Editor** tab.
3. Open `supabase/schema.sql` and run the script. This creates:
   - 12 PostgreSQL tables (`organizations`, `user_profiles`, `buildings`, `rooms`, `devices`, `device_telemetry`, `automations`, `automation_logs`, `alerts`, `events`, `firmware_releases`, `integrations`).
   - Indexes for high-throughput device telemetry.
   - Row Level Security (RLS) policies.
   - Realtime publication subscriptions on `devices`, `alerts`, and `events`.
4. Open `supabase/seed.sql` and run the script. This populates:
   - 2 Organizations (*ACME Global Headquarters* and *Apex Logistics & Tech Park*).
   - 4 Role Profiles (*Sarah Jenkins [Owner]*, *Marcus Vance [Admin]*, *Elena Rostova [Operator]*, *David Kim [Viewer]*).
   - 4 Buildings and 5 Rooms.
   - 20 realistic IoT devices including Thermostats, Smart Plugs, Temperature Sensors, Humidity Sensors, and Occupancy Radars.
   - Initial automations, alerts, and firmware catalog entries.

---

## ☁️ Deploying to Vercel (Web Version & TypeScript API)

This project is pre-configured with `vercel.json` to deploy both the Expo static web build and the serverless TypeScript API functions in `api/`:

### 1. Build Verification
Test the production export locally:

```bash
pnpm build:web
```
This generates the optimized static bundle in `dist/`.

### 2. Deploy via Vercel CLI
```bash
npm i -g vercel
vercel
```

Or connect the GitHub repository directly to Vercel:
- **Framework Preset**: Other
- **Build Command**: `pnpm build:web`
- **Output Directory**: `dist`
- **Root Directory**: `./`

### 3. Set Environment Variables in Vercel
In the Vercel Project Settings ➔ Environment Variables, configure:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (if backend API functions need root database access)

The serverless endpoints will be accessible at:
- `POST /api/telemetry` — Ingest telemetry from edge devices
- `POST /api/device-state` — Shadow desired state mutations & sync
- `POST /api/automations` — Trigger condition checks and execute actions
- `POST /api/simulate-tick` — Step simulation or apply test scenarios

---

## 📱 Mobile App (Android & iOS Packages)

### 1. Cloud Builds via Expo Application Services (EAS Build)

1. Install EAS CLI:
   ```bash
   npm i -g eas-cli
   ```
2. Log into your Expo account:
   ```bash
   eas login
   ```
3. Initialize project configuration:
   ```bash
   eas build:configure
   ```
4. Build APK / AAB for Android:
   ```bash
   eas build --platform android --profile preview
   ```
5. Build IPA / Simulator build for iOS:
   ```bash
   eas build --platform ios --profile preview
   ```

### 2. Bare Native Prebuild (Local Xcode & Android Studio)
To generate the raw Android and iOS native projects locally:

```bash
npx expo prebuild
```

- **Run on Android Studio**:
  Open the `./android` folder in Android Studio and build with Gradle.
- **Run on Xcode**:
  Open `./ios/acmeiot.xcworkspace` in Xcode on macOS, configure your Apple Developer Team, and build.

---

## 🧪 Simulation Scenarios & Testing Guide

ACME IoT includes a dedicated **Interactive Simulation Lab** accessible from the Dashboard top bar or from the `Scenarios` screen:

| Scenario | Trigger Action | Expected Result |
| :--- | :--- | :--- |
| **Normal Ambient Drift** | Click `Advance Tick` | Drifts temperatures by ±0.2°C towards target; creates slight power fluctuations (W); evaluates automation conditions. |
| **HVAC Overheat Spike** | Select `HVAC Overheat Spike` | Spikes Boardroom and Atrium temps to ~27.8°C; triggers critical High Temperature incident and fires cooling automations. |
| **Gateway Outage** | Select `Gateway Outage (3 Offline)` | Simulates wireless packet loss; 3 devices become `offline` with disconnection alerts. Test reconnection via the `Ping & Reconnect` button on device details. |
| **Battery Drain Wave** | Select `Battery Drain Wave` | Depletes battery across wireless sensors. Lowers Dock Gate Occupancy Radar below 20% to test weak battery alerts. |
| **Advance OTA Firmware** | Select `Advance OTA Firmware` | Advances firmware download and flashing progress by +25% on updating nodes until 100% completion. |
| **Reconnect All Gateways** | Select `Reconnect All Gateways` | Restores all offline and warning sensors to `online` and auto-resolves disconnection alerts. |
| **Reset Demo Data** | Click `Reset Data` | Returns all 20 devices, automations, and alerts back to the golden pristine demo state. |

---

## 🛡️ Security & Content Integrity

- All database access is protected by Row Level Security (RLS) policies.
- Hardware control actions require active connectivity and verified role permissions (restricted for `viewer`).
- Untrusted sensor inputs are sanitized through the TypeScript ingestion schema.
- Built strictly following Microsoft content policies and modern clean architecture standards.
