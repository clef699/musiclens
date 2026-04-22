import React from "react";

const NOTE_COLORS = {
  C: "bg-red-900 text-red-300",
  D: "bg-orange-900 text-orange-300",
  E: "bg-yellow-900 text-yellow-300",
  F: "bg-green-900 text-green-300",
  G: "bg-teal-900 text-teal-300",
  A: "bg-blue-900 text-blue-300",
  B: "bg-purple-900 text-purple-300",
};

function getColor(chord) {
  const root = chord.replace(/[^A-G#b]/, "").charAt(0);
  return NOTE_COLORS[root] || "bg-gray-800 text-gray-300";
}

export default function ChordList({ chords = [] }) {
  if (!chords.length) {
    return <p className="text-gray-500 text-sm">No chords detected</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chords.map((chord, i) => (
        <span
          key={i}
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${getColor(chord)}`}
        >
          {chord}
        </span>
      ))}
    </div>
  );
}
