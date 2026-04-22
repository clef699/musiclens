import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Music, ChevronRight, RefreshCw } from "lucide-react";
import { uploadAPI } from "../utils/api";

const INSTRUMENT_LABELS = {
  piano: "Piano", keyboard: "Keyboard", lead_guitar: "Lead Guitar",
  bass_guitar: "Bass Guitar", alto_saxophone: "Alto Sax",
  tenor_saxophone: "Tenor Sax", trumpet: "Trumpet",
};

const STATUS_STYLES = {
  complete: "bg-green-900/40 text-green-400 border border-green-800",
  processing: "bg-yellow-900/40 text-yellow-400 border border-yellow-800",
  pending: "bg-gray-800 text-gray-400 border border-gray-700",
  failed: "bg-red-900/40 text-red-400 border border-red-800",
};

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = () => {
    setLoading(true);
    uploadAPI.getHistory()
      .then((res) => setHistory(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = filter === "all" ? history : history.filter((h) => h.status === filter);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Analysis history</h1>
          <p className="text-gray-400 mt-1">{history.length} total uploads</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm py-2 px-4">
            <RefreshCw size={15} />
            Refresh
          </button>
          <Link to="/upload" className="btn-primary text-sm py-2 px-4">
            New analysis
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {["all", "complete", "processing", "failed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading history...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Music className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">
            {filter === "all" ? "No analyses yet." : `No ${filter} analyses.`}
          </p>
          {filter === "all" && (
            <Link to="/upload" className="btn-primary">Upload your first track</Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <HistoryRow key={item.upload_id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryRow({ item }) {
  return (
    <div className="card flex items-center gap-4 hover:border-gray-700 transition-colors group">
      {/* Score circle */}
      <div className="flex-shrink-0 w-14 h-14 rounded-full border-2 border-gray-700 flex items-center justify-center group-hover:border-primary-700 transition-colors">
        {item.score != null ? (
          <div className="text-center">
            <div className="text-sm font-bold text-white leading-none">{Math.round(item.score)}</div>
            <div className="text-gray-600 text-xs">pts</div>
          </div>
        ) : (
          <Clock size={18} className="text-gray-600" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{item.original_filename}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
          <span className="text-gray-400 text-sm">
            {INSTRUMENT_LABELS[item.instrument] || item.instrument}
          </span>
          {item.key && (
            <span className="text-gray-500 text-sm">{item.key} {item.scale}</span>
          )}
          <span className="text-gray-600 text-sm">
            {new Date(item.uploaded_at).toLocaleDateString(undefined, {
              year: "numeric", month: "short", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* Status + action */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[item.status] || STATUS_STYLES.pending}`}>
          {item.status}
        </span>
        {item.result_id ? (
          <Link
            to={`/results/${item.result_id}`}
            className="flex items-center gap-1 text-primary-400 hover:text-primary-300 text-sm font-medium"
          >
            View <ChevronRight size={15} />
          </Link>
        ) : (
          <span className="text-gray-700">
            <ChevronRight size={15} />
          </span>
        )}
      </div>
    </div>
  );
}
