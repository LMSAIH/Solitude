import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

const FaceExpressionDetector: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [expression, setExpression] = useState<string>("Detecting...");

    useEffect(() => {
        const loadModels = async () => {
            await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
            await faceapi.nets.faceExpressionNet.loadFromUri("/models");
            startVideo();
        };

        const startVideo = async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
            if (videoRef.current) videoRef.current.srcObject = stream;
        };

        loadModels();
    }, []);

    useEffect(() => {
        const detectExpressions = async () => {
            if (!videoRef.current || !canvasRef.current) return;

            const displaySize = {
                width: videoRef.current.videoWidth,
                height: videoRef.current.videoHeight,
            };

            faceapi.matchDimensions(canvasRef.current, displaySize);

            setInterval(async () => {

                const detections = await faceapi.detectSingleFace(videoRef.current!, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
                const ctx = canvasRef.current!.getContext("2d");
                ctx?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
                if (detections) {
                    const expressions = detections.expressions;
                    const maxExpression = Object.keys(expressions).reduce((a, b) => (expressions[a as keyof typeof expressions] > expressions[b as keyof typeof expressions] ? a : b));
                    setExpression(maxExpression);
                    const resizedDetections = faceapi.resizeResults(detections, displaySize);
                    faceapi.draw.drawDetections(canvasRef.current!, resizedDetections);
                } else {
                    setExpression("No face detected");
                }
            }, 100);
        };

        videoRef.current?.addEventListener("playing", detectExpressions);
        return () => videoRef.current?.removeEventListener("playing", detectExpressions);
    }, []);

    return (
        <div className="relative w-fit">
            <video ref={videoRef} autoPlay muted />
            <canvas ref={canvasRef} className="absolute top-0 right-0 w-full" />
            <p className="mt-4 text-xl font-bold">Expression: {expression}</p>
        </div>
    );
};

export default FaceExpressionDetector;