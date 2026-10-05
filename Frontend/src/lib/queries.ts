import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type {
  Application, AppStatus, AuditEvent, DashboardSummary, Deployment, DeploymentLog, DeploymentStatus, EnvCode,
  Environment, Incident, IncidentStatus, Page, Role, Severity, User,
} from './types';

const clean = (o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'ALL'));

// ── dashboard ─────────────────────────────────────────────
export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: async () =>
      (await api.get<DashboardSummary>('/dashboard/summary', { params: { tzOffsetMinutes: -new Date().getTimezoneOffset() } })).data,
    refetchInterval: 60_000,
  });

// ── applications ──────────────────────────────────────────
export interface AppFilters { q?: string; status?: AppStatus | 'ALL'; runtime?: string }

export const useApplications = (f: AppFilters = {}) =>
  useQuery({
    queryKey: ['applications', f],
    queryFn: async () => (await api.get<Page<Application>>('/applications', { params: { ...clean({ ...f }), size: 100 } })).data,
    placeholderData: keepPreviousData,
  });

export interface NewApplication { name: string; description: string; runtime: string; ownerTeam: string; repoUrl: string }

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: NewApplication) => (await api.post<Application>('/applications', body)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

// ── environments ──────────────────────────────────────────
export const useEnvironments = () =>
  useQuery({ queryKey: ['environments'], queryFn: async () => (await api.get<Environment[]>('/environments')).data });

export const useEnvironment = (code?: string) =>
  useQuery({
    queryKey: ['environment', code],
    enabled: !!code,
    queryFn: async () => (await api.get<Environment>(`/environments/${code}`)).data,
  });

// ── deployments ───────────────────────────────────────────
export interface DeploymentFilters {
  applicationId?: number; environment?: EnvCode | 'ALL'; status?: DeploymentStatus | 'ALL'; activeOnly?: boolean; page?: number; size?: number;
}

export const useDeployments = (f: DeploymentFilters = {}) =>
  useQuery({
    queryKey: ['deployments', f],
    queryFn: async () => (await api.get<Page<Deployment>>('/deployments', { params: clean({ ...f }) })).data,
    placeholderData: keepPreviousData,
  });

export const useDeployment = (id?: number) =>
  useQuery({
    queryKey: ['deployment', id],
    enabled: !!id,
    queryFn: async () => (await api.get<Deployment>(`/deployments/${id}`)).data,
  });

export const useDeploymentLogs = (id?: number) =>
  useQuery({
    queryKey: ['deployment-logs', id],
    enabled: !!id,
    queryFn: async () => (await api.get<DeploymentLog[]>(`/deployments/${id}/logs`)).data,
  });

export interface NewDeployment { applicationId: number; environment: EnvCode; version: string; notes?: string; force?: boolean }

function invalidateDeployments(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['deployments'] });
  qc.invalidateQueries({ queryKey: ['dashboard'] });
}

export function useCreateDeployment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: NewDeployment) => (await api.post<Deployment>('/deployments', body)).data,
    onSuccess: () => invalidateDeployments(qc),
  });
}

export function useRollback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) =>
      (await api.post<Deployment>(`/deployments/${id}/rollback`, { reason })).data,
    onSuccess: () => invalidateDeployments(qc),
  });
}

export function useCancelDeployment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.post<Deployment>(`/deployments/${id}/cancel`)).data,
    onSuccess: (d) => { invalidateDeployments(qc); qc.setQueryData(['deployment', d.id], d); },
  });
}

// ── incidents ─────────────────────────────────────────────
export interface IncidentFilters { q?: string; status?: IncidentStatus | 'ALL'; severity?: Severity | 'ALL'; openOnly?: boolean; page?: number }

export const useIncidents = (f: IncidentFilters = {}) =>
  useQuery({
    queryKey: ['incidents', f],
    queryFn: async () => (await api.get<Page<Incident>>('/incidents', { params: { ...clean({ ...f }), size: 50 } })).data,
    placeholderData: keepPreviousData,
  });

export interface NewIncident { title: string; description?: string; severity: Severity; applicationId?: number; environment?: EnvCode; assigneeId?: number }
export interface IncidentPatch { title?: string; description?: string; severity?: Severity; status?: IncidentStatus; assigneeId?: number; unassign?: boolean }

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: NewIncident) => (await api.post<Incident>('/incidents', body)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['incidents'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

export function useUpdateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: IncidentPatch & { id: number }) => (await api.patch<Incident>(`/incidents/${id}`, body)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['incidents'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

// ── audit ─────────────────────────────────────────────────
export interface AuditFilters { q?: string; action?: string; page?: number }

export const useAudit = (f: AuditFilters = {}, enabled = true) =>
  useQuery({
    queryKey: ['audit', f],
    enabled,
    queryFn: async () => (await api.get<Page<AuditEvent>>('/audit-events', { params: { ...clean({ ...f }), size: 30 } })).data,
    placeholderData: keepPreviousData,
  });

// ── people ────────────────────────────────────────────────
export const useUsers = (q?: string) =>
  useQuery({
    queryKey: ['users', q ?? ''],
    queryFn: async () => (await api.get<Page<User>>('/users', { params: { ...clean({ q }), size: 100 } })).data,
    placeholderData: keepPreviousData,
  });

export interface NewUser { email: string; fullName: string; password: string; role: Role }
export interface UserPatch { fullName?: string; role?: Role; enabled?: boolean }

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: NewUser) => (await api.post<User>('/users', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: UserPatch & { id: number }) => (await api.patch<User>(`/users/${id}`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUnlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.post<User>(`/users/${id}/unlock`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
