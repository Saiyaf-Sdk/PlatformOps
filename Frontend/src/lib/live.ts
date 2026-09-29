import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_URL, freshAccessToken } from './api';
import { session } from './session';
import type { Deployment, DeploymentLog } from './types';

export type LiveHandler = (type: string, payload: unknown) => void;

/**
 * Subscribes to the API's Server-Sent Events stream and keeps React Query caches live.
 * Reconnects with a fresh token after errors (tokens are short-lived).
 */
export function useLiveEvents(onEvent?: LiveHandler) {
  const qc = useQueryClient();

  useEffect(() => {
    let es: EventSource | null = null;
    let stopped = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let backoff = 2000;

    const handle = (type: string) => (e: MessageEvent) => {
      let data: { payload?: unknown } = {};
      try { data = JSON.parse(e.data); } catch { return; }
      const payload = data.payload;

      if (type === 'deployment.log') {
        const log = payload as DeploymentLog;
        qc.setQueryData<DeploymentLog[]>(['deployment-logs', log.deploymentId], (old) =>
          old ? (old.some((l) => l.id === log.id) ? old : [...old, log]) : old);
      } else if (type.startsWith('deployment.')) {
        const d = payload as Deployment;
        qc.setQueryData(['deployment', d.id], d);
        qc.invalidateQueries({ queryKey: ['deployments'] });
        qc.invalidateQueries({ queryKey: ['dashboard'] });
        if (d.status === 'SUCCEEDED' || d.status === 'FAILED') {
          qc.invalidateQueries({ queryKey: ['applications'] });
          qc.invalidateQueries({ queryKey: ['environments'] });
        }
      } else if (type.startsWith('incident.')) {
        qc.invalidateQueries({ queryKey: ['incidents'] });
        qc.invalidateQueries({ queryKey: ['dashboard'] });
      } else if (type.startsWith('application.')) {
        qc.invalidateQueries({ queryKey: ['applications'] });
        qc.invalidateQueries({ queryKey: ['dashboard'] });
      } else if (type.startsWith('environment.')) {
        qc.invalidateQueries({ queryKey: ['environments'] });
        qc.invalidateQueries({ queryKey: ['dashboard'] });
      }
      onEvent?.(type, payload);
    };

    const types = ['deployment.created', 'deployment.updated', 'deployment.log', 'incident.created', 'incident.updated',
      'application.created', 'application.updated', 'application.deleted', 'environment.updated'];

    const connect = async () => {
      if (stopped) return;
      const token = await freshAccessToken();
      if (!token || stopped) return;
      es = new EventSource(`${API_URL}/events/stream?access_token=${encodeURIComponent(token)}`);
      es.addEventListener('ready', () => { backoff = 2000; });
      types.forEach((t) => es!.addEventListener(t, handle(t) as EventListener));
      es.onerror = () => {
        es?.close();
        es = null;
        if (stopped) return;
        retry = setTimeout(connect, backoff);
        backoff = Math.min(backoff * 2, 30_000);
      };
    };

    connect();
    const unsub = session.subscribe((s) => { if (!s) { stopped = true; es?.close(); } });

    return () => {
      stopped = true;
      clearTimeout(retry);
      es?.close();
      unsub();
    };
  }, [qc, onEvent]);
}
