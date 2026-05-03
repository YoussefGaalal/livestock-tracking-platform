import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useI18n } from '../i18n';

export default function DeviceEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [owners, setOwners] = useState([]);
  const [assignedAnimal, setAssignedAnimal] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    update_interval: '15',
    advanced_tracking: true,
    owner_id: '',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [deviceRes, animalsRes, usersRes] = await Promise.all([
        apiFetch(`/api/devices/${id}`),
        apiFetch('/api/animals?per_page=100'),
        apiFetch('/api/users'),
      ]);

      if (deviceRes.ok) {
        const data = await deviceRes.json();
        setDevice(data);
        setFormData({
          name: data.name || '',
          type: data.type || 'collar',
          update_interval: data.update_interval || '15',
          advanced_tracking: data.advanced_tracking ?? true,
          owner_id: data.owner_id || '',
        });
        
        if (data.animal_id) {
          const animal = (await animalsRes.json()).data?.find(a => a.id === data.animal_id);
          setAssignedAnimal(animal);
        }
      }

      if (animalsRes.ok) {
        setAnimals((await animalsRes.json()).data || []);
      }
      
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setOwners((usersData.data || []).filter(u => u.role === 'Owner'));
      }
    } catch (error) {
      console.error('Failed to fetch device:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/devices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          owner_id: formData.owner_id || null,
        }),
      });
      if (res.ok) {
        navigate('/devices');
      }
    } catch (error) {
      console.error('Failed to update device:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#002819] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-extrabold font-['Manrope'] text-[#002819] tracking-tight mb-2">
          Edit Device: <span className="text-[#735c00]">{device?.device_id}</span>
        </h2>
        <p className="text-[#404943]">
          Update hardware parameters and device-to-livestock associations for the primary tracking unit.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-8">
          {/* Device Identification */}
          <section className="bg-[#eeeee9] rounded-3xl p-8 transition-all hover:shadow-md">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-white p-2 rounded-xl text-[#002819]">
                <MaterialSymbol icon="fingerprint" size={20} />
              </span>
              <h3 className="text-xl font-bold font-['Manrope'] text-[#002819]">Device Identification</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#404943]/70 px-1">
                  Serial Number
                </label>
                <input
                  className="w-full bg-[#e3e3de] border-none rounded-xl px-4 py-3 text-[#404943]/50 cursor-not-allowed font-mono text-sm"
                  defaultValue={device?.device_id}
                  disabled
                  type="text"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#404943]/70 px-1">
                  Device Name
                </label>
                <input
                  className="w-full bg-white border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#06402b] shadow-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  type="text"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#404943]/70 px-1">
                  Owner
                </label>
                <select
                  className="w-full bg-white border-none rounded-xl px-4 py-3 appearance-none focus:ring-2 focus:ring-[#06402b] shadow-sm"
                  value={formData.owner_id}
                  onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                >
                  <option value="">Select Owner</option>
                  {owners.map(owner => (
                    <option key={owner.id} value={owner.id}>{owner.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#404943]/70 px-1">
                  Device Type
                </label>
                <select
                  className="w-full bg-white border-none rounded-xl px-4 py-3 appearance-none focus:ring-2 focus:ring-[#06402b] shadow-sm"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="collar">Pro Tracking Collar v4</option>
                  <option value="ear_tag">Compact Ear Tag v2</option>
                  <option value="bolus">Internal Bolus v1</option>
                  <option value="halter">Halter Tracker v3</option>
                </select>
              </div>
            </div>
          </section>

          {/* Hardware Health */}
          <section className="bg-[#eeeee9] rounded-3xl p-8 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="bg-white p-2 rounded-xl text-[#002819]">
                  <MaterialSymbol icon="health_and_safety" size={20} />
                </span>
                <h3 className="text-xl font-bold font-['Manrope'] text-[#002819]">Hardware Health & Status</h3>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-[#cfe5d6] text-[#4f6357] rounded-full uppercase">
                Operational
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl border-l-4 border-emerald-500 shadow-sm">
                <span className="text-xs font-semibold text-[#404943]/60 flex items-center gap-2">
                  <MaterialSymbol icon="battery_very_low" size={16} fill />
                  Battery
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold text-[#002819]">{device?.battery_level ?? 0}%</span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">{device?.battery_level > 50 ? 'Optimal' : device?.battery_level > 20 ? 'Low' : 'Critical'}</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border-l-4 border-emerald-500 shadow-sm">
                <span className="text-xs font-semibold text-[#404943]/60 flex items-center gap-2">
                  <MaterialSymbol icon="signal_cellular_alt" size={16} />
                  Signal
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold text-[#002819]">{device?.signal_strength ? `${device.signal_strength} dBm` : 'N/A'}</span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">{device?.signal_strength > -90 ? 'Stable' : 'Weak'}</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border-l-4 border-emerald-500 shadow-sm">
                <span className="text-xs font-semibold text-[#404943]/60 flex items-center gap-2">
                  <MaterialSymbol icon="update" size={16} />
                  Last Ping
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold text-[#002819]">{device?.last_ping ? new Date(device.last_ping).toLocaleDateString() : 'N/A'}</span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Active</span>
                </div>
              </div>
            </div>
          </section>

          {/* Configuration */}
          <section className="bg-[#eeeee9] rounded-3xl p-8 transition-all hover:shadow-md">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-white p-2 rounded-xl text-[#002819]">
                <MaterialSymbol icon="settings_input_component" size={20} />
              </span>
              <h3 className="text-xl font-bold font-['Manrope'] text-[#002819]">Configuration</h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-white">
                <div>
                  <p className="font-bold text-[#002819]">Advanced Tracking Mode</p>
                  <p className="text-sm text-[#404943]">Enable high-frequency GPS polling for behavioral analysis.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.advanced_tracking}
                    onChange={(e) => setFormData({ ...formData, advanced_tracking: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-[#e3e3de] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-[#002819]" />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#404943]/70 px-1">
                    Update Interval
                  </label>
                  <select
                    className="w-full bg-white border-none rounded-xl px-4 py-3 appearance-none focus:ring-2 focus:ring-[#06402b] shadow-sm"
                    value={formData.update_interval}
                    onChange={(e) => setFormData({ ...formData, update_interval: e.target.value })}
                  >
                    <option>5 Minutes</option>
                    <option>15 Minutes</option>
                    <option>30 Minutes</option>
                    <option>60 Minutes</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#404943]/70 px-1">
                    Firmware Update
                  </label>
                  <button className="w-full flex items-center justify-between bg-[#e3e3de] px-4 py-3 rounded-xl hover:bg-[#dadad5] transition-colors">
                    <span className="text-sm font-semibold text-[#002819]">Version v4.2.1-stable</span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      <MaterialSymbol icon="check_circle" size={14} />
                      LATEST
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 gap-4">
            <button type="button" className="w-full sm:w-auto flex items-center justify-center gap-2 text-[#ba1a1a] font-bold px-6 py-3 rounded-xl hover:bg-[#ffdad6] transition-colors">
              <MaterialSymbol icon="delete" size={20} />
              Delete Device
            </button>
            <div className="flex gap-4 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate('/devices')}
                className="flex-1 sm:flex-none px-10 py-3 rounded-xl font-bold text-[#404943] hover:bg-[#eeeee9] transition-all"
              >
                Cancel
              </button>
              <button type="submit" className="flex-1 sm:flex-none px-10 py-3 rounded-xl font-bold bg-[#002819] text-white shadow-xl shadow-[#002819]/20 hover:scale-[1.02] active:scale-95 transition-all">
                Save Changes
              </button>
            </div>
          </div>
        </form>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-6">
            <div className="bg-[#06402b] text-white rounded-3xl p-8 relative overflow-hidden group shadow-2xl">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#735c00]/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
                    <MaterialSymbol icon="router" size={24} className="text-[#D4AF37]" fill />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold mb-1">Live Status</p>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      <span className="text-xs font-bold text-emerald-400">ACTIVE</span>
                    </div>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white/60 mb-1 uppercase tracking-widest">Management Preview</h3>
                <p className="text-2xl font-black mb-8 leading-tight">{formData.name}</p>

                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <span className="text-xs text-white/60">GPS Position</span>
                    <span className="text-sm font-bold font-mono">24.4539° N, 54.3773° E</span>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <span className="text-xs text-white/60">Storage Used</span>
                    <span className="text-sm font-bold">14.2 MB / 128 MB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60">Data Uptime</span>
                    <span className="text-sm font-bold">182 Days, 4 hrs</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#eeeee9] rounded-3xl p-6 border border-white/50 shadow-inner">
              <div className="flex gap-4">
                <MaterialSymbol icon="info" size={20} className="text-[#002819]/40" />
                <div>
                  <h4 className="text-sm font-bold text-[#002819] mb-1">System Audit Log</h4>
                  <p className="text-xs text-[#404943] leading-relaxed">
                    This device was last configured by <span className="font-bold">Admin Ahmed</span> on Oct 14, 2023.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
