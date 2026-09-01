import { useCallback, useRef, useState } from "react";
import {
  AudioModule,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";

/**
 * Records audio using expo-audio (modern SDK 57 native module).
 * Microphone permission is requested on demand.
 */
export function useVoiceRecorder() {
  const recorderRef = useRef<any>(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        setError("Microphone permission is required to record voice.");
        return false;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      const recorder = new AudioModule.AudioRecorder(
        RecordingPresets.HIGH_QUALITY,
      );
      await recorder.prepareToRecordAsync();
      recorder.record();
      recorderRef.current = recorder;
      setRecording(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start recording");
      return false;
    }
  }, []);

  /** Stops recording and returns the local file URI (or null). */
  const stop = useCallback(async (): Promise<string | null> => {
    try {
      if (recorderRef.current) {
        const rec = recorderRef.current;
        recorderRef.current = null;
        await rec.stop();
        setRecording(false);
        return rec.uri ?? null;
      }

      setRecording(false);
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not stop recording");
      setRecording(false);
      return null;
    }
  }, []);

  return { recording, error, start, stop };
}
