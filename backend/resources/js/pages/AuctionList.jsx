import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useI18n } from '../i18n';

export default function AuctionList() {
  const { t } = useI18n();
  const [auctions, setAuctions] = useState([]);
  const [myAuctions, setMyAuctions] = useState([]);
  const [enrolledAuctions, setEnrolledAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchAuctions();
  }, [filter]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      let url = '/api/auctions?';
      if (filter === 'all') {
        url = '/api/auctions?view=all';
      } else if (filter === 'mine') {
        url = '/api/auctions?status=active&owner=mine';
      } else {
        url += `status=${filter}`;
      }
      const response = await apiFetch(url);
      if (response.ok) {
        const data = await response.json();
        if (filter === 'all' && data.my_auctions) {
          setMyAuctions(data.my_auctions || []);
          setEnrolledAuctions(data.enrolled_auctions || []);
          setAuctions([]);
        } else {
          setAuctions(data.data || []);
          setMyAuctions([]);
          setEnrolledAuctions([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const openBidModal = (auction) => {
    setSelectedAuction(auction);
    setBidAmount(Math.ceil(auction.current_price) + 1);
    setMessage(null);
    setShowBidModal(true);
  };

  const placeBid = async () => {
    if (!bidAmount || !selectedAuction) return;
    
    setPlacing(true);
    setMessage(null);
    
    try {
      const response = await apiFetch(`/api/auctions/${selectedAuction.id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(bidAmount) }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: t('auctionsPage.bidSuccess') });
        setTimeout(() => {
          setShowBidModal(false);
          fetchAuctions();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.message || t('auctionsPage.bidFailed') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('auctionsPage.bidFailed') });
    } finally {
      setPlacing(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getTimeRemaining = (auction) => {
    if (!auction.ends_at) return t('auctionsPage.noLimit');
    const end = new Date(auction.ends_at);
    const now = new Date();
    const diff = end - now;
    
    if (diff <= 0) return t('auctionsPage.ended');
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex text-xs text-[#4f6357] mb-2 uppercase tracking-widest font-bold">
            <span>{t('auctionsPage.marketplace')}</span>
            <span className="mx-2">/</span>
            <span className="text-[#002819]">{t('auctionsPage.camelAuctions')}</span>
          </nav>
          <h2 className="text-4xl font-['Manrope'] font-extrabold text-[#002819] tracking-tight">
            {filter === 'all' ? t('auctions.allAuctions') : filter === 'active' ? t('auctionsPage.liveAuctions') : filter === 'sold' ? t('auctionsPage.sold') : t('auctionsPage.ended')}
          </h2>
          <p className="text-[#404943] mt-1">{auctions.length} {filter === 'active' ? t('auctionsPage.live') : ''} {t('auctionsPage.auctions')}</p>
        </div>
        <Link
          to="/auctions/new"
          className="px-6 py-3 bg-[#002819] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#002819]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
        >
          <MaterialSymbol icon="add" size={20} />
          {t('auctionsPage.startAuction')}
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        {['active', 'ended', 'sold', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              filter === status
                ? 'bg-[#002819] text-white'
                : 'bg-white text-[#404943] hover:bg-[#eeeee9] border border-[#c0c9c1]/30'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-[#cfe5d6] text-[#002819]' : 'bg-[#ffdad6] text-[#93000a]'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-[#002819] border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-10">
          {filter === 'all' && myAuctions.length === 0 && enrolledAuctions.length === 0 && (
            <div className="text-center py-16 bg-white rounded-[2rem] shadow-sm">
              <MaterialSymbol icon="gavel" size={64} className="mx-auto text-[#c0c9c1] mb-4" />
              <p className="text-[#404943] text-lg font-semibold">{t('auctionsPage.noActive')}</p>
              <p className="text-[#717973] text-sm mt-2">{t('auctionsPage.startNew')}</p>
            </div>
          )}
          {filter === 'all' && myAuctions.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-[#002819] mb-4 flex items-center gap-2">
                <MaterialSymbol icon="person" size={24} className="text-[#D4AF37]" />
                {t('auctions.myAuctions')} ({myAuctions.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {myAuctions.map((auction) => (
                  <AuctionCard key={auction.id} auction={auction} onBid={openBidModal} />
                ))}
              </div>
            </div>
          )}
          
          {filter === 'all' && enrolledAuctions.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-[#002819] mb-4 flex items-center gap-2">
                <MaterialSymbol icon="how_to_reg" size={24} className="text-[#06402B]" />
                {t('auctionsPage.biddingOn')} ({enrolledAuctions.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {enrolledAuctions.map((auction) => (
                  <AuctionCard key={auction.id} auction={auction} onBid={openBidModal} />
                ))}
              </div>
            </div>
          )}
          
          {filter !== 'all' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {auctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} onBid={openBidModal} />
              ))}
            </div>
          )}
          
          {filter !== 'all' && auctions.length === 0 && (
            <div className="text-center py-16 bg-white rounded-[2rem] shadow-sm">
              <MaterialSymbol icon="gavel" size={64} className="mx-auto text-[#c0c9c1] mb-4" />
              <p className="text-[#404943] text-lg font-semibold">{t('auctionsPage.noAuctions')}</p>
            </div>
          )}
        </div>
      )}

      {showBidModal && selectedAuction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#002819]/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-[#002819] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{t('auctionsPage.placeYourBid')}</h3>
                <p className="text-white/60 text-sm">{selectedAuction.title}</p>
              </div>
              <button onClick={() => setShowBidModal(false)} className="p-2 hover:bg-white/10 rounded-full">
                <MaterialSymbol icon="close" size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-[#f4f4ef] rounded-2xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-[#404943] text-sm">{t('auctionsPage.currentPrice')}</span>
                  <span className="font-bold text-[#1a1c19]">{formatPrice(selectedAuction.current_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#404943] text-sm">{t('auctionsPage.minimumBid')}</span>
                  <span className="font-bold text-[#002819]">{formatPrice(Math.ceil(selectedAuction.current_price) + 1)}</span>
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-[#cfe5d6] text-[#002819]' : 'bg-[#ffdad6] text-[#93000a]'}`}>
                  {message.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#404943] uppercase tracking-widest mb-2">{t('auctions.yourBid')} (SAR)</label>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  min={Math.ceil(selectedAuction.current_price) + 1}
                  className="w-full bg-[#f4f4ef] border-none rounded-xl px-4 py-4 text-xl font-bold text-[#002819] focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowBidModal(false)}
                  className="flex-1 py-3 bg-[#eeeee9] text-[#002819] rounded-xl font-bold text-sm hover:bg-[#e8e8e3]"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={placeBid}
                  disabled={placing || !bidAmount}
                  className="flex-1 py-3 bg-[#002819] text-white rounded-xl font-bold text-sm hover:bg-[#06402b] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {placing ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      {t('auctionsPage.placing')}
                    </>
                  ) : (
                    <>
                      <MaterialSymbol icon="gavel" />
                      {t('auctionsPage.confirmBid')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AuctionCard({ auction, onBid }) {
  const getTimeRemaining = (auction) => {
    if (!auction.ends_at) return 'No limit';
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="bg-white rounded-[2rem] overflow-hidden shadow-[0px_12px_32px_rgba(6,64,43,0.06)] group hover:shadow-2xl transition-all duration-500 border border-[#c0c9c1]/10">
      <div className="relative h-56 overflow-hidden">
        {auction.animal?.identification_photo ? (
          <img
            src={auction.animal.identification_photo}
            alt={auction.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#E3E3DE] to-[#cfe5d6] flex items-center justify-center">
            <MaterialSymbol icon="pets" size={64} className="text-[#002819]/20" />
          </div>
        )}
        
        <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${auction.status === 'active' ? 'bg-red-500 animate-pulse' : auction.status === 'sold' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">
            {auction.status === 'active' ? 'Live' : auction.status}
          </span>
        </div>
        
        <div className="absolute top-4 right-4 bg-[#D4AF37] text-white px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
          {auction.status === 'active' ? (
            <>
              <MaterialSymbol icon="schedule" size={16} />
              <span className="text-[11px] font-bold">{getTimeRemaining(auction)}</span>
            </>
          ) : (
            <>
              <MaterialSymbol icon={auction.status === 'sold' ? 'check_circle' : 'cancel'} size={16} />
              <span className="text-[11px] font-bold">{auction.status}</span>
            </>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-black text-[#735c00] uppercase tracking-[0.2em]">
              {auction.animal?.animal_id || 'CML-XXX'}
            </p>
            {auction.owner && (
              <p className="text-[10px] font-medium text-[#4f6357]">
                Seller: {auction.owner.name}
              </p>
            )}
          </div>
          <h3 className="text-xl font-bold text-[#002819] font-['Manrope']">{auction.title}</h3>
          <p className="text-sm text-[#4f6357]">
            {auction.animal?.species} {auction.animal?.breed && `• ${auction.animal.breed}`}
          </p>
        </div>

        {auction.status === 'sold' && auction.winner ? (
          <div className="bg-emerald-50 rounded-2xl p-4 mb-4">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Highest Bidder</p>
            <p className="text-lg font-bold text-emerald-700">{auction.winner.name}</p>
            <p className="text-xs text-emerald-600 mt-1">Final: {formatPrice(auction.current_price)}</p>
          </div>
        ) : (
          <div className="bg-[#f4f4ef] rounded-2xl p-4 mb-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-[#4f6357] uppercase tracking-widest mb-1">Starting</p>
              <p className="text-lg font-bold text-[#1a1c19]">{formatPrice(auction.starting_price)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-1">Current Bid</p>
              <p className="text-lg font-bold text-[#002819]">{formatPrice(auction.current_price)}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-6">
          <MaterialSymbol icon="group" size={18} className="text-[#77ac90]" />
          <span className="text-xs font-semibold text-[#404943]">
            {auction.bid_count || 0} bids
          </span>
          <span className="mx-2 text-[#c0c9c1]">|</span>
          <MaterialSymbol icon="health_and_safety" size={18} className="text-[#77ac90]" />
          <span className="text-xs font-semibold text-[#404943]">
            {auction.animal?.baseline_temperature || '38.5'}°C
          </span>
        </div>

        <div className="flex items-center justify-between">
          <Link
            to={`/auctions/${auction.id}`}
            className="px-4 py-2 text-[#002819] hover:bg-[#eeeee9] rounded-xl font-medium text-sm transition-colors"
          >
            View Details
          </Link>
          {auction.status === 'active' && (
            <button
              onClick={() => onBid(auction)}
              className="px-6 py-2 bg-[#002819] text-white rounded-xl font-bold text-sm hover:bg-[#06402b] shadow-lg shadow-[#002819]/20 transition-all"
            >
              Place Bid
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
