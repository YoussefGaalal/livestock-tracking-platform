import { useState, useEffect, useMemo } from 'react';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';

export default function VaccinationSchedulePage() {
  const { t, dir } = useI18n();
  const isRtl = dir === 'rtl';
  const { user } = useAuth();

  const [vaccinations, setVaccinations] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [message, setMessage] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [teamMembers, setTeamMembers] = useState([]);

  const [formData, setFormData] = useState({
    animal_id: '',
    vaccine_name: '',
    vaccination_type: 'routine',
    assigned_to: '',
    reminder_enabled: true,
    reminder_days: 3,
    manufacturer: '',
    batch_number: '',
    dose_number: 1,
    total_doses: 1,
    scheduled_date: '',
    veterinarian: '',
    clinic: '',
    next_due_date: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vaccRes, animalsRes, statsRes, teamRes] = await Promise.all([
        apiFetch('/api/vaccination-schedules?per_page=100'),
        apiFetch('/api/animals?per_page=100'),
        apiFetch('/api/vaccination-schedules/stats'),
        apiFetch('/api/users'),
      ]);

      if (vaccRes.ok) {
        const data = await vaccRes.json();
        setVaccinations(data.data || []);
      }

      if (animalsRes.ok) {
        const data = await animalsRes.json();
        setAnimals(data.data || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (teamRes.ok) {
        const data = await teamRes.json();
        setTeamMembers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    const method = editingRecord ? 'PUT' : 'POST';
    const url = editingRecord ? `/api/vaccination-schedules/${editingRecord.id}` : '/api/vaccination-schedules';

    try {
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: editingRecord ? t('vaccination.updated') : t('vaccination.created') });
        setShowModal(false);
        setEditingRecord(null);
        resetForm();
        fetchData();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || t('vaccination.saveFailed') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('vaccination.networkError') });
    }
  };

  const resetForm = () => {
    setFormData({
      animal_id: '',
      vaccine_name: '',
      vaccination_type: 'routine',
      assigned_to: '',
      reminder_enabled: true,
      reminder_days: 3,
      manufacturer: '',
      batch_number: '',
      dose_number: 1,
      total_doses: 1,
      scheduled_date: '',
      veterinarian: '',
      clinic: '',
      next_due_date: '',
      notes: '',
    });
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setFormData({
      animal_id: record.animal_id,
      vaccine_name: record.vaccine_name,
      vaccination_type: record.vaccination_type || 'routine',
      assigned_to: record.assigned_to || '',
      reminder_enabled: record.reminder_enabled ?? true,
      reminder_days: record.reminder_days || 3,
      manufacturer: record.manufacturer || '',
      batch_number: record.batch_number || '',
      dose_number: record.dose_number,
      total_doses: record.total_doses,
      scheduled_date: record.scheduled_date,
      veterinarian: record.veterinarian || '',
      clinic: record.clinic || '',
      next_due_date: record.next_due_date || '',
      notes: record.notes || '',
    });
    setShowModal(true);
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

  const handleCancel = async (id) => {
    if (!confirm(t('vaccination.confirmCancel'))) return;
    try {
      const res = await apiFetch(`/api/vaccination-schedules/${id}/cancel`, { method: 'POST' });
      if (res.ok) {
        setMessage({ type: 'success', text: t('vaccination.cancelled') });
        fetchData();
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('vaccination.cancelFailed') });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('vaccination.confirmDelete'))) return;
    try {
      const res = await apiFetch(`/api/vaccination-schedules/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: t('vaccination.deleted') });
        fetchData();
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('vaccination.deleteFailed') });
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
    if (vaccination.status === 'overdue') return { bg: 'bg-red-50', border: 'border-red-600', text: 'text-red-800', label: 'Overdue' };
    if (vaccination.status === 'administered') return { bg: 'bg-emerald-50', border: 'border-emerald-600', text: 'text-emerald-800', label: 'Done' };
    if (vaccination.status === 'cancelled') return { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-600', label: 'Cancelled' };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const schedDate = new Date(vaccination.scheduled_date);
    const diffDays = Math.ceil((schedDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { bg: 'bg-red-50', border: 'border-red-600', text: 'text-red-800', label: 'Overdue' };
    if (diffDays <= 3) return { bg: 'bg-blue-50', border: 'border-blue-600', text: 'text-blue-800', label: 'Soon' };
    if (diffDays <= 7) return { bg: 'bg-yellow-50', border: 'border-yellow-600', text: 'text-yellow-800', label: 'Upcoming' };
    return { bg: 'bg-emerald-50', border: 'border-emerald-600', text: 'text-emerald-800', label: 'Scheduled' };
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    if (viewMode === 'day') {
      return [{ date: new Date(year, month, currentDate.getDate()), isCurrentMonth: true }];
    }
    
    if (viewMode === 'week') {
      const dayOfWeek = currentDate.getDay();
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
      
      const days = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        days.push({ date, isCurrentMonth: true });
      }
      return days;
    }
    
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
  }, [currentDate, viewMode]);

  const navigateCalendar = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDateLabel = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } else if (viewMode === 'week') {
      const dayOfWeek = currentDate.getDay();
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getGridClass = () => {
    if (viewMode === 'day') return 'grid-cols-1';
    if (viewMode === 'week') return 'grid-cols-7';
    return 'grid-cols-7';
  };

  const getCellHeight = () => {
    if (viewMode === 'day') return 'min-h-[400px]';
    if (viewMode === 'week') return 'min-h-[200px]';
    return 'min-h-[120px]';
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingVaccinations = vaccinations
    .filter(v => v.status === 'scheduled' && new Date(v.scheduled_date) >= today)
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
    .slice(0, 5);

  const getDaysUntil = (dateStr) => {
    const date = new Date(dateStr);
    const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return t('vaccination.dueNow');
    if (diff === 0) return t('vaccination.today');
    if (diff === 1) return t('vaccination.tomorrow');
    if (diff <= 7) return t('vaccination.inDays').replace('{count}', diff);
    return t('vaccination.nextWeek');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#002819] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex gap-8 overflow-hidden">
      <div className="flex-[2.5] flex flex-col gap-8 min-w-0">
        <div className={`flex justify-between items-end ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={() => navigateCalendar(-1)}
              className="p-2 hover:bg-[#eeeee9] rounded-lg transition-colors"
            >
              <MaterialSymbol icon={isRtl ? 'chevron_right' : 'chevron_left'} size={24} />
            </button>
            <div className={isRtl ? 'text-right' : ''}>
              <h2 className="text-3xl font-extrabold font-['Manrope'] text-[#002819] tracking-tight">{t('vaccination.title')}</h2>
              <p className="text-[#404943] mt-1">{getDateLabel()}</p>
            </div>
            <button
              onClick={() => navigateCalendar(1)}
              className="p-2 hover:bg-[#eeeee9] rounded-lg transition-colors"
            >
              <MaterialSymbol icon={isRtl ? 'chevron_left' : 'chevron_right'} size={24} />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm bg-[#002819] text-white rounded-lg font-medium hover:bg-[#06402b] transition-colors"
            >
              {t('vaccination.today') || 'Today'}
            </button>
          </div>
          <div className={`flex bg-[#eeeee9] p-1 rounded-xl ${isRtl ? 'flex-row-reverse' : ''}`}>
            {[
              { key: 'month', label: t('vaccination.month') },
              { key: 'week', label: t('vaccination.week') },
              { key: 'day', label: t('vaccination.day') },
            ].map(mode => (
              <button
                key={mode.key}
                onClick={() => setViewMode(mode.key)}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  viewMode === mode.key 
                    ? 'bg-white text-[#002819] font-bold shadow-sm' 
                    : 'text-[#404943] hover:bg-[#e8e8e3]'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg shadow-[#002819]/5 overflow-hidden flex-1 min-h-[500px]">
          {viewMode !== 'day' && (
            <div className={`grid ${getGridClass()} bg-[#002819] text-white text-center py-4 border-b border-[#002819]`}>
              {(viewMode === 'week' 
                ? [t('vaccination.sun'), t('vaccination.mon'), t('vaccination.tue'), t('vaccination.wed'), t('vaccination.thu'), t('vaccination.fri'), t('vaccination.sat')]
                : [t('vaccination.sun'), t('vaccination.mon'), t('vaccination.tue'), t('vaccination.wed'), t('vaccination.thu'), t('vaccination.fri'), t('vaccination.sat')]
              ).map((day, idx) => (
                <div key={idx} className="text-xs font-bold uppercase tracking-widest">
                  <div>{day}</div>
                  {viewMode === 'week' && (
                    <div className="text-[10px] font-normal opacity-60 mt-1">
                      {calendarDays[idx]?.date.getDate()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className={`grid ${getGridClass()} flex-1`}>
            {calendarDays.map(({ date, isCurrentMonth }, index) => {
              const isToday = date.getTime() === today.getTime();
              const dayVaccinations = getVaccinationsForDate(date);
              
              return (
                <div
                  key={index}
                  className={`p-4 ${getCellHeight()} border-r border-b border-[#e8e8e3] ${
                    isCurrentMonth ? 'bg-white' : 'bg-[#f4f4ef] text-[#404943]/40'
                  } ${isToday ? 'bg-[#D4AF37]/10' : ''} ${viewMode === 'day' ? 'border-l-0' : ''}`}
                >
                  {viewMode === 'day' && (
                    <div className="text-center mb-4">
                      <div className="text-xs font-bold uppercase tracking-widest text-[#404943]/60">
                        {date.toLocaleDateString('en-US', { weekday: 'long' })}
                      </div>
                      <div className="text-4xl font-black text-[#002819] mt-2">
                        {date.getDate()}
                      </div>
                      <div className="text-sm text-[#404943]/60">
                        {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  )}
                  {viewMode === 'week' && (
                    <span className={`text-sm font-semibold ${
                      isToday 
                        ? 'bg-[#D4AF37] text-white px-2 py-0.5 rounded-full' 
                        : 'text-[#404943]'
                    }`}>
                      {date.getDate()}
                    </span>
                  )}
                  {viewMode === 'month' && (
                    <span className={`text-sm font-semibold ${
                      isToday 
                        ? 'bg-[#D4AF37] text-white px-2 py-0.5 rounded-full' 
                        : 'text-[#404943]'
                    }`}>
                      {date.getDate()}
                    </span>
                  )}
                  <div className="mt-2 space-y-1">
                    {dayVaccinations.slice(0, viewMode === 'day' ? 10 : 2).map(vacc => {
                      const colors = getEventColor(vacc);
                      return (
                        <div
                          key={vacc.id}
                          className={`${colors.bg} ${colors.text} text-[10px] p-1.5 rounded-lg border-l-4 ${colors.border} font-bold truncate cursor-pointer hover:opacity-80 ${viewMode === 'day' ? 'text-xs' : ''}`}
                          onClick={() => openEditModal(vacc)}
                          title={vacc.vaccine_name}
                        >
                          {vacc.vaccine_name}
                        </div>
                      );
                    })}
                    {dayVaccinations.length > 2 && (
                      <div className="text-[10px] text-[#404943] font-medium">
                        +{dayVaccinations.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#eeeee9] rounded-2xl p-8 border border-[#c0c9c1]/10">
          <div className={`flex items-center gap-4 mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className="bg-[#002819] p-3 rounded-xl text-[#D4AF37]">
              <MaterialSymbol icon="settings_suggest" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold font-['Manrope']">{t('vaccination.automatedReminders') || 'Automated Reminders'}</h3>
              <p className="text-sm text-[#404943]">{t('vaccination.reminderDesc') || 'Configure how and when your team receives alerts.'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: 'mail', label: t('vaccination.emailAlerts') || 'Email Alerts', desc: t('vaccination.emailDesc') || 'Send detailed health summaries to vet staff weekly.', enabled: true },
              { icon: 'sms', label: t('vaccination.smsGateway') || 'SMS Gateway', desc: t('vaccination.smsDesc') || 'Instant mobile notification for overdue vaccines.', enabled: false },
              { icon: 'notifications', label: t('vaccination.pushNotifications') || 'Push Notifications', desc: t('vaccination.pushDesc') || 'Real-time app alerts for mobile terminal users.', enabled: true },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-[#c0c9c1]/15 flex flex-col gap-4">
                <div className={`flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span className="font-bold text-sm flex items-center gap-2">
                    <MaterialSymbol icon={item.icon} size={18} />
                    {item.label}
                  </span>
                  <div className={`w-10 h-5 ${item.enabled ? 'bg-[#06402b]' : 'bg-[#e3e3de]'} rounded-full relative cursor-pointer`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.enabled ? (isRtl ? 'left-1' : 'right-1') : (isRtl ? 'right-1' : 'left-1')}`} />
                  </div>
                </div>
                <p className="text-xs text-[#404943]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-8 min-w-[320px]">
        <button
          onClick={() => { resetForm(); setEditingRecord(null); setShowModal(true); }}
          className="w-full py-4 bg-gradient-to-br from-[#002819] to-[#06402b] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#002819]/20 flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
        >
          <MaterialSymbol icon="add_circle" size={22} />
          {t('vaccination.add')}
        </button>

        <div className="bg-[#e3e3de] rounded-2xl p-6 flex-1 flex flex-col">
          <h3 className={`text-lg font-bold font-['Manrope'] mb-6 flex items-center justify-between ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
            {t('vaccination.upcomingReminders')}
            <span className="text-[10px] bg-yellow-500 text-[#002819] px-2 py-0.5 rounded-full">{upcomingVaccinations.length} {t('vaccination.pending')}</span>
          </h3>
          <div className="space-y-4 flex-1">
            {upcomingVaccinations.length === 0 ? (
              <p className="text-sm text-[#404943] text-center py-8">{t('vaccination.noUpcoming')}</p>
            ) : (
              upcomingVaccinations.map(vacc => {
                const colors = getEventColor(vacc);
                const daysUntil = getDaysUntil(vacc.scheduled_date);
                const animal = animals.find(a => a.id === vacc.animal_id);
                
                return (
                  <div key={vacc.id} className={`bg-white p-4 rounded-xl shadow-sm border-r-4 ${colors.border}`}>
                    <div className={`flex justify-between items-start mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <span className={`text-[10px] font-bold uppercase tracking-tighter ${colors.text}`}>{daysUntil}</span>
                      <span className="text-[10px] text-[#404943]">
                        {new Date(vacc.scheduled_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-bold text-sm text-[#002819]">{vacc.vaccine_name}</p>
                    <div className={`flex items-center gap-2 mt-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <div className="w-6 h-6 rounded-md bg-[#002819]/10 flex items-center justify-center">
                        <MaterialSymbol icon="pets" size={14} className="text-[#002819]/60" />
                      </div>
                      <span className="text-[10px] text-[#404943]">{animal?.name || t('nav.animals')}</span>
                    </div>
                    <div className={`flex gap-2 mt-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <button
                        onClick={() => handleAdminister(vacc.id)}
                        className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-semibold hover:bg-emerald-200"
                      >
                        {t('vaccination.done')}
                      </button>
                      <button
                        onClick={() => openEditModal(vacc)}
                        className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold hover:bg-blue-200"
                      >
                        {t('common.edit')}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-[#eeeee9] rounded-xl p-6">
          <h4 className="text-sm font-bold mb-4">{t('vaccination.legend') || 'Calendar Legend'}</h4>
          <div className="space-y-3">
            {[
              { color: 'bg-emerald-500', label: t('vaccination.legendRoutine') || 'Routine Checkup' },
              { color: 'bg-red-500', label: t('vaccination.legendOverdue') || 'Overdue / Critical' },
              { color: 'bg-blue-500', label: t('vaccination.legendScheduled') || 'Scheduled Upcoming' },
              { color: 'bg-yellow-500', label: t('vaccination.legendPremium') || 'Premium Alert' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-xs text-[#404943]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`bg-gradient-to-br from-[#002819] to-[#06402b] rounded-2xl p-6 text-white relative overflow-hidden ${isRtl ? 'text-right' : ''}`}>
          <MaterialSymbol icon="medical_services" size={80} className="absolute -right-4 -bottom-4 text-white/10" />
          <h4 className="text-lg font-bold font-['Manrope'] relative z-10">{t('vaccination.needVet') || 'Need a Vet?'}</h4>
          <p className="text-xs text-emerald-100/70 mt-2 mb-4 relative z-10">{t('vaccination.vetDesc') || 'Connect with regional experts for complex vaccination procedures.'}</p>
          <button className="bg-yellow-500 text-[#002819] font-bold text-xs px-4 py-2 rounded-lg relative z-10">
            {t('vaccination.requestConsult') || 'Request Consult'}
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E3E3DE] flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#002819]">
                {editingRecord ? t('vaccination.editSchedule') : t('vaccination.newSchedule')}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[#F4F4EF] rounded-lg">
                <MaterialSymbol icon="close" size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#002819] mb-1">{t('vaccination.animal')} *</label>
                  <select
                    value={formData.animal_id}
                    onChange={(e) => setFormData({ ...formData, animal_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E3E3DE] bg-white text-[#002819] focus:ring-2 focus:ring-[#002819] focus:border-transparent"
                    required
                    disabled={!!editingRecord}
                  >
                    <option value="">{t('vaccination.selectAnimal')}</option>
                    {animals.map((animal) => (
                      <option key={animal.id} value={animal.id}>
                        {animal.name || animal.animal_id}{animal.tag_number ? ` - ${animal.tag_number}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#002819] mb-1">{t('vaccination.vaccineName')} *</label>
                  <input
                    type="text"
                    value={formData.vaccine_name}
                    onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E3E3DE] bg-white text-[#002819] focus:ring-2 focus:ring-[#002819] focus:border-transparent"
                    placeholder={t('vaccination.vaccinePlaceholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#002819] mb-1">{t('vaccination.vaccinationType') || 'Vaccination Type'}</label>
                  <select
                    value={formData.vaccination_type}
                    onChange={(e) => setFormData({ ...formData, vaccination_type: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E3E3DE] bg-white text-[#002819] focus:ring-2 focus:ring-[#002819] focus:border-transparent"
                  >
                    <option value="routine">{t('vaccination.typeRoutine') || 'Routine'}</option>
                    <option value="booster">{t('vaccination.typeBooster') || 'Booster'}</option>
                    <option value="emergency">{t('vaccination.typeEmergency') || 'Emergency'}</option>
                    <option value="seasonal">{t('vaccination.typeSeasonal') || 'Seasonal'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#002819] mb-1">{t('vaccination.assignTo') || 'Assign to Team Member'}</label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E3E3DE] bg-white text-[#002819] focus:ring-2 focus:ring-[#002819] focus:border-transparent"
                  >
                    <option value="">{t('vaccination.selectTeamMember') || 'Select team member (optional)'}</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                  {formData.assigned_to && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <MaterialSymbol icon="info" size={14} />
                      {t('vaccination.taskWillBeCreated') || 'A task will be created for this team member'}
                    </p>
                  )}
                </div>

                <div className="col-span-2 bg-[#f4f4ef] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-[#002819]">{t('vaccination.enableReminder') || 'Enable Reminder'}</p>
                      <p className="text-xs text-[#404943]">{t('vaccination.reminderDesc') || 'Get notified before the vaccination date'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, reminder_enabled: !formData.reminder_enabled })}
                      className={`w-12 h-6 rounded-full relative transition-colors ${formData.reminder_enabled ? 'bg-[#06402b]' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.reminder_enabled ? (isRtl ? 'left-1' : 'right-1') : (isRtl ? 'right-1' : 'left-1')}`} />
                    </button>
                  </div>
                  {formData.reminder_enabled && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-[#404943]">{t('vaccination.remindMe') || 'Remind me'}</span>
                      <select
                        value={formData.reminder_days}
                        onChange={(e) => setFormData({ ...formData, reminder_days: parseInt(e.target.value) })}
                        className="px-3 py-1 rounded-lg border border-[#E3E3DE] bg-white text-[#002819] text-sm"
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="7">7</option>
                        <option value="14">14</option>
                      </select>
                      <span className="text-sm text-[#404943]">{t('vaccination.daysBefore') || 'day(s) before'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#002819] mb-1">{t('vaccination.manufacturer')}</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E3E3DE] bg-white text-[#002819] focus:ring-2 focus:ring-[#002819] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#002819] mb-1">{t('vaccination.batchNumber')}</label>
                  <input
                    type="text"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E3E3DE] bg-white text-[#002819] focus:ring-2 focus:ring-[#002819] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#002819] mb-1">{t('vaccination.doseNumber')}</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.dose_number}
                    onChange={(e) => setFormData({ ...formData, dose_number: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E3E3DE] bg-white text-[#002819] focus:ring-2 focus:ring-[#002819] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#002819] mb-1">{t('vaccination.totalDoses')}</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.total_doses}
                    onChange={(e) => setFormData({ ...formData, total_doses: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E3E3DE] bg-white text-[#002819] focus:ring-2 focus:ring-[#002819] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#002819] mb-1">{t('vaccination.scheduledDate')} *</label>
                  <input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E3E3DE] bg-white text-[#002819] focus:ring-2 focus:ring-[#002819] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#002819] mb-1">{t('vaccination.nextDueDate')}</label>
                  <input
                    type="date"
                    value={formData.next_due_date}
                    onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E3E3DE] bg-white text-[#002819] focus:ring-2 focus:ring-[#002819] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#002819] mb-1">{t('vaccination.veterinarian')}</label>
                  <input
                    type="text"
                    value={formData.veterinarian}
                    onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E3E3DE] bg-white text-[#002819] focus:ring-2 focus:ring-[#002819] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#002819] mb-1">{t('vaccination.clinic')}</label>
                  <input
                    type="text"
                    value={formData.clinic}
                    onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E3E3DE] bg-white text-[#002819] focus:ring-2 focus:ring-[#002819] focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#002819] mb-1">{t('vaccination.notes')}</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E3E3DE] bg-white text-[#002819] focus:ring-2 focus:ring-[#002819] focus:border-transparent"
                    rows="3"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-[#F4F4EF] text-[#002819] rounded-xl font-semibold hover:bg-[#E3E3DE] transition"
                >
                  {t('vaccination.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#002819] text-white rounded-xl font-semibold hover:bg-[#06402b] transition shadow-lg"
                >
                  {editingRecord ? t('vaccination.update') : t('vaccination.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
