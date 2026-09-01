"use client";

import { useState } from "react";

/**
 * Voice input using the browser's Web Speech API (SpeechRecognition) for
 * speech-to-text. This keeps STT client-side and free for the demo; a
 * server-side provider can be swapped in via the /voice proxy if desired.
 */
export function VoiceInput({
  onTranscript,
}: {
  onTranscript: (text: string) => void;
}) {
  const [listening, setListening] = useState(false);

  function start() {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      onTranscript(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    setListening(true);
    recognition.start();
  }

  return (
    <button
      type="button"
      onClick={start}
      title="Voice input"
      className={`rounded border px-3 py-2 ${
        listening
          ? "border-red-500 text-red-400"
          : "border-gray-600 hover:bg-gray-800"
      }`}
    >
      🎤
    </button>
  );
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: (event: {
    results: { [index: number]: { [index: number]: { transcript: string } } };
  }) => void;
  onend: () => void;
  onerror: () => void;
  start: () => void;
}
