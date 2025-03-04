import { useEffect, useState } from "react";

function useTextToSpeech(stream: string) {
  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);

  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      console.warn("Speech synthesis is not supported in this browser.");
      return;
    }

    console.log("Updated stream:", stream);

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(stream);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);

  }, [stream]);

  return { assistantIsSpeaking };
}

export default useTextToSpeech;

