export interface CodeFileRecord {
  id: string;
  filename: string;
  path: string;
  language: string;
  description: string;
  purpose: string;
  content: string;
}

export const HEALTH_CONFIG_CONTENT = `RISK_TRIGGER=LOW
`;

export const SERVER_JS_CONTENT = `/**
 * ==============================================================================
 * RISK-AWARE DEPLOYMENT PIPELINE ENGINE
 * File: backend/server.js
 * Framework: Express.js (Node.js) | Port: 5000
 * ==============================================================================
 * 
 * INTERNAL INTEGRATION HOOKS:
 * 1. Express & CORS:
 *    - Cross-Origin Resource Sharing (CORS) is enabled to accept incoming requests
 *      from any origin (such as frontend/index.html running on Live Server, file://,
 *      or localhost ports).
 * 
 * 2. Dynamic File System Watcher:
 *    - Uses Node's 'fs' module to synchronously inspect 'backend/health_config.txt'
 *      on EVERY request to GET /api/status.
 *    - Allows instant manual toggling (LOW <-> HIGH) without server restarts.
 * 
 * 3. Gatekeeper Risk Engine:
 *    - RISK_TRIGGER=HIGH: Emits status "danger", risk score 89, gatekeeper "REJECTED",
 *      and critical vulnerability logs from SonarQube & Trivy.
 *    - RISK_TRIGGER=LOW: Emits status "safe", risk score 12, gatekeeper "DEPLOYED",
 *      and AWS CloudFront global edge distribution validation logs.
 * ==============================================================================
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Resolve path to the health toggle file
const CONFIG_FILE_PATH = path.join(__dirname, 'health_config.txt');

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Primary Telemetry Route: GET /api/status
 * Dynamically re-reads health_config.txt on every request
 */
app.get('/api/status', (req, res) => {
  try {
    // Read health_config.txt dynamically
    let configContent = 'RISK_TRIGGER=LOW';
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      configContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8').trim();
    } else {
      fs.writeFileSync(CONFIG_FILE_PATH, 'RISK_TRIGGER=LOW', 'utf-8');
    }

    const timestamp = new Date().toISOString();
    const formattedTime = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Evaluation Logic for HIGH Risk Trigger
    if (configContent.includes('RISK_TRIGGER=HIGH')) {
      return res.status(200).json({
        status: 'danger',
        risk_score: 89,
        gatekeeper_decision: 'REJECTED',
        config_trigger: 'HIGH',
        sync_time: formattedTime,
        iso_timestamp: timestamp,
        summary: 'CRITICAL SECURITY VULNERABILITIES DETECTED - AUTOMATED PIPELINE ABORTED',
        metrics: {
          sonarqube_blockers: 4,
          trivy_cve_critical: 2,
          test_coverage_pct: 48.2,
          target_environment: 'production-us-east-1',
        },
        logs: [
          \`[\${formattedTime}] [INIT] Initiating CI/CD build run #4829 on branch 'main' (commit sha: 8f2b1a0)...\`,
          \`[\${formattedTime}] [SCAN] SonarQube Scanner v5.0.1 running on source directory...\`,
          \`[\${formattedTime}] [ERROR] SonarQube Quality Gate FAILED: 4 Blocker Security Hotspots identified.\`,
          \`[\${formattedTime}] [ERROR] SonarQube Issue: CWE-89 SQL Injection pattern detected in 'src/api/auth.js:142'.\`,
          \`[\${formattedTime}] [SCAN] Trivy Container Vulnerability Scanner checking base image 'node:18-alpine'...\`,
          \`[\${formattedTime}] [CRITICAL] Trivy CVE-2024-21626 (CVSS 8.6) detected in container runtime filesystem layer.\`,
          \`[\${formattedTime}] [CRITICAL] Trivy CVE-2023-45853 (CVSS 9.8) zlib arbitrary code execution vulnerability.\`,
          \`[\${formattedTime}] [GATEKEEPER] Automated Deployment Gatekeeper evaluated aggregate risk score: 89/100 (Threshold: 35).\`,
          \`[\${formattedTime}] [DECISION] Gatekeeper verdict: >>> REJECTED <<<. Deployment halted to prevent production compromise.\`,
          \`[\${formattedTime}] [NOTIFICATION] PagerDuty P1 incident dispatched to SecOps & On-Call DevOps Engineers.\`,
        ],
      });
    }

    // Evaluation Logic for LOW Risk Trigger (Default Safe State)
    return res.status(200).json({
      status: 'safe',
      risk_score: 12,
      gatekeeper_decision: 'DEPLOYED',
      config_trigger: 'LOW',
      sync_time: formattedTime,
      iso_timestamp: timestamp,
      summary: 'ALL QUALITY & SECURITY GATES PASSED - PRODUCTION ARTIFACT LIVE',
      metrics: {
        sonarqube_blockers: 0,
        trivy_cve_critical: 0,
        test_coverage_pct: 94.8,
        target_environment: 'production-us-east-1',
      },
      logs: [
        \`[\${formattedTime}] [INIT] Initiating CI/CD build run #4830 on branch 'main' (commit sha: 3e7c9f2)...\`,
        \`[\${formattedTime}] [LINT] ESLint & Prettier code style validation completed: 0 errors, 0 warnings.\`,
        \`[\${formattedTime}] [SCAN] SonarQube Quality Gate PASSED: Security Rating A, Reliability A, Duplications 0.4%.\`,
        \`[\${formattedTime}] [SCAN] Trivy Container Vulnerability Scanner completed: 0 Critical, 0 High vulnerabilities.\`,
        \`[\${formattedTime}] [TEST] Jest suite executed 148 unit & integration tests across 18 suites: 100% passing.\`,
        \`[\${formattedTime}] [BUILD] Docker container optimized build complete. Digest: sha256:7c9e21bf...\`,
        \`[\${formattedTime}] [GATEKEEPER] Automated Deployment Gatekeeper evaluated aggregate risk score: 12/100 (Threshold: 35).\`,
        \`[\${formattedTime}] [DECISION] Gatekeeper verdict: >>> DEPLOYED <<< Approved for automated release.\`,
        \`[\${formattedTime}] [AWS] Pushing assets to S3 origin bucket 's3://prod-edge-artifacts-us-east-1'...\`,
        \`[\${formattedTime}] [AWS] Triggering AWS CloudFront cache invalidation on distribution E27KL918EXAMPLE...\`,
        \`[\${formattedTime}] [STATUS] AWS CloudFront Distribution synced worldwide. Healthcheck 200 OK across 42 edge pops.\`,
      ],
    });
  } catch (err) {
    console.error('[SERVER ERROR] Failed reading health_config.txt:', err);
    return res.status(500).json({
      status: 'error',
      risk_score: 100,
      gatekeeper_decision: 'REJECTED',
      sync_time: new Date().toLocaleTimeString(),
      summary: 'INTERNAL PIPELINE CONFIGURATION READ ERROR',
      logs: [
        \`[\${new Date().toLocaleTimeString()}] [FATAL] Exception occurred reading '\${CONFIG_FILE_PATH}': \${err.message}\`,
        \`[\${new Date().toLocaleTimeString()}] [GATEKEEPER] Defaulting to REJECTED due to configuration file failure.\`,
      ],
    });
  }
});

// Start Server on Port 5000
app.listen(PORT, () => {
  console.log(\`========================================================\`);
  console.log(\`[DEVOPS PIPELINE ENGINE] Server executing on port \${PORT}\`);
  console.log(\`[STATUS ENDPOINT] http://localhost:\${PORT}/api/status\`);
  console.log(\`[CONFIG FILE]     \${CONFIG_FILE_PATH}\`);
  console.log(\`========================================================\`);
});
`;

