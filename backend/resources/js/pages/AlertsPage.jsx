import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useI18n } from '../i18n';
import Pagination from '../components/Pagination';

export default function AlertsPage() {
  const { t } = useI18n();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [unresolvedCount, setUnresolvedCount] = useState(0);

  useEffect(() => {
    fetchAlerts();
    fetchUnresolvedCount();
  }, [currentPage, perPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, statusFilter]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/geofence-alerts?per_page=${perPage}&page=${currentPage}`);
      if (response.ok) {
        const data = await response.json();
        const alertsArray = data.data || [];
        setAlerts(alertsArray);
        setTotalAlerts(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnresolvedCount = async () => {
    try {
      const response = await apiFetch('/api/geofence-alerts?per_page=1&is_acknowledged=0');
      if (response.ok) {
        const data = await response.json();
        setUnresolvedCount(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unresolved count:', error);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await apiFetch(`/api/geofence-alerts/${alertId}/acknowledge`, { method: 'PATCH' });
      setAlerts(alerts.map(a => 
        a.id === alertId ? { ...a, is_acknowledged: true } : a
      ));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const deleteAlert = async (alertId) => {
    if (!confirm(t('alertsPage.deleteConfirm'))) return;
    try {
      const response = await apiFetch(`/api/geofence-alerts/${alertId}`, { method: 'DELETE' });
      if (response.ok) {
        setAlerts(alerts.filter(a => a.id !== alertId));
      }
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  const deactivateAllAlerts = async () => {
    if (!confirm(t('alertsPage.deactivateAllConfirm'))) return;
    try {
      const response = await apiFetch('/api/geofence-alerts/deactivate-all', { method: 'POST' });
      if (response.ok) {
        setAlerts(alerts.map(a => ({ ...a, is_acknowledged: true })));
      }
    } catch (error) {
      console.error('Failed to deactivate alerts:', error);
    }
  };

  const sendNotification = async (alertId) => {
    try {
      const response = await apiFetch(`/api/geofence-alerts/${alertId}/send-notification`, { method: 'POST' });
      if (response.ok) {
        alert(t('alertsPage.notificationSuccess'));
      } else {
        const data = await response.json();
        alert(data.message || t('alertsPage.notificationFailed'));
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'entry': return 'login';
      case 'exit': return 'logout';
      case 'temperature': return 'thermostat';
      case 'offline': return 'wifi_off';
      default: return 'warning';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'entry': return { bg: 'bg-emerald-50', icon: 'text-emerald-600', dot: 'bg-emerald-500' };
      case 'exit': return { bg: 'bg-red-50', icon: 'text-red-600', dot: 'bg-red-500' };
      case 'temperature': return { bg: 'bg-amber-50', icon: 'text-amber-600', dot: 'bg-amber-500' };
      default: return { bg: 'bg-stone-50', icon: 'text-stone-600', dot: 'bg-stone-500' };
    }
  };

  const getAlertColors = (type, isAcknowledged) => getAlertColor(type);

  const getAlertSeverity = (type) => {
    if (type === 'exit') return { label: t('alerts.critical'), color: 'text-red-600', bg: 'bg-red-50' };
    if (type === 'temperature') return { label: t('alertsPage.warning'), color: 'text-amber-600', bg: 'bg-amber-50' };
    return { label: t('alertsPage.routine'), color: 'text-stone-600', bg: 'bg-stone-50' };
  };

  const getSeverity = (alert) => {
    if (alert.type === 'exit') return { label: t('alerts.critical'), color: 'text-red-600', bg: 'bg-red-50' };
    if (alert.type === 'temperature') return { label: t('alertsPage.warning'), color: 'text-amber-600', bg: 'bg-amber-50' };
    return { label: t('alertsPage.routine'), color: 'text-stone-600', bg: 'bg-stone-50' };
  };

  const filteredAlerts = alerts.filter(alert => {
    if (typeFilter !== 'all') {
      if (typeFilter === 'geofence' && !['entry', 'exit'].includes(alert.type)) return false;
      if (typeFilter !== 'geofence' && alert.type !== typeFilter) return false;
    }
    if (statusFilter === 'unresolved' && alert.is_acknowledged) return false;
    if (statusFilter === 'resolved' && !alert.is_acknowledged) return false;
return true;
  });

  const totalPages = Math.ceil(totalAlerts / perPage);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-[#002819] tracking-tight font-['Manrope']">
            {t('alertsPage.title')}
          </h2>
          <p className="text-[#404943] mt-1 flex items-center gap-2">
            <span className="inline-flex items-center justify-center bg-[#D4AF37]/20 text-[#735c00] px-2 py-0.5 rounded-full text-xs font-bold">
              {totalAlerts} {t('alertsPage.totalAlerts')}
            </span>
            {t('alertsPage.sendNotifications')}
          </p>
        </div>
        <div className="flex gap-3">
          {unresolvedCount > 0 && (
            <button 
              onClick={deactivateAllAlerts}
              className="bg-amber-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-600 transition-colors"
            >
              <MaterialSymbol icon="notifications_off" size={18} />
              {t('alertsPage.deactivateAll', { count: unresolvedCount })}
            </button>
          )}
          {unresolvedCount === 0 && (
            <button 
              className="bg-amber-500/50 text-white/70 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-not-allowed"
              disabled
            >
              <MaterialSymbol icon="notifications_off" size={18} />
              {t('alertsPage.deactivateAll', { count: 0 })}
            </button>
          )}
          <button className="bg-[#002819] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#06402b] transition-colors">
            <MaterialSymbol icon="file_download" size={18} />
            {t('alertsPage.exportReport')}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#002819]/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <MaterialSymbol icon="notifications_active" className="text-blue-600" size={20} />
            </div>
            <span className="font-bold text-[#002819]">{t('alertsPage.notify')}</span>
          </div>
          <p className="text-xs text-[#404943]">{t('alertsPage.notifyDesc')}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#002819]/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <MaterialSymbol icon="check_circle" className="text-green-600" size={20} />
            </div>
            <span className="font-bold text-[#002819]">{t('alertsPage.resolve')}</span>
          </div>
          <p className="text-xs text-[#404943]">{t('alertsPage.resolveDesc')}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#002819]/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <MaterialSymbol icon="notifications_off" className="text-amber-600" size={20} />
            </div>
            <span className="font-bold text-[#002819]">{t('alertsPage.deactivateAllDesc')}</span>
          </div>
          <p className="text-xs text-[#404943]">{t('alertsPage.deactivateAllDescText')}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#002819]/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <MaterialSymbol icon="delete" className="text-red-600" size={20} />
            </div>
            <span className="font-bold text-[#002819]">{t('common.delete')}</span>
          </div>
          <p className="text-xs text-[#404943]">{t('alertsPage.deleteDesc')}</p>
        </div>
      </div>

      {/* Bento Filter Bar */}
      <div className="bg-[#f4f4ef] p-2 rounded-2xl flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm">
          <span className="text-xs font-bold text-stone-400 px-3 uppercase tracking-tighter">{t('alertsPage.alertType')}</span>
          <button 
            onClick={() => setTypeFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${typeFilter === 'all' ? 'bg-[#002819] text-white shadow-md' : 'text-stone-600 hover:bg-stone-100'}`}
          >
            {t('common.all')}
          </button>
          <button 
            onClick={() => setTypeFilter('geofence')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${typeFilter === 'geofence' ? 'bg-[#002819] text-white' : 'text-stone-600 hover:bg-stone-100'}`}
          >
            {t('alertsPage.geofence')}
          </button>
          <button 
            onClick={() => setTypeFilter('temperature')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${typeFilter === 'temperature' ? 'bg-[#002819] text-white' : 'text-stone-600 hover:bg-stone-100'}`}
          >
            {t('alertsPage.temperature')}
          </button>
          <button 
            onClick={() => setTypeFilter('offline')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${typeFilter === 'offline' ? 'bg-[#002819] text-white' : 'text-stone-600 hover:bg-stone-100'}`}
          >
            {t('alertsPage.offline')}
          </button>
        </div>
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm">
          <span className="text-xs font-bold text-stone-400 px-3 uppercase tracking-tighter">{t('common.status')}</span>
          <button 
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${statusFilter === 'all' ? 'bg-[#cfe5d6] text-[#002819]' : 'text-stone-600 hover:bg-stone-100'}`}
          >
            {t('common.all')}
          </button>
          <button 
            onClick={() => setStatusFilter('unresolved')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${statusFilter === 'unresolved' ? 'bg-[#cfe5d6] text-[#002819]' : 'text-stone-600 hover:bg-stone-100'}`}
          >
            {t('alertsPage.unresolved')}
          </button>
          <button 
            onClick={() => setStatusFilter('resolved')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${statusFilter === 'resolved' ? 'bg-[#cfe5d6] text-[#002819]' : 'text-stone-600 hover:bg-stone-100'}`}
          >
            {t('alertsPage.resolved')}
          </button>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button className="p-2 text-stone-400 hover:text-[#002819] transition-colors">
            <MaterialSymbol icon="filter_list" />
          </button>
          <div className="w-[1px] h-6 bg-stone-300"></div>
          <p className="text-xs font-medium text-stone-500">
            {t('alertsPage.sortedNewest')}
          </p>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[#f4f4ef]/50 border-b border-[#eeeee9]">
            <tr>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[#404943]">{t('alertsPage.alertType')}</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[#404943]">{t('alertsPage.animalId')}</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[#404943]">{t('alertsPage.location')}</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[#404943]">{t('alertsPage.timestamp')}</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[#404943]">{t('alertsPage.severity')}</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[#404943]">{t('common.status')}</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[#404943] text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eeeee9]/50">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-[#002819] border-t-transparent rounded-full" />
                  </div>
                </td>
              </tr>
            ) : filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-[#717973]">
                  <MaterialSymbol icon="notifications_off" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>{t('common.noData')}</p>
                </td>
              </tr>
            ) : filteredAlerts.map((alert) => {
              const colors = getAlertColors(alert.type, alert.is_acknowledged);
              const severity = getAlertSeverity(alert.type);
              return (
                <tr key={alert.id} className="group hover:bg-[#f4f4ef]/30 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center ${colors.icon}`}>
                        <MaterialSymbol icon={getAlertIcon(alert.type)} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#002819]">
                          {alert.type === 'entry' ? t('alerts.geofenceEntry') : 
                           alert.type === 'exit' ? t('alerts.geofenceExit') : 
                           alert.type === 'temperature' ? t('alerts.temperature') : 
                           alert.type === 'offline' ? t('alerts.deviceOffline') : 
                           t(`alerts.${alert.type}`)}
                        </p>
                        <p className="text-[10px] text-[#717973]">{alert.geofence?.name || t('alertsPage.unknownZone')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {alert.animal ? (
                      <Link to={`/animals/${alert.animal.id}`} className="font-bold text-sm text-[#002819] hover:underline">
                        {alert.animal.animal_id}
                      </Link>
                    ) : (
                      <span className="text-[#717973]">-</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-mono text-[#404943]">
                      {alert.latitude ? `${parseFloat(alert.latitude).toFixed(4)}, ${parseFloat(alert.longitude).toFixed(4)}` : '-'}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-medium text-[#404943]">
                      {new Date(alert.triggered_at).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-[#717973] font-bold">
                      {new Date(alert.triggered_at).toLocaleTimeString()}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${colors.dot} ${!alert.is_acknowledged && alert.type === 'exit' ? 'animate-pulse' : ''}`}></span>
                      <span className={`text-xs font-bold uppercase ${severity.color}`}>
                        {severity.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                      alert.is_acknowledged 
                        ? 'bg-[#cfe5d6] text-[#002819]' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {alert.is_acknowledged ? t('alertsPage.resolved') : t('alertsPage.unresolved')}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!alert.is_acknowledged && (
                        <>
                          <button 
                            onClick={() => sendNotification(alert.id)}
                            className="bg-blue-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                            title="Send SMS/Call notification"
                          >
                            <MaterialSymbol icon="notifications_active" size={12} />
                            {t('alertsPage.notify')}
                          </button>
                          <button 
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="bg-[#002819] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-[#06402b] transition-colors"
                          >
                            {t('alertsPage.resolve')}
                          </button>
                        </>
                      )}
                      <Link 
                        to="/map"
                        className="border border-[#c0c9c1] text-[#404943] text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-[#eeeee9] transition-colors"
                      >
                        {t('common.view')}
                      </Link>
                      <button 
                        onClick={() => deleteAlert(alert.id)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete alert"
                      >
                        <MaterialSymbol icon="delete" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredAlerts.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            perPage={perPage}
            total={totalAlerts}
            onPageChange={setCurrentPage}
            onPerPageChange={(value) => { setPerPage(value); setCurrentPage(1); }}
          />
        )}
      </div>

      {/* Dashboard Analytics Preview */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 bg-[#06402b] text-white p-6 rounded-3xl relative overflow-hidden group">
          <div className="relative z-10">
            <MaterialSymbol icon="verified" className="text-[#D4AF37] text-4xl mb-4" />
            <h3 className="text-2xl font-black font-['Manrope']">{t('alertsPage.safetyScore')}</h3>
            <p className="text-white/60 text-xs mt-2 font-medium">
              {t('alertsPage.containmentEfficiency')}
            </p>
            <div className="mt-6 flex items-end gap-2">
              <span className="text-4xl font-black">98.4%</span>
              <span className="text-[#D4AF37] font-bold text-xs pb-1">+2.1% ↑</span>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <MaterialSymbol icon="language" className="text-[180px]" />
          </div>
        </div>
        <div className="col-span-2 bg-white border border-[#eeeee9] p-6 rounded-3xl flex gap-8">
          <div className="w-2/3 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black text-[#002819] font-['Manrope']">{t('alertsPage.geofenceHotspots')}</h3>
              <p className="text-[#717973] text-xs mt-1">{t('alertsPage.breachLocations')}</p>
            </div>
            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-[#717973] w-20">NORTH GATE</span>
                <div className="flex-1 h-2 bg-[#eeeee9] rounded-full overflow-hidden">
                  <div className="h-full bg-[#002819] w-[85%] rounded-full"></div>
                </div>
                <span className="text-xs font-black text-[#002819]">85%</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-[#717973] w-20">WATERING HOLE</span>
                <div className="flex-1 h-2 bg-[#eeeee9] rounded-full overflow-hidden">
                  <div className="h-full bg-[#002819] w-[12%] rounded-full"></div>
                </div>
                <span className="text-xs font-black text-[#002819]">12%</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-[#717973] w-20">EAST SECTOR</span>
                <div className="flex-1 h-2 bg-[#eeeee9] rounded-full overflow-hidden">
                  <div className="h-full bg-[#002819] w-[3%] rounded-full"></div>
                </div>
                <span className="text-xs font-black text-[#002819]">3%</span>
              </div>
            </div>
          </div>
          <div className="w-1/3 h-full rounded-2xl overflow-hidden relative border border-[#eeeee9]">
            <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
              <MaterialSymbol icon="map" size={48} className="text-emerald-300" />
            </div>
            <Link to="/map" className="absolute inset-0 bg-[#002819]/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <button className="bg-white/90 backdrop-blur-sm text-[#002819] text-[10px] font-black px-3 py-2 rounded-lg shadow-lg">
                {t('alertsPage.viewMap')}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
