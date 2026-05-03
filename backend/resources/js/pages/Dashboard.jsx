import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { MaterialSymbol } from 'react-material-symbols';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useI18n } from '../i18n';

const createCustomIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #002819, #06402B);
        border-radius: 50%;
        border: 3px solid #D4AF37;
        box-shadow: 0 4px 12px rgba(6,64,43,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
      ">
        🐪
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

function MapUpdater({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [bounds, map]);
  return null;
}

const pathColors = [
  '#002819', '#06402B', '#735c00', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

export default function Dashboard() {
  const { t, dir } = useI18n();
  const isRtl = dir === 'rtl';
  const [user, setUser] = useState(null);

  const [stats, setStats] = useState({
    totalAnimals: 0,
    activeDevices: 0,
    alerts: 0,
    subscription: null,
  });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('markers');
  const [animals, setAnimals] = useState([]);
  const [devices, setDevices] = useState([]);
  const [locationHistories, setLocationHistories] = useState({});
  const [vaccinations, setVaccinations] = useState([]);
  const [vaccStats, setVaccStats] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, animalsRes, devicesRes, alertsRes, vaccRes, vaccStatsRes] = await Promise.all([
        apiFetch('/api/dashboard'),
        apiFetch('/api/animals?per_page=100'),
        apiFetch('/api/devices?per_page=100'),
        apiFetch('/api/geofence-alerts'),
        apiFetch('/api/vaccination-schedules?per_page=50'),
        apiFetch('/api/vaccination-schedules/stats'),
      ]);

      const dashboardData = dashboardRes.ok ? await dashboardRes.json() : { stats: {}, subscription: null };
      const animalsData = await animalsRes.json();
      const devicesData = await devicesRes.json();
      const alertsData = alertsRes.ok ? await alertsRes.json() : [];
      const vaccData = vaccRes.ok ? await vaccRes.json() : { data: [] };
      const vaccStatsData = vaccStatsRes.ok ? await vaccStatsRes.json() : {};

      const dashboardStats = dashboardData.stats || {};
      const subscriptionData = dashboardData.subscription;
      const animalsList = animalsData.data || [];
      const totalAnimals = animalsData.meta?.total || animalsData.total || animalsList.length;
      const devicesList = devicesData.data || [];
      const geofenceAlerts = Array.isArray(alertsData) ? alertsData : (alertsData.data || []);
      const vaccinationsList = vaccData.data || [];

      setVaccinations(vaccinationsList);
      setVaccStats(vaccStatsData);

      setDevices(devicesList);

      const animalsWithDevices = animalsList.filter(a => a.device?.device_id || a.device_id);
      
      const historyPromises = animalsWithDevices.map(animal => 
        apiFetch(`/api/animals/${animal.id}/location-history?hours=720`)
          .then(res => res.ok ? res.json() : null)
      );
      
      const histories = await Promise.all(historyPromises);
      const historyMap = {};
      animalsWithDevices.forEach((animal, idx) => {
        if (histories[idx]) {
          historyMap[animal.id] = histories[idx].locations || [];
        }
      });
      setLocationHistories(historyMap);

      const assignedDeviceIds = animalsList.map(a => a.device?.device_id || a.device_id).filter(Boolean);
      const offlineOrSignalDevices = devicesList.filter(d => d.status === 'offline' || d.status === 'low_signal').length;
      const animalsWithDevicesCount = assignedDeviceIds.length;
      const animalsWithoutDevices = totalAnimals - animalsWithDevicesCount;
      const unacknowledgedAlerts = geofenceAlerts.filter(a => !a.is_acknowledged).length;

      setStats({
        totalAnimals: totalAnimals,
        activeDevices: animalsWithDevicesCount,
        alerts: offlineOrSignalDevices + animalsWithoutDevices + unacknowledgedAlerts,
        subscription: subscriptionData,
      });

      const animalsWithLocations = animalsList.map((animal, index) => {
        const history = historyMap[animal.id] || [];
        let lat = null;
        let lng = null;
        
        if (history.length > 0) {
          const lastLoc = history[history.length - 1];
          lat = parseFloat(lastLoc.latitude);
          lng = parseFloat(lastLoc.longitude);
        } else if (animal.device?.gps_lat && animal.device?.gps_lng) {
          lat = parseFloat(animal.device.gps_lat);
          lng = parseFloat(animal.device.gps_lng);
        } else {
          lat = 24.4539 + (index * 0.002) - 0.004;
          lng = 54.3773 + (index * 0.003) - 0.003;
        }
        
        const path = history
          .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))
          .map(h => [parseFloat(h.latitude), parseFloat(h.longitude)]);
        
        return {
          ...animal,
          lat,
          lng,
          path
        };
      });

      setAnimals(animalsWithLocations);

      const dashboardAlerts = [];
      
      if (geofenceAlerts && geofenceAlerts.length > 0) {
        geofenceAlerts.slice(0, 10).forEach(alert => {
          const severity = alert.type === 'exit' ? 'High' : alert.type === 'temperature' ? 'Medium' : 'Medium';
          dashboardAlerts.push({ 
            id: alert.id,
            severity, 
            animal: alert.animal?.animal_id || alert.animal_id || 'Unknown', 
            message: alert.type === 'entry' ? `Entry: ${alert.geofence?.name || 'Geofence'}` : alert.type === 'exit' ? `Exit: ${alert.geofence?.name || 'Geofence'}` : alert.type,
            time: alert.triggered_at ? new Date(alert.triggered_at).toLocaleTimeString() : 'Now',
            isAcknowledged: alert.is_acknowledged,
          });
        });
      } else {
        devicesList.forEach(device => {
          if (device.status === 'offline') {
            dashboardAlerts.push({ severity: 'High', animal: device.device_id, message: 'Device Offline', time: 'Just now' });
          } else if (device.status === 'low_signal') {
            dashboardAlerts.push({ severity: 'Medium', animal: device.device_id, message: 'Low Signal / Battery Warning', time: 'Just now' });
          }
        });
      }
      
      const unassignedAnimals = animalsList.filter(a => !(a.device?.device_id || a.device_id));
      unassignedAnimals.forEach(animal => {
        dashboardAlerts.push({ severity: 'Medium', animal: animal.animal_id, message: 'No device assigned', time: 'Now' });
      });
      
      if (dashboardAlerts.length === 0) {
        dashboardAlerts.push({ severity: 'Low', animal: 'System', message: 'All systems operating normally', time: 'Now' });
      }

      setAlerts(dashboardAlerts);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const allPositions = [];
  animals.forEach(animal => {
    if (animal.lat && animal.lng) {
      allPositions.push([animal.lat, animal.lng]);
    }
    if (animal.path && animal.path.length > 0) {
      animal.path.forEach(p => allPositions.push(p));
    }
  });

  const bounds = allPositions.length > 1 
    ? [
        [Math.min(...allPositions.map(p => p[0])), Math.min(...allPositions.map(p => p[1]))],
        [Math.max(...allPositions.map(p => p[0])), Math.max(...allPositions.map(p => p[1]))]
      ]
    : allPositions.length === 1 
      ? [allPositions[0], allPositions[0]]
      : [[24.4539, 54.3773], [24.4539, 54.3773]];

  const animalsWithPaths = animals.filter(a => a.path && a.path.length > 0);

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'High': return 'bg-[#BA1A1A]/10 text-[#BA1A1A]';
      case 'Medium': return 'bg-[#D4AF37]/15 text-[#735C00]';
      case 'Low': return 'bg-[#F4F4EF] text-[#404943]';
      default: return 'bg-[#F4F4EF] text-[#717973]';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'High': return 'warning';
      case 'Medium': return 'signal_cellular_alt_1_bar';
      default: return 'check_circle';
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity) {
      case 'High': return 'bg-[#BA1A1A]/10';
      case 'Medium': return 'bg-[#D4AF37]/15';
      default: return 'bg-[#10b981]/15';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[#002819] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card group hover:shadow-[0_16px_48px_rgba(6,64,43,0.1)] transition-shadow duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#002819] to-[#06402B] flex items-center justify-center shadow-lg shadow-[#002819]/20">
              <MaterialSymbol icon="pets" size={24} className="text-[#D4AF37]" weight="fill" />
            </div>
            <span className="chip chip-success">+2.4%</span>
          </div>
          <div>
            <p className="text-sm font-medium text-[#404943] mb-1">{t('dashboard.totalAnimals')}</p>
            <h3 className="text-4xl font-black text-[#002819]">{stats.totalAnimals}</h3>
          </div>
        </div>

        <div className="stat-card group hover:shadow-[0_16px_48px_rgba(6,64,43,0.1)] transition-shadow duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#002819] to-[#06402B] flex items-center justify-center shadow-lg shadow-[#002819]/20">
              <MaterialSymbol icon="sensors" size={24} className="text-[#D4AF37]" weight="fill" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse" />
              <span className="chip chip-success">{t('dashboard.live')}</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-[#404943] mb-1">{t('dashboard.activeDevices')}</p>
            <h3 className="text-4xl font-black text-[#002819]">{stats.activeDevices}</h3>
          </div>
        </div>

        <div className="stat-card group hover:shadow-[0_16px_48px_rgba(6,64,43,0.1)] transition-shadow duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#BA1A1A]/90 to-[#BA1A1A]/70 flex items-center justify-center shadow-lg shadow-[#BA1A1A]/20">
              <MaterialSymbol icon="warning" size={24} className="text-white" weight="fill" />
            </div>
            <span className="chip chip-danger">{t('dashboard.critical')}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-[#404943] mb-1">{t('dashboard.alerts')}</p>
            <h3 className="text-4xl font-black text-[#BA1A1A]">{stats.alerts}</h3>
          </div>
        </div>

        {stats.subscription?.is_admin ? (
          <Link to="/users" className="stat-card bg-gradient-to-br from-[#002819] to-[#06402B] text-white group hover:shadow-[0_16px_48px_rgba(6,64,43,0.1)] transition-shadow duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <MaterialSymbol icon="admin_panel_settings" size={24} className="text-[#D4AF37]" weight="fill" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-white/60 mb-1">{t('subscription.title')}</p>
              <div className="space-y-1">
                <p className="text-2xl font-black text-[#D4AF37]">{stats.subscription.active_subscriptions || 0} {t('subscription.active')}</p>
                <p className="text-sm text-white/60">{stats.subscription.pending_payments || 0} {t('payments.pendingPayments')}</p>
              </div>
            </div>
          </Link>
        ) : stats.subscription ? (
          <div className="stat-card bg-gradient-to-br from-[#002819] to-[#06402B] text-white group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <MaterialSymbol icon="stars" size={24} className="text-[#D4AF37]" weight="fill" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-white/60 mb-1">{t('subscription.title')}</p>
              <h3 className="text-3xl font-black text-[#D4AF37]">
                {stats.subscription.tier_name || 'Free'}
              </h3>
              {stats.subscription.is_on_trial && stats.subscription.trial_ends_at && (
                <p className="text-xs text-white/60 mt-1">
                  Trial ends: {new Date(stats.subscription.trial_ends_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ) : (
          <Link to="/subscription" className="stat-card bg-gradient-to-br from-[#002819] to-[#06402B] text-white group hover:shadow-[0_16px_48px_rgba(6,64,43,0.1)] transition-shadow duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <MaterialSymbol icon="stars" size={24} className="text-[#D4AF37]" weight="fill" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-white/60 mb-1">{t('subscription.title')}</p>
              <h3 className="text-2xl font-black text-[#D4AF37]">{t('subscription.selectPlan')}</h3>
            </div>
          </Link>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card">
          <div className={`p-8 flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
            <h4 className="font-black text-2xl text-[#002819]">
              {t('dashboard.herdLocations')}
            </h4>
            <div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              {[
                { mode: 'markers', label: t('dashboard.regionalView'), icon: 'map' },
                { mode: 'paths', label: t('dashboard.paths'), icon: 'route' },
              ].map(({ mode, label, icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    viewMode === mode
                      ? 'bg-gradient-to-br from-[#002819] to-[#06402B] text-white shadow-lg shadow-[#002819]/20'
                      : 'bg-[#F4F4EF] text-[#404943] hover:bg-[#E3E3DE]'
                  }`}
                >
                  <MaterialSymbol icon={icon} size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[450px] relative rounded-b-3xl overflow-hidden">
            <MapContainer
              center={[24.4539, 54.3773]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapUpdater bounds={bounds} />
              
              {viewMode === 'markers' && animals.filter(a => a.lat && a.lng).map((animal, idx) => (
                <Marker
                  key={animal.id}
                  position={[animal.lat, animal.lng]}
                  icon={createCustomIcon()}
                >
                  <Popup>
                    <div className="p-3 min-w-[200px]">
                      <h3 className="font-bold text-[#002819] text-lg">{animal.animal_id}</h3>
                      <p className="text-sm text-[#404943] mt-1">{animal.species}</p>
                      {animal.baseline_temperature && (
                        <p className="text-xs mt-2 text-[#735C00]">🌡️ {animal.baseline_temperature}°C</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              {viewMode === 'paths' && animalsWithPaths.map((animal, idx) => (
                <Polyline
                  key={animal.id}
                  positions={animal.path}
                  color={pathColors[idx % pathColors.length]}
                  weight={3}
                  opacity={0.8}
                />
              ))}
              {viewMode === 'paths' && animalsWithPaths.map((animal, idx) => (
                <Marker
                  key={`marker-${animal.id}`}
                  position={animal.path[animal.path.length - 1]}
                  icon={createCustomIcon()}
                >
                  <Popup>
                    <div className="p-3">
                      <h3 className="font-bold text-[#002819]">{animal.animal_id}</h3>
                      <p className="text-xs text-[#404943]">{animal.path.length} tracking points</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            <div className={`absolute bottom-6 z-[1000] bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg shadow-[#002819]/10 flex items-center gap-6 ${isRtl ? 'right-6' : 'left-6'}`}>
              <span className="text-sm font-medium text-[#404943]">
                {animals.filter(a => a.path && a.path.length > 0).length} animals tracked
              </span>
              <Link to="/map" className="text-sm font-bold text-[#D4AF37] hover:underline flex items-center gap-1">
                {t('dashboard.fullTracker')}
                <MaterialSymbol icon="arrow_forward" size={16} />
              </Link>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-8">
            <h4 className="font-black text-2xl text-[#002819] mb-6">
              {t('dashboard.recentAlerts')}
            </h4>
          </div>
          <div className="px-6 pb-6 space-y-4 max-h-[380px] overflow-y-auto">
            {alerts.map((alert, index) => (
              <div key={index} className={`p-5 rounded-2xl ${getSeverityClass(alert.severity)}`}>
                <div className={`flex items-start gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${getSeverityBg(alert.severity)}`}>
                    <MaterialSymbol 
                      icon={getSeverityIcon(alert.severity)} 
                      size={20}
                      className={alert.severity === 'High' ? 'text-[#BA1A1A]' : alert.severity === 'Medium' ? 'text-[#735C00]' : 'text-[#10b981]'}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase mb-1 opacity-70">{alert.severity}</p>
                    <p className="text-base font-bold text-[#002819]">{alert.device}</p>
                    <p className="text-sm text-[#404943] mt-1">{alert.message}</p>
                  </div>
                  <span className="text-xs text-[#717973] whitespace-nowrap">{alert.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-8">
        <div className={`flex justify-between items-center mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <MaterialSymbol icon="vaccines" size={24} className="text-emerald-700" weight="fill" />
            </div>
            <div className={isRtl ? 'text-right' : ''}>
              <h4 className="font-black text-xl text-[#002819]">{t('vaccination.title')}</h4>
              <div className="flex gap-3 mt-1">
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">{vaccStats.scheduled || 0} {t('vaccination.scheduled')}</span>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">{vaccStats.overdue || 0} {t('vaccination.overdue')}</span>
              </div>
            </div>
          </div>
          <Link to="/medical-records" className="flex items-center gap-2 px-4 py-2 bg-[#002819] text-white rounded-xl font-semibold text-sm hover:bg-[#06402b] transition-colors">
            {t('vaccination.add')}
            <MaterialSymbol icon="arrow_forward" size={16} />
          </Link>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-xs font-bold text-[#717973] py-2">{day}</div>
          ))}
          {(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const currentMonth = today.getMonth();
            const firstDay = new Date(today.getFullYear(), currentMonth, 1).getDay();
            const daysInMonth = new Date(today.getFullYear(), currentMonth + 1, 0).getDate();
            const cells = [];
            
            for (let i = 0; i < firstDay; i++) cells.push(null);
            for (let i = 1; i <= daysInMonth; i++) cells.push(i);
            
            return cells.map((day, idx) => {
              if (!day) return <div key={idx} className="aspect-square" />;
              
              const dateStr = `${today.getFullYear()}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayVaccs = vaccinations.filter(v => v.scheduled_date === dateStr);
              const isToday = day === today.getDate();
              const hasOverdue = dayVaccs.some(v => v.status === 'overdue');
              const hasScheduled = dayVaccs.some(v => v.status === 'scheduled');
              
              return (
                <div key={idx} className={`aspect-square rounded-lg flex flex-col items-center justify-center relative ${isToday ? 'bg-[#D4AF37] text-white' : 'bg-[#F4F4EF] hover:bg-[#E3E3DE]'} transition-colors cursor-pointer`}>
                  <span className="text-sm font-semibold">{day}</span>
                  {hasOverdue && <div className="absolute bottom-1 w-2 h-2 bg-red-500 rounded-full" />}
                  {hasScheduled && !hasOverdue && <div className="absolute bottom-1 w-2 h-2 bg-emerald-500 rounded-full" />}
                </div>
              );
            });
          })()}
        </div>
        
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
            <span className="text-xs text-[#717973]">{t('vaccination.scheduled')}</span>
          </div>
          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-xs text-[#717973]">{t('vaccination.overdue')}</span>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { to: '/animals', icon: 'pets', title: t('dashboard.manageAnimals'), subtitle: `${stats.totalAnimals} total`, color: 'from-[#002819] to-[#06402B]' },
          { to: '/devices', icon: 'sensors', title: t('nav.devices'), subtitle: `${stats.activeDevices} active`, color: 'from-[#06402B] to-[#002819]' },
          { to: '/map', icon: 'map', title: t('nav.mapView'), subtitle: t('dashboard.fullTracker'), color: 'from-[#735C00] to-[#D4AF37]' },
          { to: '/users', icon: 'groups', title: t('nav.team'), subtitle: t('team.teamMembers'), color: 'from-[#D4AF37] to-[#735C00]' },
        ].map((item, idx) => (
          <Link 
            key={idx} 
            to={item.to} 
            className={`card p-8 bg-gradient-to-br ${item.color} text-white group hover:shadow-[0_16px_48px_rgba(6,64,43,0.15)] transition-all duration-300 hover:-translate-y-1`}
          >
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MaterialSymbol icon={item.icon} size={28} className="text-white" weight="fill" />
            </div>
            <h5 className="font-bold text-xl mb-2">{item.title}</h5>
            <p className="text-sm text-white/70">{item.subtitle}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
