"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AIResponse {
  urgency: string;
  suggestion: string;
  next_steps: string;
}

interface SymptomHistory {
  _id: string;
  symptom: string;
  response: AIResponse;
  timestamp: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<SymptomHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      if (data.status === "success") setHistory(data.history);
      else setError(data.message || "Failed to load history");
    } catch (err) {
      console.error(err);
      setError("Network error - could not fetch history");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => router.push("/dashboard");

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case "high": return "text-red-700 border-red-200/50 bg-red-50/80";
      case "medium": return "text-yellow-700 border-yellow-200/50 bg-yellow-50/80";
      case "low": return "text-green-700 border-green-200/50 bg-green-50/80";
      default: return "text-gray-600 border-gray-200/50 bg-gray-50/80";
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const graphData = history
    .map((entry) => ({
      time: new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      urgency: entry.response.urgency.toLowerCase(),
    }))
    .map((entry) => ({
      ...entry,
      urgencyValue: entry.urgency === "low" ? 1 : entry.urgency === "medium" ? 2 : 3,
    }));

  if (!isMounted) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 px-6 py-6 relative">
      {/* Background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-50 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-50 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse delay-1000"></div>
      </div>

      {/* Wider container */}
      <div className="max-w-[80rem] mx-auto flex flex-col lg:flex-row gap-6">
        {/* Left: Symptom History */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between p-6 bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-blue-600 bg-clip-text text-transparent">
              Symptom History
            </h1>
            <button
              onClick={fetchHistory}
              className="bg-gradient-to-r from-blue-300 to-cyan-300 hover:from-blue-400 hover:to-cyan-400 text-white font-semibold px-4 py-2 rounded-2xl transition-all duration-300 shadow hover:shadow-lg"
            >
              Refresh
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
            </div>
          )}

          {error && (
            <div className="p-6 bg-red-50/80 border border-red-200/50 rounded-3xl text-center">
              <p className="text-red-700 font-semibold mb-2">Error Loading History</p>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchHistory}
                className="bg-red-400 hover:bg-red-500 text-white font-semibold px-6 py-2 rounded-2xl transition-all duration-300"
              >
                Try Again
              </button>
            </div>
          )}

          {history.length === 0 && !loading && !error && (
            <div className="p-8 bg-white/70 border border-white/50 rounded-3xl text-center">
              <p className="text-gray-800 text-lg mb-4">No symptom history yet.</p>
              <button
                onClick={handleBack}
                className="bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow hover:shadow-lg"
              >
                Go to Symptom Checker
              </button>
            </div>
          )}

          {history.map((entry) => (
            <div
              key={entry._id}
              className={`p-6 rounded-3xl border ${getUrgencyColor(entry.response.urgency)} shadow-sm hover:shadow-lg transition-all duration-300`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">{entry.symptom}</h2>
                  <p className="text-gray-600 text-sm">📅 {formatDate(entry.timestamp)}</p>
                </div>
                <span className={`px-4 py-2 rounded-full font-semibold ${getUrgencyColor(entry.response.urgency)}`}>
                  {entry.response.urgency.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-gray-200/50 bg-white/80 shadow-sm">
                  <p className="text-gray-800"><strong>💡 Suggestion:</strong> {entry.response.suggestion}</p>
                </div>
                <div className="p-4 rounded-2xl border border-gray-200/50 bg-white/80 shadow-sm">
                  <p className="text-gray-800"><strong>🔄 Next Steps:</strong> {entry.response.next_steps}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Sticky Graph Panel */}
        <div className="lg:w-[600px] flex-shrink-0 sticky top-6 self-start">
          <div className="p-6 bg-white/70 border border-white/50 rounded-3xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-green-700 to-blue-600 bg-clip-text text-transparent">
              ⏰ Time to Urgency
            </h2>
            {graphData.length > 0 ? (
              <ResponsiveContainer width="100%" height={460}>
                <LineChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                  <XAxis dataKey="time" stroke="#444" />
                  <YAxis
                    tickFormatter={(val) => (val === 1 ? "Low" : val === 2 ? "Medium" : "High")}
                    domain={[1, 3]}
                    stroke="#444"
                  />
                  <Tooltip
                    formatter={(val: number) => (val === 1 ? "Low" : val === 2 ? "Medium" : "High")}
                    contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #ccc" }}
                  />
                  <Line type="monotone" dataKey="urgencyValue" stroke="#4ade80" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-600">No data for graph</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
