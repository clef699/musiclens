import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Upload, Music, TrendingUp, Clock } from "lucide-react";
import { uploadAPI } from "../utils/api";
import useAuthStore from "../store/authStore";

const INSTRUMENT_LABELS = {
  piano: "Piano", keyboard: "Keyboard", lead_guitar: "Lead Guitar",
  bass_guitar: "Bass Guitar", alto_saxophone: "Alto Sax",
  tenor_saxophone: "Tenor Sax", trumpet: "Trumpet",
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    uploadAPI.getHistory()
      .then((res) => setHistory(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const completed = history.filter((h) => h.status === "complete");
  const avgScore = completed.length
    ? Math.round(completed.reduce((s, h) => s + (h.score || 0), 0) / completed.length)
    : null;
  const bestScore = completed.length ? Math.round(Math.max(...completed.map((h) => h.score || 0))) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}!</h1>
        <p className="text-gray-400 mt-1">Here's an overview of your music analyses.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Music />} label="Total uploads" value={history.length} />
        <StatCard icon={<TrendingUp />} label="Analyses done" value={completed.length} />
        <StatCard icon={<Clock />} label="Avg score" value={avgScore !== null ? `${avgScore}/100` : "—"} />
        <StatCard icon={<TrendingUp />} label="Best score" value={bestScore !== null ? `${bestScore}/100` : "—"} />
      </div>

      {/* Upload CTA */}
      <div className="mb-8">
        <Link
          to="/upload"
          className="flex items-center justify-center gap-2 w-full sm:w-auto btn-primary py-3 px-8"
        >
          <Upload size={18} />
          Analyse a new track
        </Link>
      </div>

      {/* Recent analyses */}
      <h2 className="text-xl font-semibold text-white mb-4">Recent analyses</h2>

      {loading ? (
        <div className="text-gray-500 text-center py-12">Loading...</div>
      ) : history.length === 0 ? (
        <div className="card text-center py-12">
          <Music className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">No analyses yet.</p>
          <Link to="/upload" className="btn-primary mt-4 inline-block">Upload your first track</Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {history.slice(0, 6).map((item) => (
            <HistoryCard key={item.upload_id} item={item} />
          ))}
          {history.length > 6 && (
            <Link to="/history" className="text-primary-400 hover:underline text-sm text-center block pt-2">
              View all {history.length} analyses →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="card">
      <div className="text-primary-400 mb-2">{React.cloneElement(icon, { size: 20 })}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-gray-500 text-sm">{label}</div>
    </div>
  );
}

function HistoryCard({ item }) {
  const statusColor = {
    complete: "text-green-400",
    processing: "text-yellow-400",
    failed: "text-red-400",
    pending: "text-gray-400",
  }[item.status] || "text-gray-400";

  return (
    <div className="card flex items-center justify-between hover:border-gray-700 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{item.original_filename}</p>
        <p className="text-gray-400 text-sm">
          {INSTRUMENT_LABELS[item.instrument] || item.instrument}
          {item.key && ` · ${item.key} ${item.scale}`}
          {" · "}
          {new Date(item.uploaded_at).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-4 ml-4">
        {item.score != null && (
          <div className="text-center">
            <div className="text-lg font-bold text-white">{Math.round(item.score)}</div>
            <div className="text-gray-500 text-xs">/100</div>
          </div>
        )}
        <span className={`text-sm font-medium ${statusColor}`}>{item.status}</span>
        {item.result_id && (
          <Link to={`/results/${item.result_id}`} className="btn-primary text-sm py-1.5 px-4">
            View
          </Link>
        )}
      </div>
    </div>
  );
}
