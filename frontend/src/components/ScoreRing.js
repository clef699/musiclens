import React, { useEffect, useState } from "react";

export default function ScoreRing({ score = 0, size = 120 }) {
  const [displayScore, setDisplayScore] = useState(0);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setDisplayScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#374151" strokeWidth="8" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 1.2s ease-in-out" }}
        />
      </svg>
      <div className="relative" style={{ marginTop: `-${size * 0.75}px` }}>
        <span className="text-3xl font-bold" style={{ color }}>{Math.round(displayScore)}</span>
        <span className="text-gray-400 text-sm">/100</span>
      </div>
      <div style={{ marginTop: `${size * 0.3}px` }} />
    </div>
  );
}
