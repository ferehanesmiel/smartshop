import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { PLANS, PlanType } from './constants';

interface SubscriptionContextType {
  isFeatureAllowed: (feature: keyof typeof PLANS.basic.features) => boolean;
  isLimitReached: (limit: keyof typeof PLANS.basic.limits, currentCount: number) => boolean;
  getLimit: (limit: keyof typeof PLANS.basic.limits) => number;
  isSubscriptionActive: boolean;
  plan: PlanType;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { shop } = useAuth();

  const planKey: PlanType = (shop?.plan && PLANS[shop.plan as PlanType]) ? (shop.plan as PlanType) : 'basic';
  const currentPlan = PLANS[planKey];

  const isSubscriptionActive = shop?.subscriptionStatus === 'active' || shop?.subscriptionStatus === 'trial';

  const isFeatureAllowed = (feature: keyof typeof PLANS.basic.features) => {
    if (!isSubscriptionActive) return false;
    return currentPlan.features[feature];
  };

  const getLimit = (limit: keyof typeof PLANS.basic.limits) => {
    return currentPlan.limits[limit];
  };

  const isLimitReached = (limit: keyof typeof PLANS.basic.limits, currentCount: number) => {
    const max = getLimit(limit);
    return currentCount >= max;
  };

  return (
    <SubscriptionContext.Provider value={{ 
      isFeatureAllowed, 
      isLimitReached, 
      getLimit,
      isSubscriptionActive,
      plan: planKey
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
