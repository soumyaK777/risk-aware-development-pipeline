import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Terminal, 
  RefreshCw, 
  Clock, 
  Activity, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Zap,
  Server,
  Cloud,
  FileCode2,
  AlertOctagon
} from 'lucide-react';
import { PipelineStatus, PipelineStatusResponse, RiskTriggerLevel } from '../types/pipeline';
import { soundEngine } from '../utils/audio';

interface LiveDashboardProps {
  onOpenCodeViewer: (fileId?: string) => void;
}

export const LiveDashboard: React.FC<LiveDashboardProps> = ({ onOpenCodeViewer }) => {
  // Current simulated or real trigger in memory
  const [triggerLevel, setTriggerLevel] = useState<RiskTriggerLevel>('LOW');
  const [pollInterval, setPollInterval] = useState<number>(3000);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [copiedLogs, setCopiedLogs] = useState<boolean>(false);
  const [filterText, setFilterText] = useState<string>('');
  const [cyclesCount, setCyclesCount] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'terminal' | 'security_audit' | 'aws_edge'>('terminal');

  // Terminal logs state
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const terminalBottomRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef<PipelineStatus>('safe');

  // Active calculated response based on triggerLevel
  const generateStatusPayload = (trigger: RiskTriggerLevel): PipelineStatusResponse => {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    if (trigger === 'HIGH') {
      return {
        status: 'danger',
        risk_score: 89,
        gatekeeper_decision: 'REJECTED',
        config_trigger: 'HIGH',
        sync_time: formattedTime,
        iso_timestamp: now.toISOString(),
        summary: 'CRITICAL SECURITY VULNERABILITIES DETECTED - AUTOMATED PIPELINE ABORTED',
        metrics: {
          sonarqube_blockers: 4,
          trivy_cve_critical: 2,
          test_coverage_pct: 48.2,
          target_environment: 'production-us-east-1',
        },
        logs: [
          `[${formattedTime}] [INIT] Initiating CI/CD build run #4829 on branch 'main' (commit sha: 8f2b1a0)...`,
          `[${formattedTime}] [SCAN] SonarQube Scanner v5.0.1 running on source directory...`,
          `[${formattedTime}] [ERROR] SonarQube Quality Gate FAILED: 4 Blocker Security Hotspots identified.`,
          `[${formattedTime}] [ERROR] SonarQube Issue: CWE-89 SQL Injection pattern detected in 'src/api/auth.js:142'.`,
          `[${formattedTime}] [SCAN] Trivy Container Vulnerability Scanner checking base image 'node:18-alpine'...`,
          `[${formattedTime}] [CRITICAL] Trivy CVE-2024-21626 (CVSS 8.6) detected in container runtime filesystem layer.`,
          `[${formattedTime}] [CRITICAL] Trivy CVE-2023-45853 (CVSS 9.8) zlib arbitrary code execution vulnerability.`,
          `[${formattedTime}] [GATEKEEPER] Automated Deployment Gatekeeper evaluated aggregate risk score: 89/100 (Threshold: 35).`,
          `[${formattedTime}] [DECISION] Gatekeeper verdict: >>> REJECTED <<<. Deployment halted to prevent production compromise.`,
          `[${formattedTime}] [NOTIFICATION] PagerDuty P1 incident dispatched to SecOps & On-Call DevOps Engineers.`,
        ],
      };
    }

    return {
      status: 'safe',
      risk_score: 12,
      gatekeeper_decision: 'DEPLOYED',
      config_trigger: 'LOW',
      sync_time: formattedTime,
      iso_timestamp: now.toISOString(),
      summary: 'ALL QUALITY & SECURITY GATES PASSED - PRODUCTION ARTIFACT LIVE',
      metrics: {
        sonarqube_blockers: 0,
        trivy_cve_critical: 0,
        test_coverage_pct: 94.8,
        target_environment: 'production-us-east-1',
      },
      logs: [
        `[${formattedTime}] [INIT] Initiating CI/CD build run #4830 on branch 'main' (commit sha: 3e7c9f2)...`,
        `[${formattedTime}] [LINT] ESLint & Prettier code style validation completed: 0 errors, 0 warnings.`,
        `[${formattedTime}] [SCAN] SonarQube Quality Gate PASSED: Security Rating A, Reliability A, Duplications 0.4%.`,
        `[${formattedTime}] [SCAN] Trivy Container Vulnerability Scanner completed: 0 Critical, 0 High vulnerabilities.`,
        `[${formattedTime}] [TEST] Jest suite executed 148 unit & integration tests across 18 suites: 100% passing.`,
        `[${formattedTime}] [BUILD] Docker container optimized build complete. Digest: sha256:7c9e21bf...`,
        `[${formattedTime}] [GATEKEEPER] Automated Deployment Gatekeeper evaluated aggregate risk score: 12/100 (Threshold: 35).`,
        `[${formattedTime}] [DECISION] Gatekeeper verdict: >>> DEPLOYED <<< Approved for automated release.`,
        `[${formattedTime}] [AWS] Pushing assets to S3 origin bucket 's3://prod-edge-artifacts-us-east-1'...`,
        `[${formattedTime}] [AWS] Triggering AWS CloudFront cache invalidation on distribution E27KL918EXAMPLE...`,
        `[${formattedTime}] [STATUS] AWS CloudFront Distribution synced worldwide. Healthcheck 200 OK across 42 edge pops.`,
      ],
    };
  };

  const [currentPayload, setCurrentPayload] = useState<PipelineStatusResponse>(() => generateStatusPayload('LOW'));

  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);

  // Real backend toggle handler
  const handleToggleTrigger = async (newTrigger: RiskTriggerLevel) => {
    setTriggerLevel(newTrigger);
    try {
      await fetch('/api/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: newTrigger })
      });
      // Immediately trigger a poll
      fetchPipelineStatus();
    } catch {
      // Local fallback
    }
  };

  const fetchPipelineStatus = async () => {
    setCyclesCount(prev => prev + 1);
    let nextPayload: PipelineStatusResponse;

    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      if (res.ok) {
        nextPayload = await res.json();
        setIsBackendConnected(true);
        if (nextPayload.config_trigger) {
          setTriggerLevel(nextPayload.config_trigger);
        }
      } else {
        throw new Error('HTTP ' + res.status);
      }
    } catch {
      setIsBackendConnected(false);
      nextPayload = generateStatusPayload(triggerLevel);
    }

    setCurrentPayload(nextPayload);

    // Audio & State transition notification
    if (prevStatusRef.current !== nextPayload.status) {
      if (nextPayload.status === 'danger') {
        soundEngine.playDangerAlarm();
      } else {
        soundEngine.playSafeChime();
      }
      prevStatusRef.current = nextPayload.status;

      setTerminalLogs(prev => [
        ...prev,
        `--------------------------------------------------------------------------------`,
        `[${nextPayload.sync_time}] [GATEKEEPER-EVENT] Backend switch detected: RISK_TRIGGER=${nextPayload.config_trigger}`,
        `[${nextPayload.sync_time}] [TRANSITION] Arbiter Verdict: >>> ${nextPayload.gatekeeper_decision} <<< (Risk Score: ${nextPayload.risk_score}%)`,
        `--------------------------------------------------------------------------------`,
        ...nextPayload.logs
      ]);
    } else {
      setTerminalLogs(prev => {
        const updated = [...prev, `[${nextPayload.sync_time}] [POLL-SYNC] Health status verified: ${nextPayload.gatekeeper_decision} (${nextPayload.risk_score}%)`];
        return updated.slice(-150);
      });
    }
  };

  // Polling loop with live interval
  useEffect(() => {
    fetchPipelineStatus();
    const intervalId = setInterval(fetchPipelineStatus, pollInterval);
    return () => clearInterval(intervalId);
  }, [triggerLevel, pollInterval]);

  // Handle auto-scroll
  useEffect(() => {
    if (autoScroll && terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs, autoScroll]);

  // Sound toggle handler
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.enabled = next;
    if (next) soundEngine.playSafeChime();
  };

  // Copy logs handler
  const handleCopyLogs = () => {
    navigator.clipboard.writeText(terminalLogs.join('\n'));
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const isDanger = currentPayload.status === 'danger';

  const filteredLogs = filterText 
    ? terminalLogs.filter(l => l.toLowerCase().includes(filterText.toLowerCase()))
    : terminalLogs;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">

      {/* ====================================================================
          CONTROL & SIMULATION TOOLBAR (DevOps Operator Controls)
          ==================================================================== */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 backdrop-blur-md shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Config Switch:
          </span>

          {/* Interactive Trigger Selector: LOW vs HIGH */}
          <div className="inline-flex p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => handleToggleTrigger('LOW')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                triggerLevel === 'LOW'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              RISK_TRIGGER=LOW
            </button>
            <button
              onClick={() => handleToggleTrigger('HIGH')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                triggerLevel === 'HIGH'
                  ? 'bg-rose-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              RISK_TRIGGER=HIGH
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Backend: Express.js (Active on /api/status)
            </span>
            <span className="text-xs text-slate-500 hidden xl:inline">
              Syncs with <code>backend/health_config.txt</code>
            </span>
          </div>
        </div>

        {/* Polling Cadence & Secondary Controls */}
        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Poll Rate:</span>
            <select
              value={pollInterval}
              onChange={(e) => setPollInterval(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value={1000}>1000ms (Fast)</option>
              <option value={3000}>3000ms (Standard Spec)</option>
              <option value={5000}>5000ms (Relaxed)</option>
            </select>
          </div>

          {/* Audio Chime Toggle */}
          <button
            onClick={handleToggleSound}
            title={soundEnabled ? "Mute alert audio" : "Enable alert audio"}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
              soundEnabled 
                ? 'bg-cyan-950/60 border-cyan-800 text-cyan-300' 
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">{soundEnabled ? 'Audio On' : 'Audio Muted'}</span>
          </button>

          {/* View VS Code Files Button */}
          <button
            onClick={() => onOpenCodeViewer()}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Inspect Project Files</span>
          </button>
        </div>
      </section>

      {/* ====================================================================
          BLOCK 1: TOP PANEL ALERT BOX
          ==================================================================== */}
      <section>
        <div
          className={`p-5 rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg ${
            isDanger
              ? 'bg-rose-950/40 border-rose-500/80 text-rose-100 shadow-rose-950/40'
              : 'bg-emerald-950/30 border-emerald-500/80 text-emerald-100 shadow-emerald-950/30'
          }`}
        >
          {/* Subtle Ambient Glow */}
          <div
            className={`absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
              isDanger ? 'bg-rose-500/15' : 'bg-emerald-500/15'
            }`}
          />

          <div className="flex items-start sm:items-center gap-4 relative z-10">
            <div
              className={`p-3 rounded-lg border shrink-0 ${
                isDanger
                  ? 'bg-rose-900/60 border-rose-600 text-rose-300 animate-pulse'
                  : 'bg-emerald-900/50 border-emerald-600 text-emerald-300'
              }`}
            >
              {isDanger ? (
                <ShieldAlert className="w-7 h-7 text-rose-400" />
              ) : (
                <ShieldCheck className="w-7 h-7 text-emerald-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">
                  {isDanger
                    ? 'SECURITY CRITICAL RISK EXCEPTION: PIPELINE HALTED'
                    : 'DEPLOYMENT PIPELINE HEALTHY: PRODUCTION RELEASE APPROVED'}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300/90 mt-1 max-w-3xl leading-relaxed">
                {currentPayload.summary}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10 shrink-0 self-end md:self-auto">
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                Gatekeeper Verdict
              </div>
              <div
                className={`font-mono text-base font-extrabold tracking-wide ${
                  isDanger ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                }`}
              >
                {currentPayload.gatekeeper_decision}
              </div>
            </div>

            <div
              className={`px-3 py-1.5 rounded border text-xs font-mono font-bold uppercase tracking-wider ${
                isDanger
                  ? 'bg-rose-900/70 border-rose-600 text-rose-200'
                  : 'bg-emerald-900/60 border-emerald-600 text-emerald-200'
              }`}
            >
              {isDanger ? 'GATE REJECT' : 'GATE PASS'}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          BLOCK 2: THREE GRID STATS CARDS
          ==================================================================== */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Active Risk Percentage */}
        <div
          className={`bg-slate-900/80 rounded-xl p-5 border transition-all hover:-translate-y-0.5 ${
            isDanger ? 'border-rose-500/60' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Active Risk Score</span>
            <span className="font-mono text-[11px] text-slate-500">Threshold: 35%</span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-4xl font-extrabold font-mono tabular-nums ${
                isDanger ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
              }`}
            >
              {currentPayload.risk_score}%
            </span>
            <span
              className={`text-xs font-semibold ${
                isDanger ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {isDanger ? 'CRITICAL EXCEPTION' : 'NOMINAL SAFE'}
            </span>
          </div>

          {/* Metric Bar */}
          <div className="mt-3 w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 ${
                isDanger ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${currentPayload.risk_score}%` }}
            />
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>SonarQube Vulnerabilities</span>
            <span className="font-mono font-bold text-slate-200">
              {currentPayload.metrics?.sonarqube_blockers ?? 0} Blockers
            </span>
          </div>
        </div>

        {/* Card 2: Gatekeeper Decision */}
        <div
          className={`bg-slate-900/80 rounded-xl p-5 border transition-all hover:-translate-y-0.5 ${
            isDanger ? 'border-rose-500/60' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Gatekeeper Decision</span>
            <span className="font-mono text-[11px] text-slate-500">Arbiter Rule</span>
          </div>

          <div className="mt-3">
            <div
              className={`text-3xl font-extrabold font-mono tracking-wide ${
                isDanger ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
              }`}
            >
              {currentPayload.gatekeeper_decision}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {isDanger
                ? 'Deployment aborted by automated quality gate'
                : 'Automated push to AWS CloudFront origin authorized'}
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Container CVEs</span>
            <span
              className={`font-bold ${
                isDanger ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {currentPayload.metrics?.trivy_cve_critical ?? 0} Critical
            </span>
          </div>
        </div>

        {/* Card 3: Exact Live Sync Time */}
        <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Live Sync Telemetry</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              LIVE POLL
            </span>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-extrabold font-mono text-slate-100 tabular-nums">
              {currentPayload.sync_time}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Polling cycle #{cyclesCount} ({pollInterval}ms cadence)</span>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>HTTP Endpoint</span>
            <span className="text-cyan-400">GET /api/status (200 OK)</span>
          </div>
        </div>

      </section>

      {/* ====================================================================
          TABBED AUDIT & TERMINAL VIEW
          ==================================================================== */}
      <section className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        
        {/* Terminal Header & Mode Switcher */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveTab('terminal')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  activeTab === 'terminal'
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Log Shell Terminal</span>
              </button>
              <button
                onClick={() => setActiveTab('security_audit')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  activeTab === 'security_audit'
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                <span>SonarQube & Trivy Audit</span>
              </button>
              <button
                onClick={() => setActiveTab('aws_edge')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  activeTab === 'aws_edge'
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>AWS CloudFront Edge</span>
              </button>
            </div>
          </div>

          {activeTab === 'terminal' && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Filter logs..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded w-36 sm:w-48 focus:outline-none focus:border-cyan-500 font-mono"
              />

              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`px-2 py-1 text-xs font-mono rounded border transition-colors ${
                  autoScroll
                    ? 'bg-slate-800 border-slate-700 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                Auto-Scroll: {autoScroll ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={() => setTerminalLogs([])}
                className="px-2 py-1 text-xs font-mono rounded border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 transition-colors"
              >
                Clear
              </button>

              <button
                onClick={handleCopyLogs}
                className="px-2 py-1 text-xs font-mono rounded border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 flex items-center gap-1 transition-colors"
              >
                {copiedLogs ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLogs ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Terminal Shell */}
        {activeTab === 'terminal' && (
          <div className="p-4 font-mono text-xs text-slate-300 h-96 overflow-y-auto space-y-1 bg-[#05080f]">
            {filteredLogs.map((log, index) => {
              let colorClass = 'text-slate-400';
              if (log.includes('[CRITICAL]') || log.includes('[FATAL]')) {
                colorClass = 'text-rose-400 font-semibold bg-rose-950/40 px-1 py-0.5 rounded';
              } else if (log.includes('[ERROR]') || log.includes('FAILED') || log.includes('REJECTED')) {
                colorClass = 'text-rose-300 font-medium';
              } else if (log.includes('[STATUS]') || log.includes('DEPLOYED') || log.includes('PASSED')) {
                colorClass = 'text-emerald-300 font-medium';
              } else if (log.includes('[AWS]') || log.includes('[SCAN]') || log.includes('[INIT]')) {
                colorClass = 'text-cyan-300';
              } else if (log.includes('---')) {
                colorClass = 'text-slate-600';
              }

              return (
                <div key={index} className={`leading-relaxed whitespace-pre-wrap break-all ${colorClass}`}>
                  {log}
                </div>
              );
            })}
            <div ref={terminalBottomRef} />
          </div>
        )}

        {/* Tab 2: Security Audit (SonarQube + Trivy) */}
        {activeTab === 'security_audit' && (
          <div className="p-6 bg-slate-950 space-y-6 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* SonarQube Box */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100">SonarQube Static Analysis</span>
                    <span className="text-xs text-slate-500 font-mono">v5.0.1</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      isDanger ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {isDanger ? 'GATE FAILED' : 'GATE PASSED'}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Security Hotspots / Blockers:</span>
                    <span className={`font-mono font-bold ${isDanger ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isDanger ? '4 Critical Blockers' : '0 Blockers'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">OWASP Top 10 Coverage:</span>
                    <span className={`font-mono ${isDanger ? 'text-rose-400' : 'text-slate-200'}`}>
                      {isDanger ? 'Violation: CWE-89 (SQL Injection)' : 'A-Rating (Clean)'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Automated Unit Test Coverage:</span>
                    <span className="font-mono text-slate-200">
                      {isDanger ? '48.2% (Target >= 80%)' : '94.8% (Target >= 80%)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Trivy Container CVEs */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100">Trivy Container Scanner</span>
                    <span className="text-xs text-slate-500 font-mono">Image: node:18-alpine</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      isDanger ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {isDanger ? 'VULNERABLE' : 'SECURE'}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">CVE-2024-21626 (runc escape):</span>
                    <span className={`font-mono font-bold ${isDanger ? 'text-rose-400' : 'text-slate-500'}`}>
                      {isDanger ? 'CVSS 8.6 (HIGH)' : 'Not Present'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">CVE-2023-45853 (zlib arbitrary code):</span>
                    <span className={`font-mono font-bold ${isDanger ? 'text-rose-400' : 'text-slate-500'}`}>
                      {isDanger ? 'CVSS 9.8 (CRITICAL)' : 'Not Present'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Base Image Compliance:</span>
                    <span className="font-mono text-slate-200">
                      {isDanger ? 'Non-Compliant Layer' : 'Hardened Alpine Linux'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800 text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-200">DevOps Architectural Policy:</strong> When <code>RISK_TRIGGER=HIGH</code> is written into <code>health_config.txt</code>, the Gatekeeper simulates a failed security audit. The risk score triggers a hard pipeline halt (Risk 89 &gt; Threshold 35) to prevent compromised container images or injection flaws from deploying into the production VPC.
            </div>
          </div>
        )}

        {/* Tab 3: AWS CloudFront Edge Status */}
        {activeTab === 'aws_edge' && (
          <div className="p-6 bg-slate-950 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-1">Target CloudFront Distribution</span>
                <span className="font-mono font-bold text-slate-200 text-sm">E27KL918EXAMPLE</span>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-1">Origin S3 Bucket</span>
                <span className="font-mono font-bold text-slate-200 text-sm">s3://prod-edge-artifacts-us-east-1</span>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-1">Global Edge POPs</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">42 Points of Presence Active</span>
              </div>
            </div>

            <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800 text-slate-300 leading-relaxed">
              {isDanger ? (
                <div className="text-rose-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>CloudFront invalidation CANCELLED. Production origin locked to previous stable release (commit 3e7c9f2).</span>
                </div>
              ) : (
                <div className="text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>CloudFront invalidation COMPLETED. Edge caches updated globally with new optimized bundles.</span>
                </div>
              )}
            </div>
          </div>
        )}

      </section>

      {/* ====================================================================
          INTEGRATION HOOKS QUICK REFERENCE STRIP
          ==================================================================== */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          <span>Local Prototype Hook:</span>
          <span className="text-slate-300 font-mono">backend/server.js executes on port 5000</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Polling Hook:</span>
          <span className="text-slate-300 font-mono">frontend/index.html polls GET /api/status every 3000ms</span>
        </div>
        <button
          onClick={() => onOpenCodeViewer('server_js')}
          className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-4"
        >
          View Express Server Integration Code &rarr;
        </button>
      </section>

    </div>
  );
};
