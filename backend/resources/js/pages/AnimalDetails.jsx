import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useI18n } from '../i18n';

const createMarkerIcon = (status) => {
  const colors = { healthy: '#10b981', warning: '#f59e0b', critical: '#ef4444' };
  const color = colors[status] || '#10b981';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:40px;height:40px;background:${color};border-radius:50%;border:4px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:20px;">🐪</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 14, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export default function AnimalDetails() {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState(null);
  const [owner, setOwner] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [activityHistory, setActivityHistory] = useState([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchAnimal();
  }, [id]);

  const fetchUsers = async () => {
    try {
      const res = await apiFetch('/api/users?per_page=100');
      if (res.ok) {
        const data = await res.json();
        const owners = (data.data || []).filter(u => u.role === 'Owner' || u.role === 'owner');
        setUsers(owners);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleTransferClick = () => {
    setShowTransferModal(true);
    setSelectedUser('');
    setMessage(null);
    fetchUsers();
  };

  const handleTransferOwnership = async () => {
    if (!selectedUser) return;
    
    setTransferLoading(true);
    setMessage(null);
    
    try {
      const res = await apiFetch(`/api/animals/${id}/transfer-ownership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedUser }),
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: t('animalDetailsPage.transferSuccess') });
        setTimeout(() => {
          setShowTransferModal(false);
          fetchAnimal();
        }, 1500);
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || 'Transfer failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setTransferLoading(false);
    }
  };

const fetchAnimal = async () => {
    try {
      const [animalRes, historyRes, alertsRes] = await Promise.all([
        apiFetch(`/api/animals/${id}`),
        apiFetch(`/api/animals/${id}/location-history?hours=720`),
        apiFetch(`/api/geofence-alerts?per_page=20`),
      ]);
      if (animalRes.ok) {
        const animalData = await animalRes.json();
        const animalObj = animalData.data || animalData;
        setAnimal(animalObj);
        
        if (animalObj.device) {
          setDevice(animalObj.device);
        }
        
        if (animalObj.owner) {
          setOwner(animalObj.owner);
        }

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setLocationHistory(historyData.locations || []);
        }

        if (alertsRes.ok) {
          const alertsData = await alertsRes.json();
          const animalAlerts = (alertsData.data || []).filter(a => a.animal_id === parseInt(id));
          setActivityHistory(animalAlerts);
        }
      }
    } catch (error) {
      console.error('Failed to fetch animal:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPathPositions = () => {
    return locationHistory.map(loc => [parseFloat(loc.latitude), parseFloat(loc.longitude)]);
  };

  const getCurrentPosition = () => {
    const positions = getPathPositions();
    if (positions.length > 0) {
      return positions[positions.length - 1];
    }
    if (device?.gps_lat && device?.gps_lng) {
      return [parseFloat(device.gps_lat), parseFloat(device.gps_lng)];
    }
    return null;
  };

  const getStatus = () => {
    const temp = parseFloat(animal?.baseline_temperature) || 38.5;
    if (temp > 39.5) return 'critical';
    if (temp > 39) return 'warning';
    return 'healthy';
  };

  const statusConfig = getStatusConfig(animal?.baseline_temperature);
  const positions = getPathPositions();
  const currentPosition = getCurrentPosition();
  const status = getStatus();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#002819] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="p-8 text-center">
        <p className="text-stone-500">{t('animalDetailsPage.animalNotFound')}</p>
        <Link to="/animals" className="text-emerald-700 font-bold hover:underline">{t('animalDetailsPage.backToAnimals')}</Link>
      </div>
    );
  }

  return (
    <main className="p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
      {/* Hero Header */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 items-stretch">
        {/* Main Hero Image */}
        <div className="lg:col-span-8 relative rounded-[2rem] overflow-hidden shadow-2xl h-[400px] group">
          {animal.identification_photo ? (
            <img src={animal.identification_photo} alt={animal.animal_id} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
              <MaterialSymbol icon="pets" size={120} className="text-emerald-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#002819]/90 via-[#002819]/30 to-transparent"></div>
          <div className="absolute bottom-0 right-0 left-0 p-10 flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-amber-400 text-emerald-950 text-[10px] font-bold rounded-full uppercase tracking-widest shadow-lg shadow-amber-400/20">
                  {animal.species}
                </span>
                <span className="text-emerald-100/70 text-sm font-medium">| ID: {animal.animal_id}</span>
              </div>
              <h2 className="text-5xl font-extrabold text-white brand-font tracking-tight mb-2">
                {animal.name || animal.breed || animal.species}
              </h2>
              <div className="flex items-center gap-2 text-emerald-100/80">
                <MaterialSymbol icon="person" className="text-amber-400" />
                <span className="font-medium">{owner?.name || t('animalDetailsPage.unassignedOwner')}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to={`/animals/${id}/edit`} className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-xl font-bold transition-all border border-white/10 flex items-center gap-2">
                <MaterialSymbol icon="edit" />
                {t('animals.editProfile')}
              </Link>
              <Link to={`/auctions/new?animal=${id}`} className="bg-amber-400 hover:bg-amber-500 text-emerald-950 px-8 py-3 rounded-xl font-bold transition-all shadow-xl shadow-amber-900/20 flex items-center gap-2">
                <MaterialSymbol icon="gavel" />
                {t('animalDetailsPage.sellAnimal')}
              </Link>
            </div>
          </div>
        </div>

        {/* Right Cards */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Ownership Card */}
          <div className="bg-[#06402b] text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden flex-1 flex flex-col justify-between">
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <h3 className="text-emerald-200 text-xs font-bold uppercase tracking-[0.2em] mb-4">{t('animalDetailsPage.verifiedOwnership')}</h3>
                <MaterialSymbol icon="verified_user" className="text-emerald-200/50" />
              </div>
              <p className="text-2xl font-bold brand-font mb-1 text-white">{t('animalDetailsPage.verifiedOwnership')}</p>
              <p className="text-emerald-100/60 text-sm leading-relaxed">
                {owner ? t('animalDetailsPage.legalCustody', { name: owner.name }) : t('animalDetailsPage.noOwner')}
              </p>
            </div>
            <button onClick={handleTransferClick} className="w-full bg-emerald-800 hover:bg-emerald-700 text-amber-400 py-4 rounded-2xl font-bold transition-all mt-6 flex items-center justify-center gap-3">
              <MaterialSymbol icon="swap_horiz" />
              {t('animalDetailsPage.transferOwnership')}
            </button>
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-emerald-800/30 rounded-full blur-3xl"></div>
          </div>

          {/* Quick Details Card */}
          <div className="bg-white p-6 rounded-[2rem] flex items-center gap-5 border border-[#c0c9c1]/10 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#cba72f]/20 flex items-center justify-center text-[#735c00]">
              <MaterialSymbol icon="location_on" className="text-3xl" />
            </div>
          <div>
            <p className="text-xs font-bold text-[#404943] uppercase tracking-widest">{t('animals.location')}</p>
            <p className="text-lg font-bold text-[#1a1c19]">{currentPosition ? t('animalDetailsPage.gpsLocated') : t('animalDetailsPage.noData')}</p>
            <p className="text-sm text-[#404943]/70">{locationHistory.length} {t('animalDetailsPage.trackingPoints')}</p>
          </div>
          </div>
        </div>
      </section>

      {/* Live Telemetry Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Temperature */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all border border-[#c0c9c1]/5">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
              <MaterialSymbol icon="device_thermostat" />
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusConfig.bg}`}>
              {statusConfig.label}
            </span>
          </div>
          <p className="text-[#404943] text-sm font-medium mb-1">{t('animalDetailsPage.bodyTemperature')}</p>
          <div className="flex items-baseline gap-1">
            <h4 className="text-3xl font-extrabold text-[#1a1c19] brand-font">{animal.baseline_temperature || '38.5'}</h4>
            <span className="text-[#404943] font-bold">°C</span>
          </div>
          <div className="mt-4 w-full bg-[#eeeee9] h-1 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${status === 'critical' ? 'bg-red-500 w-[90%]' : status === 'warning' ? 'bg-amber-500 w-[75%]' : 'bg-emerald-500 w-[50%]'}`}></div>
          </div>
        </div>

        {/* Speed */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all border border-[#c0c9c1]/5">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <MaterialSymbol icon="speed" />
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Active</span>
          </div>
          <p className="text-[#404943] text-sm font-medium mb-1">{t('animalDetailsPage.currentSpeed')}</p>
          <div className="flex items-baseline gap-1">
            <h4 className="text-3xl font-extrabold text-[#1a1c19] brand-font">{locationHistory.length > 0 ? (locationHistory[locationHistory.length - 1].speed || '0') : '0'}</h4>
            <span className="text-[#404943] font-bold">km/h</span>
          </div>
          <div className="mt-4 w-full bg-[#eeeee9] h-1 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full w-[40%] rounded-full"></div>
          </div>
        </div>

        {/* Activity */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all border border-[#c0c9c1]/5">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <MaterialSymbol icon="directions_run" />
            </div>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-emerald-600">Live</span>
            </span>
          </div>
          <p className="text-[#404943] text-sm font-medium mb-1">Current Activity</p>
          <div className="flex items-baseline gap-1">
            <h4 className="text-3xl font-extrabold text-[#1a1c19] brand-font">{currentPosition ? 'Moving' : 'No Data'}</h4>
          </div>
          <p className="mt-4 text-[11px] text-[#404943]/60 font-medium">{positions.length} points tracked</p>
        </div>

        {/* Battery */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all border border-[#c0c9c1]/5">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <MaterialSymbol icon="battery_5_bar" />
            </div>
            <span className="text-[10px] font-bold text-[#404943] bg-[#eeeee9] px-2 py-1 rounded-full">
              {device?.device_id || 'No Device'}
            </span>
          </div>
          <p className="text-[#404943] text-sm font-medium mb-1">Sensor Battery</p>
          <div className="flex items-baseline gap-1">
            <h4 className="text-3xl font-extrabold text-[#1a1c19] brand-font">{device?.battery_level || '0'}</h4>
            <span className="text-[#404943] font-bold">%</span>
          </div>
          <div className="mt-4 w-full bg-[#eeeee9] h-1 rounded-full overflow-hidden">
            <div className={`h-full rounded-full shadow-[0_0_8px_rgba(212,175,55,0.4)] ${(device?.battery_level || 0) > 50 ? 'bg-emerald-400' : (device?.battery_level || 0) > 20 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${device?.battery_level || 0}%` }}></div>
          </div>
        </div>
      </section>

      {/* Animal Info Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Basic Information */}
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-[#c0c9c1]/5">
          <h3 className="text-xl font-bold text-[#002819] brand-font mb-6">Basic Information</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-[#eeeee9]">
              <span className="text-[#404943]">Animal ID</span>
              <span className="font-bold text-[#1a1c19]">{animal.animal_id}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[#eeeee9]">
              <span className="text-[#404943]">Species</span>
              <span className="font-bold text-[#1a1c19]">{animal.species}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[#eeeee9]">
              <span className="text-[#404943]">Breed</span>
              <span className="font-bold text-[#1a1c19]">{animal.breed || 'Not specified'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[#eeeee9]">
              <span className="text-[#404943]">Gender</span>
              <span className="font-bold text-[#1a1c19]">{animal.gender}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[#eeeee9]">
              <span className="text-[#404943]">Date of Birth</span>
              <span className="font-bold text-[#1a1c19]">{animal.date_of_birth || 'Not specified'}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-[#404943]">Weight</span>
              <span className="font-bold text-[#1a1c19]">{animal.current_weight ? `${animal.current_weight} kg` : 'Not specified'}</span>
            </div>
          </div>
        </div>

        {/* Health Benchmarks */}
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-[#c0c9c1]/5">
          <h3 className="text-xl font-bold text-[#002819] brand-font mb-6">Health Benchmarks</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-[#eeeee9]">
              <span className="text-[#404943]">Baseline Temp</span>
              <span className="font-bold text-[#1a1c19]">{animal.baseline_temperature ? `${animal.baseline_temperature}°C` : '38.5°C'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[#eeeee9]">
              <span className="text-[#404943]">Normal Heart Rate</span>
              <span className="font-bold text-[#1a1c19]">{animal.normal_heart_rate ? `${animal.normal_heart_rate} BPM` : '30-50 BPM'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[#eeeee9]">
              <span className="text-[#404943]">Tracking Device</span>
              <span className="font-bold text-[#1a1c19]">{device?.device_id || 'Not assigned'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[#eeeee9]">
              <span className="text-[#404943]">Device Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                device?.status === 'online' ? 'bg-emerald-100 text-emerald-700' :
                device?.status === 'low_signal' ? 'bg-amber-100 text-amber-700' :
                'bg-stone-100 text-stone-600'
              }`}>
                {device?.status || 'Offline'}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-[#404943]">Color/Markings</span>
              <span className="font-bold text-[#1a1c19]">{animal.color_markings || 'Not specified'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Location & Map */}
      <section className="bg-white rounded-[2.5rem] shadow-sm border border-[#c0c9c1]/5 overflow-hidden mb-8">
        <div className="p-6 flex justify-between items-center border-b border-[#eeeee9]">
          <div>
            <h3 className="text-xl font-bold text-[#002819] brand-font">Live Location & Movement Path</h3>
            <p className="text-sm text-[#404943]/70 font-medium mt-1">Last 48 hours of tracking data</p>
          </div>
          <Link to="/map" className="text-emerald-700 font-bold text-sm hover:text-emerald-900 flex items-center gap-2">
            View Full Map
            <MaterialSymbol icon="open_in_new" size={18} />
          </Link>
        </div>
        <div className="h-[450px] relative z-0">
          {positions.length > 0 ? (
            <MapContainer 
              center={currentPosition || [24.4539, 54.3773]} 
              zoom={14} 
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapUpdater center={currentPosition} zoom={14} />
              
              {positions.length > 1 && (
                <Polyline
                  positions={positions}
                  color={status === 'critical' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#10b981'}
                  weight={4}
                  opacity={0.8}
                />
              )}
              
              {currentPosition && (
                <Marker position={currentPosition} icon={createMarkerIcon(status)}>
                  <Popup>
                    <div className="p-2">
                      <p className="font-bold text-[#002819]">{animal.animal_id}</p>
                      <p className="text-sm text-[#404943]">{animal.species} - {animal.breed || animal.species}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          ) : (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200">
              <div className="text-center">
                <MaterialSymbol icon="location_off" size={64} className="text-emerald-300 mx-auto mb-4" />
                <p className="text-emerald-700 font-bold text-lg">No Tracking Data Available</p>
                <p className="text-emerald-600 text-sm mt-2">This animal has no location history in the last 30 days</p>
                {device?.gps_lat && device?.gps_lng && (
                  <p className="text-emerald-500 text-xs mt-1">Last known: {device.gps_lat}, {device.gps_lng}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Alert History */}
<section className="bg-white rounded-[2.5rem] shadow-sm border border-[#c0c9c1]/5 overflow-hidden">
        <div className="p-10 flex justify-between items-center border-b border-[#eeeee9]">
          <h3 className="text-2xl font-bold text-[#002819] brand-font">Recent Activity</h3>
          <Link to="/alerts" className="text-sm font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-2">
            View All Activity Log
            <MaterialSymbol icon="arrow_forward" />
          </Link>
        </div>
        <div className="divide-y divide-[#eeeee9]/50">
          {activityHistory.length === 0 ? (
            <div className="px-10 py-8 text-center text-[#717973]">
              <MaterialSymbol icon="history" size={32} className="mx-auto mb-2 opacity-50" />
              <p>No recent activity recorded</p>
            </div>
          ) : (
            activityHistory.slice(0, 5).map((alert) => (
              <div key={alert.id} className="px-10 py-6 flex items-center gap-6 hover:bg-[#f4f4ef]/50 transition-colors">
                <div className={`p-3 rounded-xl ${alert.type === 'entry' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  <MaterialSymbol icon={alert.type === 'entry' ? 'login' : 'logout'} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#1a1c19]">
                    {alert.type === 'entry' ? 'Entered Geofence' : 'Exited Geofence'}
                  </p>
                  <p className="text-sm text-[#404943]/80">{alert.geofence?.name || 'Geofence'}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${alert.type === 'entry' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                    {alert.type.toUpperCase()}
                  </span>
                  <p className="text-[10px] text-[#717973] mt-1">
                    {new Date(alert.triggered_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        {activityHistory.length > 0 && (
          <div className="px-10 py-6 bg-[#f4f4ef]/30 border-t border-[#eeeee9] flex justify-center">
            <Link to="/alerts" className="text-emerald-800 font-bold text-sm hover:underline">
              View All Activity Log
            </Link>
          </div>
        )}
      </section>

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#002819]">{t('animalDetailsPage.transferOwnership')}</h3>
              <button onClick={() => setShowTransferModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <MaterialSymbol icon="close" size={20} />
              </button>
            </div>

            {message && (
              <div className={`mb-4 p-3 rounded-xl ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {message.text}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-xs font-bold text-[#404943] uppercase mb-2">
                {t('animalDetailsPage.selectNewOwner')}
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full bg-[#F4F4EF] rounded-xl p-3 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
              >
                <option value="">{t('animalDetailsPage.selectUser')}</option>
                {users.filter(u => u.id !== owner?.id).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex-1 py-3 bg-[#F4F4EF] text-[#002819] rounded-xl font-bold hover:bg-[#E3E3DE] transition"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleTransferOwnership}
                disabled={!selectedUser || transferLoading}
                className="flex-1 py-3 bg-[#002819] text-white rounded-xl font-bold hover:bg-[#06402b] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {transferLoading ? t('common.loading') : t('animalDetailsPage.transfer')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </main>
  );
}

function getStatusConfig(temp) {
  const tempNum = parseFloat(temp) || 38.5;
  if (tempNum > 39.5) return { bg: 'bg-red-50 text-red-700', label: 'Critical' };
  if (tempNum > 39) return { bg: 'bg-amber-50 text-amber-700', label: 'Warning' };
  return { bg: 'bg-emerald-50 text-emerald-700', label: 'Normal' };
}
