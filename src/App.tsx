import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Guard, Shell } from './components/Shell'
import { ToastProvider } from './components/ui'
import Dashboard from './modules/dashboard/Dashboard'
import { PairManager, VesselDetail, VesselList } from './modules/doc-asset/Vessels'
import { Composition, CrewDetail, CrewList } from './modules/crewing/Crew'
import { DocumentDetail, DocumentList, DocumentTypes, RequiredDocs } from './modules/documents/Documents'
import { Audit, Config, MasterData, Roles, Users } from './modules/admin/Admin'
import Login from './modules/admin/Login'
import { Home, ModulePage } from './modules/Home'
import Profile from './modules/Profile'
import Guide from './modules/Guide'
import Placeholder from './modules/Placeholder'
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
              {/* DOC ASSET: Vessels */}
              <Route path="vessels" element={g('vessel.read', <VesselList />)} />
              <Route path="vessels/pairs" element={g('vessel.read', <PairManager />)} />
              <Route path="vessels/:id" element={g('vessel.read', <VesselDetail />)} />
              {/* CREWING */}
              <Route path="crew" element={g('crew.read', <CrewList />)} />
              <Route path="crew/composition" element={g('crew.read', <Composition />)} />
              <Route path="crew/:id" element={g('crew.read', <CrewDetail />)} />
              {/* DOC ASSET: Documents */}
              <Route path="documents" element={g('document.read', <DocumentList />)} />
              <Route path="documents/types" element={g('document.read', <DocumentTypes />)} />
              <Route path="documents/rules" element={g('document.read', <RequiredDocs />)} />
              <Route path="documents/:id" element={g('document.read', <DocumentDetail />)} />
              {/* ADMIN */}
              <Route path="admin/users" element={g('user.manage', <Users />)} />
              <Route path="admin/roles" element={g('role.manage', <Roles />)} />
              <Route path="admin/audit" element={g('audit.read', <Audit />)} />
              <Route path="admin/config" element={g('config.manage', <Config />)} />
              <Route path="admin/master" element={g('master.manage', <MasterData />)} />
              {/* New flow modules: Sales → Operations → Procurement → Finance */}
              <Route path="sales/:feature" element={<Placeholder />} />
              <Route path="bunker/:feature" element={<Placeholder />} />
              <Route path="traffic/:feature" element={<Placeholder />} />
              <Route path="keagenan/:feature" element={<Placeholder />} />
              <Route path="maintenance/:feature" element={<Placeholder />} />
              <Route path="procurement/:feature" element={<Placeholder />} />
              <Route path="doc-support/:feature" element={<Placeholder />} />
              <Route path="billing/:feature" element={<Placeholder />} />
              <Route path="payment/:feature" element={<Placeholder />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </ToastProvider>
    </StoreProvider>
  )
}
