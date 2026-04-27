import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Music, Award, Key, Clock, Hash, Loader } from "lucide-react";
import { uploadAPI } from "../utils/api";
import ScoreRing from "../components/ScoreRing";
import NoteTimeline from "../components/NoteTimeline";
import ChordList from "../components/ChordList";
import SheetMusic from "../components/SheetMusic";
import GuitarTab from "../components/GuitarTab";

const INSTRUMENT_LABELS = {
  piano: "Piano", keyboard: "Keyboard", lead_guitar: "Lead Guitar",
  bass_guitar: "Bass Guitar", alto_saxophone: "Alto Saxophone",
  tenor_saxophone: "Tenor Saxophone", trumpet: "Trumpet",
};

const TRANSPOSITION_NOTE = {
  alto_saxophone: "Notes shown in written pitch (concert pitch + 9 semitones / Eb instrument)",
  tenor_saxophone: "Notes shown in written pitch (concert pitch + 2 semitones / Bb instrument)",
  trumpet: "Notes shown in written pitch (concert pitch + 2 semitones / Bb instrument)",
};

const PROGRESS_MESSAGES = [
  "Transcribing audio with AI…",
  "Analysing notes…",
  "Detecting chords…",
  "Detecting key and scale…",
  "Calculating performance score…",
  "Generating notation…",
];

function getInstrumentDisplay(instrument) {
  const i = (instrument || "").toLowerCase();
  return {
    showTab: i === "lead_guitar" || i === "bass_guitar",
    isBass: i === "bass_guitar",
    showSheet: !["lead_guitar", "bass_guitar"].includes(i),
    clef: i === "bass_guitar" ? "bass" : "treble",
    transpositionNote: TRANSPOSITION_NOTE[i] || null,
  };
}

