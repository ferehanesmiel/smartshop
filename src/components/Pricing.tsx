import React from 'react';
import { motion } from 'motion/react';
import { Check, Info } from 'lucide-react';

const Pricing = () => {
  const plans = [
    {
      name: 'Basic',
      price: '300',
      description: 'Perfect for small shops and kiosks.',
      buttonText: 'Start Basic',
      features: [
        'POS sales system',
        'Product inventory management',
        'Barcode / QR scanning',
        'VAT calculation option',
        'Cost price vs selling price profit',
        'Digital receipt generation',
        'Sales history',
        'Low stock alerts',
      ],
      limits: [
        '2 users',
        '500 products',
        '1 shop location',
      ],
      popular: false,
    },
    {
      name: 'Pro',
      price: '600',
      description: 'Best for growing shops and supermarkets.',
      buttonText: 'Start Pro',
      badge: 'Most Popular',
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
      limits: [
        '5 users',
        '3000 products',
        '1 shop location',
      ],
      popular: true,
    },
    {
      name: 'Premium',
      price: '1000',
      description: 'Perfect for large stores and multi-branch businesses.',
      buttonText: 'Start Premium',
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
      limits: [
        'Unlimited users',
        'Unlimited products',
        'Multiple branches',
      ],
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Simple Pricing for Every Shop
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Choose the plan that fits your business. No hidden fees, just pure growth.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className={`relative flex flex-col p-8 rounded-3xl bg-white pricing-card-shadow transition-all duration-300 ${plan.popular ? 'ring-2 ring-brand pricing-card-shadow-hover' : 'border border-slate-100'}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-brand/30">
                  {plan.badge}
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500 font-medium">Birr / Month</span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="space-y-4 mb-8 flex-grow">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Features</div>
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${feature.includes('Everything') ? 'bg-brand/10 text-brand' : 'bg-emerald-100 text-emerald-600'}`}>
                      {feature.includes('Everything') ? <Info className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                    </div>
                    <span className={`text-sm ${feature.includes('Everything') ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                      {feature}
                    </span>
                  </div>
                ))}

                <div className="pt-4 border-t border-slate-50">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Limits</div>
                  {plan.limits.map((limit, i) => (
                    <div key={i} className="flex items-center gap-3 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                      <span className="text-sm font-medium text-slate-700">{limit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-95 ${plan.popular ? 'bg-brand text-white shadow-lg shadow-brand/30 hover:bg-brand-hover' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                {plan.buttonText}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
