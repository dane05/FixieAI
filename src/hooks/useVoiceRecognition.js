import { useEffect, useRef } from "react";

const useVoiceRecognition = (onResult) => {
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      onResult(e.results[0][0].transcript, true);
    };

    recognition.onerror = (e) => {
      console.error("Voice recognition error:", e.error);
    };

    recognitionRef.current = recognition;
  }, [onResult]);

  const startListening = () => {
    recognitionRef.current?.start();
  };

  return { startListening };
};

export default useVoiceRecognition;
