import React from "react";

const STANDARD_TUNING = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 E4
const STRING_NAMES = ["E", "A", "D", "G", "B", "e"];

function midiToTab(midiPitch) {
  let best = null;
  let bestString = -1;
  let bestFret = -1;

  for (let s = 5; s >= 0; s--) {
    const fret = midiPitch - STANDARD_TUNING[s];
    if (fret >= 0 && fret <= 24) {
      if (!best || fret < bestFret) {
        best = fret;
        bestString = s;
        bestFret = fret;
      }
    }
  }
  return { string: bestString, fret: bestFret };
}

export default function GuitarTab({ notes = [], isBass = false }) {
  if (!notes.length) return null;

  const tuning = isBass ? [28, 33, 38, 43] : STANDARD_TUNING;
  const strings = isBass ? ["E", "A", "D", "G"] : STRING_NAMES;
  const displayNotes = notes.slice(0, 20);

  const tabData = strings.map(() => []);

  displayNotes.forEach((note, i) => {
    const pitch = note.pitch;
    let placed = false;
    for (let s = strings.length - 1; s >= 0; s--) {
      const fret = pitch - tuning[s];
      if (fret >= 0 && fret <= 22) {
        while (tabData[s].length < i) tabData[s].push("-");
        tabData[s].push(String(fret));
        placed = true;
        break;
      }
    }
    if (!placed) {
      for (let s = 0; s < strings.length; s++) {
        while (tabData[s].length <= i) tabData[s].push("-");
      }
    }
    for (let s = 0; s < strings.length; s++) {
      while (tabData[s].length <= i) tabData[s].push("-");
    }
  });

  return (
    <div className="font-mono bg-gray-950 rounded-lg p-4 overflow-x-auto border border-gray-700">
      <div className="text-gray-500 text-xs mb-2">{isBass ? "Bass Tab" : "Guitar Tab"}</div>
      {strings.map((name, si) => (
        <div key={si} className="flex items-center gap-1 text-sm leading-6">
          <span className="text-gray-400 w-4 flex-shrink-0">{name}</span>
          <span className="text-gray-600">|</span>
          <span className="text-green-400 tracking-wider">
            {tabData[si].map((f, i) => f.padEnd(3, "-")).join("")}
          </span>
          <span className="text-gray-600">|</span>
        </div>
      ))}
    </div>
  );
}
