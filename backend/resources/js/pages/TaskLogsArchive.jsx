import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';

export default function TaskLogsArchive() {
  const { user } = useAuth();
  const { t, dir } = useI18n();
  const isRtl = dir === 'rtl';

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [logTypeFilter, setLogTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [statusFilter, logTypeFilter, searchQuery]);

  const fetchLogs = async () => {
    try {
      let url = '/api/task-logs/archive?';
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      if (logTypeFilter !== 'all') url += `log_type=${logTypeFilter}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}`;

      const response = await apiFetch(url);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const logTypeIcons = {
    checkpoint: 'location_on',
    photo: 'photo_camera',
    note: 'note',
    location_update: 'my_location',
    status_change: 'swap_horiz',
  };

  const logTypeColors = {
    checkpoint: 'bg-[#3B82F6]/10 text-[#2563EB]',
    photo: 'bg-[#10B981]/10 text-[#059669]',
    note: 'bg-[#F59E0B]/10 text-[#735C00]',
    location_update: 'bg-[#8B5CF6]/10 text-[#7C3AED]',
    status_change: 'bg-[#717973]/10 text-[#404943]',
  };

  const statusColors = {
    submitted: 'bg-[#F59E0B]/15 text-[#735C00]',
    reviewed: 'bg-[#3B82F6]/15 text-[#2563EB]',
    approved: 'bg-[#10B981]/15 text-[#059669]',
    rejected: 'bg-[#BA1A1A]/10 text-[#BA1A1A]',
  };

  return (
    <div className="space-y-8">
      <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 ${isRtl ? 'text-right' : ''}`}>
        <div>
          <h2 className="text-4xl font-black text-[#002819]">{t('tasks.taskLogsArchive')}</h2>
          <p className="text-[#404943] mt-2 font-medium">Review and manage all submitted task logs</p>
        </div>
        <Link 
          to="/tasks"
          className="btn-ghost flex items-center gap-2 w-fit"
        >
          <MaterialSymbol icon={isRtl ? 'arrow_forward' : 'arrow_back'} size={18} />
          {t('tasks.title')}
        </Link>
      </div>

      <div className={`flex flex-wrap gap-4 items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div className="flex-1 min-w-[240px] relative">
          <MaterialSymbol icon="search" size={20} className={`absolute top-1/2 -translate-y-1/2 text-[#717973] ${isRtl ? 'right-4 left-auto' : 'left-4'}`} />
          <input 
            type="text" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder={t('common.search')}
            className={`w-full bg-white rounded-xl py-3 text-sm shadow-sm focus:ring-2 focus:ring-[#06402b]/10 ${isRtl ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'}`} 
          />
        </div>

        <div className={`flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl ${isRtl ? 'flex-row-reverse' : ''}`}>
          <MaterialSymbol icon="filter_list" size={20} className="text-[#717973]" />
          <select
            value={logTypeFilter}
            onChange={(e) => setLogTypeFilter(e.target.value)}
            className="bg-transparent border-none text-sm font-medium text-[#404943] focus:outline-none cursor-pointer"
          >
            <option value="all">{t('common.all')} {t('common.type')}</option>
            <option value="checkpoint">{t('tasks.checkpoint')}</option>
            <option value="photo">{t('tasks.photo')}</option>
            <option value="note">{t('tasks.note')}</option>
            <option value="location_update">{t('tasks.locationUpdate')}</option>
          </select>
        </div>

        <div className={`flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl ${isRtl ? 'flex-row-reverse' : ''}`}>
          <MaterialSymbol icon="fact_check" size={20} className="text-[#717973]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none text-sm font-medium text-[#404943] focus:outline-none cursor-pointer"
          >
            <option value="all">{t('common.all')} Status</option>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-[#002819] border-t-transparent rounded-full" />
        </div>
      ) : logs.length === 0 ? (
        <div className="card p-12 text-center">
          <MaterialSymbol icon="history" size={64} className="text-[#717973] mx-auto mb-4 opacity-50" />
          <p className="text-[#404943] font-medium text-lg">{t('common.noData')}</p>
          <p className="text-[#717973] text-sm mt-1">No task logs have been submitted yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="card p-6">
              <div className={`flex items-start gap-5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${logTypeColors[log.log_type] || 'bg-[#F4F4EF] text-[#404943]'}`}>
                  <MaterialSymbol icon={logTypeIcons[log.log_type] || 'note'} size={26} />
                </div>
                <div className="flex-1">
                  <div className={`flex items-start justify-between ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                    <div>
                      <div className={`flex items-center gap-3 mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${logTypeColors[log.log_type] || 'bg-[#F4F4EF] text-[#404943]'}`}>
                          {t(`tasks.${log.log_type === 'location_update' ? 'locationUpdate' : log.log_type === 'status_change' ? 'statusChange' : log.log_type}`)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[log.status] || 'bg-[#F4F4EF] text-[#404943]'}`}>
                          {log.status || 'submitted'}
                        </span>
                      </div>
                      <h3 className="font-bold text-[#002819]">{log.task?.title || 'Unknown Task'}</h3>
                    </div>
                    <span className="text-sm text-[#717973] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="mt-3 text-[#404943]">{log.description}</p>

                  <div className={`flex items-center gap-5 mt-4 text-sm text-[#717973] ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <MaterialSymbol icon="person" size={16} />
                      <span>{log.user?.name || 'Unknown'}</span>
                    </div>
                    {log.task?.animal && (
                      <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <MaterialSymbol icon="pets" size={16} />
                        <span>{log.task.animal.animal_id}</span>
                      </div>
                    )}
                    {log.photo_path && (
                      <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <MaterialSymbol icon="image" size={16} />
                        <span>{t('tasks.photo')} attached</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link 
                    to={`/tasks`}
                    className="p-3 bg-[#F4F4EF] text-[#404943] hover:bg-[#E3E3DE] rounded-xl transition-colors"
                    title={t('tasks.viewLogs')}
                  >
                    <MaterialSymbol icon="open_in_new" size={20} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
