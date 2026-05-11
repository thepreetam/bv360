'use client';

import { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Video } from 'lucide-react';
import { CorrelationModal } from './CorrelationModal';
import { useEvidenceStore, VerificationCategory } from '@/stores/evidenceStore';
import { useChecklistStore } from '@/stores/checklistStore';

type CaptureMode = 'idle' | 'photo' | 'video';

export function QuickCapture() {
  const webcamRef = useRef<Webcam>(null);
  const [mode, setMode] = useState<CaptureMode>('idle');
  const [showModal, setShowModal] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const addEvidence = useEvidenceStore((state) => state.addEvidence);
  const incrementEvidence = useChecklistStore((state) => state.incrementEvidence);

  const handlePhotoCapture = useCallback(async () => {
    try {
      setError(null);
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          // Convert data URL to blob
          const response = await fetch(imageSrc);
          const blob = await response.blob();
          setCapturedBlob(blob);
          setMode('idle');
          setShowModal(true);
          console.log('[v0] Photo captured successfully');
        } else {
          setError('Failed to capture photo. Please try again.');
        }
      } else {
        setError('Camera not ready. Please allow camera permissions.');
      }
    } catch (err) {
      console.error('[v0] Photo capture error:', err);
      setError('Error capturing photo. Please check camera permissions.');
    }
  }, []);

  const handleVideoStart = useCallback(async () => {
    try {
      setError(null);
      if (webcamRef.current && webcamRef.current.video) {
        recordedChunksRef.current = [];
        const stream = webcamRef.current.video.srcObject as MediaStream;
        const mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
          recordedChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          setCapturedBlob(blob);
          setShowModal(true);
          console.log('[v0] Video recorded successfully');
        };

        mediaRecorder.onerror = (event) => {
          console.error('[v0] Recording error:', event.error);
          setError('Error during video recording.');
          setIsRecording(false);
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
      } else {
        setError('Camera not ready. Please allow camera permissions.');
      }
    } catch (err) {
      console.error('[v0] Video start error:', err);
      setError('Error starting video recording. Please check camera permissions.');
    }
  }, []);

  const handleVideoStop = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setMode('idle');
    }
  }, [isRecording]);

  const handleMetadataSubmit = (data: {
    drawingSheetId: string;
    drawingSheetName: string;
    detailReference: string;
    category: VerificationCategory;
    linkedChecklistItem?: string;
  }) => {
    console.log('[v0] Metadata submitted:', data);
    console.log('[v0] Captured blob:', capturedBlob);
    
    if (capturedBlob) {
      const fileUrl = URL.createObjectURL(capturedBlob);
      const evidenceId = `ev_${Date.now()}`;

      console.log('[v0] Creating evidence with ID:', evidenceId);
      console.log('[v0] File URL:', fileUrl);

      addEvidence({
        id: evidenceId,
        fileUrl,
        type: mode === 'photo' ? 'photo' : 'video',
        drawingSheet: data.drawingSheetName,
        detailReference: data.detailReference,
        category: data.category,
        linkedChecklistItem: data.linkedChecklistItem,
        timestamp: new Date().toISOString(),
      });

      console.log('[v0] Evidence added to store');

      // Increment evidence count for linked item
      if (data.linkedChecklistItem) {
        console.log('[v0] Incrementing evidence count for item:', data.linkedChecklistItem);
        incrementEvidence(data.linkedChecklistItem);
      }

      setCapturedBlob(null);
      setShowModal(false);
      setMode('idle');
      console.log('[v0] Reset state - ready for next capture');
    } else {
      console.log('[v0] ERROR: No captured blob available');
      setError('No image/video data available. Please try capturing again.');
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-semibold">Error</p>
          <p className="text-xs text-red-700 mt-1">{error}</p>
        </div>
      )}

      {mode === 'idle' && (
        <>
          <div className="space-y-3">
            <button
              onClick={() => setMode('photo')}
              className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg hover:border-black hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
            >
              <Camera className="h-6 w-6" />
              <span className="font-semibold">Take Photo</span>
            </button>

            <button
              onClick={() => setMode('video')}
              className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg hover:border-black hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
            >
              <Video className="h-6 w-6" />
              <span className="font-semibold">Record Video</span>
            </button>

            <button
              onClick={() => {
                // Create a test image for demo purposes
                const canvas = document.createElement('canvas');
                canvas.width = 640;
                canvas.height = 480;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.fillStyle = '#e5e7eb';
                  ctx.fillRect(0, 0, 640, 480);
                  ctx.fillStyle = '#1f2937';
                  ctx.font = 'bold 24px sans-serif';
                  ctx.textAlign = 'center';
                  ctx.fillText('Test Photo', 320, 240);
                }
                canvas.toBlob((blob) => {
                  if (blob) {
                    setCapturedBlob(blob);
                    setShowModal(true);
                    console.log('[v0] Test image created');
                  }
                });
              }}
              className="w-full px-4 py-4 border-2 border-amber-300 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-colors flex items-center justify-center gap-3 text-amber-900"
            >
              <span className="font-semibold">📷 Use Test Image (Demo)</span>
            </button>
          </div>
        </>
      )}

      {(mode === 'photo' || mode === 'video') && (
        <div className="space-y-4">
          <div className="bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
            <Webcam
              ref={webcamRef}
              audio={mode === 'video'}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex gap-2">
            {mode === 'photo' && (
              <>
                <button
                  onClick={() => {
                    setMode('idle');
                    setError(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePhotoCapture}
                  className="flex-1 px-4 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900"
                >
                  Capture Photo
                </button>
              </>
            )}

            {mode === 'video' && (
              <>
                <button
                  onClick={() => {
                    setMode('idle');
                    setError(null);
                    if (isRecording) {
                      handleVideoStop();
                    }
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>

                {!isRecording ? (
                  <button
                    onClick={handleVideoStart}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                  >
                    Start Recording
                  </button>
                ) : (
                  <button
                    onClick={handleVideoStop}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 animate-pulse"
                  >
                    Stop Recording
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <CorrelationModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setCapturedBlob(null);
          setMode('idle');
          setError(null);
        }}
        onSubmit={handleMetadataSubmit}
      />
    </div>
  );
}
