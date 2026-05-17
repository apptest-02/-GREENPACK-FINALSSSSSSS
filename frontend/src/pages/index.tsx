// Greenpack Pro — All Pages

// ═══════════════════════════════════════════════════════════
// LOGIN PAGE
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Upload, Scan, FileText, BarChart3, CheckCircle2, XCircle,
  AlertTriangle, Clock, Download, Printer, RefreshCw, Plus,
  Search, Filter, Eye, Trash2, ChevronRight, Camera, X,
  Package, BookOpen, Settings, TrendingUp, Users, Shield
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useAuthStore } from '@/store/auth';
import {
  jobsApi, templatesApi, scannersApi, batchApi,
  dashboardApi, reportsApi, settingsApi, healthApi,
  downloadBlob
} from '@/lib/api';
import clsx from 'clsx';

// ─────────────────────── Shared UI Components ───────────────────────────────

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const strokeDash = (score / 100) * circ;
  const color = score >= 75 ? '#22A06B' : score >= 60 ? '#F4A22D' : '#E5383B';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E8EEF4" strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${strokeDash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-bold text-[#0D1B2A]" style={{ fontSize: size * 0.22 }}>
          {score?.toFixed(1) ?? '—'}
        </span>
        <span className="font-semibold" style={{ fontSize: size * 0.11, color }}>
          {score >= 75 ? 'PASS' : score >= 60 ? 'WARN' : 'FAIL'}
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ pass, score }: { pass?: boolean; score?: number }) {
  if (pass === true) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
      <CheckCircle2 size={12} /> PASS
    </span>
  );
  if (pass === false) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
      <XCircle size={12} /> FAIL
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
      <Clock size={12} /> Pending
    </span>
  );
}

function StatCard({ label, value, sub, color = '#1A73E8', icon: Icon }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: color + '18' }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-bold text-[#0D1B2A]">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div className="inline-block border-2 border-gray-200 border-t-[#1A73E8] rounded-full animate-spin"
      style={{ width: size, height: size }} />
  );
}

// ═══════════════════════════════════════════════════════════
// LOGIN PAGE
// ═══════════════════════════════════════════════════════════

