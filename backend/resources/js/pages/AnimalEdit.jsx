import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useI18n } from '../i18n';

export default function AnimalEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, dir } = useI18n();
  const isRtl = dir === 'rtl';
  const isNewAnimal = !id || id === 'new';
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    species: 'Camel',
    custom_species: '',
    breed: '',
    custom_breed: '',
    date_of_birth: '',
    gender: 'Male',
    color_markings: '',
    current_weight: '',
    baseline_temperature: '',
    normal_heart_rate: '',
    device_id: '',
    owner_id: '',
  });

  const breedOptions = {
    Camel: ['Majaheem', 'Wadhah', 'Suhail', 'Maqatir', 'Shalal', 'Bishah', 'Hawi', 'Other'],
    Goat: ['Boer', 'Nubian', 'Saanen', 'Alpine', 'Kiko', 'Spanish', 'Other'],
    Sheep: ['Awassi', 'Najdi', 'Hejazi', 'Rashidi', 'Muwassit', 'Other'],
    Cow: ['Holstein', 'Jersey', 'Angus', 'Hereford', 'Brahman', 'Other'],
    Dog: ['Saluki', 'Hound', 'Shepherd', 'Retriever', 'Terrier', 'Other'],
  };

  const getBreedOptions = () => {
    const speciesObj = speciesList.find(s => s.name === formData.species);
    if (speciesObj && speciesObj.breeds) {
      return speciesObj.breeds.map(b => b.name);
    }
    return breedOptions[formData.species] || ['Other'];
  };

  const getSpeciesOptions = () => {
    if (speciesList.length > 0) {
      return speciesList.map(s => s.name);
    }
    return ['Camel', 'Goat', 'Sheep', 'Cow', 'Dog'];
  };
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(!isNewAnimal);

  const [availableDevices, setAvailableDevices] = useState([]);
  const [owners, setOwners] = useState([]);
  const [currentDevice, setCurrentDevice] = useState(null);
  const [speciesList, setSpeciesList] = useState([]);
  const [currentOwner, setCurrentOwner] = useState(null);
  const [devicesLoading, setDevicesLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [animalsRes, devicesRes, usersRes, animalRes, speciesRes] = await Promise.all([
        apiFetch('/api/animals?per_page=100'),
        apiFetch('/api/devices?per_page=100'),
        apiFetch('/api/users'),
        isNewAnimal ? Promise.resolve({ ok: true, json: () => Promise.resolve({}) }) : apiFetch(`/api/animals/${id}`),
        apiFetch('/api/species'),
      ]);

      const animalsData = await animalsRes.json();
      const devicesData = await devicesRes.json();
      const usersData = await usersRes.json();
      const animalResponse = !isNewAnimal && animalRes.ok ? await animalRes.json() : null;
      const currentAnimal = animalResponse?.data || animalResponse || null;
      const speciesData = speciesRes.ok ? await speciesRes.json() : { data: [] };

      setSpeciesList(speciesData.data || []);

      const animals = animalsData.data || [];
      const devices = devicesData.data || [];
      const users = usersData.data || [];

      const ownersList = users.filter(u => u.role === 'Owner');
      setOwners(ownersList);

      const currentDeviceId = currentAnimal?.device_id;
      const currentDevice = currentDeviceId ? devices.find(d => d.device_id === currentDeviceId) : null;
      
      if (currentDevice) {
        setCurrentDevice(currentDevice);
      }

      const assignedDeviceIds = animals
        .filter(a => a.device_id && a.id !== parseInt(id || 0))
        .map(a => a.device_id);

      const available = devices.filter(d => 
        !assignedDeviceIds.includes(d.device_id)
      );
      
      if (currentDevice && !available.find(d => d.device_id === currentDeviceId)) {
        available.unshift(currentDevice);
      }
      
      setAvailableDevices(available);

      if (!isNewAnimal && currentAnimal) {
        const species = currentAnimal.species || 'Camel';
        const allSpeciesOptions = ['Camel', 'Goat', 'Sheep', 'Cow', 'Dog'];
        const isPredefinedSpecies = allSpeciesOptions.includes(species);
        const breed = currentAnimal.breed || '';
        const allBreeds = breedOptions[species] || [];
        const isPredefinedBreed = allBreeds.includes(breed);
        
        setFormData({
          name: currentAnimal.name || '',
          species: isPredefinedSpecies ? species : 'Other',
          custom_species: isPredefinedSpecies ? '' : species,
          breed: isPredefinedBreed ? breed : 'Other',
          custom_breed: isPredefinedBreed ? '' : breed,
          date_of_birth: currentAnimal.date_of_birth || '',
          gender: currentAnimal.gender || 'Male',
          color_markings: currentAnimal.color_markings || '',
          current_weight: currentAnimal.current_weight || '',
          baseline_temperature: currentAnimal.baseline_temperature || '',
          normal_heart_rate: currentAnimal.normal_heart_rate || '',
          device_id: currentAnimal.device_id || '',
          owner_id: currentAnimal.owner_id || '',
        });
        if (currentAnimal.identification_photo) {
          setExistingImage(currentAnimal.identification_photo);
          setImagePreview(currentAnimal.identification_photo);
        }
        if (currentAnimal.owner_id) {
          const owner = users.find(u => u.id === currentAnimal.owner_id);
          if (owner) setCurrentOwner(owner);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
      setDevicesLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'species') {
      setFormData((prev) => ({ ...prev, species: value, breed: '', custom_breed: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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

  const handleOwnerChange = async (e) => {
    const ownerId = e.target.value;
    setFormData((prev) => ({ ...prev, owner_id: ownerId }));
    if (ownerId) {
      const ownersRes = await apiFetch('/api/users');
      const ownersData = await ownersRes.json();
      const owner = ownersData.data?.find(u => u.id === parseInt(ownerId));
      setCurrentOwner(owner);
    } else {
      setCurrentOwner(null);
    }
  };

  const handleDeviceChange = async (e) => {
    const deviceId = e.target.value;
    setFormData((prev) => ({ ...prev, device_id: deviceId }));
    if (deviceId) {
      const devicesRes = await apiFetch('/api/devices');
      const devicesData = await devicesRes.json();
      const device = devicesData.data?.find(d => d.device_id === deviceId);
      setCurrentDevice(device);
    } else {
      setCurrentDevice(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const url = isNewAnimal ? '/api/animals' : `/api/animals/${id}`;
      const method = isNewAnimal ? 'POST' : 'PUT';

      const submitData = new FormData();

      Object.keys(formData).forEach(key => {
        if (key === 'species') {
          const speciesValue = formData.species === 'Other' ? formData.custom_species : formData.species;
          if (speciesValue) submitData.append(key, speciesValue);
        } else if (key === 'breed') {
          const breedValue = formData.breed === 'Other' ? formData.custom_breed : formData.breed;
          if (breedValue) submitData.append(key, breedValue);
        } else if (formData[key] !== '' && formData[key] !== null && key !== 'identification_photo' && key !== 'custom_breed' && key !== 'custom_species') {
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
        setMessage({ type: 'success', text: isNewAnimal ? 'Animal created successfully!' : 'Animal updated successfully!' });
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this animal? This action cannot be undone.')) return;
    try {
      const response = await apiFetch(`/api/animals/${id}`, { method: 'DELETE' });
      if (response.ok) navigate('/animals');
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete animal' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#002819] border-t-transparent rounded-full" />
      </div>
    );
  }

  const modifiedFieldsCount = Object.values(formData).filter(v => v !== '' && v !== null).length;

  return (
    <form onSubmit={handleSubmit} className="min-h-screen pb-24">
      {/* Top Bar */}
      <header className="w-full sticky top-0 z-40 bg-stone-50/80 backdrop-blur-xl flex justify-between items-center px-8 py-4 shadow-[0px_12px_32px_rgba(6,64,43,0.06)]">
        <div className="flex items-center gap-6">
          <button type="button" onClick={() => navigate('/animals')} className="p-2 text-stone-500 hover:bg-stone-200/50 rounded-full transition-colors">
            <MaterialSymbol icon="arrow_back" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#06402b] rounded-xl flex items-center justify-center">
              <MaterialSymbol icon="pets" className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest">{t('nav.animals')}</p>
              <h1 className="text-lg font-extrabold text-emerald-900">
                {isNewAnimal ? t('animals.addAnimal') : `${t('common.edit')}: ${formData.breed || formData.species}`}
              </h1>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/animals')} className="px-6 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-bold hover:bg-stone-100 transition-colors text-sm">
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 rounded-xl bg-[#002819] text-white font-bold hover:bg-[#06402b] shadow-lg shadow-[#002819]/20 transition-all text-sm flex items-center gap-2 disabled:opacity-50">
            <MaterialSymbol icon="save" size={18} />
            {isSubmitting ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="p-8">
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-[#cfe5d6] text-[#002819]' : 'bg-[#ffdad6] text-[#93000a]'}`}>
            {message.text}
          </div>
        )}

        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {/* Animal Information */}
            <section className="bg-white p-8 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <MaterialSymbol icon="info" className="text-[#735c00]" />
                <h3 className="text-xl font-bold text-emerald-900">{t('animals.animalDetails')}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-500 uppercase tracking-widest px-1">{t('animals.name')}</label>
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder={t('animals.namePlaceholder')}
                    className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3 text-emerald-900 font-semibold focus:ring-2 focus:ring-[#06402b]/10" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-500 uppercase tracking-widest px-1">Species</label>
                  <select name="species" value={formData.species} onChange={handleChange} className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3 text-emerald-900 font-semibold focus:ring-2 focus:ring-[#06402b]/10">
                    {getSpeciesOptions().map(species => (
                      <option key={species} value={species}>{species}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                  {formData.species === 'Other' && (
                    <input 
                      name="custom_species" 
                      value={formData.custom_species} 
                      onChange={handleChange} 
                      placeholder={t('animals.enterCustomSpecies')}
                      className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3 text-emerald-900 font-semibold focus:ring-2 focus:ring-[#06402b]/10 mt-2" 
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-500 uppercase tracking-widest px-1">{t('animals.breed')}</label>
                  <select 
                    name="breed" 
                    value={formData.breed} 
                    onChange={handleChange} 
                    className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3 text-emerald-900 font-semibold focus:ring-2 focus:ring-[#06402b]/10"
                  >
                    <option value="">{t('common.select')} {t('animals.breed')}</option>
                    {getBreedOptions().map(breed => (
                      <option key={breed} value={breed}>{breed}</option>
                    ))}
                  </select>
                  {formData.breed === 'Other' && (
                    <input 
                      name="custom_breed" 
                      value={formData.custom_breed} 
                      onChange={handleChange} 
                      placeholder={t('animals.enterCustomBreed')} 
                      className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3 text-emerald-900 font-semibold focus:ring-2 focus:ring-[#06402b]/10 mt-2" 
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-500 uppercase tracking-widest px-1">{t('animalDetailsPage.dateOfBirth')}</label>
                  <input name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} type="date" className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3 text-emerald-900 font-semibold focus:ring-2 focus:ring-[#06402b]/10" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-500 uppercase tracking-widest px-1">{t('animals.gender')}</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3 text-emerald-900 font-semibold focus:ring-2 focus:ring-[#06402b]/10">
                    <option value="Male">{t('common.male')}</option>
                    <option value="Female">{t('common.female')}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-500 uppercase tracking-widest px-1">{t('animals.weight')} (kg)</label>
                  <input name="current_weight" value={formData.current_weight} onChange={handleChange} type="number" step="0.01" placeholder="0.00" className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3 text-emerald-900 font-semibold focus:ring-2 focus:ring-[#06402b]/10" />
                </div>
              </div>
            </section>

            {/* Physical Characteristics */}
            <section className="bg-white p-8 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <MaterialSymbol icon="photo_camera" className="text-[#735c00]" />
                <h3 className="text-xl font-bold text-emerald-900">{t('animals.physicalCharacteristics')}</h3>
              </div>
              <div className="flex flex-col md:flex-row gap-8">
                {/* Photo Upload */}
                <div className="w-full md:w-64">
                  <div className="relative group aspect-square rounded-xl overflow-hidden shadow-inner bg-stone-100 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Animal" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#E3E3DE] to-[#cfe5d6]">
                        <MaterialSymbol icon="add_a_photo" size={48} className="text-[#002819]/20 mb-2" />
                        <p className="text-xs text-stone-400 font-medium">{t('animals.uploadPhoto')}</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-[#002819]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="text-white text-center">
                        <MaterialSymbol icon="upload" className="text-4xl mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">{t('animals.changePhoto')}</p>
                      </div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </div>
                  {imagePreview && (
                    <button type="button" onClick={() => { setImagePreview(null); setFormData((prev) => ({ ...prev, identification_photo: null })); }} className="mt-2 w-full py-2 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                      {t('animals.removePhoto')}
                    </button>
                  )}
                </div>

                {/* Color/Markings */}
                <div className="flex-1 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-500 uppercase tracking-widest px-1">{t('animals.colorMarkings')}</label>
                    <textarea name="color_markings" value={formData.color_markings} onChange={handleChange} rows="6" placeholder={t('animals.colorMarkingsPlaceholder')} className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3 text-emerald-900 font-medium focus:ring-2 focus:ring-[#06402b]/10 resize-none" />
                  </div>
                </div>
              </div>
            </section>

            {/* Health Benchmarks */}
            <section className="bg-white p-8 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <MaterialSymbol icon="monitor_heart" className="text-[#735c00]" />
                  <h3 className="text-xl font-bold text-emerald-900">{t('animals.healthBenchmarks')}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  {t('animals.liveTelemetry')}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-500 uppercase tracking-widest px-1">{t('animalDetailsPage.baselineTemp')} (°C)</label>
                    <input name="baseline_temperature" value={formData.baseline_temperature} onChange={handleChange} type="number" step="0.1" placeholder="38.5" className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3 text-emerald-900 font-semibold focus:ring-2 focus:ring-[#06402b]/10" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-500 uppercase tracking-widest px-1">{t('animalDetailsPage.normalHeartRate')} (BPM)</label>
                    <input name="normal_heart_rate" value={formData.normal_heart_rate} onChange={handleChange} type="number" placeholder="45" className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3 text-emerald-900 font-semibold focus:ring-2 focus:ring-[#06402b]/10" />
                  </div>
                </div>
                <div className="bg-stone-50 p-6 rounded-xl border border-stone-100">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">{t('animals.quickReference')}</p>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-stone-600">{t('animals.normalTempRange')}</span>
                      <span className="text-xs font-bold text-emerald-900">37.5 - 39.2°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-stone-600">{t('animalDetailsPage.normalHeartRate')}</span>
                      <span className="text-xs font-bold text-emerald-900">30-50 BPM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-stone-600">{t('animals.dailyMovement')}</span>
                      <span className="text-xs font-bold text-emerald-900">2-8 km</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Danger Zone */}
            {!isNewAnimal && (
              <div className="bg-red-50/50 p-8 rounded-xl border border-red-100/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-red-800 font-bold">{t('animals.lifecycleManagement')}</h4>
                    <p className="text-xs text-red-600/70 mt-1 font-medium">{t('animals.deleteAnimalConfirm').split('?')[0]}.</p>
                  </div>
                  <button type="button" onClick={handleDelete} className="px-6 py-2.5 rounded-xl border-2 border-red-200 text-red-600 font-extrabold hover:bg-red-600 hover:text-white transition-all text-xs uppercase tracking-widest">
                    {t('animals.deleteAnimal')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            {/* Animal Assignment - Matching Device Edit Design */}
            {!isNewAnimal && (
              <section className="bg-[#eeeee9] rounded-[1.5rem] p-6 transition-all hover:shadow-md">
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-[#002819] bg-white p-2 rounded-xl">link</span>
                  <h4 className="text-lg font-bold font-['Manrope'] text-[#002819]">{t('animals.deviceAssignment')}</h4>
                </div>
                <div className="flex flex-col items-center gap-4 p-5 bg-white rounded-2xl shadow-sm border border-[#cfe5d6]/30">
                  {currentDevice ? (
                    <>
                      <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border-2 border-white flex-shrink-0">
                        {existingImage || imagePreview ? (
                          <img src={imagePreview || existingImage} alt="Animal" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#E3E3DE] to-[#cfe5d6] flex items-center justify-center">
                            <MaterialSymbol icon="pets" size={40} className="text-[#002819]/20" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow text-center">
                        <h5 className="text-base font-bold text-[#002819]">{formData.breed || formData.species} {formData.animal_id || ''}</h5>
                        <p className="text-xs text-[#404943] mb-1">{formData.species} {formData.breed && `• ${formData.breed}`} {formData.gender && `• ${formData.gender}`}</p>
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">{t('animals.currentlyLinked')}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full">
                        <button 
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, device_id: '' }))}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-[#c0c9c1] text-xs font-semibold text-[#404943] hover:bg-[#eeeee9] transition-colors"
                        >
                          {t('animals.unassignDevice')}
                        </button>
                        <button 
                          type="button"
                          onClick={() => document.querySelector('select[name="device_id"]')?.focus()}
                          className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#002819] text-white hover:bg-[#06402b] transition-colors"
                        >
                          {t('animals.changeDevice')}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-2xl bg-[#eeeee9] flex items-center justify-center shadow-inner">
                        <MaterialSymbol icon="link_off" size={40} className="text-[#002819]/30" />
                      </div>
                      <div className="flex-grow text-center">
                        <h5 className="text-base font-bold text-[#404943]">{t('animals.noDeviceAssignedAlt')}</h5>
                        <p className="text-xs text-[#717973] mb-1">{t('animals.linkDevice')}</p>
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#c0c9c1]"></span>
                          <span className="text-[10px] font-bold uppercase text-[#717973] tracking-wider">{t('animals.notLinked')}</span>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => document.querySelector('select[name="device_id"]')?.focus()}
                        className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#002819] text-white hover:bg-[#06402b] transition-colors"
                      >
                        {t('animals.assignDeviceBtn')}
                      </button>
                    </>
                  )}
                </div>
              </section>
            )}

            {/* Device Connectivity */}
            <section className="bg-white p-6 rounded-xl shadow-sm">
              <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-widest mb-4">{t('animals.deviceConnectivity')}</h4>
              {devicesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-[#002819] border-t-transparent rounded-full" />
                </div>
              ) : (
                <>
                  <select name="device_id" value={formData.device_id} onChange={handleDeviceChange} className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3 text-emerald-900 font-semibold mb-4">
                    <option value="">{t('animals.noDevice')}</option>
                    {availableDevices.map(device => (
                      <option key={device.id} value={device.device_id}>
                        {device.device_id} ({device.status})
                      </option>
                    ))}
                  </select>
                  {currentDevice && (
                    <div className="bg-stone-50 rounded-xl p-4 flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <MaterialSymbol icon="router" className="text-emerald-900" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-emerald-900">{currentDevice.name || 'Oasis Tracker'}</p>
                        <p className="text-[10px] text-emerald-600 font-bold">
                          {currentDevice.status === 'online' ? t('devices.online') : t('devices.offline')} • Battery {currentDevice.battery_level}%
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Ownership */}
            <section className="bg-white p-6 rounded-xl shadow-sm">
              <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-widest mb-4">{t('animals.ownership')}</h4>
              {devicesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-[#002819] border-t-transparent rounded-full" />
                </div>
              ) : (
                <>
                  <select name="owner_id" value={formData.owner_id} onChange={handleOwnerChange} className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3 text-emerald-900 font-semibold mb-4">
                    <option value="">{t('animals.selectOwner')}</option>
                    {owners.map(owner => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name}
                      </option>
                    ))}
                  </select>
                  {currentOwner && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#06402b]/10 overflow-hidden">
                        {currentOwner.avatar_url ? (
                          <img src={currentOwner.avatar_url} alt={currentOwner.name} className="w-full h-full object-cover" />
                        ) : (
                          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentOwner.name)}&background=002819&color=D4AF37`} alt={currentOwner.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-900">{currentOwner.name}</p>
                        <p className="text-[10px] text-stone-500">{t('animals.primaryOwner')}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Quick Tips */}
            <section className="bg-stone-900 p-6 rounded-xl text-stone-300 relative overflow-hidden">
              <MaterialSymbol icon="lightbulb" className="absolute -right-4 -bottom-4 text-white/5 text-8xl rotate-12" />
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">{t('animals.systemInsight')}</h4>
              <p className="text-xs leading-relaxed font-medium">
                Regular updates to animal health benchmarks ensure AI anomaly detection remains accurate. We recommend auditing these fields every 3 months.
              </p>
            </section>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-6 right-8 left-[calc(16rem+2rem)] pointer-events-none md:flex hidden">
        <div className="bg-white/80 backdrop-blur-md border border-stone-200/50 p-4 rounded-2xl shadow-2xl flex-1 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#002819]/10 rounded-lg flex items-center justify-center">
              <MaterialSymbol icon="history" className="text-[#002819]" style={{ fontVariationSettings: "'FILL' 1" }} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{t('animals.unsavedChanges')}</p>
              <p className="text-xs font-black text-emerald-900">{t('animals.fieldsModified')}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/animals')} className="px-6 py-2 text-xs font-black text-stone-500 uppercase tracking-widest hover:text-emerald-900 transition-colors">
              {t('animals.discard')}
            </button>
            <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-[#002819] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#002819]/20 hover:bg-[#06402b] transition-all disabled:opacity-50">
              {isSubmitting ? t('common.loading') : t('animals.applyUpdate')}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
