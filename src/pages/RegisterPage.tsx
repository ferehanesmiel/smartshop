import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { setDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Store, Mail, Lock, User, Phone, AlertCircle, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { PLANS, PlanType } from '../constants';

const RegisterPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialPlan = (queryParams.get('plan') as PlanType) || 'basic';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    ownerName: '',
    shopName: '',
    phone: '',
  });
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(initialPlan);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (initialPlan && PLANS[initialPlan]) {
      setSelectedPlan(initialPlan);
    }
  }, [initialPlan]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Check if slug is available
      const slug = formData.shopName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const shopsRef = collection(db, 'shops');
      const q = query(shopsRef, where('slug', '==', slug));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('Shop name is already taken. Please try another one.');
      }

      // 2. Create User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 3. Create Shop Document
      const shopId = doc(collection(db, 'shops')).id;
      const planInfo = PLANS[selectedPlan];
      const now = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(now.getDate() + 30); // 30 days trial/subscription

      await setDoc(doc(db, 'shops', shopId), {
        shopId,
        shopName: formData.shopName,
        ownerName: formData.ownerName,
        phone: formData.phone,
        email: formData.email,
        plan: selectedPlan,
        subscriptionStatus: 'active',
        subscriptionStartDate: now.toISOString(),
        subscriptionExpiryDate: expiryDate.toISOString(),
        onlineStoreEnabled: false,
        status: 'active',
        createdAt: now.toISOString(),
        ownerUid: user.uid,
        slug,
        currentProductCount: 0,
        currentUserCount: 1,
        currentBranchCount: 1,
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const planDetails = PLANS[selectedPlan];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 py-12">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[#ff6600] rounded-xl flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="text-white w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Register Your Shop</h1>
            <p className="text-gray-500 mt-2">Start managing your business today</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="shopName"
                  type="text"
                  required
                  value={formData.shopName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6600] focus:border-transparent transition-all outline-none"
                  placeholder="Abyssinia Boutique"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="ownerName"
                  type="text"
                  required
                  value={formData.ownerName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6600] focus:border-transparent transition-all outline-none"
                  placeholder="Abebe Bikila"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6600] focus:border-transparent transition-all outline-none"
                  placeholder="+251 911 223 344"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6600] focus:border-transparent transition-all outline-none"
                  placeholder="owner@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6600] focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff6600] text-white py-3 rounded-xl font-bold hover:bg-[#e65c00] transition-all shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Shop Account'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            Already have a shop?{' '}
            <Link to="/login" className="text-[#ff6600] font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        {/* Selected Plan Summary */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Selected Plan</h2>
          
          <div className="p-6 rounded-2xl bg-orange-50 border border-orange-100 mb-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{planDetails.name} Plan</h3>
                <p className="text-orange-600 font-bold">{planDetails.price} Birr / month</p>
              </div>
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
            <p className="text-gray-600 text-sm">You selected the {planDetails.name} Plan – {planDetails.price} Birr/month</p>
          </div>

          <div className="space-y-4 flex-grow">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Plan Features</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600">POS Sales System</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600">Inventory Management</span>
              </div>
              {planDetails.features.advancedReports && (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">Advanced Reports</span>
                </div>
              )}
              {planDetails.features.onlineStore && (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">Online Store</span>
                </div>
              )}
              {planDetails.features.multiBranch && (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">Multi-branch Management</span>
                </div>
              )}
              {planDetails.features.smsNotifications && (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">SMS Notifications</span>
                </div>
              )}
            </div>

            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest pt-4">Plan Limits</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-bold">Users</p>
                <p className="text-lg font-bold text-gray-900">{planDetails.limits.users === Infinity ? 'Unlimited' : planDetails.limits.users}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-bold">Products</p>
                <p className="text-lg font-bold text-gray-900">{planDetails.limits.products === Infinity ? 'Unlimited' : planDetails.limits.products}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Need a different plan? <Link to="/#pricing" className="text-[#ff6600] font-bold hover:underline">Change Plan</Link>
            </p>
          </div>
        </div>
      </div>
      
      <Link to="/" className="mt-8 text-sm text-gray-500 hover:text-[#ff6600] transition-colors">
        ← Back to home
      </Link>
    </div>
  );
};

export default RegisterPage;
