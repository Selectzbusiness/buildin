import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCreditCard, 
  FaCoins, 
  FaCheck, 
  FaTimes, 
  FaDownload,
  FaRupeeSign
} from 'react-icons/fa';

interface Plan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  billingCycle: 'per-post' | 'monthly';
  features: string[];
  jobPosts: number;
  highlighted?: boolean;
  type: 'traditional';
  category: 'basic' | 'professional' | 'enterprise';
  savings?: string;
}

interface CreditBundle {
  id: string;
  name: string;
  credits: number;
  price: number;
  originalPrice?: number;
  type: 'credits';
  highlighted?: boolean;
  savings?: string;
  popular?: boolean;
}

interface CouponValidation {
  valid: boolean;
  discount_type?: 'percentage' | 'flat';
  discount_value?: number;
  discount_amount?: number;
  message?: string;
}

interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  invoiceNumber: string;
  description: string;
  type: 'job_post' | 'credits';
}

const Billing: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<'traditional' | 'credits' | 'history'>('traditional');
  const [billingCycle, setBillingCycle] = useState<'per-post' | 'monthly'>('per-post');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedCreditBundle, setSelectedCreditBundle] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponValidation, setCouponValidation] = useState<CouponValidation | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Traditional Job Posting Plans
  const traditionalPlans: Plan[] = [
    {
      id: 'basic-per-post',
      name: 'Basic',
      price: 1999,
      billingCycle: 'per-post',
      features: [
        '30 days job listing',
        'Basic job visibility',
        'Standard application management',
        'Email support',
        'Basic candidate filtering'
      ],
      jobPosts: 1,
      type: 'traditional',
      category: 'basic'
    },
    {
      id: 'professional-per-post',
      name: 'Professional',
      price: 3499,
      billingCycle: 'per-post',
      features: [
        '30 days job listing',
        'Featured job placement',
        'Priority in search results',
        'Advanced application management',
        'Priority support',
        'Advanced candidate filtering',
        'Company branding'
      ],
      jobPosts: 1,
      type: 'traditional',
      category: 'professional',
      highlighted: true
    },
    {
      id: 'enterprise-per-post',
      name: 'Enterprise',
      price: 5999,
      billingCycle: 'per-post',
      features: [
        '30 days job listing',
        'Premium featured placement',
        'Top priority in search results',
        'Advanced application management',
        '24/7 dedicated support',
        'Advanced candidate filtering',
        'Custom branding',
        'Analytics dashboard',
        'API access'
      ],
      jobPosts: 1,
      type: 'traditional',
      category: 'enterprise'
    },
    {
      id: 'basic-monthly',
      name: 'Basic',
      price: 4999,
      originalPrice: 5997,
      billingCycle: 'monthly',
      features: [
        '5 job posts per month',
        'Basic analytics',
        'Email support',
        'Standard job visibility',
        'Basic candidate filtering',
        'Monthly savings'
      ],
      jobPosts: 5,
      type: 'traditional',
      category: 'basic',
      savings: 'Save ₹998'
    },
    {
      id: 'professional-monthly',
      name: 'Professional',
      price: 9999,
      originalPrice: 10497,
      billingCycle: 'monthly',
      features: [
        '15 job posts per month',
        'Advanced analytics',
        'Priority support',
        'Featured job listings',
        'Advanced candidate filtering',
        'Custom branding',
        'Monthly savings'
      ],
      jobPosts: 15,
      type: 'traditional',
      category: 'professional',
      highlighted: true,
      savings: 'Save ₹498'
    },
    {
      id: 'enterprise-monthly',
      name: 'Enterprise',
      price: 29999,
      originalPrice: 29997,
      billingCycle: 'monthly',
      features: [
        'Unlimited job posts',
        'Premium analytics',
        '24/7 dedicated support',
        'Featured job listings',
        'Advanced candidate filtering',
        'Custom branding',
        'API access',
        'Custom integrations',
        'Monthly savings'
      ],
      jobPosts: -1,
      type: 'traditional',
      category: 'enterprise',
      savings: 'Unlimited posts'
    }
  ];

  // Credit Bundles for Reverse Hiring
  const creditBundles: CreditBundle[] = [
    {
      id: 'credits-5',
      name: 'Starter Pack',
      credits: 5,
      price: 2500,
      type: 'credits'
    },
    {
      id: 'credits-15',
      name: 'Professional Pack',
      credits: 15,
      price: 6000,
      originalPrice: 7500,
      type: 'credits',
      highlighted: true,
      popular: true,
      savings: 'Save ₹1500'
    },
    {
      id: 'credits-30',
      name: 'Business Pack',
      credits: 30,
      price: 10000,
      originalPrice: 15000,
      type: 'credits',
      savings: 'Save ₹5000'
    },
    {
      id: 'credits-50',
      name: 'Enterprise Pack',
      credits: 50,
      price: 15000,
      originalPrice: 25000,
      type: 'credits',
      savings: 'Save ₹10000'
    }
  ];

  // Mock billing history
  const billingHistory: BillingHistory[] = [
    {
      id: 'inv_001',
      date: '2024-03-01',
      amount: 9999,
      status: 'paid',
      invoiceNumber: 'INV-2024-001',
      description: 'Professional Plan - Monthly',
      type: 'job_post'
    },
    {
      id: 'inv_002',
      date: '2024-02-01',
      amount: 6000,
      status: 'paid',
      invoiceNumber: 'INV-2024-002',
      description: 'Professional Credits Pack',
      type: 'credits'
    }
  ];

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setSelectedCreditBundle(null);
  };

  const handleCreditBundleSelect = (bundleId: string) => {
    setSelectedCreditBundle(bundleId);
    setSelectedPlan(null);
  };

  const handleSubscribe = () => {
    setShowPaymentModal(true);
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const selectedItem = selectedPlan 
        ? traditionalPlans.find(p => p.id === selectedPlan)
        : creditBundles.find(c => c.id === selectedCreditBundle);

      if (!selectedItem) {
        toast.error('Please select a plan or credit bundle first');
        return;
      }

      const { data, error } = await supabase.rpc('validate_coupon', {
        in_code: couponCode.trim(),
        in_user_id: user?.id,
        in_product_type: selectedPlan ? 'job_post' : 'credits',
        in_purchase_amount: selectedItem.price
      });

      if (error) {
        console.error('Coupon validation error:', error);
        toast.error('Failed to validate coupon');
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        setCouponValidation(result);
        
        if (result.valid) {
          toast.success(`Coupon applied! ${result.discount_type === 'percentage' ? `${result.discount_value}% off` : `₹${result.discount_amount} off`}`);
        } else {
          toast.error(result.message || 'Invalid coupon');
        }
      }
    } catch (error) {
      console.error('Coupon validation error:', error);
      toast.error('Failed to validate coupon');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const getFinalPrice = () => {
    const selectedItem = selectedPlan 
      ? traditionalPlans.find(p => p.id === selectedPlan)
      : creditBundles.find(c => c.id === selectedCreditBundle);

    if (!selectedItem) return 0;

    let finalPrice = selectedItem.price;
    
    if (couponValidation?.valid && couponValidation.discount_amount) {
      finalPrice -= couponValidation.discount_amount;
    }

    return Math.max(0, finalPrice);
  };

  const handlePaymentSubmit = async () => {
    setIsProcessingPayment(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update coupon usage if coupon was applied
      if (couponValidation?.valid) {
        const selectedItem = selectedPlan 
          ? traditionalPlans.find(p => p.id === selectedPlan)
          : creditBundles.find(c => c.id === selectedCreditBundle);

        if (selectedItem) {
          // Update coupon usage
          const { data: couponData } = await supabase
            .from('coupons')
            .select('used_count')
            .eq('code', couponCode)
            .single();

          if (couponData) {
            await supabase
              .from('coupons')
              .update({ used_count: couponData.used_count + 1 })
              .eq('code', couponCode);
          }

          // Insert usage record
          await supabase
            .from('coupon_usages')
            .insert({
              coupon_id: couponCode, // You might need to get the actual coupon ID
              user_id: user?.id,
              order_id: `order_${Date.now()}`,
              amount_before: selectedItem.price,
              amount_after: getFinalPrice()
            });
        }
      }

      toast.success('Payment successful!');
    setShowPaymentModal(false);
      setCouponCode('');
      setCouponValidation(null);
      setSelectedPlan(null);
      setSelectedCreditBundle(null);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const renderTraditionalPlans = () => {
    const filteredPlans = traditionalPlans.filter(plan => plan.billingCycle === billingCycle);

    return (
      <div className="space-y-6">
        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-white rounded-full shadow-lg p-1">
            <button
              onClick={() => setBillingCycle('per-post')}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'per-post'
                  ? 'bg-[#185a9d] text-white shadow-sm'
                  : 'text-gray-600 hover:text-[#185a9d] hover:bg-[#e3f0fa]'
              }`}
            >
              Per Post
            </button>
                <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-[#185a9d] text-white shadow-sm'
                  : 'text-gray-600 hover:text-[#185a9d] hover:bg-[#e3f0fa]'
              }`}
            >
              Monthly
                </button>
              </div>
            </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <motion.div
                key={plan.id}
                whileHover={{ scale: isSelected ? 1 : 1.02 }}
                className={[
                  'relative bg-[#f4f8fb] rounded-2xl border-2 transition-all duration-200 cursor-pointer',
                  isSelected ? 'border-[#43cea2] shadow-xl' : 'border-[#e3f0fa]',
                  !isSelected ? 'hover:border-[#43cea2] hover:shadow-xl' : ''
                ].join(' ')}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-[#43cea2] text-white px-4 py-1 rounded-full text-xs font-semibold shadow">
                      Most Popular
                    </span>
            </div>
                )}
                
                {plan.savings && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-[#185a9d] text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {plan.savings}
                    </span>
              </div>
            )}

                <div className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <FaRupeeSign className="text-[#185a9d]" />
                      <span className="text-3xl font-bold text-[#185a9d]">{plan.price.toLocaleString()}</span>
                      {plan.originalPrice && (
                        <span className="text-lg text-gray-500 line-through">
                          ₹{plan.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {billingCycle === 'per-post' ? 'per job post' : 'per month'}
                    </p>
                    {plan.jobPosts === -1 ? (
                      <p className="text-sm font-medium text-[#43cea2] mt-2">Unlimited job posts</p>
                    ) : (
                      <p className="text-sm font-medium text-[#43cea2] mt-2">
                        {plan.jobPosts} job post{plan.jobPosts > 1 ? 's' : ''} {billingCycle === 'monthly' ? 'per month' : ''}
                      </p>
            )}
          </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <FaCheck className="text-[#43cea2] mt-1 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                      selectedPlan === plan.id
                        ? 'bg-[#43cea2] text-white'
                        : 'bg-[#185a9d] text-white hover:bg-[#43cea2]'
                    }`}
                  >
                    {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCreditBundles = () => {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#185a9d] mb-2">Reverse Hiring Credits</h2>
          <p className="text-gray-600">Buy credits to unlock and view job seeker profiles</p>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {creditBundles.map((bundle) => {
            const isSelected = selectedCreditBundle === bundle.id;
            return (
              <motion.div
                key={bundle.id}
                whileHover={{ scale: isSelected ? 1 : 1.02 }}
                className={[
                  'relative bg-[#f4f8fb] rounded-2xl border-2 transition-all duration-200 cursor-pointer',
                  isSelected ? 'border-[#43cea2] shadow-xl' : 'border-[#e3f0fa]',
                  !isSelected ? 'hover:border-[#43cea2] hover:shadow-xl' : ''
                ].join(' ')}
                onClick={() => handleCreditBundleSelect(bundle.id)}
              >
                {bundle.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-[#43cea2] text-white px-4 py-1 rounded-full text-xs font-semibold shadow">
                      Popular
          </span>
        </div>
                )}
                
                {bundle.savings && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-[#185a9d] text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {bundle.savings}
                    </span>
          </div>
                )}

                <div className="p-6 text-center">
                  <div className="mb-4">
                    <FaCoins className="text-4xl text-[#43cea2] mx-auto mb-2" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{bundle.name}</h3>
                    <p className="text-2xl font-bold text-[#185a9d] mb-1">{bundle.credits} Credits</p>
          </div>

                  <div className="flex items-center justify-center gap-2 mb-4">
                    <FaRupeeSign className="text-[#185a9d]" />
                    <span className="text-2xl font-bold text-[#185a9d]">{bundle.price.toLocaleString()}</span>
                    {bundle.originalPrice && (
                      <span className="text-lg text-gray-500 line-through">
                        ₹{bundle.originalPrice.toLocaleString()}
                      </span>
                    )}
        </div>

                  <p className="text-sm text-gray-600 mb-4">
                    ₹{(bundle.price / bundle.credits).toFixed(0)} per credit
                  </p>

          <button
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                      selectedCreditBundle === bundle.id
                        ? 'bg-[#43cea2] text-white'
                        : 'bg-[#185a9d] text-white hover:bg-[#43cea2]'
                    }`}
                  >
                    {selectedCreditBundle === bundle.id ? 'Selected' : 'Select Bundle'}
          </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBillingHistory = () => {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#185a9d] mb-2">Billing History</h2>
          <p className="text-gray-600">View your past transactions and invoices</p>
      </div>

        <div className="bg-[#f4f8fb] rounded-2xl border border-[#e3f0fa] shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#e3f0fa]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Invoice
                  </th>
            </tr>
          </thead>
              <tbody className="divide-y divide-[#e3f0fa]">
            {billingHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-[#e3f0fa] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(item.date).toLocaleDateString()}
                </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.type === 'job_post' 
                          ? 'bg-[#e3f0fa] text-[#185a9d]' 
                          : 'bg-[#f0f9ff] text-[#0c4a6e]'
                      }`}>
                        {item.type === 'job_post' ? 'Job Post' : 'Credits'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{item.amount.toLocaleString()}
                    </td>
                <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : item.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                  }`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button className="text-[#43cea2] hover:text-[#185a9d] transition-colors">
                        <FaDownload className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
  };

  const renderPaymentModal = () => {
    const selectedItem = selectedPlan 
      ? traditionalPlans.find(p => p.id === selectedPlan)
      : creditBundles.find(c => c.id === selectedCreditBundle);

    if (!selectedItem) return null;

    const originalPrice = selectedItem.price;
    const discountAmount = couponValidation?.valid ? couponValidation.discount_amount || 0 : 0;
    const finalPrice = getFinalPrice();

  return (
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Complete Purchase</h3>
                  <p className="text-gray-600 mt-1">{selectedItem.name}</p>
                </div>
            <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="w-6 h-6" />
            </button>
      </div>

              {/* Order Summary */}
              <div className="bg-[#f4f8fb] rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{selectedItem.name}</span>
                    <span className="font-medium">₹{originalPrice.toLocaleString()}</span>
                    </div>

                  {couponValidation?.valid && (
                    <div className="flex justify-between text-[#43cea2]">
                      <span>Discount</span>
                      <span>-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-[#e3f0fa] pt-2 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>₹{finalPrice.toLocaleString()}</span>
                    </div>
                  </div>
            </div>
          </div>

              {/* Coupon Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Have a coupon code?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 px-4 py-2 border border-[#e3f0fa] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43cea2] focus:border-[#43cea2]"
                  />
                <button
                    onClick={validateCoupon}
                    disabled={isValidatingCoupon || !couponCode.trim()}
                    className="px-4 py-2 bg-[#185a9d] text-white rounded-lg font-medium hover:bg-[#43cea2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isValidatingCoupon ? '...' : 'Apply'}
                </button>
            </div>

                {couponValidation && (
                  <div className={`mt-2 p-2 rounded-lg text-sm ${
                    couponValidation.valid 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {couponValidation.valid ? (
                      <div className="flex items-center gap-2">
                        <FaCheck className="w-4 h-4" />
                        <span>Coupon applied successfully!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <FaTimes className="w-4 h-4" />
                        <span>{couponValidation.message}</span>
                    </div>
                    )}
                  </div>
                )}
          </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border border-[#e3f0fa] rounded-lg cursor-pointer hover:bg-[#f4f8fb] transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      defaultChecked
                      className="text-[#43cea2] focus:ring-[#43cea2]"
                    />
                    <FaCreditCard className="w-5 h-5 text-[#185a9d] ml-3" />
                    <span className="ml-3 text-gray-700">Credit/Debit Card</span>
                  </label>
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePaymentSubmit}
                disabled={isProcessingPayment}
                className="w-full py-3 px-4 bg-[#185a9d] text-white rounded-lg font-semibold hover:bg-[#43cea2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingPayment ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </div>
                ) : (
                  `Pay ₹${finalPrice.toLocaleString()}`
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By completing this purchase, you agree to our terms of service and privacy policy.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#185a9d] mb-2">Billing & Subscriptions</h1>
          <p className="text-gray-600">Choose the perfect plan for your hiring needs</p>
                </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-white rounded-full shadow-lg p-1">
            <button
              onClick={() => setActiveTab('traditional')}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                activeTab === 'traditional'
                  ? 'bg-[#185a9d] text-white shadow-sm'
                  : 'text-gray-600 hover:text-[#185a9d] hover:bg-[#e3f0fa]'
              }`}
            >
              Traditional Job Posting
            </button>
                <button
              onClick={() => setActiveTab('credits')}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                activeTab === 'credits'
                  ? 'bg-[#185a9d] text-white shadow-sm'
                  : 'text-gray-600 hover:text-[#185a9d] hover:bg-[#e3f0fa]'
              }`}
            >
              Reverse Hiring (Credits)
                </button>
                <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-[#185a9d] text-white shadow-sm'
                  : 'text-gray-600 hover:text-[#185a9d] hover:bg-[#e3f0fa]'
              }`}
            >
              Billing History
                </button>
              </div>
            </div>

        {/* Content */}
        <div className="mb-8">
          {activeTab === 'traditional' && renderTraditionalPlans()}
          {activeTab === 'credits' && renderCreditBundles()}
          {activeTab === 'history' && renderBillingHistory()}
        </div>

        {/* Subscribe Button */}
        {(selectedPlan || selectedCreditBundle) && activeTab !== 'history' && (
          <div className="text-center">
            <button
              onClick={handleSubscribe}
              className="px-8 py-4 bg-[#185a9d] text-white rounded-full font-semibold text-lg hover:bg-[#43cea2] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Continue to Payment
            </button>
          </div>
        )}

        {/* Payment Modal */}
        {renderPaymentModal()}
      </div>
    </div>
  );
};

export default Billing; 