"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SymptomHistory {
  _id: string;
  symptom: string;
  response: {
    urgency: string;
    suggestion: string;
    next_steps: string;
  };
  timestamp: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<SymptomHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Fetching history from API...");
      
      const res = await fetch("/api/history");
      const data = await res.json();
      
      console.log("📨 API Response:", data);
      
      if (data.status === "success") {
        setHistory(data.history);
        console.log("✅ History set with", data.history.length, "items");
      } else {
        setError(data.message || "Failed to load history");
      }
    } catch (error) {
      console.error("❌ Error fetching history:", error);
      setError("Network error - could not fetch history");
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case "high": return "text-red-400 border-red-500";
      case "medium": return "text-yellow-400 border-yellow-500";
      case "low": return "text-green-400 border-green-500";
      default: return "text-gray-400 border-gray-500";
    }
  };

  const getUrgencyBgColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case "high": return "bg-red-900/30";
      case "medium": return "bg-yellow-900/30";
      case "low": return "bg-green-900/30";
      default: return "bg-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold">Symptom History</h1>
          </div>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your symptom history...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold">Symptom History</h1>
          </div>
          <div className="bg-red-900/20 border border-red-700 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Error Loading History</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={fetchHistory}
              className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors"
            >
              ← Dashboard
            </button>
            <h1 className="text-3xl font-bold">Symptom History 📋</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-blue-600 text-sm px-3 py-1 rounded-full">
              {history.length} {history.length === 1 ? 'entry' : 'entries'}
            </span>
            <button
              onClick={fetchHistory}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors text-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* History List */}
        {history.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-8 text-center border border-gray-700">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold mb-2">No symptoms recorded yet</h2>
            <p className="text-gray-400 mb-4">Your symptom history will appear here after you use the symptom checker.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded transition-colors"
            >
              Check a Symptom
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {history.map((entry, index) => (
              <div
                key={entry._id}
                className={`bg-gray-900 rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200 ${
                  index === 0 ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mt-1">
                        {history.length - index}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {entry.symptom}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          📅 {formatDate(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${getUrgencyColor(entry.response.urgency)} ${getUrgencyBgColor(entry.response.urgency)}`}>
                    {entry.response.urgency.toUpperCase()} URGENCY
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <span className="font-semibold text-blue-400 block mb-2">💡 Suggestion:</span>
                    <p className="text-gray-300">{entry.response.suggestion}</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <span className="font-semibold text-green-400 block mb-2">🔄 Next Steps:</span>
                    <p className="text-gray-300">{entry.response.next_steps}</p>
                  </div>
                </div>

                {index === 0 && (
                  <div className="mt-4 text-xs text-blue-400 flex items-center gap-1">
                    <span>⭐</span>
                    <span>Most Recent</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}