'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { ChevronLeft, ChevronRight, Camera, Video, Check } from 'lucide-react';
import { useWalkthroughStore } from '@/stores/walkthroughStore';
import { useEvidenceStore, VerificationCategory } from '@/stores/evidenceStore';
import { useChecklistStore } from '@/stores/checklistStore';
import { CorrelationModal } from './CorrelationModal';
import walkthroughData from '@/data/walkthrough_step10.json';

type ShotMode = 'idle' | 'photo' | 'video';

export function WalkthroughMode() {
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [shotMode, setShotMode] = useState<ShotMode>('idle');
  const [showModal, setShowModal] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentShotIndex, setCurrentShotIndex] = useState(0);

  const currentPointIndex = useWalkthroughStore((state) => state.currentPointIndex);
  const setCurrentPointIndex = useWalkthroughStore((state) => state.setCurrentPointIndex);
  const setPoints = useWalkthroughStore((state) => state.setPoints);
  const markShotCaptured = useWalkthroughStore((state) => state.markShotCaptured);
  const markPointComplete = useWalkthroughStore((state) => state.markPointComplete);
  const points = useWalkthroughStore((state) => state.points);

  const addEvidence = useEvidenceStore((state) => state.addEvidence);
  const incrementEvidence = useChecklistStore((state) => state.incrementEvidence);

  // Initialize walkthrough data
  useEffect(() => {
    if (points.length === 0 && walkthroughData.points) {
      setPoints(walkthroughData.points as any);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentPoint = points[currentPointIndex];
  const currentShot = currentPoint?.requiredShots[currentShotIndex];

  const handlePhotoCapture = useCallback(async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        const response = await fetch(imageSrc);
        const blob = await response.blob();
        setCapturedBlob(blob);
        setShotMode('idle');
        setShowModal(true);
      }
    }
  }, []);

  const handleVideoStart = useCallback(async () => {
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
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    }
  }, []);

  const handleVideoStop = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setShotMode('idle');
    }
  }, [isRecording]);

  const handleMetadataSubmit = (data: {
    drawingSheetId: string;
    drawingSheetName: string;
    detailReference: string;
    category: VerificationCategory;
    linkedChecklistItem?: string;
  }) => {
    if (capturedBlob && currentShot) {
      const fileUrl = URL.createObjectURL(capturedBlob);
      const evidenceId = `ev_${Date.now()}`;

      addEvidence({
        id: evidenceId,
        fileUrl,
        type: shotMode === 'photo' ? 'photo' : 'video',
        drawingSheet: data.drawingSheetName,
        detailReference: data.detailReference,
        category: data.category || currentShot.prefillCategory,
        linkedChecklistItem: currentShot.checklistItem || data.linkedChecklistItem,
        timestamp: new Date().toISOString(),
      });

      // Mark shot as captured
      markShotCaptured(currentPointIndex, currentShotIndex);
      incrementEvidence(currentShot.checklistItem);

      setCapturedBlob(null);
      setShowModal(false);

      // Move to next shot
      if (currentShotIndex < currentPoint.requiredShots.length - 1) {
        setCurrentShotIndex(currentShotIndex + 1);
      }
    }
  };

  const allShotsCaptured = currentPoint?.requiredShots.every((s) => s.captured);

  const handleCompletePoint = () => {
    if (allShotsCaptured) {
      markPointComplete(currentPointIndex);
      if (currentPointIndex < points.length - 1) {
        setCurrentPointIndex(currentPointIndex + 1);
        setCurrentShotIndex(0);
      }
    }
  };

  const progress = points.filter((p) => p.completed).length;

  if (!currentPoint) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
        <h3 className="font-bold text-green-900">Walkthrough Complete!</h3>
        <p className="text-sm text-green-800 mt-2">All 29 points have been documented.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold uppercase text-blue-900">
            Point {currentPointIndex + 1} of {points.length}
          </span>
          <span className="text-xs font-bold text-blue-900">{progress} completed</span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(progress / points.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Point Details */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 space-y-2">
        <h3 className="font-bold text-sm">{currentPoint.id} – {currentPoint.title}</h3>
        <p className="text-xs text-gray-700">{currentPoint.instructions}</p>
      </div>

      {/* Current Shot */}
      {currentShot && (
        <div className="bg-white border border-gray-300 rounded-lg p-4 space-y-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              Shot {currentShotIndex + 1} of {currentPoint.requiredShots.length}
            </p>
            <p className="text-sm font-semibold">{currentShot.description}</p>
            <p className="text-xs text-gray-600 mt-1">
              Category: <span className="font-mono">{currentShot.prefillCategory}</span> | Drawing:{' '}
              <span className="font-mono">{currentShot.prefillDrawingSheet}</span>
            </p>
          </div>

          {/* Camera Preview or Capture Buttons */}
          {shotMode === 'idle' && (
            <div className="space-y-2">
              {currentShot.type === 'photo' && (
                <button
                  onClick={() => setShotMode('photo')}
                  className="w-full px-4 py-3 bg-black text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-900"
                >
                  <Camera className="h-5 w-5" />
                  Take Photo
                </button>
              )}
              {currentShot.type === 'video_360' && (
                <button
                  onClick={() => setShotMode('video')}
                  className="w-full px-4 py-3 bg-black text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-900"
                >
                  <Video className="h-5 w-5" />
                  Record 360° Video ({currentShot.duration || 30}s)
                </button>
              )}
            </div>
          )}

          {(shotMode === 'photo' || shotMode === 'video') && (
            <>
              <div className="bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                <Webcam
                  ref={webcamRef}
                  audio={shotMode === 'video'}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShotMode('idle');
                    if (isRecording) handleVideoStop();
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                {shotMode === 'photo' && (
                  <button
                    onClick={handlePhotoCapture}
                    className="flex-1 px-3 py-2 bg-black text-white rounded text-sm font-semibold hover:bg-gray-900"
                  >
                    Capture
                  </button>
                )}
                {shotMode === 'video' && (
                  <button
                    onClick={isRecording ? handleVideoStop : handleVideoStart}
                    className={`flex-1 px-3 py-2 text-white rounded text-sm font-semibold ${
                      isRecording ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {isRecording ? 'Stop' : 'Record'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Navigation & Complete */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            if (currentPointIndex > 0) {
              setCurrentPointIndex(currentPointIndex - 1);
              setCurrentShotIndex(0);
            }
          }}
          disabled={currentPointIndex === 0}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-5 w-5" />
          Previous
        </button>

        <button
          onClick={handleCompletePoint}
          disabled={!allShotsCaptured}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${
            allShotsCaptured
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Check className="h-5 w-5" />
          Complete Point
        </button>

        <button
          onClick={() => {
            if (currentPointIndex < points.length - 1) {
              setCurrentPointIndex(currentPointIndex + 1);
              setCurrentShotIndex(0);
            }
          }}
          disabled={currentPointIndex === points.length - 1}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <CorrelationModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setCapturedBlob(null);
          setShotMode('idle');
        }}
        onSubmit={handleMetadataSubmit}
      />
    </div>
  );
}
