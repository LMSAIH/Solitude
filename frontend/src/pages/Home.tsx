import { useState, useRef, useEffect } from 'react';
import FaceExpressionDetector from '../components/FaceDetectionCanvas';
import SpeechRecognitionComponent from '../utils/SpeechRecognition';
import { getMessage, cleanup } from '../utils/MessageUtils';
import { client, speechifyPlayer } from '../utils/Speechify';


export default function Home() {
  const [cameraActive, setCameraActive] = useState(false);
  const [currentExpression, setCurrentExpression] = useState<string>("No expression detected");
  const [currentTranscription, setCurrentTranscription] = useState<string>('');
  const [stream, setStream] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [aiSpeaking, setAiSpeaking] = useState<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastSentMessage = useRef<string>('');

  const toggleCamera = () => {
    setCameraActive((prev) => !prev);
    cleanup(eventSourceRef);
  };

  const handleExpressionChange = (expression: string) => {
    setCurrentExpression(expression);
  };

  useEffect(() => {

    if (loading || !stream) {
      return;
    }

    const talk = async () => {

      setAiSpeaking(true);

      try {

        const response = await client.tts.audio.speech({
          input: stream,
          voiceId: 'carly',
    
        })

        console.log('Audio response generated:', response);

        await speechifyPlayer.playAudio(response);

        setTimeout(() => {
          setAiSpeaking(false);
        }, response.speechMarks.endTime + 200);

      } catch (error) {
        console.error('Error generating audio response:', error);
        setError('Failed to generate audio response');
      }

    }
    
    talk();

  }, [loading]);
  // Auto-send message when transcription is complete
  useEffect(() => {
    if (currentTranscription &&
      currentTranscription !== 'Listening...' &&
      currentTranscription !== 'Failed to start listening' &&
      currentTranscription !== lastSentMessage.current &&
      currentTranscription.trim().length > 3 && // Only send if meaningful content
      !loading && !aiSpeaking) {

      // Add a small delay to ensure the sentence is complete
      const timeoutId = setTimeout(() => {
        lastSentMessage.current = currentTranscription;
        getMessage(
          setLoading,
          eventSourceRef,
          setError,
          setStream,
          currentExpression,
          "friendly",
          currentTranscription,
          "auto-conversation-123"
        );
      }, 800); // 200ms delay to ensure sentence completion

      return () => clearTimeout(timeoutId);
    }
  }, [currentTranscription, currentExpression, loading]);

  const handleTestMessage = async () => {
    getMessage(setLoading, eventSourceRef, setError, setStream, currentExpression, "friendly", currentTranscription, "test-conversation-123");

    try {

      const response = await client.tts.audio.speech({
        input: stream,
        voiceId: 'carly',
      })

      console.log('Audio response generated:', response);

      await speechifyPlayer.playAudio(response);

    } catch (error) {
      console.error('Error generating audio response:', error);
      setError('Failed to generate audio response');
    }

  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">

      <SpeechRecognitionComponent
        isActive={cameraActive}
        setCurrentTranscription={setCurrentTranscription}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-slate-800 mb-2">Solitude</h1>
          <p className="text-slate-500 text-lg">AI-Powered Emotion Detection & Auto-Response</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Camera Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-700">Your Camera</h2>
              <button
                onClick={toggleCamera}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${cameraActive
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}
              >
                {cameraActive ? '● Stop Camera' : '▶ Start Camera'}
              </button>
            </div>
            <div className="p-6">
              <div className="w-full h-96 bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                {cameraActive ? (
                  <FaceExpressionDetector
                    playing={cameraActive}
                    onExpressionChange={handleExpressionChange}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-200 flex items-center justify-center">
                        <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-slate-500 text-lg">Click "Start Camera" to begin</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Analysis Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-medium text-slate-700">AI Analysis</h2>
            </div>
            <div className="p-6">
              <div className="w-full h-96 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl overflow-hidden border border-slate-200">
                <div className="p-4 h-full flex flex-col">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center shadow-lg">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <p className="text-slate-600 font-medium text-sm">Expression: {currentExpression}</p>
                    <p className="text-slate-600 font-medium text-sm mt-1">You said: "{currentTranscription}"</p>
                  </div>

                  {/* AI Response Area */}
                  <div className="flex-1 bg-white rounded-lg p-4 overflow-y-auto">
                    {loading && (
                      <div className="text-slate-500 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500 mr-2"></div>
                        AI is responding...
                      </div>
                    )}
                    {error && <p className="text-red-500">{error}</p>}
                    {stream && (
                      <div className="text-slate-700 text-sm whitespace-pre-wrap">
                        <strong>AI:</strong> {stream}
                      </div>
                    )}
                    {!loading && !error && !stream && (
                      <p className="text-slate-400 text-sm">Start speaking to get AI responses automatically...</p>
                    )}
                  </div>

                  {/* Manual Test Button */}
                  <button
                    onClick={handleTestMessage}
                    disabled={loading || !currentTranscription}
                    className="mt-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 text-sm"
                  >
                    {loading ? 'Processing...' : 'Send Manually'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-700 font-medium">Status</p>
              <p className="text-slate-500 text-sm">
                {cameraActive ?
                  `Active - Expression: ${currentExpression} | ${loading ? 'AI is responding...' : 'Ready to respond'}` :
                  'Camera and microphone are inactive'
                }
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${cameraActive
              ? loading
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-600'
              }`}>
              {cameraActive ? (loading ? 'Processing' : 'Active') : 'Inactive'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}