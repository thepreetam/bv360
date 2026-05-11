'use client';

import { useState } from 'react';
import { X, Trash2, Eye, EyeOff } from 'lucide-react';
import { Evidence } from '@/stores/evidenceStore';
import { useEvidenceStore } from '@/stores/evidenceStore';

interface GalleryLightboxProps {
  evidence: Evidence | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function GalleryLightbox({ evidence, isOpen, onClose, onDelete }: GalleryLightboxProps) {
  const [showBoundingBox, setShowBoundingBox] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !evidence) return null;

  const handleDelete = () => {
    onDelete(evidence.id);
    onClose();
    setShowDeleteConfirm(false);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
        aria-label="Close"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {/* Media Viewer */}
      <div className="flex-1 flex items-center justify-center p-4">
        {evidence.type === 'photo' ? (
          <img
            src={evidence.fileUrl}
            alt="Evidence"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            src={evidence.fileUrl}
            controls
            className="max-w-full max-h-full object-contain"
          />
        )}

        {/* Bounding Box Toggle (if available) */}
        {evidence.aiResults && evidence.aiResults.length > 0 && (
          <button
            onClick={() => setShowBoundingBox(!showBoundingBox)}
            className="absolute top-4 left-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
            aria-label="Toggle AI bounding box"
          >
            {showBoundingBox ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {/* Metadata Panel */}
      <div className="bg-black/50 backdrop-blur border-t border-white/10 p-4 space-y-4 max-h-64 overflow-y-auto">
        {/* Evidence Details */}
        <div className="space-y-2">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">Metadata</h3>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white/5 p-2 rounded">
              <p className="text-white/70">Type</p>
              <p className="text-white font-semibold">{evidence.type === 'photo' ? 'Photo' : 'Video'}</p>
            </div>
            <div className="bg-white/5 p-2 rounded">
              <p className="text-white/70">Category</p>
              <p className="text-white font-semibold">{evidence.category}</p>
            </div>
            <div className="bg-white/5 p-2 rounded col-span-2">
              <p className="text-white/70">Drawing Sheet</p>
              <p className="text-white font-mono text-xs">{evidence.drawingSheet}</p>
            </div>
            <div className="bg-white/5 p-2 rounded col-span-2">
              <p className="text-white/70">Detail Reference</p>
              <p className="text-white font-mono text-xs">{evidence.detailReference}</p>
            </div>
            {evidence.linkedChecklistItem && (
              <div className="bg-white/5 p-2 rounded col-span-2">
                <p className="text-white/70">Linked Checklist Item</p>
                <p className="text-white font-semibold">{evidence.linkedChecklistItem}</p>
              </div>
            )}
            <div className="bg-white/5 p-2 rounded col-span-2">
              <p className="text-white/70">Captured</p>
              <p className="text-white font-mono text-xs">{formatDate(evidence.timestamp)}</p>
            </div>
          </div>
        </div>

        {/* AI Results */}
        {evidence.aiResults && evidence.aiResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">AI Analysis</h3>
            <div className="space-y-2">
              {evidence.aiResults.map((result) => (
                <div
                  key={result.verificationId}
                  className={`p-2 rounded text-xs ${
                    result.status === 'PASS'
                      ? 'bg-green-500/20 border border-green-500/50'
                      : result.status === 'FAIL'
                      ? 'bg-red-500/20 border border-red-500/50'
                      : 'bg-amber-500/20 border border-amber-500/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-white font-semibold">{result.verificationId}</span>
                    <span className="text-white/70">{(result.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-white/80 mt-1">{result.description}</p>
                  {result.overridden && (
                    <p className="text-white/70 mt-1 italic">
                      Overridden: {result.overrideReason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-white/10">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="bg-red-600/20 border border-red-600/50 p-3 rounded space-y-2">
            <p className="text-white text-xs">Are you sure? This cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
