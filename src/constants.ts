export const PLANS = {
  basic: {
    name: 'Basic',
    price: 300,
    limits: {
      users: 2,
      products: 500,
      branches: 1,
    },
    features: [
      'POS sales system',
      'Product inventory management',
      'Barcode / QR scanning',
      'VAT calculation option',
      'Cost price vs selling price profit calculation',
      'Digital receipt generation',
      'Sales history',
      'Low stock alerts',
    ],
  },
  pro: {
    name: 'Pro',
    price: 600,
    limits: {
      users: 5,
      products: 3000,
      branches: 1,
    },
    features: [
      'Everything in Basic plus:',
      'Advanced reports dashboard',
      'Daily / weekly / monthly analytics',
      'Customer database',
      'Supplier management',
      'Purchase order tracking',
      'Profit & loss reports',
      'Export reports (PDF / Excel)',
      'Discount management',
    ],
  },
  premium: {
    name: 'Premium',
    price: 1000,
    limits: {
      users: Infinity,
      products: Infinity,
      branches: Infinity,
    },
    features: [
      'Everything in Pro plus:',
      'Multi-branch shop management',
      'Central inventory system',
      'Staff roles and permissions',
      'Advanced analytics dashboard',
      'Cloud backup',
      'SMS customer notifications',
      'Custom receipt branding',
      'API integrations',
    ],
  },
} as const;

export type PlanType = keyof typeof PLANS;
