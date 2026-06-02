import type { APIRoute } from 'astro';

const FALLBACK_RESPONSE = {
  emotion: "overwhelmed",
  responseType: "breathing",
  content: "1. Inhale deeply through your nose for 4 seconds.\n2. Hold your breath for 7 seconds.\n3. Exhale completely through your mouth for 8 seconds.\n4. Repeat this cycle 4 times.",
  includeDistressMessage: false,
  distressMessage: ""
};

const SYSTEM_PROMPT = `A person just described how they feel. Read their emotion from the audio. Respond with a JSON object only — no markdown, no extra text, no code fences. Use exactly this schema:
{
  "emotion": "short 1-3 word emotion read from the audio",
  "responseType": "breathing" OR "calming_text",
  "content": "if breathing: a simple 4-step breathing exercise in plain language. If calming_text: a warm calming passage under 120 words.",
  "includeDistressMessage": true OR false (true ONLY if the person sounds in serious distress),
  "distressMessage": "if includeDistressMessage is true, a gentle line suggesting they talk to someone they trust. Otherwise empty string."
}

Use warm, plain language. No medical claims. Never pretend to be a therapist or doctor.`;

export const POST: APIRoute = async (context) => {
  try {
    // 1. Read API Key
    const runtime = (context.locals as any)?.runtime;
    const apiKey = runtime?.env?.GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server configuration missing API key." }), { status: 500 });
    }

    // 2. Parse FormData
    const formData = await context.request.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return new Response(JSON.stringify({ error: "No audio file provided." }), { status: 400 });
    }

    // 3. File size check (15MB)
    const MAX_SIZE = 15 * 1024 * 1024;
    if (audioFile.size > MAX_SIZE) {
      return new Response(JSON.stringify({ error: "Recording too long, please keep it under 30 seconds." }), { status: 413 });
    }

    // 4. Convert to Base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = audioFile.type || 'audio/webm';
    
    // 5. Language Selection
    const languageMap: Record<string, string> = {
      en: "English", hi: "Hindi", bn: "Bengali", te: "Telugu", mr: "Marathi", ta: "Tamil", gu: "Gujarati", ur: "Urdu", kn: "Kannada", or: "Odia", ml: "Malayalam", pa: "Punjabi", as: "Assamese"
    };
    const langCode = formData.get('language') as string || 'en';
    const languageName = languageMap[langCode] || "English";
    
    const dynamicSystemPrompt = `${SYSTEM_PROMPT}\n\nRespond ENTIRELY in the following language: ${languageName}. The emotion word, the breathing exercise or calming passage, and the distress message must ALL be in that language. Use natural, native phrasing.`;

    // 6. Call Gemini 2.5 Flash
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 seconds

    try {
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: dynamicSystemPrompt }]
          },
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Audio
                }
              }
            ]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      clearTimeout(timeoutId);

      if (!geminiRes.ok) {
        console.error("Gemini API error:", await geminiRes.text());
        return new Response(JSON.stringify(FALLBACK_RESPONSE), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      const data = await geminiRes.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
      
      // Attempt to parse JSON
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(rawText);
        // Basic validation of expected shape
        if (!parsedResponse.emotion || !parsedResponse.responseType) {
          throw new Error("Invalid schema");
        }
      } catch (e) {
        console.error("Failed to parse Gemini response as JSON:", rawText);
        parsedResponse = FALLBACK_RESPONSE;
      }

      return new Response(JSON.stringify(parsedResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (e: any) {
      clearTimeout(timeoutId);
      console.error("Fetch to Gemini failed (possibly timeout):", e);
      return new Response(JSON.stringify(FALLBACK_RESPONSE), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

  } catch (error: any) {
    console.error("API error:", error);
    return new Response(JSON.stringify(FALLBACK_RESPONSE), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
};
