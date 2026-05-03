import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './i18n';
import { PlatformProvider } from './context/PlatformContext';
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

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <PlatformProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="animals" element={<AnimalList />} />
                <Route path="animals/new" element={<AnimalEdit />} />
                <Route path="animals/:id" element={<AnimalDetails />} />
                <Route path="animals/:id/edit" element={<AnimalEdit />} />
                <Route path="devices" element={<DeviceList />} />
                <Route path="devices/new" element={<DeviceForm />} />
                <Route path="devices/:id/edit" element={<DeviceEdit />} />
                <Route path="users" element={<UserList />} />
                <Route path="users/new" element={<UserCreate />} />
                <Route path="users/add" element={<Navigate to="/users/new" replace />} />
                <Route path="users/:id/edit" element={<UserEdit />} />
                <Route path="map" element={<MapView />} />
                <Route path="auctions" element={<AuctionList />} />
                <Route path="auctions/new" element={<AuctionCreate />} />
                <Route path="auctions/:id" element={<AuctionDetails />} />
                <Route path="auctions/:id/edit" element={<AuctionEdit />} />
                <Route path="alerts" element={<AlertsPage />} />
                <Route path="geofences" element={<GeofenceList />} />
                <Route path="animal-groups" element={<AnimalGroupList />} />
                <Route path="subscription" element={<SubscriptionsPage />} />
                <Route path="subscription/tiers" element={<SubscriptionsPage />} />
                <Route path="subscription/select" element={<SubscriptionPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="medical-records" element={<MedicalRecordsPage />} />
                <Route path="vaccination-schedule" element={<VaccinationSchedulePage />} />
                <Route path="team" element={<TeamPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="task-logs-archive" element={<TaskLogsArchive />} />
                <Route path="payments" element={<PaymentManagement />} />
                <Route path="my-payments" element={<MyPayments />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </PlatformProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
