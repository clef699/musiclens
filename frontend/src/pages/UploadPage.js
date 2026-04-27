import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { Upload, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { uploadAPI } from "../utils/api";
import toast from "react-hot-toast";

const INSTRUMENTS = [
  { value: "piano", label: "Piano", desc: "Sheet music in treble & bass clef" },
  { value: "keyboard", label: "Keyboard", desc: "Sheet music in treble & bass clef" },
  { value: "lead_guitar", label: "Lead Guitar", desc: "Guitar tab + fretboard diagram" },
  { value: "bass_guitar", label: "Bass Guitar", desc: "Bass tab + root note analysis" },
  { value: "alto_saxophone", label: "Alto Saxophone", desc: "Sheet music transposed to Eb" },
  { value: "tenor_saxophone", label: "Tenor Saxophone", desc: "Sheet music transposed to Bb" },
  { value: "trumpet", label: "Trumpet", desc: "Sheet music transposed to Bb" },
];

const MAX_MB = 200;
const ACCEPTED_TYPES = {
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "audio/flac": [".flac"],
  "audio/ogg": [".ogg"],
  "audio/mp4": [".m4a"],
};

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [instrument, setInstrument] = useState("piano");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const onDrop = useCallback((accepted, rejected) => {
    setError("");
    if (rejected.length) {
      const reason = rejected[0]?.errors?.[0]?.message || "Unsupported file type";
      setError(reason);
      return;
    }
    if (accepted[0]?.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Maximum is ${MAX_MB}MB.`);
      return;
    }
    setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: MAX_MB * 1024 * 1024,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError("Please select an audio file."); return; }
    setError("");
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("instrument", instrument);

      const res = await uploadAPI.upload(formData, (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      });

      // Navigate immediately — ResultsPage handles the polling
      toast.success("Uploaded! Analysing your track…");
      navigate(`/results/${res.data.id}`);
    } catch (err) {
      const msg = err.response?.data?.detail || "Upload failed. Please try again.";
      setError(typeof msg === "string" ? msg : "Upload failed.");
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Analyse a track</h1>
      <p className="text-gray-400 mb-8">
        Upload an audio file and select your instrument. Works with songs up to 20 minutes long.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary-500 bg-primary-900/20"
              : file
              ? "border-green-600 bg-green-900/10"
              : "border-gray-700 hover:border-gray-600"
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="w-10 h-10 text-green-400" />
              <p className="text-white font-medium">{file.name}</p>
              <p className="text-gray-500 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button
                type="button"
                className="text-gray-500 hover:text-white text-sm underline mt-1"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-10 h-10 text-gray-500" />
              <p className="text-gray-300 font-medium">
                {isDragActive ? "Drop your file here" : "Drag & drop or click to select"}
              </p>
              <p className="text-gray-600 text-sm">MP3, WAV, FLAC, OGG, M4A · Max {MAX_MB}MB · Up to 20 min</p>
            </div>
          )}
        </div>

        {/* Instrument selector */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Select your instrument</label>
          <div className="grid sm:grid-cols-2 gap-2">
            {INSTRUMENTS.map((inst) => (
              <label
                key={inst.value}
                className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                  instrument === inst.value
                    ? "border-primary-600 bg-primary-900/30 text-white"
                    : "border-gray-700 hover:border-gray-600 text-gray-400"
                }`}
              >
                <input
                  type="radio"
                  name="instrument"
                  value={inst.value}
                  checked={instrument === inst.value}
                  onChange={() => setInstrument(inst.value)}
                  className="mt-0.5 accent-primary-500"
                />
                <div>
                  <div className="font-medium text-sm">{inst.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{inst.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-900/30 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {uploading && (
          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <Loader className="w-5 h-5 text-primary-400 animate-spin" />
              <span className="text-white font-medium">Uploading… {progress}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn-primary w-full py-3 text-base"
          disabled={uploading}
        >
          {uploading ? "Uploading…" : "Analyse track"}
        </button>
      </form>
    </div>
  );
}
