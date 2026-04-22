import React, { useEffect, useRef } from "react";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function midiToVexNote(pitch) {
  const octave = Math.floor(pitch / 12) - 1;
  const noteIndex = pitch % 12;
  const name = NOTE_NAMES[noteIndex];
  const isSharp = name.includes("#");
  const baseName = name.replace("#", "").toLowerCase();
  return {
    keys: [`${baseName}${isSharp ? "#" : ""}/${octave}`],
    duration: "q",
    accidental: isSharp ? "#" : null,
  };
}

export default function SheetMusic({ notes = [], instrument = "piano", clef = "treble" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !notes.length) return;

    let VF;
    try {
      VF = require("vexflow").Flow;
    } catch {
      return;
    }

    const container = containerRef.current;
    container.innerHTML = "";

    try {
      const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
      renderer.resize(container.offsetWidth || 700, 200);
      const context = renderer.getContext();
      context.setFont("Arial", 10);

      const stave = new VF.Stave(10, 20, (container.offsetWidth || 700) - 20);
      stave.addClef(clef).addTimeSignature("4/4");
      stave.setContext(context).draw();

      const displayNotes = notes.slice(0, 16);
      const staveNotes = displayNotes.map((n) => {
        const { keys, duration, accidental } = midiToVexNote(n.pitch);
        const staveNote = new VF.StaveNote({ keys, duration, clef });
        if (accidental) {
          staveNote.addAccidental(0, new VF.Accidental(accidental));
        }
        return staveNote;
      });

      // Pad to at least 4 notes for a valid measure
      while (staveNotes.length < 4) {
        staveNotes.push(new VF.StaveNote({ keys: ["b/4"], duration: "qr" }));
      }

      const voice = new VF.Voice({ num_beats: staveNotes.length, beat_value: 4 });
      voice.setStrict(false);
      voice.addTickables(staveNotes);

      new VF.Formatter().joinVoices([voice]).format([voice], (container.offsetWidth || 700) - 80);
      voice.draw(context, stave);
    } catch (e) {
      container.innerHTML = `<div class="text-gray-500 text-sm p-4">Sheet music preview unavailable</div>`;
    }
  }, [notes, clef, instrument]);

  if (!notes.length) return null;

  return (
    <div className="w-full bg-white rounded-lg p-2 overflow-x-auto">
      <div ref={containerRef} style={{ minHeight: "160px" }} />
    </div>
  );
}
