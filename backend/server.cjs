/**
 * ==============================================================================
 * RISK-AWARE DEPLOYMENT PIPELINE ENGINE
 * File: backend/server.js
 * Architecture: Node.js + Express Framework + Dynamic File I/O
 * Port: 5000
 * ==============================================================================
 * 
 * INTEGRATION HOOKS EXPLANATION:
 * 1. Express & CORS Setup:
 *    - Uses Express to instantiate an HTTP REST server.
 *    - Mounts CORS middleware allowing cross-origin requests from any origin point,
 *      allowing the frontend (running on live-server, file://, or another localhost port)
 *      to query the API without encountering Cross-Origin Resource Sharing blocks.
 * 
 * 2. Dynamic Config Evaluation (`GET /api/status`):
 *    - Reads `health_config.txt` on EVERY incoming HTTP request using `fs.readFileSync`
 *      or `fs.promises.readFile`.
 *    - Ensures manual runtime changes in `health_config.txt` take effect immediately
 *      without requiring server restarts or recompilation.
 * 
 * 3. Gatekeeper Risk Analysis Logic:
 *    - Evaluates the `RISK_TRIGGER` key-value token:
 *      * HIGH: Simulates security scan gate failures (SonarQube quality gate failed,
 *        Trivy container CVE severity CRITICAL). Emits status 'danger', risk score 89,
 *        and gatekeeper decision 'REJECTED'.
 *      * LOW: Simulates clean static analysis, dependency compliance, automated smoke tests,
 *        and successful asset invalidation/distribution to AWS CloudFront. Emits status 'safe',
 *        risk score 12, and gatekeeper decision 'DEPLOYED'.
 * 
 * 4. Helper Toggle Endpoint (`POST /api/toggle`):
 *    - Allows developers or testing scripts to programmatically toggle between
 *      LOW and HIGH risk states directly from test runners or dashboard UI.
 * ==============================================================================
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Path to the dynamic health configuration file
const CONFIG_FILE_PATH = path.join(__dirname, 'health_config.txt');

// Middleware Configuration
app.use(cors()); // Allow cross-origin requests from any client
app.use(express.json());

/**
 * Core Status Endpoint: GET /api/status
 * Dynamically re-evaluates pipeline risk state on every tick.
 */
app.get('/api/status', (req, res) => {
  try {
    // Dynamic File I/O: Read file contents on every incoming request
    let configContent = 'RISK_TRIGGER=LOW';
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      configContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8').trim();
    } else {
      // Auto-initialize if file does not exist
      fs.writeFileSync(CONFIG_FILE_PATH, 'RISK_TRIGGER=LOW', 'utf-8');
    }

    const timestamp = new Date().toISOString();
    const formattedTime = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Check configuration toggle value
    if (configContent.includes('RISK_TRIGGER=HIGH')) {
      // HIGH RISK RESPONSE: Gatekeeper Rejection & Security Scan Vulnerabilities
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
      });
    }

    // LOW RISK / DEFAULT SAFE RESPONSE: Successful Deployment to AWS CloudFront
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
        `[${new Date().toLocaleTimeString()}] [FATAL] Exception occurred reading '${CONFIG_FILE_PATH}': ${err.message}`,
        `[${new Date().toLocaleTimeString()}] [GATEKEEPER] Defaulting to REJECTED due to configuration file failure.`,
      ],
    });
  }
});

/**
 * Optional Helper Route: POST /api/toggle
 * Enables one-click manual toggling directly from testing dashboards or curl commands.
 * Body: { trigger: 'HIGH' | 'LOW' }
 */
app.post('/api/toggle', (req, res) => {
  try {
    const nextTrigger = req.body && req.body.trigger === 'HIGH' ? 'HIGH' : 'LOW';
    fs.writeFileSync(CONFIG_FILE_PATH, `RISK_TRIGGER=${nextTrigger}\n`, 'utf-8');
    return res.status(200).json({
      success: true,
      current_trigger: nextTrigger,
      message: `Updated health_config.txt to RISK_TRIGGER=${nextTrigger}`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Start listening on execution port 5000
app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`[DEVOPS PIPELINE ENGINE] Server executing on port ${PORT}`);
  console.log(`[STATUS ENDPOINT] http://localhost:${PORT}/api/status`);
  console.log(`[CONFIG FILE]     ${CONFIG_FILE_PATH}`);
  console.log(`========================================================`);
});
