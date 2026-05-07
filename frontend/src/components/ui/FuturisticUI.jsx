import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ children, className = '', onClick, disabled, loading, variant = 'primary' }) => {
  const baseClass = "relative rounded-xl font-bold transition-all duration-300 overflow-hidden flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-gradient-to-r from-[#ff007a] to-[#9d00ff] text-white shadow-[0_0_20px_rgba(255,0,122,0.3)] hover:shadow-[0_0_30px_rgba(255,0,122,0.5)]",
    secondary: "bg-white/5 border border-white/10 text-white hover:bg-white/10 backdrop-blur-md",
    danger: "bg-danger/20 border border-danger/30 text-danger hover:bg-danger/30",
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled || loading}
      className={`${baseClass} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
        />
      ) : children}
    </button>
  );
};

const Card = ({ children, className = '', glowColor = 'purple' }) => {
  const glows = {
    purple: 'rgba(157,0,255,0.1)',
    pink: 'rgba(255,0,122,0.1)',
    blue: 'rgba(0,212,255,0.1)',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.5 }}
      className={`glass-card p-8 rounded-[2rem] neon-border group relative overflow-hidden ${className}`}
      style={{ boxShadow: `0 0 40px ${glows[glowColor]}` }}
    >
      <div className="relative z-10">{children}</div>
      {/* Subtle corner glow */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[60px] opacity-20 bg-neon-${glowColor}`} />
    </motion.div>
  );
};

export { Button, Card };
