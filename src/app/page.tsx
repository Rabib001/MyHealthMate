"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

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
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const router = useRouter();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  /** Submit prompt (from textarea or STT) to Gemini API */
  const handleSubmit = async (text?: string) => {
    const actualPrompt = (text ?? prompt).trim();
    if (!actualPrompt) return;

    setLoading(true);
    setResponse(null);
    setError(null);
    setShowAuthPrompt(false);

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
        setShowAuthPrompt(true);
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
          setPrompt(sttData.text);
          await handleSubmit(sttData.text);
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

  /** Navigate to dashboard */
  const handleAuthClick = () => {
    if (response && prompt) {
      sessionStorage.setItem('symptomData', JSON.stringify({
        prompt,
        response
      }));
    }
    router.push('/dashboard');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-50 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-50 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-50 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-500"></div>
      </div>

      <div 
        className="relative w-full max-w-2xl p-10 rounded-3xl shadow-xl bg-white/70 backdrop-blur-sm border border-white/50 transition-all duration-500 hover:shadow-2xl"
        style={{
          transform: isHovered ? 'translateY(-6px) rotateX(3deg)' : 'translateY(0px) rotateX(0deg)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Wellness Icon */}
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl shadow-md flex items-center justify-center transform rotate-12 transition-transform duration-700 hover:rotate-0 border border-white/60">
              <div className="w-16 h-16 bg-white/80 rounded-xl flex items-center justify-center shadow-inner">
                <span className="text-6xl">🧑‍⚕️</span>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-green-200 to-blue-200 rounded-2xl opacity-30 blur-md"></div>
          </div>
        </div>

        <div className="text-center mb-8 pt-12">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-green-700 to-blue-600 bg-clip-text text-transparent">
            Check_MateAI
          </h1>
          <p className="text-gray-600 text-lg max-w-md mx-auto">Share your symptoms for personalized AI health guidance</p>
        </div>

        <div className="space-y-8">
          <div className="relative group">
            <textarea
              className="w-full p-5 rounded-2xl bg-white/80 border border-gray-200/80 text-gray-800 placeholder-gray-500 resize-none shadow-sm transition-all duration-300 focus:bg-white focus:shadow-md focus:border-green-200 focus:ring-2 focus:ring-green-100 group-hover:bg-white/90 text-lg leading-relaxed"
              rows={6}
              placeholder="Describe how you're feeling today... Include any symptoms, their duration, and severity."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="absolute bottom-4 right-4 text-gray-400 group-hover:text-green-500 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleSubmit()}
              disabled={loading || recording}
              className="flex-1 bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg flex items-center justify-center gap-3 text-lg"
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <span>Check Symptoms</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </>
              )}
            </button>

            <button
              onClick={handleVoiceInput}
              disabled={loading && !recording}
              className={`flex-1 font-semibold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none ${
                recording 
                  ? "bg-gradient-to-r from-red-400 to-pink-400 hover:from-red-500 hover:to-pink-500 text-white animate-pulse" 
                  : "bg-gradient-to-r from-blue-300 to-cyan-300 hover:from-blue-400 hover:to-cyan-400 text-white"
              } flex items-center justify-center gap-3 text-lg`}
            >
              {recording ? (
                <>
                  <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                  Stop Recording
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Voice Input
                </>
              )}
            </button>
          </div>
        </div>

        {response && (
          <div className="mt-8 p-8 bg-gradient-to-br from-green-50/80 to-blue-50/80 rounded-2xl border border-green-100/80 shadow-lg transition-all duration-500 animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center border border-green-200/50">
                <span className="text-2xl">💡</span>
              </div>
              <h2 className="font-bold text-2xl bg-gradient-to-r from-green-700 to-blue-600 bg-clip-text text-transparent">
                Health Insights
              </h2>
            </div>
            
            <div className="space-y-5">
              <div className="p-4 bg-white/70 rounded-2xl border border-green-200/50 shadow-sm">
                <p className="text-sm text-gray-600 mb-2 font-medium">Urgency Level</p>
                <p className="font-semibold text-green-800 text-lg">{response.urgency}</p>
              </div>
              
              <div className="p-4 bg-white/70 rounded-2xl border border-blue-200/50 shadow-sm">
                <p className="text-sm text-gray-600 mb-2 font-medium">Recommendation</p>
                <p className="font-medium text-gray-800 text-lg leading-relaxed">{response.suggestion}</p>
              </div>
              
              <div className="p-4 bg-white/70 rounded-2xl border border-purple-200/50 shadow-sm">
                <p className="text-sm text-gray-600 mb-2 font-medium">Next Steps</p>
                <p className="font-medium text-gray-800 text-lg leading-relaxed">{response.next_steps}</p>
              </div>
            </div>
          </div>
        )}

        {showAuthPrompt && response && (
          <div className="mt-8 p-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200/60 backdrop-blur-sm transition-all duration-500 hover:shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-200 to-blue-200 rounded-xl flex items-center justify-center border border-green-300/50">
                <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl text-gray-800">Continue Your Health Journey</h3>
            </div>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed">
              Sign in to track your symptoms over time, receive personalized recommendations, and access comprehensive health insights tailored to you.
            </p>
            <button
              onClick={handleAuthClick}
              className="w-full bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg group"
            >
              Sign In / Create Account
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        )}

        {error && (
          <div className="mt-8 p-5 bg-red-50/80 rounded-2xl border border-red-200/80 shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center border border-red-200/50">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-700 font-medium text-lg">{error}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}