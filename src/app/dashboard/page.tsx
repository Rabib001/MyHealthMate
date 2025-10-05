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
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
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
AND ONLY reply in the language you are asked question in.
example: if the voice input is mandarin, reply in mandarin.

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

  // Don't render until mounted to avoid hydration issues
  if (!isMounted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
        <div className="w-full max-w-4xl p-10 rounded-3xl shadow-xl bg-white/70 backdrop-blur-sm border border-white/50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading Dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!symptomData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
        <div className="w-full max-w-2xl p-10 rounded-3xl shadow-xl bg-white/70 backdrop-blur-sm border border-white/50 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl shadow-md flex items-center justify-center mx-auto mb-6 border border-white/60">
            <span className="text-3xl">💚</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Symptom Data Found</h2>
          <p className="text-gray-600 mb-8 text-lg">Please start with a symptom check to see your dashboard.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleBack}
              className="bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500 text-white font-semibold px-8 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Go to Symptom Checker
            </button>
            <button
              onClick={handleViewHistory}
              className="bg-gradient-to-r from-blue-300 to-cyan-300 hover:from-blue-400 hover:to-cyan-400 text-white font-semibold px-8 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              View History
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-50 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-50 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-50 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-500"></div>
      </div>

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 mb-8 p-8 bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl shadow-md flex items-center justify-center border border-white/60">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-700 to-blue-600 bg-clip-text text-transparent">
                Health Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Your personalized health insights</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleViewHistory}
              className="bg-gradient-to-r from-blue-300 to-cyan-300 hover:from-blue-400 hover:to-cyan-400 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2"
            >
              <span>View History</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>
            <button
              onClick={handleBack}
              className="bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Checker
            </button>
          </div>
        </div>

        {/* Symptom Description */}
        <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-white/50 mb-8 transition-all duration-300 hover:shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center border border-green-200/50">
              <span className="text-xl">📝</span>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-blue-600 bg-clip-text text-transparent">
              Your Symptom Description
            </h2>
          </div>
          <div className="bg-white/80 p-6 rounded-2xl border border-green-200/50 shadow-sm">
            <p className="text-gray-800 text-lg leading-relaxed">{symptomData.prompt}</p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-white/50 mb-8 text-center">
            <div className="flex justify-center items-center gap-4">
              <div className="w-8 h-8 border-2 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
              <p className="text-gray-600 text-lg">Loading detailed AI analysis...</p>
            </div>
          </div>
        )}

        {/* Detailed Analysis */}
        {detailedAnalysis && (
          <div className="bg-gradient-to-br from-green-50/80 to-blue-50/80 p-8 rounded-3xl shadow-lg border border-green-200/60 backdrop-blur-sm mb-8 transition-all duration-500 animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl flex items-center justify-center border border-white/60 shadow-md">
                <span className="text-2xl">🔍</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-blue-600 bg-clip-text text-transparent">
                  Detailed Health Insights
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200/50">
                    AI-Powered Analysis
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <InfoBlock 
                title="Possible Conditions" 
                color="green" 
                text={detailedAnalysis.possible_conditions}
                icon="🩺"
              />
              <InfoBlock 
                title="Risk Factors" 
                color="blue" 
                text={detailedAnalysis.risk_factors}
                icon="📈"
              />
              <InfoBlock
                title="Lifestyle Recommendations"
                color="purple"
                text={detailedAnalysis.lifestyle_recommendations}
                icon="💪"
              />
              <InfoBlock
                title="When to Seek Immediate Care"
                color="red"
                text={detailedAnalysis.when_to_seek_immediate_care}
                icon="⚠️"
              />
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50/50 p-6 rounded-2xl border border-yellow-200/60 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center border border-yellow-200/50">
              <span className="text-lg">ℹ️</span>
            </div>
            <div>
              <p className="text-yellow-800 font-medium text-lg">Important Disclaimer</p>
              <p className="text-yellow-700 text-sm mt-1">
                This is not a diagnostic tool. Always consult with a healthcare professional for medical advice.
                In case of emergency, please contact your local emergency services immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function InfoBlock({
  title,
  text,
  color,
  icon,
}: {
  title: string;
  text?: string;
  color: "green" | "blue" | "purple" | "red";
  icon?: string;
}) {
  if (!text) return null;

  const colorConfig = {
    green: {
      border: "border-green-200/50",
      bg: "bg-white/80",
      title: "text-green-700",
      iconBg: "bg-green-100"
    },
    blue: {
      border: "border-blue-200/50",
      bg: "bg-white/80",
      title: "text-blue-700",
      iconBg: "bg-blue-100"
    },
    purple: {
      border: "border-purple-200/50",
      bg: "bg-white/80",
      title: "text-purple-700",
      iconBg: "bg-purple-100"
    },
    red: {
      border: "border-red-200/50",
      bg: "bg-white/80",
      title: "text-red-700",
      iconBg: "bg-red-100"
    }
  };

  const config = colorConfig[color];

  return (
    <div className="group transition-all duration-300 hover:transform hover:-translate-y-1">
      <div className="flex items-start gap-4">
        {icon && (
          <div className={`w-12 h-12 ${config.iconBg} rounded-2xl flex items-center justify-center border ${config.border} flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
            <span className="text-lg">{icon}</span>
          </div>
        )}
        <div className="flex-1">
          <span className={`font-bold text-lg ${config.title} block mb-3`}>{title}</span>
          <div className={`${config.bg} p-5 rounded-2xl border ${config.border} shadow-sm group-hover:shadow-md transition-all duration-300`}>
            <p className="text-gray-800 text-lg leading-relaxed">{text}</p>
          </div>
        </div>
      </div>
    </div>
  );
}