# 🧠 Mood Relief V5.0: Zero-Knowledge Affective Computing

**Mood Relief V5.0** is an offline-first, hyper-contextual mental wellness ecosystem. It transitions digital therapeutics from being reactive (opening an app when stressed) to proactive, predictive, and immersive—all while maintaining a cryptographically secure, zero-knowledge privacy architecture.

No cloud databases. No telemetry. Every piece of biometric sensing, computer vision, and machine learning executes statelessly in the client's browser.

---

## 🚀 The Architecture (The Edge-Compute Moat)

This application pushes the modern web browser to its absolute hardware limits, utilizing native APIs to create a deeply perceptive digital companion.

* **100% Local Intelligence:** All vector embeddings (Transformers.js) and predictive models (TensorFlow.js) are compiled to WebAssembly and cached permanently via the Service Worker.
* **Encrypted Storage:** Journal entries and biometric logs are secured using the Web Crypto API and stored entirely within `IndexedDB`.
* **Ephemeral Networking:** Peer-to-peer co-regulation and localized haptic syncing are handled statelessly via WebRTC, bypassing central servers.

---

## ✨ Frontier-Level Feature Matrix

| Feature | Browser API / Engine | Clinical / Lifestyle Utility |
| --- | --- | --- |
| **MoveNet Posture Sensing** | `TensorFlow.js` (Webcam) | Detects "tech neck" fatigue and triggers automated desk-reset stretches. |
| **rPPG Optical Vitals** | `Canvas` + Pixel Analysis | Estimates heart rate statelessly by isolating the Green RGB channel. |
| **Vocal Strain Detection** | `Web Audio AnalyserNode` | Monitors pitch degradation and fry to prompt vocal-cord cooldowns. |
| **Shift-Work LSTM Forecasting** | `TensorFlow.js` (Time-Series) | Dynamically adjusts circadian predictions for rotating hospitality/night shifts. |
| **Kinematic Agitation** | `DeviceMotion API` (Accelerometer) | Distinguishes nervous tremors from the rhythmic rumble of transit/travel. |
| **Haptic Somatic Pacing** | `Vibration API` | Overlapping 100ms micro-pulses for eyes-closed, silent grounding. |
| **Local RAG Journal Search** | `Transformers.js` (WASM) | Semantic search of past entries for patterns, completely offline. |
| **Immersive Magic Window** | `WebXR` (Gyroscope) | 360-degree spatial environments for sensory override during panic. |
| **IoT Ambient Lighting** | `Web Bluetooth` (GATT) | Syncs room lighting to anxiety forecasts without local HTTP/CORS limits. |
| **EMDR Bilateral Sync** | `StereoPannerNode` | Sweeps 220Hz tones between earbuds paired with visual tracking. |

---

## 🎨 Immersive & Exportable UI

* **Voice-Reactive WebGL Fluids:** A custom GLSL fragment shader maps microphone amplitude to fluid turbulence, and pitch to color palette. The user physically sees their stress smoothing out in real-time.
* **MediaRecorder API Exports:** Users can capture 15-second, 9:16 vertical video clips of their audio-reactive aura for seamless sharing to Shorts or Reels.
* **Gamified Theme Matrix:** CSS custom properties dynamically switch the UI into unlocked environments (*Deep Ocean Calm*, *Midnight Forest*) based on usage streaks.
* **Hyper-Regional Localization:** Supports 13 languages. When operating in Hindi or Bengali, the system pivots from clinical Western CBT to traditional Ayurvedic breathing ratios and regional philosophical reframing.

---

## 🛠️ Tech Stack

* **Core:** Astro, TypeScript, Tailwind CSS
* **Machine Learning:** TensorFlow.js (MoveNet, LSTM), Transformers.js (all-MiniLM-L6-v2)
* **Native Browser APIs:** WebRTC, Web Audio API, Web Bluetooth, WebXR, Web Crypto, DeviceMotion, MediaRecorder
* **State & Storage:** IndexedDB (V3 Schema), Service Workers (Vite PWA)

---

## 🔒 Privacy Manifesto (Zero-Knowledge)

Mental health data is the most sensitive data a user generates. This app operates under a strict **Zero-Knowledge Guarantee**:

1. **Webcam feeds** are rendered to a hidden HTML5 canvas for rPPG and Posture tracking and are instantly destroyed. They are never recorded or transmitted.
2. **Audio feeds** process locally through the Web Audio node tree.
3. **No proxy servers** are used for IoT smart home connections; the browser communicates directly to the bulb via Bluetooth Low Energy.

---

## 💻 Local Deployment

To run this architecture locally on your machine:

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mood-relief-v5.git
```

2. Install dependencies:
```bash
cd mood-relief-v5
npm install
```

3. Start the development server:
```bash
npm run dev
```

*(Note: Posture Vision, rPPG, and Web Bluetooth require a secure context. Ensure you are running `localhost` or serving over HTTPS).*

---
