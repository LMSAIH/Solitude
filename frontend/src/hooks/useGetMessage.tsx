import { useState, useRef, useEffect } from 'react';

export const useGetMessage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stream, setStream] = useState<string>('');
    const eventSourceRef = useRef<EventSource | null>(null);

    const getMessage = async (emotion: string, personality: string, message: string, conversation_id: string) => {

        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        setLoading(true);
        setError(null);
        setStream('');

        const url = `http://localhost:8000/v1/get_response?emotion=${encodeURIComponent(
            emotion
        )}&personality=${encodeURIComponent(personality)}&message=${encodeURIComponent(message)}&conversation_id=${encodeURIComponent(conversation_id)}`;

        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.onmessage = (event) => {
            setStream((prev) => prev + event.data);
        };

        es.onerror = (event) => {

            if (es.readyState === 0) {
                es.close()
                setLoading(false);
            } else {
                setError('Connection error. Attempting to reconnect...');
            }
        };

        es.onopen = () => {
            setLoading(false);
            setError(null);
        };


    };

    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    return { loading, error, stream, getMessage };
};