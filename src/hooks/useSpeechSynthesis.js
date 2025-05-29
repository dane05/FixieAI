const useSpeechSynthesis = () => {
  const speak = (text, lang = "en-US") => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  };

  return { speak };
};

export default useSpeechSynthesis;
