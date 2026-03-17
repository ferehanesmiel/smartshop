import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { 
  Store, 
  ArrowRight, 
  Check, 
  MessageSquare, 
  Globe, 
  Calculator, 
  BarChart3, 
  Plus,
  Facebook,
  Send,
  MessageCircle,
  ShoppingBag,
  CheckCircle2,
  Sparkles,
  Calendar,
  PlayCircle,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

const LandingPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/marketplace');
    }
  }, [user, loading, navigate]);

  const plans = [
    {
      name: 'Basic',
      price: '300',
      description: 'Perfect for small shops starting out.',
      buttonText: 'Start Free Trial',
      features: [
        'POS system',
        'Inventory management',
        'Barcode and QR scanning',
        'Sales reports',
        'Basic receipt printing',
        'Basic support',
      ],
      limits: [
        'Up to 200 products',
        '1 user account',
      ],
      popular: false,
    },
    {
      name: 'Pro',
      price: '700',
      description: 'Best for growing businesses needing more insights.',
      buttonText: 'Start Free Trial',
      badge: 'Most Popular',
      features: [
        'Everything in Basic',
        'Online shop page',
        'Marketplace selling',
        'Profit calculation',
        'VAT calculation',
        'Advanced reports',
        'Inventory alerts',
      ],
      limits: [
        'Up to 2000 products',
        'Up to 5 users',
      ],
      popular: true,
    },
    {
      name: 'Premium',
      price: '1500',
      description: 'Full power for large enterprises with multiple locations.',
      buttonText: 'Start Free Trial',
      features: [
        'Everything in Pro',
        'Multi-branch support',
        'Advanced analytics dashboard',
        'Custom reports',
        'Priority support',
        'Marketplace priority ranking',
      ],
      limits: [
        'Unlimited products',
        'Unlimited users',
      ],
      popular: false,
    },
  ];

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-[#ff6600] p-1.5 rounded-lg">
                <ShoppingBag className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                SmartShop <span className="text-[#ff6600]">Ethiopia</span>
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#" className="text-sm font-medium text-slate-600 hover:text-[#ff6600] transition-colors">Home</a>
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-[#ff6600] transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-[#ff6600] transition-colors">Pricing</a>
              <Link to="/marketplace" className="text-sm font-medium text-slate-600 hover:text-[#ff6600] transition-colors">Marketplace</Link>
              <a href="#contact" className="text-sm font-medium text-slate-600 hover:text-[#ff6600] transition-colors">Contact</a>
              <div className="h-6 w-px bg-slate-200 mx-2"></div>
              <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-[#ff6600] transition-colors">Login</Link>
              <Link to="/register" className="bg-[#ff6600] hover:bg-[#e65c00] text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-orange-200 hover:scale-105 active:scale-95">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-50 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-orange-100/50 blur-[100px] rounded-full"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">
                Run Your Shop <span className="text-[#ff6600]">Smarter</span>
              </h1>
              
              <p className="max-w-2xl mx-auto text-lg lg:text-xl text-slate-600 mb-10 leading-relaxed">
                Cloud POS, Inventory, VAT calculation, and profit tracking designed for Ethiopian shops.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Link to="/register" className="w-full sm:w-auto bg-[#ff6600] hover:bg-[#e65c00] text-white px-8 py-4 rounded-full text-lg font-bold transition-all shadow-xl shadow-orange-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="#pricing" className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-full text-lg font-bold transition-all hover:scale-105 active:scale-95 flex items-center justify-center">
                  View Pricing
                </a>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  14-day free trial
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Cancel anytime
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Marketplace Landing Section */}
        <section className="py-24 bg-orange-50/50 border-y border-orange-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <motion.div 
                className="flex-1 text-center md:text-left"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-bold text-sm mb-6">
                  <ShoppingBag className="w-4 h-4" />
                  Online Marketplace
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
                  Shop From Local Stores
                </h2>
                <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl">
                  Discover products from local Ethiopian shops powered by SmartShop Ethiopia. Support local businesses and shop online with ease.
                </p>
                <Link 
                  to="/marketplace" 
                  className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-full text-lg font-bold transition-all shadow-xl hover:scale-105 active:scale-95 group"
                >
                  Browse Marketplace
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
              
              <motion.div 
                className="flex-1 w-full max-w-lg relative"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-200 to-amber-100 rounded-3xl transform rotate-3 scale-105 -z-10 blur-lg opacity-50"></div>
                <div className="bg-white p-2 rounded-3xl shadow-2xl border border-slate-100 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="bg-slate-50 rounded-2xl overflow-hidden aspect-[4/3] relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
                    <div className="relative z-10 grid grid-cols-2 gap-4 p-6 w-full h-full">
                      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center justify-center gap-2 transform -translate-y-4">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                          <Store className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="h-2 w-16 bg-slate-200 rounded-full mt-2"></div>
                        <div className="h-2 w-10 bg-slate-200 rounded-full"></div>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center justify-center gap-2 transform translate-y-4">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div className="h-2 w-16 bg-slate-200 rounded-full mt-2"></div>
                        <div className="h-2 w-10 bg-slate-200 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
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
                  Choose the plan that fits your business.
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
                  className={`relative flex flex-col p-8 rounded-3xl bg-white shadow-sm transition-all duration-300 ${plan.popular ? 'ring-2 ring-[#ff6600] shadow-xl shadow-orange-100' : 'border border-slate-100'}`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#ff6600] text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-orange-200">
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
                        <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${feature.includes('Everything') ? 'bg-orange-50 text-[#ff6600]' : 'bg-emerald-100 text-emerald-600'}`}>
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

                  <Link to={`/register?plan=${plan.name.toLowerCase()}`} className={`w-full py-4 rounded-2xl font-bold text-center transition-all active:scale-95 ${plan.popular ? 'bg-[#ff6600] text-white shadow-lg shadow-orange-200 hover:bg-[#e65c00]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                    {plan.buttonText}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Add-ons Section */}
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
                  Customize your plan with these extra features.
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
                  <button className="mt-auto w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-[#ff6600] hover:text-white hover:border-[#ff6600] transition-all flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add to Plan
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Free Trial Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#ff6600] -z-10"></div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-lg border border-white/20 p-12 md:p-20 rounded-[3rem] shadow-2xl"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-bold mb-8">
                <Sparkles className="w-4 h-4" />
                Limited Time Offer
              </div>
              
              <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
                Start Your Free 14-Day Trial
              </h2>
              
              <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
                No credit card required. Try SmartShop risk-free.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="w-full sm:w-auto bg-white text-[#ff6600] px-10 py-5 rounded-full text-lg font-bold transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Create Account
                </Link>
                <button className="w-full sm:w-auto bg-transparent text-white border border-white/30 px-10 py-5 rounded-full text-lg font-bold transition-all hover:bg-white/10 hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                  <PlayCircle className="w-5 h-5" />
                  Book Demo
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-[#ff6600] p-1.5 rounded-lg">
                  <ShoppingBag className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-extrabold tracking-tight text-white">
                  SmartShop <span className="text-[#ff6600]">Ethiopia</span>
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                The leading cloud POS and shop management system designed specifically for the Ethiopian retail market.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#ff6600] hover:text-white transition-all">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#ff6600] hover:text-white transition-all">
                  <Send className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#ff6600] hover:text-white transition-all">
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Product</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#features" className="hover:text-[#ff6600] transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-[#ff6600] transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:text-[#ff6600] transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-[#ff6600] transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Support</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li>© 2026 SmartShop Ethiopia</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
