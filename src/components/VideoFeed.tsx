import { useEffect, useRef, useState } from 'react';

interface VideoFeedProps {
  onVideoReady: (video: HTMLVideoElement) => void;
}

export function VideoFeed({ onVideoReady }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            onVideoReady(videoRef.current!);
          };
        }
      } catch (err) {
        setError('Camera access denied. Please allow camera permissions.');
        console.error('Camera error:', err);
      }
    }

    setupCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onVideoReady]);

  return (
    <>
      {error && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          background: 'rgba(255, 0, 0, 0.8)',
          padding: '20px',
          borderRadius: '10px',
          zIndex: 9999
        }}>
          {error}
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
          zIndex: 0
        }}
      />
    </>
  );
}
