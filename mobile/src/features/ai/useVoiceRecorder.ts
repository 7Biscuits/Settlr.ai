import { useCallback, useRef, useState } from "react";

function getAudioModule() {
  try {
    const av = require("expo-av");
    return av.Audio || av.default?.Audio || null;
  } catch {
    return null;
  }
}

/**
 * Records a short voice clip using expo-av. Speech-to-text transcription is a
 * backend concern (the client never calls an LLM/STT provider directly); this
 * hook captures audio and exposes the recorded file URI so it can be sent to a
 * backend voice endpoint when available. Recording permission is requested on
 * demand.
 */
export function useVoiceRecorder() {
  const recordingRef = useRef<any>(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const Audio = getAudioModule();
      if (!Audio) {
        setError("Voice recording is not supported in this runtime environment.");
        return false;
      }
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        setError("Microphone permission is required for voice commands.");
        return false;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setRecording(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start recording");
      return false;
    }
  }, []);

  /** Stops recording and returns the local file URI (or null). */
  const stop = useCallback(async (): Promise<string | null> => {
    const rec = recordingRef.current;
    if (!rec) return null;
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recordingRef.current = null;
      setRecording(false);
      return uri ?? null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not stop recording");
      setRecording(false);
      return null;
    }
  }, []);

  return { recording, error, start, stop };
}
