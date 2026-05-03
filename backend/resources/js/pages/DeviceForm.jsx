import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useI18n } from '../i18n';

export default function DeviceForm() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    type: 'collar',
    status: 'inactive',
    battery_level: 100,
    firmware_version: 'v2.4',
    update_interval: 15,
    advanced_tracking: false,
    owner_id: '',
  });
  const [animals, setAnimals] = useState([]);
  const [owners, setOwners] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [animalsRes, usersRes] = await Promise.all([
        apiFetch('/api/animals?per_page=100'),
        apiFetch('/api/users'),
      ]);
      if (animalsRes.ok) {
        const data = await animalsRes.json();
        setAnimals(data.data || []);
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setOwners((data.data || []).filter(u => u.role === 'Owner'));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        status: formData.status,
        battery_level: parseInt(formData.battery_level) || 100,
        firmware_version: formData.firmware_version,
        update_interval: parseInt(formData.update_interval) || 15,
        advanced_tracking: formData.advanced_tracking,
        owner_id: formData.owner_id || null,
      };

      const response = await apiFetch('/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Device registered successfully!' });
        setTimeout(() => navigate('/devices'), 1500);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to register device' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/devices');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-[#eeeee9] rounded-lg transition-colors"
          >
            <MaterialSymbol icon="arrow_back" size={24} className="text-[#404943]" />
          </button>
          <div>
            <h2 className="text-3xl font-extrabold font-['Manrope'] text-[#002819] tracking-tight">
              {t('devices.registerNew') || 'Register New Device'}
            </h2>
            <p className="text-[#404943] mt-1">
              Add a new IoT tracker to your fleet
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl ${
            message.type === 'success'
              ? 'bg-[#cfe5d6] text-[#002819]'
              : 'bg-[#ffdad6] text-[#93000a]'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Device Identification */}
          <div className="bg-[#eeeee9] rounded-3xl p-8 transition-all hover:shadow-md">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-white p-2 rounded-xl text-[#002819]">
                <MaterialSymbol icon="fingerprint" size={20} />
              </span>
              <h3 className="text-xl font-bold font-['Manrope'] text-[#002819]">Device Identification</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#404943]/70 px-1">
                  Device Name *
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Front Gate Tracker"
                  className="w-full bg-white border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#06402b] shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#404943]/70 px-1">
                  Device Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full bg-white border-none rounded-xl px-4 py-3 appearance-none focus:ring-2 focus:ring-[#06402b] shadow-sm"
                >
                  <option value="collar">Pro Tracking Collar v4</option>
                  <option value="ear_tag">Compact Ear Tag v2</option>
                  <option value="bolus">Internal Bolus v1</option>
                  <option value="halter">Halter Tracker v3</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#404943]/70 px-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full bg-white border-none rounded-xl px-4 py-3 appearance-none focus:ring-2 focus:ring-[#06402b] shadow-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
          </div>

          {/* Hardware Configuration */}
          <div className="bg-[#eeeee9] rounded-3xl p-8 transition-all hover:shadow-md">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-white p-2 rounded-xl text-[#002819]">
                <MaterialSymbol icon="settings_suggest" size={20} />
              </span>
              <h3 className="text-xl font-bold font-['Manrope'] text-[#002819]">Hardware Configuration</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#404943]/70 px-1">
                  Battery Level (%)
                </label>
                <input
                  name="battery_level"
                  value={formData.battery_level}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  max="100"
                  className="w-full bg-white border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#06402b] shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#404943]/70 px-1">
                  Firmware Version
                </label>
                <select
                  name="firmware_version"
                  value={formData.firmware_version}
                  onChange={handleChange}
                  className="w-full bg-white border-none rounded-xl px-4 py-3 appearance-none focus:ring-2 focus:ring-[#06402b] shadow-sm"
                >
                  <option value="v4.2.1-stable">v4.2.1-stable (Latest)</option>
                  <option value="v4.1.0">v4.1.0</option>
                  <option value="v2.4">v2.4</option>
                  <option value="v2.3">v2.3</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#404943]/70 px-1">
                  Update Interval (minutes)
                </label>
                <select
                  name="update_interval"
                  value={formData.update_interval}
                  onChange={handleChange}
                  className="w-full bg-white border-none rounded-xl px-4 py-3 appearance-none focus:ring-2 focus:ring-[#06402b] shadow-sm"
                >
                  <option value={5}>5 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#404943]/70 px-1">
                  Advanced Tracking
                </label>
                <div className="flex items-center gap-3 py-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="advanced_tracking"
                      checked={formData.advanced_tracking}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-white peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-[#002819]" />
                  </label>
                  <span className="text-sm text-[#404943]">Enable high-frequency GPS polling</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ownership */}
          <div className="bg-[#eeeee9] rounded-3xl p-8 transition-all hover:shadow-md">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-white p-2 rounded-xl text-[#002819]">
                <MaterialSymbol icon="person" size={20} />
              </span>
              <h3 className="text-xl font-bold font-['Manrope'] text-[#002819]">Ownership</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#404943]/70 px-1">
                  Owner
                </label>
                <select
                  name="owner_id"
                  value={formData.owner_id}
                  onChange={handleChange}
                  className="w-full bg-white border-none rounded-xl px-4 py-3 appearance-none focus:ring-2 focus:ring-[#06402b] shadow-sm"
                >
                  <option value="">Select Owner</option>
                  {owners.map(owner => (
                    <option key={owner.id} value={owner.id}>{owner.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#002819] rounded-3xl p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Quick Tips</h3>
            <ul className="space-y-4 text-sm text-white/80">
              <li className="flex gap-3">
                <MaterialSymbol icon="check_circle" size={20} className="text-[#D4AF37]" />
                Ensure device is powered on before registration
              </li>
              <li className="flex gap-3">
                <MaterialSymbol icon="check_circle" size={20} className="text-[#D4AF37]" />
                Verify gateway signal strength at location
              </li>
              <li className="flex gap-3">
                <MaterialSymbol icon="check_circle" size={20} className="text-[#D4AF37]" />
                Update firmware before first use
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#002819] mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#002819] text-white rounded-xl font-bold text-sm hover:bg-[#06402b] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <MaterialSymbol icon="save" size={18} />
                {isSubmitting ? 'Registering...' : 'Register Device'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="w-full py-3 bg-[#eeeee9] text-[#002819] rounded-xl font-bold text-sm hover:bg-[#e8e8e3] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}