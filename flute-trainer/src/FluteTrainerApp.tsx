import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PitchDetector } from "pitchy";
import * as Pitchfinder from "pitchfinder";

// Make the webaudiofont player and types available
declare var WebAudioFontPlayer: any;
declare var _tone_0770_SBLive_sf2: any;

// New, more detailed fingering data based on a standard flute chart.
// Each key is represented by a property. `true` means the key is pressed.
const FINGERINGS: Record<string, Record<string, boolean>> = {
  C4: { thumb: true, lh1: true, lh2: true, lh3: true, rh1: true, rh2: true, rh3: true, pinkyC: true },
  D4: { thumb: true, lh1: true, lh2: true, lh3: true, rh1: true, rh2: true, rh3: true, pinkyEb: true },
  E4: { thumb: true, lh1: true, lh2: true, lh3: true, rh1: true, rh2: true, pinkyEb: true },
  F4: { thumb: true, lh1: true, lh2: true, lh3: true, rh1: true, pinkyEb: true },
  G4: { thumb: true, lh1: true, lh2: true, lh3: true, pinkyEb: true },
  A4: { thumb: true, lh1: true, lh2: true },
  B4: { thumb: true, lh1: true, pinkyB: true },
  C5: { lh1: true },
};

const NOTE_MIDI: { [note: string]: number } = {
  C4: 60,
  D4: 62,
  E4: 64,
  F4: 65,
  G4: 67,
  A4: 69,
  B4: 71,
  C5: 72,
};

const NOTE_STAFF_POSITIONS: Record<string, number> = {
  C4: 78, // C below the staff
  D4: 72,
  E4: 66,
  F4: 60,
  G4: 54,
  A4: 48,
  B4: 42,
  C5: 36, // C in the third space
};

const NOTE_COLORS: Record<string, string> = {
  C4: "rgb(239 68 68)",     // red-500
  D4: "rgb(249 115 22)",    // orange-500
  E4: "rgb(245 158 11)",    // amber-400
  F4: "rgb(250 204 21)",    // yellow-400
  G4: "rgb(163 230 53)",    // lime-400
  A4: "rgb(34 197 94)",     // green-500
  B4: "rgb(20 184 166)",    // teal-500
  C5: "rgb(6 182 212)",     // cyan-500
};

const NOTES = Object.keys(FINGERINGS);

function FluteDiagram({ note, showFingering }: { note: string; showFingering: boolean }) {
  const fingering = FINGERINGS[note] || {};
  const noteColor = NOTE_COLORS[note] || "rgb(156 163 175)";
  const yPos = NOTE_STAFF_POSITIONS[note] || 0;

  const Key = ({ x, y, width, height, isPressed, shape = 'circle' }: any) => {
    const fill = showFingering && isPressed ? noteColor : "none";
    const stroke = showFingering && isPressed ? noteColor : "rgb(107 114 128)";
    if (shape === 'rect') {
      return <rect x={x} y={y} width={width} height={height} rx="2" ry="2" fill={fill} stroke={stroke} strokeWidth="1.5" />;
    }
    return <circle cx={x} cy={y} r={width/2} fill={fill} stroke={stroke} strokeWidth="1.5" />;
  };

  return (
    <div className="flex items-center justify-center gap-8">
      {/* Musical Staff */}
      <svg viewBox="0 0 100 120" className="h-32">
        <g stroke="rgb(156 163 175)" strokeWidth="1">
            <path d="M 10 54 H 90" />
            <path d="M 10 60 H 90" />
            <path d="M 10 66 H 90" />
            <path d="M 10 72 H 90" />
            <path d="M 10 78 H 90" />
        </g>
        {/* Ledger line for C4 */}
        {note === 'C4' && <path d="M 35 78 H 65" stroke="rgb(156 163 175)" strokeWidth="1" />}
        {/* Note Head */}
        {yPos && <circle cx="50" cy={yPos} r="5.5" fill="white" />}
      </svg>
      {/* Fingering Diagram */}
      <svg viewBox="0 0 300 100" className="h-24 w-auto">
        {/* Flute Body */}
        <rect x="10" y="40" width="280" height="20" rx="4" ry="4" fill="rgb(209 213 219)" />

        {/* Left Hand */}
        <Key x={50} y={50} width={16} isPressed={fingering.thumb} />
        <Key x={80} y={50} width={16} isPressed={fingering.lh1} />
        <Key x={105} y={50} width={16} isPressed={fingering.lh2} />
        <Key x={130} y={50} width={16} isPressed={fingering.lh3} />

        {/* Right Hand */}
        <Key x={170} y={50} width={16} isPressed={fingering.rh1} />
        <Key x={195} y={50} width={16} isPressed={fingering.rh2} />
        <Key x={220} y={50} width={16} isPressed={fingering.rh3} />

        {/* Pinky Keys */}
        <Key x={245} y={62} width={14} height={12} shape="rect" isPressed={fingering.pinkyEb} />
        <Key x={265} y={38} width={12} height={10} shape="rect" isPressed={fingering.pinkyB} />
        <Key x={280} y={38} width={12} height={10} shape="rect" isPressed={fingering.pinkyC} />

      </svg>
    </div>
  );
}

