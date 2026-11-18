import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from '@/modules/auth/AuthContext'
import ProtectedRoute from '@/modules/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/LoadingSpinner'

const LoginPage = lazy(() => import('@/modules/auth/LoginPage'))
const DashboardPage = lazy(() => import('@/modules/overview/DashboardPage'))
const HistoricalAnalyticsPage = lazy(() => import('@/modules/analytics/HistoricalAnalyticsPage'))
const TimeSlotPage = lazy(() => import('@/modules/analytics/TimeSlotPage'))
const SimulationPage = lazy(() => import('@/modules/simulation/SimulationPage'))
const ImportPage = lazy(() => import('@/modules/data-import/ImportPage'))
const VisitsPage = lazy(() => import('@/modules/visits/VisitsPage'))
const DataQualityPage = lazy(() => import('@/modules/data-quality/DataQualityPage'))
const ReportsPage = lazy(() => import('@/modules/reports/ReportsPage'))
const ClinicSettingsPage = lazy(() => import('@/modules/clinics/ClinicSettingsPage'))
const SpecializationsPage = lazy(() => import('@/modules/specializations/SpecializationsPage'))
const DoctorsPage = lazy(() => import('@/modules/doctors/DoctorsPage'))
const AuditLogPage = lazy(() => import('@/modules/audit/AuditLogPage'))
const OnboardingPage = lazy(() => import('@/modules/onboarding/OnboardingPage'))

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/analytics/historical" element={<HistoricalAnalyticsPage />} />
                <Route path="/analytics/time-slot" element={<TimeSlotPage />} />
                <Route path="/simulation" element={<SimulationPage />} />
                <Route path="/data/import" element={<ImportPage />} />
                <Route path="/data/visits" element={<VisitsPage />} />
                <Route path="/data/quality" element={<DataQualityPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings/clinic" element={<ClinicSettingsPage />} />
                <Route path="/settings/specializations" element={<SpecializationsPage />} />
                <Route path="/settings/doctors" element={<DoctorsPage />} />
                <Route path="/settings/audit" element={<AuditLogPage />} />
              </Route>
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
