export type RiskTriggerLevel = 'LOW' | 'HIGH';

export type PipelineStatus = 'safe' | 'danger' | 'error';

export type GatekeeperDecision = 'DEPLOYED' | 'REJECTED' | 'EVALUATING';

export interface PipelineMetrics {
  sonarqube_blockers: number;
  trivy_cve_critical: number;
  test_coverage_pct: number;
  target_environment: string;
}

export interface PipelineStatusResponse {
  status: PipelineStatus;
  risk_score: number;
  gatekeeper_decision: GatekeeperDecision;
  config_trigger: RiskTriggerLevel;
  sync_time: string;
  iso_timestamp?: string;
  summary: string;
  metrics?: PipelineMetrics;
  logs: string[];
}