interface UseAudioEngineProps {
  enabled: boolean;
  targetNote: string | null;
  onPitchMatch?: () => void;
}

function useAudioEngine({ enabled, targetNote, onPitchMatch }: UseAudioEngineProps) {
  const [pitchStatus, setPitchStatus] = useState<"idle" | "listening" | "matched">("idle");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playerRef = useRef<any>(null);
  const fluteRef = useRef<any>(null);

  // Initialize AudioContext and WebAudioFont player
  useEffect(() => {
    const AudioContextFunc = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioCtxRef.current) {
      const ctx = new AudioContextFunc();
      audioCtxRef.current = ctx;
      playerRef.current = new WebAudioFontPlayer();

      // Load the flute soundfont
      playerRef.current.loader.decodeAfterLoading(ctx, '_tone_0770_SBLive_sf2');
      fluteRef.current = _tone_0770_SBLive_sf2;
    }

    // Resume context on user interaction
    const resumeAudio = () => {
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current?.resume();
      }
      window.removeEventListener('click', resumeAudio);
    };
    window.addEventListener('click', resumeAudio);

    return () => {
      window.removeEventListener('click', resumeAudio);
    }
  }, []);

  // Play reference tone
  useEffect(() => {
    if (!enabled || !targetNote || !audioCtxRef.current || !playerRef.current || !fluteRef.current) return;

    const midiPitch = NOTE_MIDI[targetNote];
    if (midiPitch === undefined) return;

    playerRef.current.queueWaveTable(
      audioCtxRef.current,
      audioCtxRef.current.destination,
      fluteRef.current,
      0,
      midiPitch,
      1.5 // duration in seconds
    );

  }, [enabled, targetNote]);

  // Pitch detection logic (remains the same)
  useEffect(() => {
    if (!enabled || !targetNote) return;

    let stream: MediaStream | null = null;
    let analyser: AnalyserNode | null = null;
    let rafId: number;

    async function setup() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);

        // Create both pitch detectors
        const pitchDetectorRef = PitchDetector.forFloat32Array(analyser.fftSize);
        const yinDetectorRef = Pitchfinder.YIN({ sampleRate: ctx.sampleRate, threshold: 0.1 });

        const buffer = new Float32Array(analyser.fftSize);
        setPitchStatus("listening");

        function detect() {
          if (!analyser || !pitchDetectorRef || !yinDetectorRef) return;
          analyser.getFloatTimeDomainData(buffer);

          // Try pitchy first (more accurate)
          const [pitchyFreq, clarity] = pitchDetectorRef.findPitch(buffer, ctx.sampleRate);

          // Try YIN as backup (better for whistling/voice)
          const yinFreq = yinDetectorRef(buffer);

          // Use whichever detection method found a result
          let detectedPitch = null;
          if (pitchyFreq && clarity > 0.3) {
            detectedPitch = pitchyFreq;
          } else if (yinFreq && yinFreq > 80 && yinFreq < 2000) {
            detectedPitch = yinFreq;
          }

          // Check if detected pitch matches target (more lenient for whistling)
          if (detectedPitch && targetNote) {
            const freqTarget = noteToFreq(targetNote);
            const cents = 1200 * Math.log2(detectedPitch / freqTarget);
            if (Math.abs(cents) < 50) { // More lenient: 50 cents instead of 30
              setPitchStatus("matched");
              onPitchMatch && onPitchMatch();
            }
          }
          rafId = requestAnimationFrame(detect);
        }
        detect();
      } catch (e) {
        console.error("Audio setup error:", e);
      }
    }

    if (audioCtxRef.current?.state === "running") {
      setup();
    } else {
      // Wait for the audio context to be running
      const resumeAndSetup = () => {
        if (audioCtxRef.current?.state === 'suspended') {
          audioCtxRef.current.resume().then(setup);
        } else {
          setup();
        }
        window.removeEventListener('click', resumeAndSetup);
      };
      window.addEventListener('click', resumeAndSetup);
    }

    return () => {
      cancelAnimationFrame(rafId);
      if (analyser) analyser.disconnect();
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        // Don't close the context here, as it's shared
      }
      setPitchStatus("idle");
    };
  }, [enabled, targetNote, onPitchMatch]);

  return pitchStatus;
}

