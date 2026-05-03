import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';

export default function PaymentManagement() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState(null);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchAuctions();
  }, [filter]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/auctions?status=sold`);
      if (response.ok) {
        const data = await response.json();
        let filtered = data.data || [];
        
        if (filter === 'pending') {
          filtered = filtered.filter(a => a.payment_status === 'pending');
        } else if (filter === 'submitted') {
          filtered = filtered.filter(a => a.payment_status === 'submitted');
        } else if (filter === 'verified') {
          filtered = filtered.filter(a => a.payment_status === 'verified');
        }
        
        setAuctions(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (auction, actionType) => {
    setSelectedAuction(auction);
    setAction(actionType);
    setNotes('');
    setShowModal(true);
  };

  const handleVerify = async () => {
    if (!selectedAuction) return;
    
    setProcessing(true);
    try {
      const response = await apiFetch(`/api/auctions/${selectedAuction.id}/verify-payment/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        setShowModal(false);
        fetchAuctions();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to process payment');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return 'No deadline';
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    submitted: 'bg-blue-100 text-blue-700',
    verified: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#002819]">Payment Management</h2>
          <p className="text-[#404943] mt-1">Manage auction winner payments</p>
        </div>
      </div>

      <div className="flex gap-3">
        {['pending', 'submitted', 'verified'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-[#002819] text-white'
                : 'bg-white text-[#404943] hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-[#002819] border-t-transparent rounded-full" />
        </div>
      ) : auctions.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <MaterialSymbol icon="payments" size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-[#404943] text-lg">No {filter} payments</p>
        </div>
      ) : (
        <div className="space-y-4">
          {auctions.map((auction) => (
            <div key={auction.id} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                    <MaterialSymbol icon="pets" size={32} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#002819]">{auction.title}</h3>
                    <p className="text-sm text-[#717973]">Auction #{auction.id}</p>
                    <p className="text-sm text-[#717973]">
                      Animal: {auction.animal?.animal_id || 'N/A'} - {auction.animal?.species}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#002819]">{formatPrice(auction.current_price)}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold mt-2 ${statusColors[auction.payment_status]}`}>
                    {auction.payment_status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-[#717973] uppercase">Winner</p>
                  <p className="font-medium text-[#002819]">{auction.winner?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#717973] uppercase">Owner</p>
                  <p className="font-medium text-[#002819]">{auction.owner?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#717973] uppercase">Payment Deadline</p>
                  <p className={`font-medium ${auction.payment_expires_at && new Date(auction.payment_expires_at) < new Date() ? 'text-red-600' : 'text-[#002819]'}`}>
                    {getTimeRemaining(auction.payment_expires_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#717973] uppercase">Bids</p>
                  <p className="font-medium text-[#002819]">{auction.bid_count || 0}</p>
                </div>
              </div>

              {auction.payment_proof_url && (
                <div className="mt-4 flex gap-3">
                  <a
                    href={auction.payment_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors"
                  >
                    <MaterialSymbol icon="visibility" size={18} />
                    View Payment Proof
                  </a>
                  {auction.payment_status === 'submitted' && (
                    <>
                      <button
                        onClick={() => openModal(auction, 'approved')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        <MaterialSymbol icon="check" size={18} />
                        Approve
                      </button>
                      <button
                        onClick={() => openModal(auction, 'rejected')}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                      >
                        <MaterialSymbol icon="close" size={18} />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              )}

              {auction.payment_status === 'verified' && (
                <div className="mt-4 flex items-center gap-2 text-green-600">
                  <MaterialSymbol icon="verified" size={20} />
                  <span className="font-medium">Payment verified - Ownership transferred!</span>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <Link
                  to={`/auctions/${auction.id}`}
                  className="flex items-center gap-2 px-4 py-2 text-[#002819] hover:bg-gray-100 rounded-lg transition-colors"
                >
                  View Auction Details
                  <MaterialSymbol icon="arrow_forward" size={18} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedAuction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-full ${action === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <MaterialSymbol icon={action === 'approved' ? 'check' : 'close'} size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#002819]">
                {action === 'approved' ? 'Approve' : 'Reject'} Payment
              </h3>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-[#717973]">Auction</p>
              <p className="font-medium text-[#002819]">{selectedAuction.title}</p>
              <p className="text-lg font-bold text-[#002819] mt-2">{formatPrice(selectedAuction.current_price)}</p>
              <p className="text-sm text-[#717973] mt-1">
                Winner: {selectedAuction.winner?.name}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#404943] mb-2">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm"
                rows={3}
                placeholder="Add any notes about this payment..."
              />
            </div>

            {action === 'approved' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-700">
                  <strong>Note:</strong> Approving will transfer animal ownership to {selectedAuction.winner?.name}.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-gray-100 text-[#404943] rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={processing}
                className={`flex-1 py-3 text-white rounded-lg font-medium ${
                  action === 'approved' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {processing ? 'Processing...' : action === 'approved' ? 'Approve Payment' : 'Reject Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
