import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { InspectPage } from './pages/InspectPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { SettingsPage } from './pages/SettingsPage'
import { UnitDetailPage } from './pages/UnitDetailPage'
import { EditUnitPage, NewUnitPage } from './pages/UnitFormPage'
import { UnitsPage } from './pages/UnitsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="units" element={<UnitsPage />} />
          <Route path="units/new" element={<NewUnitPage />} />
          <Route path="units/:id" element={<UnitDetailPage />} />
          <Route path="units/:id/edit" element={<EditUnitPage />} />
          <Route path="units/:id/inspect" element={<InspectPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
