import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import DashboardLayout from './dashboard/page'
import AddDoc from './dashboard/master-plan/AddDoc'
import MasterPlanPage from './dashboard/master-plan/MasterPlanPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          {/* This will render in the DashboardLayout's Outlet */}
          <Route path="Add-Doc-to-MP-Reg" element={<AddDoc />} />
          <Route path="Master-Plan-Registration" element={<MasterPlanPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)