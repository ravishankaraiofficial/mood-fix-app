import type { APIRoute } from 'astro';
import { buildSystemPrompt } from '../../lib/cbtPrompts';

export const GET: APIRoute = async (context) => {
  const upgradeHeader = context.request.headers.get('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  // @ts-ignore - Cloudflare native WebSocketPair
  if (typeof WebSocketPair === 'undefined') {
    return new Response('WebSocketPair not available in this environment', { status: 500 });
  }

  // @ts-ignore
  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair) as [WebSocket, WebSocket];

  (server as any).accept();
  
  let audioBuffer: Uint8Array[] = [];
  let languageCode = 'en';

  server.addEventListener('message', async (event) => {
    // Text messages for control (start, language, end)
    if (typeof event.data === 'string') {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'start') {
          audioBuffer = [];
          languageCode = msg.language || 'en';
        } else if (msg.type === 'end') {
          await processAudioWithGemini(audioBuffer, languageCode, server, context.locals);
        }
      } catch (e) {
        console.error("Invalid WS message format", e);
      }
    } else {
      // Binary messages are raw audio chunks being streamed
      audioBuffer.push(new Uint8Array(event.data as ArrayBuffer));
    }
  });

  return new Response(null, {
    status: 101,
    // @ts-ignore
    webSocket: client,
  });
};

async function processAudioWithGemini(chunks: Uint8Array[], langCode: string, ws: WebSocket, locals: any) {
  // Combine the streamed chunks
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  const base64Audio = btoa(String.fromCharCode(...combined));
  
  // Use CBT/ACT Prompt matrix mapped to the exact language
  const languageNames: Record<string, string> = {
    en: "English", hi: "Hindi", bn: "Bengali", te: "Telugu", mr: "Marathi", ta: "Tamil", gu: "Gujarati", ur: "Urdu", kn: "Kannada", or: "Odia", ml: "Malayalam", pa: "Punjabi", as: "Assamese"
  };
  const systemPrompt = buildSystemPrompt(languageNames[langCode] || "English");
  
  try {
    // In Astro on Cloudflare, env vars are often on locals.runtime.env or import.meta.env
    // Using import.meta.env for build time static, but let's safely access runtime if available
    const apiKey = import.meta.env.GEMINI_API_KEY || (locals?.runtime?.env?.GEMINI_API_KEY);
    
    if (!apiKey) throw new Error("API Key missing");

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ inlineData: { mimeType: 'audio/webm', data: base64Audio } }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
      })
    });

    if (!response.ok) throw new Error("Gemini API error: " + response.statusText);

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText) {
      ws.send(rawText); // Send the Dual-Axis Mood Matrix JSON strictly adhering to schema
    }
  } catch (error: any) {
    console.error(error);
    ws.send(JSON.stringify({ error: true, message: error.message }));
  }
}
