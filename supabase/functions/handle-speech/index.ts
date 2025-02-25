import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, type, voiceId, voiceSettings, audio, format } = await req.json();

    if (type === "text-to-speech") {
      if (!text) {
        throw new Error("Text is required");
      }

      // Request to ElevenLabs API with voice settings
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
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
            voice_settings: voiceSettings || {
              stability: 0.25,
              similarity_boost: 0.85,
              style: 0.85,
              use_speaker_boost: true,
              speaking_rate: 0.95,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ElevenLabs API error:", errorText);
        throw new Error("Failed to generate speech: " + errorText);
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      );

      return new Response(
        JSON.stringify({ audioContent: base64Audio }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (type === "speech-to-text") {
      if (!audio) {
        throw new Error("No audio data provided");
      }

      let mimeType = format;
      let fileExtension = "mp3"; // Default to MP3

      if (format === "audio/mp3" || format === "audio/mpeg") {
        mimeType = "audio/mpeg";
        fileExtension = "mp3";
      } else if (format === "audio/wav") {
        mimeType = "audio/wav";
        fileExtension = "wav";
      } else if (format === "audio/webm") {
        mimeType = "audio/webm";
        fileExtension = "webm";
      } else {
        throw new Error(`Unsupported format: ${format}`);
      }

      console.log("Using audio format in the edge function:", mimeType);

      // Process audio data with dynamic format
      const audioData = Uint8Array.from(atob(audio), (c) => c.charCodeAt(0));

      console.log("Using audio format:", format);
      const blob = new Blob([audioData], { type: mimeType });

      // Create form data for Whisper API
      const formData = new FormData();
      formData.append("file", blob, `audio.${fileExtension}`);
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
    }

    throw new Error("Invalid type specified");
  } catch (error) {
    console.error("Error in handle-speech function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
