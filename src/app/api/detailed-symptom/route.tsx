import { NextResponse } from "next/server";
import clientPromise from "../../../../lib/mongodb";

// Define TypeScript interfaces
interface SymptomHistory {
  _id: string;
  symptom: string;
  response: {
    urgency: string;
    suggestion: string;
    next_steps: string;
  };
  timestamp: Date;
}

interface DetailedAnalysis {
  possible_conditions: string;
  risk_factors: string;
  lifestyle_recommendations: string;
  when_to_seek_immediate_care: string;
  historical_context?: string;
  personalized_monitoring?: string;
  follow_up_suggestions?: string;
}

interface ApiContext {
  historyUsed: boolean;
  totalHistoryEntries: number;
  personalized?: boolean;
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { status: "error", message: "No symptom provided" },
        { status: 400 }
      );
    }

    // Fetch user's symptom history from MongoDB with proper typing
    let userHistory: SymptomHistory[] = [];
    try {
      const client = await clientPromise;
      const db = client.db("symptom-checker");
      const collection = db.collection<SymptomHistory>("symptoms");
      
      // Get last 10 symptoms for context
      userHistory = await collection
        .find({})
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();
      
      console.log(`📊 Found ${userHistory.length} historical symptoms for context`);
    } catch (historyError) {
      console.error("❌ Error fetching history:", historyError);
      // Continue without history if there's an error
    }

    // Build context from history with proper typing
    let historyContext = "";
    if (userHistory.length > 0) {
      const recentSymptoms = userHistory.slice(0, 3).map(item => item.symptom).join(", ");
      historyContext = `\n\nUSER'S RECENT SYMPTOM HISTORY: ${recentSymptoms}`;
      
      // Add pattern analysis if there are multiple entries
      if (userHistory.length >= 3) {
        const symptomFrequency: Record<string, number> = {};
        userHistory.forEach(item => {
          const words = item.symptom.toLowerCase().split(/\s+/);
          words.forEach(word => {
            if (word.length > 3) { // Ignore short words
              symptomFrequency[word] = (symptomFrequency[word] || 0) + 1;
            }
          });
        });
        
        const frequentSymptoms = Object.entries(symptomFrequency)
          .filter(([_, count]) => count >= 2)
          .map(([symptom]) => symptom)
          .slice(0, 5);
        
        if (frequentSymptoms.length > 0) {
          historyContext += `\nFREQUENTLY MENTIONED SYMPTOMS: ${frequentSymptoms.join(", ")}`;
        }
      }
    }

    const detailedPrompt = `You are an advanced medical AI assistant providing personalized DETAILED analysis.

CURRENT SYMPTOM: ${prompt}${historyContext}

IMPORTANT CONTEXT: Consider the user's symptom history when providing analysis. Look for patterns, recurring issues, or related symptoms that might provide additional context.

Provide a comprehensive response in JSON format with these keys:
- possible_conditions: List 2-3 possible medical conditions (consider historical context)
- risk_factors: Warning signs to be aware of (personalize based on symptom patterns)
- lifestyle_recommendations: Personalized lifestyle changes or home remedies
- when_to_seek_immediate_care: When to seek emergency care
- historical_insights: Brief note about how this symptom relates to their history (if relevant)
- monitoring_suggestions: What to watch for based on their symptom patterns

Format as valid JSON. Be more personalized and contextual given the history data.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: detailedPrompt }] }],
        }),
      }
    );

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      return NextResponse.json(
        { status: "error", message: "No AI response" },
        { status: 500 }
      );
    }

    let cleanedText = aiText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/```\n?/g, "");
    }

    const parsed: DetailedAnalysis = JSON.parse(cleanedText);

    const context: ApiContext = {
      historyUsed: userHistory.length > 0,
      totalHistoryEntries: userHistory.length
    };

    return NextResponse.json({
      status: "success",
      output: parsed,
      context: context
    });
  } catch (error) {
    console.error("Detailed symptom error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to generate detailed analysis" },
      { status: 500 }
    );
  }
}