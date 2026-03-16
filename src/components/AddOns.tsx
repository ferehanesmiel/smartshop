import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Globe, Calculator, BarChart3, Plus } from 'lucide-react';

const AddOns = () => {
  const addons = [
    {
      title: 'SMS Receipts',
      price: '100',
      icon: MessageSquare,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Online Store Integration',
      price: '200',
      icon: Globe,
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: 'Accounting Module',
      price: '300',
      icon: Calculator,
      color: 'bg-amber-100 text-amber-600',
    },
    {
      title: 'Advanced Analytics',
      price: '150',
      icon: BarChart3,
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
              Optional Add-ons
            </h2>
            <p className="text-lg text-slate-600">
              Need more power? Customize your plan with these extra features.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {addons.map((addon, index) => (
            <motion.div
              key={addon.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 flex flex-col items-center text-center group transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50"
            >
              <div className={`w-14 h-14 rounded-2xl ${addon.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                <addon.icon className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{addon.title}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-xl font-extrabold text-slate-900">{addon.price}</span>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Birr/mo</span>
              </div>
              <button className="mt-auto w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-brand hover:text-white hover:border-brand transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Add to Plan
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AddOns;
