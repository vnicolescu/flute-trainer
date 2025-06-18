# Flute Trainer 🪈
A lightweight, gamified web app that helps beginner flutists learn notes and fingerings *intuitively*—right in the browser.

---

## ⚠️ Current Status (Under Refactoring)
The application is currently undergoing a significant refactoring to address several critical issues. The user-facing experience is unstable.

### Known Issues
-   **[BUG] Broken Layout:** Main content overflows the viewport, requiring scrolling. Components are not fully responsive.
-   **[BUG] Visual Glitches:** The current note is not being colored correctly and may appear white. The musical staff display is broken.
-   **[BUG] Faulty Audio Engine:** The flute tone playback is laggy, often gets interrupted, or fails to play entirely.
-   **[BUG] Overly Sensitive Pitch Detection:** The pitch detection is too lenient and can be triggered by background noise.
-   **[CONFIG] Build Errors:** The `tsconfig.node.json` contains an invalid compiler option (`erasableSyntaxOnly`) that needs to be removed.

### Refactoring Plan
1.  **Stabilize the Layout:** Implement a robust, responsive layout using Flexbox to ensure all UI elements fit on the screen at all times.
2.  **Fix Visuals:** Correctly apply the color to the currently displayed note and repair the musical staff component.
3.  **Rebuild Audio Engine:** Re-implement the audio engine to use a single, persistent `AudioContext` and `WebAudioFont` player for smooth, reliable sound playback.
4.  **Improve Pitch Detection:** Refine the pitch detection algorithm to be more robust against background noise and require a more stable tone.
5.  **Clean Configuration:** Resolve all outstanding build and linter errors.

---

## ✨ Core Idea
1.  **See** – A color-coded fingering diagram and musical staff show which keys to press for each note.
2.  **Hear** – A clear, realistic flute tone plays the target note.
3.  **Play** – The mic listens like a tuner; when you hit the pitch accurately and hold it, you pass.
4.  **Level up** – Practice single notes or random sequences (1-5 notes) and toggle hints as you improve.

---

## 🎮 Features (v0.2 Target)
| Area                | What's being implemented                                        |
| ------------------- | --------------------------------------------------------------- |
| Note set            | C4 → C5 (expandable)                                            |
| Fingering chart     | Detailed, responsive SVG diagram with correct key highlighting. |
| Musical Notation    | Note heads appear correctly on a five-line staff.               |
| Sequence generator  | Random length (1-5) via dropdown.                               |
| Audio output        | `WebAudioFont` for realistic flute samples.                     |
| Pitch detection     | `pitchy` library with RMS volume gate and clarity checks.       |
| UI toggles          | "Show fingering" switch, sequence-length selector.              |
| Stack               | React + Vite, TypeScript, TailwindCSS, shadcn/ui.               |

---

## 🚀 Getting Started

```bash
# Clone & install
git clone <your-fork-url> && cd FluteTrainer/flute-trainer
npm install

# Run dev server
npm run dev
```

---

## 🛣 Roadmap (Post-Refactoring)
-   🎵 Replace sine beep with SoundFont flute samples **(IN PROGRESS)**
-   📈 Score / streak system & "Challenge Mode"
-   🪄 User calibration (detect personal A4 offset)
-   📱 Mobile-friendly layout + haptic feedback **(IN PROGRESS)**
-   💾 Save progress in `localStorage` / cloud
-   🎶 Display full sequence of notes on screen.
