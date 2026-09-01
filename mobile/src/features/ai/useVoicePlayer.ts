import { useCallback, useEffect, useRef, useState } from "react";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { synthesize } from "../../api/voice";


/**
 * Fetches Deepgram TTS audio through the backend, writes only a short-lived
 * cache file, and plays it locally. API keys never enter the mobile bundle.
 */
export function useVoicePlayer() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const fileRef = useRef<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(async () => {
    const sound = soundRef.current;
    const file = fileRef.current;
    soundRef.current = null;
    fileRef.current = null;
    if (sound) await sound.unloadAsync();
    if (file) await FileSystem.deleteAsync(file, { idempotent: true });
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setError(null);
      setSpeaking(true);
      try {
        await stop();
        setSpeaking(true);
        const { audioBase64 } = await synthesize(text);
        const directory = FileSystem.cacheDirectory;
        if (!directory) throw new Error("No cache directory is available for audio playback");
        const uri = `${directory}paypilot-tts-${Date.now()}.mp3`;
        await FileSystem.writeAsStringAsync(uri, audioBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        fileRef.current = uri;
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
        let activeSound: Audio.Sound | null = null;
        const created = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          (status: any) => {
            if (status.isLoaded && status.didJustFinish) {
              if (activeSound) void activeSound.unloadAsync();
              if (soundRef.current === activeSound) soundRef.current = null;
              if (fileRef.current === uri) {
                fileRef.current = null;
                void FileSystem.deleteAsync(uri, { idempotent: true });
              }
              setSpeaking(false);
            }
          },
        );
        activeSound = created.sound;
        soundRef.current = activeSound;
      } catch (err) {
        setSpeaking(false);
        setError(err instanceof Error ? err.message : "Unable to play voice reply");
      }
    },
    [stop],
  );

  useEffect(() => () => { void stop(); }, [stop]);

  return { speak, stop, speaking, error };
}
