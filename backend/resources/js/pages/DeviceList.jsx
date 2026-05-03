import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { exportData } from '../utils/export';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';

const statusConfig = {
  online: { icon: 'wifi', label: 'Online', color: 'text-[#002819]' },
  low_signal: { icon: 'signal_cellular_alt_1_bar', label: 'Low Signal', color: 'text-[#735c00]' },
  offline: { icon: 'wifi_off', label: 'Offline', color: 'text-[#717973]' },
};

export default function DeviceList() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalDevices, setTotalDevices] = useState(0);
  const [stats, setStats] = useState({ online: 0, offline: 0, lowBattery: 0, maintenance: 0 });
  
  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [currentPage, perPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [devicesRes, animalsRes] = await Promise.all([
        apiFetch(`/api/devices?per_page=${perPage}&page=${currentPage}`),
        apiFetch('/api/animals?per_page=100'),
      ]);
      if (devicesRes.ok && animalsRes.ok) {
        const devicesData = await devicesRes.json();
        const animalsData = await animalsRes.json();
        setDevices(devicesData.data || []);
        setTotalDevices(devicesData.total || 0);
        setAnimals(animalsData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [devicesRes, animalsRes] = await Promise.all([
        apiFetch('/api/devices?per_page=1000'),
        apiFetch('/api/animals?per_page=100'),
      ]);
      if (devicesRes.ok && animalsRes.ok) {
        const devicesData = await devicesRes.json();
        const animalsData = await animalsRes.json();
        const allDevices = devicesData.data || [];
        const allAnimals = animalsData.data || [];
        
        const assignedDeviceIds = allAnimals
          .map(a => a.device?.device_id || a.device_id)
          .filter(Boolean);
        
        const uniqueAssigned = new Set(assignedDeviceIds).size;
        
        setStats({
          online: allDevices.filter(d => d.status === 'online' || d.status === 'active').length,
          offline: allDevices.filter(d => d.status === 'offline' || d.status === 'low_signal').length,
          lowBattery: allDevices.filter(d => (d.battery_level || 0) < 20).length,
          maintenance: allDevices.filter(d => d.status === 'maintenance').length,
          assigned: uniqueAssigned,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const getAssignedAnimal = (deviceId) => {
    return animals.find(a => (a.device?.device_id || a.device_id) === deviceId);
  };

  const filteredDevices = devices.filter((device) => {
    return filter === 'all' || device.status === filter;
  });

  const totalPages = Math.ceil(totalDevices / perPage);

  const totalActive = stats.assigned || 0;
  const onlineCount = stats.online;
  const offlineCount = stats.offline;
  const lowBatteryCount = stats.lowBattery;
  const maintenanceCount = stats.maintenance;

  const handleExport = async () => {
    setExporting(true);
    const success = await exportData('/api/export/devices', `devices_${new Date().toISOString().split('T')[0]}.csv`);
    if (success) {
      setMessage({ type: 'success', text: t('common.exported') });
    } else {
      setMessage({ type: 'error', text: t('common.exportFailed') });
    }
    setTimeout(() => setMessage(null), 3000);
    setExporting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#002819] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold font-['Manrope'] text-[#002819] tracking-tight">
            {t('devices.deviceManagement')}
          </h2>
          <p className="text-[#404943] mt-1">
            {t('devicesPage.monitoring')}
          </p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 bg-[#D4AF37] text-white rounded-xl font-bold hover:bg-[#c9a030] transition flex items-center gap-2 disabled:opacity-50"
            >
              <MaterialSymbol icon="download" size={20} />
              {exporting ? t('common.exporting') : t('common.export')}
            </button>
          )}
          <button
            onClick={() => navigate('/devices/new')}
            className="flex items-center gap-2 bg-[#002819] text-white px-6 py-3 rounded-xl font-['Manrope'] font-bold hover:shadow-lg transition-all active:scale-95"
          >
            <MaterialSymbol icon="add_circle" size={20} />
            {t('devicesPage.registerNew')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm">
          <span className="text-[#717973] text-xs font-bold uppercase">{t('devices.title')}</span>
          <p className="text-3xl font-black text-[#002819] mt-1">{totalDevices}</p>
        </div>
        <div className="bg-[#002819] p-5 rounded-2xl">
          <span className="text-white/60 text-xs font-bold uppercase">{t('devicesPage.totalActive')}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-white">{totalActive}</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-[#002819]">
          <span className="text-[#717973] text-xs font-bold uppercase">{t('devicesPage.onlineStatus')}</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-3xl font-black text-[#002819]">{onlineCount}</span>
            <MaterialSymbol icon="wifi" size={18} className="text-[#002819]" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-[#735c00]">
          <span className="text-[#717973] text-xs font-bold uppercase">{t('devicesPage.lowBatteryAlerts')}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-[#735c00]">{lowBatteryCount}</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm">
          <span className="text-[#717973] text-xs font-bold uppercase">{t('devicesPage.maintenanceDue')}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-[#4f6357]">{maintenanceCount}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {['all', 'online', 'offline', 'low_signal'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === status
                ? 'bg-[#002819] text-white'
                : 'bg-white text-[#404943] border border-[#c0c9c1]/20 hover:bg-[#f4f4ef]'
            }`}
          >
            {status === 'all' ? t('devicesPage.allDevices') : status === 'low_signal' ? t('devicesPage.lowBattery') : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Device Table */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#c0c9c1]/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#eeeee9]/50 text-[#404943] text-xs uppercase tracking-widest font-bold">
                <th className="px-8 py-5">{t('devices.deviceId')}</th>
                <th className="px-8 py-5">Name</th>
                <th className="px-8 py-5">{t('users.owner')}</th>
                <th className="px-8 py-5">{t('devicesPage.assignedAnimal')}</th>
                <th className="px-8 py-5">{t('devicesPage.batteryLevel')}</th>
                <th className="px-8 py-5">{t('devicesPage.connection')}</th>
                <th className="px-8 py-5">{t('devicesPage.lastUpdate')}</th>
                <th className="px-8 py-5 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c0c9c1]/10">
              {filteredDevices.map((device) => {
                const status = statusConfig[device.status] || statusConfig.offline;
                const battery = device.battery_level || 0;
                return (
                  <tr key={device.id} className={`hover:bg-[#f4f4ef]/50 transition-colors group ${battery === 0 ? 'bg-[#ffdad6]/5' : ''}`}>
                    <td className="px-8 py-5">
                      <div className="font-['Manrope'] font-bold text-[#002819]">{device.device_id}</div>
                      <div className="text-[10px] text-[#404943]">{device.firmware_version || 'v2.4'} {t('devicesPage.firmware')}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-medium text-[#002819]">{device.name || '-'}</div>
                      <div className="text-[10px] text-[#404943]">{device.type || '-'}</div>
                    </td>
                    <td className="px-8 py-5">
                      {device.owner ? (
                        <div className="font-medium text-[#002819]">{device.owner.name}</div>
                      ) : (
                        <span className="text-[#404943]">-</span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      {(() => {
                        const assignedAnimal = getAssignedAnimal(device.device_id);
                        return assignedAnimal ? (
                          <Link
                            to={`/animals/${assignedAnimal.id}`}
                            className="flex items-center gap-3 hover:bg-[#f4f4ef] rounded-lg p-2 -m-2 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-[#eeeee9] flex items-center justify-center">
                              <MaterialSymbol icon="pets" size={20} className="text-[#002819]" />
                            </div>
                            <div>
                              <div className="font-bold text-sm text-[#002819] hover:text-[#06402b]">{assignedAnimal.animal_id}</div>
                              <div className="text-xs text-[#404943]">{assignedAnimal.species}</div>
                            </div>
                          </Link>
                        ) : (
                          <div>
                            <div className="font-bold text-sm text-[#404943]">{t('devicesPage.unassigned')}</div>
                            <div className="text-xs text-[#404943]/60">{t('devicesPage.noAssociation')}</div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-8 py-5">
                        <div className="w-32">
                          <div className="flex justify-between text-xs font-bold mb-1.5">
                            <span className={
                              battery > 50 ? 'text-[#002819]' :
                              battery > 20 ? 'text-[#735c00]' : 'text-[#ba1a1a]'
                            }>{battery}%</span>
                            <span className="text-[#404943] font-medium">
                              {battery > 50 ? t('devicesPage.optimal') : battery > 0 ? t('devicesPage.critical') : t('devicesPage.depleted')}
                            </span>
                          </div>
                        <div className="h-2 w-full bg-[#e8e8e3] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              battery > 50 ? 'bg-[#002819]' :
                              battery > 20 ? 'bg-[#735c00]' : 'bg-[#404943]'
                            }`}
                            style={{ width: `${battery}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`flex items-center gap-2 font-bold text-sm ${status.color}`}>
                        <MaterialSymbol icon={status.icon} size={20} />
                        {status.label}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-[#404943] font-medium">
                      {device.updated_at ? new Date(device.updated_at).toLocaleString() : t('devicesPage.na')}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/devices/${device.id}/edit`}
                          className="p-2 hover:bg-[#e8e8e3] rounded-lg text-[#404943] transition-all"
                        >
                          <MaterialSymbol icon="edit" size={20} />
                        </Link>
                        <button
                          onClick={async () => {
                            if (!confirm(t('devicesPage.deleteConfirm', { deviceId: device.device_id }))) return;
                            try {
                              const res = await fetch(`/api/devices/${device.id}`, { method: 'DELETE', headers: { Accept: 'application/json' } });
                              if (res.ok) fetchData();
                            } catch (err) { console.error(err); }
                          }}
                          className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-all"
                        >
                          <MaterialSymbol icon="delete" size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredDevices.length === 0 && (
          <div className="p-12 text-center">
            <MaterialSymbol icon="sensors_off" size={48} className="mx-auto text-[#717973] mb-4" />
            <p className="text-[#717973]">{t('devicesPage.noDevices')}</p>
          </div>
        )}

        {/* Pagination */}
        {filteredDevices.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            perPage={perPage}
            total={totalDevices}
            onPageChange={setCurrentPage}
            onPerPageChange={(value) => { setPerPage(value); setCurrentPage(1); }}
          />
        )}
      </div>
    </div>
  );
}
