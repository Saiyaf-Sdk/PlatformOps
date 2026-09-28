import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { RevealWords, SpotPanel } from '../components/fx';
import { ease, rise } from '../components/motion';
import { EmptyState, ErrorState, Pager, Select, Skeleton } from '../components/ui';
import { useAudit } from '../lib/queries';
import { errorMessage } from '../lib/api';
import { dateTime, timeAgo } from '../lib/format';

const ACTIONS = ['LOGIN', 'LOGIN_FAILED', 'ACCOUNT_LOCKED', 'DEPLOYMENT_REQUESTED', 'DEPLOYMENT_SUCCEEDED', 'DEPLOYMENT_FAILED',
  'DEPLOYMENT_ROLLBACK', 'DEPLOYMENT_CANCEL_REQUESTED', 'APPLICATION_CREATED', 'APPLICATION_UPDATED', 'APPLICATION_DELETED',
  'INCIDENT_OPENED', 'INCIDENT_ACKNOWLEDGED', 'INCIDENT_RESOLVED', 'INCIDENT_UPDATED', 'USER_CREATED', 'USER_UPDATED', 'PASSWORD_CHANGED'];

const tone = (a: string) =>
  /FAILED|LOCKED|REUSE|BLOCKED/.test(a) ? 'text-bad' : /DELETED|ROLLBACK|CANCEL/.test(a) ? 'text-warn' : /SUCCEEDED|RESOLVED|CREATED/.test(a) ? 'text-ok' : 'text-sky';

export default function AuditLog() {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => { const t = setTimeout(() => { setDebounced(q); setPage(0); }, 300); return () => clearTimeout(t); }, [q]);
  const { data, isLoading, isError, error, refetch } = useAudit({ q: debounced, action, page });

  if (isError) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="space-y-8">
      <header>
        <motion.p {...rise(0)} className="tag">Governance · {data?.totalElements ?? '…'} events</motion.p>
        <h1 className="mt-4 font-display text-[clamp(2.6rem,6vw,4.75rem)] font-extrabold leading-[0.98]">
          <RevealWords delay={0.06} parts={[{ t: 'who did' }, { t: 'WHAT,', className: 'grad' }, 'br', { t: 'and', className: 'thin' }, { t: 'when.' }]} />
        </h1>
      </header>

      <motion.div {...rise(0.12)} className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="flex h-11 w-full items-center gap-2.5 rounded-full border border-line-strong bg-surface px-4 text-fg-3 transition-colors focus-within:border-iris lg:max-w-sm">
          <Search className="h-4 w-4 shrink-0" strokeWidth={2} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search details, people, ids"
            className="w-full bg-transparent text-[0.9rem] font-medium text-fg placeholder:text-fg-3 focus:outline-none" />
        </label>
        <Select value={action} onChange={(e) => { setAction(e.target.value); setPage(0); }} className="w-full lg:w-72">
          <option value="">every action</option>
          {ACTIONS.map((a) => <option key={a} value={a}>{a.toLowerCase().replace(/_/g, ' ')}</option>)}
        </Select>
      </motion.div>

      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 !rounded-2xl" />)}</div>
      ) : !data?.content.length ? (
        <EmptyState title={<>no <span className="grad">EVENTS</span></>} body="Nothing matches this search." />
      ) : (
        <SpotPanel className="overflow-hidden">
          <div className="overflow-x-auto" data-lenis-prevent>
            <table className="w-full min-w-[760px] text-left text-[0.875rem]">
              <thead>
                <tr className="border-b border-line">
                  {['When', 'Who', 'Action', 'Details', 'IP'].map((h) => <th key={h} className="tag px-5 py-3 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.content.map((e, i) => (
                  <motion.tr key={e.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 15) * 0.02, ease }}
                    className="border-b border-line align-top last:border-0 hover:bg-surface-2">
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[0.75rem] text-fg-3" title={dateTime(e.createdAt)}>{timeAgo(e.createdAt)}</td>
                    <td className="px-5 py-3.5 font-semibold">{e.actorEmail ?? 'system'}</td>
                    <td className="px-5 py-3.5"><span className={`chip font-mono !text-[0.64rem] ${tone(e.action)}`}>{e.action}</span></td>
                    <td className="max-w-md px-5 py-3.5 font-medium text-fg-2">{e.details ?? '—'}<span className="ml-2 font-mono text-[0.7rem] text-fg-3">{e.entityType}{e.entityId ? `#${e.entityId}` : ''}</span></td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[0.75rem] text-fg-3">{e.ipAddress ?? '—'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={data.page} totalPages={data.totalPages} onPage={setPage} />
        </SpotPanel>
      )}
    </div>
  );
}
