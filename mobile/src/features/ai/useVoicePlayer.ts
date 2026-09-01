import { useCallback, useEffect, useRef, useState } from "react";
import * as FileSystem from "expo-file-system";
import { synthesize } from "../../api/voice";

function getAudioModule() {
  try {
    const av = require("expo-av");
    return av.Audio || av.default?.Audio || null;
  } catch {
    return null;
  }
}

/**
 * Fetches Deepgram TTS audio through the backend, writes only a short-lived
 * cache file, and plays it locally. API keys never enter the mobile bundle.
 */
export function useVoicePlayer() {
  const soundRef = useRef<any>(null);
  const fileRef = useRef<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(async () => {
    const sound = soundRef.current;
    const file = fileRef.current;
    soundRef.current = null;
    fileRef.current = null;
    try {
      if (sound) await sound.unloadAsync();
    } catch {
      // Ignore unload error
    }
    try {
      if (file) await FileSystem.deleteAsync(file, { idempotent: true });
    } catch {
      // Ignore file delete error
    }
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setError(null);
      setSpeaking(true);
      try {
        const Audio = getAudioModule();
        if (!Audio) {
          setError("Voice playback is not supported in this runtime environment.");
          setSpeaking(false);
          return;
        }

        await stop();
        setSpeaking(true);
        const { audioBase64 } = await synthesize(text);
        const directory = (FileSystem as any).cacheDirectory;
        if (!directory) throw new Error("No cache directory is available for audio playback");
        const uri = `${directory}paypilot-tts-${Date.now()}.mp3`;
        await (FileSystem as any).writeAsStringAsync(uri, audioBase64, {
          encoding: (FileSystem as any).EncodingType?.Base64 || "base64",
        });
        fileRef.current = uri;
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
        let activeSound: any = null;
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
