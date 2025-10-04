"use client";

import { useState } from "react";

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

  // Submit symptom to Gemini API
  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      const res = await fetch("/api/symptom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data: APIResponse = await res.json();

      if (data.status === "success") {
        setResponse(data.output);
      } else {
        setError(data.message || "No AI response available.");
      }
    } catch (err) {
      console.error(err);
      setError("Error contacting AI. Please try again.");
    }

    setLoading(false);
  };

  // Save session to localStorage
  const saveSession = () => {
    if (!prompt || !response) return;
    const existing = JSON.parse(localStorage.getItem("symptomHistory") || "[]");
    existing.push({ prompt, response });
    localStorage.setItem("symptomHistory", JSON.stringify(existing));
    alert("Session saved!");
  };

  // Placeholder for Detailed Feedback (Auth0 integration later)
  const getDetailedFeedback = () => {
    alert("Detailed feedback clicked (Auth0 login to be integrated).");
  };

  // Placeholder for voice input
  const handleVoiceInput = () => {
    alert("Voice input clicked (ElevenLabs integration coming).");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white p-6">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-lg bg-gray-900">
        <h1 className="text-3xl font-bold mb-6 text-center">
          AI Symptom Checker 🚑
        </h1>

        {/* Symptom Input */}
        <textarea
          className="w-full p-3 mb-4 rounded bg-gray-800 text-white placeholder-gray-400 resize-none"
          rows={5}
          placeholder="Describe your symptoms..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        {/* Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Checking..." : "Check Symptoms"}
          </button>

          <button
            onClick={handleVoiceInput}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition-colors duration-200"
          >
            🎤 Voice Input
          </button>
        </div>

        {/* AI Response Chat Bubble */}
        {response && (
          <div className="mt-4 space-y-2">
            <div className="p-4 rounded-xl bg-gray-800 border border-gray-700">
              <p className="text-sm text-gray-400 mb-2">AI Response</p>
              <p><strong>Urgency:</strong> {response.urgency}</p>
              <p><strong>Suggestion:</strong> {response.suggestion}</p>
              <p><strong>Next Steps:</strong> {response.next_steps}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={getDetailedFeedback}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              >
                Get Detailed Feedback
              </button>

              <button
                onClick={saveSession}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
              >
                Save this Session
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-800 rounded border border-red-700 text-red-200">
            <p>{error}</p>
          </div>
        )}
      </div>
    </main>
  );
}
