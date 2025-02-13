
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { audio, type } = await req.json()
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    if (type === 'speech-to-text') {
      console.log('Processing speech to text...');
      
      // Process base64 audio data more efficiently
      const audioData = Uint8Array.from(atob(audio), c => c.charCodeAt(0))
      const blob = new Blob([audioData], { type: 'audio/webm' })
      
      // Create form data for Whisper API
      const formData = new FormData()
      formData.append('file', blob, 'audio.webm')
      formData.append('model', 'whisper-1')

      console.log('Sending request to Whisper API...');
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Whisper API error:', errorData);
        throw new Error(`Whisper API error: ${errorData}`);
      }

      const data = await response.json()
      console.log('Speech to text completed successfully');
      return new Response(JSON.stringify({ text: data.text }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else if (type === 'text-to-speech') {
      console.log('Processing text to speech...');
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: audio, // In this case, audio contains the text to convert
          voice: 'alloy',
          response_format: 'mp3',
        }),
      })

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Text-to-speech API error:', errorData);
        throw new Error(`Text-to-speech API error: ${errorData}`);
      }

      const arrayBuffer = await response.arrayBuffer()
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      console.log('Text to speech completed successfully');

      return new Response(
        JSON.stringify({ audioContent: base64Audio }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    throw new Error('Invalid type specified')
  } catch (error) {
    console.error('Error in handle-speech function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
