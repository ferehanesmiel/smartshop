import React from 'react';
import { Facebook, Send, MessageCircle, ShoppingBag } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-brand p-1.5 rounded-lg">
                <ShoppingBag className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                SmartShop <span className="text-brand">Ethiopia</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              The leading cloud POS and shop management system designed specifically for the Ethiopian retail market.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand hover:text-white transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand hover:text-white transition-all">
                <Send className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand hover:text-white transition-all">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#features" className="hover:text-brand transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-brand transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-brand transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-brand transition-colors">Updates</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-brand transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-brand transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-brand transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-brand transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Contact</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-brand font-bold">Email:</span> hello@smartshop.et
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand font-bold">Phone:</span> +251 911 000 000
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand font-bold">Location:</span> Addis Ababa, Ethiopia
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500">
          <p>© 2026 SmartShop Ethiopia. All rights reserved.</p>
          <div className="flex items-center gap-8">
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
