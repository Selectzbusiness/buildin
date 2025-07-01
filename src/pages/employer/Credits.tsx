import React, { useContext, useEffect, useState } from 'react';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWallet, FaCoins, FaInfoCircle, FaShoppingCart, FaCheckCircle } from 'react-icons/fa';

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
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showWhereUsed, setShowWhereUsed] = useState(false);
  const [usage, setUsage] = useState(MOCK_USAGE);

  useEffect(() => {
    fetchBalance();
    // In real app, fetch usage history from backend
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

  const handlePurchase = async (amount: number, price: number) => {
    setPurchasing(amount);
    setTimeout(() => {
      toast.success(`Purchased ${amount} credits for ₹${price}`);
      setPurchasing(null);
      setUsage([
        { id: Date.now(), type: 'Purchase', amount, date: new Date().toISOString().slice(0, 10), details: 'Bought credits' },
        ...usage,
      ]);
      fetchBalance();
    }, 1200);
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
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center py-12 px-2">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-[#185a9d] flex items-center justify-center gap-3 mb-2">
          <FaWallet className="text-[#43cea2]" /> Employer Credits
        </h1>
        <p className="text-gray-600 text-lg">Manage, track, and purchase credits for unlocking job seeker profiles</p>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-2xl bg-[#f4f8fb] rounded-3xl border border-[#e3f0fa] shadow-lg p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
      >
        <div className="flex-1 flex flex-col items-center md:items-start">
          <div className="flex items-center gap-3 mb-2">
            <FaCoins className="text-4xl text-[#43cea2] drop-shadow" />
            <span className="text-lg font-semibold text-gray-700">Available Credits</span>
            <button onClick={() => setShowInfo(true)} className="ml-1 text-[#43cea2] hover:text-[#185a9d]">
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
              <span className="text-xs text-gray-500 flex items-center gap-1">Used <FaInfoCircle className="inline text-[#43cea2] cursor-pointer" onClick={() => setShowWhereUsed(true)} /></span>
              <span className="text-lg font-bold text-[#185a9d]">{used}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 flex items-center gap-1">Where Used</span>
              <button onClick={() => setShowWhereUsed(true)} className="text-xs text-[#43cea2] underline hover:text-[#185a9d]">View</button>
            </div>
          </div>
        </div>
        {/* Animated background coins */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.15, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="absolute right-0 bottom-0 text-[12rem] text-[#b3d4fc] pointer-events-none select-none"
        >
          <FaCoins />
        </motion.div>
      </motion.div>

      {/* Buy Credits Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="w-full max-w-2xl mb-10"
      >
        <h2 className="text-2xl font-bold text-[#185a9d] mb-4 flex items-center gap-2">
          <FaShoppingCart className="text-[#43cea2]" /> Buy More Credits
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CREDIT_TIERS.map(tier => (
            <motion.div
              key={tier.amount}
              whileHover={{ scale: 1.04, boxShadow: '0 8px 32px #b3d4fc' }}
              className="bg-[#f4f8fb] rounded-2xl border border-[#e3f0fa] shadow-lg p-6 flex flex-col items-center hover:shadow-xl hover:border-[#b3d4fc] transition-shadow duration-200"
            >
              <FaCoins className="text-3xl text-[#43cea2] mb-2" />
              <span className="text-xl font-bold text-gray-900 mb-1">{tier.amount} credits</span>
              <span className="text-gray-500 mb-4">₹{tier.price}</span>
                <button
                className="px-6 py-2 bg-[#185a9d] text-white rounded-full font-semibold shadow hover:bg-[#43cea2] transition-colors duration-200 disabled:opacity-60"
                  disabled={purchasing === tier.amount}
                  onClick={() => handlePurchase(tier.amount, tier.price)}
                >
                {purchasing === tier.amount ? (
                  <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> Processing...</span>
                ) : (
                  <span className="flex items-center gap-2"><FaCheckCircle /> Buy</span>
                )}
                </button>
            </motion.div>
            ))}
          </div>
      </motion.div>

      {/* Usage History Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-2xl mb-10"
      >
        <h2 className="text-2xl font-bold text-[#185a9d] mb-4 flex items-center gap-2">
          <FaInfoCircle className="text-[#43cea2]" /> Credits Usage History
        </h2>
        <div className="bg-[#f4f8fb] rounded-2xl border border-[#e3f0fa] shadow-lg p-6 overflow-x-auto">
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
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${item.type === 'Purchase' ? 'bg-[#e3f0fa] text-[#185a9d]' : 'bg-rose-100 text-rose-700'}`}>
                      {item.type === 'Purchase' ? <FaCoins /> : <FaWallet />} {item.type}
                    </span>
                  </td>
                  <td className={`py-2 px-3 font-bold ${item.amount > 0 ? 'text-[#185a9d]' : 'text-rose-500'}`}>{item.amount > 0 ? '+' : ''}{item.amount}</td>
                  <td className="py-2 px-3 text-gray-600">{item.details}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

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
              className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4 text-[#185a9d] flex items-center gap-2"><FaInfoCircle /> What are Credits?</h2>
              <p className="text-gray-700 mb-4">Credits are used to unlock and view full job seeker profiles. Each profile view costs 1 credit. You can purchase credits in bundles and track your usage below.</p>
              <button
                className="mt-4 px-6 py-2 bg-[#185a9d] text-white rounded-full font-semibold hover:bg-[#43cea2] transition-colors"
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
              className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4 text-[#185a9d] flex items-center gap-2"><FaWallet /> Where Were Credits Used?</h2>
              <ul className="text-gray-700 mb-4 text-left list-disc pl-6">
                {usage.filter(u => u.amount < 0).map(u => (
                  <li key={u.id}>{u.date}: {u.details} ({u.amount} credit)</li>
                ))}
                {usage.filter(u => u.amount < 0).length === 0 && <li>No credits used yet.</li>}
              </ul>
              <button
                className="mt-4 px-6 py-2 bg-[#185a9d] text-white rounded-full font-semibold hover:bg-[#43cea2] transition-colors"
                onClick={() => setShowWhereUsed(false)}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Credits; 
