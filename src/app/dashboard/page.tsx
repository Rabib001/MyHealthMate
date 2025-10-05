"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AIResponse {
  urgency: string;
  suggestion: string;
  next_steps: string;
}

interface SymptomData {
  prompt: string;
  response: AIResponse;
}

interface DetailedAnalysis {
  possible_conditions?: string;
  risk_factors?: string;
  lifestyle_recommendations?: string;
  when_to_seek_immediate_care?: string;
}

export default function Dashboard() {
  const [symptomData, setSymptomData] = useState<SymptomData | null>(null);
  const [detailedAnalysis, setDetailedAnalysis] = useState<DetailedAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedData = sessionStorage.getItem("symptomData");
    if (storedData) {
      const data = JSON.parse(storedData);
      setSymptomData(data);
      fetchDetailedAnalysis(data.prompt);
    }
  }, []);

  const fetchDetailedAnalysis = async (prompt: string) => {
    setLoading(true);
    try {
      const detailedPrompt = `
Provide a detailed medical insight for the following user symptom input:
"${prompt}"

Make sure the response includes:
- Possible conditions (non-diagnostic)
- Risk factors
- Lifestyle recommendations
- When to seek immediate care
Output strictly in JSON format.`;

      const res = await fetch("/api/detailed-symptom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: detailedPrompt }),
      });

      const data = await res.json();
      if (data.status === "success") {
        setDetailedAnalysis(data.output);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleBack = () => {
    sessionStorage.removeItem("symptomData");
    router.push("/");
  };

  const handleViewHistory = () => {
    router.push("/dashboard/history");
  };

  if (!symptomData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white p-6">
        <div className="text-center">
          <p className="mb-4">No symptom data found.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleBack}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={handleViewHistory}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded transition-colors"
            >
              View History
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold">Health Dashboard 📊</h1>
          <div className="flex gap-2">
            <button
              onClick={handleViewHistory}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition-colors"
            >
              View History
            </button>
            <button
              onClick={handleBack}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors"
            >
              ← Back to Checker
            </button>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-2xl mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-3">Your Symptom Description</h2>
          <p className="text-gray-300 bg-gray-800 p-4 rounded-lg">{symptomData.prompt}</p>
        </div>

        {loading && (
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700 text-center">
            <div className="flex justify-center items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              <p className="text-gray-400">Loading detailed AI analysis...</p>
            </div>
          </div>
        )}

        {detailedAnalysis && (
          <div className="bg-gradient-to-br from-gray-900 to-purple-900/20 p-6 rounded-2xl border border-purple-700 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🔍 Detailed AI Insights <span className="text-sm bg-purple-700 px-2 py-1 rounded">Gemini</span>
            </h2>
            <div className="space-y-4">
              <InfoBlock title="Possible Conditions" color="purple" text={detailedAnalysis.possible_conditions} />
              <InfoBlock title="Risk Factors" color="purple" text={detailedAnalysis.risk_factors} />
              <InfoBlock
                title="Lifestyle Recommendations"
                color="purple"
                text={detailedAnalysis.lifestyle_recommendations}
              />
              <InfoBlock
                title="⚠️ When to Seek Immediate Care"
                color="red"
                text={detailedAnalysis.when_to_seek_immediate_care}
              />
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
          <p className="text-yellow-300 text-sm text-center">
            ⚠️ Disclaimer: This is not a diagnostic tool. Always consult with a healthcare
            professional for medical advice.
          </p>
        </div>
      </div>
    </main>
  );
}

function InfoBlock({
  title,
  text,
  color,
}: {
  title: string;
  text?: string;
  color: "purple" | "red";
}) {
  if (!text) return null;
  const borderColor = color === "purple" ? "border-purple-700" : "border-red-700";
  const bgColor = color === "purple" ? "bg-gray-800/50" : "bg-red-900/20";
  const titleColor = color === "purple" ? "text-purple-400" : "text-red-400";
  return (
    <div>
      <span className={`font-semibold ${titleColor} block mb-2`}>{title}:</span>
      <p className={`text-gray-300 ${bgColor} p-4 rounded-lg border ${borderColor}`}>{text}</p>
    </div>
  );
}
