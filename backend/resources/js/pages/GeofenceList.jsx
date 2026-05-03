import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { exportData } from '../utils/export';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function GeofenceDrawer({ coordinates, onCoordinatesChange, animals, devices, geofenceColor = '#D4AF37' }) {
  const map = useMap();
  const [points, setPoints] = useState(coordinates || []);

  // Check if point is inside polygon using ray casting
  const isPointInPolygon = (point, polygon) => {
    if (!polygon || polygon.length < 3) return false;
    const [x, y] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  };

  // Get animals with GPS coordinates
  const getAnimalPosition = (animal) => {
    const deviceId = animal.device?.device_id || animal.device_id;
    const device = devices.find(d => d.device_id === deviceId);
    if (device && device.gps_lat && device.gps_lng) {
      return [parseFloat(device.gps_lat), parseFloat(device.gps_lng)];
    }
    return null;
  };

  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      setPoints(coordinates);
      const bounds = coordinates;
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coordinates, map]);

  useEffect(() => {
    const handleClick = (e) => {
      if (!e.latlng || !e.latlng.lat || !e.latlng.lng) return;
      const newPoints = [...points, [e.latlng.lat, e.latlng.lng]];
      setPoints(newPoints);
      onCoordinatesChange(newPoints);
    };

    map.on('click', handleClick);
    return () => map.off('click', handleClick);
  }, [map, points, onCoordinatesChange]);

  // Expose clear function via custom event
  useEffect(() => {
    const handleClear = () => {
      setPoints([]);
      onCoordinatesChange([]);
    };
    window.addEventListener('clearGeofenceDrawer', handleClear);
    return () => window.removeEventListener('clearGeofenceDrawer', handleClear);
  }, [onCoordinatesChange]);

  return (
    <>
      {points.length > 0 && (
        <>
          {points.map((point, idx) => (
            <Marker key={idx} position={point} icon={L.divIcon({
              className: 'temp-marker',
              html: `<div style="width:12px;height:12px;background:${geofenceColor};border:2px solid white;border-radius:50%;"></div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            })} />
          ))}
          <Polygon positions={points} pathOptions={{ color: geofenceColor, fillColor: geofenceColor, fillOpacity: 0.2 }} />
        </>
      )}
      {animals && animals.map((animal) => {
        const pos = getAnimalPosition(animal);
        if (!pos) return null;
        const deviceId = animal.device?.device_id || animal.device_id;
        const device = devices.find(d => d.device_id === deviceId);
        const isOnline = device?.status === 'online' || device?.status === 'active';
        const isInside = points.length >= 3 && isPointInPolygon(pos, points);
        
        return (
          <Marker
            key={animal.id}
            position={pos}
            icon={L.divIcon({
              className: 'animal-marker',
              html: `<div style="
                width:32px;
                height:32px;
                background:${isInside ? '#10B981' : (isOnline ? '#717973' : '#9CA3AF')};
                border-radius:50%;
                border:3px solid white;
                box-shadow:0 2px 6px rgba(0,0,0,0.3);
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:16px;
              ">🐪</div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            })}
          >
            <Popup>
              <div className="p-2 min-w-[150px]">
                <div className="font-bold text-[#002819]">{animal.animal_id}</div>
                <div className="text-xs text-[#717973]">{animal.species} - {animal.breed}</div>
                <div className={`text-xs ${isInside ? 'text-green-600 font-bold' : 'text-gray-500'} mt-1`}>
                  {isInside ? '✓ Inside Geofence' : (isOnline ? '🟢 Online - Outside' : '⚫ Offline - Outside')}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default function GeofenceList() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [geofences, setGeofences] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    coordinates: '',
    color: '#D4AF37',
    alert_type: 'both',
  });
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawnCoords, setDrawnCoords] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showGroupAssignModal, setShowGroupAssignModal] = useState(false);
  const [selectedGeofence, setSelectedGeofence] = useState(null);
  const [availableAnimals, setAvailableAnimals] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState(null);
  
  const canModify = user?.role !== 'Shepherd';
  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    fetchGeofences();
    fetchAnimals();
  }, []);

  const fetchAnimals = async () => {
    try {
      const [animalsRes, devicesRes] = await Promise.all([
        apiFetch('/api/animals?per_page=1000'),
        apiFetch('/api/devices?per_page=1000'),
      ]);
      if (animalsRes.ok) {
        const data = await animalsRes.json();
        setAnimals(data.data || []);
      }
      if (devicesRes.ok) {
        const data = await devicesRes.json();
        setDevices(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch animals:', error);
    }
  };

  const fetchGeofences = async () => {
    try {
      const response = await apiFetch('/api/geofences?include_inactive=true');
      if (response.ok) {
        const data = await response.json();
        setGeofences(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch geofences:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingGeofence(null);
    setFormData({ name: '', coordinates: '', color: '#D4AF37', alert_type: 'both' });
    setDrawnCoords([]);
    setShowCreateModal(true);
  };

  const openEditModal = (geofence) => {
    setEditingGeofence(geofence);
    const coords = Array.isArray(geofence.coordinates) 
      ? JSON.stringify(geofence.coordinates) 
      : geofence.coordinates;
    setFormData({
      name: geofence.name,
      coordinates: coords,
      color: geofence.color,
      alert_type: geofence.alert_type,
    });
    setDrawnCoords(Array.isArray(geofence.coordinates) ? geofence.coordinates : []);
    setShowCreateModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (drawnCoords.length > 0) {
        payload.coordinates = JSON.stringify(drawnCoords);
      }

      const url = editingGeofence 
        ? `/api/geofences/${editingGeofence.id}` 
        : '/api/geofences';
      const method = editingGeofence ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowCreateModal(false);
        fetchGeofences();
      } else {
        const error = await response.json();
        alert(error.message || t('geofencesPage.failedSave'));
      }
    } catch (error) {
      console.error('Failed to save geofence:', error);
    }
  };

  const deleteGeofence = async (geofence) => {
    if (!confirm(t('geofencesPage.deleteConfirm', { name: geofence.name }))) return;
    try {
      const response = await apiFetch(`/api/geofences/${geofence.id}`, { method: 'DELETE' });
      if (response.ok) {
        setGeofences(geofences.filter(g => g.id !== geofence.id));
      }
    } catch (error) {
      console.error('Failed to delete geofence:', error);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    const success = await exportData('/api/export/geofences', `geofences_${new Date().toISOString().split('T')[0]}.csv`);
    if (success) {
      setMessage({ type: 'success', text: t('common.exported') });
    } else {
      setMessage({ type: 'error', text: t('common.exportFailed') });
    }
    setTimeout(() => setMessage(null), 3000);
    setExporting(false);
  };

  const toggleActive = async (geofence) => {
    try {
      await apiFetch(`/api/geofences/${geofence.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !geofence.is_active }),
      });
      setGeofences(geofences.map(g => 
        g.id === geofence.id ? { ...g, is_active: !g.is_active } : g
      ));
    } catch (error) {
      console.error('Failed to toggle geofence:', error);
    }
  };

  const openAssignModal = async (geofence) => {
    setSelectedGeofence(geofence);
    try {
      const response = await apiFetch(`/api/geofences/${geofence.id}/available-animals`);
      if (response.ok) {
        const data = await response.json();
        setAvailableAnimals(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch available animals:', error);
    }
    setShowAssignModal(true);
  };

  const handleAssignAnimals = async (animalIds) => {
    try {
      const response = await apiFetch(`/api/geofences/${selectedGeofence.id}/animals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animal_ids: animalIds }),
      });
      if (response.ok) {
        setShowAssignModal(false);
        fetchGeofences();
      }
    } catch (error) {
      console.error('Failed to assign animals:', error);
    }
  };

  const openGroupAssignModal = async (geofence) => {
    setSelectedGeofence(geofence);
    try {
      const response = await apiFetch(`/api/geofences/${geofence.id}/available-groups`);
      if (response.ok) {
        const data = await response.json();
        setAvailableGroups(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch available groups:', error);
    }
    setShowGroupAssignModal(true);
  };

  const handleAssignGroups = async (groupIds) => {
    try {
      const response = await apiFetch(`/api/geofences/${selectedGeofence.id}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_ids: groupIds }),
      });
      if (response.ok) {
        setShowGroupAssignModal(false);
        fetchGeofences();
      }
    } catch (error) {
      console.error('Failed to assign groups:', error);
    }
  };

  const handleRemoveGroup = async (geofence, groupId) => {
    if (!confirm(t('geofencesPage.removeGroupConfirm'))) return;
    try {
      await apiFetch(`/api/geofences/${geofence.id}/groups`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_ids: [groupId] }),
      });
      fetchGeofences();
    } catch (error) {
      console.error('Failed to remove group:', error);
    }
  };

  const handleRemoveAnimal = async (geofence, animalId) => {
    if (!confirm(t('geofencesPage.removeAnimalConfirm'))) return;
    try {
      await apiFetch(`/api/geofences/${geofence.id}/animals`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animal_ids: [animalId] }),
      });
      fetchGeofences();
    } catch (error) {
      console.error('Failed to remove animal:', error);
    }
  };

  const alertTypeBadge = (type) => {
    const styles = {
      entry: 'bg-green-100 text-green-700',
      exit: 'bg-red-100 text-red-700',
      both: 'bg-amber-100 text-amber-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type] || styles.both}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('geofences.title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('geofencesPage.description')}</p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#c9a030] transition-colors disabled:opacity-50"
            >
              <MaterialSymbol icon="download" size={20} />
              {exporting ? t('common.exporting') : t('common.export')}
            </button>
          )}
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <MaterialSymbol icon="add" size={20} />
            {t('geofencesPage.createGeofence')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">{t('geofencesPage.loading')}</div>
      ) : geofences.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <MaterialSymbol icon="fence" size={48} className="text-gray-300 mb-3" />
          <p className="text-gray-500">{t('geofencesPage.noGeofences')}</p>
          <button
            onClick={openCreateModal}
            className="mt-4 text-amber-600 hover:text-amber-700 font-medium"
          >
            {t('geofencesPage.createFirst')}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {geofences.map((geofence) => (
            <div
              key={geofence.id}
              className={`bg-white rounded-xl border border-gray-200 p-5 ${
                !geofence.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: geofence.color }}
                  />
                  <h3 className="font-semibold text-gray-900">{geofence.name}</h3>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  geofence.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {geofence.is_active ? t('geofences.active') : t('geofences.inactive')}
                </span>
              </div>

              <div className="flex gap-1 mb-3">
                {alertTypeBadge(geofence.alert_type)}
                <span className="text-xs text-gray-500 px-2 py-1">
                  {Array.isArray(geofence.coordinates) 
                    ? t('geofencesPage.points', { count: geofence.coordinates.length }) 
                    : t('devicesPage.na')}
                </span>
              </div>

              {geofence.owner && (
                <p className="text-xs text-gray-500 mb-3">{t('geofencesPage.owner')}: {geofence.owner.name}</p>
              )}

              {geofence.animals && geofence.animals.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-1">{t('geofencesPage.animals')}:</p>
                  <div className="flex flex-wrap gap-1">
                    {geofence.animals.slice(0, 2).map((animal) => (
                      <span key={animal.id} className="text-xs px-2 py-1 bg-gray-100 rounded-full flex items-center gap-1">
                        {animal.animal_id}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveAnimal(geofence, animal.id); }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <MaterialSymbol icon="close" size={12} />
                        </button>
                      </span>
                    ))}
                    {geofence.animals.length > 2 && (
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                        +{geofence.animals.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {geofence.groups && geofence.groups.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-1">{t('geofencesPage.groups')}:</p>
                  <div className="flex flex-wrap gap-1">
                    {geofence.groups.map((group) => (
                      <span key={group.id} className="text-xs px-2 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: group.color + '30' }}>
                        {group.name}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveGroup(geofence, group.id); }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <MaterialSymbol icon="close" size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-1 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => openAssignModal(geofence)}
                  className="flex items-center justify-center gap-1 px-2 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <MaterialSymbol icon="pets" size={14} />
                </button>
                <button
                  onClick={() => openGroupAssignModal(geofence)}
                  className="flex items-center justify-center gap-1 px-2 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <MaterialSymbol icon="folder" size={14} />
                </button>
                {canModify && (
                  <>
                    <button
                      onClick={() => toggleActive(geofence)}
                      className="flex items-center justify-center gap-1 px-2 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <MaterialSymbol icon={geofence.is_active ? 'pause' : 'play_arrow'} size={14} />
                    </button>
                    <button
                      onClick={() => openEditModal(geofence)}
                      className="flex items-center justify-center px-2 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <MaterialSymbol icon="edit" size={14} />
                    </button>
                    <button
                      onClick={() => deleteGeofence(geofence)}
                      className="flex items-center justify-center px-2 py-2 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <MaterialSymbol icon="delete" size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAssignModal && selectedGeofence && (
        <GeofenceAnimalAssignmentModal
          geofence={selectedGeofence}
          availableAnimals={availableAnimals}
          onAssign={handleAssignAnimals}
          onClose={() => setShowAssignModal(false)}
        />
      )}

      {showGroupAssignModal && selectedGeofence && (
        <GeofenceGroupAssignmentModal
          geofence={selectedGeofence}
          availableGroups={availableGroups}
          onAssign={handleAssignGroups}
          onClose={() => setShowGroupAssignModal(false)}
        />
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingGeofence ? t('geofences.editGeofence') : t('geofencesPage.createGeofenceModal')}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('geofences.alertType')}</label>
                <select
                  value={formData.alert_type}
                  onChange={(e) => setFormData({ ...formData, alert_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="both">{t('geofencesPage.entryExit')}</option>
                  <option value="entry">{t('geofencesPage.entryOnly')}</option>
                  <option value="exit">{t('geofencesPage.exitOnly')}</option>
                </select>
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

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('geofencesPage.coordinates')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setDrawnCoords([]);
                      window.dispatchEvent(new Event('clearGeofenceDrawer'));
                    }}
                    className="text-xs text-amber-600 hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <div className="h-64 border border-gray-200 rounded-lg overflow-hidden">
                  <MapContainer
                    center={[24.3185, 54.4619]}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <GeofenceDrawer 
                      coordinates={drawnCoords} 
                      onCoordinatesChange={(newCoords) => {
                        setDrawnCoords(newCoords);
                      }}
                      animals={animals}
                      devices={devices}
                      geofenceColor={formData.color}
                    />
                  </MapContainer>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Click on map to draw polygon points • Right-click to remove last point
                </p>
                {drawnCoords.length > 0 && (
                  <p className="text-xs font-medium text-amber-600 mt-1">
                    {drawnCoords.length} points drawn
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  {editingGeofence ? t('geofencesPage.saveChanges') : t('geofencesPage.createGeofence')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function GeofenceAnimalAssignmentModal({ geofence, availableAnimals, onAssign, onClose }) {
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
            {t('geofencesPage.assignAnimalsTo', { name: geofence.name })}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t('geofencesPage.animalsAvailable', { count: availableAnimals.length })}
          </p>
        </div>

        <div className="p-6">
          {availableAnimals.length === 0 ? (
            <p className="text-center text-gray-500 py-8">{t('geofencesPage.allAssigned')}</p>
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
              {t('geofencesPage.assign')} {selected.length > 0 ? `(${selected.length})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GeofenceGroupAssignmentModal({ geofence, availableGroups, onAssign, onClose }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState([]);

  const toggleGroup = (id) => {
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
            {t('geofencesPage.assignGroupsTo', { name: geofence.name })}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t('geofencesPage.groupsAvailable', { count: availableGroups.length })}
          </p>
        </div>

        <div className="p-6">
          {availableGroups.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">{t('geofencesPage.noGroupsAvailable')}</p>
              <a href="/animal-groups/new" className="text-amber-600 hover:text-amber-700 font-medium">
                {t('geofencesPage.createGroupFirst')}
              </a>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {availableGroups.map((group) => (
                <label
                  key={group.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selected.includes(group.id)
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(group.id)}
                    onChange={() => toggleGroup(group.id)}
                    className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: group.color }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{group.name}</p>
                    <p className="text-sm text-gray-500">
                      {group.animals?.length || 0} {t('groupsPage.animals')}
                    </p>
                  </div>
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
              {t('geofencesPage.assign')} {selected.length > 0 ? `(${selected.length})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
