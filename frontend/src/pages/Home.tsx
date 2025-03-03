import { useState, useEffect, useRef } from 'react';
import { useExpression } from '../context/ExpressionContext';
import FaceExpressionDetector from '../components/FaceDetectionCanvas';
import { useGetMessage } from '../hooks/useGetMessage';
import { v4 as uuidv4 } from 'uuid';


export default function Home() {
  const [cameraActive, setCameraActive] = useState(false);
  const { expression } = useExpression();
  const { getMessage, error, loading, stream } = useGetMessage();
  const [assistantMessages, setAssistantMessages] = useState<string[]>([]);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const id = uuidv4();

  useEffect(() => {

    getMessage(expression, "cheerful", transcribedText, id);
    
    if (!loading) {
      speakText(stream);
      setAssistantMessages((prev) => [...prev, stream]);
    }


  }, [transcribedText]);

  const expressions = ['neutral', 'happy', 'angry', 'sad', 'fearful', 'disgusted', 'surprised'];

  const recognitionRef = useRef<any | null>(null);
  const silenceTimerRef = useRef<any | null>(null);

  const toggleCamera = () => {
    setCameraActive((prev) => !prev);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1;
      utterance.pitch = 1;
      synth.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported in this browser.');
    }
  };

  useEffect(() => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      console.warn('Speech Recognition API is not supported in this browser.');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTranscribedText(transcript);

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        getMessage(expression, 'cheerful', transcript, id);
      }, 2000);
    };

    recognition.onend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };

    recognitionRef.current = recognition;
  }, [expression, getMessage]);

  const startListening = () => {
    recognitionRef.current?.start();
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-indigo-50 flex flex-col items-center justify-center p-4">
      <div className="w-full">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">AI Video Chat</h1>

        <div className="flex flex-row gap-10 w-full">
          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg w-1/2">
            <div className="bg-gradient-to-r from-violet-100 to-cyan-100 p-3 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-800">Your Camera</h2>
              <button
                onClick={toggleCamera}
                className="px-3 py-1 rounded-full bg-white/70 text-sm font-medium hover:bg-white/90 transition-colors hover:cursor-pointer"
              >
                {cameraActive ? 'Turn Off' : 'Turn On'}
              </button>
            </div>
            <div className={`${cameraActive ? 'block' : 'hidden'} aspect-video bg-gray-100 relative flex justify-center w-full`}>
              {<FaceExpressionDetector playing={cameraActive} />}
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg w-1/2">
            <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-3 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-800">AI Assistant</h2>
              <button
                onClick={startListening}
                className="px-3 py-1 rounded-full bg-white/70 text-sm font-medium hover:bg-white/90 transition-colors hover:cursor-pointer"
              >
                🎙️ Start Listening
              </button>
            </div>
            <div className="aspect-video bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-violet-400 to-indigo-400 flex items-center justify-center">
                <span className="text-5xl">🤖</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p>Current expression: {expression}</p>
          <p>Transcribed Text: {transcribedText}</p>
          <p>User messages:</p>
          {assistantMessages.map((message, index) => (
            <p key={index}>{message}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