interface SequencerProps {
  length: number;
  running: boolean;
  onComplete?: () => void;
  revealNext: () => void;
}

function Sequencer({ length, running, onComplete, revealNext }: SequencerProps) {
  const [queue, setQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFingering, setShowFingering] = useState(true);

  useEffect(() => {
    if (!running) return;
    const seq = Array.from({ length }, () => NOTES[Math.floor(Math.random() * NOTES.length)]);
    setQueue(seq);
    setCurrentIndex(0);
  }, [length, running]);

  function handlePitchMatched() {
    if (currentIndex + 1 === queue.length) {
      onComplete && onComplete();
    } else {
      setCurrentIndex((i) => i + 1);
      revealNext();
    }
  }

  const currentNote = queue[currentIndex];
  const pitchStatus = useAudioEngine({
    enabled: running,
    targetNote: currentNote,
    onPitchMatch: handlePitchMatched
  });

  const noteColor = currentNote ? NOTE_COLORS[currentNote] : "rgb(156 163 175)";

  return (
    <div className="flex flex-col items-center justify-around h-full w-full gap-4 text-center">
      {/* Huge note display */}
      <div
        className="font-bold font-serif tracking-tighter drop-shadow-lg select-none flex items-center justify-center"
        style={{
          fontSize: 'min(40vh, 30vw)',
          color: noteColor,
          lineHeight: '1',
          textShadow: `0 0 50px ${noteColor}70`,
        }}
      >
        {currentNote}
      </div>

      {/* Fingering diagram and controls */}
      <div className="flex flex-col items-center gap-4">
        <FluteDiagram note={currentNote} showFingering={showFingering} />
        <div className="flex items-center gap-2 mt-4">
          <span className="text-sm">Show fingering</span>
          <Switch checked={showFingering} onCheckedChange={setShowFingering} />
        </div>
        <div className="text-lg font-semibold text-gray-400 mt-2">
          {pitchStatus === 'matched'
            ? '🎉 Perfect! Great job!'
            : 'Play the note to continue...'}
        </div>
        <Button onClick={handlePitchMatched} className="mt-4">
          Next Note
        </Button>
      </div>
    </div>
  );
}

export default function FluteTrainerApp() {
  const [seqLen, setSeqLen] = useState(1);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("Choose a length and press Start");

  function handleStart() {
    setMessage("Listen and play the sequence…");
    setRunning(true);
  }
  function handleComplete() {
    setMessage("Sequence complete! ✨ Press Start for another.");
    setRunning(false);
  }

  return (
    <div className="min-h-screen bg-[#111827] text-white flex flex-col items-center p-4 font-sans">
      <header className="w-full max-w-md flex-shrink-0">
        <h1 className="text-4xl font-bold font-serif">Flute Trainer</h1>
        <div className="flex items-center gap-4">
          <Select
            value={String(seqLen)}
            onValueChange={(v: string) => setSeqLen(Number(v))}
          >
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} {n === 1 ? "note" : "notes"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleStart} disabled={running}>
            Start
          </Button>
        </div>
      </header>

      <main className="flex-grow w-full flex flex-col items-center justify-center py-4">
        {running ? (
          <Sequencer
            length={seqLen}
            running={running}
            onComplete={handleComplete}
            revealNext={() => {}}
          />
        ) : (
          <div className="text-center text-gray-400">
            <p>{message}</p>
          </div>
        )}
      </main>

      <footer className="w-full text-center py-2 flex-shrink-0">
        <p className="text-xs text-gray-500">
          Made with 🪈 + React + Web Audio API – prototype v0.1
        </p>
      </footer>
    </div>
  );
}

function noteToFreq(note: string): number {
  const A4 = 440;
  const midi = NOTE_MIDI[note] || 69; // Default to A4 if note not found
  return A4 * Math.pow(2, (midi - 69) / 12);
}
