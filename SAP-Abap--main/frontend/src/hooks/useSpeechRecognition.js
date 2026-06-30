import { useEffect, useRef, useState, useCallback } from "react";

export function useSpeechRecognition({ onResult, onError, lang = "en-US" } = {}) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const supported = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (!supported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0]?.transcript || "")
        .join(" ")
        .trim();
      if (transcript && onResult) onResult(transcript);
    };
    rec.onerror = (event) => {
      setListening(false);
      if (onError) onError(event.error || "unknown error");
    };
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    return () => {
      try { rec.stop(); } catch (e) { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported, lang]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (e) {
      // start() called twice — ignore
    }
  }, []);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (e) { /* ignore */ }
    setListening(false);
  }, []);

  return { supported: !!supported, listening, start, stop };
}
