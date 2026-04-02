"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
  Database, 
  Cloud, 
  ArrowRight, 
  History, 
  ShieldCheck, 
  ExternalLink,
  Download,
  AlertCircle,
  Clock,
  HardDrive,
  FileText,
  Table,
  FileCode,
  Eye,
  XCircle,
  Loader2
} from "lucide-react";

interface Backup {
  id: string;
  fileName: string;
  date: string;
  sizeMB: number;
  status: string;
  s3Url: string | null;
  error?: string;
}

export default function BackupDashboard() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showDocs, setShowDocs] = useState(false);

  // Snapshot States
  const [viewMode, setViewMode] = useState<'live' | 'snapshot'>('live');
  const [mountingId, setMountingId] = useState<string | null>(null);
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [snapshotDb, setSnapshotDb] = useState<string | null>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [testTimeLeft, setTestTimeLeft] = useState(60);
  const [logs, setLogs] = useState("");
  const [testingScript, setTestingScript] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [pulse, setPulse] = useState<{ lastRun: string | null; status: string; error?: string }>({ lastRun: null, status: 'inactive' });
  const explorerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const nextBackup = new Date();
      nextBackup.setHours(2, 0, 0, 0);
      
      if (now.getHours() >= 2) {
        nextBackup.setDate(nextBackup.getDate() + 1);
      }
      
      const diff = nextBackup.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();
    return () => clearInterval(timer);
  }, []);

  // Test Timer Logic (60s countdown)
  useEffect(() => {
    const timer = setInterval(() => {
      setTestTimeLeft((prev) => {
        if (prev <= 1) return 60;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  const fetchBackups = () => {
    setLoading(true);
    fetch("/api/admin/backups")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setBackups(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBackups();
    fetchLogs();
    fetchHeartbeat();
    const interval = setInterval(fetchHeartbeat, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchHeartbeat = () => {
    fetch("/api/admin/backups/heartbeat")
      .then(res => res.json())
      .then(data => setPulse(data))
      .catch(() => {});
  };

  const fetchLogs = () => {
    fetch("/api/admin/backups/logs")
      .then(res => res.json())
      .then(data => setLogs(data.logs || "No logs available"))
      .catch(() => setLogs("Error fetching logs"));
  };

  const handleTestScript = async () => {
    try {
      setTestingScript(true);
      const res = await fetch("/api/admin/backups/test-script", { method: "POST" });
      const data = await res.json();
      fetchLogs(); // Refresh logs
      if (data.status === "success") {
        alert("Script test successful! Check logs below.");
      } else {
        alert("Script failed!\nError: " + (data.error || data.stderr || "Unknown error"));
      }
    } catch (err) {
      alert("Failed to run script test.");
    } finally {
      setTestingScript(false);
    }
  };


  const handleDownload = async (id: string, fileName: string) => {
    try {
      setDownloadingId(id);
      const res = await fetch(`/api/admin/backups/download?file=${encodeURIComponent(fileName)}`);
      const data = await res.json();
      
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        alert("Failed to generate download link");
      }
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleMountSnapshot = async (id: string, fileName: string, date: string) => {
    try {
      setMountingId(id);
      const res = await fetch("/api/admin/backups/snapshots/mount", {
        method: "POST",
        body: JSON.stringify({ fileName }),
      });
      const data = await res.json();

      if (data.tempDbName) {
        setSnapshotDb(data.tempDbName);
        setSnapshotLabel(new Date(date).toLocaleString());
        setViewMode('snapshot');
        // Scroll to explorer
        setTimeout(() => {
          explorerRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        alert("Mounting failed: " + (data.details || "Unknown error"));
      }
    } catch (error) {
      console.error("Mount error:", error);
    } finally {
      setMountingId(null);
    }
  };

  const handleExport = (format: 'excel' | 'json', model: string) => {
    let url = `/api/admin/backups/export?format=${format}&model=${model}`;
    if (viewMode === 'snapshot' && snapshotDb) {
      url += `&db=${snapshotDb}`;
    }
    window.open(url, "_blank");
  };

  const handleManualBackup = async () => {
    try {
      setBackingUp(true);
      const res = await fetch("/api/admin/backups/create", {
        method: "POST",
      });
      const data = await res.json();
      
      if (res.ok) {
        alert("Success: Manual backup created and uploaded to S3!");
        fetchBackups(); // Refresh list
      } else {
        alert("Backup failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Backup trigger error:", error);
      alert("Failed to connect to backup service");
    } finally {
      setBackingUp(false);
    }
  };


  const [collections, setCollections] = useState<{name: string, count: number}[]>([]);
  const [collectionSearch, setCollectionSearch] = useState("");
  const [loadingCols, setLoadingCols] = useState(true);

  // Fetch collections - depends on viewMode and snapshotDb
  useEffect(() => {
    setLoadingCols(true);
    let url = "/api/admin/backups/collections";
    if (viewMode === 'snapshot' && snapshotDb) {
      url += `?db=${snapshotDb}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCollections(data);
        setLoadingCols(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingCols(false);
      });
  }, [viewMode, snapshotDb]);

  const filteredCollections = collections.filter(c => 
    c.name.toLowerCase().includes(collectionSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 md:p-12 font-sans selection:bg-purple-500/30">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/20">
            <Database className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Database Backup Center
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-gray-400">Kravy POS Ultimate Security System</p>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 text-orange-400 font-mono text-[10px] bg-orange-400/10 px-3 py-1 rounded-full border border-orange-400/20 shadow-lg shadow-orange-500/5">
                  <Clock size={12} className="animate-pulse" />
                  <span>Auto-Backup In: {timeLeft}</span>
                </div>
                <div className="flex items-center gap-2 text-blue-400 font-mono text-[10px] bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20 shadow-lg shadow-blue-500/5">
                  <AlertCircle size={12} />
                  <span>Test Cycle: {testTimeLeft}s</span>
                </div>
                <div className={`flex items-center gap-2 font-mono text-[10px] px-3 py-1 rounded-full border shadow-lg ${
                  pulse.status === 'failed' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                  pulse.lastRun ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shadow-emerald-500/5' : 'text-gray-500 bg-gray-500/10 border-gray-500/20'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    pulse.status === 'failed' ? 'bg-red-400 animate-pulse' :
                    pulse.lastRun ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                  }`} />
                  <span>
                    {pulse.status === 'failed' ? `FAILED: ${pulse.error?.slice(0, 30)}...` : 
                     pulse.lastRun ? `Pulse: ${new Date(pulse.lastRun).toLocaleTimeString()}` : 'No Signal'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleManualBackup}
            disabled={backingUp}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl border transition-all font-medium ${
              backingUp 
              ? 'bg-purple-500/20 border-purple-500/30 text-purple-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-purple-600/10 to-blue-600/10 border-white/10 hover:border-purple-500/30 text-white hover:shadow-lg hover:shadow-purple-500/10'
            }`}
          >
            {backingUp ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Cloud className="w-4 h-4 text-purple-400" />
            )}
            {backingUp ? 'Backing up...' : 'Create Manual Backup'}
          </button>

            <button 
              onClick={() => setShowDocs(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium transition-all group"
            >
              <AlertCircle className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
              System Guide
            </button>
            <button 
              onClick={() => setShowDebug(!showDebug)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl border transition-all text-sm font-medium ${
                showDebug ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Cron Debugger
            </button>
          </div>
      </div>


      {/* DEBUG CONSOLE */}
      {showDebug && (
        <div className="max-w-7xl mx-auto mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="p-8 rounded-3xl border border-orange-500/20 bg-orange-500/5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-orange-400">Production Cron Debugger</h2>
                  <p className="text-xs text-gray-500">Find the real cause of auto-backup failures</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={fetchLogs}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all"
                >
                  Refresh Logs
                </button>
                <button 
                  onClick={handleTestScript}
                  disabled={testingScript}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl bg-orange-500 text-white text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50"
                >
                  {testingScript ? <Loader2 size={14} className="animate-spin" /> : <Table size={14} />}
                  Run Script Test Now
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Diagnostic Tips</h3>
                  <ul className="text-[11px] space-y-2 text-gray-400">
                    <li className="flex gap-2">
                       <span className="text-orange-400">⚡</span>
                       <span>If "Run Script Test" fails, the <b>Node/NPM</b> path is missing on your server.</span>
                    </li>
                    <li className="flex gap-2">
                       <span className="text-orange-400">⚡</span>
                       <span>Check if your production server has <b>mongodump</b> installed or uses pure JS script.</span>
                    </li>
                    <li className="flex gap-2">
                       <span className="text-orange-400">⚡</span>
                       <span>Look for <b>"Permission denied"</b> in logs - you might need to run: <br/><code>chmod +x scripts/backup/run-cron-backup.sh</code></span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 px-2">Recent Logs (backup.log)</h3>
                <div className="p-5 rounded-2xl bg-black/60 border border-white/5 font-mono text-[10px] h-[200px] overflow-y-auto custom-scrollbar text-gray-300">
                  <pre className="whitespace-pre-wrap">{logs}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDocs && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowDocs(false)} />
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-[#121215] border border-white/10 rounded-[32px] p-8 shadow-2xl custom-scrollbar">
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
              <div className="flex items-center gap-3">
                <FileText className="text-purple-400" />
                <h2 className="text-2xl font-bold">System Documentation & Guide</h2>
              </div>
              <button 
                onClick={() => setShowDocs(false)}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors"
              >
                <XCircle className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-10">
              {/* Feature 1 */}
              <section className="space-y-3">
                <h3 className="text-purple-300 font-bold flex items-center gap-2">
                  <Cloud className="w-4 h-4" /> 1. Daily automated Cloud Backup
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  System har din <span className="text-white font-medium">raat 2 baje (02:00 AM)</span> apne aap pura database dump karta hai aur use <span className="text-white font-medium">AWS S3 (US-EAST-1)</span> ke private bucket mein upload kar deta hai. 
                  Iska faida yeh hai ki agar aapka server crash ho jaye ya saara data delete ho jaye, toh aapka backup cloud mein safe rahega.
                </p>
              </section>

              {/* Feature 2 */}
              <section className="space-y-3">
                <h3 className="text-blue-300 font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> 2. S3 Vault & Secure Download
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Aapka cloud bucket 100% private hai. Jab aap "Download" button dabate hain, toh system ek <span className="text-white font-medium">Pre-signed URL</span> generate karta hai jo sirf kuch minutes ke liye valid hota hai. 
                  Isse koi bhi unauthorised person aapki backup file link ko chura nahi sakta.
                </p>
              </section>

              {/* Feature 3 */}
              <section className="space-y-3">
                <h3 className="text-emerald-300 font-bold flex items-center gap-2">
                  <Eye className="w-4 h-4" /> 3. Snapshot Mode (Magic Explore)
                </h3>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                  <p className="text-sm text-gray-400 leading-relaxed italic">
                    "Kya aapko sirf purane din ki ek excel dekhni hai bina full system restore kiye?"
                  </p>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Backup Vault mein jaake <span className="text-white font-medium">"Explore Backup"</span> button dabayein. 
                    System cloud se file utha kar ek <span className="text-white font-medium">Temple/Ghost Database</span> mein restore kar dega. 
                    Ab aap table explorer se kisi bhi table ka data dekh sakte hain jaise woh us din tha.
                  </p>
                </div>
              </section>

              {/* Feature 4 */}
              <section className="space-y-3">
                <h3 className="text-orange-300 font-bold flex items-center gap-2">
                  <Table className="w-4 h-4" /> 4. Live Collections Explorer
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Yeh page ka sabse advanced part hai. Yeh real-time database se connected hai. 
                  Aap <span className="text-white font-medium">Search</span> kar sakte hain kisi bhi table ko aur uska <span className="text-white font-medium">Excel ya JSON</span> export nikal sakte hain. 
                  Agar aapne koi nayi table banayi hai, toh woh yahan automatically dikhne lagegi (0% coding required).
                </p>
              </section>

              {/* Feature 5 */}
              <section className="space-y-3">
                <h3 className="text-red-300 font-bold flex items-center gap-2">
                  <Cloud className="w-4 h-4" /> 5. Hybrid Strategy (Auto + Manual)
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  System mein <span className="text-white font-medium">Automatic</span> aur <span className="text-white font-medium">Manual</span> dono options hain. 
                  Auto-backup har raat schedule pe chalta hai, aur agar aapne koi important change kiya hai jo aap turant save karna chahte hain, toh aap <span className="text-white font-medium">"Create Manual Backup"</span> button use kar sakte hain. 
                  Dono backups safe cloud bucket mein store hote hain.
                </p>
              </section>

              {/* Feature 6 */}
              <section className="space-y-3">
                <h3 className="text-orange-300 font-bold flex items-center gap-2">
                  <HardDrive className="w-4 h-4" /> 6. Data Safety & Restore
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Backup archive file <span className="text-white font-medium">.archive.gz</span> format mein hoti hai. 
                  Ise restore karne ke liye command line se <b>mongorestore</b> tool use kiya ja sakta hai. 
                  Security ke liye, hum har upload ke baad server se temporary files delete kar dete hain (Disk space saving).
                </p>
              </section>
            </div>

            <div className="mt-12 flex justify-center">
              <button 
                onClick={() => setShowDocs(false)}
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold hover:opacity-90 transition-all shadow-xl shadow-purple-500/20"
              >
                Got it, understood!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: How it Works (Hinglish) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <ShieldCheck className="text-green-400" />
              Setup Highlights
            </h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold border border-purple-500/20 shrink-0">1</div>
                <div>
                  <h3 className="font-medium text-purple-300">Daily Cloud Backup</h3>
                  <p className="text-sm text-gray-400 mt-1">Direct upload to <b>AWS S3 Cloud</b> every night at 02:00 AM.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20 shrink-0">2</div>
                <div>
                  <h3 className="font-medium text-blue-300">Ghost Restore</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Kisi bhi purane backup ko <b>Temporary Ghost DB</b> mein restore karke browse karein.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/20 shrink-0">3</div>
                <div>
                  <h3 className="font-medium text-emerald-300">Targeted Export</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Purane backup se kisi bhi table ka <b>Excel/JSON</b> nikalein bina full restore kiye.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold border border-orange-500/20 shrink-0">4</div>
                <div>
                  <h3 className="font-medium text-orange-300">Instant Manual Backup</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Bina raat ka wait kiye, jab chahe tab <b>S3 Cloud</b> par backup upload karein ek click mein.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: History Table */}
        <div className="lg:col-span-2">
          <div className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <History className="text-purple-400" />
                Backup Vault (S3)
              </h2>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-500 border-b border-white/5">
                      <th className="pb-4 font-medium px-4 text-xs uppercase tracking-widest">Date & Time</th>
                      <th className="pb-4 font-medium px-4 text-xs uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {backups.map((backup) => (
                      <tr key={backup.id} className="group hover:bg-white/[0.02]">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                             <Clock className="w-4 h-4 text-gray-600" />
                             <div>
                               <div className="text-sm font-medium">{new Date(backup.date).toLocaleDateString()}</div>
                               <div className="text-[10px] text-gray-500">{new Date(backup.date).toLocaleTimeString()}</div>
                             </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleMountSnapshot(backup.id, backup.fileName, backup.date)}
                              disabled={mountingId === backup.id}
                              className={`p-2 rounded-lg border transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-wider ${
                                mountingId === backup.id 
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' 
                                : 'bg-blue-500/5 text-blue-400 border-blue-500/10 hover:bg-blue-500/20'
                              }`}
                            >
                              {mountingId === backup.id ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                              {mountingId === backup.id ? 'Restoring...' : 'Explore Backup'}
                            </button>
                            <button 
                              onClick={() => handleDownload(backup.id, backup.fileName)}
                              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition"
                            >
                              <Download size={14} />
                            </button>
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
      </div>

      {/* FOOTER: COLLECTIONS EXPLORER */}
      <div ref={explorerRef} className="max-w-7xl mx-auto mt-12 grid grid-cols-1 gap-8">
        <div className={`p-8 rounded-3xl border transition-all duration-500 ${
          viewMode === 'snapshot' 
          ? 'bg-blue-500/5 border-blue-500/30' 
          : 'bg-white/5 border-white/10'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl border transition-all ${
                viewMode === 'snapshot' 
                ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' 
                : 'bg-white/5 border-white/10 text-gray-400'
              }`}>
                <FileText size={24} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    Database Explorer
                  </h2>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                    viewMode === 'snapshot' 
                    ? 'bg-blue-500 text-white animate-pulse shadow-lg shadow-blue-500/20' 
                    : 'bg-emerald-500 text-white'
                  }`}>
                    {viewMode === 'snapshot' ? `BACKUP SOURCE: ${snapshotLabel}` : 'LIVE REALTIME'}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  Inspect and export individual tables directly from MongoDB. 
                  {viewMode === 'snapshot' && (
                    <span className="block text-blue-400 font-medium mt-1">
                      Showing results from Backup: {snapshotLabel}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {viewMode === 'snapshot' ? (
              <button 
                onClick={() => setViewMode('live')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold hover:bg-red-500/20 transition-all"
              >
                <XCircle size={16} /> Exit Snapshot Mode
              </button>
            ) : (
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Filter tables..."
                  value={collectionSearch}
                  onChange={(e) => setCollectionSearch(e.target.value)}
                  className="block w-full md:w-80 pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
                <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              </div>
            )}
          </div>

          {loadingCols ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredCollections.map((col) => (
                <div key={col.name} className={`p-4 rounded-2xl border transition-all group relative overflow-hidden ${
                  viewMode === 'snapshot' 
                  ? 'bg-blue-500/5 border-blue-500/10 hover:border-blue-500/30' 
                  : 'bg-white/5 border-white/5 hover:border-white/20'
                }`}>
                  <div className="flex flex-col mb-3">
                    <p className={`text-sm font-bold truncate transition-colors ${
                      viewMode === 'snapshot' ? 'group-hover:text-blue-300' : 'group-hover:text-emerald-300'
                    }`} title={col.name}>
                      {col.name}
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium">
                      {col.count.toLocaleString()} Records {viewMode === 'snapshot' ? 'found in backup' : 'in total'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleExport('excel', col.name)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-black uppercase tracking-wider hover:bg-green-500/20 transition"
                    >
                      <Table size={12} /> Excel
                    </button>
                    <button 
                      onClick={() => handleExport('json', col.name)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[10px] font-black uppercase tracking-wider hover:bg-yellow-500/20 transition"
                    >
                      <FileCode size={12} /> JSON
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="max-w-7xl mx-auto mt-8 flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-4 text-gray-400">
          <Cloud className="w-6 h-6" />
          <div className="flex flex-col">
            <span className="text-sm">Storage: <b>AWS S3 (US-EAST-1)</b></span>
            <span className="text-xs text-gray-600">Auto-backup: 02:00 AM Daily</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">
             Status: Secure
           </div>
        </div>
      </div>
    </div>
  );
}
