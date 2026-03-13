import React from 'react';
import { Link } from 'react-router-dom';
import { Store, ArrowRight, Smartphone, Globe, BarChart3, Receipt, Users, CheckCircle, Star, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <Store className="text-white w-6 h-6" />
            </div>
            <span className="font-bold text-2xl tracking-tight">SmartShop</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
            <a href="#features" className="hover:text-orange-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-orange-600 transition-colors">Pricing</a>
            <a href="#about" className="hover:text-orange-600 transition-colors">About</a>
            <a href="#contact" className="hover:text-orange-600 transition-colors">Contact</a>
            <Link to="/login" className="hover:text-orange-600 transition-colors">Login/Register</Link>
          </nav>
          <Link 
            to="/register" 
            className="bg-orange-500 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
          >
            Get Started Free
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-yellow-50">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-gray-900">
              Manage Your Shop Easily with <span className="text-orange-600">SmartShop Ethiopia</span>
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-10">
              Track inventory, sales, orders, and customers all in one platform.
            </p>
            <Link 
              to="/register" 
              className="inline-flex items-center bg-orange-500 text-white px-10 py-4 rounded-full text-lg font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 gap-2"
            >
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-16"
          >
            <img 
              src="https://picsum.photos/seed/dashboard/1200/600" 
              alt="Dashboard Preview" 
              className="rounded-3xl shadow-2xl border-4 border-white"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">Powerful Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Shop Management & POS', icon: Store, desc: 'Complete point-of-sale and inventory management.' },
              { title: 'Online Mini Store', icon: Globe, desc: 'Launch your online store in minutes.' },
              { title: 'Digital Receipts & SMS', icon: Receipt, desc: 'Send receipts via WhatsApp or SMS.' },
              { title: 'Customer Loyalty & Orders', icon: Users, desc: 'Track customers and manage orders.' },
              { title: 'Simple Dashboard & Reports', icon: BarChart3, desc: 'Get insights with easy-to-read reports.' }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="text-orange-600 w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="about" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Register your shop' },
              { step: '2', title: 'Add products' },
              { step: '3', title: 'Start selling' },
              { step: '4', title: 'Manage customers & orders' }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold">{item.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">What Shop Owners Say</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { quote: 'SmartShop changed my business. Inventory tracking is a breeze!', name: 'Abebe', shop: 'Abebe Grocery' },
              { quote: 'My sales increased after launching my online store with SmartShop.', name: 'Sara', shop: 'Sara Fashion' }
            ].map((t, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <Star className="text-yellow-400 w-6 h-6 mb-4" />
                <p className="text-lg text-gray-700 mb-6">"{t.quote}"</p>
                <p className="font-bold">{t.name}</p>
                <p className="text-sm text-gray-500">{t.shop}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center">
        <h2 className="text-4xl font-bold mb-8">Start Your Free Trial Today</h2>
        <Link 
          to="/register" 
          className="inline-flex items-center bg-orange-500 text-white px-10 py-4 rounded-full text-lg font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 gap-2"
        >
          Get Started Free <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="mb-4">Contact: +251 911 000 000 | support@smartshop.et</p>
          <p className="text-gray-400 text-sm">© 2026 SmartShop Ethiopia. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
