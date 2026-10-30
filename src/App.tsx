import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Guard, Shell } from './components/Shell'
import { ToastProvider } from './components/ui'
import Dashboard from './modules/dashboard/Dashboard'
import { Audit, Config, MasterData, Roles, Users } from './modules/admin/Admin'
import Login from './modules/admin/Login'
import { Home, ModulePage } from './modules/Home'
import Profile from './modules/Profile'
import Guide from './modules/Guide'
import SalesModule from './modules/sales/Sales'
import OperationsModule from './modules/operations/Operations'
import ProcurementModule from './modules/procurement/Procurement'
import FinanceModule from './modules/finance/Finance'
import { StoreProvider } from './store'

const g = (perm: string | string[], el: JSX.Element) => <Guard perm={perm}>{el}</Guard>

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Shell />}>
              <Route index element={<Home />} />
              <Route path="m/:slug" element={<ModulePage />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="guide" element={<Guide />} />
              {/* ADMIN */}
              <Route path="admin/users" element={g('user.manage', <Users />)} />
              <Route path="admin/roles" element={g('role.manage', <Roles />)} />
              <Route path="admin/audit" element={g('audit.read', <Audit />)} />
              <Route path="admin/config" element={g('config.manage', <Config />)} />
              <Route path="admin/master" element={g('master.manage', <MasterData />)} />
              {/* Flow modules: Sales → Operations → Procurement → Finance */}
              <Route path="sales/*" element={g(['sales.read', 'quotation.respond'], <SalesModule />)} />
              <Route path="operations/*" element={<OperationsModule />} />
              <Route path="procurement/*" element={g('procurement.read', <ProcurementModule />)} />
              <Route path="finance/*" element={<FinanceModule />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </ToastProvider>
    </StoreProvider>
  )
}
