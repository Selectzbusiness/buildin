import React, { useContext, useEffect, useState } from 'react';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWallet, FaCoins, FaInfoCircle, FaShoppingCart, FaCheckCircle, FaSpinner } from 'react-icons/fa';

const CREDIT_TIERS = [
  { amount: 10, price: 2000 },
  { amount: 30, price: 5000 },
  { amount: 65, price: 10000 },
];

// Mocked usage history for demo
const MOCK_USAGE = [
  { id: 1, type: 'Purchase', amount: 30, date: '2024-07-10', details: 'Bought credits' },
  { id: 2, type: 'Profile View', amount: -1, date: '2024-07-09', details: 'Viewed Sarah Johnson profile' },
  { id: 3, type: 'Profile View', amount: -1, date: '2024-07-08', details: 'Viewed John Doe profile' },
  { id: 4, type: 'Purchase', amount: 10, date: '2024-07-05', details: 'Bought credits' },
];

const Credits: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [balance, setBalance] = useState<number | null>(null);
  const [used, setUsed] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [checkoutTier, setCheckoutTier] = useState<{ amount: number; price: number } | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponValidation, setCouponValidation] = useState<any>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showWhereUsed, setShowWhereUsed] = useState(false);
  const [usage, setUsage] = useState<Array<{ id: string; type: string; amount: number; date: string; details: string }>>([]);

  const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;

  useEffect(() => {
    fetchBalance();
    fetchUsageHistory();
  }, [user]);

  const fetchBalance = async () => {
    if (!user) return;
    setLoading(true);

    console.log("Current user id:", user.id);
    const { data: credits, error: creditsError } = await supabase
      .from('employer_credits')
      .select('credits_balance,total_used')
      .eq('employer_id', user.id)
      .single();
    console.log("Credits data:", credits, "Error:", creditsError);

    if (creditsError || !credits) {
      setBalance(0);
      setUsed(0);
      setLoading(false);
      return;
    }

    setBalance(credits.credits_balance ?? 0);
    setUsed(credits.total_used ?? 0);
    setLoading(false);
  };

  const fetchUsageHistory = async () => {
    if (!user) return;
    // Fetch purchases from payment_intents
    const { data: purchases, error: purchaseError } = await supabase
      .from('payment_intents')
      .select('id, amount, created_at, description, payment_type, credits_amount, status')
      .eq('user_id', user.id)
      .eq('payment_type', 'credits')
      .order('created_at', { ascending: false });
    // Fetch usage from employer_profile_views
    const { data: views, error: viewsError } = await supabase
      .from('employer_profile_views')
      .select('id, credits_used, viewed_at, job_seeker_id')
      .eq('employer_id', user.id)
      .order('viewed_at', { ascending: false });
    // Map purchases
    const purchaseHistory = (purchases || []).map((p: any) => ({
      id: `purchase_${p.id}`,
      type: 'Purchase',
      amount: Number(p.credits_amount || 0),
      date: String(p.created_at),
      details: `${p.description || 'Bought credits'}${p.status === 'success' ? '' : ' (pending)'}`
    }));
    // Map views
    const usageHistory = (views || []).map((v: any) => ({
      id: `view_${v.id}`,
      type: 'Profile View',
      amount: -Math.abs(Number(v.credits_used || 1)),
      date: String(v.viewed_at),
      details: `Viewed profile: ${v.job_seeker_id}`
    }));
    // Combine and sort
    const allHistory = [...purchaseHistory, ...usageHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setUsage(allHistory);
  };

  const openCheckout = (tier: { amount: number; price: number }) => {
    setCheckoutTier(tier);
    setCouponCode('');
    setCouponValidation(null);
    setPaymentSuccess(false);
  };

  const closeCheckout = () => {
    setCheckoutTier(null);
    setCouponCode('');
    setCouponValidation(null);
    setIsProcessingPayment(false);
    setPaymentSuccess(false);
  };

  const validateCoupon = async () => {
    if (!couponCode.trim() || !checkoutTier) return;
    setIsValidatingCoupon(true);
    try {
      const { data, error } = await supabase.rpc('validate_coupon', {
        in_code: couponCode.trim(),
        in_user_id: user?.id,
        in_product_type: 'credits',
        in_purchase_amount: checkoutTier.price
      });
      if (error) throw error;
      if (data && data.length > 0) {
        setCouponValidation(data[0]);
      } else {
        setCouponValidation({ valid: false, message: 'Invalid coupon' });
      }
    } catch (e) {
      setCouponValidation({ valid: false, message: 'Failed to validate coupon' });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const getFinalPrice = () => {
    if (!checkoutTier) return 0;
    if (couponValidation?.valid && couponValidation.discount_amount) {
      return Math.max(0, checkoutTier.price - couponValidation.discount_amount);
    }
    return checkoutTier.price;
  };

  const handlePay = async () => {
    if (!checkoutTier || !user) return;
    setIsProcessingPayment(true);
    const finalPrice = getFinalPrice();
    let accessToken = (user as any)?.access_token;
    if (!accessToken) {
      const { data: sessionData } = await supabase.auth.getSession();
      accessToken = sessionData?.session?.access_token;
    }
    if (finalPrice === 0) {
      // Free credits purchase via Supabase
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/razorpay-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify({
            amount: 0,
            currency: 'INR',
            description: `Credits Purchase (${checkoutTier.amount} credits)` ,
            user_id: user?.id,
            payment_type: 'credits',
            credits_amount: checkoutTier.amount,
            is_free: true
          })
        });
        const data = await res.json();
        if (data.success && data.free) {
          setPaymentSuccess(true);
          toast.success('Credits added!');
          closeCheckout();
          fetchBalance();
        } else {
          toast.error('Failed to process free credits');
        }
      } catch (e) {
        toast.error('Failed to connect to server');
      }
      setIsProcessingPayment(false);
      return;
    }
    let data;
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/razorpay-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({
          amount: finalPrice,
          currency: 'INR',
          description: `Credits Purchase (${checkoutTier.amount} credits)`,
          user_id: user?.id,
          payment_type: 'credits',
          credits_amount: checkoutTier.amount
        })
      });
      data = await res.json();
    } catch (e) {
      setIsProcessingPayment(false);
      toast.error('Failed to connect to payment server');
      return;
    }
    if (!data.success) {
      setIsProcessingPayment(false);
      toast.error('Failed to initiate payment');
      return;
    }
    // Open Razorpay
    const options = {
      key: data.key_id,
      amount: data.amount,
      currency: data.currency,
      name: 'Selectz',
      image: '/selectz.logo.png',
      description: `Credits Purchase (${checkoutTier.amount} credits)` ,
      order_id: data.order_id,
      handler: function (response: any) {
        setPaymentSuccess(true);
        toast.success('Payment successful!');
        closeCheckout();
        fetchBalance();
      },
      prefill: {
        email: user?.email,
      },
      theme: { color: '#185a9d' },
    };
    // @ts-ignore
    const rzp = new window.Razorpay(options);
    rzp.open();
    setIsProcessingPayment(false);
  };

  // Animated number for balance
  const AnimatedBalance = ({ value }: { value: number }) => (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.5 }}
      className="text-5xl font-extrabold text-[#185a9d] tracking-tight"
    >
      {value}
    </motion.span>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-0 px-0 relative">
      <div className="w-full flex flex-col items-center justify-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full text-center pt-10 md:pt-16 mb-6 md:mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#f1f5f9] shadow">
              <FaWallet className="text-3xl text-[#185a9d]" />
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#185a9d] tracking-tight">Employer Credits</h1>
          </div>
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto">Manage, track, and purchase credits for unlocking job seeker profiles</p>
        </motion.div>

        {/* Main Content Card */}
        <div className={`w-full max-w-2xl bg-[#f4f8fb] rounded-3xl border border-[#e3f0fa] shadow-lg p-4 md:p-10 mb-8 md:mb-16 flex flex-col gap-8 md:gap-12`}>
          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12 relative overflow-hidden"
          >
            <div className="flex-1 flex flex-col items-center md:items-start">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#f1f5f9] shadow">
                  <FaCoins className="text-2xl text-[#185a9d]" />
                </span>
                <span className="text-lg font-semibold text-[#185a9d]">Available Credits</span>
                <button onClick={() => setShowInfo(true)} className="ml-1 text-[#185a9d] hover:text-[#005bea] transition-colors duration-200">
                  <FaInfoCircle />
                </button>
              </div>
              <div className="h-16 flex items-end">
                <AnimatePresence>
                  {!loading && balance !== null && <AnimatedBalance value={balance} />}
                  {loading && <span className="text-5xl font-extrabold text-gray-400 animate-pulse">...</span>}
                </AnimatePresence>
              </div>
              <div className="flex gap-6 mt-4">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500 flex items-center gap-1">Used <FaInfoCircle className="inline text-[#185a9d] cursor-pointer" onClick={() => setShowWhereUsed(true)} /></span>
                  <span className="text-lg font-bold text-[#185a9d]">{used}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500 flex items-center gap-1">Where Used</span>
                  <button onClick={() => setShowWhereUsed(true)} className="text-xs text-[#185a9d] underline hover:text-[#005bea]">View</button>
                </div>
              </div>
            </div>
            {/* Decorative icon, subtle */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.08, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="absolute right-0 bottom-0 text-[8rem] md:text-[10rem] text-[#185a9d] pointer-events-none select-none opacity-10"
            >
              <FaCoins />
            </motion.div>
          </motion.div>

          {/* Buy Credits Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <h2 className="text-xl md:text-2xl font-bold text-[#185a9d] mb-4 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#f1f5f9] shadow">
                <FaShoppingCart className="text-xl text-[#185a9d]" />
              </span>
              Buy More Credits
            </h2>
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6`}>
              {CREDIT_TIERS.map(tier => (
                <motion.div
                  key={tier.amount}
                  whileHover={{ scale: 1.04, boxShadow: '0 8px 32px #b3d4fc' }}
                  className={`rounded-2xl bg-[#f4f8fb] border border-[#e3f0fa] shadow-lg p-6 flex flex-col items-center hover:shadow-xl hover:border-[#b3d4fc] transition-shadow duration-200`}
                >
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#f1f5f9] shadow mb-2">
                    <FaCoins className="text-2xl text-[#185a9d]" />
                  </span>
                  <span className="text-xl font-bold text-gray-900 mb-1">{tier.amount} credits</span>
                  <span className="text-gray-500 mb-4">₹{tier.price}</span>
                  <button
                    className={`px-6 py-2 bg-[#185a9d] text-white rounded-full font-semibold shadow hover:bg-[#43cea2] transition-colors duration-200 disabled:opacity-60`}
                    onClick={() => openCheckout(tier)}
                  >
                    <span className="flex items-center gap-2"><FaCheckCircle /> Buy</span>
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Usage History Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <h2 className="text-xl md:text-2xl font-bold text-[#185a9d] mb-4 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#f1f5f9] shadow">
                <FaInfoCircle className="text-xl text-[#185a9d]" />
              </span>
              Credits Usage History
            </h2>
            <div className={`bg-[#f4f8fb] rounded-2xl border border-[#e3f0fa] shadow-lg p-4 md:p-6 overflow-x-auto`}>
              <table className="min-w-full text-left">
                <thead>
                  <tr>
                    <th className="py-2 px-3 text-gray-500 font-semibold">Date</th>
                    <th className="py-2 px-3 text-gray-500 font-semibold">Type</th>
                    <th className="py-2 px-3 text-gray-500 font-semibold">Amount</th>
                    <th className="py-2 px-3 text-gray-500 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-gray-400 py-6">No usage history yet.</td>
                    </tr>
                  )}
                  {usage.map((item, idx) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b last:border-none"
                    >
                      <td className="py-2 px-3 text-gray-700">{item.date}</td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${item.type === 'Purchase' ? 'bg-[#f1f5f9] text-[#185a9d]' : 'bg-gray-200 text-gray-700'}`}>
                          {item.type === 'Purchase' ? <FaCoins className="text-[#185a9d]" /> : <FaWallet className="text-gray-500" />} {item.type}
                        </span>
                      </td>
                      <td className={`py-2 px-3 font-bold ${item.amount > 0 ? 'text-[#185a9d]' : 'text-red-500'}`}>{item.amount > 0 ? '+' : ''}{item.amount}</td>
                      <td className="py-2 px-3 text-gray-600">{item.details}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl`}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4 text-[#185a9d] flex items-center gap-2"><FaInfoCircle /> What are Credits?</h2>
              <p className="text-gray-700 mb-4">Credits are used to unlock and view full job seeker profiles. Each profile view costs 1 credit. You can purchase credits in bundles and track your usage below.</p>
              <button
                className={`mt-4 px-6 py-2 bg-[#185a9d] text-white rounded-full font-semibold hover:bg-[#43cea2] transition-colors`}
                onClick={() => setShowInfo(false)}
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Where Used Modal */}
      <AnimatePresence>
        {showWhereUsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setShowWhereUsed(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl`}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4 text-[#185a9d] flex items-center gap-2"><FaWallet /> Where Were Credits Used?</h2>
              <ul className="text-gray-700 mb-4 text-left list-disc pl-6 max-h-60 overflow-y-auto">
                {usage.filter(u => u.amount < 0).map(u => (
                  <li key={u.id}>{u.date}: {u.details} ({u.amount} credit)</li>
                ))}
                {usage.filter(u => u.amount < 0).length === 0 && <li>No credits used yet.</li>}
              </ul>
              <button
                className={`mt-4 px-6 py-2 bg-[#185a9d] text-white rounded-full font-semibold hover:bg-[#43cea2] transition-colors`}
                onClick={() => setShowWhereUsed(false)}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {checkoutTier && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={closeCheckout}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl`}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4 text-[#185a9d] flex items-center gap-2"><FaShoppingCart /> Checkout</h2>
              <div className="mb-4 text-left">
                <div className="flex justify-between mb-2"><span>Credits:</span><span className="font-bold">{checkoutTier.amount}</span></div>
                <div className="flex justify-between mb-2"><span>Price:</span><span>₹{checkoutTier.price}</span></div>
                <div className="flex justify-between mb-2 items-center">
                  <span>Coupon:</span>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm w-32 focus:border-[#185a9d] focus:ring-[#185a9d]"
                    placeholder="Enter coupon"
                    disabled={isValidatingCoupon}
                  />
                  <button
                    onClick={validateCoupon}
                    disabled={isValidatingCoupon || !couponCode.trim()}
                    className={`ml-2 px-4 py-2 rounded-lg bg-[#185a9d] text-white text-sm font-semibold disabled:opacity-50`}
                  >
                    {isValidatingCoupon ? <FaSpinner className="animate-spin inline" /> : 'Apply'}
                  </button>
                </div>
                {couponValidation && (
                  <div className={`text-sm mt-1 ${couponValidation.valid ? 'text-blue-600' : 'text-red-600'}`}>{couponValidation.message}{couponValidation.discount_amount && ` (Discount: ₹${couponValidation.discount_amount})`}</div>
                )}
                <div className="flex justify-between mt-2 text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-blue-600">₹{getFinalPrice()}</span>
                </div>
              </div>
              <button
                onClick={handlePay}
                disabled={isProcessingPayment}
                className={`w-full py-3 px-4 rounded-lg font-semibold mt-2 bg-[#185a9d] text-white hover:bg-[#43cea2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isProcessingPayment ? (
                  <span className="flex items-center justify-center gap-2"><FaSpinner className="animate-spin" /> Processing...</span>
                ) : (
                  `Pay ₹${getFinalPrice()}`
                )}
              </button>
              {paymentSuccess && <div className="mt-4 text-blue-600 font-semibold">Payment successful! Credits added.</div>}
              <button
                className="mt-4 px-6 py-2 rounded-full font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                onClick={closeCheckout}
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Credits; 
