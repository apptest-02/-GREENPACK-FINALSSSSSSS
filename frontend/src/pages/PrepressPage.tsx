// Greenpack Pro v3.0 — Prepress Inspection UI
// Two main capabilities:
//   1. Pantone color identification (scan past sticker → get PMS codes)
//   2. Trial-vs-final comparison (GO/HOLD/NO-GO before production)
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Upload, Palette, Layers, ArrowLeft, Loader2, CheckCircle2, XCircle,
  AlertTriangle, FileText, Eye, DollarSign, Info, ScanLine, Sparkles,
  TrendingUp, ShieldCheck, Clock,
} from 'lucide-react';
import clsx from 'clsx';
import { prepressApi } from '@/lib/api';

// ═══════════════════════════════════════════════════════════════════════════
// PANTONE COLOR IDENTIFICATION PAGE
// "Scan past stickers and get the PANTONE color code used"
// ═══════════════════════════════════════════════════════════════════════════
export function PantoneIdentificationPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [k, setK] = useState(8);
  const [ignoreWhite, setIgnoreWhite] = useState(true);
  const [topN, setTopN] = useState(5);
  const [result, setResult] = useState<any>(null);

  const drop = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: (files) => { setFile(files[0]); setResult(null); },
  });

  const identifyMutation = useMutation({
    mutationFn: (fd: FormData) => prepressApi.identifyColors(fd),
    onSuccess: (data) => {
      setResult(data);
      toast.success(`Identified ${data.total_colors_found} colors`);
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Identification failed'),
  });

  function handleSubmit() {
    if (!file) { toast.error('Upload a sticker image or PDF first'); return; }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('k', String(k));
    fd.append('ignore_white', String(ignoreWhite));
    fd.append('top_n_per_color', String(topN));
    identifyMutation.mutate(fd);
  }

  const API_BASE = (window as any).electronAPI?.apiUrl || 'https://greenpack-backend.onrender.com';

  return (
    <div>
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#0D1B2A]">Pantone Color Identification</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Scan past stickers — get the exact PANTONE codes used in the design
            </p>
          </div>
        </div>
        <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold">
          NEW in v3.0
        </span>
      </div>

      <div className="p-8 max-w-6xl mx-auto">
        {/* How it works */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-purple-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-bold text-[#0D1B2A] mb-1">How Pantone Identification Works</p>
              <ol className="list-decimal list-inside space-y-0.5 text-gray-700">
                <li>Scan or upload an image of a previously printed sticker (the work whose color you need to match)</li>
                <li>Software extracts dominant colors using K-means clustering in Lab color space</li>
                <li>Each color is matched against the bundled PANTONE library (698 spot colors)</li>
                <li>Get ranked PMS codes with ΔE distance and confidence level</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left: Upload + settings */}
          <div className="col-span-5 space-y-4">
            <div {...drop.getRootProps()}
              className={clsx(
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all min-h-[280px] flex items-center justify-center',
                drop.isDragActive ? 'border-purple-500 bg-purple-50'
                  : file ? 'border-green-400 bg-green-50'
                    : 'border-gray-200 hover:border-purple-500 hover:bg-purple-50/30'
              )}>
              <input {...drop.getInputProps()} />
              {file ? (
                <div className="space-y-2">
                  <CheckCircle2 size={48} className="mx-auto text-green-500" />
                  <p className="font-semibold text-green-700">{file.name}</p>
                  <p className="text-xs text-green-500">{(file.size / 1024).toFixed(0)} KB</p>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                    className="text-xs text-red-500 hover:underline">Remove</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <ScanLine size={64} className="mx-auto text-gray-300" />
                  <p className="font-semibold text-gray-700">Drop sticker image or PDF here</p>
                  <p className="text-xs text-gray-500">PNG, JPG, TIFF, PDF • Min 300 DPI for accuracy</p>
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <h3 className="font-bold text-sm text-[#0D1B2A]">Settings</h3>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">
                  Number of dominant colors (k): <span className="text-purple-600 font-mono">{k}</span>
                </label>
                <input type="range" min="3" max="15" value={k}
                  onChange={e => setK(Number(e.target.value))}
                  className="w-full accent-purple-600" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">
                  Top matches per color: <span className="text-purple-600 font-mono">{topN}</span>
                </label>
                <input type="range" min="1" max="10" value={topN}
                  onChange={e => setTopN(Number(e.target.value))}
                  className="w-full accent-purple-600" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={ignoreWhite} onChange={e => setIgnoreWhite(e.target.checked)}
                  className="w-4 h-4" />
                <span className="text-sm">Ignore white background (paper)</span>
              </label>
            </div>

            <button onClick={handleSubmit} disabled={!file || identifyMutation.isPending}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {identifyMutation.isPending ? (
                <><Loader2 size={18} className="animate-spin" /> Analyzing colors…</>
              ) : (
                <><Sparkles size={18} /> Identify Pantone Codes</>
              )}
            </button>
          </div>

          {/* Right: Results */}
          <div className="col-span-7">
            {!result && (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
                <Palette size={48} className="mx-auto mb-3" />
                <p className="font-semibold">Upload a sticker to see Pantone matches</p>
                <p className="text-xs mt-1">Library: 698 PMS spot colors</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-[#0D1B2A]">
                      {result.total_colors_found} Colors Identified
                    </h3>
                    <span className="text-xs text-gray-500">
                      Library: {result.library_size} colors • {result.method}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {result.extracted_colors?.map((c: any, i: number) => (
                      <ColorMatchCard key={i} color={c} idx={i} />
                    ))}
                  </div>
                </div>

                {result.report_image_url && (
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <h3 className="font-bold text-[#0D1B2A] mb-3">Annotated Report</h3>
                    <img
                      src={`${API_BASE}${result.report_image_url}`}
                      alt="Pantone report"
                      className="w-full rounded-lg border border-gray-100"
                      onError={(e: any) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorMatchCard({ color, idx }: any) {
  const conf = color.match_confidence;
  const confColor = conf === 'exact' || conf === 'very_high' ? 'text-green-600 bg-green-50'
                  : conf === 'high' ? 'text-blue-600 bg-blue-50'
                  : conf === 'medium' ? 'text-yellow-600 bg-yellow-50'
                  : 'text-red-600 bg-red-50';

  return (
    <div className="border border-gray-100 rounded-lg p-3 hover:shadow-md transition">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-lg shrink-0 border border-gray-200"
          style={{ backgroundColor: color.hex }} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[#0D1B2A]">{color.best_match_code}</span>
            <span className={clsx('px-2 py-0.5 rounded-full text-xs font-bold', confColor)}>
              {conf?.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            ΔE {color.best_match_delta_e} • {color.area_pct}% area • {color.hex}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Detected</div>
          <div className="font-mono text-xs">RGB({color.rgb?.join(', ')})</div>
        </div>
      </div>

      {color.pms_matches?.length > 1 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-1.5">Other close matches:</p>
          <div className="flex flex-wrap gap-1.5">
            {color.pms_matches.slice(1, 5).map((m: any, j: number) => (
              <div key={j} className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded text-xs">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: m.hex }} />
                <span className="font-medium">{m.code}</span>
                <span className="text-gray-400">ΔE {m.delta_e}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TRIAL VS FINAL COMPARISON PAGE — the "real-time accuracy report" UI
// ═══════════════════════════════════════════════════════════════════════════
export function TrialComparisonPage() {
  const navigate = useNavigate();
  const [finalDesign, setFinalDesign] = useState<File | null>(null);
  const [trialProofs, setTrialProofs] = useState<File[]>([]);
  const [jobRef, setJobRef] = useState(() =>
    `PREPRESS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`);
  const [clientName, setClientName] = useState('');
  const [productName, setProductName] = useState('');
  const [colorThreshold, setColorThreshold] = useState(2.0);
  const [minAccuracyForGo, setMinAccuracyForGo] = useState(90);
  const [wasteUnitCost, setWasteUnitCost] = useState(5);
  const [wasteRunSize, setWasteRunSize] = useState(1000);

  const finalDrop = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg', '.tiff'] },
    maxFiles: 1,
    onDrop: (files) => setFinalDesign(files[0]),
  });

  const trialsDrop = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.tiff'] },
    multiple: true,
    onDrop: (files) => setTrialProofs(prev => [...prev, ...files].slice(0, 10)),
  });

  const submitMutation = useMutation({
    mutationFn: (fd: FormData) => prepressApi.trialComparison(fd),
    onSuccess: (data) => {
      toast.success('Prepress comparison started');
      navigate(`/prepress/${data.job_id}`);
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to start'),
  });

  function handleSubmit() {
    if (!finalDesign) { toast.error('Upload the final approved design'); return; }
    if (trialProofs.length === 0) { toast.error('Upload at least one trial proof'); return; }
    const fd = new FormData();
    fd.append('final_design', finalDesign);
    trialProofs.forEach(t => fd.append('trial_proofs', t));
    fd.append('job_ref', jobRef);
    fd.append('client_name', clientName);
    fd.append('product_name', productName);
    fd.append('color_threshold', String(colorThreshold));
    fd.append('min_accuracy_for_go', String(minAccuracyForGo));
    fd.append('waste_unit_cost_usd', String(wasteUnitCost));
    fd.append('waste_run_size_m2', String(wasteRunSize));
    submitMutation.mutate(fd);
  }

  return (
    <div>
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#0D1B2A]">Prepress: Trial vs Final</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Compare trial proofs to final design BEFORE production — stop waste at the source
            </p>
          </div>
        </div>
        <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold">
          NEW in v3.0
        </span>
      </div>

      <div className="p-8 max-w-5xl mx-auto space-y-6">
        {/* Why */}
        <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 border border-orange-100 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck size={24} className="text-orange-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-bold text-[#0D1B2A] mb-1">Stop Waste Before It Starts</p>
              <p className="text-gray-700">
                The press is expensive. Plates, ink, paper, sticker stock — once you commit to a
                full run, mistakes cost real money. This module catches errors in the <strong>trial proof</strong>
                {' '}stage so you know the design is right BEFORE you commit to a full production print.
              </p>
              <ul className="list-disc list-inside mt-2 space-y-0.5 text-gray-600">
                <li>Text & font issues (any spelling or character mismatch)</li>
                <li>Color shifts (per-zone ΔE CIE2000)</li>
                <li>Icon / logo size mismatches</li>
                <li>Expiry date errors (expired or mismatched)</li>
                <li>Print defects (smear, banding, missing ink)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Files */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div {...finalDrop.getRootProps()}
              className={clsx('border-2 border-dashed rounded-xl p-6 text-center cursor-pointer min-h-[200px] flex items-center justify-center',
                finalDrop.isDragActive ? 'border-purple-500 bg-purple-50'
                  : finalDesign ? 'border-green-400 bg-green-50'
                    : 'border-gray-200 hover:border-purple-500 hover:bg-purple-50/30')}>
              <input {...finalDrop.getInputProps()} />
              {finalDesign ? (
                <div>
                  <CheckCircle2 size={36} className="mx-auto text-green-500 mb-2" />
                  <p className="font-semibold text-green-700 text-sm">{finalDesign.name}</p>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setFinalDesign(null); }}
                    className="text-xs text-red-500 hover:underline mt-1">Remove</button>
                </div>
              ) : (
                <div>
                  <FileText size={48} className="mx-auto text-gray-400 mb-2" />
                  <p className="font-semibold text-gray-700">Final Design (Source of Truth)</p>
                  <p className="text-xs text-gray-500 mt-1">PDF or image of approved artwork</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div {...trialsDrop.getRootProps()}
              className={clsx('border-2 border-dashed rounded-xl p-6 text-center cursor-pointer min-h-[200px] flex items-center justify-center',
                trialsDrop.isDragActive ? 'border-purple-500 bg-purple-50'
                  : trialProofs.length > 0 ? 'border-green-400 bg-green-50'
                    : 'border-gray-200 hover:border-purple-500 hover:bg-purple-50/30')}>
              <input {...trialsDrop.getInputProps()} />
              {trialProofs.length > 0 ? (
                <div>
                  <CheckCircle2 size={36} className="mx-auto text-green-500 mb-2" />
                  <p className="font-semibold text-green-700 text-sm">
                    {trialProofs.length} trial proof{trialProofs.length !== 1 ? 's' : ''} loaded
                  </p>
                  <ul className="text-xs text-gray-600 mt-1">
                    {trialProofs.slice(0, 3).map((t, i) => <li key={i}>{t.name}</li>)}
                    {trialProofs.length > 3 && <li>+{trialProofs.length - 3} more…</li>}
                  </ul>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setTrialProofs([]); }}
                    className="text-xs text-red-500 hover:underline mt-2">Clear all</button>
                </div>
              ) : (
                <div>
                  <Layers size={48} className="mx-auto text-gray-400 mb-2" />
                  <p className="font-semibold text-gray-700">Trial Proofs (1–10)</p>
                  <p className="text-xs text-gray-500 mt-1">Scanned printed proofs to compare</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Job details */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 grid grid-cols-3 gap-4">
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

        {/* Settings */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h3 className="font-bold text-[#0D1B2A]">Quality Thresholds & Waste Estimate</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-2">
                Color Tolerance ΔE: <span className="text-purple-600 font-mono">{colorThreshold}</span>
              </label>
              <input type="range" min="0.5" max="5" step="0.1" value={colorThreshold}
                onChange={e => setColorThreshold(Number(e.target.value))}
                className="w-full accent-purple-600" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-2">
                Min Accuracy for GO: <span className="text-purple-600 font-mono">{minAccuracyForGo}%</span>
              </label>
              <input type="range" min="70" max="99" step="1" value={minAccuracyForGo}
                onChange={e => setMinAccuracyForGo(Number(e.target.value))}
                className="w-full accent-purple-600" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 pt-2 border-t border-gray-100">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Waste cost (USD/m²)</label>
              <input type="number" step="0.5" value={wasteUnitCost}
                onChange={e => setWasteUnitCost(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <p className="text-xs text-gray-500 mt-1">For waste savings calculation</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Run size (m²)</label>
              <input type="number" step="100" value={wasteRunSize}
                onChange={e => setWasteRunSize(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <p className="text-xs text-gray-500 mt-1">Expected production run size</p>
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={!finalDesign || trialProofs.length === 0 || submitMutation.isPending}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-base hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
          {submitMutation.isPending ? (
            <><Loader2 size={18} className="animate-spin" /> Starting prepress comparison…</>
          ) : (
            <><ShieldCheck size={18} /> Run Prepress Comparison</>
          )}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PREPRESS RESULT PAGE — shows GO/HOLD/NO_GO + accuracy report
// ═══════════════════════════════════════════════════════════════════════════
export function PrepressResultPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const { data: job } = useQuery({
    queryKey: ['prepress', jobId],
    queryFn: () => prepressApi.getJob(jobId!),
    refetchInterval: (q: any) =>
      q.state.data?.status === 'processing' || q.state.data?.status === 'queued' ? 2500 : false,
    enabled: !!jobId,
  });

  if (!job) {
    return <div className="p-8"><Loader2 className="animate-spin" /></div>;
  }

  if (job.status === 'queued' || job.status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 size={48} className="animate-spin text-purple-600 mb-4" />
        <h2 className="text-xl font-bold text-[#0D1B2A]">Running Prepress Comparison…</h2>
        <p className="text-gray-500 mt-2">Comparing trial proofs to final design</p>
      </div>
    );
  }

  if (job.status === 'failed') {
    return (
      <div className="p-8 text-center">
        <XCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-[#0D1B2A]">Comparison Failed</h2>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">{job.error_message}</p>
      </div>
    );
  }

  const decision = job.decision || 'UNKNOWN';
  const trials = job.trial_reports || [];

  const decisionColor = decision === 'GO' ? 'green'
                      : decision === 'HOLD' ? 'yellow'
                      : 'red';

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
              Prepress comparison • {trials.length} trials inspected
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-5xl mx-auto space-y-6">

        {/* Decision banner */}
        <div className={clsx('rounded-2xl p-8 text-white shadow-lg',
          decisionColor === 'green' ? 'bg-gradient-to-r from-green-600 to-emerald-600'
            : decisionColor === 'yellow' ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
              : 'bg-gradient-to-r from-red-600 to-rose-600')}>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              {decision === 'GO' ? <CheckCircle2 size={56} />
                : decision === 'HOLD' ? <AlertTriangle size={56} />
                : <XCircle size={56} />}
            </div>
            <div className="flex-1">
              <div className="text-5xl font-black">{decision}</div>
              <div className="text-xl opacity-90 mt-1">
                {decision === 'GO' && 'Cleared for production'}
                {decision === 'HOLD' && 'Review before proceeding'}
                {decision === 'NO_GO' && 'Stop — fix critical errors'}
              </div>
              <div className="text-sm opacity-80 mt-2">
                Accuracy: {job.accuracy_score?.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Per-trial accuracy cards */}
        <div className="grid grid-cols-3 gap-4">
          {trials.map((t: any, i: number) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500">Trial #{t.trial_idx || i + 1}</span>
                {t.passed
                  ? <CheckCircle2 size={20} className="text-green-500" />
                  : <XCircle size={20} className="text-red-500" />}
              </div>
              <div className={clsx('text-3xl font-black mb-1',
                t.passed ? 'text-green-600' : 'text-red-600')}>
                {t.accuracy_score?.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 space-y-0.5">
                <div>Text: {t.scores?.text}/100</div>
                <div>Color: {t.scores?.color}/100</div>
                <div>Defects: {t.defect_count || 0}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Errors detail */}
        {trials.some((t: any) => t.error_summary?.total > 0) && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50">
              <h3 className="font-bold text-[#0D1B2A]">Issues Found</h3>
            </div>
            <div className="p-5 space-y-3">
              {trials.flatMap((t: any) =>
                (t.error_summary?.critical || []).map((e: any, i: number) => (
                  <div key={`${t.trial_idx}-c-${i}`}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm">
                    <XCircle size={16} className="text-red-600 shrink-0" />
                    <span className="font-bold text-red-700">{e.category}:</span>
                    <span className="text-gray-700">{e.description}</span>
                  </div>
                ))
              )}
              {trials.flatMap((t: any) =>
                (t.error_summary?.warning || []).slice(0, 5).map((e: any, i: number) => (
                  <div key={`${t.trial_idx}-w-${i}`}
                    className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm">
                    <AlertTriangle size={16} className="text-yellow-600 shrink-0" />
                    <span className="font-bold text-yellow-700">{e.category}:</span>
                    <span className="text-gray-700">{e.description}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
