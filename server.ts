import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Path to the backend configuration file
  const CONFIG_FILE_PATH = path.join(__dirname, 'backend', 'health_config.txt');

  /**
   * Status Endpoint: GET /api/status
   * Reads backend/health_config.txt dynamically on every request.
   */
  app.get('/api/status', (req, res) => {
    try {
      let configContent = 'RISK_TRIGGER=LOW';
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        configContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8').trim();
      } else {
        // Ensure folder and file exist
        const dir = path.dirname(CONFIG_FILE_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_FILE_PATH, 'RISK_TRIGGER=LOW\n', 'utf-8');
      }

      const timestamp = new Date().toISOString();
      const formattedTime = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      // RISK_TRIGGER=HIGH Evaluation
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

      // RISK_TRIGGER=LOW Evaluation (Default Safe State)
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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({
        status: 'error',
        risk_score: 100,
        gatekeeper_decision: 'REJECTED',
        sync_time: new Date().toLocaleTimeString(),
        summary: 'INTERNAL PIPELINE CONFIGURATION READ ERROR',
        logs: [`[FATAL] Error reading health_config.txt: ${errorMsg}`],
      });
    }
  });

  /**
   * Toggle Endpoint: POST /api/toggle
   * Programmatically updates backend/health_config.txt on disk
   */
  app.post('/api/toggle', (req, res) => {
    try {
      const nextTrigger = req.body && req.body.trigger === 'HIGH' ? 'HIGH' : 'LOW';
      const dir = path.dirname(CONFIG_FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(CONFIG_FILE_PATH, `RISK_TRIGGER=${nextTrigger}\n`, 'utf-8');
      return res.status(200).json({
        success: true,
        current_trigger: nextTrigger,
        message: `Updated backend/health_config.txt to RISK_TRIGGER=${nextTrigger}`,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ success: false, error: errorMsg });
    }
  });

  /**
   * Config File Content Endpoint: GET /api/config-file
   */
  app.get('/api/config-file', (req, res) => {
    try {
      let content = 'RISK_TRIGGER=LOW';
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        content = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      }
      return res.json({ content, path: 'backend/health_config.txt' });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: errorMsg });
    }
  });

  // Mount Vite middleware in development, or serve static dist in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EXPRESS BACKEND] Running on http://0.0.0.0:${PORT}`);
    console.log(`[API STATUS ENDPOINT] http://0.0.0.0:${PORT}/api/status`);
  });
}

startServer();
