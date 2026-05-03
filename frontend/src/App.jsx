import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { I18nProvider } from './i18n';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout/Layout';
import { PlatformProvider } from './context/PlatformContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import NotFound from './pages/NotFound';

function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
}

function SuspenseFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full" />
    </div>
  );
}

const Login = lazy(() => import('./pages/Login'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AnimalList = lazy(() => import('./pages/AnimalList'));
const AnimalDetails = lazy(() => import('./pages/AnimalDetails'));
const AnimalEdit = lazy(() => import('./pages/AnimalEdit'));
const DeviceList = lazy(() => import('./pages/DeviceList'));
const DeviceForm = lazy(() => import('./pages/DeviceForm'));
const DeviceEdit = lazy(() => import('./pages/DeviceEdit'));
const UserList = lazy(() => import('./pages/UserList'));
const UserEdit = lazy(() => import('./pages/UserEdit'));
const UserCreate = lazy(() => import('./pages/UserCreate'));
const MapView = lazy(() => import('./pages/MapView'));
const AuctionList = lazy(() => import('./pages/AuctionList'));
const AuctionCreate = lazy(() => import('./pages/AuctionCreate'));
const AuctionEdit = lazy(() => import('./pages/AuctionEdit'));
const AuctionDetails = lazy(() => import('./pages/AuctionDetails'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const GeofenceList = lazy(() => import('./pages/GeofenceList'));
const AnimalGroupList = lazy(() => import('./pages/AnimalGroupList'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const SubscriptionsPage = lazy(() => import('./pages/SubscriptionsPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const TaskLogsArchive = lazy(() => import('./pages/TaskLogsArchive'));
const PaymentManagement = lazy(() => import('./pages/PaymentManagement'));
const MyPayments = lazy(() => import('./pages/MyPayments'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MedicalRecordsPage = lazy(() => import('./pages/MedicalRecordsPage'));
const VaccinationSchedulePage = lazy(() => import('./pages/VaccinationSchedulePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const LanguageSettingsPage = lazy(() => import('./pages/LanguageSettingsPage'));
const RolesPage = lazy(() => import('./pages/RolesPage'));

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Suspense fallback={<SuspenseFallback />}><Login /></Suspense>,
  },
  {
    path: '/reset-password',
    element: <Suspense fallback={<SuspenseFallback />}><ResetPassword /></Suspense>,
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <Suspense fallback={<SuspenseFallback />}><Dashboard /></Suspense> },
          { path: 'animals', element: <Suspense fallback={<SuspenseFallback />}><AnimalList /></Suspense> },
          { path: 'animals/new', element: <Suspense fallback={<SuspenseFallback />}><AnimalEdit /></Suspense> },
          { path: 'animals/:id', element: <Suspense fallback={<SuspenseFallback />}><AnimalDetails /></Suspense> },
          { path: 'animals/:id/edit', element: <Suspense fallback={<SuspenseFallback />}><AnimalEdit /></Suspense> },
          { path: 'devices', element: <Suspense fallback={<SuspenseFallback />}><DeviceList /></Suspense> },
          { path: 'devices/new', element: <Suspense fallback={<SuspenseFallback />}><DeviceForm /></Suspense> },
          { path: 'devices/:id/edit', element: <Suspense fallback={<SuspenseFallback />}><DeviceEdit /></Suspense> },
          { path: 'users', element: <Suspense fallback={<SuspenseFallback />}><UserList /></Suspense> },
          { path: 'users/new', element: <Suspense fallback={<SuspenseFallback />}><UserCreate /></Suspense> },
          { path: 'users/add', element: <Navigate to="/users/new" replace /> },
          { path: 'users/:id/edit', element: <Suspense fallback={<SuspenseFallback />}><UserEdit /></Suspense> },
          { path: 'map', element: <Suspense fallback={<SuspenseFallback />}><MapView /></Suspense> },
          { path: 'auctions', element: <Suspense fallback={<SuspenseFallback />}><AuctionList /></Suspense> },
          { path: 'auctions/new', element: <Suspense fallback={<SuspenseFallback />}><AuctionCreate /></Suspense> },
          { path: 'auctions/:id', element: <Suspense fallback={<SuspenseFallback />}><AuctionDetails /></Suspense> },
          { path: 'auctions/:id/edit', element: <Suspense fallback={<SuspenseFallback />}><AuctionEdit /></Suspense> },
          { path: 'alerts', element: <Suspense fallback={<SuspenseFallback />}><AlertsPage /></Suspense> },
          { path: 'geofences', element: <Suspense fallback={<SuspenseFallback />}><GeofenceList /></Suspense> },
          { path: 'animal-groups', element: <Suspense fallback={<SuspenseFallback />}><AnimalGroupList /></Suspense> },
          { path: 'subscription', element: <Suspense fallback={<SuspenseFallback />}><SubscriptionsPage /></Suspense> },
          { path: 'subscription/tiers', element: <Suspense fallback={<SuspenseFallback />}><SubscriptionsPage /></Suspense> },
          { path: 'subscription/select', element: <Suspense fallback={<SuspenseFallback />}><SubscriptionPage /></Suspense> },
          { path: 'profile', element: <Suspense fallback={<SuspenseFallback />}><ProfilePage /></Suspense> },
          { path: 'settings', element: <Suspense fallback={<SuspenseFallback />}><SettingsPage /></Suspense> },
          { path: 'settings/languages', element: <Suspense fallback={<SuspenseFallback />}><LanguageSettingsPage /></Suspense> },
          { path: 'settings/roles', element: <Suspense fallback={<SuspenseFallback />}><RolesPage /></Suspense> },
          { path: 'medical-records', element: <Suspense fallback={<SuspenseFallback />}><MedicalRecordsPage /></Suspense> },
          { path: 'vaccination-schedule', element: <Suspense fallback={<SuspenseFallback />}><VaccinationSchedulePage /></Suspense> },
          { path: 'team', element: <Suspense fallback={<SuspenseFallback />}><TeamPage /></Suspense> },
          { path: 'reports', element: <Suspense fallback={<SuspenseFallback />}><ReportsPage /></Suspense> },
          { path: 'tasks', element: <Suspense fallback={<SuspenseFallback />}><TasksPage /></Suspense> },
          { path: 'task-logs-archive', element: <Suspense fallback={<SuspenseFallback />}><TaskLogsArchive /></Suspense> },
          { path: 'payments', element: <Suspense fallback={<SuspenseFallback />}><PaymentManagement /></Suspense> },
          { path: 'my-payments', element: <Suspense fallback={<SuspenseFallback />}><MyPayments /></Suspense> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
], {
  future: {
    v7_startTransition: true,
  },
});

function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <PlatformProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </PlatformProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;