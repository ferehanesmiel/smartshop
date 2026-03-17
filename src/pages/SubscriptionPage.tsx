import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, CreditCard, Building2, UserCheck, AlertCircle } from 'lucide-react';
import { PLANS, PlanType } from '../constants';
import { useAuth } from '../AuthContext';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const SubscriptionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { shop, user } = useAuth();
  
  const queryParams = new URLSearchParams(location.search);
  const initialPlan = (queryParams.get('plan') as PlanType) || shop?.plan || 'basic';
  
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(initialPlan);
  const [paymentMethod, setPaymentMethod] = useState<'telebirr' | 'bank_transfer' | 'manual'>('telebirr');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  const planDetails = PLANS[selectedPlan];

  const handlePayment = async () => {
    if (!shop || !user) return;
    setLoading(true);
    setError(null);

    try {
      // Create payment record
      const paymentRef = await addDoc(collection(db, 'payments'), {
        shop_id: shop.shopId,
        amount: planDetails.price,
        payment_method: paymentMethod,
        transaction_id: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        payment_date: new Date().toISOString(),
        status: paymentMethod === 'manual' ? 'pending' : 'completed'
      });

      if (paymentMethod !== 'manual') {
        const now = new Date();
        const expiryDate = new Date();
        expiryDate.setDate(now.getDate() + 30);

        // Update shop subscription
        await updateDoc(doc(db, 'shops', shop.shopId), {
          plan: selectedPlan,
          subscriptionStatus: 'active',
          subscriptionStartDate: now.toISOString(),
          subscriptionExpiryDate: expiryDate.toISOString(),
        });

        // Create subscription record
        await addDoc(collection(db, 'subscriptions'), {
          shop_id: shop.shopId,
          plan_name: selectedPlan,
          price: planDetails.price,
          start_date: now.toISOString(),
          end_date: expiryDate.toISOString(),
          status: 'active',
          payment_method: paymentMethod,
          transaction_id: paymentRef.id
        });

        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setSuccess(true);
        // For manual, we wait for admin approval
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900">Complete Your Subscription</h1>
          <p className="mt-4 text-lg text-gray-600">Choose your plan and payment method to continue.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Selected Plan</h2>
            
            <div className="mb-6">
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value as PlanType)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {Object.entries(PLANS).map(([key, plan]) => (
                  <option key={key} value={key}>
                    {plan.name} - {plan.price} Birr/month
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Monthly Price</span>
                <span className="text-2xl font-bold text-gray-900">{planDetails.price} Birr</span>
              </div>
              
              <div className="pt-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Includes:</h3>
                <ul className="space-y-3">
                  {Object.entries(planDetails.features).map(([key, value]) => value && (
                    <li key={key} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-gray-600">Up to {planDetails.limits.products === Infinity ? 'Unlimited' : planDetails.limits.products} products</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-gray-600">Up to {planDetails.limits.users === Infinity ? 'Unlimited' : planDetails.limits.users} users</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>
            
            <div className="space-y-4 mb-8">
              <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'telebirr' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name="payment"
                  value="telebirr"
                  checked={paymentMethod === 'telebirr'}
                  onChange={() => setPaymentMethod('telebirr')}
                  className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                />
                <div className="ml-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Telebirr</p>
                    <p className="text-sm text-gray-500">Pay instantly via Telebirr app</p>
                  </div>
                </div>
              </label>

              <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'bank_transfer' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name="payment"
                  value="bank_transfer"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={() => setPaymentMethod('bank_transfer')}
                  className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                />
                <div className="ml-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Bank Transfer</p>
                    <p className="text-sm text-gray-500">Direct transfer to our account</p>
                  </div>
                </div>
              </label>

              <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'manual' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name="payment"
                  value="manual"
                  checked={paymentMethod === 'manual'}
                  onChange={() => setPaymentMethod('manual')}
                  className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                />
                <div className="ml-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Manual Approval</p>
                    <p className="text-sm text-gray-500">Pay cash or other methods</p>
                  </div>
                </div>
              </label>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            {success ? (
              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-center font-medium">
                {paymentMethod === 'manual' 
                  ? 'Payment submitted for approval. We will activate your account shortly.' 
                  : 'Payment successful! Redirecting to dashboard...'}
              </div>
            ) : (
              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
              >
                {loading ? 'Processing...' : `Pay ${planDetails.price} Birr Now`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
