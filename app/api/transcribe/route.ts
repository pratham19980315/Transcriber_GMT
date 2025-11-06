import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { File as NodeFile, Blob } from "node:buffer";

export const runtime = "nodejs";
export const maxRequestBodySize = "20mb";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const inputFile = form.get("audio") as File | null;

    if (!inputFile) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert uploaded File → Buffer → Blob → File (Node compatible)
    const arrayBuffer = await inputFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const blob = new Blob([buffer], { type: inputFile.type });
    const audioFile = new NodeFile([blob], inputFile.name, { type: inputFile.type });

    const result = await client.audio.transcriptions.create({
  model: "whisper-large-v3",
  file: audioFile,
  response_format: "text",
  language: "en", // ✅ Force English transcription
});


    return NextResponse.json({ text: result });

  } catch (err: any) {
    console.error("TRANSCRIBE ERROR:", err);
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
