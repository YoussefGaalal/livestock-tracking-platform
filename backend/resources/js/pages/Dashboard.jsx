import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { MaterialSymbol } from 'react-material-symbols';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useI18n } from '../i18n';

/* ─── Demo / fallback data ─────────────────────────────────────────────── */
const DEMO_ANIMALS = [
  { id: 1, animal_id: 'CAM-001', name: 'Sultan', species: 'Camel', lat: 24.4600, lng: 54.3820, path: [[24.4580,54.3800],[24.4590,54.3810],[24.4600,54.3820]], baseline_temperature: 37.5 },
  { id: 2, animal_id: 'CAM-002', name: 'Reem',   species: 'Camel', lat: 24.4540, lng: 54.3760, path: [[24.4520,54.3740],[24.4530,54.3750],[24.4540,54.3760]], baseline_temperature: 37.8 },
  { id: 3, animal_id: 'GOT-001', name: 'Zain',   species: 'Goat',  lat: 24.4570, lng: 54.3900, path: [[24.4560,54.3880],[24.4565,54.3890],[24.4570,54.3900]], baseline_temperature: 38.2 },
  { id: 4, animal_id: 'GOT-002', name: 'Layla',  species: 'Goat',  lat: 24.4510, lng: 54.3840, path: [], baseline_temperature: 38.0 },
  { id: 5, animal_id: 'SHE-001', name: 'Noor',   species: 'Sheep', lat: 24.4630, lng: 54.3780, path: [[24.4620,54.3770],[24.4625,54.3775],[24.4630,54.3780]], baseline_temperature: 39.1 },
  { id: 6, animal_id: 'SHE-002', name: 'Faris',  species: 'Sheep', lat: 24.4490, lng: 54.3710, path: [], baseline_temperature: 38.9 },
  { id: 7, animal_id: 'CAM-003', name: 'Majd',   species: 'Camel', lat: 24.4660, lng: 54.3850, path: [[24.4650,54.3840],[24.4655,54.3845],[24.4660,54.3850]], baseline_temperature: 37.3 },
  { id: 8, animal_id: 'GOT-003', name: 'Hessa',  species: 'Goat',  lat: 24.4480, lng: 54.3920, path: [], baseline_temperature: 38.5 },
];

const DEMO_ALERTS = [
  { severity: 'High',   animal: 'CAM-002', message: 'Exited Northern Pasture geofence', time: '3 min ago' },
  { severity: 'High',   animal: 'GOT-001', message: 'Exited Main Farm boundary',         time: '18 min ago' },
  { severity: 'Medium', animal: 'DEV-005', message: 'Battery low — 12% remaining',       time: '42 min ago' },
  { severity: 'Medium', animal: 'SHE-001', message: 'Entered Restricted Zone A',         time: '1 hr ago' },
  { severity: 'Low',    animal: 'System',  message: 'Daily health check completed — 8/8 animals OK', time: '2 hr ago' },
];

const DEMO_VACCINATIONS = [
  { id: 1, animal_id: 'CAM-001', vaccine_name: 'FMD Vaccine',       scheduled_date: fmtDate(2), status: 'scheduled' },
  { id: 2, animal_id: 'GOT-001', vaccine_name: 'PPR Vaccine',        scheduled_date: fmtDate(5), status: 'scheduled' },
  { id: 3, animal_id: 'SHE-002', vaccine_name: 'Brucellosis Boost',  scheduled_date: fmtDate(-3), status: 'overdue' },
  { id: 4, animal_id: 'CAM-003', vaccine_name: 'FMD Vaccine',       scheduled_date: fmtDate(10), status: 'scheduled' },
];

function fmtDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

const DEMO_STATS = { totalAnimals: 8, activeDevices: 5, alerts: 3 };

/* ─── Map helpers ───────────────────────────────────────────────────────── */
const createCustomIcon = () => L.divIcon({
  className: 'custom-marker',
  html: `<div class="w-7 h-7 bg-gradient-to-br from-[#002819] to-[#06402B] rounded-full border-2 border-[#D4AF37] shadow-[0_3px_8px_rgba(6,64,43,0.35)] flex items-center justify-center text-[13px]">🐪</div>`,
  iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14],
});

