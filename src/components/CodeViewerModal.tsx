import React, { useState } from 'react';
import { 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  FolderTree, 
  ExternalLink,
  CheckCircle2,
  Layers,
  Sparkles
} from 'lucide-react';
import { CODE_FILES, CodeFileRecord } from '../data/codeFiles';

interface CodeViewerModalProps {
  initialFileId?: string;
  onClose?: () => void;
}

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({ initialFileId }) => {
  const [activeFileId, setActiveFileId] = useState<string>(initialFileId || 'server_js');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeFile: CodeFileRecord = CODE_FILES.find(f => f.id === activeFileId) || CODE_FILES[1];

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (file: CodeFileRecord) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const lines = activeFile.content.split('\n');

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <FolderTree className="w-4 h-4" />
            <span>VS Code Project Scaffold</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            Production-Ready File Architecture
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Copy-pasteable code blocks with annotated integration hooks for immediate execution in VS Code.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopy(activeFile.content, activeFile.id)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            {copiedId === activeFile.id ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Current File ({activeFile.filename})</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleDownload(activeFile)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
            title="Download file"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      {/* Main File Selector & Editor Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Left Column: File Navigation List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Project Files (3 Core)
          </div>

          <div className="space-y-2">
            {CODE_FILES.map((file) => {
              const isActive = file.id === activeFileId;
              return (
                <button
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1 ${
                    isActive
                      ? 'bg-slate-800/90 border-cyan-500/80 shadow-md'
                      : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-xs font-semibold ${isActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {file.path}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                      {file.language}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mt-0.5">
                    {file.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Quickstart Command Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3.5 space-y-2 text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              VS Code Local Commands
            </span>
            <div className="font-mono text-[11px] bg-slate-950 p-2.5 rounded border border-slate-800/80 text-emerald-300 space-y-1.5">
              <div className="text-slate-500"># 1. Install dependencies</div>
              <div>npm install express cors</div>
              <div className="text-slate-500 pt-1"># 2. Start backend server</div>
              <div>node backend/server.js</div>
              <div className="text-slate-500 pt-1"># 3. Open frontend in browser</div>
              <div>open frontend/index.html</div>
            </div>
          </div>
        </div>

        {/* Right Column: Code Viewer with Line Numbers */}
        <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
          
          {/* File Topbar */}
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-xs font-bold text-slate-200">
                {activeFile.path}
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400 font-sans">
                {activeFile.purpose}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500">
                {lines.length} lines
              </span>
              <button
                onClick={() => handleCopy(activeFile.content, activeFile.id)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                {copiedId === activeFile.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy File</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Code Window with Line Numbers */}
          <div className="p-4 overflow-x-auto max-h-[580px] overflow-y-auto font-mono text-xs leading-relaxed bg-[#060a12]">
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                    <td className="w-10 pr-4 text-right text-slate-600 select-none tabular-nums text-[11px] align-top">
                      {idx + 1}
                    </td>
                    <td className="pl-2 text-slate-300 whitespace-pre font-mono">
                      {highlightSyntax(line, activeFile.language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Integration Hook Explanation Footer */}
          <div className="bg-slate-900/90 border-t border-slate-800 p-4 text-xs text-slate-300 flex items-start gap-3">
            <Layers className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-slate-200">
                Architectural Hook for {activeFile.filename}:
              </div>
              <div className="text-slate-400 leading-relaxed">
                {activeFile.id === 'health_config' && (
                  <span>
                    When the string inside this file is updated to <code>RISK_TRIGGER=HIGH</code>, the next polling tick at 3000ms immediately causes the backend to trigger the <strong>REJECTED</strong> state with high risk scores and critical SonarQube/Trivy findings. Writing <code>RISK_TRIGGER=LOW</code> unlocks <strong>DEPLOYED</strong> state.
                  </span>
                )}
                {activeFile.id === 'server_js' && (
                  <span>
                    Reads the configuration dynamically using <code>fs.readFileSync()</code> inside the <code>GET /api/status</code> route handler on every incoming request. Uses CORS middleware so that <code>frontend/index.html</code> running from any host port can poll without origin restrictions.
                  </span>
                )}
                {activeFile.id === 'index_html' && (
                  <span>
                    Uses Bootstrap 5 CDN for responsive dark theme styling. The embedded vanilla JavaScript runs <code>setInterval(fetchStatus, 3000)</code> with error boundaries and smoothly alters CSS classes and terminal streams in real time.
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

// Simple clean visual syntax highlighter helper
function highlightSyntax(line: string, language: string) {
  if (language === 'plaintext') {
    if (line.includes('RISK_TRIGGER=HIGH')) {
      return <span className="text-rose-400 font-bold">{line}</span>;
    }
    if (line.includes('RISK_TRIGGER=LOW')) {
      return <span className="text-emerald-400 font-bold">{line}</span>;
    }
    return <span>{line}</span>;
  }

  // Comments
  if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*') || line.trim().startsWith('<!--')) {
    return <span className="text-slate-500 italic">{line}</span>;
  }

  // Keywords & Strings
  if (line.includes('const ') || line.includes('let ') || line.includes('function ') || line.includes('return ') || line.includes('import ') || line.includes('async ') || line.includes('await ')) {
    return <span className="text-cyan-300">{line}</span>;
  }

  if (line.includes('RISK_TRIGGER=HIGH')) {
    return <span className="text-rose-400 font-bold">{line}</span>;
  }

  if (line.includes('RISK_TRIGGER=LOW')) {
    return <span className="text-emerald-400 font-bold">{line}</span>;
  }

  if (line.includes('danger') || line.includes('REJECTED')) {
    return <span className="text-rose-300">{line}</span>;
  }

  if (line.includes('safe') || line.includes('DEPLOYED')) {
    return <span className="text-emerald-300">{line}</span>;
  }

  return <span>{line}</span>;
}
