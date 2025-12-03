import { useState, useRef } from 'react';

interface VoiceNoteRecorderProps {
  onRecordingComplete: (audioUrl: string) => void;
  audioUrl?: string;
}

export function VoiceNoteRecorder({ onRecordingComplete, audioUrl }: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        onRecordingComplete(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `voice-note-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div style={{ marginTop: '15px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '15px' }}>
      {!audioUrl ? (
        <div>
          {!isRecording ? (
            <button
              onClick={startRecording}
              style={{
                padding: '10px 18px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                width: '100%',
                justifyContent: 'center'
              }}
            >
              🎤 Record Voice
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={stopRecording}
                style={{
                  padding: '10px 18px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(245, 87, 108, 0.3)',
                  width: '100%'
                }}
              >
                ⏹ Stop Recording
              </button>
              <span style={{ 
                color: '#f5576c', 
                fontWeight: '600',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: '#f5576c',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}></span>
                Recording...
              </span>
            </div>
          )}
        </div>
      ) : (
        <div>
          <audio 
            controls 
            src={audioUrl} 
            style={{ 
              width: '100%', 
              marginBottom: '10px',
              borderRadius: '8px',
              outline: 'none'
            }} 
          />
          <button
            onClick={handleDownload}
            className="download-link"
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(56, 239, 125, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            ⬇ Download Audio
          </button>
        </div>
      )}
    </div>
  );
}
