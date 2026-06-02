import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  try {
    // 1. Read the API key securely from the environment
    const runtime = (context.locals as any)?.runtime;
    const apiKey = runtime?.env?.GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Please add it to your environment variables.");
    }

    // 2. Call the Gemini API with the 2.5 Flash model
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "Reply with exactly: Gemini is connected" }]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const geminiReply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No reply found";

    // 3. Return the successful JSON response
    return new Response(
      JSON.stringify({
        status: "ok",
        geminiReply: geminiReply
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error: any) {
    // 4. Return HTTP 500 on failure
    return new Response(
      JSON.stringify({
        status: "error",
        message: error.message || "An unknown error occurred"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
};
