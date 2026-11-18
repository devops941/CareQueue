import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { KPICard } from '@/components/ui/KPICard'
import { ShieldCheck, AlertTriangle, CheckCircle2, FileSearch, Sparkles, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DataQualityPage() {
  const user = JSON.parse(localStorage.getItem('cq_user') || '{}')
  const clinicId = user.clinic_id
  const [report, setReport] = useState<any>(null)

  const checkMutation = useMutation({
    mutationFn: async () => (await apiClient.post(`/clinics/${clinicId}/data-quality/check`)).data,
    onSuccess: (data) => {
      setReport(data)
      toast.success('Data quality audit completed successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to run quality check')
    }
  })

  const severityVariant = (s: string) => s === 'error' ? 'danger' : 'warning'

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Integrity & Timestamp Audit</h1>
            <Badge variant="info">Validation Engine</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Detect chronological inconsistencies, missing timestamps, and duplicate token records
          </p>
        </div>

        <Button
          onClick={() => checkMutation.mutate()}
          loading={checkMutation.isPending}
          className="flex items-center gap-2 shadow-md shadow-sky-500/20"
        >
          <RefreshCw className={`w-4 h-4 ${checkMutation.isPending ? 'animate-spin' : ''}`} />
          <span>Run Quality Check</span>
        </Button>
      </div>

      {report && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard title="Total Analyzed" value={report.total_visits} source="historical" />
            <KPICard title="Integrity Score" value={`${report.quality_score}%`} source="historical" />
            <KPICard title="Issues Detected" value={report.issues?.length || 0} />
            <KPICard title="Duplicate Tokens" value={report.summary?.duplicate || 0} />
          </div>

          <Card title="Detected Quality Inconsistencies" className="border-slate-200 shadow-sm">
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {report.issues?.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="text-base font-bold text-slate-800">100% Clean Data Stream</p>
                  <p className="text-xs text-slate-500 mt-1">All patient journey timestamps adhere to strict operational chronology</p>
                </div>
              )}
              {report.issues?.map((issue: any, i: number) => (
                <div key={i} className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors">
                  <Badge variant={severityVariant(issue.severity)} className="mt-0.5 uppercase tracking-wider text-[10px] font-bold">
                    {issue.severity}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{issue.issue_type}</p>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{issue.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {!report && !checkMutation.isPending && (
        <Card className="border-slate-200 shadow-sm">
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-4 border border-sky-100 shadow-sm">
              <FileSearch className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Audit Clinic Visit Records</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              Verify that registration times precede call times, consultation periods are positive non-zero values, and tokens are unique.
            </p>
            <Button
              onClick={() => checkMutation.mutate()}
              className="mt-5 shadow-md shadow-sky-500/20"
            >
              Analyze Records Now
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
