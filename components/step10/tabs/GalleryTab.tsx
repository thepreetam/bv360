'use client';

import { useState, useMemo } from 'react';
import { Filter, Video } from 'lucide-react';
import { useEvidenceStore, Evidence } from '@/stores/evidenceStore';
import { GalleryLightbox } from '../gallery/GalleryLightbox';
import { FilterSheet } from '../gallery/FilterSheet';

export function GalleryTab() {
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const evidence = useEvidenceStore((state) => state.evidence);
  const filters = useEvidenceStore((state) => state.filters);
  const removeEvidence = useEvidenceStore((state) => state.removeEvidence);

  const filteredEvidence = useMemo(() => {
    return evidence.filter((item) => {
      if (filters.category && item.category !== filters.category) return false;
      if (filters.checklistItem && item.linkedChecklistItem !== filters.checklistItem) return false;
      if (filters.aiStatus) {
        if (filters.aiStatus === 'unanalyzed' && item.aiResults && item.aiResults.length > 0) return false;
        if (filters.aiStatus !== 'unanalyzed' && item.aiResults) {
          const hasStatus = item.aiResults.some((r) => r.status === filters.aiStatus!.toUpperCase());
          if (!hasStatus) return false;
        }
      }
      return true;
    });
  }, [evidence, filters]);

  const handleDelete = (id: string) => {
    removeEvidence(id);
  };

  const openLightbox = (item: Evidence) => {
    setSelectedEvidence(item);
    setShowLightbox(true);
  };

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Header with Filter Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Evidence Gallery</h2>
          <p className="text-xs text-gray-600 mt-1">
            {filteredEvidence.length} of {evidence.length} items
          </p>
        </div>
        <button
          onClick={() => setShowFilterSheet(true)}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span className="text-xs font-semibold">
            {Object.keys(filters).length > 0 ? `Filters (${Object.keys(filters).length})` : 'Filter'}
          </span>
        </button>
      </div>

      {/* Gallery Grid */}
      {filteredEvidence.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
          {evidence.length === 0 ? (
            <p className="text-gray-600">No evidence captured yet. Use the Capture tab to add photos or videos.</p>
          ) : (
            <p className="text-gray-600">No evidence matches the selected filters.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {filteredEvidence.map((item) => (
            <button
              key={item.id}
              onClick={() => openLightbox(item)}
              className="aspect-square bg-gray-200 rounded-lg border border-gray-300 overflow-hidden hover:ring-2 hover:ring-black transition-all group relative"
            >
              <img
                src={item.fileUrl}
                alt="Evidence"
                className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />

              {/* Overlay with metadata */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-end p-2">
                <div className="text-white text-left w-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1 mb-1">
                    {item.type === 'video' && <Video className="h-3 w-3" />}
                    <span className="text-xs font-semibold">{item.category}</span>
                  </div>
                  <p className="text-xs">{item.drawingSheet}</p>
                </div>
              </div>

              {/* Video badge */}
              {item.type === 'video' && (
                <div className="absolute top-1 right-1 bg-black/70 p-1 rounded">
                  <Video className="h-3 w-3 text-white" />
                </div>
              )}

              {/* AI Status badge */}
              {item.aiResults && item.aiResults.length > 0 && (
                <div className="absolute bottom-1 left-1">
                  {item.aiResults.some((r) => r.status === 'FAIL') && (
                    <span className="text-xs font-bold px-1.5 py-0.5 bg-red-500 text-white rounded">
                      FAIL
                    </span>
                  )}
                  {item.aiResults.some((r) => r.status === 'FLAG') && !item.aiResults.some((r) => r.status === 'FAIL') && (
                    <span className="text-xs font-bold px-1.5 py-0.5 bg-amber-500 text-white rounded">
                      FLAG
                    </span>
                  )}
                  {item.aiResults.every((r) => r.status === 'PASS') && (
                    <span className="text-xs font-bold px-1.5 py-0.5 bg-green-500 text-white rounded">
                      PASS
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <GalleryLightbox
        evidence={selectedEvidence}
        isOpen={showLightbox}
        onClose={() => setShowLightbox(false)}
        onDelete={handleDelete}
      />

      {/* Filter Sheet */}
      <FilterSheet isOpen={showFilterSheet} onClose={() => setShowFilterSheet(false)} />
    </div>
  );
}
