import { useCallback, useEffect, useRef, useState } from "react";
import * as FileSystem from "expo-file-system/legacy";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { synthesize } from "../../api/voice";

/**
 * Fetches Deepgram TTS audio through the backend, writes a short-lived
 * cache file, and plays it locally using expo-audio.
 */
export function useVoicePlayer() {
  const playerRef = useRef<any>(null);
  const fileRef = useRef<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(async () => {
    const player = playerRef.current;
    const file = fileRef.current;
    playerRef.current = null;
    fileRef.current = null;

    try {
      if (player) {
        player.pause?.();
        player.remove?.();
      }
    } catch {}

    try {
      if (file) await FileSystem.deleteAsync(file, { idempotent: true });
    } catch {}

    setSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!text || !text.trim()) return;
      setError(null);
      try {
        await stop();
        setSpeaking(true);

        const { audioBase64 } = await synthesize(text);
        const directory = FileSystem.cacheDirectory;
        if (!directory) throw new Error("No cache directory available for audio playback");
        const uri = `${directory}paypilot-tts-${Date.now()}.mp3`;
        await FileSystem.writeAsStringAsync(uri, audioBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        fileRef.current = uri;

        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
        });

        const player = createAudioPlayer(uri);
        playerRef.current = player;

        (player as any)?.addListener?.("playbackStatusUpdate", (status: any) => {
          if (status?.didJustFinish || (status?.isLoaded && !status?.playing && status?.currentTime >= (status?.duration || 0))) {
            void stop();
          }
        });

        player.play();

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
