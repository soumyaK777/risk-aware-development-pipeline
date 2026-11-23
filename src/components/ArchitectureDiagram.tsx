import React from 'react';
import { 
  GitBranch, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Cloud, 
  ArrowRight, 
  ArrowDown, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Server,
  Terminal,
  Cpu
} from 'lucide-react';

export const ArchitectureDiagram: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* Blueprint Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          DevOps Principal Architectural Blueprint
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-1 leading-relaxed">
          Comprehensive flow of the Risk-Aware CI/CD Deployment Gatekeeper orchestrating SonarQube quality gates, Trivy container security scans, and automated AWS CloudFront deployments.
        </p>
      </div>

      {/* Visual Pipeline Flow */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-2xl">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
          <span>End-to-End Automated Pipeline Topology</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          
          {/* Step 1: Commit */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400 mb-3">
                <GitBranch className="w-4 h-4" />
              </div>
              <div className="text-xs font-mono text-cyan-400 font-bold uppercase">Stage 01</div>
              <div className="font-bold text-slate-200 text-sm mt-0.5">Code Commit</div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Developer pushes commit to <code>main</code>. Webhook triggers CI pipeline worker.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500">
              Trigger: Push / PR
            </div>
          </div>

          {/* Step 2: SonarQube */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-700/60 flex items-center justify-center text-blue-400 mb-3">
                <Search className="w-4 h-4" />
              </div>
              <div className="text-xs font-mono text-blue-400 font-bold uppercase">Stage 02</div>
              <div className="font-bold text-slate-200 text-sm mt-0.5">SonarQube Scan</div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Static application security testing (SAST), code smells, coverage (&gt;80%), and OWASP SQLi checks.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500">
              Metric: Quality Gate
            </div>
          </div>

          {/* Step 3: Trivy */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-700/60 flex items-center justify-center text-amber-400 mb-3">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="text-xs font-mono text-amber-400 font-bold uppercase">Stage 03</div>
              <div className="font-bold text-slate-200 text-sm mt-0.5">Trivy CVE Scan</div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Deep container layer audit on <code>node:18-alpine</code> base image. Blocks CRITICAL CVEs.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500">
              Metric: CVSS Severity
            </div>
          </div>

          {/* Step 4: Gatekeeper Arbiter */}
          <div className="bg-slate-900/90 border-2 border-cyan-500/80 rounded-lg p-4 flex flex-col justify-between shadow-lg shadow-cyan-950/40">
            <div>
              <div className="w-8 h-8 rounded-lg bg-cyan-900 border border-cyan-400 flex items-center justify-center text-cyan-200 mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs font-mono text-cyan-300 font-bold uppercase">Stage 04: Arbiter</div>
              <div className="font-bold text-slate-100 text-sm mt-0.5">Risk Gatekeeper</div>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Dynamic scoring formula: Evaluates aggregate risk against hard threshold (&le; 35%).
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-800 text-[10px] font-mono text-cyan-400 font-bold">
              Config: health_config.txt
            </div>
          </div>

          {/* Step 5: Outcome */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 mb-3">
                <Cloud className="w-4 h-4" />
              </div>
              <div className="text-xs font-mono text-emerald-400 font-bold uppercase">Stage 05</div>
              <div className="font-bold text-slate-200 text-sm mt-0.5">AWS CloudFront</div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                If Safe: S3 sync + CloudFront cache invalidation worldwide across 42 edge PoPs.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-800 text-[10px] font-mono text-emerald-400">
              Outcome: Live in Prod
            </div>
          </div>

        </div>

        {/* Dual Decision Paths Callout */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Safe Path */}
          <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/40">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Nominal Path: RISK_TRIGGER=LOW (Risk Score: 12%)</span>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-slate-300">
              <li>&bull; SonarQube: 0 Blocker Issues, 94.8% test coverage, Security Rating A.</li>
              <li>&bull; Trivy: 0 Critical / 0 High vulnerabilities detected.</li>
              <li>&bull; Gatekeeper decision: <strong>DEPLOYED</strong> (Risk 12 &le; 35).</li>
              <li>&bull; Action: Automated distribution to AWS CloudFront edge network.</li>
            </ul>
          </div>

          {/* Rejected Path */}
          <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-500/40">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <XCircle className="w-4 h-4" />
              <span>Exception Path: RISK_TRIGGER=HIGH (Risk Score: 89%)</span>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-slate-300">
              <li>&bull; SonarQube: 4 Blockers detected (CWE-89 SQL Injection in auth.js).</li>
              <li>&bull; Trivy: CVE-2024-21626 (CVSS 8.6) + CVE-2023-45853 (CVSS 9.8).</li>
              <li>&bull; Gatekeeper decision: <strong>REJECTED</strong> (Risk 89 &gt; 35).</li>
              <li>&bull; Action: Hard halt, release blocked, P1 incident dispatched to SecOps.</li>
            </ul>
          </div>

        </div>
      </div>

      {/* Architectural Principles Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-200">
          Why Dynamic Config Polling in Prototypes?
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          In cloud environments and GitOps controllers (such as ArgoCD or Flux), deployment gates continuously poll policy targets. In our local prototype, reading <code>backend/health_config.txt</code> on every request simulates an external policy engine or feature-flag server (like LaunchDarkly or Unleash) without requiring an external database, allowing zero-latency toggling and live dashboard verification in VS Code.
        </p>
      </div>

    </div>
  );
};
