'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { FileText, Upload, Trash2, ChevronRight, CheckCircle, XCircle, Clock, Loader2, BookOpen, LayoutGrid } from 'lucide-react';
import type { Drawing, ParsedDrawingData } from '@/lib/db/types';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<any>(null);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadSheetName, setUploadSheetName] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);
  const [parsingId, setParsingId] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.status === 404 && id === 'demo') {
        const createRes = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Demo Project', address: '123 Main St, Anytown, USA' }),
        });
        if (createRes.ok) {
          const data = await createRes.json();
          setProject(data);
        }
      } else if (res.ok) {
        const data = await res.json();
        setProject(data);
      }
    } catch (err) {
      console.error('Failed to fetch project', err);
    }
  }, [id]);

  const fetchDrawings = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}/drawings`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setDrawings(data);
      }
    } catch (err) {
      console.error('Failed to fetch drawings', err);
    }
  }, [id]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([fetchProject(), fetchDrawings()]);
      setLoading(false);
    }
    load();
  }, [fetchProject, fetchDrawings]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!uploadSheetName.trim()) {
      setShowUpload(true);
      return;
    }

    await uploadFile(file);
    (e.target as HTMLInputElement).value = '';
    setUploadSheetName('');
    setShowUpload(false);
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sheet_name', uploadSheetName.trim() || file.name.replace(/\.(pdf|dwg)$/i, ''));

    const res = await fetch(`/api/projects/${id}/drawings`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const drawing = await res.json();
      setDrawings((prev) => [drawing, ...prev]);
    }
  };

  const handleParse = async (drawingId: string) => {
    setParsingId(drawingId);
    try {
      const res = await fetch(`/api/drawings/${drawingId}/parse`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setDrawings((prev) => prev.map((d) => (d.id === drawingId ? updated : d)));
        if (selectedDrawing?.id === drawingId) {
          setSelectedDrawing(updated);
        }
      }
    } finally {
      setParsingId(null);
    }
  };

  const handleDelete = async (drawingId: string) => {
    if (!confirm('Delete this drawing?')) return;
    const res = await fetch(`/api/drawings/${drawingId}`, { method: 'DELETE' });
    if (res.ok) {
      setDrawings((prev) => prev.filter((d) => d.id !== drawingId));
      if (selectedDrawing?.id === drawingId) setSelectedDrawing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-1 hover:bg-gray-100 rounded">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-base font-bold">{project?.name || 'Project'}</h1>
          <p className="text-xs text-gray-500">{project?.address || ''}</p>
        </div>
      </header>

      <div className="max-w-sm mx-auto px-4 py-6 space-y-6">
        {/* Project Info */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Project Details</h2>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            <div className="px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-600">Project ID</span>
              <span className="font-mono text-xs text-gray-400">{id.slice(0, 8)}...</span>
            </div>
            <div className="px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-600">Created</span>
              <span className="font-medium">
                {project?.created_at ? new Date(project.created_at).toLocaleDateString() : '—'}
              </span>
            </div>
            <div className="px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-600">Step 10 Status</span>
              <span className={`font-semibold px-2 py-0.5 rounded text-xs ${
                project?.step10?.status === 'passed' ? 'bg-green-100 text-green-700' :
                project?.step10?.status === 'failed' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {project?.step10?.status?.replace('_', ' ') || 'Not started'}
              </span>
            </div>
          </div>
        </section>

        {/* Drawings */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Architectural Drawings
            </h2>
            <span className="text-xs text-gray-400">{drawings.length} uploaded</span>
          </div>

          {drawings.length === 0 ? (
            <UploadDrawingCard
              projectId={id}
              onUpload={uploadFile}
            />
          ) : (
            <div className="space-y-3">
              {drawings.map((drawing) => (
                <DrawingCard
                  key={drawing.id}
                  drawing={drawing}
                  isParsing={parsingId === drawing.id}
                  onParse={() => handleParse(drawing.id)}
                  onDelete={() => handleDelete(drawing.id)}
                  onClick={() => setSelectedDrawing(drawing)}
                />
              ))}
              <UploadDrawingCard
                projectId={id}
                onUpload={uploadFile}
                compact
              />
            </div>
          )}
        </section>

        {/* Step 10 Link */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Inspection Steps</h2>
          <Link
            href={`/projects/${id}/steps/10`}
            className="block bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-black transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Step 10: Rough Framing</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {drawings.length > 0
                    ? `${drawings.length} drawing${drawings.length !== 1 ? 's' : ''} available for verification`
                    : 'No drawings uploaded yet'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </Link>
        </section>
      </div>

      {/* Drawing Detail Panel */}
      {selectedDrawing && (
        <DrawingDetailPanel
          drawing={selectedDrawing}
          isParsing={parsingId === selectedDrawing.id}
          onParse={() => handleParse(selectedDrawing.id)}
          onClose={() => setSelectedDrawing(null)}
        />
      )}
    </div>
  );
}

function UploadDrawingCard({ projectId, onUpload, compact }: {
  projectId: string;
  onUpload: (file: File) => Promise<void>;
  compact?: boolean;
}) {
  const [sheetName, setSheetName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!sheetName.trim()) {
      setPendingFile(file);
      return;
    }
    doUpload(file);
    (e.target as HTMLInputElement).value = '';
  };

  const doUpload = async (file: File) => {
    setUploading(true);
    await onUpload(file);
    setSheetName('');
    setPendingFile(null);
    setUploading(false);
  };

  return (
    <div className={`border-2 border-dashed ${compact ? 'border-gray-200' : 'border-gray-300'} rounded-lg ${compact ? 'p-3' : 'p-6'} text-center`}>
      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
        <Upload className="w-5 h-5 text-gray-500" />
      </div>
      {compact && <p className="text-sm font-semibold text-gray-700 mb-2">Upload another drawing</p>}
      {!compact && (
        <>
          <p className="text-sm font-semibold text-gray-700 mb-1">Upload Architectural Drawing</p>
          <p className="text-xs text-gray-500 mb-3">PDF or DWG up to 50MB. AI will extract ground truth data.</p>
        </>
      )}
      <div className="mb-2">
        <input
          type="text"
          value={sheetName}
          onChange={(e) => setSheetName(e.target.value)}
          placeholder="Sheet name (e.g., S-101 Structural)"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>
      {pendingFile && (
        <p className="text-xs text-gray-500 mb-2">
          Selected: {pendingFile.name} ({pendingFile.size > 0 ? `${(pendingFile.size / 1024 / 1024).toFixed(1)} MB` : '...'})
        </p>
      )}
      <label
        className={`inline-block px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg cursor-pointer hover:bg-gray-900 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {uploading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
          </span>
        ) : (
          'Choose File'
        )}
        <input
          type="file"
          accept=".pdf,.dwg,application/pdf"
          className="hidden"
          onChange={handleFile}
          disabled={uploading}
        />
      </label>
    </div>
  );
}

function DrawingCard({ drawing, isParsing, onParse, onDelete, onClick }: {
  drawing: Drawing;
  isParsing: boolean;
  onParse: () => void;
  onDelete: () => void;
  onClick: () => void;
}) {
  const statusIcon = {
    pending: <Clock className="w-4 h-4 text-gray-400" />,
    processing: <Loader2 className="w-4 h-4 animate-spin text-blue-500" />,
    completed: <CheckCircle className="w-4 h-4 text-green-500" />,
    failed: <XCircle className="w-4 h-4 text-red-500" />,
  };

  const statusLabel = {
    pending: 'Ready to parse',
    processing: 'Parsing...',
    completed: 'Parsed',
    failed: 'Parse failed',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button onClick={onClick} className="w-full p-4 text-left hover:bg-gray-50 transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-50 rounded flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{drawing.sheet_name}</p>
            <div className="flex items-center gap-2 mt-1">
              {statusIcon[drawing.parse_status as keyof typeof statusIcon]}
              <span className="text-xs text-gray-500">{statusLabel[drawing.parse_status as keyof typeof statusLabel]}</span>
            </div>
            {drawing.page_count && (
              <p className="text-xs text-gray-400 mt-0.5">{drawing.page_count} pages</p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
        </div>
      </button>
      <div className="border-t border-gray-100 px-4 py-2 flex gap-2">
        {drawing.parse_status !== 'completed' && drawing.parse_status !== 'processing' && (
          <button
            onClick={(e) => { e.stopPropagation(); onParse(); }}
            disabled={isParsing}
            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
          >
            {isParsing ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookOpen className="w-3 h-3" />}
            {isParsing ? 'Parsing...' : 'Parse with AI'}
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 rounded font-semibold flex items-center gap-1 ml-auto"
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </button>
      </div>
    </div>
  );
}

function DrawingDetailPanel({ drawing, isParsing, onParse, onClose }: {
  drawing: Drawing;
  isParsing: boolean;
  onParse: () => void;
  onClose: () => void;
}) {
  const parsed: ParsedDrawingData | null = drawing.parse_result
    ? (typeof drawing.parse_result === 'string' ? JSON.parse(drawing.parse_result) : drawing.parse_result)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-full max-w-sm bg-white flex flex-col overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h3 className="font-bold text-sm truncate flex-1 mr-4">{drawing.sheet_name}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <XCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* PDF Preview */}
          {drawing.file_url.startsWith('data:application/pdf') && (
            <div className="bg-gray-100 text-center py-3">
              <p className="text-xs text-gray-500 font-mono">PDF Document</p>
            </div>
          )}

          {/* Parse Status */}
          {drawing.parse_status !== 'completed' && (
            <div className="p-4">
              <div className={`p-4 rounded-lg border ${
                drawing.parse_status === 'failed'
                  ? 'bg-red-50 border-red-200'
                  : drawing.parse_status === 'processing'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {drawing.parse_status === 'failed' && <XCircle className="w-5 h-5 text-red-500" />}
                  {drawing.parse_status === 'processing' && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
                  {drawing.parse_status === 'pending' && <Clock className="w-5 h-5 text-gray-400" />}
                  <p className="font-semibold text-sm capitalize">{drawing.parse_status === 'failed' ? 'Parse Failed' : drawing.parse_status}</p>
                </div>
                {drawing.parse_error && (
                  <p className="text-xs text-red-600">{drawing.parse_error}</p>
                )}
                {drawing.parse_status === 'pending' && (
                  <p className="text-xs text-gray-600 mt-1">
                    AI will extract structural elements, dimensions, and specifications from this drawing.
                  </p>
                )}
              </div>
              {drawing.parse_status !== 'processing' && (
                <button
                  onClick={onParse}
                  className="w-full mt-3 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Parse with AI
                </button>
              )}
            </div>
          )}

          {/* Parsed Data */}
          {parsed && (
            <div className="p-4 space-y-4">
              {parsed.project_info && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Project Info</h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                    {Object.entries(parsed.project_info).filter(([, v]) => v).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{k.replace(/_/g, ' ')}</span>
                        <span className="font-medium">{v as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsed.overall_dimensions && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Overall Dimensions</h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                    {Object.entries(parsed.overall_dimensions).filter(([, v]) => v).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{k.replace(/_/g, ' ')}</span>
                        <span className="font-mono font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsed.structural_elements && parsed.structural_elements.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Structural Elements ({parsed.structural_elements.length})
                  </h4>
                  <div className="space-y-2">
                    {parsed.structural_elements.map((el, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm">{el.element}</p>
                          <span className="text-xs font-mono bg-gray-200 px-2 py-0.5 rounded">{el.dimensions}</span>
                        </div>
                        <p className="text-xs text-gray-500">{el.location}</p>
                        {el.material && <p className="text-xs text-gray-400 mt-0.5">Material: {el.material}</p>}
                        {el.notes && <p className="text-xs text-amber-600 mt-1 italic">{el.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsed.rooms && parsed.rooms.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Rooms ({parsed.rooms.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {parsed.rooms.map((room, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3">
                        <p className="font-semibold text-xs">{room.name}</p>
                        <p className="text-xs font-mono text-gray-700">{room.dimensions}</p>
                        {room.elevation && <p className="text-xs text-gray-400">ELEV {room.elevation}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsed.specifications && parsed.specifications.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Specifications ({parsed.specifications.length})
                  </h4>
                  <div className="space-y-2">
                    {parsed.specifications.map((spec, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded uppercase">
                            {spec.category}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{spec.item}</p>
                        <p className="text-xs text-green-700 font-mono mt-0.5">{spec.standard}</p>
                        {spec.notes && <p className="text-xs text-gray-500 mt-0.5">{spec.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsed.raw_text && (
                <details className="group">
                  <summary className="text-xs font-bold uppercase tracking-wider text-gray-500 cursor-pointer hover:text-gray-700">
                    Raw Extracted Text ({parsed.raw_text.length} chars)
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 whitespace-pre-wrap font-mono overflow-x-auto max-h-64">
                    {parsed.raw_text}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}