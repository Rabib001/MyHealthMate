"use client";

import { useState, useRef } from "react";

interface AIResponse {
  urgency: string;
  suggestion: string;
  next_steps: string;
}

interface APIResponse {
  status: string;
  output: AIResponse;
  message?: string;
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  /** Submit prompt (from textarea or STT) to Gemini API */
  const handleSubmit = async (text?: string) => {
    const actualPrompt = (text ?? prompt).trim();
    if (!actualPrompt) return;

    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      const res = await fetch("/api/symptom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: actualPrompt }),
      });

      const data: APIResponse = await res.json();

      if (data.status === "success") {
        setResponse(data.output);
        setPrompt(actualPrompt);
      } else {
        setError(data.message || "No AI response available.");
      }
    } catch (err) {
      console.error(err);
      setError("Error contacting AI. Please try again.");
    }

    setLoading(false);
  };

  /** Start recording */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await sendAudioToSTT(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Microphone access denied. Please allow microphone access.");
    }
  };

  /** Stop recording */
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  /** Send audio to ElevenLabs STT */
  const sendAudioToSTT = async (audioBlob: Blob) => {
    setLoading(true);
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(",")[1];

        const sttRes = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            audio: base64Audio,
            mimeType: audioBlob.type 
          }),
        });

        const sttData = await sttRes.json();

        if (sttData.status === "success" && sttData.text) {
          setPrompt(sttData.text); // Display transcribed text in textarea
          await handleSubmit(sttData.text); // Auto-submit to Gemini
        } else {
          setError("Voice recognition failed: " + (sttData.message || "Unknown error"));
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError("Failed to read audio file.");
        setLoading(false);
      };
    } catch (err) {
      console.error(err);
      setError("Failed to process voice input.");
      setLoading(false);
    }
  };

  /** Toggle recording */
  const handleVoiceInput = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white p-6">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-lg bg-gray-900">
        <h1 className="text-3xl font-bold mb-6 text-center">
          AI Symptom Checker 🚑
        </h1>

        <textarea
          className="w-full p-3 mb-4 rounded bg-gray-800 text-white placeholder-gray-400 resize-none"
          rows={5}
          placeholder="Describe your symptoms..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleSubmit()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || recording}
          >
            {loading ? "Checking..." : "Check Symptoms"}
          </button>

          <button
            onClick={handleVoiceInput}
            className={`flex-1 ${
              recording 
                ? "bg-red-600 hover:bg-red-700 animate-pulse" 
                : "bg-green-600 hover:bg-green-700"
            } text-white font-semibold py-2 px-4 rounded transition-colors duration-200 disabled:opacity-50`}
            disabled={loading && !recording}
          >
            {recording ? "⏹️ Stop Recording" : "🎤 Voice Input"}
          </button>
        </div>

        {response && (
          <div className="mt-4 p-4 bg-gray-800 rounded border border-gray-700">
            <h2 className="font-semibold mb-2 text-lg">AI Suggestion:</h2>
            <p className="mb-2">
              <strong>Urgency:</strong> {response.urgency}
            </p>
            <p className="mb-2">
              <strong>Suggestion:</strong> {response.suggestion}
            </p>
            <p>
              <strong>Next Steps:</strong> {response.next_steps}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-800 rounded border border-red-700 text-red-200">
            <p>{error}</p>
          </div>
        )}
      </div>
    </main>
  );
}