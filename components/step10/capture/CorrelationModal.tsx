'use client';

import { useState, useEffect } from 'react';
import { VerificationCategory } from '@/stores/evidenceStore';
import { useChecklistStore } from '@/stores/checklistStore';

interface DrawingSheet {
  id: string;
  sheet_name: string;
}

interface CorrelationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    drawingSheetId: string;
    drawingSheetName: string;
    detailReference: string;
    category: VerificationCategory;
    linkedChecklistItem?: string;
  }) => void;
}

const CATEGORIES: { value: VerificationCategory; label: string; description: string }[] = [
  { value: 'Dimensional', label: 'Dimensional', description: 'Measurements, tolerances, dimensions' },
  { value: 'Location', label: 'Location', description: 'Placement, alignment, positioning' },
  { value: 'Material', label: 'Material', description: 'Material type, grade, condition' },
  { value: 'Connection', label: 'Connection', description: 'Joints, fasteners, hardware' },
  { value: 'Deficiency', label: 'Deficiency', description: 'Defects, damage, non-compliance' },
  { value: 'As-Built', label: 'As-Built', description: 'Comparison to design documents' },
];

export function CorrelationModal({
  isOpen,
  onClose,
  onSubmit,
}: CorrelationModalProps) {
  const [drawingSheets, setDrawingSheets] = useState<DrawingSheet[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState('');
  const [detailReference, setDetailReference] = useState('');
  const [category, setCategory] = useState<VerificationCategory>('Dimensional');
  const [linkedChecklistItem, setLinkedChecklistItem] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [loadingSheets, setLoadingSheets] = useState(false);

  const items = useChecklistStore((state) => state.items);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingSheets(true);

    const projectId = window.location.pathname.split('/')[2] || 'demo';

    fetch(`/api/drawing-sheets/${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDrawingSheets(data);
        }
      })
      .catch(() => {
        setDrawingSheets([]);
      })
      .finally(() => setLoadingSheets(false));
  }, [isOpen]);

  const handleSubmit = () => {
    const newErrors: string[] = [];

    if (!selectedSheetId) newErrors.push('Drawing Sheet is required');
    if (!detailReference.trim()) newErrors.push('Detail Reference is required');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedSheet = drawingSheets.find((s) => s.id === selectedSheetId);
    onSubmit({
      drawingSheetId: selectedSheetId,
      drawingSheetName: selectedSheet?.sheet_name || selectedSheetId,
      detailReference: detailReference.trim(),
      category,
      linkedChecklistItem: linkedChecklistItem || undefined,
    });

    setSelectedSheetId('');
    setDetailReference('');
    setCategory('Dimensional');
    setLinkedChecklistItem('');
    setErrors([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50">
      <div className="w-full bg-white rounded-t-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold">Correlate Evidence</h3>
        <p className="text-xs text-gray-500">
          Attach this evidence to a drawing sheet and category before uploading
        </p>

        {errors.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <ul className="text-xs text-red-700 space-y-1">
              {errors.map((error, idx) => (
                <li key={idx}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
            Drawing Sheet <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedSheetId}
            onChange={(e) => setSelectedSheetId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">
              {loadingSheets ? 'Loading...' : 'Select a drawing sheet...'}
            </option>
            {drawingSheets.map((sheet) => (
              <option key={sheet.id} value={sheet.id}>
                {sheet.sheet_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
            Detail Reference <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={detailReference}
            onChange={(e) => setDetailReference(e.target.value)}
            placeholder="e.g., Grid B-3, Detail 4A"
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <p className="text-[10px] text-gray-400 mt-1">Grid reference or detail number from the drawing</p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
            Verification Category <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`p-2.5 rounded-lg border-2 text-xs font-semibold transition-colors text-left ${
                  category === cat.value
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 bg-white hover:border-gray-400'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            {CATEGORIES.find((c) => c.value === category)?.description}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
            Link to Checklist Item (Optional)
          </label>
          <select
            value={linkedChecklistItem}
            onChange={(e) => setLinkedChecklistItem(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">Not linked</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedSheetId || !detailReference.trim()}
            className="flex-1 px-4 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
}