export function LoginPage() {
  const [email, setEmail] = useState('admin@greenpackpro.local');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const { login, isLoading, token } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => { if (token) navigate('/dashboard'); }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password. Check that the Greenpack Pro backend is running.');
    }
  }

  return (
    <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-[#00C2CB] items-center justify-center mb-4">
            <span className="text-black font-black text-2xl">GP</span>
          </div>
          <h1 className="text-3xl font-black text-white">Greenpack Pro</h1>
          <p className="text-[#00C2CB] text-sm mt-1">Label Print Inspection System</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-[#0D1B2A] mb-6">Sign In</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                placeholder="admin@greenpackpro.local" required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                required />
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full py-2.5 bg-[#1A73E8] text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
              {isLoading ? <><Spinner size={16} /> Signing in...</> : 'Sign In'}
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-4">
            Default: admin@greenpackpro.local / Admin123!
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// DASHBOARD PAGE - FIXED VERSION
// ═══════════════════════════════════════════════════════════

export function DashboardPage() {
  const navigate = useNavigate();
  
  // Fetch dashboard stats with error handling
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({ 
    queryKey: ['dashboard-stats'], 
    queryFn: dashboardApi.stats,
    refetchInterval: 30000,
    retry: 1,
  });
  
  // Fetch recent jobs
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({ 
    queryKey: ['jobs-recent'], 
    queryFn: () => jobsApi.list({ limit: 10 }),
    retry: 1,
  });

  // Calculate stats from jobs if backend stats are not available
  const calculatedStats = React.useMemo(() => {
    if (stats && stats.today_total !== undefined) {
      return stats;
    }
    
    // Fallback: calculate from recent jobs
    const today = new Date().toDateString();
    const todayJobs = jobs.filter((job: any) => {
      const jobDate = job.created_at ? new Date(job.created_at).toDateString() : '';
      return jobDate === today;
    });
    
    const todayPass = todayJobs.filter((j: any) => j.pass_fail === true).length;
    const todayFail = todayJobs.filter((j: any) => j.pass_fail === false).length;
    const todayTotal = todayJobs.length;
    const passRate = todayTotal > 0 ? (todayPass / todayTotal * 100) : 0;
    const avgScore = todayJobs.length > 0 
      ? todayJobs.reduce((sum: number, j: any) => sum + (j.overall_score || 0), 0) / todayJobs.length 
      : 0;
    
    return {
      today_total: todayTotal,
      today_pass: todayPass,
      today_fail: todayFail,
      pass_rate: Math.round(passRate),
      avg_score: avgScore.toFixed(1),
    };
  }, [stats, jobs]);

  // Log error if stats endpoint fails
  if (statsError) {
    console.warn('Dashboard stats endpoint error:', statsError);
  }

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Today's label inspection overview"
        action={
          <button onClick={() => navigate('/new-inspection')}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A73E8] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
            <Plus size={16} /> New Inspection
          </button>
        }
      />
      <div className="p-8 space-y-8">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Today's Jobs" 
            value={calculatedStats?.today_total ?? 0} 
            icon={ClipboardList} 
            color="#1A73E8" 
          />
          <StatCard 
            label="Passed" 
            value={calculatedStats?.today_pass ?? 0} 
            icon={CheckCircle2} 
            color="#22A06B" 
          />
          <StatCard 
            label="Failed" 
            value={calculatedStats?.today_fail ?? 0} 
            icon={XCircle} 
            color="#E5383B" 
          />
          <StatCard 
            label="Pass Rate" 
            value={calculatedStats?.pass_rate ?? 0} 
            icon={TrendingUp}
            color={calculatedStats?.pass_rate >= 90 ? '#22A06B' : calculatedStats?.pass_rate >= 75 ? '#F4A22D' : '#E5383B'}
            sub={calculatedStats?.avg_score ? `Avg score: ${calculatedStats.avg_score}` : ''} 
          />
        </div>

        {/* Loading state */}
        {(statsLoading || jobsLoading) && jobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <Spinner size={40} />
            <p className="text-gray-500 mt-4">Loading dashboard data...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-500">No inspections yet</h3>
            <p className="text-gray-400 text-sm mt-1">Create your first label inspection to see stats here</p>
            <button onClick={() => navigate('/new-inspection')}
              className="mt-4 px-4 py-2 bg-[#1A73E8] text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
              Start First Inspection
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-[#0D1B2A]">Recent Inspections</h2>
              <button onClick={() => navigate('/jobs')} className="text-sm text-[#1A73E8] hover:underline flex items-center gap-1">
                View all <ChevronRight size={14} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0D1B2A] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-xs">Job Ref</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs">Product</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs">Client</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs">Score</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs"></th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.slice(0, 10).map((job: any, i: number) => (
                    <tr key={job.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F0F6FF]'}>
                      <td className="px-4 py-3 font-mono text-xs text-[#1A73E8]">{job.job_ref}</td>
                      <td className="px-4 py-3 font-medium">{job.product_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{job.client_name || '—'}</td>
                      <td className="px-4 py-3">
                        {job.overall_score != null ? (
                          <span className={clsx('font-bold', job.overall_score >= 75 ? 'text-green-600' : 'text-red-600')}>
                            {job.overall_score.toFixed(1)}
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {job.status === 'processing' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600">
                            <Spinner size={12} /> Processing
                          </span>
                        ) : job.status === 'completed' ? (
                          <StatusBadge pass={job.pass_fail} />
                        ) : job.status === 'failed' ? (
                          <span className="text-xs font-bold text-red-500">ERROR</span>
                        ) : (
                          <span className="text-xs text-gray-400">Queued</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {job.created_at ? new Date(job.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {job.status === 'completed' && (
                          <button onClick={() => navigate(`/jobs/${job.id}/result`)}
                            className="text-xs text-[#1A73E8] hover:underline flex items-center gap-1">
                            <Eye size={12} /> View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Fix missing import
import { ClipboardList } from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// NEW INSPECTION PAGE
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// NEW INSPECTION PAGE - FIXED VERSION
// ═══════════════════════════════════════════════════════════

export function NewInspectionPage() {
  const navigate = useNavigate();
  const [masterFile, setMasterFile] = useState<File | null>(null);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [jobRef, setJobRef] = useState(() => `JOB-${new Date().toISOString().slice(0,10)}-001`);
  const [clientName, setClientName] = useState('');
  const [productName, setProductName] = useState('');
  const [colorThreshold, setColorThreshold] = useState(2.0);
  const [ssimThreshold, setSsimThreshold] = useState(0.75);
  const [selectedScanner, setSelectedScanner] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [previewFrame, setPreviewFrame] = useState<string | null>(null);

  const { data: scannersData } = useQuery({ queryKey: ['scanners'], queryFn: scannersApi.list });
  const scanners = scannersData?.scanners || [];

  const masterInputRef = React.useRef<HTMLInputElement>(null);
  const scanInputRef = React.useRef<HTMLInputElement>(null);

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

  async function handleScan() {
    if (!selectedScanner) { toast.error('Select a scanner first'); return; }
    setIsScanning(true);
    try {
      const result = await scannersApi.capture(selectedScanner);
      toast.success('Label scanned successfully');
      toast.success(`Scan saved: ${result.image_path}`);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Scanner error — check USB connection');
    } finally {
      setIsScanning(false);
    }
  }

  const createMutation = useMutation({
    mutationFn: (fd: FormData) => jobsApi.create(fd),
    onSuccess: (data) => {
      toast.success('Inspection started!');
      navigate(`/jobs/${data.job_id}/result`);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.detail || 'Failed to create job');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!masterFile) { toast.error('Upload master PDF'); return; }
    if (!scanFile) { toast.error('Upload or scan the printed label'); return; }
    const fd = new FormData();
    fd.append('master_file', masterFile);
    fd.append('scan_file', scanFile);
    fd.append('job_ref', jobRef);
    fd.append('client_name', clientName);
    fd.append('product_name', productName);
    fd.append('color_threshold', String(colorThreshold));
    fd.append('ssim_threshold', String(ssimThreshold));
    createMutation.mutate(fd);
  }

  function FileUploadCard({ 
    file, 
    onFileChange, 
    inputRef, 
    label, 
    icon, 
    accept 
  }: { 
    file: File | null;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    inputRef: React.RefObject<HTMLInputElement>;
    label: string;
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
            <div className="text-4xl">{icon}</div>
            <p className="font-medium text-gray-700 text-sm">{label}</p>
            <p className="text-xs text-gray-500">PDF, PNG, JPG, TIFF, BMP</p>
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
      <PageHeader title="New Inspection" subtitle="Compare master label against printed scan" />
      <div className="p-8 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Scanner strip */}
          {scanners.length > 0 && (
            <div className="bg-[#0078D4] rounded-xl p-4 flex items-center gap-4 text-white">
              <Scan size={20} />
              <div className="flex-1">
                <p className="text-sm font-semibold">Scanner Available</p>
                <select value={selectedScanner} onChange={e => setSelectedScanner(e.target.value)}
                  className="mt-1 bg-white/20 border border-white/30 rounded px-2 py-1 text-xs text-white">
                  <option value="">Select scanner...</option>
                  {scanners.map((s: any) => (
                    <option key={s.device} value={s.device}>{s.name} ({s.type})</option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={handleScan} disabled={isScanning || !selectedScanner}
                className="px-4 py-2 bg-white text-[#0078D4] rounded-lg text-sm font-bold hover:bg-gray-100 transition disabled:opacity-50 flex items-center gap-2">
                {isScanning ? <><Spinner size={14} /> Scanning...</> : <><Camera size={14} /> Scan Now</>}
              </button>
            </div>
          )}

          {/* File upload zones - FIXED */}
          <div className="grid grid-cols-2 gap-4">
            <FileUploadCard
              file={masterFile}
              onFileChange={handleMasterFileChange}
              inputRef={masterInputRef}
              label="Master PDF / Image (approved design)"
              icon="📄"
              accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp"
            />
            <FileUploadCard
              file={scanFile}
              onFileChange={handleScanFileChange}
              inputRef={scanInputRef}
              label="Scanned printed label"
              icon="📷"
              accept=".png,.jpg,.jpeg,.tiff,.bmp"
            />
          </div>

          {/* Job configuration */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-[#0D1B2A]">Job Configuration</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Job Reference</label>
                <input value={jobRef} onChange={e => setJobRef(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8]" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Client Name</label>
                <input value={clientName} onChange={e => setClientName(e.target.value)}
                  placeholder="e.g. Nestlé, Unilever"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8]" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Product Name</label>
                <input value={productName} onChange={e => setProductName(e.target.value)}
                  placeholder="e.g. Maggi Noodles 70g"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8]" />
              </div>
            </div>

            {/* Quality thresholds */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">
                  Color Tolerance ΔE: <span className="text-[#1A73E8]">{colorThreshold}</span>
                </label>
                <input type="range" min="0.5" max="5" step="0.1" value={colorThreshold}
                  onChange={e => setColorThreshold(Number(e.target.value))}
                  className="w-full accent-[#1A73E8]" />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0.5 (Strict)</span><span>5.0 (Relaxed)</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">
                  SSIM Threshold: <span className="text-[#1A73E8]">{ssimThreshold}</span>
                </label>
                <input type="range" min="0.5" max="0.99" step="0.01" value={ssimThreshold}
                  onChange={e => setSsimThreshold(Number(e.target.value))}
                  className="w-full accent-[#1A73E8]" />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0.50 (Lenient)</span><span>0.99 (Strict)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button type="submit"
            disabled={!masterFile || !scanFile || createMutation.isPending}
            className="w-full py-3 bg-[#1A73E8] text-white rounded-xl font-bold text-base hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {createMutation.isPending ? (
              <><Spinner size={18} /> Starting inspection...</>
            ) : (
              <><BarChart3 size={18} /> Start Inspection</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// RESULT PAGE
// ═══════════════════════════════════════════════════════════

export function ResultPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all'|'ocr'|'color'|'barcode'|'defects'>('all');

  const { data: job, refetch: refetchJob } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsApi.get(jobId!),
    refetchInterval: (data: any) => data?.status === 'processing' ? 3000 : false,
  });

  const { data: result } = useQuery({
    queryKey: ['job-result', jobId],
    queryFn: () => jobsApi.getResult(jobId!),
    enabled: job?.status === 'completed',
  });

  const API_BASE = 'https://greenpack-backend.onrender.com';

  async function downloadReport() {
    try {
      const blob = await jobsApi.downloadReport(jobId!);
      downloadBlob(blob, `report_${jobId?.slice(0,8)}.pdf`);
      toast.success('Report downloaded');
    } catch { toast.error('Download failed'); }
  }

  async function downloadExcel() {
    try {
      const blob = await jobsApi.downloadExcel(jobId!);
      downloadBlob(blob, `results_${jobId?.slice(0,8)}.xlsx`);
      toast.success('Excel downloaded');
    } catch { toast.error('Download failed'); }
  }

  async function printReport() {
    try {
      await jobsApi.print(jobId!);
      toast.success('Sent to printer');
    } catch { toast.error('Print failed'); }
  }

  if (!job) return <div className="flex items-center justify-center h-full"><Spinner size={32} /></div>;

  const isProcessing = job.status === 'processing' || job.status === 'queued';

  if (isProcessing) return (
    <div>
      <PageHeader title={`Inspection: ${job.job_ref}`} subtitle="Processing..." />
      <div className="flex flex-col items-center justify-center h-96 gap-6">
        <div className="w-16 h-16 bg-[#1A73E8]/10 rounded-2xl flex items-center justify-center">
          <Spinner size={32} />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-[#0D1B2A]">Analyzing Label</h3>
          <p className="text-gray-500 text-sm mt-2">Running OCR, color analysis, SSIM and barcode checks...</p>
          <p className="text-gray-400 text-xs mt-1">This typically takes 20–40 seconds</p>
        </div>
        <div className="space-y-2 w-64">
          {['Pre-processing', 'Image alignment', 'OCR extraction', 'Color analysis', 'Defect detection', 'Barcode verification', 'Generating report'].map((step, i) => (
            <div key={step} className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded-full bg-[#1A73E8]/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#1A73E8] animate-pulse" />
              </div>
              <span className="text-gray-600">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (job.status === 'failed') return (
    <div>
      <PageHeader title={`Inspection: ${job.job_ref}`} />
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <XCircle size={48} className="text-red-500" />
        <h3 className="text-xl font-bold text-[#0D1B2A]">Inspection Failed</h3>
        <p className="text-gray-500 text-sm max-w-md text-center">{job.error_message}</p>
        <button onClick={() => navigate('/new-inspection')}
          className="px-4 py-2 bg-[#1A73E8] text-white rounded-lg text-sm font-semibold">
          Try Again
        </button>
      </div>
    </div>
  );

  const score = result?.overall_score ?? 0;
  const tabs = [
    { id: 'all', label: 'All Errors', count: (result?.ocr_errors?.length || 0) + (result?.defects?.length || 0) + result?.barcode_results?.filter((b: any) => !b.pass).length || 0 },
    { id: 'ocr', label: 'OCR / Text', count: result?.ocr_errors?.length || 0 },
    { id: 'color', label: 'Color', count: result?.color_results?.filter((z: any) => !z.pass).length || 0 },
    { id: 'barcode', label: 'Barcodes', count: result?.barcode_results?.length || 0 },
    { id: 'defects', label: 'Defects', count: result?.defects?.length || 0 },
  ];

  return (
    <div>
      <PageHeader title={`Result: ${job.job_ref}`} subtitle={job.product_name || ''}
        action={
          <div className="flex items-center gap-2">
            <button onClick={downloadReport} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition">
              <Download size={14} /> PDF
            </button>
            <button onClick={downloadExcel} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition">
              <FileText size={14} /> Excel
            </button>
            <button onClick={printReport} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition">
              <Printer size={14} /> Print
            </button>
          </div>
        }
      />
      <div className="p-8 space-y-6">

        {/* Score header */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-8">
            <ScoreRing score={score} size={100} />
            <div className="flex-1 grid grid-cols-4 gap-4">
              {[
                { label: 'OCR / Text', value: result?.ocr_score, icon: '📝' },
                { label: 'Color', value: result?.color_score, icon: '🎨' },
                { label: 'Print Quality', value: result?.ssim_score_weighted, icon: '🔍' },
                { label: 'Barcodes', value: result?.barcode_score, icon: '🔲' },
              ].map(({ label, value, icon }) => (
                <div key={label} className="text-center p-3 rounded-lg bg-gray-50">
                  <div className="text-lg">{icon}</div>
                  <div className={clsx('text-xl font-bold mt-1', (value ?? 0) >= 75 ? 'text-green-600' : 'text-red-600')}>
                    {value?.toFixed(0) ?? '—'}
                  </div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              ))}
            </div>
            <div className="text-right">
              <StatusBadge pass={result?.pass_fail} />
              <div className="text-xs text-gray-400 mt-2">
                Alignment: {((result?.alignment_confidence || 0) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* Annotated image */}
        {result?.annotated_image_path && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-[#0D1B2A]">
              Label Comparison (Master left | Scan with annotations right)
            </div>
            <div className="p-4">
              <img
                src={`${API_BASE}/reports/${encodeURIComponent(result.annotated_image_path.split('/').pop())}`}
                alt="Annotated comparison"
                className="w-full rounded-lg border border-gray-100"
                onError={(e: any) => { e.target.style.display = 'none'; }}
              />
            </div>
          </div>
        )}

        {/* Results tabs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  'px-4 py-3 text-sm font-medium border-b-2 transition flex items-center gap-2',
                  activeTab === tab.id
                    ? 'border-[#1A73E8] text-[#1A73E8]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}>
                {tab.label}
                {tab.count > 0 && (
                  <span className={clsx('text-xs px-1.5 py-0.5 rounded-full font-bold',
                    tab.count > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500')}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="p-4">
            {/* OCR Errors */}
            {(activeTab === 'all' || activeTab === 'ocr') && (
              <div className="space-y-2">
                {result?.ocr_errors?.length === 0 && activeTab === 'ocr' && (
                  <div className="text-center py-8 text-green-600">
                    <CheckCircle2 size={32} className="mx-auto mb-2" />
                    <p className="font-semibold">No text errors detected</p>
                  </div>
                )}
                {result?.ocr_errors?.map((err: any, i: number) => (
                  <div key={i} className={clsx('p-3 rounded-lg border', err.severity === 'high' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200')}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={clsx('text-xs font-bold px-2 py-0.5 rounded', err.severity === 'high' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800')}>
                        {err.type}
                      </span>
                      <span className="text-xs text-gray-500">{err.severity} severity</span>
                    </div>
                    <div className="flex gap-4 text-sm font-mono">
                      <span>Master: <strong className="text-green-700">"{err.master_text}"</strong></span>
                      <span>Scan: <strong className="text-red-700">"{err.scan_text}"</strong></span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{err.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Barcode results */}
            {(activeTab === 'all' || activeTab === 'barcode') && result?.barcode_results?.length > 0 && (
              <div className="space-y-2 mt-4">
                <h4 className="font-semibold text-sm text-[#0D1B2A]">Barcode Verification</h4>
                {result.barcode_results.map((bc: any, i: number) => (
                  <div key={i} className={clsx('p-3 rounded-lg border flex items-center gap-4', bc.pass ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
                    <div className="text-2xl">🔲</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{bc.type}</span>
                        <span className="font-mono text-sm">{bc.decoded_value}</span>
                        <StatusBadge pass={bc.pass} />
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex gap-4">
                        <span>Check digit: {bc.check_digit_valid ? '✅' : '❌'}</span>
                        <span>Quality: Grade {bc.quality_grade}</span>
                        {bc.expected_value && <span>Expected: {bc.expected_value}</span>}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{bc.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Color results */}
            {(activeTab === 'all' || activeTab === 'color') && result?.color_results?.length > 0 && (
              <div className="space-y-2 mt-4">
                <h4 className="font-semibold text-sm text-[#0D1B2A]">Color Zone Analysis</h4>
                <div className="grid grid-cols-3 gap-2">
                  {result.color_results.map((zone: any, i: number) => (
                    <div key={i} className={clsx('p-3 rounded-lg border text-sm', zone.pass ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-4 h-4 rounded" style={{ background: zone.color_rgb ? `rgb(${zone.color_rgb.join(',')})` : '#ccc' }} />
                        <span className="font-semibold text-xs">{zone.zone_name}</span>
                        <StatusBadge pass={zone.pass} />
                      </div>
                      <div className="text-xs text-gray-600">
                        ΔE: <strong>{zone.mean_delta_e?.toFixed(2)}</strong>
                        {' '}(max: {zone.max_delta_e?.toFixed(2)})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Defects */}
            {(activeTab === 'all' || activeTab === 'defects') && (
              <div className="space-y-2 mt-4">
                {result?.defects?.length === 0 ? (
                  activeTab === 'defects' && (
                    <div className="text-center py-8 text-green-600">
                      <CheckCircle2 size={32} className="mx-auto mb-2" />
                      <p className="font-semibold">No print defects detected</p>
                      <p className="text-xs text-gray-400 mt-1">SSIM score: {result?.ssim_score?.toFixed(4)}</p>
                    </div>
                  )
                ) : result?.defects?.map((d: any, i: number) => (
                  <div key={i} className={clsx('p-3 rounded-lg border flex gap-3',
                    d.severity === 'critical' ? 'bg-red-50 border-red-300' :
                    d.severity === 'high' ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200')}>
                    <AlertTriangle size={16} className={d.severity === 'critical' ? 'text-red-600 mt-0.5' : 'text-orange-600 mt-0.5'} />
                    <div>
                      <span className="font-semibold capitalize text-sm">{d.type}</span>
                      <span className="text-xs text-gray-500 ml-2">{d.severity} severity</span>
                      <p className="text-xs text-gray-600 mt-0.5">
                        At position ({d.bbox?.x}, {d.bbox?.y}) — {d.area_pixels} px²
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// JOBS LIST PAGE
// ═══════════════════════════════════════════════════════════

export function JobsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs', statusFilter],
    queryFn: () => jobsApi.list({ status: statusFilter || undefined, limit: 100 }),
  });

  const filtered = jobs.filter((j: any) =>
    !search || j.job_ref?.toLowerCase().includes(search.toLowerCase()) ||
    j.product_name?.toLowerCase().includes(search.toLowerCase()) ||
    j.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="All Inspections" subtitle={`${jobs.length} total jobs`}
        action={
          <button onClick={() => navigate('/new-inspection')}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A73E8] text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
            <Plus size={16} /> New Inspection
          </button>
        }
      />
      <div className="p-8 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8]" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8]">
            <option value="">All statuses</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Spinner size={32} /></div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400">No jobs found</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#0D1B2A] text-white">
                <tr>
                  {['Job Ref', 'Product', 'Client', 'Source', 'Score', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((job: any, i: number) => (
                  <tr key={job.id} className={i % 2 === 0 ? 'bg-white hover:bg-[#F0F6FF]' : 'bg-[#F0F6FF] hover:bg-blue-50'}>
                    <td className="px-4 py-3 font-mono text-xs text-[#1A73E8] font-semibold">{job.job_ref}</td>
                    <td className="px-4 py-3">{job.product_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{job.client_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">{job.input_source}</span>
                    </td>
                    <td className="px-4 py-3">
                      {job.overall_score != null ? (
                        <span className={clsx('font-bold', job.overall_score >= 75 ? 'text-green-600' : 'text-red-600')}>
                          {job.overall_score.toFixed(1)}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {job.status === 'processing' ? (
                        <span className="text-xs font-bold text-blue-600 flex items-center gap-1"><Spinner size={10} /> Processing</span>
                      ) : job.status === 'completed' ? (
                        <StatusBadge pass={job.pass_fail} />
                      ) : job.status === 'failed' ? (
                        <span className="text-xs font-bold text-red-500">ERROR</span>
                      ) : (
                        <span className="text-xs text-gray-400">Queued</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {job.created_at ? new Date(job.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {job.status === 'completed' && (
                        <button onClick={() => navigate(`/jobs/${job.id}/result`)}
                          className="text-xs text-[#1A73E8] hover:underline flex items-center gap-1">
                          <Eye size={12} /> View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TEMPLATES PAGE
// ═══════════════════════════════════════════════════════════

export function TemplatesPage() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ client_name: '', product_name: '', version: '1.0' });
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', search],
    queryFn: () => templatesApi.list({ search: search || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (fd: FormData) => templatesApi.create(fd),
    onSuccess: () => {
      toast.success('Template created');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowCreate(false);
      setTemplateFile(null);
      setNewTemplate({ client_name: '', product_name: '', version: '1.0' });
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templatesApi.delete(id),
    onSuccess: () => {
      toast.success('Template deactivated');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const drop = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'image/*': [] },
    maxFiles: 1,
    onDrop: (files) => setTemplateFile(files[0]),
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!templateFile) { toast.error('Upload a master PDF'); return; }
    const fd = new FormData();
    fd.append('file', templateFile);
    Object.entries(newTemplate).forEach(([k, v]) => fd.append(k, v));
    createMutation.mutate(fd);
  }

  return (
    <div>
      <PageHeader title="Template Library" subtitle="Saved master label templates for quick loading"
        action={
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A73E8] text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
            <Plus size={16} /> Add Template
          </button>
        }
      />
      <div className="p-8 space-y-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8]" />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Spinner size={32} /></div>
        ) : templates.length === 0 ? (
          <div className="py-20 text-center">
            <BookOpen size={48} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-bold text-gray-400">No templates yet</h3>
            <p className="text-sm text-gray-400 mt-1">Save approved master PDFs for one-click loading</p>
            <button onClick={() => setShowCreate(true)}
              className="mt-4 px-4 py-2 bg-[#1A73E8] text-white rounded-lg text-sm font-semibold">
              Add First Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {templates.map((t: any) => (
              <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition">
                <div className="h-32 bg-gradient-to-br from-[#F0F6FF] to-[#E8EEF4] flex items-center justify-center">
                  {t.thumbnail_path ? (
                    <img src={`https://greenpack-backend.onrender.com/reports/${t.thumbnail_path.split('/').pop()}`}
                      alt="Template thumbnail" className="h-full w-full object-contain" />
                  ) : (
                    <FileText size={40} className="text-gray-300" />
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-[#1A73E8]/10 text-[#1A73E8] rounded font-semibold">{t.client_name}</span>
                    <span className="text-xs text-gray-400">v{t.version}</span>
                  </div>
                  <h3 className="font-bold text-sm text-[#0D1B2A] leading-tight">{t.product_name}</h3>
                  <div className="text-xs text-gray-400">
                    ΔE: {t.color_threshold} | SSIM: {t.ssim_threshold}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button className="flex-1 py-1.5 bg-[#1A73E8] text-white rounded-lg text-xs font-semibold hover:bg-blue-700">
                      Use Template
                    </button>
                    <button onClick={() => deleteMutation.mutate(t.id)}
                      className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-200">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#0D1B2A]">Add New Template</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div {...drop.getRootProps()}
                className={clsx('border-2 border-dashed rounded-xl p-4 text-center cursor-pointer',
                  drop.isDragActive ? 'border-[#1A73E8] bg-blue-50' : templateFile ? 'border-green-400 bg-green-50' : 'border-gray-200')}>
                <input {...drop.getInputProps()} />
                {templateFile ? (
                  <p className="text-sm text-green-700 font-medium">{templateFile.name}</p>
                ) : (
                  <p className="text-sm text-gray-500">Drop master PDF here</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Client Name *</label>
                  <input value={newTemplate.client_name} onChange={e => setNewTemplate(p => ({...p, client_name: e.target.value}))}
                    required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Version</label>
                  <input value={newTemplate.version} onChange={e => setNewTemplate(p => ({...p, version: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8]" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Product Name *</label>
                <input value={newTemplate.product_name} onChange={e => setNewTemplate(p => ({...p, product_name: e.target.value}))}
                  required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createMutation.isPending}
                  className="flex-1 py-2 bg-[#1A73E8] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                  {createMutation.isPending ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// BATCH PAGE, REPORTS PAGE, SETTINGS PAGE (simplified)
// ═══════════════════════════════════════════════════════════

export function BatchPage() {
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsApi.get });
  return (
    <div>
      <PageHeader title="Batch Queue" subtitle="Process multiple labels automatically" />
      <div className="p-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <Package size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="text-lg font-bold text-gray-500">Batch Processing</h3>
          <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
            Use the REST API POST /api/v1/batch to queue multiple jobs programmatically.
            In production, this screen shows batch progress and history.
          </p>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
            <p className="text-xs font-mono text-gray-600">
              POST /api/v1/batch<br/>
              {'{'}"name": "Night Run", "items": [...]{'}'}<br/><br/>
              GET /api/v1/batch/{'{batch_id}'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReportsPage() {
  const navigate = useNavigate();
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.list({ limit: 100 }),
  });

  return (
    <div>
      <PageHeader title="Reports" subtitle="Download QC reports and exports" />
      <div className="p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Spinner size={32} /></div>
        ) : reports.length === 0 ? (
          <div className="py-20 text-center">
            <FileText size={48} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-bold text-gray-400">No reports yet</h3>
            <p className="text-sm text-gray-400 mt-1">Reports are generated automatically after each inspection</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#0D1B2A] text-white">
                <tr>
                  {['Job Ref', 'Product', 'Client', 'Score', 'Status', 'Date', 'Downloads'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r: any, i: number) => (
                  <tr key={r.job_id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F0F6FF]'}>
                    <td className="px-4 py-3 font-mono text-xs text-[#1A73E8]">{r.job_ref}</td>
                    <td className="px-4 py-3">{r.product_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{r.client_name || '—'}</td>
                    <td className="px-4 py-3 font-bold text-sm">
                      <span className={r.overall_score >= 75 ? 'text-green-600' : 'text-red-600'}>
                        {r.overall_score?.toFixed(1) ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge pass={r.pass_fail} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/jobs/${r.job_id}/result`)}
                          className="text-xs text-[#1A73E8] hover:underline flex items-center gap-1">
                          <Eye size={12} /> View
                        </button>
                        {r.has_pdf && (
                          <button onClick={async () => {
                            const blob = await jobsApi.downloadReport(r.job_id);
                            downloadBlob(blob, `report_${r.job_ref}.pdf`);
                          }} className="text-xs text-green-600 hover:underline flex items-center gap-1">
                            <Download size={12} /> PDF
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { data: settings, isLoading } = useQuery({ queryKey: ['settings'], queryFn: settingsApi.get });
  const { data: backupsData } = useQuery({ queryKey: ['backups'], queryFn: settingsApi.getBackups });
  const [activeTab, setActiveTab] = useState('general');

  const backupMutation = useMutation({
    mutationFn: settingsApi.createBackup,
    onSuccess: () => { toast.success('Backup created successfully'); },
    onError: () => toast.error('Backup failed'),
  });

  const cleanupMutation = useMutation({
    mutationFn: settingsApi.runCleanup,
    onSuccess: (data: any) => toast.success(`Cleaned up: freed ${data.freed_mb} MB`),
    onError: () => toast.error('Cleanup failed'),
  });

  const settingsTabs = ['general', 'backups', 'users'];

  if (isLoading) return <div className="flex items-center justify-center h-full"><Spinner size={32} /></div>;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure Greenpack Pro" />
      <div className="flex h-full">
        {/* Settings nav */}
        <div className="w-48 border-r border-gray-100 p-4 bg-white">
          {settingsTabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={clsx('w-full text-left px-3 py-2 rounded-lg text-sm font-medium capitalize mb-1',
                activeTab === tab ? 'bg-[#1A73E8] text-white' : 'text-gray-600 hover:bg-gray-100')}>
              {tab}
            </button>
          ))}
        </div>

        {/* Settings content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'general' && settings && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-[#0D1B2A] mb-4">System Information</h3>
                <div className="space-y-3 text-sm">
                  {[
                    ['Mode', settings.mode],
                    ['Version', settings.version],
                    ['Default Color Tolerance', `ΔE ${settings.default_color_threshold}`],
                    ['Default SSIM Threshold', settings.default_ssim_threshold],
                    ['Default Scan DPI', settings.default_scan_dpi],
                    ['Report Retention', `${settings.report_retention_days} days`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-gray-500">{k}</span>
                      <span className="font-medium text-[#0D1B2A]">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {settings.disk && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="font-bold text-[#0D1B2A] mb-4">Disk Space</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Free Space</span>
                      <span className={clsx('font-bold',
                        settings.disk.status === 'critical' ? 'text-red-600' :
                        settings.disk.status === 'warning' ? 'text-yellow-600' : 'text-green-600')}>
                        {settings.disk.free_gb} GB
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 rounded-full bg-[#1A73E8]"
                        style={{ width: `${((settings.disk.used_gb || 0) / (settings.disk.total_gb || 1)) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{settings.disk.used_gb} GB used</span>
                      <span>{settings.disk.total_gb} GB total</span>
                    </div>
                  </div>
                  <button onClick={() => cleanupMutation.mutate()} disabled={cleanupMutation.isPending}
                    className="mt-4 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
                    {cleanupMutation.isPending ? 'Cleaning...' : 'Clean Old Reports'}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'backups' && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#0D1B2A]">Database Backups</h3>
                  <button onClick={() => backupMutation.mutate()} disabled={backupMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">
                    {backupMutation.isPending ? <Spinner size={14} /> : <RefreshCw size={14} />}
                    Backup Now
                  </button>
                </div>
                {backupsData?.backups?.length === 0 ? (
                  <p className="text-sm text-gray-400">No backups yet</p>
                ) : (
                  <div className="space-y-2">
                    {backupsData?.backups?.slice(0, 10).map((b: any) => (
                      <div key={b.filename} className="flex items-center justify-between py-2 border-b border-gray-50 text-sm">
                        <div>
                          <span className="font-mono text-xs text-gray-600">{b.filename}</span>
                          <span className="ml-3 text-xs text-gray-400">{b.size_mb} MB</span>
                          {b.verified && <span className="ml-2 text-xs text-green-600">✅ Verified</span>}
                        </div>
                        <span className="text-xs text-gray-400">{new Date(b.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && <UsersTab />}
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: usersApi.list });
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '', role: 'inspector' });

  const createMutation = useMutation({
    mutationFn: () => usersApi.create(newUser),
    onSuccess: () => {
      toast.success('User created');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreate(false);
      setNewUser({ email: '', password: '', full_name: '', role: 'inspector' });
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  });

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#0D1B2A]">User Management</h3>
          <button onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1A73E8] text-white rounded-lg text-xs font-semibold hover:bg-blue-700">
            <Plus size={14} /> Add User
          </button>
        </div>

        {showCreate && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Email" value={newUser.email} onChange={e => setNewUser(p => ({...p, email: e.target.value}))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <input placeholder="Password" type="password" value={newUser.password} onChange={e => setNewUser(p => ({...p, password: e.target.value}))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <input placeholder="Full Name" value={newUser.full_name} onChange={e => setNewUser(p => ({...p, full_name: e.target.value}))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <select value={newUser.role} onChange={e => setNewUser(p => ({...p, role: e.target.value}))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="inspector">Inspector</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                <option value="client">Client</option>
              </select>
            </div>
            <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
              className="px-4 py-2 bg-[#1A73E8] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {createMutation.isPending ? 'Creating...' : 'Create User'}
            </button>
          </div>
        )}

        <div className="space-y-2">
          {users.map((u: any) => (
            <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-50">
              <div>
                <span className="font-medium text-sm">{u.full_name || u.email}</span>
                <span className="text-xs text-gray-400 ml-2">{u.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={clsx('text-xs px-2 py-0.5 rounded-full font-semibold capitalize',
                  u.role === 'admin' ? 'bg-red-100 text-red-700' :
                  u.role === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600')}>
                  {u.role}
                </span>
                <span className={clsx('w-2 h-2 rounded-full', u.active ? 'bg-green-500' : 'bg-gray-300')} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useParams } from 'react-router-dom';
import { usersApi } from '@/lib/api';

// Default exports for routing
export default LoginPage;
