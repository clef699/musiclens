import React from "react";
import { Link } from "react-router-dom";
import { Music, Zap, Target, BarChart3, FileMusic, GitBranch } from "lucide-react";

const features = [
  { icon: <Music className="w-6 h-6" />, title: "Note Detection", desc: "Every note with precise timestamps, pitch and velocity data extracted from your audio." },
  { icon: <Target className="w-6 h-6" />, title: "Chord Recognition", desc: "Automatically identifies all chords used — maj7, min7, dom7, sus4 and more." },
  { icon: <GitBranch className="w-6 h-6" />, title: "Key & Scale", desc: "Detects the musical key and scale: major, minor, dorian, mixolydian, pentatonic..." },
  { icon: <BarChart3 className="w-6 h-6" />, title: "Performance Score", desc: "Objective score out of 100 based on pitch accuracy, rhythmic regularity and note density." },
  { icon: <FileMusic className="w-6 h-6" />, title: "Sheet Music & Tabs", desc: "Instrument-specific notation: sheet music, guitar tabs, bass tabs — auto-transposed for Eb/Bb instruments." },
  { icon: <Zap className="w-6 h-6" />, title: "Fast Analysis", desc: "Powered by Spotify's basic-pitch AI model for accurate transcription in seconds." },
];

const instruments = ["Piano", "Keyboard", "Lead Guitar", "Bass Guitar", "Alto Saxophone", "Tenor Saxophone", "Trumpet"];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white font-bold text-xl">
            <Music className="w-6 h-6 text-primary-500" />
            MusicLens
          </div>
          <div className="flex gap-3">
            <Link to="/login" className="btn-secondary text-sm">Log in</Link>
            <Link to="/register" className="btn-primary text-sm">Get started free</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-900/40 border border-primary-800 rounded-full px-4 py-1.5 text-primary-400 text-sm mb-6">
          <Zap size={14} />
          AI-powered audio analysis for musicians
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
          Understand your music<br />
          <span className="text-primary-400">inside and out</span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Upload any audio file. MusicLens analyses every note, chord, key and scale —
          then scores your performance and generates instrument-specific notation.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="btn-primary text-base px-8 py-3">
            Start analysing free
          </Link>
          <Link to="/login" className="btn-secondary text-base px-8 py-3">
            Sign in
          </Link>
        </div>
      </section>

      {/* Instruments */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <p className="text-center text-gray-500 text-sm mb-4 uppercase tracking-widest">Supported instruments</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {instruments.map((i) => (
            <span key={i} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-full text-gray-300 text-sm">
              {i}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Everything a musician needs</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="card hover:border-gray-700 transition-colors">
              <div className="text-primary-400 mb-3">{f.icon}</div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-800 py-20 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to analyse your music?</h2>
        <p className="text-gray-400 mb-8">Upload your first track in seconds. No credit card required.</p>
        <Link to="/register" className="btn-primary text-base px-10 py-3">
          Create free account
        </Link>
      </section>

      <footer className="border-t border-gray-800 py-8 text-center text-gray-600 text-sm">
        © {new Date().getFullYear()} MusicLens. Built for musicians.
      </footer>
    </div>
  );
}
