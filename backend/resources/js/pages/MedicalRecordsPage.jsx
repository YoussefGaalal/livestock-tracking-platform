import { useState, useEffect, useMemo } from 'react';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';

export default function MedicalRecordsPage() {
  const { t, dir } = useI18n();
  const isRtl = dir === 'rtl';
  const { user } = useAuth();

  const [records, setRecords] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('records');
  const [activeView, setActiveView] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    animal_id: 'all',
    date_range: '30',
  });
  const [vaccFilters, setVaccFilters] = useState({
    animal_id: 'all',
    status: 'all',
  });

  const [formData, setFormData] = useState({
    animal_id: '',
    record_type: 'checkup',
    title: '',
    description: '',
    record_date: new Date().toISOString().split('T')[0],
    veterinarian: '',
    medication: '',
    dosage: '',
    status: 'completed',
    notes: '',
    next_follow_up: '',
    vaccine_name: '',
    vaccination_type: 'routine',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [filters]);

  const fetchData = async () => {
    try {
      const [recordsRes, animalsRes, statsRes, vaccRes] = await Promise.all([
        apiFetch('/api/medical-records'),
        apiFetch('/api/animals?per_page=100'),
        apiFetch('/api/medical-records/stats'),
        apiFetch('/api/vaccination-schedules?per_page=100'),
      ]);

      if (recordsRes.ok) {
        const data = await recordsRes.json();
        setRecords(data.data || []);
      }

      if (animalsRes.ok) {
        const data = await animalsRes.json();
        setAnimals(data.data || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data || {});
      }

      if (vaccRes.ok) {
        const data = await vaccRes.json();
        setVaccinations(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    try {
      let url = '/api/medical-records?';
      if (filters.type !== 'all') url += `type=${filters.type}&`;
      if (filters.status !== 'all') url += `status=${filters.status}&`;
      if (filters.animal_id !== 'all') url += `animal_id=${filters.animal_id}&`;

      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
    }
  };

  const getVaccinationsForDate = (date) => {
    const dateStr = new Date(date).toISOString().split('T')[0];
    return vaccinations.filter(v => {
      const vaccDateStr = v.scheduled_date ? new Date(v.scheduled_date).toISOString().split('T')[0] : null;
      return vaccDateStr === dateStr;
    });
  };

  const getEventColor = (vaccination) => {
    if (vaccination.status === 'administered') return { bg: 'bg-emerald-50', border: 'border-emerald-600', text: 'text-emerald-800' };
    if (vaccination.status === 'cancelled') return { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-600' };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const schedDate = new Date(vaccination.scheduled_date);
    const diffDays = Math.ceil((schedDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { bg: 'bg-red-50', border: 'border-red-600', text: 'text-red-800' };
    if (diffDays <= 3) return { bg: 'bg-blue-50', border: 'border-blue-600', text: 'text-blue-800' };
    if (diffDays <= 7) return { bg: 'bg-yellow-50', border: 'border-yellow-600', text: 'text-yellow-800' };
    return { bg: 'bg-emerald-50', border: 'border-emerald-600', text: 'text-emerald-800' };
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }
    
    const endPadding = 42 - days.length;
    for (let i = 1; i <= endPadding; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  }, [currentDate]);

  const navigateCalendar = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleAdminister = async (id) => {
    try {
      const res = await apiFetch(`/api/vaccination-schedules/${id}/administer`, { method: 'POST' });
      if (res.ok) {
        setMessage({ type: 'success', text: t('vaccination.administered') });
        fetchData();
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('vaccination.networkError') });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    const isVaccination = activeTab === 'vaccinations';
    let url, payload;

    if (isVaccination) {
      const isEditingVacc = editingRecord && editingRecord.vaccine_name !== undefined;
      url = isEditingVacc ? `/api/vaccination-schedules/${editingRecord.id}` : '/api/vaccination-schedules';
      payload = {
        animal_id: formData.animal_id,
        vaccine_name: formData.vaccine_name || formData.title,
        vaccination_type: formData.vaccination_type || 'routine',
        scheduled_date: formData.record_date,
        veterinarian: formData.veterinarian,
        status: formData.status || 'scheduled',
        notes: formData.notes,
      };
    } else {
      const isEditingRecord = editingRecord && editingRecord.record_type !== undefined;
      url = isEditingRecord ? `/api/medical-records/${editingRecord.id}` : '/api/medical-records';
      payload = formData;
    }

    try {
      const res = await apiFetch(url, {
        method: editingRecord ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: editingRecord ? 'Record updated!' : 'Record created!' });
        setShowModal(false);
        setEditingRecord(null);
        resetForm();
        fetchData();
        fetchRecords();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || 'Failed to save record' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const resetForm = () => {
    setFormData({
      animal_id: '',
      record_type: 'checkup',
      title: '',
      description: '',
      record_date: new Date().toISOString().split('T')[0],
      veterinarian: '',
      medication: '',
      dosage: '',
      status: 'completed',
      notes: '',
      next_follow_up: '',
      vaccine_name: '',
      vaccination_type: 'routine',
    });
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    const isVaccination = record.vaccine_name !== undefined;
    setFormData({
      animal_id: record.animal_id,
      record_type: isVaccination ? 'vaccination' : (record.record_type || 'checkup'),
      title: record.title || record.vaccine_name || '',
      description: record.description || '',
      record_date: record.scheduled_date || record.record_date || new Date().toISOString().split('T')[0],
      veterinarian: record.veterinarian || '',
      medication: record.medication || '',
      dosage: record.dosage || '',
      status: record.status,
      notes: record.notes || '',
      next_follow_up: record.next_follow_up || '',
      vaccine_name: record.vaccine_name || '',
      vaccination_type: record.vaccination_type || 'routine',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      const url = activeTab === 'vaccinations' 
        ? `/api/vaccination-schedules/${id}` 
        : `/api/medical-records/${id}`;
      const res = await apiFetch(url, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Record deleted!' });
        fetchData();
        fetchRecords();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete' });
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'vaccination': return 'vaccines';
      case 'checkup': return 'medical_services';
      case 'surgery': return 'local_hospital';
      case 'treatment': return 'healing';
      case 'emergency': return 'emergency';
      default: return 'medical_services';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'vaccination': return 'bg-emerald-100 text-emerald-700';
      case 'checkup': return 'bg-blue-100 text-blue-700';
      case 'surgery': return 'bg-purple-100 text-purple-700';
      case 'treatment': return 'bg-amber-100 text-amber-700';
      case 'emergency': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'scheduled': return 'bg-amber-100 text-amber-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-700';
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
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <nav className={`flex text-xs text-[#4f6357] mb-2 uppercase tracking-widest font-bold ${isRtl ? 'flex-row-reverse' : ''}`}>
            <span>{t('nav.veterinary')}</span>
            <span className="mx-2">/</span>
            <span className="text-[#002819]">{t('nav.medicalRecords')}</span>
          </nav>
          <h2 className="text-4xl font-bold text-[#002819]">{t('medicalRecords.title')}</h2>
          <p className="text-[#404943] mt-1">{t('medicalRecords.subtitle') || 'Track and manage herd medical history'}</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-[#eeeee9] p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('records')}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                activeTab === 'records' 
                  ? 'bg-white text-[#002819] font-bold shadow-sm' 
                  : 'text-[#404943] hover:bg-[#e8e8e3]'
              }`}
            >
              {t('medicalRecords.title')}
            </button>
            <button
              onClick={() => setActiveTab('vaccinations')}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                activeTab === 'vaccinations' 
                  ? 'bg-white text-[#002819] font-bold shadow-sm' 
                  : 'text-[#404943] hover:bg-[#e8e8e3]'
              }`}
            >
              {t('vaccination.title')}
            </button>
          </div>
          <button
            onClick={() => { resetForm(); setEditingRecord(null); setShowModal(true); }}
            className="px-6 py-3 bg-[#002819] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#06402b] transition shadow-lg"
          >
            <MaterialSymbol icon="add" size={20} />
            {activeTab === 'vaccinations' ? t('vaccination.add') : t('medicalRecords.addRecord')}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      {activeTab === 'records' ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-[#717973] uppercase tracking-wider font-bold">{t('medicalRecords.total') || 'Total Records'}</p>
            <p className="text-2xl font-black text-[#002819]">{stats.total || 0}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <p className="text-xs text-emerald-600 uppercase tracking-wider font-bold">{t('medicalRecords.vaccination')}</p>
            <p className="text-2xl font-black text-emerald-700">{stats.vaccinations || 0}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <p className="text-xs text-blue-600 uppercase tracking-wider font-bold">{t('medicalRecords.checkup')}</p>
            <p className="text-2xl font-black text-blue-700">{stats.checkups || 0}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <p className="text-xs text-amber-600 uppercase tracking-wider font-bold">{t('medicalRecords.scheduled')}</p>
            <p className="text-2xl font-black text-amber-700">{stats.scheduled || 0}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <p className="text-xs text-purple-600 uppercase tracking-wider font-bold">{t('medicalRecords.inProgress')}</p>
            <p className="text-2xl font-black text-purple-700">{stats.in_progress || 0}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-[#717973] uppercase tracking-wider font-bold">{t('vaccination.total')}</p>
              <p className="text-2xl font-black text-[#002819]">{vaccinations.length}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <p className="text-xs text-emerald-600 uppercase tracking-wider font-bold">{t('vaccination.administered')}</p>
              <p className="text-2xl font-black text-emerald-700">{vaccinations.filter(v => v.status === 'administered').length}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <p className="text-xs text-amber-600 uppercase tracking-wider font-bold">{t('vaccination.scheduled')}</p>
              <p className="text-2xl font-black text-amber-700">{vaccinations.filter(v => v.status === 'scheduled').length}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <p className="text-xs text-red-600 uppercase tracking-wider font-bold">{t('vaccination.overdue')}</p>
              <p className="text-2xl font-black text-red-700">{vaccinations.filter(v => v.status === 'overdue' || (v.status === 'scheduled' && new Date(v.scheduled_date) < new Date())).length}</p>
            </div>
          </div>
          {activeView === 'calendar' && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => navigateCalendar(-1)}
                    className="p-2 hover:bg-[#eeeee9] rounded-lg transition-colors"
                  >
                    <MaterialSymbol icon={isRtl ? 'chevron_right' : 'chevron_left'} size={24} />
                  </button>
                  <div className={isRtl ? 'text-right' : ''}>
                    <h3 className="text-lg font-bold text-[#002819]">
                      {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                  </div>
                  <button
                    onClick={() => navigateCalendar(1)}
                    className="p-2 hover:bg-[#eeeee9] rounded-lg transition-colors"
                  >
                    <MaterialSymbol icon={isRtl ? 'chevron_left' : 'chevron_right'} size={24} />
                  </button>
                  <button
                    onClick={goToToday}
                    className="px-4 py-2 text-sm bg-[#002819] text-white rounded-lg font-medium hover:bg-[#06402b] transition-colors ml-2"
                  >
                    {t('vaccination.today')}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveView('calendar')}
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                      activeView === 'calendar' ? 'bg-[#002819] text-white' : 'bg-[#eeeee9] text-[#404943] hover:bg-[#e8e8e3]'
                    }`}
                  >
                    {t('vaccination.month')}
                  </button>
                  <button
                    onClick={() => setActiveView('table')}
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                      activeView === 'table' ? 'bg-[#002819] text-white' : 'bg-[#eeeee9] text-[#404943] hover:bg-[#e8e8e3]'
                    }`}
                  >
                    {t('common.list')}
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
                <div className="grid grid-cols-7 bg-[#002819] text-white text-center py-4">
                  {[t('vaccination.sun'), t('vaccination.mon'), t('vaccination.tue'), t('vaccination.wed'), t('vaccination.thu'), t('vaccination.fri'), t('vaccination.sat')].map((day, idx) => (
                    <div key={idx} className="text-xs font-bold uppercase tracking-widest">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {calendarDays.map(({ date, isCurrentMonth }, index) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    const dayVaccinations = getVaccinationsForDate(date);
                    const bgClass = isCurrentMonth ? 'bg-white' : 'bg-[#f4f4ef]';
                    const todayClass = isToday ? 'bg-[#D4AF37]/10' : '';
                    const spanClass = isToday ? 'bg-[#D4AF37] text-white px-2 py-0.5 rounded-full' : isCurrentMonth ? 'text-[#404943]' : 'text-[#404943]/40';
                    
                    return (
                      <div
                        key={index}
                        className={`p-3 min-h-[100px] border-r border-b border-[#e8e8e3] ${bgClass} ${todayClass}`}
                      >
                        <span className={`text-sm font-semibold ${spanClass}`}>
                          {date.getDate()}
                        </span>
                        <div className="mt-1 space-y-1">
                          {dayVaccinations.slice(0, 2).map(vacc => {
                            const colors = getEventColor(vacc);
                            return (
                              <div
                                key={vacc.id}
                                className={`${colors.bg} ${colors.text} text-[10px] p-1 rounded border-l-2 ${colors.border} font-bold truncate cursor-pointer hover:opacity-80`}
                                onClick={() => openEditModal(vacc)}
                                title={vacc.vaccine_name}
                              >
                                {vacc.vaccine_name}
                              </div>
                            );
                          })}
                          {dayVaccinations.length > 2 && (
                            <div className="text-[10px] text-[#404943] font-medium">+{dayVaccinations.length - 2}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
          {activeView === 'table' && (
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveView('calendar')}
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                    activeView === 'calendar' ? 'bg-[#002819] text-white' : 'bg-[#eeeee9] text-[#404943] hover:bg-[#e8e8e3]'
                  }`}
                >
                  {t('vaccination.month')}
                </button>
                <button
                  onClick={() => setActiveView('table')}
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                    activeView === 'table' ? 'bg-[#002819] text-white' : 'bg-[#eeeee9] text-[#404943] hover:bg-[#e8e8e3]'
                  }`}
                >
                  {t('common.list')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-[#E3E3DE]">
        <div className={`flex flex-wrap items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 px-4 py-2 bg-[#F4F4EF] rounded-lg ${isRtl ? 'flex-row-reverse' : ''}`}>
            <MaterialSymbol icon="calendar_month" size={18} className="text-[#002819]/60" />
            <select
              value={filters.date_range}
              onChange={(e) => setFilters({ ...filters, date_range: e.target.value })}
              className="bg-transparent border-none text-[#002819] font-semibold text-sm focus:ring-0"
            >
              <option value="30">{t('common.last30Days') || 'Last 30 Days'}</option>
              <option value="90">{t('common.last3Months') || 'Last 3 Months'}</option>
              <option value="180">{t('common.last6Months') || 'Last 6 Months'}</option>
              <option value="365">{t('common.thisYear') || 'This Year'}</option>
            </select>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 bg-[#F4F4EF] rounded-lg ${isRtl ? 'flex-row-reverse' : ''}`}>
            <MaterialSymbol icon="medical_information" size={18} className="text-[#002819]/60" />
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="bg-transparent border-none text-[#002819] font-semibold text-sm focus:ring-0"
            >
              <option value="all">{t('common.all')}</option>
              <option value="vaccination">{t('medicalRecords.vaccination')}</option>
              <option value="checkup">{t('medicalRecords.checkup')}</option>
              <option value="surgery">{t('medicalRecords.surgery')}</option>
              <option value="treatment">{t('medicalRecords.treatment')}</option>
              <option value="emergency">{t('medicalRecords.emergency')}</option>
            </select>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 bg-[#F4F4EF] rounded-lg ${isRtl ? 'flex-row-reverse' : ''}`}>
            <MaterialSymbol icon="pets" size={18} className="text-[#002819]/60" />
            <select
              value={filters.animal_id}
              onChange={(e) => setFilters({ ...filters, animal_id: e.target.value })}
              className="bg-transparent border-none text-[#002819] font-semibold text-sm focus:ring-0"
            >
              <option value="all">{t('common.all')}</option>
              {animals.map((animal) => (
                <option key={animal.id} value={animal.id}>
                  {animal.name || animal.animal_id}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setFilters({ type: 'all', status: 'all', animal_id: 'all', date_range: '30' })}
            className={`ml-auto text-[#002819]/60 font-semibold hover:text-[#002819] transition-colors flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            <MaterialSymbol icon="filter_list_off" size={18} />
            {t('common.clearFilters') || 'Clear Filters'}
          </button>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#E3E3DE] flex justify-between items-center">
          <h3 className="text-xl font-bold text-[#002819]">{activeTab === 'records' ? t('medicalRecords.recentRecords') : t('vaccination.schedules')}</h3>
        </div>

        {activeTab === 'records' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F4F4EF]">
                <th className="px-6 py-4 text-[#4f6357] font-bold text-sm">{t('common.date')}</th>
                <th className="px-6 py-4 text-[#4f6357] font-bold text-sm">{t('nav.animals')}</th>
                <th className="px-6 py-4 text-[#4f6357] font-bold text-sm">{t('common.type')}</th>
                <th className="px-6 py-4 text-[#4f6357] font-bold text-sm">{t('medicalRecords.title') || 'Title'}</th>
                <th className="px-6 py-4 text-[#4f6357] font-bold text-sm">{t('medicalRecords.veterinarian')}</th>
                <th className="px-6 py-4 text-[#4f6357] font-bold text-sm">{t('common.status')}</th>
                <th className="px-6 py-4 text-[#4f6357] font-bold text-sm text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E3DE]">
              {records.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-[#717973]">
                    <MaterialSymbol icon="medical_services" size={48} className="mx-auto mb-2 opacity-50" />
                    <p>{t('medicalRecords.noRecords')}</p>
                    <button
                      onClick={() => { resetForm(); setShowModal(true); }}
                      className="mt-4 text-[#002819] font-bold hover:underline"
                    >
                      {t('medicalRecords.addFirst')}
                    </button>
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-[#F4F4EF]/50 transition-colors">
                    <td className="px-6 py-5 font-medium text-[#002819]">
                      {new Date(record.record_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#CFE5D6] flex items-center justify-center text-[#002819] font-black text-xs">
                          {record.animal?.name?.charAt(0) || 'A'}
                        </div>
                        <span className="font-semibold">{record.animal?.name || record.animal?.animal_id || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold capitalize ${getTypeColor(record.record_type)}`}>
                        <MaterialSymbol icon={getTypeIcon(record.record_type)} size={14} />
                        {record.record_type}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-[#404943]">{record.title}</td>
                    <td className="px-6 py-5 text-[#404943]">{record.veterinarian || '-'}</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(record.status)}`}>
                        {record.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(record)}
                          className="p-2 hover:bg-[#E3E3DE] rounded-lg transition-colors"
                        >
                          <MaterialSymbol icon="edit" size={18} className="text-[#002819]" />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <MaterialSymbol icon="delete" size={18} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F4F4EF]">
                <th className="px-6 py-4 text-[#4f6357] font-bold text-sm">{t('common.date')}</th>
                <th className="px-6 py-4 text-[#4f6357] font-bold text-sm">{t('nav.animals')}</th>
                <th className="px-6 py-4 text-[#4f6357] font-bold text-sm">{t('vaccination.vaccine')}</th>
                <th className="px-6 py-4 text-[#4f6357] font-bold text-sm">{t('vaccination.vaccinationType')}</th>
                <th className="px-6 py-4 text-[#4f6357] font-bold text-sm">{t('medicalRecords.veterinarian')}</th>
                <th className="px-6 py-4 text-[#4f6357] font-bold text-sm">{t('common.status')}</th>
                <th className="px-6 py-4 text-[#4f6357] font-bold text-sm text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E3DE]">
              {vaccinations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-[#717973]">
                    <MaterialSymbol icon="vaccines" size={48} className="mx-auto mb-2 opacity-50" />
                    <p>{t('vaccination.noRecords')}</p>
                    <button
                      onClick={() => { resetForm(); setShowModal(true); }}
                      className="mt-4 text-[#002819] font-bold hover:underline"
                    >
                      {t('vaccination.addFirst')}
                    </button>
                  </td>
                </tr>
              ) : (
                vaccinations.map((vacc) => (
                  <tr key={vacc.id} className="hover:bg-[#F4F4EF]/50 transition-colors">
                    <td className="px-6 py-5 font-medium text-[#002819]">
                      {new Date(vacc.scheduled_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#CFE5D6] flex items-center justify-center text-[#002819] font-black text-xs">
                          {vacc.animal?.name?.charAt(0) || vacc.animal?.animal_id?.charAt(0) || 'A'}
                        </div>
                        <span className="font-semibold">{vacc.animal?.name || vacc.animal?.animal_id || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-[#404943]">{vacc.vaccine_name}</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${vacc.vaccination_type === 'routine' ? 'bg-blue-100 text-blue-700' : vacc.vaccination_type === 'emergency' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>
                        {vacc.vaccination_type}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-[#404943]">{vacc.veterinarian || '-'}</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                        vacc.status === 'administered' ? 'bg-emerald-100 text-emerald-700' :
                        vacc.status === 'cancelled' ? 'bg-gray-100 text-gray-600' :
                        new Date(vacc.scheduled_date) < new Date() ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {vacc.status === 'administered' ? t('vaccination.statusAdministered') :
                         vacc.status === 'cancelled' ? t('vaccination.statusCancelled') :
                         new Date(vacc.scheduled_date) < new Date() ? t('vaccination.statusOverdue') :
                         t('vaccination.statusScheduled')}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(vacc)}
                          className="p-2 hover:bg-[#E3E3DE] rounded-lg transition-colors"
                        >
                          <MaterialSymbol icon="edit" size={18} className="text-[#002819]" />
                        </button>
                        <button
                          onClick={() => handleDelete(vacc.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <MaterialSymbol icon="delete" size={18} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#002819]">
                {editingRecord ? t('medicalRecords.editRecord') : t('medicalRecords.addRecord')}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <MaterialSymbol icon="close" size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#404943] uppercase mb-2">{t('nav.animals')} *</label>
                <select
                  value={formData.animal_id}
                  onChange={(e) => setFormData({ ...formData, animal_id: e.target.value })}
                  className="w-full bg-[#F4F4EF] rounded-xl p-3 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                  required
                >
                  <option value="">{t('vaccination.selectAnimal') || 'Select Animal'}</option>
                  {animals.map((animal) => (
                    <option key={animal.id} value={animal.id}>
                      {animal.name || animal.animal_id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {activeTab === 'vaccinations' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[#404943] uppercase mb-2">{t('vaccination.vaccine')} *</label>
                      <input
                        type="text"
                        value={formData.vaccine_name}
                        onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value, title: e.target.value })}
                        className="w-full bg-[#F4F4EF] rounded-xl p-3 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                        placeholder="e.g., FMD Vaccine"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#404943] uppercase mb-2">{t('vaccination.vaccinationType')}</label>
                      <select
                        value={formData.vaccination_type}
                        onChange={(e) => setFormData({ ...formData, vaccination_type: e.target.value })}
                        className="w-full bg-[#F4F4EF] rounded-xl p-3 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                      >
                        <option value="routine">{t('vaccination.routine')}</option>
                        <option value="emergency">{t('vaccination.emergency')}</option>
                        <option value="booster">{t('vaccination.booster')}</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[#404943] uppercase mb-2">{t('medicalRecords.recordType')} *</label>
                      <select
                        value={formData.record_type}
                        onChange={(e) => setFormData({ ...formData, record_type: e.target.value })}
                        className="w-full bg-[#F4F4EF] rounded-xl p-3 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                      >
                        <option value="checkup">{t('medicalRecords.checkup')}</option>
                        <option value="vaccination">{t('medicalRecords.vaccination')}</option>
                        <option value="surgery">{t('medicalRecords.surgery')}</option>
                        <option value="treatment">{t('medicalRecords.treatment')}</option>
                        <option value="emergency">{t('medicalRecords.emergency')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#404943] uppercase mb-2">{t('common.status')}</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full bg-[#F4F4EF] rounded-xl p-3 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                      >
                        <option value="completed">{t('medicalRecords.completed')}</option>
                        <option value="scheduled">{t('medicalRecords.scheduled')}</option>
                        <option value="in_progress">{t('medicalRecords.inProgress')}</option>
                        <option value="cancelled">{t('medicalRecords.cancelled')}</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {activeTab !== 'vaccinations' && (
                <div>
                  <label className="block text-xs font-bold text-[#404943] uppercase mb-2">{t('medicalRecords.title')} *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#F4F4EF] rounded-xl p-3 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                    placeholder={t('medicalRecords.titlePlaceholder') || 'Enter title'}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#404943] uppercase mb-2">{t('common.date')} *</label>
                <input
                  type="date"
                  value={formData.record_date}
                  onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
                  className="w-full bg-[#F4F4EF] rounded-xl p-3 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#404943] uppercase mb-2">{t('medicalRecords.veterinarian')}</label>
                  <input
                    type="text"
                    value={formData.veterinarian}
                    onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                    className="w-full bg-[#F4F4EF] rounded-xl p-3 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                    placeholder="Dr. Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#404943] uppercase mb-2">{t('medicalRecords.medication')}</label>
                  <input
                    type="text"
                    value={formData.medication}
                    onChange={(e) => setFormData({ ...formData, medication: e.target.value })}
                    className="w-full bg-[#F4F4EF] rounded-xl p-3 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                    placeholder="Medication name"
                  />
                </div>
              </div>

              {activeTab !== 'vaccinations' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#404943] uppercase mb-2">{t('common.status')}</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-[#F4F4EF] rounded-xl p-3 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                    >
                      <option value="completed">{t('medicalRecords.completed')}</option>
                      <option value="scheduled">{t('medicalRecords.scheduled')}</option>
                      <option value="in_progress">{t('medicalRecords.inProgress')}</option>
                      <option value="cancelled">{t('medicalRecords.cancelled')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#404943] uppercase mb-2">{t('medicalRecords.dosage')}</label>
                    <input
                      type="text"
                      value={formData.dosage}
                      onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                      className="w-full bg-[#F4F4EF] rounded-xl p-3 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                      placeholder="e.g., 10ml"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#404943] uppercase mb-2">{t('medicalRecords.description')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#F4F4EF] rounded-xl p-3 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20 h-20 resize-none"
                  placeholder="Medical notes..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#404943] uppercase mb-2">{t('medicalRecords.nextFollowUp')}</label>
                <input
                  type="date"
                  value={formData.next_follow_up}
                  onChange={(e) => setFormData({ ...formData, next_follow_up: e.target.value })}
                  className="w-full bg-[#F4F4EF] rounded-xl p-3 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-[#F4F4EF] text-[#002819] rounded-xl font-bold hover:bg-[#E3E3DE] transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#002819] text-white rounded-xl font-bold hover:bg-[#06402b] transition shadow-lg"
                >
                  {editingRecord ? t('medicalRecords.editRecord') : t('medicalRecords.addRecord')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
