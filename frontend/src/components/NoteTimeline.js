import React, { useRef, useEffect } from "react";

export default function NoteTimeline({ notes = [], duration = 10, chords = [] }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !notes.length) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    const pitches = notes.map((n) => n.pitch);
    const minPitch = Math.max(0, Math.min(...pitches) - 2);
    const maxPitch = Math.min(127, Math.max(...pitches) + 2);
    const pitchRange = maxPitch - minPitch || 1;
    const timeRange = duration || 1;

    // Draw horizontal pitch grid
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 1;
    for (let p = minPitch; p <= maxPitch; p++) {
      const y = H - ((p - minPitch) / pitchRange) * H;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Draw chord labels
    chords.forEach((c) => {
      const x = (c.start_time / timeRange) * W;
      ctx.fillStyle = "rgba(59,130,246,0.15)";
      ctx.fillRect(x, 0, ((c.end_time - c.start_time) / timeRange) * W, H);
      ctx.fillStyle = "#60a5fa";
      ctx.font = "10px Inter, sans-serif";
      ctx.fillText(c.chord, x + 4, 14);
    });

    // Draw notes
    notes.forEach((note) => {
      const x = (note.start_time / timeRange) * W;
      const y = H - ((note.pitch - minPitch) / pitchRange) * H - 4;
      const w = Math.max(4, (note.duration / timeRange) * W - 2);
      const h = 8;

      const intensity = note.velocity / 127;
      const r = Math.round(59 + intensity * (99 - 59));
      const g = Math.round(130 + intensity * (200 - 130));
      const b = Math.round(246);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 2);
      ctx.fill();
    });

    // Time axis labels
    ctx.fillStyle = "#4b5563";
    ctx.font = "10px Inter, sans-serif";
    for (let t = 0; t <= Math.ceil(timeRange); t += Math.max(1, Math.floor(timeRange / 8))) {
      const x = (t / timeRange) * W;
      ctx.fillText(`${t}s`, x + 2, H - 4);
    }
  }, [notes, duration, chords]);

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-700">
      <canvas
        ref={canvasRef}
        width={800}
        height={200}
        className="w-full"
        style={{ minWidth: "600px" }}
      />
    </div>
  );
}
