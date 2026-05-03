import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MaterialSymbol } from 'react-material-symbols';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useI18n } from '../i18n';

function MapUpdater({ bounds, zoomPosition, center }) {
  const map = useMap();
  
  useEffect(() => {
    if (zoomPosition) {
      map.setView(zoomPosition, 16, { animate: true });
    } else if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    } else if (center) {
      map.setView(center, 10, { animate: true });
    }
  }, [bounds, zoomPosition, center, map]);
  
  return null;
}

function GeofenceDrawer({ isDrawing, drawMode, onComplete, drawingRectStart, onRectStartSet }) {
  const map = useMap();
  const [points, setPoints] = useState([]);
  
  useMapEvents({
    click(e) {
      if (!isDrawing) return;
      
      if (drawMode === 'polygon') {
        const newPoints = [...points, [e.latlng.lat, e.latlng.lng]];
        setPoints(newPoints);
      } else if (drawMode === 'circle' || drawMode === 'square') {
        const center = [e.latlng.lat, e.latlng.lng];
        onComplete({ type: drawMode, center });
      } else if (drawMode === 'rectangle') {
        if (!drawingRectStart) {
          onRectStartSet([e.latlng.lat, e.latlng.lng]);
        } else {
          onComplete({ type: 'rectangle', start: drawingRectStart, end: [e.latlng.lat, e.latlng.lng] });
          onRectStartSet(null);
        }
      }
    },
  });

  useEffect(() => {
    if (!isDrawing) {
      if (points.length >= 3) {
        onComplete({ type: 'polygon', points });
      }
      setPoints([]);
    }
  }, [isDrawing, onComplete]);

  if (!isDrawing) return null;

  if (drawMode === 'polygon' && points.length > 0) {
    return (
      <>
        {points.map((point, idx) => (
          <Marker key={idx} position={point} icon={L.divIcon({
            className: 'temp-marker',
            html: `<div style="width:12px;height:12px;background:#D4AF37;border:2px solid white;border-radius:50%;"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          })} />
        ))}
        <Polygon
          positions={points}
          pathOptions={{ color: '#D4AF37', fillColor: '#D4AF37', fillOpacity: 0.2 }}
        />
      </>
    );
  }

  return null;
}

const createAnimalIcon = (color, isSelected = false) => {
  const size = isSelected ? 40 : 32;
  const emoji = isSelected ? '🐪' : '🐪';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width:${size}px;
      height:${size}px;
      background:${color};
      border-radius:50%;
      border:${isSelected ? '4px' : '3px'} solid white;
      box-shadow:0 2px 12px ${isSelected ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)'};
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
      font-size:${isSelected ? '20px' : '16px'};
      transition:all 0.2s;
      ${isSelected ? 'z-index:1000 !important;' : ''}
    ">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2],
  });
};

export default function MapView() {
  const { t } = useI18n();
  const [animals, setAnimals] = useState([]);
  const [devices, setDevices] = useState([]);
  const [locationHistories, setLocationHistories] = useState({});
  const [geofences, setGeofences] = useState([]);
  const [groups, setGroups] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [zoomPosition, setZoomPosition] = useState(null);
  const [timeFilter, setTimeFilter] = useState(720);
  const [showPaths, setShowPaths] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);
  const [isDrawingGeofence, setIsDrawingGeofence] = useState(false);
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);
  const [pendingGeofencePoints, setPendingGeofencePoints] = useState([]);
  const [newGeofenceName, setNewGeofenceName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedGeofence, setSelectedGeofence] = useState('all');
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [alertTypeFilter, setAlertTypeFilter] = useState('all');
  const [newGeofenceAlertType, setNewGeofenceAlertType] = useState('both');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [mapCenter] = useState([24.4539, 54.3773]);
  const searchInputRef = useRef(null);
  const [geofenceStats, setGeofenceStats] = useState({});
  const [drawMode, setDrawMode] = useState('polygon');
  const [circleRadius, setCircleRadius] = useState(1);
  const [drawingCenter, setDrawingCenter] = useState(null);
  const [drawingRectStart, setDrawingRectStart] = useState(null);

  const fetchBaseData = useCallback(async () => {
    try {
      const [animalsRes, devicesRes, geofencesRes, alertsRes, groupsRes, usersRes] = await Promise.all([
        apiFetch('/api/animals?per_page=100'),
        apiFetch('/api/devices?per_page=100'),
        apiFetch('/api/geofences?include_inactive=true'),
        apiFetch('/api/geofence-alerts'),
        apiFetch('/api/animal-groups'),
        apiFetch('/api/users'),
      ]);
      
      if (animalsRes.ok && devicesRes.ok) {
        const animalsData = await animalsRes.json();
        const devicesData = await devicesRes.json();
        const geofencesData = geofencesRes.ok ? await geofencesRes.json() : { data: [] };
        const alertsData = alertsRes.ok ? await alertsRes.json() : { data: [] };
        const groupsData = groupsRes.ok ? await groupsRes.json() : { data: [] };
        const usersData = usersRes.ok ? await usersRes.json() : { data: [] };
        
        setAnimals(animalsData.data || []);
        setDevices(devicesData.data || []);
        setGeofences(geofencesData.data || []);
        setAlerts(alertsData.data || []);
        setGroups(groupsData.data || []);
        setOwners(usersData.data?.filter(u => u.role === 'Owner') || []);
        setLastUpdated(new Date());
        return animalsData.data || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch base data:', error);
      return [];
    }
  }, []);

  const fetchLocationHistory = useCallback(async (animalsList) => {
    if (!animalsList.length || loading) return;
    setLoading(true);
    try {
      const animalsWithDevices = animalsList.filter(a => a.device?.device_id || a.device_id);
      
      const historyPromises = animalsWithDevices.map(animal => 
        apiFetch(`/api/animals/${animal.id}/location-history?hours=${timeFilter}`)
          .then(res => res.ok ? res.json() : null)
      );
      
      const histories = await Promise.all(historyPromises);
      const historyMap = {};
      animalsWithDevices.forEach((animal, idx) => {
        if (histories[idx]) {
          let locations = histories[idx].locations || [];
          if (locations.length === 0 && animal.device?.gps_lat && animal.device?.gps_lng) {
            locations = [{
              latitude: animal.device.gps_lat,
              longitude: animal.device.gps_lng,
              recorded_at: animal.device.last_ping
            }];
          }
          historyMap[animal.id] = locations;
        } else if (animal.device?.gps_lat && animal.device?.gps_lng) {
          historyMap[animal.id] = [{
            latitude: animal.device.gps_lat,
            longitude: animal.device.gps_lng,
            recorded_at: animal.device.last_ping
          }];
        }
      });
      
      setLocationHistories(historyMap);
    } catch (error) {
      console.error('Failed to fetch location history:', error);
    } finally {
      setLoading(false);
    }
  }, [timeFilter]);

  useEffect(() => {
    fetchBaseData().then(animals => {
      if (animals.length > 0) {
        fetchLocationHistory(animals);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchLocationHistory(animals);
  }, [timeFilter, animals, fetchLocationHistory]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchBaseData().then(animals => {
          if (animals.length > 0) {
            fetchLocationHistory(animals);
          }
        });
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchBaseData, fetchLocationHistory]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSelectedAnimal(null);
        setZoomPosition(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getAnimalStatus = (animal) => {
    const temp = parseFloat(animal.baseline_temperature) || 38.5;
    if (temp > 39.5) return 'critical';
    if (temp > 39) return 'warning';
    return 'healthy';
  };

  const getAnimalGroupColor = (animal) => {
    if (animal.groups && animal.groups.length > 0) {
      return animal.groups[0].color || '#10b981';
    }
    return '#10b981';
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const pointInPolygon = (point, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      const intersect = ((yi > point[1]) !== (yj > point[1])) &&
        (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const getDistanceToGeofence = (animalPosition, geofenceCoords) => {
    if (!animalPosition || !geofenceCoords || geofenceCoords.length < 3) return null;
    
    if (pointInPolygon(animalPosition, geofenceCoords)) {
      return { distance: 0, status: 'inside' };
    }

    let minDist = Infinity;
    for (let i = 0; i < geofenceCoords.length; i++) {
      const j = (i + 1) % geofenceCoords.length;
      const p1 = geofenceCoords[i];
      const p2 = geofenceCoords[j];
      
      const dist = calculateDistance(
        animalPosition[0], animalPosition[1],
        p1[0], p1[1]
      );
      if (dist < minDist) minDist = dist;
    }
    
    return { distance: minDist, status: 'outside' };
  };

  const calculateGeofenceStats = useCallback(() => {
    const stats = {};
    
    geofences.forEach(geofence => {
      let coords = geofence.coordinates;
      if (typeof coords === 'string') {
        try { coords = JSON.parse(coords); } catch { coords = null; }
      }
      if (!coords || coords.length < 3) return;

      let totalDistance = 0;
      for (let i = 0; i < coords.length; i++) {
        const j = (i + 1) % coords.length;
        totalDistance += calculateDistance(coords[i][0], coords[i][1], coords[j][0], coords[j][1]);
      }

      const assignedAnimals = geofence.animals || [];
      let animalsInside = 0;
      let animalsOutside = 0;

      assignedAnimals.forEach(animal => {
        const positions = locationHistories[animal.id];
        if (positions && positions.length > 0) {
          const lastPos = [parseFloat(positions[positions.length - 1].latitude), parseFloat(positions[positions.length - 1].longitude)];
          if (pointInPolygon(lastPos, coords)) {
            animalsInside++;
          } else {
            animalsOutside++;
          }
        }
      });

      const centroid = coords.reduce((acc, coord) => [acc[0] + coord[0]/coords.length, acc[1] + coord[1]/coords.length], [0, 0]);

      stats[geofence.id] = {
        perimeter: totalDistance,
        area: totalDistance * totalDistance * 0.0001,
        animalsInside,
        animalsOutside,
        centroid,
      };
    });
    
    setGeofenceStats(stats);
  }, [geofences, locationHistories]);

  useEffect(() => {
    if (geofences.length > 0 && Object.keys(locationHistories).length > 0) {
      calculateGeofenceStats();
    }
  }, [geofences, locationHistories, calculateGeofenceStats]);

  const getPathPositions = (animalId) => {
    const history = locationHistories[animalId] || [];
    return history.map(loc => [parseFloat(loc.latitude), parseFloat(loc.longitude)]);
  };

  const getLastLocation = (animalId) => {
    const positions = getPathPositions(animalId);
    if (positions.length > 0) return positions[positions.length - 1];
    
    const animal = animals.find(a => a.id === animalId);
    if (animal?.device?.gps_lat && animal?.device?.gps_lng) {
      return [parseFloat(animal.device.gps_lat), parseFloat(animal.device.gps_lng)];
    }
    return null;
  };

  const getLastLocationTime = (animalId) => {
    const history = locationHistories[animalId] || [];
    if (history.length > 0) {
      return history[history.length - 1].recorded_at;
    }
    const animal = animals.find(a => a.id === animalId);
    return animal?.device?.last_ping || null;
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const isOnline = (animalId) => {
    const history = locationHistories[animalId] || [];
    if (history.length > 0) {
      const lastTime = new Date(history[history.length - 1].recorded_at);
      const now = new Date();
      return (now - lastTime) < 3600000;
    }
    const animal = animals.find(a => a.id === animalId);
    if (animal?.device?.last_ping) {
      const lastTime = new Date(animal.device.last_ping);
      const now = new Date();
      return (now - lastTime) < 3600000;
    }
    return false;
  };

  const hasAnyLocation = (animal) => {
    const pathPositions = getPathPositions(animal.id);
    if (pathPositions.length > 0) return true;
    return animal.device?.gps_lat && animal.device?.gps_lng;
  };

  const animalsWithPaths = animals.filter(a => (a.device?.device_id || a.device_id) && (hasAnyLocation(a) || (a.device?.gps_lat && a.device?.gps_lng)));
  const animalsWithoutPaths = animals.filter(a => !(a.device?.device_id || a.device_id) || (!hasAnyLocation(a) && (!a.device?.gps_lat || !a.device?.gps_lng)));

  const filteredAnimals = [...animalsWithPaths, ...animalsWithoutPaths].filter(animal => {
    const matchesSearch = searchQuery === '' || 
      animal.animal_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      animal.species?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      animal.breed?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || getAnimalStatus(animal) === statusFilter;
    
    const matchesGroup = selectedGroup === 'all' || 
      animal.groups?.some(g => g.id === parseInt(selectedGroup));
    
    const matchesGeofence = selectedGeofence === 'all' || 
      animal.geofences?.some(g => g.id === parseInt(selectedGeofence));
    
    const matchesOwner = selectedOwner === 'all' || 
      animal.owner_id === parseInt(selectedOwner) ||
      animal.owner?.id === parseInt(selectedOwner);
    
    return matchesSearch && matchesStatus && matchesGroup && matchesGeofence && matchesOwner;
  });

  const filteredAnimalsWithPaths = filteredAnimals.filter(a => animalsWithPaths.includes(a));
  const filteredAnimalsWithoutPaths = filteredAnimals.filter(a => animalsWithoutPaths.includes(a));

  const allPositions = [];
  filteredAnimalsWithPaths.forEach(animal => {
    getPathPositions(animal.id).forEach(p => allPositions.push(p));
  });

  const bounds = allPositions.length > 1 
    ? [
        [Math.min(...allPositions.map(p => p[0])), Math.min(...allPositions.map(p => p[1]))],
        [Math.max(...allPositions.map(p => p[0])), Math.max(...allPositions.map(p => p[1]))]
      ]
    : null;

  const handleGeofenceDrawComplete = (data) => {
    let points = [];
    
    if (data.type === 'polygon') {
      points = data.points;
    } else if (data.type === 'circle') {
      points = generateCircleCoordinates(data.center, circleRadius);
    } else if (data.type === 'square') {
      points = generateSquareCoordinates(data.center, circleRadius);
    } else if (data.type === 'rectangle') {
      points = generateRectangleCoordinates(data.start, data.end);
    }
    
    if (points.length >= 3) {
      setPendingGeofencePoints(points);
      setShowGeofenceModal(true);
      setIsDrawingGeofence(false);
      setDrawingCenter(null);
      setDrawingRectStart(null);
    }
  };

  const generateCircleCoordinates = (center, radiusKm) => {
    const points = [];
    const numPoints = 32;
    const centerLat = center[0];
    const centerLng = center[1];
    const radiusKmLat = radiusKm / 111.32;
    const radiusKmLng = radiusKm / (111.32 * Math.cos(centerLat * Math.PI / 180));
    
    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const lat = centerLat + radiusKmLat * Math.sin(angle);
      const lng = centerLng + radiusKmLng * Math.cos(angle);
      points.push([lat, lng]);
    }
    return points;
  };

  const generateSquareCoordinates = (center, sideKm) => {
    const halfSide = sideKm / 2;
    const halfSideLat = halfSide / 111.32;
    const halfSideLng = halfSide / (111.32 * Math.cos(center[0] * Math.PI / 180));
    
    return [
      [center[0] - halfSideLat, center[1] - halfSideLng],
      [center[0] - halfSideLat, center[1] + halfSideLng],
      [center[0] + halfSideLat, center[1] + halfSideLng],
      [center[0] + halfSideLat, center[1] - halfSideLng],
      [center[0] - halfSideLat, center[1] - halfSideLng],
    ];
  };

  const generateRectangleCoordinates = (start, end) => {
    return [
      start,
      [start[0], end[1]],
      end,
      [end[0], start[1]],
      start,
    ];
  };

  const saveGeofence = async () => {
    if (!newGeofenceName || pendingGeofencePoints.length < 3) return;
    
    try {
      const response = await apiFetch('/api/geofences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGeofenceName,
          coordinates: JSON.stringify(pendingGeofencePoints),
          color: '#D4AF37',
          alert_type: newGeofenceAlertType,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeofences([...geofences, data.geofence]);
        setNewGeofenceName('');
        setPendingGeofencePoints([]);
        setShowGeofenceModal(false);
        setNewGeofenceAlertType('both');
      }
    } catch (error) {
      console.error('Failed to save geofence:', error);
    }
  };

  const deleteGeofence = async (id) => {
    if (!confirm('Delete this geofence?')) return;
    try {
      await apiFetch(`/api/geofences/${id}`, { method: 'DELETE' });
      setGeofences(geofences.filter(g => g.id !== id));
    } catch (error) {
      console.error('Failed to delete geofence:', error);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await apiFetch(`/api/geofence-alerts/${alertId}/acknowledge`, { method: 'PATCH' });
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, is_acknowledged: true } : a));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const acknowledgeAllAlerts = async () => {
    try {
      await apiFetch('/api/geofence-alerts/deactivate-all', { method: 'POST' });
      setAlerts(alerts.map(a => ({ ...a, is_acknowledged: true })));
    } catch (error) {
      console.error('Failed to acknowledge all alerts:', error);
    }
  };

  const centerOnAllAnimals = () => {
    setZoomPosition(null);
    setSelectedAnimal(null);
  };

  const unacknowledgedAlerts = alerts.filter(a => !a.is_acknowledged);
  const statusCounts = {
    healthy: filteredAnimals.filter(a => getAnimalStatus(a) === 'healthy').length,
    warning: filteredAnimals.filter(a => getAnimalStatus(a) === 'warning').length,
    critical: filteredAnimals.filter(a => getAnimalStatus(a) === 'critical').length,
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center bg-[#fafaf5]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#002819] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[#404943] font-medium">{t('mapPage.loadingMap')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] relative overflow-hidden bg-[#fafaf5]">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-[1000] flex justify-between items-center px-4 py-2 bg-[#002819]/95 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#D4AF37] rounded-lg flex items-center justify-center">
              <MaterialSymbol icon="map" size={18} className="text-[#002819]" weight="bold" />
            </div>
            <span className="text-lg font-bold text-white font-['Manrope'] tracking-tight hidden sm:block">{t('mapPage.liveTracker')}</span>
          </div>
          
          {/* Search */}
          <div className="relative hidden lg:block">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('mapPage.search')}
              className="w-48 bg-white/10 border-none rounded-lg pl-10 pr-4 py-1.5 text-white text-sm placeholder:text-white/50 focus:ring-2 focus:ring-[#D4AF37] focus:bg-white/15 transition-all"
            />
            <MaterialSymbol icon="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
          </div>
        </div>
        
        {/* Filters Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-all ${showFilters ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70 hover:bg-white/15'}`}
            title="Toggle Filters"
          >
            <MaterialSymbol icon="filter_list" size={18} />
          </button>

          {showFilters && (
            <>
              {/* Owner Filter */}
              <select
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
                className="bg-white/10 border-none rounded-lg px-2 py-1.5 text-white text-xs cursor-pointer focus:ring-2 focus:ring-[#D4AF37] max-w-[120px]"
              >
                <option value="all">{t('mapPage.allOwners')}</option>
                {owners.map(owner => (
                  <option key={owner.id} value={owner.id}>{owner.name}</option>
                ))}
              </select>

              {/* Group Filter - filtered by owner */}
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="bg-white/10 border-none rounded-lg px-2 py-1.5 text-white text-xs cursor-pointer focus:ring-2 focus:ring-[#D4AF37] max-w-[120px]"
              >
                <option value="all">{t('mapPage.allGroups')}</option>
                {groups.filter(g => selectedOwner === 'all' || g.owner_id === parseInt(selectedOwner) || g.owner?.id === parseInt(selectedOwner)).map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>

              {/* Geofence Filter - filtered by owner */}
              <select
                value={selectedGeofence}
                onChange={(e) => setSelectedGeofence(e.target.value)}
                className="bg-white/10 border-none rounded-lg px-2 py-1.5 text-white text-xs cursor-pointer focus:ring-2 focus:ring-[#D4AF37] max-w-[130px]"
              >
                <option value="all">{t('mapPage.allFences')}</option>
                {geofences.filter(g => selectedOwner === 'all' || g.owner_id === parseInt(selectedOwner) || g.owner?.id === parseInt(selectedOwner)).map(geofence => (
                  <option key={geofence.id} value={geofence.id}>{geofence.name}</option>
                ))}
              </select>

              {/* Status Filters */}
              <div className="hidden xl:flex items-center gap-1 ml-1">
                {[
                  { status: 'healthy', color: 'bg-green-500', count: statusCounts.healthy },
                  { status: 'warning', color: 'bg-amber-500', count: statusCounts.warning },
                  { status: 'critical', color: 'bg-red-500', count: statusCounts.critical },
                ].map(({ status, color, count }) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                      statusFilter === status 
                        ? 'bg-white/20 text-white' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${color} ${status === 'critical' && count > 0 ? 'animate-pulse' : ''}`} />
                    <span>{count}</span>
                  </button>
                ))}
              </div>

              <div className="h-5 w-px bg-white/20 mx-1" />
            </>
          )}

          {/* Time Filter */}
          <select
            value={timeFilter}
            onChange={(e) => { 
              setTimeFilter(Number(e.target.value)); 
            }}
            className="bg-white/10 border-none rounded-lg px-2 py-1.5 text-white text-xs cursor-pointer focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value={6}>6h</option>
            <option value={12}>12h</option>
            <option value={24}>24h</option>
            <option value={48}>48h</option>
            <option value={168}>7d</option>
            <option value={720}>30d</option>
          </select>
          
          <div className="h-5 w-px bg-white/20" />
          
          {/* Toggle Buttons */}
          <button 
            onClick={() => setShowPaths(!showPaths)}
            className={`p-2 rounded-lg transition-all ${showPaths ? 'bg-[#D4AF37] text-[#002819]' : 'bg-white/10 text-white hover:bg-white/20'}`}
            title={showPaths ? t('mapPage.hidePaths') : t('mapPage.showPaths')}
          >
            <MaterialSymbol icon="route" size={18} />
          </button>
          <button 
            onClick={() => setShowGeofences(!showGeofences)}
            className={`p-2 rounded-lg transition-all ${showGeofences ? 'bg-[#D4AF37] text-[#002819]' : 'bg-white/10 text-white hover:bg-white/20'}`}
            title={showGeofences ? t('mapPage.hideFences') : t('mapPage.showFences')}
          >
            <MaterialSymbol icon="fence" size={18} />
          </button>
          <button 
            onClick={() => setShowLegend(!showLegend)}
            className={`p-2 rounded-lg transition-all ${showLegend ? 'bg-[#D4AF37] text-[#002819]' : 'bg-white/10 text-white hover:bg-white/20'}`}
            title={t('mapPage.legend')}
          >
            <MaterialSymbol icon="info" size={18} />
          </button>
          <button
            onClick={() => setShowAlertsPanel(!showAlertsPanel)}
            className={`relative p-2 rounded-lg transition-all ${showAlertsPanel ? 'bg-[#D4AF37] text-[#002819]' : 'bg-white/10 text-white hover:bg-white/20'}`}
            title="Alerts"
          >
            <MaterialSymbol icon="notifications" size={18} />
            {unacknowledgedAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {unacknowledgedAlerts.length > 9 ? '9+' : unacknowledgedAlerts.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Map */}
      <div className="absolute top-0 left-0 right-0 bottom-0 pt-14">
        <MapContainer center={mapCenter} zoom={10} style={{ height: '100%', width: '100%' }} className="z-0">
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapUpdater bounds={bounds} zoomPosition={zoomPosition} center={mapCenter} />
          <GeofenceDrawer isDrawing={isDrawingGeofence} drawMode={drawMode} onComplete={handleGeofenceDrawComplete} drawingRectStart={drawingRectStart} onRectStartSet={setDrawingRectStart} />
          
          {/* Geofences */}
          {showGeofences && geofences.map((geofence) => {
            let coords = geofence.coordinates;
            if (typeof coords === 'string') {
              try { coords = JSON.parse(coords); } catch { coords = null; }
            }
            if (!coords || !Array.isArray(coords) || coords.length < 3) return null;
            const isSelected = selectedGeofence === geofence.id;
            const stats = geofenceStats[geofence.id] || {};
            const perimeterKm = stats.perimeter ? stats.perimeter.toFixed(2) : '-';
            
            return (
              <Polygon
                key={geofence.id}
                positions={coords}
                pathOptions={{ 
                  color: geofence.color || '#D4AF37', 
                  fillColor: geofence.color || '#D4AF37', 
                  fillOpacity: isSelected ? 0.35 : 0.15, 
                  weight: isSelected ? 3 : 2,
                  dashArray: geofence.is_active ? null : '8,8'
                }}
              >
                <Popup>
                  <div className="p-3 min-w-[220px]">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-[#002819] text-sm">{geofence.name}</h3>
                      <span className={`w-3 h-3 rounded-full ${geofence.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-[10px] text-[#717973] uppercase">Perimeter</div>
                        <div className="text-sm font-bold text-[#002819]">{perimeterKm} km</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-[10px] text-[#717973] uppercase">Alert</div>
                        <div className="text-sm font-bold text-[#002819] capitalize">{geofence.alert_type}</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2">
                        <div className="text-[10px] text-[#717973] uppercase">Inside</div>
                        <div className="text-sm font-bold text-green-600">{stats.animalsInside || 0}</div>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-2">
                        <div className="text-[10px] text-[#717973] uppercase">Outside</div>
                        <div className="text-sm font-bold text-amber-600">{stats.animalsOutside || 0}</div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-[#404943] mb-2">
                      <span className="font-medium">{geofence.animals?.length || 0}</span> animals assigned
                      {geofence.groups?.length > 0 && (
                        <span> • <span className="font-medium">{geofence.groups.length}</span> groups</span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Link to={`/geofences`} className="flex-1 text-center text-xs bg-amber-100 text-amber-700 py-1.5 rounded font-bold hover:bg-amber-200">
                        Manage
                      </Link>
                      <button 
                        onClick={() => deleteGeofence(geofence.id)} 
                        className="flex-1 text-center text-xs bg-red-100 text-red-600 py-1.5 rounded font-bold hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </Popup>
              </Polygon>
            );
          })}
          
          {/* Animal Paths */}
          {showPaths && filteredAnimalsWithPaths.map((animal) => {
            const positions = getPathPositions(animal.id);
            if (positions.length < 2) return null;
            const isSelected = selectedAnimal?.id === animal.id;
            return (
              <Polyline
                key={`path-${animal.id}`}
                positions={positions}
                color={isSelected ? '#D4AF37' : getAnimalStatus(animal) === 'critical' ? '#ef4444' : getAnimalStatus(animal) === 'warning' ? '#f59e0b' : '#10b981'}
                weight={isSelected ? 4 : 2}
                opacity={isSelected ? 1 : 0.6}
              />
            );
          })}
          
          {/* Animal Markers */}
          {filteredAnimals.map((animal) => {
            const isWithPath = filteredAnimalsWithPaths.includes(animal);
            const isSelected = selectedAnimal?.id === animal.id;
            const position = getLastLocation(animal.id);
            
            if (!position) return null;
            
            const groupColor = getAnimalGroupColor(animal);
            return (
              <Marker
                key={animal.id}
                position={position}
                icon={createAnimalIcon(groupColor, isSelected)}
                eventHandlers={{ click: () => { setSelectedAnimal(animal); setZoomPosition(position); } }}
              >
                <Popup>
                  <div className="p-3 min-w-[200px]">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-[#002819]">{animal.animal_id}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${
                        isOnline(animal.id) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isOnline(animal.id) && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
                        {isOnline(animal.id) ? 'Live' : 'Offline'}
                      </span>
                    </div>
                    <p className="text-xs text-[#404943] mt-1">{animal.species} {animal.breed && `• ${animal.breed}`}</p>
                    <p className="text-xs text-[#717973] mt-1">Last: {formatLastSeen(getLastLocationTime(animal.id))}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-[#717973]">Temp</span>
                        <p className={`font-bold ${getAnimalStatus(animal) === 'critical' ? 'text-red-600' : 'text-[#002819]'}`}>
                          {animal.baseline_temperature || 'N/A'}°C
                        </p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-[#717973]">Points</span>
                        <p className="font-bold text-[#002819]">{getPathPositions(animal.id).length || (getLastLocation(animal.id) ? 1 : 0)}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Link to={`/animals/${animal.id}`} className="flex-1 text-center text-xs bg-[#002819] text-white py-1.5 rounded font-bold hover:bg-[#06402b]">
                        View Details
                      </Link>
                      <button onClick={() => { setSelectedAnimal(animal); setZoomPosition(position); }} className="flex-1 text-center text-xs border border-gray-200 py-1.5 rounded font-bold hover:bg-gray-50">
                        Center
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="absolute top-24 right-6 z-[1000] bg-white rounded-xl shadow-xl p-4 min-w-[200px]">
          <h4 className="font-bold text-[#002819] text-sm mb-3 flex items-center gap-2">
            <MaterialSymbol icon="info" size={16} />
            {t('mapPage.legend')}
          </h4>
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#717973] uppercase mb-1">{t('mapPage.animalGroups')}</div>
            {groups.slice(0, 6).map((group) => (
              <div key={group.id} className="flex items-center gap-2 text-xs">
                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: group.color }} />
                <span>{group.name}</span>
              </div>
            ))}
            {groups.length === 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="w-4 h-4 rounded-full bg-green-500" />
                <span>No Groups</span>
              </div>
            )}
            <div className="border-t border-gray-100 my-2" />
            <div className="text-xs font-semibold text-[#717973] uppercase mb-1">{t('mapPage.pathSelection')}</div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-8 h-0.5 bg-green-500" />
              <span>{t('mapPage.path')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-8 h-0.5 bg-[#D4AF37]" />
              <span>{t('mapPage.selected')}</span>
            </div>
            <div className="border-t border-gray-100 my-2" />
            <div className="text-xs font-semibold text-[#717973] uppercase mb-1">{t('mapPage.fenceArea')}</div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-4 h-4 rounded bg-[#D4AF37]/30 border-2 border-[#D4AF37]" />
              <span>{t('mapPage.perimeter')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-4 h-3 rounded-sm bg-green-500" />
              <span>{t('mapPage.animalInside')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-4 h-3 rounded-sm bg-amber-500" />
              <span>{t('mapPage.animalOutside')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Geofence Controls */}
      <div className="absolute left-4 top-24 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => setIsDrawingGeofence(!isDrawingGeofence)}
          className={`p-3 rounded-full shadow-lg transition-all ${isDrawingGeofence ? 'bg-[#D4AF37] text-[#002819] ring-4 ring-[#D4AF37]/30' : 'bg-white text-[#002819] hover:shadow-xl'}`}
          title={isDrawingGeofence ? 'Click to finish drawing' : 'Draw new geofence'}
        >
          <MaterialSymbol icon={isDrawingGeofence ? 'check' : 'hexagon'} size={24} />
        </button>
        <button
          onClick={centerOnAllAnimals}
          className="p-3 bg-white text-[#002819] rounded-full shadow-lg hover:shadow-xl transition-all"
          title="Center on all animals"
        >
          <MaterialSymbol icon="center_focus_strong" size={24} />
        </button>
        {isDrawingGeofence && (
          <div className="bg-white p-3 rounded-xl shadow-lg text-xs text-[#404943] max-w-[220px] animate-in fade-in">
            <p className="font-bold text-[#002819] flex items-center gap-1 mb-2">
              <MaterialSymbol icon="edit" size={14} />
              Drawing Mode
            </p>
            <div className="flex flex-wrap gap-1 mb-2">
              {[
                { mode: 'polygon', icon: 'hexagon', label: 'Poly' },
                { mode: 'rectangle', icon: 'crop_square', label: 'Rect' },
                { mode: 'square', icon: 'square', label: 'Square' },
                { mode: 'circle', icon: 'circle', label: 'Circle' },
              ].map(({ mode, icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setDrawMode(mode)}
                  className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                    drawMode === mode ? 'bg-[#D4AF37] text-[#002819]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={label}
                >
                  <MaterialSymbol icon={icon} size={12} />
                </button>
              ))}
            </div>
            {(drawMode === 'circle' || drawMode === 'square') && (
              <div className="mb-2">
                <label className="block text-[10px] text-gray-500 mb-1">Radius (km)</label>
                <input
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  value={circleRadius}
                  onChange={(e) => setCircleRadius(parseFloat(e.target.value) || 1)}
                  className="w-full bg-gray-100 border-none rounded px-2 py-1 text-xs"
                />
              </div>
            )}
            {drawMode === 'polygon' && (
              <p className="text-gray-600">Click on map to add points. Click checkmark to finish.</p>
            )}
            {drawMode === 'rectangle' && (
              <p className="text-gray-600">Click two corners of the rectangle.</p>
            )}
            {(drawMode === 'circle' || drawMode === 'square') && (
              <p className="text-gray-600">Click map center point.</p>
            )}
          </div>
        )}
      </div>

      {/* Animal Sidebar */}
      <div className={`absolute top-24 right-4 bottom-20 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[1000] transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-80'}`}>
        <div className="p-4 border-b border-[#eeeee9]">
          {!sidebarCollapsed && (
            <>
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[#002819]">Herd Status</h3>
                <button onClick={() => setSidebarCollapsed(true)} className="p-1 hover:bg-gray-100 rounded">
                  <MaterialSymbol icon="chevron_right" size={20} />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  {filteredAnimals.length} animals
                </span>
                {lastUpdated && (
                  <span className="text-xs text-[#717973]">
                    Updated {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>
              {(selectedOwner !== 'all' || selectedGroup !== 'all' || selectedGeofence !== 'all' || searchQuery || statusFilter !== 'all') && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {searchQuery && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full flex items-center gap-1">
                      "{searchQuery}"
                      <button onClick={() => setSearchQuery('')}><MaterialSymbol icon="close" size={12} /></button>
                    </span>
                  )}
                  {selectedOwner !== 'all' && (
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                      <MaterialSymbol icon="person" size={12} />
                      {owners.find(o => o.id === parseInt(selectedOwner))?.name}
                      <button onClick={() => setSelectedOwner('all')}><MaterialSymbol icon="close" size={12} /></button>
                    </span>
                  )}
                  {selectedGroup !== 'all' && (
                    <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                      <MaterialSymbol icon="group" size={12} />
                      {groups.find(g => g.id === selectedGroup)?.name}
                      <button onClick={() => setSelectedGroup('all')}><MaterialSymbol icon="close" size={12} /></button>
                    </span>
                  )}
                  {selectedGeofence !== 'all' && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                      <MaterialSymbol icon="fence" size={12} />
                      {geofences.find(g => g.id === selectedGeofence)?.name}
                      <button onClick={() => setSelectedGeofence('all')}><MaterialSymbol icon="close" size={12} /></button>
                    </span>
                  )}
                  {statusFilter !== 'all' && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full flex items-center gap-1 capitalize">
                      <MaterialSymbol icon="warning" size={12} />
                      {statusFilter}
                      <button onClick={() => setStatusFilter('all')}><MaterialSymbol icon="close" size={12} /></button>
                    </span>
                  )}
                </div>
              )}
            </>
          )}
          {sidebarCollapsed && (
            <button onClick={() => setSidebarCollapsed(false)} className="p-2 hover:bg-gray-100 rounded">
              <MaterialSymbol icon="chevron_left" size={20} />
            </button>
          )}
        </div>
        
        {!sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredAnimalsWithPaths.map((animal) => (
              <div
                key={animal.id}
                onClick={() => { setSelectedAnimal(animal); setZoomPosition(getLastLocation(animal.id)); }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedAnimal?.id === animal.id 
                    ? 'border-[#D4AF37] bg-amber-50/50 shadow-md' 
                    : 'border-[#eeeee9] hover:border-[#002819]/20 hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isOnline(animal.id) ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    <h4 className="font-bold text-[#002819] text-sm">{animal.animal_id}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                    isOnline(animal.id) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {isOnline(animal.id) ? 'Live' : 'Offline'}
                  </span>
                </div>
                <p className="text-xs text-[#717973] mb-2">{animal.species} {animal.breed && `• ${animal.breed}`}</p>
                <p className="text-[10px] text-[#717973] mb-3">Last: {formatLastSeen(getLastLocationTime(animal.id))}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <MaterialSymbol icon="thermostat" size={14} className={getAnimalStatus(animal) === 'critical' ? 'text-red-500' : 'text-[#717973]'} />
                    <p className={`text-xs font-bold mt-1 ${getAnimalStatus(animal) === 'critical' ? 'text-red-600' : 'text-[#002819]'}`}>
                      {animal.baseline_temperature || 'N/A'}°
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <MaterialSymbol icon="location_on" size={14} className="text-[#717973]" />
                    <p className="text-xs font-bold mt-1 text-[#002819]">{getPathPositions(animal.id).length}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <MaterialSymbol icon="schedule" size={14} className="text-[#717973]" />
                    <p className="text-xs font-bold mt-1 text-[#002819]">{timeFilter}h</p>
                  </div>
                </div>
                {animal.groups?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {animal.groups.map(g => (
                      <span key={g.id} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: g.color + '20', color: g.color }}>
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {filteredAnimalsWithoutPaths.length > 0 && (
              <div className="pt-4 border-t border-[#eeeee9]">
                <p className="text-xs text-[#717973] mb-3 font-medium flex items-center gap-2">
                  <MaterialSymbol icon="gps_off" size={14} />
                  No Tracking Data ({filteredAnimalsWithoutPaths.length})
                </p>
                {filteredAnimalsWithoutPaths.map((animal) => (
                  <div
                    key={animal.id}
                    onClick={() => setSelectedAnimal(animal)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all mb-2 ${
                      selectedAnimal?.id === animal.id 
                        ? 'border-[#D4AF37] bg-amber-50/50' 
                        : 'border-[#eeeee9] hover:border-[#002819]/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                      <span className="font-medium text-sm text-[#404943]">{animal.animal_id}</span>
                    </div>
                    <p className="text-xs text-[#717973] ml-4">{animal.species}</p>
                  </div>
                ))}
              </div>
            )}
            
            {filteredAnimals.length === 0 && (
              <div className="text-center py-8 text-[#717973]">
                <MaterialSymbol icon="search_off" size={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No animals found</p>
                <p className="text-xs mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Alerts Panel */}
      {showAlertsPanel && (
        <div className="absolute top-24 left-4 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden z-[1000] max-h-[50vh]">
          <div className="p-4 border-b border-[#eeeee9] bg-gradient-to-r from-amber-500 to-amber-600">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <MaterialSymbol icon="warning" size={20} />
                {t('mapPage.geofenceAlerts')}
              </h3>
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{unacknowledgedAlerts.length}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <select
                value={alertTypeFilter}
                onChange={(e) => setAlertTypeFilter(e.target.value)}
                className="flex-1 bg-white/50 border-none rounded-lg px-2 py-1.5 text-xs text-white"
              >
                <option value="all" className="text-gray-800">{t('mapPage.allTypes')}</option>
                <option value="entry" className="text-gray-800">{t('mapPage.entryOnly')}</option>
                <option value="exit" className="text-gray-800">{t('mapPage.exitOnly')}</option>
              </select>
              {unacknowledgedAlerts.length > 0 && (
                <button 
                  onClick={acknowledgeAllAlerts}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs text-white font-medium transition-all"
                >
                  {t('mapPage.ackAll')}
                </button>
              )}
            </div>
          </div>
          <div className="divide-y divide-[#eeeee9] max-h-[35vh] overflow-y-auto">
            {unacknowledgedAlerts.length === 0 ? (
              <div className="p-6 text-center text-[#717973]">
                <MaterialSymbol icon="check_circle" size={32} className="mx-auto mb-2 text-green-500" />
                <p className="text-sm font-medium">No alerts</p>
                <p className="text-xs">All clear!</p>
              </div>
            ) : (
              unacknowledgedAlerts.map((alert) => (
                <div key={alert.id} className={`p-4 ${alert.is_acknowledged ? 'opacity-50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${alert.type === 'entry' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      <MaterialSymbol icon={alert.type === 'entry' ? 'login' : 'logout'} size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-[#002819]">
                        {alert.animal?.animal_id || 'Unknown'} {alert.type === 'entry' ? 'entered' : 'exited'}
                      </p>
                      <p className="text-xs text-[#717973]">{alert.geofence?.name || 'Geofence'}</p>
                      <p className="text-xs text-[#717973]">{new Date(alert.triggered_at).toLocaleString()}</p>
                    </div>
                    {!alert.is_acknowledged && (
                      <button 
                        onClick={() => acknowledgeAlert(alert.id)} 
                        className="px-2 py-1 bg-[#002819] text-white text-xs rounded-lg font-medium hover:bg-[#06402b]"
                      >
                        Ack
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Geofence Modal */}
      {showGeofenceModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#002819]/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-full flex items-center justify-center">
                <MaterialSymbol icon="hexagon" size={20} className="text-[#D4AF37]" />
              </div>
              <h3 className="text-lg font-bold text-[#002819]">Create Geofence</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#717973] uppercase mb-2">Name</label>
                <input
                  type="text"
                  value={newGeofenceName}
                  onChange={(e) => setNewGeofenceName(e.target.value)}
                  placeholder="e.g., North Pasture"
                  className="w-full bg-[#eeeee9] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#D4AF37]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#717973] uppercase mb-2">Alert Type</label>
                <select 
                  value={newGeofenceAlertType}
                  onChange={(e) => setNewGeofenceAlertType(e.target.value)}
                  className="w-full bg-[#eeeee9] border-none rounded-xl px-4 py-3 text-sm"
                >
                  <option value="both">Alert on Entry & Exit</option>
                  <option value="entry">Alert on Entry Only</option>
                  <option value="exit">Alert on Exit Only</option>
                </select>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#717973]">
                <MaterialSymbol icon="place" size={16} />
                <span>{pendingGeofencePoints.length} boundary points selected</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => { setShowGeofenceModal(false); setPendingGeofencePoints([]); }} 
                className="flex-1 py-3 bg-[#eeeee9] text-[#002819] rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveGeofence} 
                disabled={!newGeofenceName} 
                className="flex-1 py-3 bg-[#002819] text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-[#06402b] transition-colors"
              >
                Save Geofence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Stats Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
        <div className="bg-white/95 backdrop-blur-md rounded-full px-5 py-2 shadow-xl flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-[#002819]">{filteredAnimalsWithPaths.length} tracked</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-400 rounded-full" />
            <span className="text-sm font-medium text-[#404943]">{filteredAnimalsWithoutPaths.length} untracked</span>
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2" title="Active Geofences">
            <span className="w-2 h-2 bg-[#D4AF37] rounded-sm" />
            <span className="text-sm text-[#717973]">{geofences.filter(g => g.is_active).length} fences</span>
          </div>
          {selectedGeofence !== 'all' && geofenceStats[selectedGeofence] && (
            <>
              <div className="h-4 w-px bg-gray-200" />
              <div className="flex items-center gap-1 text-xs" title="Selected fence perimeter">
                <MaterialSymbol icon="straighten" size={14} className="text-[#D4AF37]" />
                <span className="text-[#717973]">{geofenceStats[selectedGeofence].perimeter?.toFixed(1) || '-'} km</span>
              </div>
            </>
          )}
          <div className="h-4 w-px bg-gray-200" />
          <span className={`text-sm font-bold ${unacknowledgedAlerts.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {unacknowledgedAlerts.length} alerts
          </span>
          <div className="h-4 w-px bg-gray-200" />
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#002819] focus:ring-[#002819]"
            />
            <span className="text-xs text-[#717973]">Auto-refresh</span>
          </label>
        </div>
      </div>
    </div>
  );
}
