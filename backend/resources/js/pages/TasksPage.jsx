import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';

export default function TasksPage() {
  const { user } = useAuth();
  const { t, dir } = useI18n();
  const isRtl = dir === 'rtl';

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedTask, setExpandedTask] = useState(null);
  const [taskLogs, setTaskLogs] = useState({});
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [shepherds, setShepherds] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [stats, setStats] = useState({});
  const [predefinedTasks, setPredefinedTasks] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    animal_id: '',
    priority: 'medium',
    task_type: 'other',
    due_date: '',
  });
  const [recurring, setRecurring] = useState({
    enabled: false,
    pattern: 'weekly',
    interval: 1,
    end_date: '',
  });
  const [logForm, setLogForm] = useState({
    log_type: 'checkpoint',
    description: '',
    photo: null,
    voice_note: null,
  });
  const [saving, setSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingInterval, setRecordingInterval] = useState(null);
  const [message, setMessage] = useState(null);
  
  const isShepherd = user?.role === 'Shepherd';
  const canModify = !isShepherd;

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [statusFilter]);

  const fetchTasks = async () => {
    try {
      let url = '/api/tasks?';
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      if (priorityFilter !== 'all') url += `priority=${priorityFilter}`;

      const response = await apiFetch(url);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiFetch('/api/tasks/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchTaskLogs = async (taskId) => {
    if (taskLogs[taskId]) return;
    try {
      const response = await apiFetch(`/api/tasks/${taskId}/logs`);
      if (response.ok) {
        const data = await response.json();
        setTaskLogs(prev => ({ ...prev, [taskId]: data.data || [] }));
      }
    } catch (error) {
      console.error('Failed to fetch task logs:', error);
    }
  };

  const fetchShepherds = async () => {
    try {
      const response = await apiFetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setShepherds((data.data || []).filter(u => u.role === 'Shepherd'));
      }
    } catch (error) {
      console.error('Failed to fetch shepherds:', error);
    }
  };

  const fetchAnimals = async () => {
    try {
      const response = await apiFetch('/api/animals?per_page=100');
      if (response.ok) {
        const data = await response.json();
        setAnimals(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch animals:', error);
    }
  };

  const fetchPredefinedTasks = async () => {
    try {
      const response = await apiFetch('/api/predefined-tasks');
      if (response.ok) {
        const data = await response.json();
        setPredefinedTasks(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch predefined tasks:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = { ...formData };
    if (recurring.enabled) {
      payload.is_recurring = true;
      payload.recurrence_pattern = recurring.pattern;
      payload.recurrence_interval = recurring.interval;
      payload.recurrence_end_date = recurring.end_date || null;
    }

    try {
      const response = await apiFetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Task created successfully!' });
        setShowCreateModal(false);
        setFormData({
          title: '',
          description: '',
          assigned_to: '',
          animal_id: '',
          priority: 'medium',
          task_type: 'other',
          due_date: '',
        });
        setRecurring({ enabled: false, pattern: 'weekly', interval: 1, end_date: '' });
        fetchTasks();
        fetchStats();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to create task' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitLog = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const formDataObj = new FormData();
    formDataObj.append('task_id', selectedTask.id);
    formDataObj.append('log_type', logForm.log_type);
    formDataObj.append('description', logForm.description);
    if (logForm.photo) {
      formDataObj.append('photo', logForm.photo);
    }
    if (audioBlob) {
      formDataObj.append('voice_note', audioBlob, 'voice_note.webm');
    }

    try {
      const response = await apiFetch('/api/task-logs', {
        method: 'POST',
        body: formDataObj,
      });

      if (response.ok) {
        setMessage({ type: 'success', text: t('tasks.logSubmitted') });
        setShowLogModal(false);
        setLogForm({ log_type: 'checkpoint', description: '', photo: null, voice_note: null });
        setAudioBlob(null);
        setAudioUrl(null);
        stopRecording();
        fetchTaskLogs(selectedTask.id);
        fetchTasks();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to submit log' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingInterval(interval);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setMessage({ type: 'error', text: 'Microphone access denied' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
    setIsRecording(false);
    setRecordingTime(0);
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const response = await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTasks();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      fetchTasks();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const openCreateModal = () => {
    fetchShepherds();
    fetchAnimals();
    fetchPredefinedTasks();
    setShowCreateModal(true);
  };

  const handlePredefinedSelect = (e) => {
    const predefinedId = e.target.value;
    if (!predefinedId) return;
    
    const predefined = predefinedTasks.find(t => t.id === parseInt(predefinedId));
    if (predefined) {
      setFormData({
        ...formData,
        title: predefined.title,
        description: predefined.description || '',
        priority: predefined.priority || 'medium',
        task_type: predefined.task_type || 'other',
      });
      if (predefined.is_recurring) {
        setRecurring({
          enabled: true,
          pattern: predefined.recurrence_pattern || 'weekly',
          interval: predefined.recurrence_interval || 1,
          end_date: '',
        });
      }
    }
  };

  const openLogModal = (task) => {
    setSelectedTask(task);
    setShowLogModal(true);
  };

  const toggleTaskExpansion = (taskId) => {
    if (expandedTask === taskId) {
      setExpandedTask(null);
    } else {
      setExpandedTask(taskId);
      fetchTaskLogs(taskId);
    }
  };

  const priorityColors = {
    low: 'bg-[#F4F4EF] text-[#404943]',
    medium: 'bg-[#D4AF37]/15 text-[#735C00]',
    high: 'bg-[#F59E0B]/15 text-[#735C00]',
    urgent: 'bg-[#BA1A1A]/10 text-[#BA1A1A]',
  };

  const statusColors = {
    pending: 'bg-[#F59E0B]/15 text-[#735C00]',
    in_progress: 'bg-[#3B82F6]/15 text-[#2563EB]',
    completed: 'bg-[#10B981]/15 text-[#059669]',
    cancelled: 'bg-[#F4F4EF] text-[#717973]',
  };

  const taskTypeIcons = {
    inspection: 'search',
    medical: 'medical_services',
    feeding: 'restaurant',
    movement: 'directions_walk',
    other: 'assignment',
  };

  const logTypeIcons = {
    checkpoint: 'location_on',
    photo: 'photo_camera',
    note: 'note',
    location_update: 'my_location',
    status_change: 'swap_horiz',
  };

  const isOverdue = (task) => {
    return task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
  };

  const canSubmitLog = (task) => {
    return isShepherd && task.assigned_to === user?.id && task.status !== 'completed' && task.status !== 'cancelled';
  };

  return (
    <div className="space-y-8">
      <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 ${isRtl ? 'text-right' : ''}`}>
        <div>
          <h2 className="text-4xl font-black text-[#002819]">{t('tasks.taskManagement')}</h2>
          <p className="text-[#404943] mt-2 font-medium">Assign and track shepherd activities</p>
        </div>
        <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <Link 
            to="/task-logs-archive"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F4F4EF] text-[#002819] font-semibold hover:bg-[#E3E3DE] transition-colors"
          >
            <MaterialSymbol icon="history" size={18} />
            {t('nav.taskLogs')}
          </Link>
          {canModify && (
            <button
              onClick={openCreateModal}
              className="btn-primary flex items-center gap-2"
            >
              <MaterialSymbol icon="add" size={18} />
              {t('tasks.createTask')}
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-[#10B981]/15 text-[#059669]' : 'bg-[#BA1A1A]/10 text-[#BA1A1A]'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: t('common.all'), value: stats.total, color: 'bg-white' },
          { label: t('tasks.pending'), value: stats.pending, color: 'bg-[#F59E0B]/5' },
          { label: t('tasks.inProgress'), value: stats.in_progress, color: 'bg-[#3B82F6]/5' },
          { label: t('tasks.completed'), value: stats.completed, color: 'bg-[#10B981]/5' },
          { label: t('tasks.overdue'), value: stats.overdue, color: stats.overdue > 0 ? 'bg-[#BA1A1A]/5' : 'bg-white' },
        ].map((stat, idx) => (
          <div key={idx} className={`${stat.color} p-5 rounded-2xl shadow-sm`}>
            <p className="text-xs font-bold text-[#717973] uppercase tracking-wider">{stat.label}</p>
            <p className="text-3xl font-black text-[#002819] mt-2">{stat.value || 0}</p>
          </div>
        ))}
      </div>

      <div className={`flex flex-wrap gap-3 items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl ${isRtl ? 'flex-row-reverse' : ''}`}>
          <MaterialSymbol icon="filter_list" size={20} className="text-[#717973]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none text-sm font-medium text-[#404943] focus:outline-none cursor-pointer"
          >
            <option value="all">{t('common.all')} Status</option>
            <option value="pending">{t('tasks.pending')}</option>
            <option value="in_progress">{t('tasks.inProgress')}</option>
            <option value="completed">{t('tasks.completed')}</option>
            <option value="cancelled">{t('tasks.cancelled')}</option>
          </select>
        </div>
        <div className={`flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl ${isRtl ? 'flex-row-reverse' : ''}`}>
          <MaterialSymbol icon="flag" size={20} className="text-[#717973]" />
          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); fetchTasks(); }}
            className="bg-transparent border-none text-sm font-medium text-[#404943] focus:outline-none cursor-pointer"
          >
            <option value="all">{t('common.all')} Priority</option>
            <option value="low">{t('tasks.low')}</option>
            <option value="medium">{t('tasks.medium')}</option>
            <option value="high">{t('tasks.high')}</option>
            <option value="urgent">{t('tasks.urgent')}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-[#002819] border-t-transparent rounded-full" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="card p-12 text-center">
          <MaterialSymbol icon="task_alt" size={64} className="text-[#717973] mx-auto mb-4 opacity-50" />
          <p className="text-[#404943] font-medium text-lg">{t('common.noData')}</p>
          <p className="text-[#717973] text-sm mt-1">Create a task to assign work to shepherds</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className={`card overflow-hidden ${isOverdue(task) ? 'ring-2 ring-[#BA1A1A]/30' : ''}`}>
              <div 
                className="p-6 cursor-pointer hover:bg-[#F4F4EF]/30 transition-colors"
                onClick={() => toggleTaskExpansion(task.id)}
              >
                <div className={`flex items-start gap-5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${task.status === 'completed' ? 'bg-[#10B981]/15' : 'bg-[#002819]/5'}`}>
                    <MaterialSymbol 
                      icon={taskTypeIcons[task.task_type] || 'assignment'} 
                      size={26} 
                      className={task.status === 'completed' ? 'text-[#059669]' : 'text-[#002819]'} 
                    />
                  </div>
                  <div className="flex-1">
                    <div className={`flex items-start justify-between ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                      <div>
                        <h3 className={`font-bold text-lg text-[#002819] ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-[#717973] mt-1">{task.description}</p>
                        )}
                      </div>
                      <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${priorityColors[task.priority]}`}>
                          {t(`tasks.${task.priority}`)}
                        </span>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusColors[task.status]}`}>
                          {t(`tasks.${task.status === 'in_progress' ? 'inProgress' : task.status}`)}
                        </span>
                      </div>
                    </div>

                    <div className={`flex flex-wrap items-center gap-5 mt-4 text-sm text-[#717973] ${isRtl ? 'flex-row-reverse justify-end' : ''}`}>
                      {task.assignee && (
                        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                          <MaterialSymbol icon="person" size={16} />
                          <span>{task.assignee.name}</span>
                        </div>
                      )}
                      {task.animal && (
                        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                          <MaterialSymbol icon="pets" size={16} />
                          <span>{task.animal.animal_id}</span>
                        </div>
                      )}
                      {task.due_date && (
                        <div className={`flex items-center gap-2 ${isOverdue(task) ? 'text-[#BA1A1A] font-semibold' : ''} ${isRtl ? 'flex-row-reverse' : ''}`}>
                          <MaterialSymbol icon="schedule" size={16} />
                          <span>{new Date(task.due_date).toLocaleDateString()}</span>
                          {isOverdue(task) && <span className="text-xs">({t('tasks.overdue')})</span>}
                        </div>
                      )}
                      {taskLogs[task.id]?.length > 0 && (
                        <div className={`flex items-center gap-2 text-[#D4AF37] ${isRtl ? 'flex-row-reverse' : ''}`}>
                          <MaterialSymbol icon="history" size={16} />
                          <span>{taskLogs[task.id].length} {t('common.logs')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    {canSubmitLog(task) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); openLogModal(task); }}
                        className="p-3 bg-[#D4AF37]/15 text-[#735C00] hover:bg-[#D4AF37]/25 rounded-xl transition-colors"
                        title={t('tasks.submitLog')}
                      >
                        <MaterialSymbol icon="add_circle" size={20} />
                      </button>
                    )}
                    {task.status === 'pending' && !isShepherd && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, 'in_progress'); }}
                        className="p-3 bg-[#3B82F6]/10 text-[#2563EB] hover:bg-[#3B82F6]/20 rounded-xl transition-colors"
                        title="Start Task"
                      >
                        <MaterialSymbol icon="play_arrow" size={20} />
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, 'completed'); }}
                        className="p-3 bg-[#10B981]/10 text-[#059669] hover:bg-[#10B981]/20 rounded-xl transition-colors"
                        title={t('tasks.markComplete')}
                      >
                        <MaterialSymbol icon="check" size={20} />
                      </button>
                    )}
                    {task.status !== 'completed' && task.status !== 'cancelled' && canModify && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, 'cancelled'); }}
                        className="p-3 text-[#717973] hover:bg-[#F4F4EF] rounded-xl transition-colors"
                        title={t('tasks.cancelTask')}
                      >
                        <MaterialSymbol icon="close" size={20} />
                      </button>
                    )}
                    {canModify && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                        className="p-3 text-[#BA1A1A] hover:bg-[#BA1A1A]/10 rounded-xl transition-colors"
                        title={t('common.delete')}
                      >
                        <MaterialSymbol icon="delete" size={20} />
                      </button>
                    )}
                    <MaterialSymbol 
                      icon={expandedTask === task.id ? 'expand_less' : 'expand_more'} 
                      size={24} 
                      className="text-[#717973]" 
                    />
                  </div>
                </div>
              </div>

              {expandedTask === task.id && (
                <div className="border-t border-[#F4F4EF] bg-[#F4F4EF]/30 p-6">
                  <h4 className="font-bold text-[#002819] mb-4 flex items-center gap-2">
                    <MaterialSymbol icon="history" size={20} />
                    {t('tasks.taskLogs')}
                  </h4>
                  {taskLogs[task.id]?.length > 0 ? (
                    <div className="space-y-3">
                      {taskLogs[task.id].map((log) => (
                        <div key={log.id} className={`bg-white p-4 rounded-xl ${isRtl ? 'text-right' : ''}`}>
                          <div className={`flex items-start justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                              <div className="w-10 h-10 rounded-xl bg-[#F4F4EF] flex items-center justify-center">
                                <MaterialSymbol icon={logTypeIcons[log.log_type] || 'note'} size={18} className="text-[#002819]" />
                              </div>
                              <div>
                                <p className="font-semibold text-[#002819]">{t(`tasks.${log.log_type === 'location_update' ? 'locationUpdate' : log.log_type === 'status_change' ? 'statusChange' : log.log_type}`)}</p>
                                <p className="text-sm text-[#717973]">{log.user?.name}</p>
                              </div>
                            </div>
                            <span className="text-xs text-[#717973]">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-3 text-sm text-[#404943]">{log.description}</p>
                          {log.photo_path && (
                            <img 
                              src={`/storage/${log.photo_path}`} 
                              alt="Log photo" 
                              className="mt-3 rounded-lg max-w-xs" 
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#717973] text-sm italic">{t('tasks.noLogs')}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className={`flex items-center justify-between mb-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <h3 className="text-2xl font-bold text-[#002819]">{t('tasks.createTask')}</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-3 hover:bg-[#F4F4EF] rounded-xl transition">
                <MaterialSymbol icon="close" size={24} className="text-[#717973]" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-6">
              {canModify && (
                <div>
                  <label className={`block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>
                    {t('tasks.predefinedTask')}
                  </label>
                  <select
                    value=""
                    onChange={handlePredefinedSelect}
                    className="input-field"
                  >
                    <option value="">{t('tasks.selectPredefined')}</option>
                    {predefinedTasks.length === 0 ? (
                      <option value="" disabled>{t('tasks.noPredefined')}</option>
                    ) : (
                      predefinedTasks.map((pt) => (
                        <option key={pt.id} value={pt.id}>{pt.title}</option>
                      ))
                    )}
                  </select>
                </div>
              )}

              <div>
                <label className={`block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>
                  {t('tasks.title')} *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Check water supply"
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>
                  {t('tasks.description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field h-24 resize-none"
                  placeholder="Additional details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>
                    {t('tasks.assignedTo')} *
                  </label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select Shepherd</option>
                    {shepherds.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>
                    {t('tasks.priority')}
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="low">{t('tasks.low')}</option>
                    <option value="medium">{t('tasks.medium')}</option>
                    <option value="high">{t('tasks.high')}</option>
                    <option value="urgent">{t('tasks.urgent')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>
                    {t('common.type')}
                  </label>
                  <select
                    value={formData.task_type}
                    onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
                    className="input-field"
                  >
                    <option value="inspection">Inspection</option>
                    <option value="medical">Medical</option>
                    <option value="feeding">Feeding</option>
                    <option value="movement">Movement</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>
                    {t('tasks.dueDate')}
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="border-t border-[#F4F4EF] pt-5">
                <label className={`flex items-center gap-3 cursor-pointer ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <input
                    type="checkbox"
                    checked={recurring.enabled}
                    onChange={(e) => setRecurring({ ...recurring, enabled: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-2 border-[#D4AF37] text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
                  />
                  <span className="font-semibold text-[#002819]">{t('tasks.recurring')}</span>
                </label>

                {recurring.enabled && (
                  <div className="mt-4 p-4 bg-[#F4F4EF]/50 rounded-xl space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className={`block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>
                          {t('tasks.recurrenceInterval')}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={recurring.interval}
                            onChange={(e) => setRecurring({ ...recurring, interval: parseInt(e.target.value) || 1 })}
                            className="input-field w-20 text-center"
                          />
                          <span className="text-sm text-[#717973]">{t('tasks.daysUnit')}</span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className={`block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>
                          {t('tasks.recurrenceEnd')}
                        </label>
                        <input
                          type="date"
                          value={recurring.end_date}
                          onChange={(e) => setRecurring({ ...recurring, end_date: e.target.value })}
                          className="input-field"
                          placeholder={t('tasks.noEndDate')}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={`flex gap-4 pt-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-[#F4F4EF] text-[#002819] rounded-xl font-bold text-sm hover:bg-[#E3E3DE] transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn-primary"
                >
                  {saving ? t('common.loading') : t('tasks.createTask')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLogModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl">
            <div className={`flex items-center justify-between mb-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div>
                <h3 className="text-2xl font-bold text-[#002819]">{t('tasks.submitLog')}</h3>
                <p className="text-sm text-[#717973] mt-1">{selectedTask.title}</p>
              </div>
              <button onClick={() => setShowLogModal(false)} className="p-3 hover:bg-[#F4F4EF] rounded-xl transition">
                <MaterialSymbol icon="close" size={24} className="text-[#717973]" />
              </button>
            </div>

            <form onSubmit={handleSubmitLog} className="space-y-6">
              <div>
                <label className={`block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>
                  {t('common.type')}
                </label>
                <select
                  value={logForm.log_type}
                  onChange={(e) => setLogForm({ ...logForm, log_type: e.target.value })}
                  className="w-full bg-[#F4F4EF] rounded-xl py-3 px-4 text-sm font-medium text-[#002819] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06402B]/20"
                >
                  <option value="checkpoint">{t('tasks.checkpoint')}</option>
                  <option value="photo">{t('tasks.photo')}</option>
                  <option value="note">{t('tasks.note')}</option>
                  <option value="location_update">{t('tasks.locationUpdate')}</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>
                  {t('tasks.logDescription')} *
                </label>
                <textarea
                  value={logForm.description}
                  onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                  className="input-field h-32 resize-none"
                  placeholder="Describe what you observed or completed..."
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>
                  {t('tasks.photo')} ({t('common.optional')})
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogForm({ ...logForm, photo: e.target.files[0] })}
                  className="w-full text-sm text-[#717973] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#F4F4EF] file:text-[#002819] hover:file:bg-[#E3E3DE]"
                />
              </div>

              <div>
                <label className={`block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>
                  {t('tasks.voiceNote')} ({t('common.optional')})
                </label>
                <div className="flex items-center gap-3">
                  {!isRecording && !audioUrl && (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex items-center gap-2 px-4 py-2 bg-[#06402B] text-white rounded-xl text-sm font-medium hover:bg-[#002819] transition"
                    >
                      <MaterialSymbol icon="mic" size={20} />
                      {t('tasks.startRecording')}
                    </button>
                  )}
                  {isRecording && (
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-xl">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="font-medium text-sm">{formatTime(recordingTime)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition"
                      >
                        <MaterialSymbol icon="stop" size={20} />
                        {t('tasks.stopRecording')}
                      </button>
                    </div>
                  )}
                  {audioUrl && (
                    <div className="flex items-center gap-3 flex-1">
                      <audio src={audioUrl} controls className="flex-1 h-10" />
                      <button
                        type="button"
                        onClick={deleteRecording}
                        className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition"
                      >
                        <MaterialSymbol icon="delete" size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className={`flex gap-4 pt-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="flex-1 py-3 bg-[#F4F4EF] text-[#002819] rounded-xl font-bold text-sm hover:bg-[#E3E3DE] transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn-gold"
                >
                  {saving ? t('common.loading') : t('tasks.submitLog')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
