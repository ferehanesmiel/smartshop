import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { PlanType } from './constants';

interface SubscriptionContextType {
  loading: boolean;
  isFeatureAllowed: (feature: string) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  loading: false,
  isFeatureAllowed: () => false,
});

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { shop, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading]);

  const isFeatureAllowed = (feature: string): boolean => {
    if (!shop) return false;
    
    // Default to basic if no plan is set or if it's an unrecognized plan
    const plan = (shop.plan as PlanType) || 'basic';
    
    // If shop status is inactive or expired, restrict features
    if (shop.status === 'inactive' || shop.subscriptionStatus === 'expired') {
      return false;
    }
    
    const features: Record<PlanType, string[]> = {
      basic: ['inventory', 'sales-tracking', 'receipts'],
      pro: ['inventory', 'sales-tracking', 'receipts', 'orders', 'customers', 'advanced-reports', 'discounts'],
      premium: ['inventory', 'sales-tracking', 'receipts', 'orders', 'customers', 'advanced-reports', 'discounts', 'multi-branch', 'staff-roles', 'sms-notifications', 'api-integrations', 'custom-branding']
    };

    // If the plan exists in our features map, check if the feature is included
    if (features[plan]) {
      return features[plan].includes(feature);
    }

    return false;
  };

  return (
    <SubscriptionContext.Provider value={{ loading, isFeatureAllowed }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => useContext(SubscriptionContext);