export const FRONTEND_INDEX_CONTENT = `<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Risk-Aware Deployment Pipeline Dashboard</title>
  
  <!-- Bootstrap 5 CSS via CDN -->
  <link 
    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" 
    rel="stylesheet" 
    integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" 
    crossorigin="anonymous"
  >

  <!-- Google Fonts: Plus Jakarta Sans for UI + JetBrains Mono for DevOps Logs -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    /* ==========================================================================
       DevOps Dark Mode Console Palette & Typography Rules
       ========================================================================== */
    :root {
      --bg-canvas: #090d16;
      --bg-surface: #111827;
      --border-subtle: #243246;
      --color-safe-base: #10b981;
      --color-safe-glow: rgba(16, 185, 129, 0.25);
      --color-safe-bg: rgba(16, 185, 129, 0.08);
      --color-risk-base: #ef4444;
      --color-risk-glow: rgba(239, 68, 68, 0.35);
      --color-risk-bg: rgba(239, 68, 68, 0.12);
      --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    body {
      background-color: var(--bg-canvas);
      color: #e2e8f0;
      font-family: var(--font-sans);
      min-height: 100vh;
      margin: 0;
    }

    .tabular-num {
      font-variant-numeric: tabular-nums;
    }

    .devops-navbar {
      background-color: rgba(17, 24, 39, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-subtle);
    }

    /* Top Dynamic Status Alert Box */
    .status-alert-box {
      border-radius: 8px;
      padding: 1.1rem 1.5rem;
      transition: all 400ms cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid transparent;
    }

    .status-alert-box.state-safe {
      background-color: var(--color-safe-bg);
      border-color: var(--color-safe-base);
      color: #a7f3d0;
      box-shadow: 0 0 20px var(--color-safe-glow);
    }

    .status-alert-box.state-danger {
      background-color: var(--color-risk-bg);
      border-color: var(--color-risk-base);
      color: #fecaca;
      box-shadow: 0 0 25px var(--color-risk-glow);
    }

    .status-alert-box.state-connecting {
      background-color: rgba(59, 130, 246, 0.08);
      border-color: #3b82f6;
      color: #bfdbfe;
    }

    /* Three Grid Metric Cards */
    .metric-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 1.25rem 1.5rem;
      transition: transform 200ms ease, border-color 300ms ease;
      height: 100%;
    }

    .metric-card:hover {
      transform: translateY(-2px);
      border-color: #334155;
    }

    .metric-card.border-safe { border-color: rgba(16, 185, 129, 0.4); }
    .metric-card.border-danger { border-color: rgba(239, 68, 68, 0.6); }

    .metric-value {
      font-size: 2.25rem;
      font-weight: 800;
      line-height: 1.1;
    }

    .metric-label {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #94a3b8;
      font-weight: 600;
      margin-bottom: 0.35rem;
    }

    /* Flashing / Strobe Animation for Risk Exceptions */
    @keyframes riskStrobe {
      0%, 100% { opacity: 1; filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.8)); }
      50% { opacity: 0.35; filter: none; }
    }

    .flashing-danger {
      color: var(--color-risk-base) !important;
      animation: riskStrobe 1.2s infinite ease-in-out;
    }

    .text-safe-glow {
      color: var(--color-safe-base) !important;
      text-shadow: 0 0 12px var(--color-safe-glow);
    }

    /* Log Shell Terminal View */
    .terminal-container {
      background-color: #05080f;
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
    }

    .terminal-header {
      background-color: #0b111e;
      border-bottom: 1px solid var(--border-subtle);
      padding: 0.65rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .terminal-window-dots {
      display: flex;
      gap: 6px;
    }

    .terminal-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .dot-close { background: #ef4444; }
    .dot-min { background: #f59e0b; }
    .dot-max { background: #10b981; }

    .terminal-body {
      font-family: var(--font-mono);
      font-size: 0.85rem;
      padding: 1.25rem;
      height: 380px;
      overflow-y: auto;
      scroll-behavior: smooth;
      background: #05080f;
    }

    .log-line {
      margin-bottom: 0.35rem;
      white-space: pre-wrap;
      word-break: break-all;
      line-height: 1.5;
    }
    .log-line.log-critical { color: #f87171; font-weight: 700; background: rgba(239,68,68,0.1); padding: 2px 4px; }
    .log-line.log-error { color: #fca5a5; }
    .log-line.log-success { color: #6ee7b7; }
    .log-line.log-info { color: #93c5fd; }
    .log-line.log-system { color: #94a3b8; }

    .pulse-beacon {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background-color: var(--color-safe-base);
      display: inline-block;
    }
    .pulse-beacon.beacon-danger {
      background-color: var(--color-risk-base);
      box-shadow: 0 0 8px var(--color-risk-base);
    }
  </style>
</head>
<body>

  <!-- Top Navigation -->
  <header class="devops-navbar py-3 px-4 mb-4">
    <div class="container-fluid d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-3">
        <span class="fs-5 fw-bold text-white">
          <span class="text-primary fw-bolder">DevOps</span> Pipeline Gatekeeper
        </span>
        <span class="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle">
          Automated Risk Orchestrator
        </span>
      </div>

      <div class="d-flex align-items-center gap-3">
        <div class="d-inline-flex align-items-center gap-2 px-3 py-1 bg-dark rounded border border-secondary font-mono small">
          <span id="pulseBeacon" class="pulse-beacon"></span>
          <span>POLL: 3000ms</span>
        </div>
        <span class="text-muted small d-none d-md-inline">Target: <code>http://localhost:5000/api/status</code></span>
      </div>
    </div>
  </header>

  <!-- Main Dashboard -->
  <main class="container-fluid px-4 pb-5 flex-grow-1">

    <!-- Block 1: Top Panel Alert Box -->
    <section class="mb-4">
      <div id="topAlertBox" class="status-alert-box state-connecting d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div class="d-flex align-items-center gap-3">
          <div id="alertIconContainer" class="fs-3">&#9203;</div>
          <div>
            <div id="alertTitle" class="fw-bold fs-5 mb-0">Connecting to Pipeline Engine...</div>
            <div id="alertSubtitle" class="small opacity-75">Querying backend status service on port 5000</div>
          </div>
        </div>

        <div class="d-flex align-items-center gap-2">
          <span class="text-uppercase small fw-bold opacity-75">Active Gate:</span>
          <span id="alertGateBadge" class="badge bg-dark border border-secondary text-light px-3 py-2 fs-6">
            EVALUATING
          </span>
        </div>
      </div>
    </section>

    <!-- Block 2: Three Grid Stats Cards -->
    <section class="mb-4">
      <div class="row g-3">
        
        <!-- Card 1: Risk Metric -->
        <div class="col-12 col-md-4">
          <div id="cardRiskScore" class="metric-card">
            <div class="d-flex justify-content-between align-items-start">
              <span class="metric-label">Active Risk Metric</span>
              <span class="badge bg-dark-subtle text-muted border border-secondary-subtle small">Threshold: 35%</span>
            </div>
            <div class="d-flex align-items-baseline gap-2 mt-2">
              <span id="metricRiskValue" class="metric-value tabular-num text-safe-glow">--%</span>
              <span id="metricRiskRating" class="small text-muted fw-semibold">Evaluating</span>
            </div>
            <div class="progress mt-3" style="height: 6px; background-color: #1e293b;">
              <div id="metricRiskBar" class="progress-bar bg-success" style="width: 0%; transition: width 0.4s ease;"></div>
            </div>
          </div>
        </div>

        <!-- Card 2: Gatekeeper Decision -->
        <div class="col-12 col-md-4">
          <div id="cardGatekeeper" class="metric-card">
            <div class="d-flex justify-content-between align-items-start">
              <span class="metric-label">Gatekeeper Decision</span>
              <span class="badge bg-dark-subtle text-muted border border-secondary-subtle small">Automated Arbiter</span>
            </div>
            <div class="mt-2">
              <div id="metricDecisionValue" class="metric-value tabular-num text-safe-glow">PENDING</div>
              <div id="metricDecisionSub" class="small text-muted fw-semibold mt-1">Awaiting live telemetry</div>
            </div>
          </div>
        </div>

        <!-- Card 3: Live Sync Time -->
        <div class="col-12 col-md-4">
          <div id="cardSyncTime" class="metric-card">
            <div class="d-flex justify-content-between align-items-start">
              <span class="metric-label">Live Sync Telemetry</span>
              <span class="badge bg-dark-subtle text-info border border-info-subtle small">Sync: 3000ms</span>
            </div>
            <div class="mt-2">
              <div id="metricSyncTimeValue" class="metric-value tabular-num text-light">--:--:--</div>
              <div id="metricSyncCounter" class="small text-muted fw-semibold mt-1">Cycles completed: 0</div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Block 3: Log Shell Terminal View -->
    <section>
      <div class="terminal-container">
        <div class="terminal-header">
          <div class="d-flex align-items-center gap-3">
            <div class="terminal-window-dots">
              <span class="terminal-dot dot-close"></span>
              <span class="terminal-dot dot-min"></span>
              <span class="terminal-dot dot-max"></span>
            </div>
            <span class="small font-mono text-muted">ci-cd-stream // sonarqube-trivy-cloudfront-pipeline.log</span>
          </div>

          <div class="d-flex align-items-center gap-2">
            <button id="btnClearLogs" class="btn btn-sm btn-outline-secondary font-mono py-0 px-2" style="font-size: 0.75rem;">Clear Shell</button>
            <button id="btnCopyLogs" class="btn btn-sm btn-outline-secondary font-mono py-0 px-2" style="font-size: 0.75rem;">Copy Logs</button>
          </div>
        </div>

        <div id="terminalBody" class="terminal-body">
          <div class="log-line log-system">[SYSTEM] Dashboard client initialized. Starting 3000ms polling cycle...</div>
        </div>
      </div>
    </section>

  </main>

  <!-- Dynamic Script Engine -->
  <script>
    const API_ENDPOINT = 'http://localhost:5000/api/status';
    const POLL_INTERVAL_MS = 3000;

    let pollCycleCount = 0;
    let lastRenderedState = null;
    let loggedEntriesSet = new Set();

    const elTopAlert = document.getElementById('topAlertBox');
    const elAlertIcon = document.getElementById('alertIconContainer');
    const elAlertTitle = document.getElementById('alertTitle');
    const elAlertSubtitle = document.getElementById('alertSubtitle');
    const elAlertGateBadge = document.getElementById('alertGateBadge');
    const elMetricRiskVal = document.getElementById('metricRiskValue');
    const elMetricRiskRating = document.getElementById('metricRiskRating');
    const elMetricRiskBar = document.getElementById('metricRiskBar');
    const elCardRiskScore = document.getElementById('cardRiskScore');
    const elMetricDecision = document.getElementById('metricDecisionValue');
    const elMetricDecisionSub = document.getElementById('metricDecisionSub');
    const elCardGatekeeper = document.getElementById('cardGatekeeper');
    const elMetricSyncTime = document.getElementById('metricSyncTimeValue');
    const elMetricSyncCounter = document.getElementById('metricSyncCounter');
    const elTerminalBody = document.getElementById('terminalBody');
    const elPulseBeacon = document.getElementById('pulseBeacon');

    function appendTerminalLog(logText) {
      if (!logText) return;
      const logRow = document.createElement('div');
      logRow.className = 'log-line';

      if (logText.includes('[CRITICAL]') || logText.includes('[FATAL]')) {
        logRow.classList.add('log-critical');
      } else if (logText.includes('[ERROR]') || logText.includes('FAILED') || logText.includes('REJECTED')) {
        logRow.classList.add('log-error');
      } else if (logText.includes('[STATUS]') || logText.includes('DEPLOYED') || logText.includes('PASSED')) {
        logRow.classList.add('log-success');
      } else if (logText.includes('[AWS]') || logText.includes('[SCAN]') || logText.includes('[INIT]')) {
        logRow.classList.add('log-info');
      } else {
        logRow.classList.add('log-system');
      }

      logRow.textContent = logText;
      elTerminalBody.appendChild(logRow);
      elTerminalBody.scrollTop = elTerminalBody.scrollHeight;
    }

    function renderSafeState(data) {
      elTopAlert.className = 'status-alert-box state-safe d-flex align-items-center justify-content-between flex-wrap gap-3';
      elAlertIcon.innerHTML = '&#9989;';
      elAlertTitle.textContent = 'DEPLOYMENT PIPELINE HEALTHY: PRODUCTION RELEASE APPROVED';
      elAlertSubtitle.textContent = data.summary || 'All static security checks passed. Zero blockers detected.';
      elAlertGateBadge.className = 'badge bg-success-subtle text-success border border-success px-3 py-2 fs-6';
      elAlertGateBadge.textContent = 'GATE PASS: DEPLOYED';

      elMetricRiskVal.textContent = \`\${data.risk_score}%\`;
      elMetricRiskVal.className = 'metric-value tabular-num text-safe-glow';
      elMetricRiskRating.textContent = 'LOW RISK (Nominal)';
      elMetricRiskRating.className = 'small text-success fw-semibold';
      elMetricRiskBar.className = 'progress-bar bg-success';
      elMetricRiskBar.style.width = \`\${data.risk_score}%\`;
      elCardRiskScore.className = 'metric-card border-safe';

      elMetricDecision.textContent = data.gatekeeper_decision || 'DEPLOYED';
      elMetricDecision.className = 'metric-value tabular-num text-safe-glow';
      elMetricDecisionSub.textContent = 'Artifacts published to AWS CloudFront';
      elMetricDecisionSub.className = 'small text-success fw-semibold mt-1';
      elCardGatekeeper.className = 'metric-card border-safe';

      elPulseBeacon.className = 'pulse-beacon';
    }

    function renderDangerState(data) {
      elTopAlert.className = 'status-alert-box state-danger d-flex align-items-center justify-content-between flex-wrap gap-3';
      elAlertIcon.innerHTML = '&#9888;&#65039;';
      elAlertTitle.textContent = 'SECURITY CRITICAL RISK EXCEPTION: PIPELINE HALTED';
      elAlertSubtitle.textContent = data.summary || 'Gatekeeper blocked release due to SonarQube & Trivy scan failures.';
      elAlertGateBadge.className = 'badge bg-danger-subtle text-danger border border-danger px-3 py-2 fs-6 flashing-danger';
      elAlertGateBadge.textContent = 'GATE FAIL: REJECTED';

      elMetricRiskVal.textContent = \`\${data.risk_score}%\`;
      elMetricRiskVal.className = 'metric-value tabular-num flashing-danger';
      elMetricRiskRating.textContent = 'CRITICAL RISK (Violation)';
      elMetricRiskRating.className = 'small text-danger fw-semibold';
      elMetricRiskBar.className = 'progress-bar bg-danger';
      elMetricRiskBar.style.width = \`\${data.risk_score}%\`;
      elCardRiskScore.className = 'metric-card border-danger';

      elMetricDecision.textContent = data.gatekeeper_decision || 'REJECTED';
      elMetricDecision.className = 'metric-value tabular-num flashing-danger';
      elMetricDecisionSub.textContent = 'Deployment aborted to protect production';
      elMetricDecisionSub.className = 'small text-danger fw-semibold mt-1';
      elCardGatekeeper.className = 'metric-card border-danger';

      elPulseBeacon.className = 'pulse-beacon beacon-danger';
    }

    function renderOfflineState(errMsg) {
      elTopAlert.className = 'status-alert-box state-connecting d-flex align-items-center justify-content-between flex-wrap gap-3';
      elAlertIcon.innerHTML = '&#128268;';
      elAlertTitle.textContent = 'Waiting for Backend Server Engine (port 5000)...';
      elAlertSubtitle.textContent = 'Run in terminal: "node backend/server.js"';
      elAlertGateBadge.className = 'badge bg-secondary border border-secondary text-light px-3 py-2 fs-6';
      elAlertGateBadge.textContent = 'AWAITING HOST';
      elPulseBeacon.className = 'pulse-beacon';
    }

    async function fetchStatus() {
      pollCycleCount++;
      elMetricSyncCounter.textContent = \`Cycles completed: \${pollCycleCount}\`;

      try {
        const response = await fetch(API_ENDPOINT, { cache: 'no-store' });
        if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
        const data = await response.json();

        elMetricSyncTime.textContent = data.sync_time || new Date().toLocaleTimeString();

        if (data.status === 'danger') {
          renderDangerState(data);
        } else {
          renderSafeState(data);
        }

        if (Array.isArray(data.logs)) {
          if (lastRenderedState !== data.status) {
            appendTerminalLog('--------------------------------------------------------------------------------');
            appendTerminalLog(\`[\${data.sync_time}] [STATE-CHANGE] Configuration detected: RISK_TRIGGER=\${data.config_trigger}\`);
            appendTerminalLog(\`[\${data.sync_time}] [TRANSITION] Gatekeeper verdict: >>> \${data.gatekeeper_decision} <<<\`);
            appendTerminalLog('--------------------------------------------------------------------------------');
            lastRenderedState = data.status;
          }

          data.logs.forEach(logLine => {
            if (!loggedEntriesSet.has(logLine)) {
              loggedEntriesSet.add(logLine);
              appendTerminalLog(logLine);
            }
          });

          if (loggedEntriesSet.size > 200) loggedEntriesSet.clear();
        }
      } catch (err) {
        renderOfflineState(err.message);
        appendTerminalLog(\`[\${new Date().toLocaleTimeString()}] [WARN] Polling attempt #\${pollCycleCount} unreachable: \${err.message}\`);
      }
    }

    document.getElementById('btnClearLogs').addEventListener('click', () => {
      elTerminalBody.innerHTML = '';
      appendTerminalLog(\`[\${new Date().toLocaleTimeString()}] [SYSTEM] Terminal output buffer cleared.\`);
    });

    document.getElementById('btnCopyLogs').addEventListener('click', () => {
      const logs = Array.from(elTerminalBody.querySelectorAll('.log-line')).map(l => l.textContent).join('\\n');
      navigator.clipboard.writeText(logs);
      const btn = document.getElementById('btnCopyLogs');
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = orig; }, 1500);
      }
    });

    fetchStatus();
    setInterval(fetchStatus, POLL_INTERVAL_MS);
  </script>
</body>
</html>
`;

