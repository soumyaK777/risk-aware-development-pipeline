import React, { useState } from 'react';
import { 
  Activity, 
  FileCode, 
  Cpu, 
  Terminal, 
  Download, 
  Check, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { LiveDashboard } from './components/LiveDashboard';
import { CodeViewerModal } from './components/CodeViewerModal';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { CODE_FILES } from './data/codeFiles';

type ActiveView = 'dashboard' | 'files' | 'architecture';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [selectedFileId, setSelectedFileId] = useState<string>('server_js');
  const [allCopied, setAllCopied] = useState<boolean>(false);

  const handleOpenCodeViewer = (fileId?: string) => {
    if (fileId) {
      setSelectedFileId(fileId);
    }
    setActiveView('files');
  };

  const handleCopyAllFiles = () => {
    const combined = CODE_FILES.map(f => `=== FILE: ${f.path} ===\n${f.content}\n`).join('\n\n');
    navigator.clipboard.writeText(combined);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      
      {/* ====================================================================
          TOP BAR CONTRACT (One Row, Three Zones)
          Zone 1: Single text element Brand wordmark
          Zone 2: 3-4 clean single-line text navigation links
          Zone 3: 1 primary action button
          ==================================================================== */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          
          {/* Zone 1: Brand Wordmark */}
          <button 
            onClick={() => setActiveView('dashboard')}
            className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-cyan-400 transition-colors flex items-center gap-2"
          >
            <div className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-mono font-black text-xs shadow-sm">
              &gt;_
            </div>
            <span>DevOps Pipeline Gatekeeper</span>
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'dashboard' ? 'text-cyan-400 border-b-2 border-cyan-400 pb-0.5' : ''
              }`}
            >
              Live Dashboard
            </button>
            <button
              onClick={() => setActiveView('files')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'files' ? 'text-cyan-400 border-b-2 border-cyan-400 pb-0.5' : ''
              }`}
            >
              VS Code Project Files
            </button>
            <button
              onClick={() => setActiveView('architecture')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'architecture' ? 'text-cyan-400 border-b-2 border-cyan-400 pb-0.5' : ''
              }`}
            >
              Architectural Topology
            </button>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleCopyAllFiles}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              {allCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Terminal className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{allCopied ? 'All 3 Files Copied' : 'Copy All Files'}</span>
            </button>
          </div>

        </div>
      </header>

      {/* ====================================================================
          MAIN VIEWPORT CONTENT
          ==================================================================== */}
      <main className="flex-1 px-4 sm:px-6 py-6">
        {activeView === 'dashboard' && (
          <LiveDashboard onOpenCodeViewer={handleOpenCodeViewer} />
        )}
        {activeView === 'files' && (
          <CodeViewerModal initialFileId={selectedFileId} />
        )}
        {activeView === 'architecture' && (
          <ArchitectureDiagram />
        )}
      </main>

      {/* ====================================================================
          FOOTER (Quiet, clean typography, anti-slop)
          ==================================================================== */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-400">Risk-Aware Deployment Pipeline Dashboard</span>
            <span>·</span>
            <span>Express.js &middot; Vanilla JavaScript &middot; Bootstrap 5 &middot; Node fs Dynamic Polling</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleOpenCodeViewer('health_config')}
              className="hover:text-slate-300 font-mono"
            >
              backend/health_config.txt
            </button>
            <button
              onClick={() => handleOpenCodeViewer('server_js')}
              className="hover:text-slate-300 font-mono"
            >
              backend/server.js
            </button>
            <button
              onClick={() => handleOpenCodeViewer('index_html')}
              className="hover:text-slate-300 font-mono"
            >
              frontend/index.html
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
