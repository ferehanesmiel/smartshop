import React, { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { 
  Store, 
  Phone, 
  MapPin, 
  CreditCard, 
  Bell, 
  Shield, 
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { PLANS, PlanType } from '../constants';

const Settings = () => {
  const { shop } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    shopName: '',
    phone: '',
    address: '',
    ownerName: '',
    email: '',
    description: '',
    logoUrl: '',
    isMarketplaceEnabled: false,
  });

  const [notifications, setNotifications] = useState({
    sales: true,
    inventory: true,
    orders: true,
    marketing: false
  });

  useEffect(() => {
    if (shop) {
      setFormData({
        shopName: shop.shopName || '',
        phone: shop.phone || '',
        address: shop.address || '',
        ownerName: shop.ownerName || '',
        email: shop.email || '',
        description: shop.description || '',
        logoUrl: shop.logoUrl || '',
        isMarketplaceEnabled: shop.isMarketplaceEnabled || false,
      });
    }
  }, [shop]);

  const handleUpdateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const shopRef = doc(db, 'shops', shop.shopId);
      await updateDoc(shopRef, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Update error:', err);
      setError('Failed to update settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planName: string) => {
    if (!shop) return;
    setLoading(true);
    try {
      const shopRef = doc(db, 'shops', shop.shopId);
      const planInfo = PLANS[planName.toLowerCase() as PlanType];
      await updateDoc(shopRef, {
        plan: planName.toLowerCase(),
        planLimits: planInfo.limits,
        updatedAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      // In a real app, we'd redirect to a payment gateway here
      alert(`Upgrading to ${planName} plan. In a real app, this would redirect to payment.`);
    } catch (err) {
      console.error('Upgrade error:', err);
      setError('Failed to upgrade plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const plans = Object.entries(PLANS).map(([key, plan]) => ({
    id: key,
    name: plan.name,
    price: `${plan.price} Birr/mo`,
    features: [
      `${plan.limits.products === Infinity ? 'Unlimited' : plan.limits.products} Products`,
      `${plan.limits.users === Infinity ? 'Unlimited' : plan.limits.users} Users`,
      ...plan.features
    ],
    current: (shop?.plan || 'basic') === key
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your shop profile and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'profile', label: 'Shop Profile', icon: Store },
            { id: 'subscription', label: 'Subscription', icon: CreditCard },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security', icon: Shield },
          ].map((item) => (
            <button
              key={item.id}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                item.id === 'profile' ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Shop Profile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Shop Profile</h3>
              <p className="text-sm text-gray-500">This information will be visible on your digital receipts and online store.</p>
            </div>
            <form onSubmit={handleUpdateShop} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Shop Name</label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      required
                      value={formData.shopName}
                      onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Shop Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Shop Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none h-24"
                    placeholder="Tell customers about your shop..."
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Logo URL</label>
                  <input
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <input
                    type="checkbox"
                    id="marketplaceEnabled"
                    checked={formData.isMarketplaceEnabled}
                    onChange={(e) => setFormData({ ...formData, isMarketplaceEnabled: e.target.checked })}
                    disabled={shop?.subscriptionPlan !== 'premium'}
                    className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 disabled:opacity-50"
                  />
                  <div className="flex flex-col">
                    <label htmlFor="marketplaceEnabled" className={cn("text-sm font-bold text-emerald-900", shop?.subscriptionPlan !== 'premium' ? "opacity-50" : "cursor-pointer")}>
                      Enable Marketplace Selling
                    </label>
                    {shop?.subscriptionPlan !== 'premium' && (
                      <span className="text-xs text-emerald-700 mt-1">
                        Available on Premium plan. Upgrade to start selling online.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              {success && (
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  Settings updated successfully!
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Subscription Plans */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Subscription Plan</h3>
              <p className="text-sm text-gray-500">Choose the plan that best fits your business needs.</p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={cn(
                    "p-6 rounded-3xl border-2 transition-all flex flex-col h-full",
                    plan.current ? "border-emerald-500 bg-emerald-50/30 shadow-md" : "border-gray-100 hover:border-emerald-200 bg-white"
                  )}
                >
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-xl text-gray-900">{plan.name}</h4>
                      {plan.current && (
                        <span className="text-[10px] font-bold uppercase bg-emerald-600 text-white px-2 py-1 rounded-full">Active</span>
                      )}
                    </div>
                    <p className="font-bold text-2xl text-gray-900">{plan.price}</p>
                  </div>
                  
                  <div className="flex-1 space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-600 leading-tight">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {!plan.current && (
                    <button 
                      onClick={() => handleUpgrade(plan.name)}
                      className={cn(
                        "w-full py-3 rounded-xl text-sm font-bold transition-all mt-auto",
                        plan.name === 'Pro' 
                          ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200" 
                          : "bg-gray-900 text-white hover:bg-gray-800 shadow-md shadow-gray-200"
                      )}
                    >
                      Upgrade to {plan.name}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Notification Preferences</h3>
              <p className="text-sm text-gray-500">Control how you receive updates and alerts.</p>
            </div>
            <div className="p-6 space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900 capitalize">{key} Notifications</p>
                    <p className="text-xs text-gray-500">Receive alerts about {key} activity</p>
                  </div>
                  <button
                    onClick={() => setNotifications({ ...notifications, [key]: !value })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      value ? "bg-emerald-600" : "bg-gray-200"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      value ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
