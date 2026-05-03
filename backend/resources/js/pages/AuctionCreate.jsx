import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useI18n } from '../i18n';

export default function AuctionCreate() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const preselectedAnimalId = searchParams.get('animal');
  
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    animal_id: '',
    title: '',
    starting_price: '',
    reserve_price: '',
    description: '',
    duration_hours: 48,
  });

  useEffect(() => {
    fetchAnimals();
  }, []);

  const fetchAnimals = async () => {
    try {
      const response = await apiFetch('/api/animals?per_page=100');
      if (response.ok) {
        const data = await response.json();
        const animalsData = data.data || [];
        setAnimals(animalsData);
        
        if (preselectedAnimalId) {
          const animal = animalsData.find(a => a.id === parseInt(preselectedAnimalId));
          if (animal) {
            setFormData(prev => ({
              ...prev,
              animal_id: animal.id,
              title: `${animal.species} ${animal.breed || ''} - ${animal.animal_id}`.trim(),
            }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch animals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await apiFetch('/api/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          starting_price: parseFloat(formData.starting_price),
          reserve_price: formData.reserve_price ? parseFloat(formData.reserve_price) : null,
          duration_hours: parseInt(formData.duration_hours),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Auction created successfully!' });
        setTimeout(() => navigate('/auctions'), 1500);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create auction' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create auction' });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAnimal = animals.find(a => a.id === parseInt(formData.animal_id));

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/auctions" className="p-2 hover:bg-[#eeeee9] rounded-full transition-colors">
          <MaterialSymbol icon="arrow_back" />
        </Link>
        <div>
          <h2 className="text-3xl font-['Manrope'] font-extrabold text-[#002819] tracking-tight">
            {t('auctionsPage.startNew')}
          </h2>
          <p className="text-[#404943] mt-1">{t('auctionsPage.listForBidding', 'List your animal for bidding')}</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-[#cfe5d6] text-[#002819]' : 'bg-[#ffdad6] text-[#93000a]'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Select Animal */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#c0c9c1]/10">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-[#002819] bg-[#f4f4ef] p-2 rounded-xl">pets</span>
            <h3 className="text-xl font-bold font-['Manrope'] text-[#002819]">{t('auctionsPage.selectAnimal')}</h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-[#002819] border-t-transparent rounded-full" />
            </div>
          ) : animals.length === 0 ? (
            <div className="text-center py-12 bg-[#f4f4ef] rounded-2xl">
              <MaterialSymbol icon="pets" size={48} className="mx-auto text-[#c0c9c1] mb-4" />
              <p className="text-[#404943] font-semibold">{t('auctionsPage.noAnimalsAvailable')}</p>
              <p className="text-[#717973] text-sm mt-2">{t('auctionsPage.noAnimalsHint')}</p>
              <Link to="/animals/new" className="inline-block mt-4 px-4 py-2 bg-[#002819] text-white rounded-xl text-sm font-bold">
                {t('animals.addAnimal')}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {animals.map((animal) => (
                <div
                  key={animal.id}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      animal_id: animal.id,
                      title: `${animal.species} ${animal.breed || ''} - ${animal.animal_id}`.trim(),
                    }));
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                    parseInt(formData.animal_id) === animal.id
                      ? 'border-[#002819] bg-[#f4f4ef]'
                      : 'border-[#eeeee9] hover:border-[#002819]/30'
                  }`}
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#eeeee9] flex-shrink-0">
                    {animal.identification_photo ? (
                      <img src={animal.identification_photo} alt={animal.animal_id} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MaterialSymbol icon="pets" className="text-[#002819]/20" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <p className="font-bold text-[#002819]">{animal.animal_id}</p>
                    <p className="text-sm text-[#404943]">{animal.species} {animal.breed && `• ${animal.breed}`}</p>
                    <p className="text-xs text-[#717973]">{animal.gender} | Temp: {animal.baseline_temperature || '38.5'}°C</p>
                  </div>
                  {parseInt(formData.animal_id) === animal.id && (
                    <MaterialSymbol icon="check_circle" className="text-[#002819]" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Auction Details */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#c0c9c1]/10">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-[#002819] bg-[#f4f4ef] p-2 rounded-xl">gavel</span>
            <h3 className="text-xl font-bold font-['Manrope'] text-[#002819]">{t('auctionsPage.auctionDetails')}</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#404943]/70">{t('auctionsPage.auctionTitle')}</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder={t('auctionsPage.titlePlaceholder')}
                className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3.5 text-[#002819] font-semibold focus:ring-2 focus:ring-[#002819]/20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#404943]/70">{t('auctionsPage.startingPriceLabel')}</label>
                <input
                  name="starting_price"
                  type="number"
                  value={formData.starting_price}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="25000"
                  className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3.5 text-[#002819] font-semibold focus:ring-2 focus:ring-[#002819]/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#404943]/70">{t('auctionsPage.reservePriceLabel')}</label>
                <input
                  name="reserve_price"
                  type="number"
                  value={formData.reserve_price}
                  onChange={handleChange}
                  min="0"
                  placeholder="50000"
                  className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3.5 text-[#002819] font-semibold focus:ring-2 focus:ring-[#002819]/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#404943]/70">{t('auctionsPage.auctionDuration')}</label>
              <select
                name="duration_hours"
                value={formData.duration_hours}
                onChange={handleChange}
                className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3.5 text-[#002819] font-semibold focus:ring-2 focus:ring-[#002819]/20"
              >
                <option value={24}>24 {t('auctionsPage.hours')} (1 {t('auctionsPage.days')})</option>
                <option value={48}>48 {t('auctionsPage.hours')} (2 {t('auctionsPage.days')})</option>
                <option value={72}>72 {t('auctionsPage.hours')} (3 {t('auctionsPage.days')})</option>
                <option value={168}>168 {t('auctionsPage.hours')} (1 {t('auctionsPage.days')})</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#404943]/70">{t('auctionsPage.description')} <span className="text-[#717973] font-normal">Optional</span></label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder={t('auctionsPage.descriptionPlaceholder')}
                className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3.5 text-[#002819] font-medium focus:ring-2 focus:ring-[#002819]/20 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        {selectedAnimal && formData.title && (
          <div className="bg-[#06402b] rounded-[2rem] p-8 text-white relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#D4AF37]/20 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <h4 className="text-sm font-bold text-[#D4AF37] uppercase tracking-widest mb-4">{t('auctionsPage.preview')}</h4>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-widest mb-1">{t('auctionsPage.startingPrice')}</p>
                  <p className="text-2xl font-bold">{formData.starting_price ? `${parseInt(formData.starting_price).toLocaleString()} SAR` : '-'}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-widest mb-1">{t('auctionsPage.duration')}</p>
                  <p className="text-2xl font-bold">{Math.floor(formData.duration_hours / 24)} {t('auctionsPage.days')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            to="/auctions"
            className="flex-1 py-4 bg-[#eeeee9] text-[#002819] rounded-xl font-bold text-center hover:bg-[#e8e8e3] transition-all"
          >
            {t('auctionsPage.cancel')}
          </Link>
          <button
            type="submit"
            disabled={submitting || !formData.animal_id || !formData.title || !formData.starting_price}
            className="flex-1 py-4 bg-[#002819] text-white rounded-xl font-bold shadow-xl shadow-[#002819]/20 hover:bg-[#06402b] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                {t('auctionsPage.creating')}
              </>
            ) : (
              <>
                <MaterialSymbol icon="gavel" />
                {t('auctionsPage.startAuction')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
