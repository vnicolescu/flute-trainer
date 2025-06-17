

# Flute Trainer 🪈  
A lightweight, gamified web app that helps absolute‑beginner flutists learn notes and fingerings *intuitively*—right in the browser.

---

## ✨ Core Idea
1. **See** – A colour‑coded fingering diagram highlights which keys to press for each note.  
2. **Hear** – A reference tone plays the target note (sample or sine wave).  
3. **Play** – The mic listens like a tuner; when you hit the pitch (±30 cents), you pass.  
4. **Level up** – Practice single notes or random sequences (1‑5 notes) and toggle hints as you improve.

---

## 🎮 Features (v0.1 prototype)
| Area | What’s implemented |
|------|--------------------|
| Note set | C4 → C5 (expandable) |
| Fingering chart | Minimal SVG diagram; closed keys fill with colour |
| Colour scheme | Custom Tailwind palette: C = red, D = orange, E = amber, F = yellow, G = lime, A = green, B = teal |
| Sequence generator | Random length (1‑5) via dropdown |
| Audio output | Web Audio sine‑wave reference (1.2 s) |
| Pitch detection | Autocorrelation (basic but works) |
| UI toggles | “Show fingering” switch, sequence‑length selector |
| Stack | React + Vite, TailwindCSS, Radix UI Select, shadcn/ui, Framer Motion |

---

## 🏗️ Architecture
```
FluteTrainerApp.jsx
├─ Sequencer               // handles random notes & game flow
│  ├─ useAudioEngine       // playback + pitch detection hook
│  └─ FluteDiagram         // SVG fingering render
└─ utils
   ├─ noteToFreq()         // MIDI → Hz
   └─ detectPitch()        // autocorrelation helper
```

*All state lives in React; no backend required.*

---

## 🚀 Getting Started

```bash
# Clone & install
git clone <your‑fork‑url> && cd FluteTrainer
npm install

# Add extra libs (if you didn’t already)
npm i framer-motion tailwindcss classnames @radix-ui/react-select

# Tailwind (first‑time only)
npx tailwindcss init -p
# then update tailwind.config.js `content` to include:
#  "./index.html", "./src/**/*.{js,jsx,ts,tsx}"

# Run dev server
npm run dev   # Vite: http://localhost:5173
```

---

## ⚙️ Settings & Customisation
| Toggle | Behaviour |
|--------|-----------|
| Show Fingering | Hides/shows filled circles so you test memorisation |
| Seq. Length | 1‑5 random notes per round |
| Colour Mapping | Edit `NOTE_COLORS` in `FluteTrainerApp.jsx` |
| Fingering Chart | Expand `FINGERINGS` array to full chromatic set |

---

## 🛣 Roadmap
- 🎵 Replace sine beep with SoundFont flute samples  
- 📈 Score / streak system & “Challenge Mode”  
- 🪄 User calibration (detect personal A4 offset)  
- 📱 Mobile-friendly layout + haptic feedback  
- 💾 Save progress in `localStorage` / cloud

---

## 🤝 Contributing
1. Fork / branch.
2. `npm run lint && npm run test` (tests TBA).
3. PRs welcome—please keep commits atomic.

---

## 📝 License
MIT © 2025 Vlad Nicolescu. See `LICENSE`.