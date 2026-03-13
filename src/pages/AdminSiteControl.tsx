import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SiteSettings } from '../types';
import { Save } from 'lucide-react';

const AdminSiteControl = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: '',
    primaryColor: '',
    heroHeadline: '',
    heroSubheadline: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const docRef = doc(db, 'siteSettings', 'global');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data() as SiteSettings);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'siteSettings', 'global'), settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Site Control</h2>
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        {Object.keys(settings).map((key) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 capitalize">
              {key.replace(/([A-Z])/g, ' $1')}
            </label>
            <input
              type="text"
              value={settings[key as keyof SiteSettings]}
              onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
              className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
        ))}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-orange-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-600 transition-all"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default AdminSiteControl;
