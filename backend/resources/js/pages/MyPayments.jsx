import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

let stripe = null;
let elements = null;

export default function MyPayments() {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [soldAuctions, setSoldAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(null);
  const [processingCard, setProcessingCard] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [cardElement, setCardElement] = useState(null);
  const [cardError, setCardError] = useState(null);
  const [stripeReady, setStripeReady] = useState(false);
  const fileInputRef = useRef(null);
  const cardContainerRef = useRef(null);

  useEffect(() => {
    fetchData();
    loadStripe();
  }, []);

  useEffect(() => {
    if (showCardModal && stripeReady && cardContainerRef.current) {
      initializeCardElement();
    }
    return () => {
      if (cardElement) {
        cardElement.destroy();
        setCardElement(null);
      }
    };
  }, [showCardModal, stripeReady]);

  const loadStripe = async () => {
    if (window.Stripe) {
      stripe = window.Stripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder');
      setStripeReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => {
      stripe = window.Stripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder');
      setStripeReady(true);
    };
    document.body.appendChild(script);
  };

  const initializeCardElement = () => {
    if (!stripe || !cardContainerRef.current) return;
    
    if (cardElement) {
      cardElement.destroy();
    }

    elements = stripe.elements();
    const card = elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#002819',
          fontFamily: '"Manrope", sans-serif',
          '::placeholder': {
            color: '#717973',
          },
        },
        invalid: {
          color: '#93000a',
        },
      },
    });
    card.mount('#card-element');
    card.on('change', (event) => {
      setCardError(event.error ? event.error.message : null);
    });
    setCardElement(card);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wonRes, soldRes] = await Promise.all([
        apiFetch('/api/auctions/won'),
        apiFetch('/api/auctions/my'),
      ]);
      
      if (wonRes.ok) {
        const wonData = await wonRes.json();
        setAuctions(wonData.data || []);
      }
      
      if (soldRes.ok) {
        const soldData = await soldRes.json();
        const sold = (soldData.data || []).filter(a => a.status === 'sold');
        setSoldAuctions(sold);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPaymentTimeRemaining = (auction) => {
    if (!auction.payment_expires_at) return null;
    const expiry = new Date(auction.payment_expires_at);
    const now = new Date();
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  const uploadPaymentProof = async (e, auctionId) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.includes('pdf')) {
      setMessage({ type: 'error', text: 'Please upload a PDF file' });
      return;
    }
    
    setUploadingProof(auctionId);
    
    const formData = new FormData();
    formData.append('payment_proof', file);
    
    try {
      const response = await apiFetch(`/api/auctions/${auctionId}/payment-proof`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Payment proof uploaded successfully!' });
        fetchWonAuctions();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to upload payment proof' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload payment proof' });
    } finally {
      setUploadingProof(null);
    }
  };

  const openCardPayment = (auction) => {
    setSelectedAuction(auction);
    setCardError(null);
    setShowCardModal(true);
  };

  const handleCardSubmit = async () => {
    if (!selectedAuction || !cardElement) return;
    
    setProcessingCard(selectedAuction.id);
    setCardError(null);
    
    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });
      
      if (error) {
        setCardError(error.message);
        setProcessingCard(null);
        return;
      }
      
      const response = await apiFetch(`/api/auctions/${selectedAuction.id}/stripe-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_method_id: paymentMethod.id }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Payment successful! Animal ownership transferred.' });
        setShowCardModal(false);
        fetchWonAuctions();
      } else {
        setCardError(data.message || 'Payment failed');
      }
    } catch (error) {
      setCardError('Payment failed. Please try again.');
    } finally {
      setProcessingCard(null);
    }
  };

  const pendingPayments = auctions.filter(a => a.payment_status === 'pending');
  const submittedPayments = auctions.filter(a => a.payment_status === 'submitted');
  const verifiedPayments = auctions.filter(a => a.payment_status === 'verified');
  const isAdmin = user?.role === 'Admin';

  return (
    <div className="space-y-8">
      <div>
        <nav className="flex text-xs text-[#4f6357] mb-2 uppercase tracking-widest font-bold">
          <span>Marketplace</span>
          <span className="mx-2">/</span>
          <span className="text-[#002819]">My Payments</span>
        </nav>
        <h2 className="text-4xl font-['Manrope'] font-extrabold text-[#002819] tracking-tight">
          {isAdmin ? 'Auction Earnings' : 'Auction Payments'}
        </h2>
        <p className="text-[#404943] mt-1">
          {isAdmin ? 'View earnings from sold auctions' : 'Manage your auction winnings and payments'}
        </p>
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

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-[#002819] border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {isAdmin && soldAuctions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#002819] flex items-center gap-2">
                <MaterialSymbol icon="account_balance_wallet" size={24} className="text-emerald-500" />
                Sold Auctions - Earnings ({soldAuctions.length})
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {soldAuctions.map((auction) => (
                  <div key={auction.id} className="bg-white rounded-[2rem] overflow-hidden shadow-lg border-2 border-emerald-200">
                    <div className="relative h-48 overflow-hidden">
                      {auction.animal?.identification_photo ? (
                        <img src={auction.animal.identification_photo} alt={auction.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                          <MaterialSymbol icon="pets" size={64} className="text-emerald-400" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2">
                        <MaterialSymbol icon="verified" size={16} />
                        Sold
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      <div>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                          Auction #{auction.id}
                        </p>
                        <h4 className="text-lg font-bold text-[#002819]">{auction.title}</h4>
                        <p className="text-sm text-[#4f6357]">
                          {auction.animal?.species} {auction.animal?.breed && `• ${auction.animal.breed}`}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-[#f4f4ef] rounded-xl">
                        <div>
                          <p className="text-xs font-bold text-[#4f6357] uppercase">Sold Price</p>
                          <p className="text-2xl font-bold text-[#002819]">{formatPrice(auction.current_price)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-[#4f6357] uppercase">Buyer</p>
                          <p className="font-semibold text-[#002819]">{auction.winner?.name || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-emerald-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <MaterialSymbol icon={auction.payment_status === 'verified' ? 'check_circle' : 'pending'} size={24} className={auction.payment_status === 'verified' ? 'text-emerald-500' : 'text-amber-500'} />
                          <div>
                            <p className="font-bold text-[#002819]">
                              {auction.payment_status === 'verified' ? 'Payment Received' : 'Awaiting Payment'}
                            </p>
                            <p className="text-sm text-[#4f6357]">
                              {auction.payment_status === 'verified' ? 'Funds transferred to your account' : 'Buyer has not completed payment'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isAdmin && pendingPayments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#002819] flex items-center gap-2">
                <MaterialSymbol icon="pending_actions" size={24} className="text-amber-500" />
                Pending Payment ({pendingPayments.length})
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pendingPayments.map((auction) => (
                  <div key={auction.id} className="bg-white rounded-[2rem] overflow-hidden shadow-lg border-2 border-amber-200">
                    <div className="relative h-48 overflow-hidden">
                      {auction.animal?.identification_photo ? (
                        <img src={auction.animal.identification_photo} alt={auction.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                          <MaterialSymbol icon="pets" size={64} className="text-amber-400" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-amber-500 text-white px-4 py-2 rounded-full font-bold text-sm">
                        {getPaymentTimeRemaining(auction)}
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      <div>
                        <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">
                          Auction #{auction.id}
                        </p>
                        <h4 className="text-lg font-bold text-[#002819]">{auction.title}</h4>
                        <p className="text-sm text-[#4f6357]">
                          {auction.animal?.species} {auction.animal?.breed && `• ${auction.animal.breed}`}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-[#f4f4ef] rounded-xl">
                        <div>
                          <p className="text-xs font-bold text-[#4f6357] uppercase">Winning Bid</p>
                          <p className="text-2xl font-bold text-[#002819]">{formatPrice(auction.current_price)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-[#4f6357] uppercase">Seller</p>
                          <p className="font-semibold text-[#002819]">{auction.owner?.name}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-bold text-[#002819]">Choose Payment Method:</p>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => openCardPayment(auction)}
                            disabled={processingCard === auction.id}
                            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50"
                          >
                            <MaterialSymbol icon="credit_card" size={32} />
                            <span className="text-sm">Credit Card</span>
                            <span className="text-xs opacity-75">Pay instantly</span>
                          </button>
                          
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingProof === auction.id}
                            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-[#06402b] to-[#002819] text-white rounded-xl font-bold hover:from-[#002819] hover:to-[#001a11] transition-all disabled:opacity-50"
                          >
                            <MaterialSymbol icon="upload_file" size={32} />
                            <span className="text-sm">Bank Transfer</span>
                            <span className="text-xs opacity-75">Upload PDF proof</span>
                          </button>
                        </div>
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf"
                          onChange={(e) => uploadPaymentProof(e, auction.id)}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isAdmin && submittedPayments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#002819] flex items-center gap-2">
                <MaterialSymbol icon="hourglass_top" size={24} className="text-blue-500" />
                Awaiting Verification ({submittedPayments.length})
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {submittedPayments.map((auction) => (
                  <div key={auction.id} className="bg-white rounded-[2rem] overflow-hidden shadow-lg border-2 border-blue-200">
                    <div className="relative h-48 overflow-hidden">
                      {auction.animal?.identification_photo ? (
                        <img src={auction.animal.identification_photo} alt={auction.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                          <MaterialSymbol icon="pets" size={64} className="text-blue-400" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-full font-bold text-sm">
                        Submitted
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      <div>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                          Auction #{auction.id}
                        </p>
                        <h4 className="text-lg font-bold text-[#002819]">{auction.title}</h4>
                        <p className="text-sm text-[#4f6357]">
                          {auction.animal?.species} {auction.animal?.breed && `• ${auction.animal.breed}`}
                        </p>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <MaterialSymbol icon="pending" size={24} className="text-blue-500" />
                          <div>
                            <p className="font-bold text-[#002819]">Payment Proof Submitted</p>
                            <p className="text-sm text-[#4f6357]">Waiting for admin verification</p>
                          </div>
                        </div>
                        {auction.payment_proof_url && (
                          <a
                            href={auction.payment_proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                          >
                            <MaterialSymbol icon="visibility" size={16} />
                            View Uploaded Proof
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isAdmin && verifiedPayments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#002819] flex items-center gap-2">
                <MaterialSymbol icon="check_circle" size={24} className="text-emerald-500" />
                Completed ({verifiedPayments.length})
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {verifiedPayments.map((auction) => (
                  <Link
                    key={auction.id}
                    to={`/animals/${auction.animal?.id}`}
                    className="bg-white rounded-[2rem] overflow-hidden shadow-lg border-2 border-emerald-200 hover:shadow-xl transition-all"
                  >
                    <div className="relative h-48 overflow-hidden">
                      {auction.animal?.identification_photo ? (
                        <img src={auction.animal.identification_photo} alt={auction.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                          <MaterialSymbol icon="pets" size={64} className="text-emerald-400" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2">
                        <MaterialSymbol icon="verified" size={16} />
                        Paid
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-3">
                      <div>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                          Auction #{auction.id}
                        </p>
                        <h4 className="text-lg font-bold text-[#002819]">{auction.title}</h4>
                        <p className="text-sm text-[#4f6357]">
                          {auction.animal?.species} {auction.animal?.breed && `• ${auction.animal.breed}`}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                        <span className="text-sm text-emerald-700">Final Price</span>
                        <span className="text-xl font-bold text-emerald-700">{formatPrice(auction.current_price)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-[#06402b]">
                        <MaterialSymbol icon="arrow_forward" size={16} />
                        Click to view your animal
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {auctions.length === 0 && soldAuctions.length === 0 && (
            <div className="text-center py-16 bg-white rounded-[2rem] shadow-sm">
              <MaterialSymbol icon="shopping_bag" size={64} className="mx-auto text-[#c0c9c1] mb-4" />
              <p className="text-[#404943] text-lg font-semibold">
                {isAdmin ? 'No sold auctions yet' : 'No auction winnings yet'}
              </p>
              <p className="text-[#717973] text-sm mt-2">
                {isAdmin ? 'Start selling animals at auction to see earnings here' : 'Win an auction to see your payments here'}
              </p>
              <Link
                to="/auctions"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#002819] text-white rounded-xl font-bold text-sm hover:bg-[#06402b] transition-all"
              >
                <MaterialSymbol icon="gavel" size={20} />
                Browse Auctions
              </Link>
            </div>
          )}
        </>
      )}

      {showCardModal && selectedAuction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">Credit Card Payment</h3>
                  <p className="text-white/70 text-sm">Secure payment via Stripe</p>
                </div>
                <button onClick={() => setShowCardModal(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <MaterialSymbol icon="close" size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="p-4 bg-[#f4f4ef] rounded-xl">
                <p className="text-xs font-bold text-[#4f6357] uppercase">Amount to Pay</p>
                <p className="text-3xl font-bold text-[#002819]">{formatPrice(selectedAuction.current_price)}</p>
                <p className="text-sm text-[#4f6357] mt-1">{selectedAuction.title}</p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#404943] uppercase tracking-widest">
                  Card Details
                </label>
                <div ref={cardContainerRef} id="card-element" className="p-4 bg-white border-2 border-[#eeeee9] rounded-xl focus-within:border-[#D4AF37] transition-colors">
                </div>
                {cardError && (
                  <p className="text-sm text-red-600">{cardError}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCardModal(false)}
                  className="flex-1 py-3 bg-[#eeeee9] text-[#002819] rounded-xl font-bold text-sm hover:bg-[#e8e8e3]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCardSubmit}
                  disabled={processingCard === selectedAuction.id}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingCard === selectedAuction.id ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <MaterialSymbol icon="lock" size={18} />
                      Pay {formatPrice(selectedAuction.current_price)}
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-[#717973]">
                <MaterialSymbol icon="security" size={16} />
                Secured by Stripe
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
