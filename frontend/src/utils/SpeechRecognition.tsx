import { useEffect, useRef } from 'react';

// Extend the Window interface to include SpeechRecognition
declare global {
    interface Window {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }
}

interface SpeechRecognitionProps {
    isActive: boolean;
    setCurrentTranscription: (transcription: string) => void;
}


interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

interface ISpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    onstart: (() => void) | null;
    start(): void;
    stop(): void;
}

interface SpeechRecognitionConstructor {
    new(): ISpeechRecognition;
}

const SpeechRecognitionComponent: React.FC<SpeechRecognitionProps> = ({
    isActive,
    setCurrentTranscription
}) => {
    const recognitionRef = useRef<ISpeechRecognition | null>(null);
    const isListeningRef = useRef<boolean>(false);

    useEffect(() => {
        // Check if browser supports speech recognition
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('Speech recognition not supported in this browser');
            setCurrentTranscription('Speech recognition not supported in this browser');
            return;
        }

        const SpeechRecognitionAPI = (window.SpeechRecognition || window.webkitSpeechRecognition) as SpeechRecognitionConstructor;
        const recognition = new SpeechRecognitionAPI();


        // Configure recognition settings
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        // Handle speech recognition results
        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            // Send the most recent transcript (interim or final)
            const currentTranscript = finalTranscript || interimTranscript;
            if (currentTranscript.trim()) {
                setCurrentTranscription(currentTranscript.trim());
            }
        };

        // Handle recognition errors
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                setCurrentTranscription('Microphone access denied');
            } else if (event.error === 'no-speech') {
                // Restart recognition if no speech detected
                if (isActive && isListeningRef.current) {
                    try {
                        recognition.start();
                    } catch (error) {
                        console.log('Recognition restart failed:', error);
                    }
                }
            }
        };

        // Handle recognition end
        recognition.onend = () => {
            isListeningRef.current = false;
            // Restart recognition if still active
            if (isActive) {
                try {
                    recognition.start();
                    isListeningRef.current = true;
                } catch (error) {
                    console.log('Recognition restart on end failed:', error);
                }
            }
        };

        // Handle recognition start
        recognition.onstart = () => {
            isListeningRef.current = true;
            console.log('Speech recognition started');
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current && isListeningRef.current) {
                recognitionRef.current.stop();
                isListeningRef.current = false;
            }
        };
    }, [isActive, setCurrentTranscription]);

    useEffect(() => {
        if (!recognitionRef.current) return;

        if (isActive && !isListeningRef.current) {
            // Start recognition
            try {
                recognitionRef.current.start();
                isListeningRef.current = true;
                setCurrentTranscription('');
            } catch (error) {
                console.error('Failed to start speech recognition:', error);
                setCurrentTranscription('Failed to start listening');
            }
        } else if (!isActive && isListeningRef.current) {
            // Stop recognition
            try {
                recognitionRef.current.stop();
                isListeningRef.current = false;
                setCurrentTranscription('');
            } catch (error) {
                console.error('Failed to stop speech recognition:', error);
            }
        }
    }, [isActive, setCurrentTranscription]);

    // This component doesn't render anything
    return null;
};

export default SpeechRecognitionComponent;