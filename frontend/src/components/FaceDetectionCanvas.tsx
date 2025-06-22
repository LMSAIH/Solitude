import React, { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";

interface FaceExpressionDetectorProps {
    playing: boolean;
    onExpressionChange?: (expression: string) => void;
}

const FaceExpressionDetector: React.FC<FaceExpressionDetectorProps> = ({ 
    playing, 
    onExpressionChange 
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const intervalIdRef = useRef<number | null>(null);

    useEffect(() => {
        const loadModels = async () => {
            await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
            await faceapi.nets.faceExpressionNet.loadFromUri("/models");
        };

        loadModels();
        
    }, []);

    useEffect(() => {
        const startVideo = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error("Error accessing webcam:", error);
            }
        };

        if (playing) {
            startVideo();
        } else {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };
    }, [playing]);

    useEffect(() => {
        const detectExpressions = async () => {
            if (!videoRef.current || !canvasRef.current) return;

            const displaySize = {
                width: videoRef.current.videoWidth,
                height: videoRef.current.videoHeight,
            };

            faceapi.matchDimensions(canvasRef.current, displaySize);

            intervalIdRef.current = window.setInterval(async () => {
                if (!videoRef.current) return;

                const detections = await faceapi
                    .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                    .withFaceExpressions();

                const ctx = canvasRef.current!.getContext("2d");
                ctx?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);

                if (detections) {
                    const expressions = detections.expressions;
                    const maxExpression = Object.keys(expressions).reduce((a, b) =>
                        expressions[a as keyof typeof expressions] > expressions[b as keyof typeof expressions] ? a : b
                    );
                    onExpressionChange?.(maxExpression);

                    const resizedDetections = faceapi.resizeResults(detections, displaySize);
                    faceapi.draw.drawDetections(canvasRef.current!, resizedDetections);
                } else {
                    onExpressionChange?.("No face detected");
                }
            }, 100);
        };

        if (playing) {
            videoRef.current?.addEventListener("playing", detectExpressions);
        }

        return () => {
            videoRef.current?.removeEventListener("playing", detectExpressions);
            if (intervalIdRef.current !== null) {
                clearInterval(intervalIdRef.current);
                intervalIdRef.current = null;
            }
        };
    }, [playing, onExpressionChange]);

    return (
        <div className="relative w-fit m-auto">
            <video ref={videoRef} autoPlay muted />
            <canvas ref={canvasRef} className="absolute top-0 right-0 w-full" />
        </div>
    );
};

export default FaceExpressionDetector;