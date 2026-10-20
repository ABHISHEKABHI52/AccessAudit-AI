import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './components/layout/DashboardLayout'
import Landing from './pages/Landing'
import Overview from './pages/Overview'
import NewScan from './pages/NewScan'
import Results from './pages/Results'
import ResultsById from './pages/ResultsById'
import FixAssistant from './pages/FixAssistant'
import History from './pages/History'
import Reports from './pages/Reports'
import Docs from './pages/Docs'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Overview />} />
        <Route path="/scan" element={<NewScan />} />
        <Route path="/results" element={<Results />} />
        <Route path="/results/:id" element={<ResultsById />} />
        <Route path="/fix" element={<FixAssistant />} />
        <Route path="/history" element={<History />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/docs" element={<Docs />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}