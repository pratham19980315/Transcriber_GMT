"use client";
import { useState, useRef, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [progress, setProgress] = useState(0);

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);

  // Wavesurfer (Waveform Playback)
  const waveContainerRef = useRef<HTMLDivElement | null>(null);
  const waveSurferRef = useRef<any>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Generate waveform when file changes
  useEffect(() => {
    if (!file || !waveContainerRef.current) return;

    if (waveSurferRef.current) waveSurferRef.current.destroy();

    audioUrlRef.current = URL.createObjectURL(file);

    waveSurferRef.current = WaveSurfer.create({
      container: waveContainerRef.current,
      waveColor: "#4f8bff",
      progressColor: "#1e3cff",
      height: 60,
      cursorWidth: 0,
      barWidth: 2,
      barGap: 3,
      barRadius: 3,
    });

    waveSurferRef.current.load(audioUrlRef.current);
  }, [file]);

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

  // Start Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const newFile = new File([blob], "recording.webm", { type: "audio/webm" });
        setFile(newFile);
      };

      recorder.start();
      setIsRecording(true);
      setRecordTime(0);

      timerRef.current = setInterval(() => setRecordTime((t) => t + 1), 1000);
    } catch {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const deleteRecording = () => {
    setFile(null);
    audioUrlRef.current = null;
    if (waveSurferRef.current) waveSurferRef.current.destroy();
  };

  const copyText = () => navigator.clipboard.writeText(text);

  const downloadText = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "transcription.txt";
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 neon-glow">

        <h1 className="text-center text-3xl font-semibold mb-6 tracking-wide">🎙️ Transcriber</h1>

        {/* 🎤 Record Button FIRST */}
        <div className="flex flex-col items-center gap-3 mb-6">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="w-16 h-16 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 shadow-[0_0_15px_#ff4d4d] transition active:scale-95"
            >
              🎤
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-500 hover:bg-gray-600 animate-pulse shadow-[0_0_10px_#ccc]"
            >
              ⏹
            </button>
          )}
          {isRecording && <p className="text-sm opacity-70">Recording: {recordTime}s</p>}
        </div>

        {/* 🎧 Waveform & Play / Delete */}
        {file && (
          <div className="flex flex-col gap-3 mb-6">
            <div ref={waveContainerRef} className="w-full h-16 bg-black/20 rounded-md" />
            <div className="flex justify-center gap-3">
              <button
                onClick={() => waveSurferRef.current.playPause()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm"
              >
                ▶️ / ⏸
              </button>
              <button
                onClick={deleteRecording}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 rounded-md text-sm"
              >
                🗑 Delete
              </button>
            </div>
          </div>
        )}

        {/* Upload Row */}
        <div className="flex items-center justify-center gap-3 w-full mb-2">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`flex items-center justify-center border-2 border-dashed rounded-md px-4 h-12 w-[55%] text-xs
            ${isDragOver ? "border-blue-500 bg-blue-500/10" : "border-white/20 bg-white/5"}`}
          > Drop audio here </div>

          <label className="cursor-pointer text-xs px-3 py-2 border border-white/20 rounded-md bg-white/5 hover:bg-white/10 transition">
            Choose File
            <input type="file" accept=".opus,.mp3,.wav,.m4a,.ogg,.webm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"/>
          </label>

          <button disabled={!file || loading} onClick={handleTranscribe}
            className="px-6 h-12 rounded-md bg-blue-600 hover:bg-blue-500 text-sm font-medium disabled:opacity-50">
            {loading ? "Transcribing..." : "Transcribe"}
          </button>
        </div>

        {progress > 0 && (
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mt-4">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        <textarea
          className="w-full mt-6 h-48 bg-black/20 border border-white/10 rounded-lg p-4 text-sm"
          placeholder="Transcription appears here..." value={text} readOnly />

        {text && (
          <div className="flex justify-between mt-4 text-sm">
            <button onClick={copyText} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg">📋 Copy</button>
            <button onClick={downloadText} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg">⬇️ Download</button>
          </div>
        )}
      </div>
    </div>
  );
}
