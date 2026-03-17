import React, { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot, collection, addDoc, deleteDoc, query, where, increment } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { db, auth } from '../firebase';
import { useAuth } from '../AuthContext';
import { useSubscription } from '../SubscriptionContext';
import { 
  Store, 
  Phone, 
  MapPin, 
  CreditCard, 
  Bell, 
  Shield, 
  Save,
  CheckCircle2,
  AlertCircle,
  User,
  Plus,
  Trash2,
  Mail,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { PLANS, PlanType } from '../constants';
import { Staff } from '../types';

const Settings = () => {
  const { shop } = useAuth();
  const { isLimitReached, getLimit, plan: currentPlanKey, isFeatureAllowed } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  const userLimit = getLimit('users');
  const userLimitReached = isLimitReached('users', staff.length + 1); // +1 for the owner
  
  const [formData, setFormData] = useState({
    shopName: '',
    phone: '',
    address: '',
    ownerName: '',
    email: '',
    description: '',
    logoUrl: '',
    bannerUrl: '',
    category: '',
    isMarketplaceEnabled: false,
    isVatEnabled: false,
    vatRate: 15,
    vatType: 'exclusive' as 'inclusive' | 'exclusive',
    profitCalculationMethod: 'markup' as 'markup' | 'margin',
    currency: 'ETB',
    onlineStoreEnabled: false,
  });

  const [notifications, setNotifications] = useState({
    sales: true,
    inventory: true,
    orders: true,
    marketing: false
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [staffFormData, setStaffFormData] = useState({
    name: '',
    email: '',
    role: 'cashier' as 'admin' | 'manager' | 'cashier',
    phone: ''
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
        bannerUrl: shop.bannerUrl || '',
        category: shop.category || '',
        isMarketplaceEnabled: shop.isMarketplaceEnabled || false,
        isVatEnabled: shop.isVatEnabled || false,
        vatRate: shop.vatRate || 15,
        vatType: shop.vatType || 'exclusive',
        profitCalculationMethod: shop.profitCalculationMethod || 'markup',
        currency: shop.currency || 'ETB',
        onlineStoreEnabled: shop.onlineStoreEnabled || false,
      });
    }
  }, [shop]);

  useEffect(() => {
    if (!shop) return;

    const q = query(collection(db, 'staff'), where('shopId', '==', shop.shopId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffData = snapshot.docs.map(doc => ({
        staffId: doc.id,
        ...doc.data()
      })) as Staff[];
      setStaff(staffData);
    });

    return () => unsubscribe();
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

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    if (userLimitReached) {
      setError(`You have reached the user limit (${userLimit === Infinity ? 'Unlimited' : userLimit}) for your ${currentPlanKey} plan.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, 'staff'), {
        ...staffFormData,
        shopId: shop.shopId,
        status: 'active',
        createdAt: new Date().toISOString()
      });
      
      // Increment user count
      await updateDoc(doc(db, 'shops', shop.shopId), {
        currentUserCount: increment(1)
      });

      setIsStaffModalOpen(false);
      setStaffFormData({ name: '', email: '', role: 'cashier', phone: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Add staff error:', err);
      setError('Failed to add staff member.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      try {
        await deleteDoc(doc(db, 'staff', staffId));
        // Decrement user count
        await updateDoc(doc(db, 'shops', shop!.shopId), {
          currentUserCount: increment(-1)
        });
      } catch (err) {
        console.error('Delete staff error:', err);
        setError('Failed to remove staff member.');
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !auth.currentUser.email) return;

    if (securityData.newPassword !== securityData.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, securityData.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, securityData.newPassword);
      setSuccess(true);
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Password change error:', err);
      setError(err.message || 'Failed to update password. You may need to log out and log back in.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotifications = async () => {
    if (!shop) return;
    setLoading(true);
    try {
      const shopRef = doc(db, 'shops', shop.shopId);
      await updateDoc(shopRef, {
        notificationPreferences: notifications,
        updatedAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Notification update error:', err);
      setError('Failed to update notification settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planName: string) => {
    if (!shop) return;
    setLoading(true);
    try {
      const shopRef = doc(db, 'shops', shop.shopId);
      const planKey = planName.toLowerCase() as PlanType;
      const now = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(now.getDate() + 30);

      await updateDoc(shopRef, {
        plan: planKey,
        subscriptionStatus: 'active',
        subscriptionStartDate: now.toISOString(),
        subscriptionExpiryDate: expiryDate.toISOString(),
        updatedAt: now.toISOString()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
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
      plan.features.advancedReports ? 'Advanced Reports' : null,
      plan.features.onlineStore ? 'Online Store' : null,
      plan.features.multiBranch ? 'Multi-branch Support' : null,
      plan.features.smsNotifications ? 'SMS Notifications' : null,
    ].filter(Boolean) as string[],
    current: (shop?.plan || 'basic') === key
  }));

  const menuItems = [
    { id: 'profile', label: 'Shop Profile', icon: Store },
    { id: 'vat', label: 'VAT & Profit', icon: CreditCard },
    { id: 'users', label: 'User Management', icon: User },
    { id: 'branches', label: 'Branches', icon: MapPin, link: '/dashboard/branches' },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your shop profile, preferences, and system configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1">
          {menuItems.map((item) => (
            item.link ? (
              <Link
                key={item.id}
                to={item.link}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ) : (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                  activeTab === item.id ? "bg-emerald-50 text-emerald-700 shadow-sm" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            )
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {activeTab === 'profile' && (
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
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Shop Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    >
                      <option value="">Select a category</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Groceries">Groceries</option>
                      <option value="Home Goods">Home Goods</option>
                      <option value="Pharmacy">Pharmacy</option>
                      <option value="Restaurant">Restaurant</option>
                      <option value="Other">Other</option>
                    </select>
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
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Banner URL (Marketplace)</label>
                    <input
                      type="url"
                      value={formData.bannerUrl}
                      onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="https://example.com/banner.png"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <input
                      type="checkbox"
                      id="onlineStoreEnabled"
                      checked={formData.onlineStoreEnabled}
                      onChange={(e) => {
                        if (isFeatureAllowed('onlineStore')) {
                          setFormData({ ...formData, onlineStoreEnabled: e.target.checked });
                        } else {
                          alert('Online Store is not available on your current plan. Please upgrade to Pro or Premium.');
                        }
                      }}
                      className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 disabled:opacity-50"
                    />
                    <div className="flex flex-col">
                      <label htmlFor="onlineStoreEnabled" className="text-sm font-bold text-emerald-900 cursor-pointer">
                        Enable Online Store
                      </label>
                      <p className="text-xs text-emerald-700 mt-1">
                        Turn on your public storefront for customers to browse and order.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <input
                      type="checkbox"
                      id="marketplaceEnabled"
                      checked={formData.isMarketplaceEnabled}
                      onChange={(e) => setFormData({ ...formData, isMarketplaceEnabled: e.target.checked })}
                      disabled={shop?.plan !== 'premium'}
                      className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 disabled:opacity-50"
                    />
                    <div className="flex flex-col">
                      <label htmlFor="marketplaceEnabled" className={cn("text-sm font-bold text-emerald-900", shop?.plan !== 'premium' ? "opacity-50" : "cursor-pointer")}>
                        Enable Marketplace Selling
                      </label>
                      {shop?.plan !== 'premium' && (
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
          )}

          {activeTab === 'vat' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">VAT & Profit Calculation</h3>
                <p className="text-sm text-gray-500">Configure how taxes and profits are calculated for your shop.</p>
              </div>
              <form onSubmit={handleUpdateShop} className="p-6 space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <h4 className="font-bold text-gray-900">Enable VAT Calculation</h4>
                      <p className="text-xs text-gray-500">Automatically add VAT to sales and receipts</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isVatEnabled: !formData.isVatEnabled })}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        formData.isVatEnabled ? "bg-emerald-600" : "bg-gray-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        formData.isVatEnabled ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>

                  {formData.isVatEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">VAT Rate (%)</label>
                        <input
                          type="number"
                          value={formData.vatRate}
                          onChange={(e) => setFormData({ ...formData, vatRate: parseFloat(e.target.value) })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                          placeholder="15"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">VAT Type</label>
                        <select
                          value={formData.vatType}
                          onChange={(e) => setFormData({ ...formData, vatType: e.target.value as 'inclusive' | 'exclusive' })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        >
                          <option value="exclusive">Exclusive (Add to price)</option>
                          <option value="inclusive">Inclusive (Included in price)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Profit Calculation Method</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, profitCalculationMethod: 'markup' })}
                        className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all",
                          formData.profitCalculationMethod === 'markup' ? "border-emerald-500 bg-emerald-50" : "border-gray-100 hover:border-emerald-200"
                        )}
                      >
                        <p className="font-bold text-gray-900">Markup</p>
                        <p className="text-xs text-gray-500 mt-1">Profit as a percentage of cost price</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, profitCalculationMethod: 'margin' })}
                        className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all",
                          formData.profitCalculationMethod === 'margin' ? "border-emerald-500 bg-emerald-50" : "border-gray-100 hover:border-emerald-200"
                        )}
                      >
                        <p className="font-bold text-gray-900">Margin</p>
                        <p className="text-xs text-gray-500 mt-1">Profit as a percentage of selling price</p>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Default Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    >
                      <option value="ETB">Ethiopian Birr (ETB)</option>
                      <option value="USD">US Dollar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save VAT Settings'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">User Management</h3>
                  <p className="text-sm text-gray-500">Manage staff accounts and their access permissions.</p>
                </div>
                <button 
                  onClick={() => setIsStaffModalOpen(true)}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Staff
                </button>
              </div>
              <div className="p-6">
                {staff.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h4 className="font-bold text-gray-900">No staff members yet</h4>
                    <p className="text-sm text-gray-500 mt-1">Start adding staff to help manage your shop.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b border-gray-100">
                          <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Member</th>
                          <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {staff.map((member) => (
                          <tr key={member.staffId} className="group">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                                  {member.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900">{member.name}</p>
                                  <p className="text-xs text-gray-500">{member.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4">
                              <span className="text-sm font-medium text-gray-600 capitalize">{member.role}</span>
                            </td>
                            <td className="py-4">
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase">
                                {member.status}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <button 
                                onClick={() => handleDeleteStaff(member.staffId)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'subscription' && (
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
          )}

          {activeTab === 'notifications' && (
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
                      onClick={() => setNotifications({ ...notifications, [key as keyof typeof notifications]: !value })}
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
                <div className="pt-6 flex justify-end">
                  <button
                    onClick={handleUpdateNotifications}
                    disabled={loading}
                    className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Notification Settings'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Security Settings</h3>
                <p className="text-sm text-gray-500">Protect your account and shop data.</p>
              </div>
              <div className="p-6 space-y-6">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-900">Change Password</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="password"
                        required
                        placeholder="Current Password"
                        value={securityData.currentPassword}
                        onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="password"
                        required
                        placeholder="New Password"
                        value={securityData.newPassword}
                        onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="password"
                        required
                        placeholder="Confirm New Password"
                        value={securityData.confirmPassword}
                        onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>

                <div className="pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Two-Factor Authentication</h4>
                  <p className="text-xs text-gray-500 mb-4">Add an extra layer of security to your account.</p>
                  <button 
                    onClick={() => alert('2FA setup would be implemented here with a QR code or SMS verification.')}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Enable 2FA
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Staff Modal */}
      <AnimatePresence>
        {isStaffModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add Staff Member</h2>
                <button
                  onClick={() => setIsStaffModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <AlertCircle className="w-6 h-6 text-gray-400 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleAddStaff} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      required
                      value={staffFormData.name}
                      onChange={(e) => setStaffFormData({ ...staffFormData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      required
                      value={staffFormData.email}
                      onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={staffFormData.phone}
                      onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="+251..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Role</label>
                  <select
                    value={staffFormData.role}
                    onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value as any })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsStaffModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Staff'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
