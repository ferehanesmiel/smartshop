export const PLANS = {
  basic: {
    name: 'Basic',
    price: 300,
    limits: {
      users: 2,
      products: 500,
      branches: 1,
    },
    features: {
      multiBranch: false,
      advancedReports: false,
      onlineStore: false,
      smsNotifications: false,
      discounts: false,
    },
    description: 'Perfect for small shops starting out.',
  },
  pro: {
    name: 'Pro',
    price: 600,
    limits: {
      users: 5,
      products: 3000,
      branches: 1,
    },
    features: {
      multiBranch: false,
      advancedReports: true,
      onlineStore: true,
      smsNotifications: true,
      discounts: true,
    },
    description: 'Best for growing businesses needing more insights.',
  },
  premium: {
    name: 'Premium',
    price: 1000,
    limits: {
      users: Infinity,
      products: Infinity,
      branches: Infinity,
    },
    features: {
      multiBranch: true,
      advancedReports: true,
      onlineStore: true,
      smsNotifications: true,
      discounts: true,
    },
    description: 'Full power for large enterprises with multiple locations.',
  },
} as const;

export type PlanType = keyof typeof PLANS;
