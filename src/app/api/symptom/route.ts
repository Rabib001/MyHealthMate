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

    // Default AI response in case API key is missing or AI fails
    const defaultResponse = {
      urgency: "medium",
      suggestion: "Rest, drink fluids, monitor symptoms.",
      next_steps: "See a doctor if symptoms worsen."
    };

    let aiJSON = defaultResponse;

    if (process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const systemPrompt = `
You are a helpful health assistant.
Respond ONLY in JSON format with this structure:

{
  "urgency": "low/medium/high",
  "suggestion": "advice here",
  "next_steps": "when to see a doctor"
}

Do NOT include markdown, explanations, or any text outside JSON.
Do NOT diagnose.
`;

      const fullPrompt = `${systemPrompt}\nUser: ${prompt}`;
      try {
        const result = await model.generateContent(fullPrompt);
        let responseText = result.response?.text() || "";
        responseText = responseText.replace(/```json|```/g, "").trim();
        aiJSON = JSON.parse(responseText);
      } catch {
        // fallback: use defaultResponse
        aiJSON = defaultResponse;
      }
    }

    // --- Save to MongoDB ---
    try {
      const client = await clientPromise;
      const db = client.db(); // uses default DB from URI
      const collection = db.collection("symptoms"); // create "symptoms" collection
      await collection.insertOne({
        prompt,
        response: aiJSON,
        createdAt: new Date()
      });
    } catch (mongoErr) {
      console.error("MongoDB save error:", mongoErr);
      // continue even if DB fails
    }

    return new Response(JSON.stringify({ status: "success", output: aiJSON }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return new Response(
      JSON.stringify({ status: "error", message: "No response from AI", output: {
        urgency: "medium",
        suggestion: "Rest and drink fluids",
        next_steps: "See a doctor if symptoms worsen"
      }}),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
