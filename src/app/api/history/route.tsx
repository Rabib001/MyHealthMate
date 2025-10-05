import { NextResponse } from "next/server";
import clientPromise from "../../../../lib/mongodb";

export async function GET() {
  try {
    console.log("🔍 Fetching symptom history from MongoDB...");
    
    const client = await clientPromise;
    const db = client.db("symptom-checker");
    const collection = db.collection("symptoms");

    // Get all symptoms, sorted by most recent first
    const history = await collection
      .find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    console.log(`📊 Found ${history.length} symptoms in database`);

    // Convert MongoDB ObjectId to string for serialization
    const serializedHistory = history.map(item => ({
      _id: item._id.toString(),
      symptom: item.symptom,
      response: item.response,
      timestamp: item.timestamp
    }));

    return NextResponse.json({
      status: "success",
      history: serializedHistory
    });

  } catch (error) {
    console.error("❌ Error fetching history:", error);
    return NextResponse.json(
      { 
        status: "error", 
        message: "Failed to fetch symptom history",
        history: []
      },
      { status: 500 }
    );
  }
}