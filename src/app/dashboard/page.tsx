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

export default function Dashboard() {
  const [symptomData, setSymptomData] = useState<SymptomData | null>(null);
  const [detailedAnalysis, setDetailedAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Get symptom data from sessionStorage
    const storedData = sessionStorage.getItem('symptomData');
    if (storedData) {
      const data = JSON.parse(storedData);
      setSymptomData(data);
      fetchDetailedAnalysis(data.prompt);
    }
  }, []);

  const fetchDetailedAnalysis = async (prompt: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/detailed-symptom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
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
    sessionStorage.removeItem('symptomData');
    router.push('/');
  };

  const handleViewHistory = () => {
    router.push('/dashboard/history');
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
        {/* Header with Navigation */}
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

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-6 rounded-2xl mb-6 border border-blue-700">
          <h2 className="text-xl font-semibold mb-2">Welcome! 👋</h2>
          <p className="text-gray-300">You're now signed in and can access detailed health insights.</p>
        </div>

        {/* Original Symptom */}
        <div className="bg-gray-900 p-6 rounded-2xl mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-3">Your Symptom</h2>
          <p className="text-gray-300 bg-gray-800 p-4 rounded-lg">{symptomData.prompt}</p>
        </div>

        {/* Basic Analysis */}
        <div className="bg-gray-900 p-6 rounded-2xl mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Detailed analysis based on your history</h2>
          <div className="space-y-4">
            <div>
              <span className="font-semibold text-blue-400 block mb-2">Urgency Level:</span>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                symptomData.response.urgency.toLowerCase() === 'high' 
                  ? 'bg-red-900/30 text-red-400 border border-red-500'
                  : symptomData.response.urgency.toLowerCase() === 'medium'
                  ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500'
                  : 'bg-green-900/30 text-green-400 border border-green-500'
              }`}>
                {symptomData.response.urgency.toUpperCase()}
              </div>
            </div>
            <div>
              <span className="font-semibold text-blue-400 block mb-2">Suggestion:</span>
              <p className="text-gray-300 bg-gray-800 p-4 rounded-lg">{symptomData.response.suggestion}</p>
            </div>
            <div>
              <span className="font-semibold text-blue-400 block mb-2">Next Steps:</span>
              <p className="text-gray-300 bg-gray-800 p-4 rounded-lg">{symptomData.response.next_steps}</p>
            </div>
          </div>
        </div>

        {/* Detailed Analysis */}
        {loading && (
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              <p className="text-gray-400">Loading detailed analysis...</p>
            </div>
          </div>
        )}

        {detailedAnalysis && (
          <div className="bg-gradient-to-br from-gray-900 to-purple-900/20 p-6 rounded-2xl border border-purple-700 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🔍 Detailed Analysis <span className="text-sm bg-purple-700 px-2 py-1 rounded">Premium</span>
            </h2>
            <div className="space-y-4">
              {detailedAnalysis.possible_conditions && (
                <div>
                  <span className="font-semibold text-purple-400 block mb-2">Possible Conditions:</span>
                  <p className="text-gray-300 bg-gray-800/50 p-4 rounded-lg">{detailedAnalysis.possible_conditions}</p>
                </div>
              )}
              {detailedAnalysis.risk_factors && (
                <div>
                  <span className="font-semibold text-purple-400 block mb-2">Risk Factors:</span>
                  <p className="text-gray-300 bg-gray-800/50 p-4 rounded-lg">{detailedAnalysis.risk_factors}</p>
                </div>
              )}
              {detailedAnalysis.lifestyle_recommendations && (
                <div>
                  <span className="font-semibold text-purple-400 block mb-2">Lifestyle Recommendations:</span>
                  <p className="text-gray-300 bg-gray-800/50 p-4 rounded-lg">{detailedAnalysis.lifestyle_recommendations}</p>
                </div>
              )}
              {detailedAnalysis.when_to_seek_immediate_care && (
                <div>
                  <span className="font-semibold text-red-400 block mb-2">⚠️ When to Seek Immediate Care:</span>
                  <p className="text-gray-300 bg-red-900/20 p-4 rounded-lg border border-red-700">{detailedAnalysis.when_to_seek_immediate_care}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleViewHistory}
              className="bg-purple-600 hover:bg-purple-700 p-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>📋</span>
              View All Symptoms
            </button>
            <button
              onClick={handleBack}
              className="bg-blue-600 hover:bg-blue-700 p-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>🔍</span>
              Check New Symptom
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
          <p className="text-yellow-300 text-sm text-center">
            ⚠️ Disclaimer: This is not a diagnostic tool. Always consult with a healthcare professional for medical advice.
          </p>
        </div>
      </div>
    </main>
  );
}