import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const AnimalList = lazy(() => import('../pages/AnimalList'));
const AnimalDetails = lazy(() => import('../pages/AnimalDetails'));
const AnimalEdit = lazy(() => import('../pages/AnimalEdit'));
const DeviceList = lazy(() => import('../pages/DeviceList'));
const DeviceForm = lazy(() => import('../pages/DeviceForm'));
const DeviceEdit = lazy(() => import('../pages/DeviceEdit'));
const UserList = lazy(() => import('../pages/UserList'));
const UserEdit = lazy(() => import('../pages/UserEdit'));
const UserCreate = lazy(() => import('../pages/UserCreate'));
const MapView = lazy(() => import('../pages/MapView'));
const AuctionList = lazy(() => import('../pages/AuctionList'));
const AuctionCreate = lazy(() => import('../pages/AuctionCreate'));
const AuctionEdit = lazy(() => import('../pages/AuctionEdit'));
const AuctionDetails = lazy(() => import('../pages/AuctionDetails'));
const AlertsPage = lazy(() => import('../pages/AlertsPage'));
const GeofenceList = lazy(() => import('../pages/GeofenceList'));
const AnimalGroupList = lazy(() => import('../pages/AnimalGroupList'));
const SubscriptionPage = lazy(() => import('../pages/SubscriptionPage'));
const SubscriptionsPage = lazy(() => import('../pages/SubscriptionsPage'));
const TeamPage = lazy(() => import('../pages/TeamPage'));
const ReportsPage = lazy(() => import('../pages/ReportsPage'));
const TasksPage = lazy(() => import('../pages/TasksPage'));
const TaskLogsArchive = lazy(() => import('../pages/TaskLogsArchive'));
const PaymentManagement = lazy(() => import('../pages/PaymentManagement'));
const MyPayments = lazy(() => import('../pages/MyPayments'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const MedicalRecordsPage = lazy(() => import('../pages/MedicalRecordsPage'));
const VaccinationSchedulePage = lazy(() => import('../pages/VaccinationSchedulePage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const LanguageSettingsPage = lazy(() => import('../pages/LanguageSettingsPage'));
const RolesPage = lazy(() => import('../pages/RolesPage'));
const NotFound = lazy(() => import('../pages/NotFound'));
const Forbidden = lazy(() => import('../pages/Forbidden'));

export const routeConfig = {
  public: [
    { path: '/login', component: Login },
  ],
  protected: [
    { path: '/', component: Navigate, to: '/dashboard' },
    { path: '/dashboard', component: Dashboard, roles: ['Admin', 'Owner', 'Manager', 'Shepherd', 'Doctor'] },
    { path: '/animals', component: AnimalList, roles: ['Admin', 'Owner', 'Manager', 'Shepherd', 'Doctor'] },
    { path: '/animals/new', component: AnimalEdit, roles: ['Admin', 'Owner', 'Manager', 'Shepherd'] },
    { path: '/animals/:id', component: AnimalDetails, roles: ['Admin', 'Owner', 'Manager', 'Shepherd', 'Doctor'] },
    { path: '/animals/:id/edit', component: AnimalEdit, roles: ['Admin', 'Owner', 'Manager', 'Shepherd'] },
    { path: '/devices', component: DeviceList, roles: ['Admin', 'Owner', 'Manager'] },
    { path: '/devices/new', component: DeviceForm, roles: ['Admin', 'Owner', 'Manager'] },
    { path: '/devices/:id/edit', component: DeviceEdit, roles: ['Admin', 'Owner', 'Manager'] },
    { path: '/users', component: UserList, roles: ['Admin', 'Owner'] },
    { path: '/users/new', component: UserCreate, roles: ['Admin', 'Owner'] },
    { path: '/users/add', component: Navigate, to: '/users/new' },
    { path: '/users/:id/edit', component: UserEdit, roles: ['Admin', 'Owner'] },
    { path: '/map', component: MapView, roles: ['Admin', 'Owner', 'Manager'] },
    { path: '/auctions', component: AuctionList, roles: ['Admin', 'Owner'] },
    { path: '/auctions/new', component: AuctionCreate, roles: ['Admin', 'Owner'] },
    { path: '/auctions/:id', component: AuctionDetails, roles: ['Admin', 'Owner'] },
    { path: '/auctions/:id/edit', component: AuctionEdit, roles: ['Admin', 'Owner'] },
    { path: '/alerts', component: AlertsPage, roles: ['Admin', 'Owner', 'Manager'] },
    { path: '/geofences', component: GeofenceList, roles: ['Admin', 'Owner', 'Manager'] },
    { path: '/animal-groups', component: AnimalGroupList, roles: ['Admin', 'Owner', 'Manager'] },
    { path: '/subscription', component: SubscriptionsPage, roles: ['Admin', 'Owner'] },
    { path: '/subscription/tiers', component: SubscriptionsPage, roles: ['Admin', 'Owner'] },
    { path: '/subscription/select', component: SubscriptionPage, roles: ['Admin', 'Owner'] },
    { path: '/profile', component: ProfilePage, roles: ['Admin', 'Owner', 'Manager', 'Shepherd', 'Doctor'] },
    { path: '/settings', component: SettingsPage, roles: ['Admin'] },
    { path: '/settings/languages', component: LanguageSettingsPage, roles: ['Admin'] },
    { path: '/settings/roles', component: RolesPage, roles: ['Admin'] },
    { path: '/medical-records', component: MedicalRecordsPage, roles: ['Admin', 'Owner', 'Manager', 'Doctor'] },
    { path: '/vaccination-schedule', component: VaccinationSchedulePage, roles: ['Admin', 'Owner', 'Manager', 'Doctor'] },
    { path: '/team', component: TeamPage, roles: ['Admin'] },
    { path: '/reports', component: ReportsPage, roles: ['Admin', 'Owner', 'Manager'] },
    { path: '/tasks', component: TasksPage, roles: ['Admin', 'Owner', 'Manager', 'Shepherd', 'Doctor'] },
    { path: '/task-logs-archive', component: TaskLogsArchive, roles: ['Admin', 'Owner'] },
    { path: '/payments', component: PaymentManagement, roles: ['Admin'] },
    { path: '/my-payments', component: MyPayments, roles: ['Admin', 'Owner'] },
  ],
  error: [
    { path: '/403', component: Forbidden },
    { path: '*', component: NotFound },
  ],
};

export const getRoutesForRole = (userRole) => {
  const allowed = [];
  
  routeConfig.protected.forEach(route => {
    if (!route.roles || route.roles.includes(userRole)) {
      allowed.push(route.path);
    }
  });
  
  return allowed;
};

export const canAccessRoute = (path, userRole) => {
  const route = routeConfig.protected.find(r => r.path === path);
  if (!route) return true;
  if (!route.roles) return true;
  return route.roles.includes(userRole);
};

export default routeConfig;