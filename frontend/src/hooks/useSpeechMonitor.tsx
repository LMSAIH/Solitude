import { useState, useEffect, useRef } from "react";

function useSpeechMonitor(transcribedText:string) {
  const [speaking, setSpeaking] = useState(false);
  const previousLength = useRef(0);

  useEffect(() => {

    const checkTextChange = () => {

        if(transcribedText.length === previousLength.current) {
            setSpeaking(false);
        } else {
            setSpeaking(true);
        }

        previousLength.current = transcribedText.length;

    };

    let timeout = setTimeout(checkTextChange, 2000);

  }, [transcribedText]);

  return { speaking };
}

export { useSpeechMonitor };