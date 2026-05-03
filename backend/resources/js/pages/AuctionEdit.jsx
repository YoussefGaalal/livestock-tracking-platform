import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function AuctionEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    starting_price: '',
    reserve_price: '',
    description: '',
    duration_hours: 48,
    status: 'active',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchAuction();
  }, [id]);

  const fetchAuction = async () => {
    try {
      const response = await apiFetch(`/api/auctions/${id}`);
      if (response.ok) {
        const data = await response.json();
        const auctionData = data.data || data;
        setAuction(auctionData);
        
        const endsAt = new Date(auctionData.ends_at);
        const startsAt = new Date(auctionData.starts_at);
        const hoursRemaining = Math.max(1, Math.ceil((endsAt - new Date()) / (1000 * 60 * 60)));
        
        setFormData({
          title: auctionData.title || '',
          starting_price: auctionData.starting_price || '',
          reserve_price: auctionData.reserve_price || '',
          description: auctionData.description || '',
          duration_hours: hoursRemaining,
          status: auctionData.status || 'active',
        });
      }
    } catch (error) {
      console.error('Failed to fetch auction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await apiFetch(`/api/auctions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Auction updated successfully!' });
        setTimeout(() => navigate(`/auctions/${id}`), 1500);
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to update auction' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update auction' });
    } finally {
      setSubmitting(false);
    }
  };

  const canEdit = user?.role === 'Admin' || user?.id === auction?.owner?.id;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#002819] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="text-center py-16">
        <MaterialSymbol icon="error" size={64} className="mx-auto text-[#c0c9c1] mb-4" />
        <p className="text-[#404943] text-lg">Auction not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#002819]">Edit Auction</h2>
          <p className="text-[#404943] mt-1">Update auction details and settings</p>
        </div>
        <button
          onClick={() => navigate(`/auctions/${id}`)}
          className="px-4 py-2 border border-[#c0c9c1] rounded-xl text-[#404943] font-semibold hover:bg-[#eeeee9] transition-colors flex items-center gap-2"
        >
          <MaterialSymbol icon="arrow_back" size={18} />
          Back to Auction
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-[2rem] p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#002819] mb-2">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3 text-[#1a1c19] font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-[#002819] mb-2">Starting Price (SAR)</label>
              <input
                type="number"
                name="starting_price"
                value={formData.starting_price}
                onChange={handleChange}
                className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3 text-[#1a1c19] font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#002819] mb-2">Reserve Price (SAR)</label>
              <input
                type="number"
                name="reserve_price"
                value={formData.reserve_price}
                onChange={handleChange}
                placeholder="Optional"
                className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3 text-[#1a1c19] font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-[#002819] mb-2">Duration (hours)</label>
              <input
                type="number"
                name="duration_hours"
                value={formData.duration_hours}
                onChange={handleChange}
                min="1"
                max="168"
                className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3 text-[#1a1c19] font-semibold"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#002819] mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3 text-[#1a1c19] font-semibold"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#002819] mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-3 text-[#1a1c19] font-semibold resize-none"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(`/auctions/${id}`)}
              className="px-6 py-3 border border-[#c0c9c1] rounded-xl text-[#404943] font-bold hover:bg-[#eeeee9] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-[#002819] text-white rounded-xl font-bold hover:bg-[#06402b] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {user?.role === 'Admin' && (
        <div className="bg-red-50 border border-red-200 rounded-[2rem] p-8">
          <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
            <MaterialSymbol icon="warning" size={20} />
            Admin Actions
          </h3>
          <p className="text-sm text-red-700 mb-4">
            As an admin, you can modify this auction even with active bids.
          </p>
        </div>
      )}
    </div>
  );
}
