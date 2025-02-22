
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, type, text, voiceId } = await req.json();

    if (type === "speech-to-text") {
      if (!audio) {
        throw new Error("No audio data provided");
      }

      // Process audio data
      const audioData = new Uint8Array(
        atob(audio)
          .split("")
          .map((char) => char.charCodeAt(0))
      );
      const blob = new Blob([audioData], { type: "audio/webm" });

      // Create form data for Whisper API
      const formData = new FormData();
      formData.append("file", blob, "audio.webm");
      formData.append("model", "whisper-1");
      formData.append("language", "en"); // Force English language
      formData.append("response_format", "json");

      const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Whisper API error: ${await response.text()}`);
      }

      const data = await response.json();
      return new Response(JSON.stringify({ text: data.text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (type === "text-to-speech") {
      if (!text || !voiceId) {
        throw new Error("Text and voiceId are required for text-to-speech");
      }

      console.log("Making text-to-speech request with:", { text, voiceId });

      const response = await fetch(
        "https://api.elevenlabs.io/v1/text-to-speech/" + voiceId,
        {
          method: "POST",
          headers: {
            Accept: "audio/mpeg",
            "xi-api-key": Deno.env.get("ELEVEN_LABS_API_KEY") || "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ElevenLabs API error:", errorText);
        throw new Error("Failed to generate speech: " + errorText);
      }

      // Use chunks to handle large audio files
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const chunks = [];
      const chunkSize = 8192; // Process data in smaller chunks

      for (let i = 0; i < bytes.length; i += chunkSize) {
        chunks.push(
          String.fromCharCode.apply(null, bytes.slice(i, i + chunkSize))
        );
      }

      const base64Audio = btoa(chunks.join(""));

      return new Response(JSON.stringify({ audioContent: base64Audio }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid type specified");
  } catch (error) {
    console.error("Error in handle-speech function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
