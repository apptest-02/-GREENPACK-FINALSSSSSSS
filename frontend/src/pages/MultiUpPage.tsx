// Greenpack Pro v2.0 — Multi-Up Inspection Page
import React, { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
  Upload, Grid3x3, CheckCircle2, XCircle, AlertTriangle,
  Download, FileText, Eye, ArrowLeft, Info,
  Loader2, Settings2, Scan, Layers,
} from 'lucide-react';
import clsx from 'clsx';
import { multiUpApi, scannersApi, downloadBlob, jobsApi } from '@/lib/api';

// ═══════════════════════════════════════════════════════════════════════════
// MULTI-UP INSPECTION PAGE
// ═══════════════════════════════════════════════════════════════════════════

export function MultiUpInspectionPage() {
  const navigate = useNavigate();
  const [masterFile, setMasterFile] = useState<File | null>(null);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [jobRef, setJobRef] = useState(() =>
    `MULTI-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`
  );
  const [clientName, setClientName] = useState('');
  const [productName, setProductName] = useState('');
  const [expectedCount, setExpectedCount] = useState<number | null>(null);
  const [isTransparent, setIsTransparent] = useState(false);
  const [colorThreshold, setColorThreshold] = useState(2.0);
  const [ssimThreshold, setSsimThreshold] = useState(0.75);
  const [checkBraille, setCheckBraille] = useState(false);
  const [checkFontSize, setCheckFontSize] = useState(false);
  const [spellCheck, setSpellCheck] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const masterInputRef = React.useRef<HTMLInputElement>(null);
  const scanInputRef = React.useRef<HTMLInputElement>(null);

  const { data: scannersData } = useQuery({
    queryKey: ['scanners'],
    queryFn: scannersApi.list,
    retry: false,
  });
  const scanners = scannersData?.scanners || [];

  const createMutation = useMutation({
    mutationFn: (fd: FormData) => multiUpApi.create(fd),
    onSuccess: (data) => {
      toast.success('Multi-up inspection started — detecting labels…');
      navigate(`/multi-up/${data.job_id}`);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.detail || 'Failed to create job');
    },
  });

  function handleMasterFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setMasterFile(e.target.files[0]);
      toast.success(`Master file selected: ${e.target.files[0].name}`);
    }
  }

  function handleScanFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setScanFile(e.target.files[0]);
      toast.success(`Scan file selected: ${e.target.files[0].name}`);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!masterFile) { toast.error('Upload the master label first'); return; }
    if (!scanFile) { toast.error('Upload the multi-up sheet first'); return; }

    const fd = new FormData();
    fd.append('master_file', masterFile);
    fd.append('scan_file', scanFile);
    fd.append('job_ref', jobRef);
    fd.append('client_name', clientName);
    fd.append('product_name', productName);
    if (expectedCount !== null) fd.append('expected_count', String(expectedCount));
    fd.append('is_transparent', String(isTransparent));
    fd.append('color_threshold', String(colorThreshold));
    fd.append('ssim_threshold', String(ssimThreshold));
    fd.append('check_braille', String(checkBraille));
    fd.append('check_font_size', String(checkFontSize));
    fd.append('spell_check', String(spellCheck));

    createMutation.mutate(fd);
  }

  function FileUploadCard({ 
    file, 
    onFileChange, 
    inputRef, 
    label, 
    hint, 
    icon, 
    accept 
  }: { 
    file: File | null;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    inputRef: React.RefObject<HTMLInputElement>;
    label: string;
    hint: string;
    icon: string;
    accept: string;
  }) {
    return (
      <div className="border-2 border-dashed rounded-xl p-6 text-center transition-all border-gray-300 hover:border-[#1A73E8] hover:bg-blue-50/30">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onFileChange}
          className="hidden"
        />
        {file ? (
          <div className="space-y-2">
            <CheckCircle2 size={36} className="mx-auto text-green-500" />
            <p className="font-medium text-green-700 text-sm">{file.name}</p>
            <p className="text-xs text-green-500">{(file.size / 1024).toFixed(0)} KB</p>
            <button
              type="button"
              onClick={() => {
                onFileChange({ target: { files: null } } as any);
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="text-xs text-red-500 hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-5xl">{icon}</div>
            <p className="font-medium text-gray-700 text-sm">{label}</p>
            <p className="text-xs text-gray-500">{hint}</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2 bg-[#1A73E8] text-white text-sm rounded-lg hover:bg-[#1557B0] transition cursor-pointer"
            >
              Browse Files
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#0D1B2A]">Multi-Up Sheet Inspection</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Detect and inspect up to 15 labels in one scan against a master design
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded-full text-xs font-bold">
            NEW in v2.0
          </span>
        </div>
      </div>

      <div className="p-8 max-w-5xl mx-auto">
        {scanners.length > 0 && (
          <div className="bg-[#0078D4] rounded-xl p-4 flex items-center gap-3 text-white mb-6">
            <Scan size={20} />
            <span className="text-sm flex-1">
              <b>Scanner available:</b> {scanners[0].name}
            </span>
            <button type="button"
              onClick={async () => {
                try {
                  const result = await scannersApi.capture(scanners[0].device, 300);
                  toast.success(`Scanned: ${result.image_path}`);
                } catch { toast.error('Scanner capture failed'); }
              }}
              className="px-4 py-1.5 bg-white text-[#0078D4] rounded-lg text-xs font-bold hover:bg-gray-100">
              Scan Now
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FileUploadCard
              file={masterFile}
              onFileChange={handleMasterFileChange}
              inputRef={masterInputRef}
              label="Master Label (single)"
              hint="PDF, PNG, JPG, TIFF, BMP"
              icon="📄"
              accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp"
            />
            <FileUploadCard
              file={scanFile}
              onFileChange={handleScanFileChange}
              inputRef={scanInputRef}
              label="Scanned Multi-Up Sheet"
              hint="PNG, JPG, TIFF, BMP | 300 DPI"
              icon="📸"
              accept=".png,.jpg,.jpeg,.tiff,.bmp"
            />
          </div>

          {/* Rest of the form - same as before */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#0D1B2A]">Job Details</h3>
              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1A73E8]">
                <Settings2 size={14} /> {showAdvanced ? 'Hide' : 'Show'} advanced
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Job Reference</label>
                <input value={jobRef} onChange={e => setJobRef(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Client</label>
                <input value={clientName} onChange={e => setClientName(e.target.value)}
                  placeholder="e.g. Nestlé"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Product</label>
                <input value={productName} onChange={e => setProductName(e.target.value)}
                  placeholder="e.g. Maggi 70g"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Expected Label Count (1–15)
                </label>
                <input type="number" min="1" max="50" value={expectedCount ?? ''}
                  onChange={e => setExpectedCount(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Auto-detect"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="flex items-center gap-4 pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isTransparent} onChange={e => setIsTransparent(e.target.checked)}
                    className="w-4 h-4 rounded" />
                  <span className="text-sm font-medium text-gray-700">Transparent labels</span>
                </label>
              </div>
            </div>

            {showAdvanced && (
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-2">
                      Color Tolerance ΔE: {colorThreshold}
                    </label>
                    <input type="range" min="0.5" max="5" step="0.1" value={colorThreshold}
                      onChange={e => setColorThreshold(Number(e.target.value))}
                      className="w-full accent-[#1A73E8]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-2">
                      SSIM Threshold: {ssimThreshold}
                    </label>
                    <input type="range" min="0.5" max="0.99" step="0.01" value={ssimThreshold}
                      onChange={e => setSsimThreshold(Number(e.target.value))}
                      className="w-full accent-[#1A73E8]" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer">
                    <input type="checkbox" checked={checkBraille} onChange={e => setCheckBraille(e.target.checked)} />
                    <span className="text-sm">Check Braille</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer">
                    <input type="checkbox" checked={checkFontSize} onChange={e => setCheckFontSize(e.target.checked)} />
                    <span className="text-sm">Font Size Check</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer">
                    <input type="checkbox" checked={spellCheck} onChange={e => setSpellCheck(e.target.checked)} />
                    <span className="text-sm">Spell Check</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <button type="submit"
            disabled={!masterFile || !scanFile || createMutation.isPending}
            className="w-full py-3 bg-gradient-to-r from-[#1A73E8] to-[#00C2CB] text-white rounded-xl font-bold text-base hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {createMutation.isPending ? (
              <><Loader2 size={18} className="animate-spin" /> Starting inspection…</>
            ) : (
              <><Layers size={18} /> Start Multi-Up Inspection</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════
// MULTI-UP RESULT PAGE
// ═══════════════════════════════════════════════════════════════════════════

export function MultiUpResultPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [selectedLabel, setSelectedLabel] = useState<any>(null);

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsApi.get(jobId!),
    refetchInterval: (query: any) => query.state.data?.status === 'processing' ? 2500 : false,
    enabled: !!jobId,
  });

  const { data: result } = useQuery({
    queryKey: ['multi-up-result', jobId],
    queryFn: () => multiUpApi.getResult(jobId!),
    enabled: job?.status === 'completed',
  });

  const API_BASE = (window as any).electronAPI?.apiUrl || 'http://localhost:8000';

  async function downloadPDF() {
    try {
      const blob = await jobsApi.downloadReport(jobId!);
      downloadBlob(blob, `multi_up_report_${jobId?.slice(0, 8)}.pdf`);
      toast.success('PDF downloaded');
    } catch { toast.error('Download failed'); }
  }

  async function downloadExcel() {
    try {
      const blob = await jobsApi.downloadExcel(jobId!);
      downloadBlob(blob, `multi_up_results_${jobId?.slice(0, 8)}.xlsx`);
      toast.success('Excel downloaded');
    } catch { toast.error('Download failed'); }
  }

  async function downloadSheet() {
    try {
      const blob = await multiUpApi.downloadSheetImage(jobId!);
      downloadBlob(blob, `sheet_${jobId?.slice(0, 8)}.jpg`);
    } catch { toast.error('Download failed'); }
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  if (job.status === 'processing' || job.status === 'queued') {
    return (
      <div>
        <div className="px-8 py-6 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/jobs')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-2xl font-bold text-[#0D1B2A]">{job.job_ref}</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center h-[70vh] gap-6">
          <div className="w-20 h-20 rounded-full bg-[#1A73E8]/10 flex items-center justify-center">
            <Loader2 size={40} className="animate-spin text-[#1A73E8]" />
          </div>
          <div className="text-center max-w-md">
            <h3 className="text-xl font-bold text-[#0D1B2A]">Multi-Up Inspection Running</h3>
            <p className="text-gray-500 text-sm mt-2">
              Detecting each label, aligning to master, running 8 quality checks per label…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (job.status === 'failed') {
    return (
      <div className="p-8 text-center">
        <XCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-[#0D1B2A]">Inspection Failed</h2>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">{job.error_message}</p>
        <button onClick={() => navigate('/multi-up/new')}
          className="mt-4 px-4 py-2 bg-[#1A73E8] text-white rounded-lg text-sm font-semibold">
          Try Again
        </button>
      </div>
    );
  }

  if (!result) {
    return <div className="p-8"><Loader2 className="animate-spin" /></div>;
  }

  const perLabels = result.per_label_results || [];
  const sheetPass = result.sheet_pass;

  return (
    <div>
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/jobs')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#0D1B2A]">{job.job_ref}</h1>
            <p className="text-sm text-gray-500">
              Multi-Up Sheet • {result.labels_found} labels detected
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadPDF}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
            <Download size={14} /> PDF Report
          </button>
          <button onClick={downloadExcel}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
            <FileText size={14} /> Excel
          </button>
          <button onClick={downloadSheet}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
            <Eye size={14} /> Sheet Image
          </button>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className={clsx(
          'rounded-xl p-6 shadow-sm',
          sheetPass ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
                    : 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200'
        )}>
          <div className="flex items-center gap-6">
            <div className={clsx('w-20 h-20 rounded-2xl flex items-center justify-center',
              sheetPass ? 'bg-green-500' : 'bg-red-500')}>
              {sheetPass ? <CheckCircle2 size={40} className="text-white" /> : <XCircle size={40} className="text-white" />}
            </div>
            <div className="flex-1">
              <div className="text-3xl font-black text-[#0D1B2A]">
                {sheetPass ? 'SHEET PASS' : 'SHEET FAIL'}
              </div>
              <div className="text-lg font-bold mt-1"
                style={{ color: sheetPass ? '#22A06B' : '#E5383B' }}>
                Overall: {result.overall_score?.toFixed(1)}/100
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 flex-1">
              <StatMiniCard label="Found" value={result.labels_found} color="#1A73E8" />
              {result.labels_expected && (
                <StatMiniCard label="Missing" value={result.labels_missing || 0}
                  color={result.labels_missing > 0 ? '#E5383B' : '#22A06B'} />
              )}
              <StatMiniCard label="Passed" value={result.labels_passed || 0} color="#22A06B" />
              <StatMiniCard label="Failed" value={result.labels_failed || 0}
                color={result.labels_failed > 0 ? '#E5383B' : '#22A06B'} />
            </div>
          </div>
        </div>

        {result.sheet_annotated_path && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="font-semibold text-sm text-[#0D1B2A]">Annotated Sheet</div>
              <div className="text-xs text-gray-500">Imposition: {result.imposition || '—'}</div>
            </div>
            <div className="p-4 bg-gray-50">
              <img
                src={`${API_BASE}/reports/${encodeURIComponent(result.sheet_annotated_path.split('/').pop() || '')}`}
                alt="Annotated sheet"
                className="w-full rounded-lg border border-gray-100 max-h-[600px] object-contain mx-auto"
                onError={(e: any) => { e.target.style.display = 'none'; }}
              />
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="font-semibold text-sm text-[#0D1B2A]">
              Per-Label Results ({perLabels.length} labels)
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500" /> Pass</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500" /> Fail</span>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-5 gap-2">
              {perLabels.map((lb: any) => (
                <button
                  key={lb.label_id}
                  onClick={() => setSelectedLabel(lb)}
                  className={clsx(
                    'p-3 rounded-lg border-2 text-left transition-all hover:scale-105',
                    lb.pass_fail ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-600">{lb.label_id}</span>
                    {lb.pass_fail ? <CheckCircle2 size={16} className="text-green-600" /> : <XCircle size={16} className="text-red-600" />}
                  </div>
                  <div className={clsx('text-2xl font-black', lb.pass_fail ? 'text-green-700' : 'text-red-700')}>
                    {lb.overall_score?.toFixed(0)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedLabel && (
          <LabelDetailModal label={selectedLabel} onClose={() => setSelectedLabel(null)} />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function StatMiniCard({ label, value, color }: any) {
  return (
    <div className="text-center">
      <div className="text-2xl font-black" style={{ color }}>{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function LabelDetailModal({ label, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0D1B2A]">Label {label.label_id}</h2>
            <p className="text-sm text-gray-500">Position: Row {label.row + 1}, Column {label.col + 1}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={clsx('px-4 py-2 rounded-full font-black text-sm', 
              label.pass_fail ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
              {label.overall_score?.toFixed(1)} — {label.pass_fail ? 'PASS' : 'FAIL'}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-4 gap-2">
            <MiniScore label="OCR" value={label.ocr_score} />
            <MiniScore label="Color" value={label.color_score} />
            <MiniScore label="SSIM" value={label.ssim_score} />
            <MiniScore label="Barcode" value={label.barcode_score} />
            <MiniScore label="Registration" value={label.registration_score} />
            <MiniScore label="Die-Cut" value={label.die_cut_score} />
            <MiniScore label="Mottling" value={label.mottling_score} />
            <MiniScore label="Alignment" value={label.alignment_confidence * 100} suffix="%" />
          </div>

          {label.ocr_errors?.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2">OCR Errors ({label.ocr_errors.length})</h3>
              {label.ocr_errors.slice(0, 5).map((err: any, i: number) => (
                <div key={i} className="p-2 bg-red-50 rounded text-xs mb-1">
                  <span className="font-mono">"{err.master_text}" → "{err.scan_text}"</span>
                </div>
              ))}
            </div>
          )}

          {label.defects?.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Defects ({label.defects.length})</h3>
              {label.defects.slice(0, 5).map((d: any, i: number) => (
                <div key={i} className="p-2 bg-orange-50 rounded text-xs mb-1">{d.type} - {d.severity}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniScore({ label, value, suffix = '' }: any) {
  const color = value >= 75 ? 'text-green-600' : value >= 50 ? 'text-yellow-600' : 'text-red-600';
  return (
    <div className="p-2 bg-gray-50 rounded-lg text-center">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={clsx('text-lg font-black', color)}>
        {value != null ? value.toFixed(0) : '—'}{suffix}
      </div>
    </div>
  );
}