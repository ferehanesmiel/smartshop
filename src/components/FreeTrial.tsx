import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Calendar, PlayCircle } from 'lucide-react';

const FreeTrial = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-brand -z-10"></div>
      <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-10">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-white blur-[120px] rounded-full"></div>
      </div>

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
            No credit card required. Try SmartShop risk-free and see how it transforms your business operations.
          </p>

          <div className="flex flex-col sm:row items-center justify-center gap-4">
            <button className="w-full sm:w-auto bg-white text-brand px-10 py-5 rounded-full text-lg font-bold transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
              <Calendar className="w-5 h-5" />
              Create Account
            </button>
            <button className="w-full sm:w-auto bg-brand-hover/50 text-white border border-white/30 px-10 py-5 rounded-full text-lg font-bold transition-all hover:bg-white/10 hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
              <PlayCircle className="w-5 h-5" />
              Book Demo
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FreeTrial;
