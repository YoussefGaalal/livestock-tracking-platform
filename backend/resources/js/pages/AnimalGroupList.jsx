import { useState, useEffect } from 'react';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';

export default function AnimalGroupList() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#D4AF37',
    animal_ids: [],
    owner_id: '',
  });
  const [owners, setOwners] = useState([]);
  const [ownerAnimals, setOwnerAnimals] = useState([]);
  const [availableAnimals, setAvailableAnimals] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    fetchGroups();
    fetchOwners();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await apiFetch('/api/animal-groups');
      if (response.ok) {
        const data = await response.json();
        setGroups(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOwners = async () => {
    try {
      const response = await apiFetch('/api/users?per_page=100');
      if (response.ok) {
        const data = await response.json();
        setOwners(data.data?.filter(u => u.role === 'Owner') || []);
      }
    } catch (error) {
      console.error('Failed to fetch owners:', error);
    }
  };

  const fetchOwnerAnimals = async (ownerId) => {
    if (!ownerId) {
      setOwnerAnimals([]);
      return;
    }
    try {
      const response = await apiFetch(`/api/animals?per_page=1000`);
      if (response.ok) {
        const data = await response.json();
        setOwnerAnimals(data.data?.filter(a => a.owner_id === parseInt(ownerId)) || []);
      }
    } catch (error) {
      console.error('Failed to fetch owner animals:', error);
    }
  };

  const openCreateModal = () => {
    setEditingGroup(null);
    setFormData({ name: '', description: '', color: '#D4AF37', animal_ids: [], owner_id: '' });
    setOwnerAnimals([]);
    setShowModal(true);
  };

  const openEditModal = (group) => {
    setEditingGroup(group);
    const animalIds = Array.isArray(group.animals) ? group.animals.map(a => a.id) : [];
    setFormData({
      name: group.name,
      description: group.description || '',
      color: group.color,
      animal_ids: animalIds,
      owner_id: group.owner_id || '',
    });
    if (group.owner_id) {
      fetchOwnerAnimals(group.owner_id);
    }
    setShowModal(true);
  };

  const openAssignModal = async (group) => {
    setSelectedGroup(group);
    try {
      const response = await apiFetch(`/api/animal-groups/${group.id}/available-animals`);
      if (response.ok) {
        const data = await response.json();
        setAvailableAnimals(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch available animals:', error);
    }
    setShowAssignModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingGroup ? `/api/animal-groups/${editingGroup.id}` : '/api/animal-groups';
      const method = editingGroup ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        fetchGroups();
      } else {
        const error = await response.json();
        alert(error.message || t('groupsPage.failedSave'));
      }
    } catch (error) {
      console.error('Failed to save group:', error);
    }
  };

  const handleAssignAnimals = async (animalIds) => {
    try {
      const response = await apiFetch(`/api/animal-groups/${selectedGroup.id}/add-animals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animal_ids: animalIds }),
      });

      if (response.ok) {
        setShowAssignModal(false);
        fetchGroups();
      }
    } catch (error) {
      console.error('Failed to assign animals:', error);
    }
  };

  const handleRemoveAnimal = async (group, animalId) => {
    if (!confirm(t('groupsPage.removeConfirm'))) return;
    try {
      await apiFetch(`/api/animal-groups/${group.id}/remove-animals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animal_ids: [animalId] }),
      });
      fetchGroups();
    } catch (error) {
      console.error('Failed to remove animal:', error);
    }
  };

  const deleteGroup = async (group) => {
    if (!confirm(t('groupsPage.deleteConfirm', { name: group.name }))) return;
    try {
      await apiFetch(`/api/animal-groups/${group.id}`, { method: 'DELETE' });
      setGroups(groups.filter(g => g.id !== group.id));
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.animalGroups')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('groupsPage.description') || t('animalGroups.description')}</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          <MaterialSymbol icon="add" size={20} />
          {t('groupsPage.createGroup')}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">{t('groupsPage.loading')}</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <MaterialSymbol icon="folder_off" size={48} className="text-gray-300 mb-3" />
          <p className="text-gray-500">{t('groupsPage.noGroups')}</p>
          <button
            onClick={openCreateModal}
            className="mt-4 text-amber-600 hover:text-amber-700 font-medium"
          >
            {t('groupsPage.createFirst')}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div key={group.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: group.color }}
                  />
                  <h3 className="font-semibold text-gray-900">{group.name}</h3>
                  {group.owner && (
                    <span className="text-xs px-2 py-1 bg-[#D4AF37]/10 text-[#735c00] rounded-full">
                      {group.owner.name}
                    </span>
                  )}
                </div>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {group.animals_count || group.animals?.length || 0} {t('groupsPage.animals')}
                </span>
              </div>

              {group.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{group.description}</p>
              )}

              {group.animals && group.animals.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {group.animals.slice(0, 3).map((animal) => (
                    <span key={animal.id} className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {animal.animal_id}
                    </span>
                  ))}
                  {group.animals.length > 3 && (
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      +{group.animals.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => openAssignModal(group)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <MaterialSymbol icon="person_add" size={16} />
                  {t('groupsPage.assign')}
                </button>
                <button
                  onClick={() => openEditModal(group)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <MaterialSymbol icon="edit" size={16} />
                  {t('common.edit')}
                </button>
                <button
                  onClick={() => deleteGroup(group)}
                  className="flex items-center justify-center px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <MaterialSymbol icon="delete" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingGroup ? t('groupsPage.editGroup') : t('groupsPage.createAnimalGroup')}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('geofences.name')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('groupsPage.description')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('geofences.color')}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>

              {user?.role === 'Admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('users.owner')}</label>
                  <select
                    value={formData.owner_id}
                    onChange={(e) => {
                      setFormData({ ...formData, owner_id: e.target.value, animal_ids: [] });
                      fetchOwnerAnimals(e.target.value);
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">{t('common.select')}</option>
                    {owners.map(owner => (
                      <option key={owner.id} value={owner.id}>{owner.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {(formData.owner_id || user?.role !== 'Admin') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('nav.animals')}</label>
                  <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto p-2 space-y-1">
                    {(formData.owner_id ? ownerAnimals : groups.flatMap(g => g.animals || [])).map(animal => (
                      <label key={animal.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.animal_ids.includes(animal.id)}
                          onChange={(e) => {
                            const ids = e.target.checked
                              ? [...formData.animal_ids, animal.id]
                              : formData.animal_ids.filter(id => id !== animal.id);
                            setFormData({ ...formData, animal_ids: ids });
                          }}
                          className="rounded text-amber-600"
                        />
                        <span className="text-sm">{animal.animal_id}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  {editingGroup ? t('geofencesPage.saveChanges') : t('groupsPage.createGroup')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && selectedGroup && (
        <AnimalAssignmentModal
          group={selectedGroup}
          availableAnimals={availableAnimals}
          onAssign={handleAssignAnimals}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </div>
  );
}

function AnimalAssignmentModal({ group, availableAnimals, onAssign, onClose }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState([]);

  const toggleAnimal = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (selected.length > 0) {
      onAssign(selected);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {t('groupsPage.assignAnimalsTo', { name: group.name })}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t('groupsPage.animalsAvailable', { count: availableAnimals.length })}
          </p>
        </div>

        <div className="p-6">
          {availableAnimals.length === 0 ? (
            <p className="text-center text-gray-500 py-8">{t('groupsPage.allInGroup')}</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {availableAnimals.map((animal) => (
                <label
                  key={animal.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selected.includes(animal.id)
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(animal.id)}
                    onChange={() => toggleAnimal(animal.id)}
                    className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{animal.animal_id}</p>
                    <p className="text-sm text-gray-500">
                      {animal.species} • {animal.breed}
                    </p>
                  </div>
                  {animal.device && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      {animal.device.device_id}
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={selected.length === 0}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('groupsPage.assign')} {selected.length > 0 ? `(${selected.length})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
