import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { exportData } from '../utils/export';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import Pagination from '../components/Pagination';

export default function AnimalList() {
  const { user } = useAuth();
  const { t, dir } = useI18n();
  const isRtl = dir === 'rtl';

  const [animals, setAnimals] = useState([]);
  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState(null);
  const [exporting, setExporting] = useState(false);
  
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalAnimals, setTotalAnimals] = useState(0);
  const [stats, setStats] = useState({ assigned: 0, unassigned: 0 });
  
  const canModify = user?.role !== 'Shepherd';
  const isAdmin = user?.role === 'Admin';

  const getDeviceStatus = (deviceId) => {
    if (!deviceId) return 'unknown';
    const device = devices.find(d => d.device_id === deviceId || d.id === deviceId);
    return device?.status || 'unknown';
  };
  const getDeviceForAnimal = (deviceId) => {
    if (!deviceId) return null;
    return devices.find(d => d.device_id === deviceId || d.id === deviceId);
  };
  const getOwnerName = (ownerId) => {
    if (!ownerId) return t('common.noData');
    const owner = users.find(u => u.id === ownerId);
    return owner?.name || t('common.noData');
  };

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [currentPage, perPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [animalsRes, devicesRes, usersRes] = await Promise.all([
        apiFetch(`/api/animals?per_page=${perPage}&page=${currentPage}`),
        apiFetch('/api/devices?per_page=100'),
        apiFetch('/api/users?per_page=100'),
      ]);
      
      let animals = [];
      if (animalsRes.ok) {
        const animalsData = await animalsRes.json();
        animals = animalsData.data || [];
        setTotalAnimals(animalsData.meta?.total || animalsData.total || 0);
      }
      
      let devices = [];
      if (devicesRes.ok) {
        const devicesData = await devicesRes.json();
        devices = devicesData.data || [];
      }
      
      let users = [];
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        users = usersData.data || [];
      }
      
      setAnimals(animals);
      setDevices(devices);
      setUsers(users);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [animalsRes, devicesRes] = await Promise.all([
        apiFetch('/api/animals?per_page=1000'),
        apiFetch('/api/devices?per_page=1000'),
      ]);
      
      if (animalsRes.ok && devicesRes.ok) {
        const animalsData = await animalsRes.json();
        const devicesData = await devicesRes.json();
        const allAnimals = animalsData.data || [];
        
        const assigned = allAnimals.filter(a => a.device?.device_id || a.device_id).length;
        
        setStats({
          assigned,
          unassigned: allAnimals.length - assigned,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const getAnimalStatus = (animal) => {
    const temp = parseFloat(animal.baseline_temperature) || 38.5;
    if (temp > 39.5) return 'critical';
    if (temp > 39) return 'warning';
    return 'healthy';
  };

  const totalPages = Math.ceil(totalAnimals / perPage);

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years > 0) {
      return `${years}y`;
    } else if (months > 0) {
      return `${months}m`;
    }
    return null;
  };

  const filteredAnimals = animals.filter((animal) => {
    const search = searchQuery.toLowerCase();
    const matchesSearch =
      animal.animal_id?.toLowerCase().includes(search) ||
      animal.breed?.toLowerCase().includes(search) ||
      animal.species?.toLowerCase().includes(search);
    
    const animalStatus = getAnimalStatus(animal);
    const animalDeviceId = animal.device?.device_id || animal.device_id;
    const animalOwnerId = animal.owner?.id || animal.owner_id;
    const animalDeviceStatus = animalDeviceId ? getDeviceStatus(animalDeviceId) : null;
    const isDeviceOffline = animalDeviceStatus === 'offline' || animalDeviceStatus === 'low_signal';
    
    const matchesSpecies = speciesFilter === 'all' || animal.species === speciesFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'healthy' && animalStatus === 'healthy') ||
      (statusFilter === 'warning' && animalStatus === 'warning') ||
      (statusFilter === 'critical' && animalStatus === 'critical') ||
      (statusFilter === 'device_issue' && isDeviceOffline);
    const matchesDevice = deviceFilter === 'all' ||
      (deviceFilter === 'assigned' && animalDeviceId) ||
      (deviceFilter === 'unassigned' && !animalDeviceId) ||
      (deviceFilter === 'offline' && isDeviceOffline);
    
    const matchesOwner = ownerFilter === 'all' || String(animalOwnerId) === String(ownerFilter);
    
    return matchesSearch && matchesSpecies && matchesStatus && matchesDevice && matchesOwner;
  });

  const speciesOptions = [...new Set(animals.map(a => a.species).filter(Boolean))];
  const ownerOptions = users.filter(u => u.role === 'Owner');
  const assignedCount = stats.assigned;
  const unassignedCount = stats.unassigned;

  const assignedDeviceIds = animals
    .map(a => a.device?.device_id || a.device_id)
    .filter(Boolean);
  const availableDevices = devices.filter(d => !assignedDeviceIds.includes(d.device_id));

  const handleAssignDevice = async () => {
    if (!selectedDevice) return;
    setAssigning(true);
    try {
      const response = await apiFetch(`/api/animals/${selectedAnimal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: selectedDevice }),
      });
      if (response.ok) {
        setMessage({ type: 'success', text: t('common.success') });
        fetchData();
        setTimeout(() => { setShowAssignModal(false); setMessage(null); }, 1500);
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('common.error') });
    } finally {
      setAssigning(false);
    }
  };

  const openAssignModal = (animal) => {
    setSelectedAnimal(animal);
    setSelectedDevice('');
    setShowAssignModal(true);
  };

  const handleExport = async () => {
    setExporting(true);
    const success = await exportData('/api/export/animals', `animals_${new Date().toISOString().split('T')[0]}.csv`);
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
      <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 ${isRtl ? 'text-right' : ''}`}>
        <div>
          <h2 className="text-4xl font-black text-[#002819]">
            {t('animals.animalManagement')}
          </h2>
          <p className="text-[#404943] mt-2 font-medium">
            {totalAnimals} {t('common.animals')}
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
          <Link
            to="/animals/new"
            className="btn-primary flex items-center gap-2"
          >
            <MaterialSymbol icon="add" size={20} />
            {t('animals.addAnimal')}
          </Link>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-[#cfe5d6] text-[#002819]' : 'bg-[#ffdad6] text-[#93000a]'}`}>
          {message.text}
        </div>
      )}

      <div className={`flex flex-wrap gap-4 items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div className="flex-1 min-w-[240px] relative">
          <MaterialSymbol icon="search" size={20} className={`absolute top-1/2 -translate-y-1/2 text-[#717973] ${isRtl ? 'right-4 left-auto' : 'left-4'}`} />
          <input 
            type="text" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder={t('animals.searchAnimals')}
            className={`w-full bg-white rounded-xl py-3 text-sm shadow-sm focus:ring-2 focus:ring-[#06402b]/10 ${isRtl ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'}`} 
          />
        </div>

        <select
          value={speciesFilter}
          onChange={(e) => setSpeciesFilter(e.target.value)}
          className="bg-white rounded-xl px-4 py-3 text-sm shadow-sm focus:ring-2 focus:ring-[#06402b]/10 cursor-pointer"
        >
          <option value="all">{t('animals.allSpecies')}</option>
          {speciesOptions.map(species => (
            <option key={species} value={species}>{species}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white rounded-xl px-4 py-3 text-sm shadow-sm focus:ring-2 focus:ring-[#06402b]/10 cursor-pointer"
        >
          <option value="all">{t('animals.allStatuses')}</option>
          <option value="healthy">{t('animals.healthy')}</option>
          <option value="warning">{t('alertsPage.warning')}</option>
          <option value="critical">{t('dashboard.critical')}</option>
        </select>

        <select
          value={deviceFilter}
          onChange={(e) => setDeviceFilter(e.target.value)}
          className="bg-white rounded-xl px-4 py-3 text-sm shadow-sm focus:ring-2 focus:ring-[#06402b]/10 cursor-pointer"
        >
          <option value="all">{t('animals.allDevices')}</option>
          <option value="assigned">{t('devices.assigned')}</option>
          <option value="unassigned">{t('animals.noDeviceAssigned')}</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-[#717973] uppercase">{t('animals.title')}</p>
          <p className="text-3xl font-black text-[#002819] mt-1">{totalAnimals}</p>
        </div>
        <div className="bg-[#002819] p-5 rounded-2xl">
          <p className="text-xs font-bold text-white/60 uppercase">{t('devices.assigned')}</p>
          <p className="text-3xl font-black text-white mt-1">{assignedCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-[#717973] uppercase">{t('animals.noDeviceAssigned')}</p>
          <p className="text-3xl font-black text-[#BA1A1A] mt-1">{unassignedCount}</p>
        </div>
        <div className="bg-[#D4AF37]/10 p-5 rounded-2xl">
          <p className="text-xs font-bold text-[#735C00] uppercase">{t('animals.health')}</p>
          <p className="text-3xl font-black text-[#735C00] mt-1">{assignedCount}</p>
        </div>
      </div>

      {filteredAnimals.length === 0 ? (
        <div className="card p-12 text-center">
          <MaterialSymbol icon="pets" size={64} className="text-[#717973] mx-auto mb-4 opacity-50" />
          <p className="text-[#404943] font-medium text-lg">{t('animals.noAnimals')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnimals.map((animal) => {
            const animalDeviceId = animal.device?.device_id || animal.device_id;
            const device = getDeviceForAnimal(animalDeviceId);
            const animalStatus = getAnimalStatus(animal);
            
return (
                <div key={animal.id} className="card overflow-hidden group">
                  <div className="p-6">
                    <div className={`flex items-start justify-between mb-4 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden ${
                          animalStatus === 'critical' ? 'bg-[#BA1A1A]/10' :
                          animalStatus === 'warning' ? 'bg-[#D4AF37]/10' :
                          'bg-[#002819]/5'
                        }`}>
                          {animal.identification_photo ? (
                            <img src={animal.identification_photo} alt={animal.animal_id} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">
                              {animal.species === 'Camel' ? '🐪' : animal.species === 'Goat' ? '🐐' : animal.species === 'Sheep' ? '🐑' : animal.species === 'Cow' ? '🐄' : animal.species === 'Dog' ? '🐕' : '🐪'}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#002819]">{animal.animal_id}</h3>
                          {animal.name && <p className="text-sm text-[#717973]">{animal.name}</p>}
                          <p className="text-sm text-[#717973]">{animal.species}{animal.breed && ` ${t('common.separator')} ${animal.breed}`}</p>
                        </div>
                      </div>
                    <div className={`w-3 h-3 rounded-full ${
                      animalStatus === 'critical' ? 'bg-[#BA1A1A] animate-pulse' :
                      animalStatus === 'warning' ? 'bg-[#D4AF37]' :
                      'bg-[#10B981]'
                    }`} />
                  </div>

                  <div className={`grid grid-cols-2 gap-3 text-sm ${isRtl ? 'text-right' : ''}`}>
                    <div className="bg-[#F4F4EF] rounded-xl p-3">
                      <p className="text-xs text-[#717973]">{t('animals.gender')}</p>
                      <p className="font-semibold text-[#002819] capitalize">{animal.gender || '-'}</p>
                    </div>
                    <div className="bg-[#F4F4EF] rounded-xl p-3">
                      <p className="text-xs text-[#717973]">{t('animals.age')}</p>
                      <p className="font-semibold text-[#002819]">{calculateAge(animal.date_of_birth) || '-'}</p>
                    </div>
                    <div className="bg-[#F4F4EF] rounded-xl p-3">
                      <p className="text-xs text-[#717973]">{t('animals.weight')}</p>
                      <p className="font-semibold text-[#002819]">{animal.current_weight ? `${animal.current_weight} ${t('common.kg')}` : '-'}</p>
                    </div>
                    <div className="bg-[#F4F4EF] rounded-xl p-3">
                      <p className="text-xs text-[#717973]">{t('animals.device')}</p>
                      <p className="font-semibold text-[#002819] text-xs">
                        {animal.device?.device_id ? animal.device.device_id : 
                         animalDeviceId && !/^\d+$/.test(animalDeviceId) ? animalDeviceId : '-'}
                      </p>
                    </div>
                  </div>

                  {device && (
                    <div className={`flex items-center gap-2 mt-4 p-3 rounded-xl ${device.status === 'offline' ? 'bg-[#BA1A1A]/5' : 'bg-[#10B981]/5'} ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <MaterialSymbol 
                        icon={device.status === 'offline' ? 'wifi_off' : 'wifi'} 
                        size={16} 
                        className={device.status === 'offline' ? 'text-[#BA1A1A]' : 'text-[#10B981]'} 
                      />
                      <span className={`text-xs font-medium ${device.status === 'offline' ? 'text-[#BA1A1A]' : 'text-[#10B981]'}`}>
                        {device.status === 'offline' ? t('devices.offline') : t('devices.online')}
                      </span>
                      {device.battery_level !== undefined && (
                        <span className="text-xs text-[#717973]">{device.battery_level}%</span>
                      )}
                      {device.last_ping && (
                        <span className={`text-xs text-[#717973] ml-auto ${device.status === 'offline' ? '' : ''}`}>
                          Last: {new Date(device.last_ping).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className={`flex border-t border-[#F4F4EF] ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <Link 
                    to={`/animals/${animal.id}`}
                    className="flex-1 py-3 text-center text-sm font-semibold text-[#002819] hover:bg-[#F4F4EF] transition-colors"
                  >
                    {t('common.view')}
                  </Link>
                      {canModify && (
                        <>
                          <Link 
                            to={`/animals/${animal.id}/edit`}
                            className="flex-1 py-3 text-center text-sm font-semibold text-[#717473] hover:bg-[#F4F4EF] hover:text-[#002819] transition-colors border-x border-[#F4F4EF]"
                          >
                            {t('common.edit')}
                          </Link>
                          {!animalDeviceId && (
                            <button 
                              onClick={() => openAssignModal(animal)}
                              className="flex-1 py-3 text-center text-sm font-semibold text-[#717473] hover:bg-[#F4F4EF] hover:text-[#002819] transition-colors"
                            >
                              {t('animals.assignDevice')}
                            </button>
                          )}
                        </>
                      )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredAnimals.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          perPage={perPage}
          total={totalAnimals}
          onPageChange={setCurrentPage}
          onPerPageChange={(value) => { setPerPage(value); setCurrentPage(1); }}
        />
      )}

      {showAssignModal && selectedAnimal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className={`flex items-center justify-between mb-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div>
                <h3 className="text-2xl font-bold text-[#002819]">{t('animals.assignDevice')}</h3>
                <p className="text-sm text-[#717973] mt-1">{selectedAnimal.animal_id}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-3 hover:bg-[#F4F4EF] rounded-xl transition">
                <MaterialSymbol icon="close" size={24} className="text-[#717973]" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>
                  {t('devices.title')} *
                </label>
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="input-field"
                >
                  <option value="">{t('common.selectDevice')}</option>
                  {availableDevices.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.device_id} {t('common.separator')} {d.status}{d.battery ? ` (${d.battery}${t('common.percent')})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className={`flex gap-4 pt-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-3 bg-[#F4F4EF] text-[#002819] rounded-xl font-bold text-sm hover:bg-[#E3E3DE] transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleAssignDevice}
                  disabled={!selectedDevice || assigning}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {assigning ? t('common.loading') : t('common.confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
