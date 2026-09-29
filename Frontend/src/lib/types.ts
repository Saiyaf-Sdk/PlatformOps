// Mirrors the PlatformOps API DTOs (Backend/src/main/java/com/platformops/**/…Dtos.java)

export type Role = 'ADMIN' | 'DEVOPS' | 'DEVELOPER' | 'VIEWER';
export type AppStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL';
export type EnvCode = 'DEV' | 'STAGING' | 'PRODUCTION';
export type EnvStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN';
export type DeploymentStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
export type Stage = 'BUILD' | 'IMAGE' | 'DEPLOY' | 'VERIFY';
export type Severity = 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';
export type IncidentStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  enabled: boolean;
  locked: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface UserRef { id: number; fullName: string; email: string }
export interface AppRef { id: number; name: string }
export interface EnvRef { id: number; code: EnvCode; displayName: string }

export interface TokenResponse {
  tokenType: 'Bearer';
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: User;
}

export interface Application {
  id: number;
  name: string;
  description: string;
  runtime: string;
  ownerTeam: string;
  repoUrl: string;
  status: AppStatus;
  currentVersion?: string;
  lastDeployedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Environment {
  id: number;
  code: EnvCode;
  displayName: string;
  cluster: string;
  namespace: string;
  status: EnvStatus;
  healthScore: number;
  podsRunning: number;
  currentVersion?: string;
  lastDeployedAt?: string;
  requiresApproval: boolean;
}

export interface Deployment {
  id: number;
  application: AppRef;
  environment: EnvRef;
  version: string;
  status: DeploymentStatus;
  currentStage?: Stage;
  progress: number;
  triggeredBy?: UserRef;
  commitSha?: string;
  buildNumber?: number;
  imageUri?: string;
  notes?: string;
  failureReason?: string;
  rollbackOfId?: number;
  cancelRequested: boolean;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  durationSeconds?: number;
}

export interface DeploymentLog {
  id: number;
  deploymentId: number;
  stage: Stage;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  at: string;
}

export interface Incident {
  id: number;
  title: string;
  description?: string;
  severity: Severity;
  status: IncidentStatus;
  application?: AppRef;
  environment?: EnvRef;
  deploymentId?: number;
  assignee?: UserRef;
  reportedBy?: UserRef;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: number;
  actorId?: number;
  actorEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface DashboardSummary {
  kpis: {
    applications: number;
    healthyApplications: number;
    healthyPercent: number;
    degradedApplications: number;
    deploysToday: number;
    deploysYesterday: number;
    activeDeployments: number;
    openIncidents: number;
    unassignedIncidents: number;
  };
  deployVolume: { date: string; count: number }[];
  deployVolumeTotal: number;
  deployVolumeChangePercent: number;
  environments: Environment[];
  recentDeployments: Deployment[];
  generatedAt: string;
}

export interface LiveEvent<T = unknown> {
  type: string;
  payload: T;
  at: string;
}
