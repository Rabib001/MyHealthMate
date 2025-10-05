import { GoogleGenerativeAI } from "@google/generative-ai";
import clientPromise from "../../../../lib/mongodb";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      console.error("Gemini API key missing!");
      return new Response(
        JSON.stringify({
          status: "error",
          message: "API key not configured",
          output: {
            urgency: "medium",
            suggestion: "Rest, drink fluids, monitor symptoms.",
            next_steps: "See a doctor if symptoms worsen."
          }
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

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

    const result = await model.generateContent(fullPrompt);
    let responseText = result.response?.text() || "";

    console.log("Raw Gemini response:", responseText);

    responseText = responseText.replace(/```json|```/g, "").trim();

    let aiJSON;
    try {
      aiJSON = JSON.parse(responseText);
    } catch {
      aiJSON = {
        urgency: "medium",
        suggestion: "Rest, drink fluids, monitor symptoms.",
        next_steps: "See a doctor if symptoms worsen."
      };
    }

    // Save to MongoDB
    try {
      const client = await clientPromise;
      const db = client.db("symptom-checker");
      const collection = db.collection("symptoms");

      await collection.insertOne({
        symptom: prompt,
        response: aiJSON,
        timestamp: new Date(),
      });

      console.log("✅ Symptom saved to database");
    } catch (dbError) {
      console.error("❌ Database error:", dbError);
    }

    return new Response(
      JSON.stringify({ status: "success", output: aiJSON }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Gemini API Error:", error);

    return new Response(
      JSON.stringify({
        status: "error",
        message: "No response from AI",
        output: {
          urgency: "medium",
          suggestion: "Rest and drink fluids",
          next_steps: "See a doctor if symptoms worsen"
        }
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}