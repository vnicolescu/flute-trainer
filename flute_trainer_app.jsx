// FluteTrainerApp.jsx
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const FINGERINGS = {
  C4: [false, false, false, false, false, false],
  D4: [true, true, false, false, false, false],
  E4: [true, true, true, false, false, false],
  F4: [true, true, true, true, false, false],
  G4: [true, true, true, true, true, false],
  A4: [true, true, true, true, true, true],
  B4: [false, true, true, true, true, true],
  C5: [false, false, true, true, true, true]
};

const NOTE_COLORS = {
  C4: "red-500",
  D4: "orange-500",
  E4: "amber-400",
  F4: "yellow-400",
  G4: "lime-400",
  A4: "green-500",
  B4: "teal-500",
  C5: "cyan-500"
};

const NOTES = Object.keys(FINGERINGS);

function FluteDiagram({ note, showFingering }) {
  const fingering = FINGERINGS[note] || [];
  const noteColor = NOTE_COLORS[note] || "gray-400";

  return (
    <svg
      viewBox="0 0 260 40"
      className="w-full max-w-md mx-auto mb-4"
      aria-label={`Fingering diagram for ${note}`}
    >
      {fingering.map((closed, i) => {
        const cx = 20 + i * 40;
        const cy = 20;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={14}
            className={
              showFingering
                ? closed
                  ? `fill-[${noteColor}]`
                  : "fill-none stroke-2 stroke-gray-500"
                : "fill-none stroke-2 stroke-gray-500"
            }
          />
        );
      })}
    </svg>
  );
}

function useAudioEngine({ enabled, targetNote, onPitchMatch }) {
  const [pitchStatus, setPitchStatus] = useState("idle");
  const audioCtxRef = useRef(null);

  useEffect(() => {
    if (!enabled || !targetNote) return;

    const context = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = context;

    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = noteToFreq(targetNote);
    oscillator.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 1.2);

    return () => {
      oscillator.disconnect();
      context.close();
    };
  }, [enabled, targetNote]);

  useEffect(() => {
    if (!enabled || !targetNote) return;

    let stream, analyser, rafId;

    async function setup() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);

        const buffer = new Float32Array(analyser.fftSize);
        setPitchStatus("listening");

        function detect() {
          analyser.getFloatTimeDomainData(buffer);
          const candidate = detectPitch(buffer, ctx.sampleRate);
          if (candidate) {
            const freqTarget = noteToFreq(targetNote);
            const cents = 1200 * Math.log2(candidate / freqTarget);
            if (Math.abs(cents) < 30) {
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
    setup();

    return () => {
      cancelAnimationFrame(rafId);
      if (analyser) analyser.disconnect();
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close();
      setPitchStatus("idle");
    };
  }, [enabled, targetNote, onPitchMatch]);

  return pitchStatus;
}

function Sequencer({ length, running, onComplete, revealNext }) {
  const [queue, setQueue] = useState([]);
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

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardContent className="p-4 flex flex-col items-center gap-4">
        <div className="text-3xl font-semibold">{currentNote || ""}</div>
        <FluteDiagram note={currentNote} showFingering={showFingering} />
        <div className="flex items-center gap-2">
          <span className="text-sm">Show fingering</span>
          <Switch checked={showFingering} onCheckedChange={setShowFingering} />
        </div>
        <div className="text-sm italic text-gray-500">
          {pitchStatus === "matched" ? "Great!" : "Play the note to continue..."}
        </div>
      </CardContent>
    </Card>
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
    <div className="min-h-screen flex flex-col items-center justify-start p-6 gap-6">
      <h1 className="text-4xl font-bold mb-2 font-serif">Flute Trainer</h1>
      <div className="flex items-center gap-4">
        <Select value={String(seqLen)} onValueChange={(v) => setSeqLen(Number(v))}>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} {n === 1 ? "note" : "notes"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleStart} disabled={running}>Start</Button>
      </div>
      {running && (
        <Sequencer
          length={seqLen}
          running={running}
          onComplete={handleComplete}
          revealNext={() => {}}
        />
      )}
      <p className="text-center text-sm text-gray-600 max-w-md">{message}</p>
      <footer className="mt-auto text-xs text-gray-400">
        Made with 🪈 + React + Web Audio API – prototype v0.1
      </footer>
    </div>
  );
}

function noteToFreq(note) {
  const A4 = 440;
  const NOTE_MIDI = {
    C4: 60,
    D4: 62,
    E4: 64,
    F4: 65,
    G4: 67,
    A4: 69,
    B4: 71,
    C5: 72
  };
  const midi = NOTE_MIDI[note] || 69;
  return A4 * Math.pow(2, (midi - 69) / 12);
}

function detectPitch(buffer, sampleRate) {
  let bestOffset = -1;
  let bestCorrelation = 0;
  const rms = Math.sqrt(buffer.reduce((s, v) => s + v * v, 0) / buffer.length);
  if (rms < 0.01) return null;

  const len = buffer.length;
  for (let offset = 20; offset < 1024; offset++) {
    let correlation = 0;
    for (let i = 0; i < len - offset; i++) {
      correlation += buffer[i] * buffer[i + offset];
    }
    correlation = correlation / (len - offset);
    if (correlation > 0.9 && correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }
  if (bestOffset === -1) return null;
  return sampleRate / bestOffset;
}
