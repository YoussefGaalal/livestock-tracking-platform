import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function AuctionDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState(null);
  const [endingAuction, setEndingAuction] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyAction, setVerifyAction] = useState(null);
  const fileInputRef = useRef(null);

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
        setBidAmount(Math.ceil(auctionData.current_price) + 1);
      }
    } catch (error) {
      console.error('Failed to fetch auction:', error);
    } finally {
      setLoading(false);
    }
  };

  const placeBid = async () => {
    if (!bidAmount || !auction) return;
    
    setPlacing(true);
    setMessage(null);
    
    try {
      const response = await apiFetch(`/api/auctions/${id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(bidAmount) }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Bid placed successfully!' });
        fetchAuction();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to place bid' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to place bid' });
    } finally {
      setPlacing(false);
    }
  };

  const endAuction = async () => {
    if (!confirm('Are you sure you want to end this auction early?')) return;
    
    setEndingAuction(true);
    try {
      const response = await apiFetch(`/api/auctions/${id}/end`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Auction ended successfully!' });
        fetchAuction();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to end auction' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to end auction' });
    } finally {
      setEndingAuction(false);
    }
  };

  const uploadPaymentProof = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingProof(true);
    const formData = new FormData();
    formData.append('payment_proof', file);
    
    try {
      const response = await apiFetch(`/api/auctions/${id}/payment-proof`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Payment proof uploaded successfully!' });
        fetchAuction();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to upload payment proof' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload payment proof' });
    } finally {
      setUploadingProof(false);
    }
  };

  const verifyPayment = async (status) => {
    try {
      const response = await apiFetch(`/api/auctions/${id}/verify-payment/${status}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: verifyNotes }),
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Payment ${status} successfully!` });
        setShowVerifyModal(false);
        fetchAuction();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to verify payment' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to verify payment' });
    }
  };

  const disqualifyBidder = async (bidId) => {
    if (!confirm('Disqualify this bidder?')) return;
    
    try {
      const response = await apiFetch(`/api/auctions/${id}/bids/${bidId}/disqualify`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Bidder disqualified successfully' });
        fetchAuction();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to disqualify bidder' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disqualify bidder' });
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getTimeRemaining = () => {
    if (!auction?.ends_at) return 'No limit';
    const end = new Date(auction.ends_at);
    const now = new Date();
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const getPaymentTimeRemaining = () => {
    if (!auction?.payment_expires_at) return null;
    const expiry = new Date(auction.payment_expires_at);
    const now = new Date();
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  const isAdmin = user?.role === 'Admin';
  const isOwner = user?.id === auction?.owner?.id;
  const isWinner = user?.id === auction?.winner?.id;
  const canManageAuction = isAdmin || isOwner;
  const minimumBid = Math.ceil(auction?.current_price) + 1;

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
        <p className="text-[#404943] text-lg font-semibold">Auction not found</p>
        <Link to="/auctions" className="text-[#002819] font-bold hover:underline mt-4 inline-block">
          Back to Auctions
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/auctions" className="p-2 hover:bg-[#eeeee9] rounded-full transition-colors">
            <MaterialSymbol icon="arrow_back" />
          </Link>
          <nav className="flex text-xs text-[#4f6357] uppercase tracking-widest font-bold">
            <span>Marketplace</span>
            <span className="mx-2">/</span>
            <span>Auction #{id}</span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {canManageAuction && (
            <Link
              to={`/auctions/${id}/edit`}
              className="px-4 py-2 bg-[#002819] text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#06402b] transition-colors"
            >
              <MaterialSymbol icon="edit" size={16} />
              Edit
            </Link>
          )}
          {canManageAuction && auction.status === 'active' && (
            <button
              onClick={endAuction}
              disabled={endingAuction}
              className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <MaterialSymbol icon="stop" size={16} />
              {endingAuction ? 'Ending...' : 'End Auction'}
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${
          message.type === 'success' 
            ? 'bg-emerald-100 text-emerald-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Winner Section */}
      {(auction.status === 'sold' || auction.status === 'ended') && auction.winner && (
        <div className={`p-6 rounded-2xl ${auction.status === 'sold' ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              auction.status === 'sold' ? 'bg-emerald-500' : 'bg-gray-500'
            }`}>
              <MaterialSymbol icon={auction.status === 'sold' ? 'emoji_events' : 'gavel'} size={32} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#002819]">
                {auction.status === 'sold' ? 'Winner!' : 'Auction Ended'}
              </h3>
              <p className="text-lg text-[#404943]">
                <span className="font-bold">{auction.winner.name}</span> won with {formatPrice(auction.current_price)}
              </p>
              {auction.status === 'sold' && auction.secondWinner && (
                <p className="text-sm text-[#717973]">
                  Next in line: {auction.secondWinner.name}
                </p>
              )}
            </div>
          </div>

          {/* Payment Status */}
          {auction.status === 'sold' && (
            <div className="mt-4 p-4 bg-white rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-[#002819]">Payment Status</h4>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  auction.payment_status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                  auction.payment_status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                  auction.payment_status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {auction.payment_status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
              
              {isWinner && auction.payment_status === 'pending' && (
                <div className="space-y-3">
                  <p className="text-sm text-[#717973]">
                    Complete your payment to finalize the purchase. You can pay by credit card or upload bank transfer proof.
                  </p>
                  <p className="text-sm font-bold text-amber-600">
                    Time remaining: {getPaymentTimeRemaining()}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate('/my-payments')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700"
                    >
                      <MaterialSymbol icon="credit_card" size={16} />
                      Pay Now
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={uploadPaymentProof}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingProof}
                      className="px-4 py-2 bg-[#002819] text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#06402b] disabled:opacity-50"
                    >
                      <MaterialSymbol icon="upload" size={16} />
                      {uploadingProof ? 'Uploading...' : 'Upload Transfer Proof'}
                    </button>
                  </div>
                  <p className="text-xs text-[#717973]">
                    Or{' '}
                    <Link to="/my-payments" className="text-blue-600 hover:underline font-medium">
                      view all your auction payments
                    </Link>
                  </p>
                </div>
              )}

              {isWinner && auction.payment_status === 'submitted' && (
                <div className="space-y-3">
                  <p className="text-sm text-[#717973]">
                    Your payment proof has been submitted. Waiting for admin verification.
                  </p>
                  {auction.payment_proof_url && (
                    <a
                      href={auction.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <MaterialSymbol icon="visibility" size={16} />
                      View Uploaded Proof
                    </a>
                  )}
                </div>
              )}

              {isAdmin && auction.payment_status === 'submitted' && (
                <div className="space-y-3">
                  <a
                    href={auction.payment_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <MaterialSymbol icon="visibility" size={16} />
                    View Payment Proof
                  </a>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setVerifyAction('approved'); setShowVerifyModal(true); }}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700"
                    >
                      Approve Payment
                    </button>
                    <button
                      onClick={() => { setVerifyAction('rejected'); setShowVerifyModal(true); }}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700"
                    >
                      Reject Payment
                    </button>
                  </div>
                </div>
              )}

              {auction.payment_status === 'verified' && (
                <p className="text-sm text-emerald-600 font-bold">
                  Payment verified! Transaction complete.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Hero Image */}
          <div className="relative rounded-[2rem] overflow-hidden h-[400px] shadow-2xl">
            {auction.animal?.identification_photo ? (
              <img 
                src={auction.animal.identification_photo} 
                alt={auction.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                <MaterialSymbol icon="pets" size={120} className="text-emerald-300" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            
            <div className="absolute top-4 left-4 flex gap-2">
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                auction.status === 'active' 
                  ? 'bg-red-500 text-white' 
                  : auction.status === 'sold' 
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-500 text-white'
              }`}>
                {auction.status === 'active' && <span className="w-2 h-2 rounded-full bg-white animate-pulse inline-block mr-2"></span>}
                {auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
              </span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <p className="text-[#D4AF37] text-sm font-bold uppercase tracking-widest mb-2">
                {auction.animal?.animal_id || 'No ID'}
              </p>
              <h1 className="text-4xl font-bold font-['Manrope'] mb-2">{auction.title}</h1>
              <p className="text-white/70">
                {auction.animal?.species} {auction.animal?.breed && `• ${auction.animal.breed}`} 
                {' • '} {auction.animal?.gender}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm">
            <h3 className="text-xl font-bold text-[#002819] font-['Manrope'] mb-4">About This Animal</h3>
            <p className="text-[#404943] leading-relaxed">
              {auction.description || 'No description provided for this auction.'}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-[#eeeee9]">
              <div>
                <p className="text-xs font-bold text-[#404943] uppercase tracking-widest mb-1">Temperature</p>
                <p className="text-lg font-bold text-[#002819]">{auction.animal?.baseline_temperature || '38.5'}°C</p>
              </div>
              <div>
                <p className="text-xs font-bold text-[#404943] uppercase tracking-widest mb-1">Heart Rate</p>
                <p className="text-lg font-bold text-[#002819]">{auction.animal?.normal_heart_rate || '30-50'} BPM</p>
              </div>
              <div>
                <p className="text-xs font-bold text-[#404943] uppercase tracking-widest mb-1">Weight</p>
                <p className="text-lg font-bold text-[#002819]">{auction.animal?.current_weight || 'N/A'} kg</p>
              </div>
              <div>
                <p className="text-xs font-bold text-[#404943] uppercase tracking-widest mb-1">Color</p>
                <p className="text-lg font-bold text-[#002819]">{auction.animal?.color_markings || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Bid History */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm">
            <h3 className="text-xl font-bold text-[#002819] font-['Manrope'] mb-6">
              Bid History ({auction.bids?.length || 0} bids)
            </h3>
            
            {auction.bids && auction.bids.length > 0 ? (
              <div className="space-y-4">
                {auction.bids.slice(0, 10).map((bid, index) => (
                  <div key={bid.id} className="flex items-center justify-between p-4 bg-[#f4f4ef] rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-[#D4AF37] text-white' : 'bg-[#eeeee9] text-[#404943]'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-[#002819]">{bid.bidder_name || 'Anonymous'}</p>
                        <p className="text-xs text-[#717973]">
                          {new Date(bid.bid_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-xl font-bold text-[#002819]">{formatPrice(bid.amount)}</p>
                      {canManageAuction && auction.status === 'active' && (
                        <button
                          onClick={() => disqualifyBidder(bid.id)}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors"
                          title="Disqualify this bidder"
                        >
                          <MaterialSymbol icon="block" size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#717973]">
                <MaterialSymbol icon="gavel" size={48} className="mx-auto mb-2 text-[#c0c9c1]" />
                <p>No bids yet. Be the first to bid!</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Bidding Card */}
          {auction.status === 'active' && (
            <div className="bg-white rounded-[2rem] p-6 shadow-lg sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#002819]">Place Your Bid</h3>
                <div className="bg-[#D4AF37] text-white px-3 py-1 rounded-full flex items-center gap-1">
                  <MaterialSymbol icon="schedule" size={16} />
                  <span className="text-sm font-bold">{getTimeRemaining()}</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between p-3 bg-[#f4f4ef] rounded-xl">
                  <span className="text-[#404943]">Starting Price</span>
                  <span className="font-bold text-[#1a1c19]">{formatPrice(auction.starting_price)}</span>
                </div>
                <div className="flex justify-between p-3 bg-emerald-50 rounded-xl">
                  <span className="text-[#404943]">Current Bid</span>
                  <span className="font-bold text-emerald-700 text-lg">{formatPrice(auction.current_price)}</span>
                </div>
                {auction.reserve_price && (
                  <div className="flex justify-between p-3 bg-[#f4f4ef] rounded-xl">
                    <span className="text-[#404943]">Reserve</span>
                    <span className="font-bold text-[#1a1c19]">{formatPrice(auction.reserve_price)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#404943] uppercase tracking-widest mb-2">
                    Your Bid (SAR)
                  </label>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    min={minimumBid}
                    className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-4 text-xl font-bold text-[#002819] focus:ring-2 focus:ring-[#D4AF37]"
                  />
                  <p className="text-xs text-[#717973] mt-1">
                    Minimum bid: {formatPrice(minimumBid)}
                  </p>
                </div>

                <button
                  onClick={placeBid}
                  disabled={placing}
                  className="w-full py-4 bg-[#002819] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#06402b] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {placing ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      Placing...
                    </>
                  ) : (
                    <>
                      <MaterialSymbol icon="gavel" />
                      Place Bid
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Owner Info */}
          <div className="bg-[#06402b] rounded-[2rem] p-6 text-white">
            <h4 className="text-sm font-bold text-emerald-300 uppercase tracking-widest mb-4">Seller</h4>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-800 flex items-center justify-center text-xl font-bold">
                {auction.owner?.name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-bold">{auction.owner?.name || 'Unknown'}</p>
                <p className="text-xs text-emerald-300">Registered Seller</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verify Payment Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-[#002819] mb-4">
              {verifyAction === 'approved' ? 'Approve Payment' : 'Reject Payment'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                rows={3}
                placeholder="Add any notes about this decision..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => verifyPayment(verifyAction)}
                className={`flex-1 px-4 py-2 text-white rounded-lg ${
                  verifyAction === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
