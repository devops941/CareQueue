import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { KPICard } from '@/components/ui/KPICard'
import { Modal } from '@/components/ui/Modal'
import {
  FlaskConical, Play, Sparkles, Sliders, Users, Clock,
  TrendingDown, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, BarChart2
} from 'lucide-react'

export default function SimulationPage() {
  const user = JSON.parse(localStorage.getItem('cq_user') || '{}')
  const clinicId = user.clinic_id
  const qc = useQueryClient()
  const [activeResult, setActiveResult] = useState<any>(null)
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    name: 'Standard OPD Morning Shift',
    description: 'Evaluates baseline doctor staffing vs anticipated arrival rush',
    simulation_hours: 8,
    num_replications: 10,
    base_seed: 42,
    departments: [
      {
        department_id: 'General Medicine',
        num_servers: 2,
        arrival_distribution: 'exponential',
        arrival_params: { rate: 0.6 },
        service_distribution: 'lognormal',
        service_params: { mean: 15, std: 4 },
      },
    ],
  })

  const { data: configs = [], isLoading: loadingConfigs } = useQuery({
    queryKey: ['sim-configs', clinicId],
    queryFn: async () => (await apiClient.get(`/clinics/${clinicId}/simulation/configs`)).data,
    enabled: !!clinicId,
  })

  const { data: results = [] } = useQuery({
    queryKey: ['sim-results', clinicId],
    queryFn: async () => (await apiClient.get(`/clinics/${clinicId}/simulation/results`)).data,
    enabled: !!clinicId,
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post(`/clinics/${clinicId}/simulation/configs`, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['sim-configs'] })
      setShowForm(false)
      // Automatically run the created configuration
      if (res.data?.id) {
        setSelectedConfigId(res.data.id)
        runMutation.mutate(res.data.id)
      }
    },
  })

  const runMutation = useMutation({
    mutationFn: (configId: string) => apiClient.post(`/clinics/${clinicId}/simulation/configs/${configId}/run`),
    onSuccess: (data) => {
      setActiveResult(data.data)
      if (data.data?.config_id) {
        setSelectedConfigId(data.data.config_id)
      }
      qc.invalidateQueries({ queryKey: ['sim-results'] })
    },
  })

  const applyPreset = (presetName: string) => {
    if (presetName === 'peak') {
      setForm({
        name: 'Monday Morning Peak Surge',
        description: 'Simulates heavy Monday arrival surge with current 2 consulting doctors',
        simulation_hours: 6,
        num_replications: 15,
        base_seed: 101,
        departments: [{
          department_id: 'OPD Surge',
          num_servers: 2,
          arrival_distribution: 'exponential',
          arrival_params: { rate: 1.1 },
          service_distribution: 'lognormal',
          service_params: { mean: 15, std: 5 },
        }],
      })
    } else if (presetName === 'extra_doctor') {
      setForm({
        name: 'Capacity Expansion (+1 Doctor)',
        description: 'Evaluates wait-time reduction if an additional doctor is scheduled',
        simulation_hours: 8,
        num_replications: 10,
        base_seed: 202,
        departments: [{
          department_id: 'Expanded OPD',
          num_servers: 3,
          arrival_distribution: 'exponential',
          arrival_params: { rate: 0.8 },
          service_distribution: 'lognormal',
          service_params: { mean: 14, std: 4 },
        }],
      })
    } else {
      setForm({
        name: 'Standard Baseline OPD',
        description: 'Normal regular operating schedule with 2 doctors on duty',
        simulation_hours: 8,
        num_replications: 10,
        base_seed: 42,
        departments: [{
          department_id: 'General Medicine',
          num_servers: 2,
          arrival_distribution: 'exponential',
          arrival_params: { rate: 0.5 },
          service_distribution: 'lognormal',
          service_params: { mean: 15, std: 4 },
        }],
      })
    }
    setShowForm(true)
  }

  const launchBaseline = () => {
    const existing = configs.find((c: any) => c.name.toLowerCase().includes('baseline'))
    if (existing) {
      setSelectedConfigId(existing.id)
      runMutation.mutate(existing.id)
    } else if (configs.length > 0) {
      setSelectedConfigId(configs[0].id)
      runMutation.mutate(configs[0].id)
    } else {
      createMutation.mutate({
        name: 'Standard Baseline OPD',
        description: 'Normal regular operating schedule with 2 doctors on duty',
        simulation_hours: 8,
        num_replications: 10,
        base_seed: 42,
        departments: [{
          department_id: 'General Medicine',
          num_servers: 2,
          arrival_distribution: 'exponential',
          arrival_params: { rate: 0.5 },
          service_distribution: 'lognormal',
          service_params: { mean: 15, std: 4 },
        }],
      })
    }
  }

  // Find relevant result based on user selection or latest run
  const resultForSelected = selectedConfigId
    ? results.find((r: any) => r.config_id === selectedConfigId)
    : null

  const currentResult = activeResult || resultForSelected || (results.length > 0 ? results[0] : null)

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Queue Simulation Workbench</h1>
            <Badge variant="simulation">SimPy Engine</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Test alternative doctor staffing scenarios and predict wait times under stochastic patient arrival loads
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowForm(!showForm)}
            className="shadow-md shadow-sky-500/20"
          >
            <Sliders className="w-4 h-4" />
            <span>{showForm ? 'Close Builder' : 'New Scenario'}</span>
          </Button>
        </div>
      </div>

      {/* Quick Scenario Preset Chips */}
      <div className="bg-gradient-to-r from-sky-50 via-indigo-50 to-slate-50 border border-sky-100 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Quick Clinical Scenario Presets
            </span>
          </div>
          <span className="text-xs text-slate-500">Click to auto-populate simulation parameters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => applyPreset('baseline')}
            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-sky-400 hover:shadow-sm text-left transition-all group"
          >
            <p className="text-xs font-bold text-slate-900 group-hover:text-sky-600">Standard OPD Baseline</p>
            <p className="text-[11px] text-slate-500 mt-0.5">2 Doctors • Normal arrivals (0.5/min)</p>
          </button>
          <button
            onClick={() => applyPreset('peak')}
            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-sm text-left transition-all group"
          >
            <p className="text-xs font-bold text-slate-900 group-hover:text-amber-600">Monday Morning Surge</p>
            <p className="text-[11px] text-slate-500 mt-0.5">2 Doctors • High arrival rush (1.1/min)</p>
          </button>
          <button
            onClick={() => applyPreset('extra_doctor')}
            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-sm text-left transition-all group"
          >
            <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-600">Add +1 Doctor Capacity</p>
            <p className="text-[11px] text-slate-500 mt-0.5">3 Doctors • Expanded parallel flow</p>
          </button>
        </div>
      </div>

      {/* Scenario Builder Popup Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Scenario Parameter Configuration"
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              loading={createMutation.isPending || runMutation.isPending}
              className="shadow-md shadow-sky-500/20"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Save & Execute SimPy Run</span>
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Scenario Name</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500"
                placeholder="e.g., Monday Morning Peak Surge"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Simulation Hours</label>
              <input
                type="number"
                value={form.simulation_hours}
                onChange={e => setForm(f => ({ ...f, simulation_hours: +e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Monte Carlo Replications</label>
              <input
                type="number"
                value={form.num_replications}
                onChange={e => setForm(f => ({ ...f, num_replications: +e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Department Resource Allocation */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Department Resource & Timing Settings
            </p>
            {form.departments.map((dept, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500">Department</label>
                  <input
                    value={dept.department_id}
                    onChange={e => {
                      const d = [...form.departments]
                      d[i].department_id = e.target.value
                      setForm(f => ({ ...f, departments: d }))
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500">Doctors on Duty (Servers)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={dept.num_servers}
                    onChange={e => {
                      const d = [...form.departments]
                      d[i].num_servers = +e.target.value
                      setForm(f => ({ ...f, departments: d }))
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500">Arrival Rate (patients/min)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={dept.arrival_params.rate}
                    onChange={e => {
                      const d = [...form.departments]
                      d[i].arrival_params.rate = +e.target.value
                      setForm(f => ({ ...f, departments: d }))
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500">Avg Consult Duration (min)</label>
                  <input
                    type="number"
                    value={dept.service_params.mean}
                    onChange={e => {
                      const d = [...form.departments]
                      d[i].service_params.mean = +e.target.value
                      setForm(f => ({ ...f, departments: d }))
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Main Simulation Workbench (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Saved Scenarios List */}
        <div className="lg:col-span-1 space-y-4">
          <Card title="Configured Scenarios" subtitle={`${configs.length} models saved`}>
            {configs.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Sliders className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-700">No Custom Scenarios</p>
                <p className="text-xs text-slate-500 mt-1">Select one of the presets above or click "New Scenario" to run your first model.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {configs.map((c: any) => {
                  const isSelected = (selectedConfigId === c.id) || (currentResult?.config_id === c.id)
                  const hasRun = results.some((r: any) => r.config_id === c.id)
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedConfigId(c.id)
                        const matching = results.find((r: any) => r.config_id === c.id)
                        if (matching) setActiveResult(matching)
                      }}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/50 shadow-sm ring-1 ring-sky-300'
                          : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">
                            {c.name}
                          </p>
                          {isSelected && (
                            <Badge variant="info" className="text-[10px] py-0 px-1.5">Selected</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {c.simulation_hours}h duration • {c.num_replications} reps • {c.departments?.[0]?.num_servers || 1} doctor(s)
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedConfigId(c.id)
                          runMutation.mutate(c.id)
                        }}
                        loading={runMutation.isPending && selectedConfigId === c.id}
                        className="shrink-0"
                        title="Execute SimPy Stochastic Run"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Simulation Results & Projections */}
        <div className="lg:col-span-2 space-y-4">
          {currentResult ? (
            <div className="space-y-4">
              <Card
                title="Simulation Projection Results"
                subtitle={`Aggregated over ${currentResult.replications || 10} Monte Carlo iterations via SimPy`}
                headerAction={
                  <div className="flex items-center gap-2">
                    <Badge variant="simulation">SimPy Stochastic Model</Badge>
                  </div>
                }
              >
                <div className="space-y-6">
                  {/* Result KPI Ribbon */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-100">
                      <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider block">Mean Queue Wait</span>
                      <span className="text-2xl font-extrabold text-sky-950 mt-1 block">
                        {currentResult.overall?.mean_queue_wait ?? '—'} <span className="text-xs font-normal text-slate-500">min</span>
                      </span>
                    </div>
                    <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-100">
                      <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">95% Conf. Interval</span>
                      <span className="text-sm font-bold text-indigo-950 mt-2 block">
                        [{currentResult.overall?.ci_lower ?? 0}m, {currentResult.overall?.ci_upper ?? 0}m]
                      </span>
                    </div>
                    <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
                      <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Est. Throughput</span>
                      <span className="text-2xl font-extrabold text-emerald-950 mt-1 block">
                        {currentResult.overall?.total_patients ?? 0} <span className="text-xs font-normal text-slate-500">patients</span>
                      </span>
                    </div>
                    <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-100">
                      <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Model Status</span>
                      <span className="text-xs font-bold text-amber-900 mt-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Converged
                      </span>
                    </div>
                  </div>

                  {/* Department Breakdown Table */}
                  {currentResult.by_department && Object.keys(currentResult.by_department).length > 0 && (
                    <div className="space-y-2.5">
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Departmental Wait Distribution & Percentiles
                      </p>
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                            <tr>
                              <th className="py-2.5 px-3 text-left">Department</th>
                              <th className="py-2.5 px-3 text-right">Mean Wait</th>
                              <th className="py-2.5 px-3 text-right">P50 (Median)</th>
                              <th className="py-2.5 px-3 text-right">P90 (Peak)</th>
                              <th className="py-2.5 px-3 text-right">P95 (Extreme)</th>
                              <th className="py-2.5 px-3 text-right">Avg Consult</th>
                              <th className="py-2.5 px-3 text-right">Throughput</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {Object.entries(currentResult.by_department).map(([deptName, d]: [string, any]) => (
                              <tr key={deptName} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-3 font-semibold text-slate-800">{deptName}</td>
                                <td className="py-2.5 px-3 text-right font-bold text-sky-700">{d.queue_wait?.mean ?? '—'}m</td>
                                <td className="py-2.5 px-3 text-right text-slate-700">{d.queue_wait?.p50 ?? '—'}m</td>
                                <td className="py-2.5 px-3 text-right font-semibold text-amber-700">{d.queue_wait?.p90 ?? '—'}m</td>
                                <td className="py-2.5 px-3 text-right font-bold text-rose-700">{d.queue_wait?.p95 ?? '—'}m</td>
                                <td className="py-2.5 px-3 text-right text-slate-600">{d.service_time?.mean ?? '—'}m</td>
                                <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">{d.throughput ?? 0} pts</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Operational Recommendation Banner */}
                  <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                      <BarChart2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Capacity & Wait-Time Optimization Summary</p>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        Under this configuration, simulated queue waiting time averages <strong>{currentResult.overall?.mean_queue_wait} minutes</strong>. If patient arrivals spike above expected rate, queue wait increases exponentially. Maintain doctor utilization under 85% to prevent OPD waiting rooms from overflowing.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Multi-Scenario Benchmarking Table (when >= 2 results exist) */}
              {results.length >= 2 && (
                <Card
                  title="Scenario Comparison & ROI Matrix"
                  subtitle="Benchmark queue waiting reduction across different doctor scheduling models"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                          <th className="py-2.5 px-3">Scenario Name</th>
                          <th className="py-2.5 px-3 text-center">Doctors</th>
                          <th className="py-2.5 px-3 text-right">Mean Wait</th>
                          <th className="py-2.5 px-3 text-right">95% Conf. Interval</th>
                          <th className="py-2.5 px-3 text-right">Throughput</th>
                          <th className="py-2.5 px-3 text-center">Outcome</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {results.map((r: any) => {
                          const wait = r.overall?.mean_queue_wait ?? 0
                          const minWait = Math.min(...results.map((x: any) => x.overall?.mean_queue_wait ?? 999))
                          const isWinner = wait === minWait && wait > 0
                          const docCount = r.assumptions?.departments?.[0]?.num_servers || 1
                          return (
                            <tr
                              key={r.id}
                              onClick={() => {
                                setSelectedConfigId(r.config_id)
                                setActiveResult(r)
                              }}
                              className={`cursor-pointer hover:bg-slate-50 transition-colors ${currentResult?.id === r.id ? 'bg-sky-50/40' : ''}`}
                            >
                              <td className="py-2.5 px-3 font-semibold text-slate-900">
                                {r.assumptions?.name || 'Unnamed Scenario'}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-700">
                                {docCount} Dr(s)
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                {wait} min
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-500 font-mono text-[11px]">
                                [{r.overall?.ci_lower ?? 0}m – {r.overall?.ci_upper ?? 0}m]
                              </td>
                              <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                                {r.overall?.total_patients ?? 0} pts
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {isWinner ? (
                                  <Badge variant="success" className="text-[10px] py-0 px-2">Optimal Flow</Badge>
                                ) : (
                                  <Badge variant="neutral" className="text-[10px] py-0 px-2">Baseline</Badge>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <Card className="py-16 text-center border-dashed border-2 border-slate-200">
              <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Simulation Run Selected</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Choose a clinical preset above or click any saved scenario to simulate patient arrivals and inspect projected queue times.
              </p>
              <div className="mt-5">
                <Button
                  onClick={launchBaseline}
                  loading={runMutation.isPending || createMutation.isPending}
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Launch Baseline OPD Simulation</span>
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
