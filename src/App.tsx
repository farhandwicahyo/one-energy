import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Guard, Shell } from './components/Shell'
import { ToastProvider } from './components/ui'
import Dashboard from './modules/simon/Dashboard'
import { FleetReadiness, PairReadiness, VesselReadiness } from './modules/siap/Readiness'
import { PairManager, VesselDetail, VesselList } from './modules/sika/Vessels'
import { Composition, CrewDetail, CrewList } from './modules/sikru/Crew'
import { DocumentDetail, DocumentList, DocumentTypes, RequiredDocs } from './modules/sidok/Documents'
import { FollowUps, Notifications, ReminderSettings, Templates } from './modules/sinar/Reminders'
import { Audit, Config, MasterData, Roles, Users } from './modules/siguna/Admin'
import Login from './modules/siguna/Login'
import { Home, ModulePage } from './modules/Home'
import Profile from './modules/Profile'
import Guide from './modules/Guide'
import { StoreProvider } from './store'

const g = (perm: string | string[], el: JSX.Element) => <Guard perm={perm}>{el}</Guard>

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        {/* Hash routing so the built mockup also opens straight from the file system or any static host. */}
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Shell />}>
              <Route index element={<Home />} />
              <Route path="m/:slug" element={<ModulePage />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="guide" element={<Guide />} />
              <Route path="readiness" element={g('readiness.read', <FleetReadiness />)} />
              <Route path="readiness/pairs" element={g('readiness.read', <PairReadiness />)} />
              <Route path="readiness/:id" element={g('readiness.read', <VesselReadiness />)} />
              <Route path="vessels" element={g('vessel.read', <VesselList />)} />
              <Route path="vessels/pairs" element={g('vessel.read', <PairManager />)} />
              <Route path="vessels/:id" element={g('vessel.read', <VesselDetail />)} />
              <Route path="crew" element={g('crew.read', <CrewList />)} />
              <Route path="crew/composition" element={g('crew.read', <Composition />)} />
              <Route path="crew/:id" element={g('crew.read', <CrewDetail />)} />
              <Route path="documents" element={g('document.read', <DocumentList />)} />
              <Route path="documents/types" element={g('document.read', <DocumentTypes />)} />
              <Route path="documents/rules" element={g('document.read', <RequiredDocs />)} />
              <Route path="documents/:id" element={g('document.read', <DocumentDetail />)} />
              <Route path="reminders" element={g(['followup.write', 'reminder.config'], <FollowUps />)} />
              <Route path="reminders/notifications" element={g('notification.read', <Notifications />)} />
              <Route path="reminders/templates" element={g('notification.read', <Templates />)} />
              <Route path="reminders/settings" element={g('reminder.config', <ReminderSettings />)} />
              <Route path="admin/users" element={g('user.manage', <Users />)} />
              <Route path="admin/roles" element={g('role.manage', <Roles />)} />
              <Route path="admin/audit" element={g('audit.read', <Audit />)} />
              <Route path="admin/config" element={g('config.manage', <Config />)} />
              <Route path="admin/master" element={g('master.manage', <MasterData />)} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </ToastProvider>
    </StoreProvider>
  )
}
