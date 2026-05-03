import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../../utils/api';

const initialFormData = {
  species: 'Camel',
  breed: '',
  date_of_birth: '',
  gender: 'Male',
  color_markings: '',
  current_weight: '',
  baseline_temperature: '',
  normal_heart_rate: '',
  device_id: '',
  owner_id: '',
};

export default function AnimalForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState(initialFormData);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [owners, setOwners] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(true);

  useEffect(() => {
    fetchDevicesAndAnimals();
    if (isEditMode) {
      fetchAnimal();
    }
  }, [id]);

  const fetchDevicesAndAnimals = async () => {
    try {
      const [animalsRes, devicesRes, usersRes] = await Promise.all([
        apiFetch('/api/animals'),
        apiFetch('/api/devices'),
        apiFetch('/api/users'),
      ]);
      
      const animalsData = await animalsRes.json();
      const devicesData = await devicesRes.json();
      const usersData = await usersRes.json();
      
      const animals = animalsData.data || [];
      const devices = devicesData.data || [];
      const users = usersData.data || [];
      
      const ownersList = users.filter(u => u.role === 'Owner');
      setOwners(ownersList);
      
      const assignedDeviceIds = animals
        .filter(a => a.device_id && (!isEditMode || a.id !== parseInt(id)))
        .map(a => a.device_id);
      
      const available = devices.filter(d => !assignedDeviceIds.includes(d.device_id));
      setAvailableDevices(available);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setDevicesLoading(false);
    }
  };

  const fetchAnimal = async () => {
    try {
      const response = await apiFetch(`/api/animals/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          species: data.species || 'Camel',
          breed: data.breed || '',
          date_of_birth: data.date_of_birth || '',
          gender: data.gender || 'Male',
          color_markings: data.color_markings || '',
          current_weight: data.current_weight || '',
          baseline_temperature: data.baseline_temperature || '',
          normal_heart_rate: data.normal_heart_rate || '',
          device_id: data.device_id || '',
          owner_id: data.owner_id || '',
        });
        if (data.identification_photo) {
          setExistingImage(data.identification_photo);
          setImagePreview(data.identification_photo);
        }
      }
    } catch (error) {
      console.error('Failed to fetch animal:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image must be less than 10MB' });
        return;
      }
      setFormData((prev) => ({ ...prev, identification_photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, identification_photo: null }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const url = isEditMode ? `/api/animals/${id}` : '/api/animals';
      const method = isEditMode ? 'PUT' : 'POST';

      const submitData = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null && key !== 'identification_photo') {
          submitData.append(key, formData[key]);
        }
      });
      
      if (formData.identification_photo instanceof File) {
        submitData.append('identification_photo', formData.identification_photo);
      }

      const response = await apiFetch(url, {
        method,
        body: submitData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: isEditMode ? 'Animal updated successfully!' : 'Animal created successfully!' });
        setTimeout(() => navigate('/animals'), 1500);
      } else {
        setMessage({ type: 'error', text: data.message || `Error: ${response.status}` });
      }
    } catch (error) {
      console.error('Submit error:', error);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/animals');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleCancel} className="p-2 hover:bg-[#eeeee9] rounded-lg transition-colors">
            <MaterialSymbol icon="arrow_back" size={24} className="text-[#404943]" />
          </button>
          <div>
            <h2 className="text-3xl font-extrabold font-['Manrope'] text-[#002819] tracking-tight">
              {isEditMode ? 'Edit Animal' : 'Add New Animal'}
            </h2>
            <p className="text-[#404943] mt-1">
              {isEditMode ? 'Update animal information' : 'Establish a new digital identity'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleCancel} className="px-6 py-2.5 rounded-xl border border-[#c0c9c1] text-[#1a1c19] hover:bg-[#e8e8e3] transition-colors font-semibold text-sm">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-2.5 rounded-xl bg-gradient-to-br from-[#002819] to-[#06402B] text-white shadow-xl shadow-[#002819]/20 hover:scale-[1.02] active:scale-95 transition-all font-bold text-sm flex items-center gap-2 disabled:opacity-50">
            <MaterialSymbol icon="save" size={18} />
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Animal' : 'Save Animal'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-[#cfe5d6] text-[#002819]' : 'bg-[#ffdad6] text-[#93000a]'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Animal Info */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#002819] mb-6">Animal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#717973] uppercase tracking-wider">Species</label>
                <select name="species" value={formData.species} onChange={handleChange} className="w-full bg-[#eeeee9] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#002819]/20">
                  <option value="Camel">Camel</option>
                  <option value="Goat">Goat</option>
                  <option value="Sheep">Sheep</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#717973] uppercase tracking-wider">Breed</label>
                <input name="breed" value={formData.breed} onChange={handleChange} placeholder="e.g. Majaheem, Wadhah" className="w-full bg-[#eeeee9] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#002819]/20" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#717973] uppercase tracking-wider">Date of Birth</label>
                <input name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} type="date" className="w-full bg-[#eeeee9] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#002819]/20" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#717973] uppercase tracking-wider">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-[#eeeee9] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#002819]/20">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
          </div>

          {/* Physical Characteristics */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#002819] mb-6">Physical Characteristics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#717973] uppercase tracking-wider">Color/Markings</label>
                <textarea name="color_markings" value={formData.color_markings} onChange={handleChange} rows="3" placeholder="Describe distinctive markings..." className="w-full bg-[#eeeee9] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#002819]/20 resize-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#717973] uppercase tracking-wider">Current Weight (kg)</label>
                <input name="current_weight" value={formData.current_weight} onChange={handleChange} type="number" step="0.01" placeholder="0.00" className="w-full bg-[#eeeee9] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#002819]/20" />
              </div>
            </div>
          </div>

          {/* Health Benchmarks */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#002819] mb-6">Health Benchmarks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#717973] uppercase tracking-wider">Baseline Temperature (°C)</label>
                <input name="baseline_temperature" value={formData.baseline_temperature} onChange={handleChange} type="number" step="0.1" placeholder="38.5" className="w-full bg-[#eeeee9] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#002819]/20" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#717973] uppercase tracking-wider">Normal Heart Rate (BPM)</label>
                <input name="normal_heart_rate" value={formData.normal_heart_rate} onChange={handleChange} type="number" placeholder="45" className="w-full bg-[#eeeee9] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#002819]/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Image Upload */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#002819] mb-4">Identification Photo</h3>
            <div className="space-y-4">
              {imagePreview ? (
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={removeImage} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600">
                    <MaterialSymbol icon="close" size={16} />
                  </button>
                </div>
              ) : (
                <div className="relative aspect-[4/3] rounded-xl bg-[#f4f4ef] border-2 border-dashed border-[#c0c9c1] flex flex-col items-center justify-center cursor-pointer hover:bg-[#e8e8e3] transition-colors">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <MaterialSymbol icon="add_a_photo" size={40} className="text-[#717973] mb-2" />
                  <p className="text-xs text-[#717973] text-center px-4">Click to upload photo<br />PNG, JPG up to 10MB</p>
                </div>
              )}
              {imagePreview && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-2 bg-[#eeeee9] text-[#002819] rounded-lg text-sm font-semibold hover:bg-[#e8e8e3] flex items-center justify-center gap-2">
                  <MaterialSymbol icon="refresh" size={18} />
                  Change Photo
                </button>
              )}
            </div>
          </div>

          {/* Device Assignment */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#002819] mb-4">Device Assignment</h3>
            {devicesLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-[#002819] border-t-transparent rounded-full" />
              </div>
            ) : (
              <>
                <select name="device_id" value={formData.device_id} onChange={handleChange} className="w-full bg-[#eeeee9] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#002819]/20">
                  <option value="">No Device</option>
                  {availableDevices.map(device => (
                    <option key={device.id} value={device.device_id}>
                      {device.device_id} ({device.status})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#717973] mt-2">
                  {availableDevices.length} device(s) available
                </p>
              </>
            )}
          </div>

          {/* Owner Assignment */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#002819] mb-4">Owner Assignment</h3>
            {devicesLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-[#002819] border-t-transparent rounded-full" />
              </div>
            ) : (
              <>
                <select name="owner_id" value={formData.owner_id} onChange={handleChange} className="w-full bg-[#eeeee9] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#002819]/20">
                  <option value="">Select Owner</option>
                  {owners.map(owner => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name} ({owner.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#717973] mt-2">
                  {owners.length} owner(s) available
                </p>
              </>
            )}
          </div>

          {/* Delete Button for Edit Mode */}
          {isEditMode && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-red-200">
              <h3 className="text-lg font-bold text-red-600 mb-4">Danger Zone</h3>
              <p className="text-xs text-[#717973] mb-4">This action cannot be undone.</p>
              <button type="button" onClick={async () => {
                if (!confirm('Are you sure you want to delete this animal?')) return;
                try {
                  const response = await apiFetch(`/api/animals/${id}`, { method: 'DELETE' });
                  if (response.ok) navigate('/animals');
                } catch (error) {
                  setMessage({ type: 'error', text: 'Failed to delete animal' });
                }
              }} className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 flex items-center justify-center gap-2">
                <MaterialSymbol icon="delete" size={18} />
                Delete Animal
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
