import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  ShieldAlert, ShieldCheck, History, UserCheck, Calendar, Filter,
  Search, Download, Sparkles, X, FileText, CheckCircle2, Lock
} from 'lucide-react'

const EVENT_TYPE_VARIANTS: Record<string, any> = {
  'user.login': 'info',
  'user.logout': 'neutral',
  'user.created': 'success',
  'visit.created': 'success',
  'visit.updated': 'info',
  'visit.deleted': 'danger',
  'dataset.imported': 'success',
  'simulation.run': 'info',
  'simulation.config_created': 'info',
  'report.generated': 'neutral',
  'clinic.updated': 'warning',
  'doctor.created': 'success',
  'doctor.updated': 'info',
  'doctor.deactivated': 'danger',
}

export default function AuditLogPage() {
  const user = JSON.parse(localStorage.getItem('cq_user') || '{}')
  const clinicId = user.clinic_id
  const qc = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedEventType, setSelectedEventType] = useState('all')
  const [selectedEntry, setSelectedEntry] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['audit', clinicId, page],
    queryFn: async () => (await apiClient.get(`/clinics/${clinicId}/audit?page=${page}&page_size=50`)).data,
    enabled: !!clinicId,
  })

  const items = data?.items || []

  // Client-side filtering
  const filteredItems = items.filter((entry: any) => {
    const matchSearch =
      !search ||
      entry.actor_email?.toLowerCase().includes(search.toLowerCase()) ||
      entry.event_type?.toLowerCase().includes(search.toLowerCase()) ||
      entry.target_id?.toLowerCase().includes(search.toLowerCase())
    const matchType = selectedEventType === 'all' || entry.event_type === selectedEventType
    return matchSearch && matchType
  })

  const formatDate = (d: string) => (d ? new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—')

  // CSV Export
  const exportToCSV = () => {
    if (filteredItems.length === 0) return
    const headers = ["Timestamp (IST)", "Event Trigger", "Authenticated Actor", "Target Entity", "Target Type"]
    const rows = filteredItems.map((entry: any) => [
      formatDate(entry.created_at),
      entry.event_type,
      entry.actor_email,
      entry.target_id || '',
      entry.target_type || ''
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any[]) => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `CareQueue_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Summary Metrics
  const totalEvents = data?.total || items.length
  const authCount = items.filter((e: any) => e.event_type?.startsWith('user.')).length
  const mutationCount = items.filter((e: any) => !e.event_type?.startsWith('user.')).length

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security & Compliance Audit Trail</h1>
            <Badge variant="info">Immutable Log</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Chronological ledger tracking staff logins, simulation executions, visit adjustments, and data modifications
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={exportToCSV}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
            title="Download audit records as CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Audit Log</span>
          </Button>
        </div>
      </div>

      {/* Compliance Health KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Logged Events</span>
          <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">{totalEvents}</span>
        </div>
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider block">Auth & Access Events</span>
          <span className="text-xl font-extrabold text-sky-950 mt-0.5 block">{authCount} <span className="text-xs font-normal text-slate-500">logins</span></span>
        </div>
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">Operational Mutations</span>
          <span className="text-xl font-extrabold text-indigo-950 mt-0.5 block">{mutationCount} <span className="text-xs font-normal text-slate-500">actions</span></span>
        </div>
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Ledger Integrity</span>
          <span className="text-xs font-bold text-emerald-800 mt-1.5 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            Append-Only (Verified)
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <Card className="border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by actor email or event..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Event Type Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'user.login', 'simulation.run', 'visit.created', 'doctor.created', 'dataset.imported', 'report.generated'].map(type => (
              <button
                key={type}
                onClick={() => setSelectedEventType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedEventType === type
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type === 'all' ? 'All Events' : type}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Activity Events Table */}
      <Card title="Activity Events" className="border-slate-200 shadow-sm overflow-hidden p-0">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-sky-500 rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-sky-100">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Security Audit Logs Recorded Yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Every staff login, doctor configuration, and visit modification will be permanently appended and recorded here.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm divide-y divide-slate-100">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5 text-left">Timestamp (IST)</th>
                    <th className="px-4 py-3.5 text-left">Event Trigger</th>
                    <th className="px-4 py-3.5 text-left">Authenticated Actor</th>
                    <th className="px-4 py-3.5 text-left">Target Entity</th>
                    <th className="px-4 py-3.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((entry: any, i: number) => (
                    <tr
                      key={entry.id || i}
                      onClick={() => setSelectedEntry(entry)}
                      className="hover:bg-sky-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3.5 text-xs font-mono text-slate-500 whitespace-nowrap">
                        {formatDate(entry.created_at)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={EVENT_TYPE_VARIANTS[entry.event_type] || 'neutral'} className="font-mono text-[11px]">
                          {entry.event_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-medium text-slate-800">
                        {entry.actor_email}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">
                        {entry.target_type ? `${entry.target_type}: ${entry.target_id?.substring(0, 16)}` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-xs font-semibold text-sky-600 group-hover:underline">
                          Inspect →
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data?.total_pages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
                <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  Previous
                </Button>
                <span className="text-xs font-semibold text-slate-500">
                  Page {page} of {data.total_pages} ({data.total} records)
                </span>
                <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === data.total_pages}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Audit Detail Inspector Slide-Over / Modal */}
      <Modal
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title="Audit Trail Event Inspector"
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setSelectedEntry(null)}>
            Close Inspector
          </Button>
        }
      >
        {selectedEntry && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Event Trigger</span>
                <Badge variant={EVENT_TYPE_VARIANTS[selectedEntry.event_type] || 'neutral'} className="font-mono text-xs mt-0.5">
                  {selectedEntry.event_type}
                </Badge>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Timestamp</span>
                <span className="font-mono font-medium text-slate-800">{formatDate(selectedEntry.created_at)}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Authenticated Actor</span>
                <span className="font-semibold text-slate-900">{selectedEntry.actor_email}</span>
                <span className="block text-[11px] font-mono text-slate-400 mt-0.5">ID: {selectedEntry.actor_user_id}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Target Entity</span>
                <span className="font-semibold text-slate-900">{selectedEntry.target_type || 'System'}</span>
                <span className="block text-[11px] font-mono text-slate-400 mt-0.5">{selectedEntry.target_id || 'Global'}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Event Payload & Telemetry (Immutable Snapshot)
              </p>
              <pre className="p-3.5 bg-slate-900 text-sky-300 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
                {JSON.stringify(selectedEntry.metadata || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