export default function ResultsPage() {
  const { resultId } = useParams(); // resultId is the job_id (upload.id)
  const [jobData, setJobData] = useState(null);
  const [error, setError] = useState("");
  const [msgIdx, setMsgIdx] = useState(0);
  const pollRef = useRef(null);
  const msgRef = useRef(null);

  useEffect(() => {
    let stopped = false;

    const fetchStatus = () => {
      uploadAPI.getJobStatus(resultId)
        .then((res) => {
          if (stopped) return;
          setJobData(res.data);
          if (res.data.status === "complete" || res.data.status === "failed") {
            clearInterval(pollRef.current);
            clearInterval(msgRef.current);
          }
        })
        .catch(() => {
          if (!stopped) setError("Job not found or server error.");
          clearInterval(pollRef.current);
          clearInterval(msgRef.current);
        });
    };

    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 5000);
    msgRef.current = setInterval(() => {
      setMsgIdx((i) => (i + 1) % PROGRESS_MESSAGES.length);
    }, 3000);

    return () => {
      stopped = true;
      clearInterval(pollRef.current);
      clearInterval(msgRef.current);
    };
  }, [resultId]);

  if (error) return <ErrorState message={error} />;
  if (!jobData) return <AnalysingState message="Connecting…" />;

  if (jobData.status === "pending" || jobData.status === "processing") {
    const msg = jobData.progress_message && jobData.progress_message !== "Queued"
      ? jobData.progress_message
      : PROGRESS_MESSAGES[msgIdx];
    return <AnalysingState message={msg} />;
  }

  if (jobData.status === "failed") {
    return <ErrorState message={jobData.progress_message || "Analysis failed. Please try a different file."} />;
  }

  const result = jobData.result;
  if (!result) return <ErrorState message="Result not found." />;

  const instrument = result.upload?.instrument || "piano";
  const display = getInstrumentDisplay(instrument);
  const breakdown = result.score_breakdown || {};
  const notes = result.notes || [];
  const chords = result.chords || [];
  const chordsTimeline = result.chords_timeline || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link to="/" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 w-fit">
        <ArrowLeft size={16} /> Analyse another track
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {result.upload?.original_filename || "Analysis Result"}
          </h1>
          <p className="text-gray-400 mt-1">
            {INSTRUMENT_LABELS[instrument] || instrument}
            {result.upload?.uploaded_at
              ? ` · ${new Date(result.upload.uploaded_at).toLocaleString()}`
              : ""}
          </p>
        </div>
        <div className="flex-shrink-0">
          <ScoreRing score={result.score || 0} size={120} />
          <p className="text-center text-gray-500 text-xs mt-1">Performance score</p>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={<Key size={18} />} label="Key & Scale" value={`${result.key || "?"} ${result.scale || ""}`} />
        <MetricCard icon={<Hash size={18} />} label="Notes detected" value={result.note_count ?? notes.length} />
        <MetricCard icon={<Clock size={18} />} label="Duration" value={result.duration ? `${result.duration.toFixed(1)}s` : "?"} />
        <MetricCard icon={<Music size={18} />} label="Unique chords" value={chords.length} />
      </div>

      {/* Score breakdown */}
      {breakdown.total != null && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award size={18} className="text-primary-400" /> Score breakdown
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <ScoreBar label="Pitch accuracy" value={breakdown.pitch_accuracy} color="blue" />
            <ScoreBar label="Rhythmic regularity" value={breakdown.rhythm} color="green" />
            <ScoreBar label="Note density" value={breakdown.note_density} color="orange" />
          </div>
        </div>
      )}

      {/* Chords */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Chords detected</h2>
        <ChordList chords={chords} />
      </div>

      {/* Note timeline */}
      {notes.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Note timeline</h2>
          <NoteTimeline notes={notes} duration={result.duration || 10} chords={chordsTimeline} />
        </div>
      )}

      {/* Instrument-specific notation */}
      {display.transpositionNote && (
        <div className="bg-blue-900/20 border border-blue-800 rounded-lg px-4 py-2 text-blue-400 text-sm mb-4">
          {display.transpositionNote}
        </div>
      )}

      {display.showTab && notes.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {display.isBass ? "Bass Tab" : "Guitar Tab"}
          </h2>
          <GuitarTab notes={notes} isBass={display.isBass} />
        </div>
      )}

      {display.showSheet && notes.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Sheet music</h2>
          <SheetMusic notes={notes} instrument={instrument} clef={display.clef} />
        </div>
      )}

      {/* Full note list */}
      {notes.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">All notes ({notes.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-800">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Note</th>
                  <th className="pb-2 pr-4">Start</th>
                  <th className="pb-2 pr-4">Duration</th>
                  <th className="pb-2">Velocity</th>
                </tr>
              </thead>
              <tbody>
                {notes.slice(0, 50).map((n, i) => (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="py-1.5 pr-4 text-gray-600">{i + 1}</td>
                    <td className="py-1.5 pr-4 text-white font-mono font-medium">{n.note_name}</td>
                    <td className="py-1.5 pr-4 text-gray-400">{n.start_time?.toFixed(3)}s</td>
                    <td className="py-1.5 pr-4 text-gray-400">{n.duration?.toFixed(3)}s</td>
                    <td className="py-1.5">
                      <span className="inline-block w-16 bg-gray-800 rounded-full h-1.5 align-middle mr-2">
                        <span
                          className="block bg-primary-500 h-1.5 rounded-full"
                          style={{ width: `${((n.velocity || 0) / 127) * 100}%` }}
                        />
                      </span>
                      <span className="text-gray-500">{n.velocity}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {notes.length > 50 && (
              <p className="text-gray-600 text-sm text-center pt-3">
                Showing 50 of {notes.length} notes
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value }) {
  return (
    <div className="card">
      <div className="text-primary-400 mb-2">{icon}</div>
      <div className="text-xl font-bold text-white capitalize">{value}</div>
      <div className="text-gray-500 text-sm">{label}</div>
    </div>
  );
}

function ScoreBar({ label, value, color }) {
  const colors = { blue: "bg-blue-500", green: "bg-green-500", orange: "bg-orange-500" };
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-gray-400 text-sm">{label}</span>
        <span className="text-white font-semibold text-sm">{Math.round(value || 0)}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className={`${colors[color]} h-2 rounded-full transition-all duration-700`}
          style={{ width: `${Math.min(100, value || 0)}%` }}
        />
      </div>
    </div>
  );
}

function AnalysingState({ message }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-gray-800" />
          <div className="w-20 h-20 rounded-full border-4 border-primary-500 border-t-transparent animate-spin absolute inset-0" />
          <Music className="w-8 h-8 text-primary-400 absolute inset-0 m-auto" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">Analysing your track</h2>
      <p className="text-primary-400 font-medium mb-2 h-6 transition-all duration-500">{message}</p>
      <p className="text-gray-600 text-sm">
        Long songs can take up to 2–3 minutes. This page updates automatically.
      </p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="card text-center py-12">
        <p className="text-red-400 mb-4">{message}</p>
        <Link to="/" className="btn-primary">Try another file</Link>
      </div>
    </div>
  );
}
