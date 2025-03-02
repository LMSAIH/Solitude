'use client'
import { useState, useEffect, useRef } from 'react'
import FaceExpressionDetector from '../components/FaceDetectionCanvas'

export default function Home() {
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const toggleCamera = async () => {
    if (cameraActive) {
      const stream = videoRef.current?.srcObject as MediaStream
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      videoRef.current!.srcObject = null
      setCameraActive(false)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setCameraActive(true)
      } catch (err) {
        console.error("Error accessing camera:", err)
      }
    }
  }

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-indigo-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">AI Video Chat</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Camera */}
          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg">
            <div className="bg-gradient-to-r from-violet-100 to-cyan-100 p-3 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-800">Your Camera</h2>
              <button 
                onClick={toggleCamera}
                className="px-3 py-1 rounded-full bg-white/70 text-sm font-medium hover:bg-white/90 transition-colors"
              >
                {cameraActive ? 'Turn Off' : 'Turn On'}
              </button>
            </div>
            <div className="aspect-video bg-gray-100 relative">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
              />
              {!cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <p>Camera is turned off</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg">
            <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-3">
              <h2 className="text-lg font-medium text-gray-800">AI Assistant</h2>
            </div>
            <div className="aspect-video bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-violet-400 to-indigo-400 flex items-center justify-center">
                <span className="text-5xl">🤖</span>
              </div>
            </div>
          </div>
          <FaceExpressionDetector />
        </div>
      </div>
    </div>
  )
}
