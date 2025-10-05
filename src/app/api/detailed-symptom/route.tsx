import { GoogleGenerativeAI } from "@google/generative-ai";
import clientPromise from "../../../../lib/mongodb"; // adjust path if needed

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return new Response(
        JSON.stringify({ status: "error", message: "No prompt provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Default AI fallback
    const defaultResponse = {
      possible_conditions: "Common cold or mild infection.",
      risk_factors: "Recent exposure to illness or low immunity.",
      lifestyle_recommendations: "Rest, stay hydrated, and eat nutritious foods.",
      when_to_seek_immediate_care: "If high fever, chest pain, or breathing difficulty occurs.",
    };

    let aiJSON = defaultResponse;

    if (process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const systemPrompt = `
You are a medical AI assistant. Your task is to provide **detailed health insights**. 

Follow these rules strictly:

1. Respond **only in JSON format** with the following structure:
{
  "possible_conditions": "Explain possible causes in simple, non-alarming language.",
  "risk_factors": "List possible risk factors related to symptoms.",
  "lifestyle_recommendations": "Provide simple lifestyle or self-care tips.",
  "when_to_seek_immediate_care": "Mention clear signs for when to see a doctor or visit ER."
}

2. **Detect the language of the user's input** and respond **strictly in that language**. 
Do NOT translate, summarize, or switch languages under any circumstances.

3. **Do NOT include markdown, code blocks, or extra text outside JSON.**

4. Keep explanations short, helpful, and reassuring. 
Never diagnose or guarantee conditions.
`;


      const fullPrompt = `${systemPrompt}\nUser: ${prompt}`;
      try {
        const result = await model.generateContent(fullPrompt);
        let responseText = result.response?.text() || "";
        responseText = responseText.replace(/```json|```/g, "").trim();
        aiJSON = JSON.parse(responseText);
      } catch (err) {
        console.error("Gemini parsing error:", err);
        aiJSON = defaultResponse;
      }
    }

    // --- Optional: Save to MongoDB ---
    try {
      const client = await clientPromise;
      const db = client.db();
      const collection = db.collection("detailed_symptoms");
      await collection.insertOne({
        prompt,
        response: aiJSON,
        createdAt: new Date(),
      });
    } catch (mongoErr) {
      console.error("MongoDB save error:", mongoErr);
    }

    return new Response(JSON.stringify({ status: "success", output: aiJSON }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        message: "AI response failed",
        output: {
          possible_conditions: "Mild infection or fatigue-related issue.",
          risk_factors: "Dehydration or lack of rest.",
          lifestyle_recommendations: "Get proper sleep, stay hydrated, and eat balanced meals.",
          when_to_seek_immediate_care:
            "If symptoms worsen or include high fever or chest pain.",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
