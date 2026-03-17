export const PLANS = {
  basic: {
    name: 'Basic',
    price: 300,
    limits: {
      users: 1,
      products: 200,
      branches: 1,
      marketplaceProducts: 0,
    },
    features: {
      multiBranch: false,
      advancedReports: false,
      onlineStore: false,
      smsNotifications: false,
      discounts: false,
      marketplace: false,
    },
    description: 'Perfect for small shops starting out.',
  },
  pro: {
    name: 'Pro',
    price: 700,
    limits: {
      users: 5,
      products: 2000,
      branches: 1,
      marketplaceProducts: 2000,
    },
    features: {
      multiBranch: false,
      advancedReports: true,
      onlineStore: true,
      smsNotifications: true,
      discounts: true,
      marketplace: true,
    },
    description: 'Best for growing businesses needing more insights.',
  },
  premium: {
    name: 'Premium',
    price: 1500,
    limits: {
      users: Infinity,
      products: Infinity,
      branches: Infinity,
      marketplaceProducts: Infinity,
    },
    features: {
      multiBranch: true,
      advancedReports: true,
      onlineStore: true,
      smsNotifications: true,
      discounts: true,
      marketplace: true,
    },
    description: 'Full power for large enterprises with multiple locations.',
  },
} as const;

export type PlanType = keyof typeof PLANS;
