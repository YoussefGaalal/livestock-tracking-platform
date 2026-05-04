import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './i18n.jsx';
import { PlatformProvider } from './context/PlatformContext';
import { ProtectedRoute, RoleRoute } from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import AnimalList from './pages/AnimalList';
import AnimalDetails from './pages/AnimalDetails';
import AnimalEdit from './pages/AnimalEdit';
import DeviceList from './pages/DeviceList';
import DeviceForm from './pages/DeviceForm';
import DeviceEdit from './pages/DeviceEdit';
import UserList from './pages/UserList';
import UserEdit from './pages/UserEdit';
import UserCreate from './pages/UserCreate';
import Login from './pages/Login';
import MapView from './pages/MapView';
import AuctionList from './pages/AuctionList';
import AuctionCreate from './pages/AuctionCreate';
import AuctionEdit from './pages/AuctionEdit';
import AuctionDetails from './pages/AuctionDetails';
import AlertsPage from './pages/AlertsPage';
import GeofenceList from './pages/GeofenceList';
import AnimalGroupList from './pages/AnimalGroupList';
import SubscriptionPage from './pages/SubscriptionPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import TeamPage from './pages/TeamPage';
import ReportsPage from './pages/ReportsPage';
import TasksPage from './pages/TasksPage';
import TaskLogsArchive from './pages/TaskLogsArchive';
import PaymentManagement from './pages/PaymentManagement';
import MyPayments from './pages/MyPayments';
import ProfilePage from './pages/ProfilePage';
import MedicalRecordsPage from './pages/MedicalRecordsPage';
import VaccinationSchedulePage from './pages/VaccinationSchedulePage';
import SettingsPage from './pages/SettingsPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Role constants
const ADMIN = 'Admin';
const OWNER = 'Owner';
const MANAGER = 'Manager';
const DOCTOR = 'Doctor';
const SHEPHERD = 'Shepherd';

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <PlatformProvider>
          <BrowserRouter basename="/app">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="animals" element={<AnimalList />} />
                <Route path="animals/new" element={<RoleRoute role={[OWNER, MANAGER, SHEPHERD, ADMIN]}><AnimalEdit /></RoleRoute>} />
                <Route path="animals/:id" element={<AnimalDetails />} />
                <Route path="animals/:id/edit" element={<RoleRoute role={[OWNER, MANAGER, ADMIN]}><AnimalEdit /></RoleRoute>} />
                <Route path="devices" element={<RoleRoute role={[ADMIN, OWNER, MANAGER, SHEPHERD]}><DeviceList /></RoleRoute>} />
                <Route path="devices/new" element={<RoleRoute role={[ADMIN, OWNER]}><DeviceForm /></RoleRoute>} />
                <Route path="devices/:id/edit" element={<RoleRoute role={[ADMIN, OWNER]}><DeviceEdit /></RoleRoute>} />
                <Route path="users" element={<RoleRoute role={[ADMIN, OWNER]}><UserList /></RoleRoute>} />
                <Route path="users/new" element={<RoleRoute role={[ADMIN, OWNER]}><UserCreate /></RoleRoute>} />
                <Route path="users/add" element={<Navigate to="/users/new" replace />} />
                <Route path="users/:id/edit" element={<RoleRoute role={[ADMIN, OWNER]}><UserEdit /></RoleRoute>} />
                <Route path="map" element={<MapView />} />
                <Route path="auctions" element={<RoleRoute role={[ADMIN, OWNER]}><AuctionList /></RoleRoute>} />
                <Route path="auctions/new" element={<RoleRoute role={[ADMIN, OWNER]}><AuctionCreate /></RoleRoute>} />
                <Route path="auctions/:id" element={<RoleRoute role={[ADMIN, OWNER]}><AuctionDetails /></RoleRoute>} />
                <Route path="auctions/:id/edit" element={<RoleRoute role={[ADMIN, OWNER]}><AuctionEdit /></RoleRoute>} />
                <Route path="alerts" element={<AlertsPage />} />
                <Route path="geofences" element={<GeofenceList />} />
                <Route path="animal-groups" element={<AnimalGroupList />} />
                <Route path="subscription" element={<RoleRoute role={[ADMIN, OWNER]}><SubscriptionsPage /></RoleRoute>} />
                <Route path="subscription/tiers" element={<RoleRoute role={[ADMIN, OWNER]}><SubscriptionsPage /></RoleRoute>} />
                <Route path="subscription/select" element={<SubscriptionPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<RoleRoute role={[ADMIN]}><SettingsPage /></RoleRoute>} />
                <Route path="medical-records" element={<RoleRoute role={[ADMIN, OWNER, DOCTOR]}><MedicalRecordsPage /></RoleRoute>} />
                <Route path="vaccination-schedule" element={<RoleRoute role={[ADMIN, OWNER, DOCTOR]}><VaccinationSchedulePage /></RoleRoute>} />
                <Route path="team" element={<RoleRoute role={[ADMIN, OWNER]}><TeamPage /></RoleRoute>} />
                <Route path="reports" element={<RoleRoute role={[ADMIN, OWNER, MANAGER]}><ReportsPage /></RoleRoute>} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="task-logs-archive" element={<RoleRoute role={[ADMIN, OWNER]}><TaskLogsArchive /></RoleRoute>} />
                <Route path="payments" element={<RoleRoute role={[ADMIN]}><PaymentManagement /></RoleRoute>} />
                <Route path="my-payments" element={<RoleRoute role={[ADMIN, OWNER]}><MyPayments /></RoleRoute>} />
              </Route>
            </Routes>
          </BrowserRouter>
        </PlatformProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