function MapUpdater({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds?.length > 1) map.fitBounds(bounds, { padding: [40, 40], animate: true });
  }, [bounds, map]);
  return null;
}

const PATH_COLORS = ['#002819','#06402B','#735c00','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];

const SEVERITY_STYLES = {
  High:   { pill: 'bg-red-50 text-red-700',    icon: 'warning',               iconColor: 'text-red-600',   dot: 'bg-red-500' },
  Medium: { pill: 'bg-amber-50 text-amber-700', icon: 'notifications_active',  iconColor: 'text-amber-600', dot: 'bg-amber-500' },
  Low:    { pill: 'bg-emerald-50 text-emerald-700', icon: 'check_circle',      iconColor: 'text-emerald-600', dot: 'bg-emerald-500' },
};

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { t, dir } = useI18n();
  const isRtl = dir === 'rtl';

  const [stats, setStats]   = useState(DEMO_STATS);
  const [alerts, setAlerts] = useState(DEMO_ALERTS);
  const [animals, setAnimals] = useState(DEMO_ANIMALS);
  const [vaccinations, setVaccinations] = useState(DEMO_VACCINATIONS);
  const [vaccStats, setVaccStats] = useState({ scheduled: 3, overdue: 1 });
  const [viewMode, setViewMode] = useState('markers');
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, animalsRes, alertsRes, vaccRes, vaccStatsRes] = await Promise.all([
        apiFetch('/api/dashboard').catch(() => null),
        apiFetch('/api/animals?per_page=100').catch(() => null),
        apiFetch('/api/geofence-alerts').catch(() => null),
        apiFetch('/api/vaccination-schedules?per_page=50').catch(() => null),
        apiFetch('/api/vaccination-schedules/stats').catch(() => null),
      ]);

      const dashData   = dashRes?.ok   ? await dashRes.json()   : null;
      const animData   = animalsRes?.ok ? await animalsRes.json() : null;
      const alertData  = alertsRes?.ok  ? await alertsRes.json()  : null;
      const vaccData   = vaccRes?.ok    ? await vaccRes.json()    : null;
      const vsData     = vaccStatsRes?.ok ? await vaccStatsRes.json() : null;

      const liveAnimals = animData?.data || [];
      const liveAlerts  = Array.isArray(alertData) ? alertData : (alertData?.data || []);
      const liveVaccs   = vaccData?.data || [];

      // Use live data if we actually received animals, otherwise keep demo
      if (liveAnimals.length > 0) {
        const withCoords = liveAnimals.map((a, i) => ({
          ...a,
          lat: a.lat ?? (24.4539 + i * 0.002),
          lng: a.lng ?? (54.3773 + i * 0.003),
          path: [],
        }));
        setAnimals(withCoords);
        setStats({
          totalAnimals: animData?.meta?.total ?? liveAnimals.length,
          activeDevices: liveAnimals.filter(a => a.device_id).length,
          alerts: liveAlerts.filter(a => !a.is_acknowledged).length,
        });
      }

      if (liveAlerts.length > 0) {
        setAlerts(liveAlerts.slice(0, 6).map(a => ({
          severity: a.type === 'exit' ? 'High' : 'Medium',
          animal:   a.animal?.animal_id ?? a.animal_id ?? '—',
          message:  a.type === 'exit' ? `Exited: ${a.geofence?.name ?? 'Geofence'}` : a.type,
          time:     a.triggered_at ? new Date(a.triggered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
        })));
      }

      if (liveVaccs.length > 0) setVaccinations(liveVaccs);
      if (vsData)                setVaccStats(vsData);
      if (dashData?.subscription) setSubscription(dashData.subscription);

    } catch (e) {
      console.warn('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  /* map bounds */
  const allPos = animals.flatMap(a => [
    a.lat && a.lng ? [[a.lat, a.lng]] : [],
    ...(a.path ?? []).map(p => [p]),
  ]).flat();

  const bounds = allPos.length > 1
    ? [[Math.min(...allPos.map(p=>p[0])), Math.min(...allPos.map(p=>p[1]))],
       [Math.max(...allPos.map(p=>p[0])), Math.max(...allPos.map(p=>p[1]))]]
    : [[24.41, 54.34], [24.50, 54.42]];

  const animalsWithPaths = animals.filter(a => a.path?.length > 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-[#002819] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10 overflow-x-hidden">

      {/* ── Stat Cards ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {/* Total Animals */}
        <StatCard
          icon="pets" iconBg="from-[#002819] to-[#06402B]" iconColor="text-[#D4AF37]"
          badge="+2.4%" badgeStyle="chip-success"
          label={t('dashboard.totalAnimals') || 'Total Animals'}
          value={stats.totalAnimals}
          valueColor="text-[#002819]"
        />
        {/* Active Devices */}
        <StatCard
          icon="sensors" iconBg="from-[#002819] to-[#06402B]" iconColor="text-[#D4AF37]"
          badge={<><span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse inline-block mr-1" />{t('dashboard.live')||'Live'}</>}
          badgeStyle="chip-success"
          label={t('dashboard.activeDevices') || 'Active Devices'}
          value={stats.activeDevices}
          valueColor="text-[#002819]"
        />
        {/* Alerts */}
        <StatCard
          icon="warning" iconBg="from-red-600 to-red-500" iconColor="text-white"
          badge={t('dashboard.critical')||'Critical'} badgeStyle="chip-danger"
          label={t('dashboard.alerts') || 'Active Alerts'}
          value={stats.alerts}
          valueColor="text-red-600"
        />
        {/* Subscription */}
        {subscription ? (
          <div className="stat-card bg-gradient-to-br from-[#002819] to-[#06402B] text-white">
            <div className="flex justify-between items-start mb-3 md:mb-5">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/15 flex items-center justify-center">
                <MaterialSymbol icon="stars" size={20} className="text-[#D4AF37]" weight="fill" />
              </div>
            </div>
            <p className="text-xs md:text-sm font-medium text-white/60 mb-1">{t('subscription.title')||'Plan'}</p>
            <h3 className="text-xl md:text-3xl font-black text-[#D4AF37]">{subscription.tier_name || 'Starter'}</h3>
          </div>
        ) : (
          <Link to="/subscription" className="stat-card bg-gradient-to-br from-[#002819] to-[#06402B] text-white hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-3 md:mb-5">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/15 flex items-center justify-center">
                <MaterialSymbol icon="stars" size={20} className="text-[#D4AF37]" weight="fill" />
              </div>
            </div>
            <p className="text-xs md:text-sm font-medium text-white/60 mb-1">{t('subscription.title')||'Plan'}</p>
            <h3 className="text-lg md:text-2xl font-black text-[#D4AF37]">Starter</h3>
            <p className="text-xs text-white/50 mt-1">14-day trial</p>
          </Link>
        )}
      </section>

      {/* ── Map + Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Map */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-4 md:px-8 py-4 md:py-6 flex flex-wrap justify-between items-center gap-3 border-b border-[#E3E3DE]">
            <h4 className="font-black text-lg md:text-2xl text-[#002819]">
              {t('dashboard.herdLocations') || 'Herd Locations'}
            </h4>
            <div className="flex gap-2">
              {[
                { mode: 'markers', icon: 'map',   label: 'Map' },
                { mode: 'paths',   icon: 'route',  label: 'Paths' },
              ].map(({ mode, icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                    viewMode === mode
                      ? 'bg-gradient-to-br from-[#002819] to-[#06402B] text-white shadow'
                      : 'bg-[#F4F4EF] text-[#404943] hover:bg-[#E3E3DE]'
                  }`}
                >
                  <MaterialSymbol icon={icon} size={15} />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px] md:h-[420px] relative">
            <MapContainer center={[24.4539, 54.3773]} zoom={12} className="h-full w-full" scrollWheelZoom={false}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapUpdater bounds={bounds} />
              {viewMode === 'markers' && animals.filter(a => a.lat && a.lng).map((a, i) => (
                <Marker key={a.id} position={[a.lat, a.lng]} icon={createCustomIcon()}>
                  <Popup>
                    <div className="p-2 min-w-[160px]">
                      <p className="font-bold text-[#002819]">{a.name || a.animal_id}</p>
                      <p className="text-xs text-[#404943]">{a.species}</p>
                      {a.baseline_temperature && <p className="text-xs text-amber-700 mt-1">🌡️ {a.baseline_temperature}°C</p>}
                    </div>
                  </Popup>
                </Marker>
              ))}
              {viewMode === 'paths' && animalsWithPaths.map((a, i) => (
                <Polyline key={a.id} positions={a.path} color={PATH_COLORS[i % PATH_COLORS.length]} weight={3} opacity={0.85} />
              ))}
              {viewMode === 'paths' && animalsWithPaths.map((a, i) => (
                <Marker key={`mk-${a.id}`} position={a.path[a.path.length-1]} icon={createCustomIcon()}>
                  <Popup><p className="font-bold text-[#002819] p-1">{a.name || a.animal_id}</p></Popup>
                </Marker>
              ))}
            </MapContainer>
            <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow flex items-center gap-4">
              <span className="text-xs font-medium text-[#404943]">{animals.length} animals tracked</span>
              <Link to="/map" className="text-xs font-bold text-[#D4AF37] flex items-center gap-1 hover:underline">
                Full map <MaterialSymbol icon="arrow_forward" size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="card flex flex-col">
          <div className="px-4 md:px-6 py-4 md:py-5 border-b border-[#E3E3DE] flex items-center justify-between">
            <h4 className="font-black text-lg md:text-xl text-[#002819]">{t('dashboard.recentAlerts')||'Recent Alerts'}</h4>
            <Link to="/alerts" className="text-xs font-semibold text-[#D4AF37] hover:underline flex items-center gap-1">
              View all <MaterialSymbol icon="chevron_right" size={14} />
            </Link>
          </div>
           <div className="flex-1 overflow-y-auto px-3 md:px-4 py-3 md:py-4 space-y-3 max-h-[380px]">
            {alerts.map((alert, i) => {
              const s = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.Low;
              return (
                <div key={i} className={`rounded-2xl p-3 md:p-4 ${s.pill}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/50`}>
                      <MaterialSymbol icon={s.icon} size={17} className={s.iconColor} weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase opacity-60 tracking-wide">{alert.severity}</span>
                        <span className="text-[10px] text-current opacity-50 whitespace-nowrap">{alert.time}</span>
                      </div>
                      <p className="text-sm font-bold truncate">{alert.animal}</p>
                      <p className="text-xs opacity-70 mt-0.5 leading-tight">{alert.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Animal Quick List ── */}
      <div className="card overflow-hidden">
        <div className="px-4 md:px-8 py-4 md:py-5 border-b border-[#E3E3DE] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#002819] to-[#06402B] flex items-center justify-center">
              <MaterialSymbol icon="pets" size={18} className="text-[#D4AF37]" weight="fill" />
            </div>
            <h4 className="font-black text-lg md:text-xl text-[#002819]">Herd Overview</h4>
          </div>
          <Link to="/animals" className="text-xs font-semibold text-[#D4AF37] hover:underline flex items-center gap-1">
            Manage <MaterialSymbol icon="chevron_right" size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead className="bg-[#F4F4EF]">
              <tr>
                {['ID','Name','Species','Temp','Status'].map(h => (
                  <th key={h} className="text-left text-xs font-bold text-[#717973] uppercase tracking-wide px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F4EF]">
              {animals.slice(0, 6).map(a => (
                <tr key={a.id} className="hover:bg-[#F4F4EF]/60 transition-colors">
                  <td className="px-4 py-3 text-xs font-bold text-[#002819] font-mono">{a.animal_id}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-[#002819]">{a.name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-[#404943]">{a.species}</td>
                  <td className="px-4 py-3 text-xs text-amber-700 font-medium">{a.baseline_temperature ? `${a.baseline_temperature}°C` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${a.path?.length > 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-[#F4F4EF] text-[#717973]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${a.path?.length > 1 ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      {a.path?.length > 1 ? 'Tracked' : 'No Device'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Vaccination Calendar ── */}
      <div className="card p-4 md:p-8">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <MaterialSymbol icon="vaccines" size={18} className="text-emerald-700" weight="fill" />
            </div>
            <div>
              <h4 className="font-black text-base md:text-xl text-[#002819]">{t('vaccination.title')||'Vaccinations'}</h4>
              <div className="flex gap-2 mt-0.5">
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{vaccStats.scheduled || 3} Scheduled</span>
                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">{vaccStats.overdue || 1} Overdue</span>
              </div>
            </div>
          </div>
          <Link to="/vaccination-schedule" className="flex items-center gap-2 px-3 py-2 bg-[#002819] text-white rounded-xl text-xs md:text-sm font-semibold hover:bg-[#06402b] transition-colors">
            View Schedule <MaterialSymbol icon="arrow_forward" size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] md:text-xs font-bold text-[#717973] py-1">{d}</div>
          ))}
          {(() => {
            const today = new Date(); today.setHours(0,0,0,0);
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
            const daysInMonth = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
            const cells = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_,i) => i+1)];
            return cells.map((day, idx) => {
              if (!day) return <div key={idx} className="aspect-square" />;
              const ds = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const dayVaccs = vaccinations.filter(v => v.scheduled_date === ds);
              const isToday = day === today.getDate();
              return (
                <div key={idx} className={`aspect-square rounded-md md:rounded-lg flex flex-col items-center justify-center relative text-[10px] md:text-sm font-semibold cursor-pointer transition-colors ${
                  isToday ? 'bg-[#D4AF37] text-white' : 'bg-[#F4F4EF] text-[#404943] hover:bg-[#E3E3DE]'
                }`}>
                  {day}
                  {dayVaccs.some(v => v.status === 'overdue') && <div className="absolute bottom-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />}
                  {dayVaccs.some(v => v.status === 'scheduled') && !dayVaccs.some(v => v.status === 'overdue') && <div className="absolute bottom-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                </div>
              );
            });
          })()}
        </div>
        <div className="mt-3 flex items-center justify-center gap-5">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /><span className="text-xs text-[#717973]">Scheduled</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-red-500 rounded-full" /><span className="text-xs text-[#717973]">Overdue</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#D4AF37] rounded-full" /><span className="text-xs text-[#717973]">Today</span></div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {[
          { to:'/animals',  icon:'pets',      title:'Animals',    sub:`${stats.totalAnimals} registered`,  color:'from-[#002819] to-[#06402B]' },
          { to:'/devices',  icon:'sensors',   title:'Devices',    sub:`${stats.activeDevices} active`,     color:'from-[#06402B] to-[#002819]' },
          { to:'/map',      icon:'map',       title:'Live Map',   sub:'Real-time tracking',                color:'from-[#735C00] to-[#D4AF37]' },
          { to:'/auctions', icon:'gavel',     title:'Auctions',   sub:'Livestock marketplace',             color:'from-[#D4AF37] to-[#735C00]' },
        ].map((item, idx) => (
          <Link key={idx} to={item.to}
            className={`card p-4 md:p-7 bg-gradient-to-br ${item.color} text-white group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200`}
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3 md:mb-5 group-hover:scale-110 transition-transform">
              <MaterialSymbol icon={item.icon} size={22} className="text-white" weight="fill" />
            </div>
            <h5 className="font-bold text-base md:text-lg mb-0.5 md:mb-1">{item.title}</h5>
            <p className="text-xs text-white/65">{item.sub}</p>
          </Link>
        ))}
      </section>

    </div>
  );
}

/* ─── StatCard sub-component ────────────────────────────────────────────── */
function StatCard({ icon, iconBg, iconColor, badge, badgeStyle, label, value, valueColor }) {
  return (
    <div className="stat-card group hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-3 md:mb-5">
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br ${iconBg} flex items-center justify-center shadow`}>
          <MaterialSymbol icon={icon} size={20} className={iconColor} weight="fill" />
        </div>
        <span className={`chip ${badgeStyle} text-[10px] md:text-xs`}>{badge}</span>
      </div>
      <p className="text-xs md:text-sm font-medium text-[#404943] mb-0.5 md:mb-1 leading-tight">{label}</p>
      <h3 className={`text-3xl md:text-4xl font-black ${valueColor}`}>{value}</h3>
    </div>
  );
}