export const CODE_FILES: CodeFileRecord[] = [
  {
    id: 'health_config',
    filename: 'health_config.txt',
    path: 'backend/health_config.txt',
    language: 'plaintext',
    description: 'Manual risk trigger switch evaluated by the pipeline gatekeeper on every polling interval.',
    purpose: 'Acts as our live operational toggle string. Setting RISK_TRIGGER=HIGH forces pipeline rejection; RISK_TRIGGER=LOW permits production release.',
    content: HEALTH_CONFIG_CONTENT,
  },
  {
    id: 'server_js',
    filename: 'server.js',
    path: 'backend/server.js',
    language: 'javascript',
    description: 'Lightweight Express.js server engine executing on port 5000 with CORS and dynamic file reading.',
    purpose: 'Listens on GET /api/status. Reads health_config.txt in real-time and evaluates security gatekeeper rules.',
    content: SERVER_JS_CONTENT,
  },
  {
    id: 'index_html',
    filename: 'index.html',
    path: 'frontend/index.html',
    language: 'html',
    description: 'DevOps Dark Mode console single-file frontend built with semantic HTML5, Bootstrap 5 CDN, and Vanilla JS.',
    purpose: 'Queries http://localhost:5000/api/status every 3000ms using fetch() and updates the top alert box, 3 metric cards, and log shell terminal in real time.',
    content: FRONTEND_INDEX_CONTENT,
  },
];
