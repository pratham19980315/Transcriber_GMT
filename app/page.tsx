"use client";
import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) setFile(droppedFile);
  };

  const handleTranscribe = async () => {
    if (!file) return;
    setLoading(true);
    setText("");
    setError("");
    setProgress(20);

    const form = new FormData();
    form.append("audio", file);

    try {
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      setProgress(65);

      const data = await res.json();
      if (data.error) setError(data.error);
      else setText(data.text);

      setProgress(100);
    } catch {
      setError("Something went wrong.");
    }

    setLoading(false);
    setTimeout(() => setProgress(0), 1000);
  };

  const copyText = () => navigator.clipboard.writeText(text);
  const downloadText = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transcription.txt";
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 neon-glow">

        <h1 className="text-center text-3xl font-semibold mb-6 tracking-wide">
          🎙️ Transcriber
        </h1>

        {/* >>> Horizontal Upload Row <<< */}
        <div className="flex items-center justify-center gap-3 w-full">

          {/* Drag & Drop Box */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`flex items-center justify-center border-2 border-dashed rounded-md px-4 h-12 w-[55%] text-xs transition
              ${isDragOver ? "border-blue-500 bg-blue-500/10" : "border-white/20 bg-white/5"}`}
          >
            Drop audio here
          </div>

          {/* Choose File */}
          <label className="cursor-pointer text-xs px-3 py-2 border border-white/20 rounded-md bg-white/5 hover:bg-white/10 transition whitespace-nowrap">
            Choose File
            <input
              type="file"
              accept=".opus,.mp3,.wav,.m4a,.ogg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          {/* Transcribe Button */}
          <button
            disabled={!file || loading}
            onClick={handleTranscribe}
            className="px-6 h-12 rounded-md bg-blue-600 hover:bg-blue-500 text-sm font-medium transition shadow-[0_0_12px_#1e3cff55] disabled:opacity-50"
          >
            {loading ? "Transcribing..." : "Transcribe"}
          </button>
        </div>

        {/* File Name */}
        {file && (
          <p className="text-xs text-blue-400 mt-2 text-center opacity-80 truncate">
            {file.name}
          </p>
        )}

        {/* Progress Bar */}
        {progress > 0 && (
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mt-4">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* Error */}
        {error && <p className="text-red-400 text-center mt-4 text-sm">❌ {error}</p>}

        {/* Output Text */}
        <textarea
          className="w-full mt-6 h-48 bg-black/20 border border-white/10 rounded-lg p-4 text-sm outline-none"
          placeholder="Transcription appears here..."
          value={text}
          readOnly
        />

        {/* Copy / Download Buttons */}
        {text && (
          <div className="flex justify-between mt-4 text-sm">
            <button onClick={copyText} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg neon-glow">
              📋 Copy
            </button>
            <button onClick={downloadText} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg neon-glow">
              ⬇️ Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
