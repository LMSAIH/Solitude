export const getMessage = async (setLoading: React.Dispatch<React.SetStateAction<boolean>>, eventSourceRef: React.RefObject<EventSource | null>, setError: React.Dispatch<React.SetStateAction<string | null>>, setStream: React.Dispatch<React.SetStateAction<string>>, emotion: string, personality: string, message: string, conversation_id: string) => {
    if (eventSourceRef.current) {
        eventSourceRef.current.close();
    }

    setError(null);
    setStream('');

    const url = `http://localhost:8000/v1/get_response?emotion=${encodeURIComponent(
        emotion
    )}&personality=${encodeURIComponent(personality)}&message=${encodeURIComponent(message)}&conversation_id=${encodeURIComponent(conversation_id)}`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
        setLoading(true);
        setError(null);
    };

    es.onmessage = (event) => {
        setStream((prev) => prev + event.data);
    };

    es.onerror = (event) => {
        if (es.readyState === 0) {
            es.close();
            setLoading(false);
        } else {
            setError('Connection error. Attempting to reconnect...');
        }
    };

    es.addEventListener('end', () => {
        setLoading(false);
        es.close();
    });
};

// Cleanup function to close EventSource on unmount
export const cleanup = (eventSourceRef: React.RefObject<EventSource | null>) => {
    if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
    }
};