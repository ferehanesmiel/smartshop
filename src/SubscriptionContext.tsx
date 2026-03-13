import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';
import { Subscription } from './types';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  isFeatureAllowed: (feature: string) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  loading: true,
  isFeatureAllowed: () => false,
});

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { shop } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shop) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'subscriptions'), where('shopId', '==', shop.shopId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setSubscription(snapshot.docs[0].data() as Subscription);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'subscriptions');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [shop]);

  const isFeatureAllowed = (feature: string): boolean => {
    const plan = subscription?.planName || 'basic';
    if (subscription?.subscriptionStatus === 'expired') return false;
    
    const features: Record<string, string[]> = {
      basic: ['inventory', 'sales-tracking'],
      pro: ['inventory', 'sales-tracking', 'online-store', 'orders', 'customers', 'receipts'],
      premium: ['inventory', 'sales-tracking', 'online-store', 'orders', 'customers', 'receipts', 'sms-notifications', 'advanced-reports', 'loyalty-points']
    };

    return features[plan]?.includes(feature) || false;
  };

  return (
    <SubscriptionContext.Provider value={{ subscription, loading, isFeatureAllowed }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => useContext(SubscriptionContext);
