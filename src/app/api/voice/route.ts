import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { audio, mimeType } = await req.json();

    if (!audio) {
      return NextResponse.json(
        { status: "error", message: "No audio data provided" },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, "base64");
    
    // Create a Blob from the buffer
    const audioBlob = new Blob([audioBuffer], { type: mimeType || "audio/webm" });
    
    // Create FormData for ElevenLabs
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");
    formData.append("model_id", "scribe_v1");

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": `${process.env.ELEVENLABS_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("ElevenLabs API Error:", errorData);
      return NextResponse.json(
        { status: "error", message: `ElevenLabs API error: ${errorData}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({ 
      status: "success", 
      text: data.text 
    });
  } catch (error) {
    console.error("Voice processing error:", error);
    return NextResponse.json(
      { status: "error", message: "Voice processing failed" },
      { status: 500 }
    );
  }
}