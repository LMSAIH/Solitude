import React, { useEffect } from 'react';

interface TextToSpeechComponentProps {
  stream: EventSource;
}

const TextToSpeechComponent: React.FC<TextToSpeechComponentProps> = ({ stream }) => {
  useEffect(() => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance();

    const handleStreamData = (event: MessageEvent) => {
      const text = event.data;
      utterance.text = text;
      synth.speak(utterance);
    };

    const handleStreamEnd = () => {
      synth.cancel();
    };

    stream.addEventListener('message', handleStreamData);
    stream.addEventListener('end', handleStreamEnd);

    return () => {
      stream.removeEventListener('message', handleStreamData);
      stream.removeEventListener('end', handleStreamEnd);
    };
  }, [stream]);

  return null;
};

export default TextToSpeechComponent;
