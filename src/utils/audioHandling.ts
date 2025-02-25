
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export const loadFFmpeg = async () => {
  const ffmpeg = new FFmpeg();
  if (!ffmpeg.loaded) {
    try {
      await ffmpeg.load({
        coreURL: await toBlobURL('/node_modules/@ffmpeg/core/dist/ffmpeg-core.js', 'text/javascript'),
        wasmURL: await toBlobURL('/node_modules/@ffmpeg/core/dist/ffmpeg-core.wasm', 'application/wasm'),
      });
      console.log('FFmpeg loaded successfully');
    } catch (error) {
      console.error('Error loading FFmpeg:', error);
    }
  }
  return ffmpeg;
};

export const processAudioData = async (
  audioBlob: Blob,
  mimeType: string,
  ffmpeg: FFmpeg
) => {
  if (mimeType === "audio/mp4") {
    try {
      const audioData = await fetchFile(audioBlob);
      await ffmpeg.writeFile('input.mp4', audioData);

      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-vn',
        '-ar', '44100',
        '-ac', '2',
        '-b:a', '192k',
        'output.mp3'
      ]);

      const data = await ffmpeg.readFile('output.mp3');
      return new Blob([data], { type: 'audio/mp3' });
    } catch (error) {
      console.error('Error converting audio:', error);
      return audioBlob;
    }
  }
  return audioBlob;
};
