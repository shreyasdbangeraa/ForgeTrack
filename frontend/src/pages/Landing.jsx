import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Database, Globe, MousePointer2 } from 'lucide-react';
import BackgroundElements from '../components/BackgroundElements';

const Landing = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-dark-bg text-white overflow-x-hidden font-outfit">
      <BackgroundElements />
      
      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-neon-gradient rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,0,122,0.4)]">
            <Database size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold font-space tracking-tighter">FORGE<span className="text-neon-pink">TRACK</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-fg-secondary">
          <a href="#" className="hover:text-white transition-colors">Platform</a>
          <a href="#" className="hover:text-white transition-colors">Features</a>
          <a href="#" className="hover:text-white transition-colors">Security</a>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="btn-secondary py-2 px-6 text-sm"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-20 pb-32 max-w-7xl mx-auto px-6">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
            <Zap size={14} className="text-neon-blue" />
            <span className="text-xs font-bold tracking-widest uppercase">Next-Gen Attendance Intelligence</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-bold font-space tracking-tighter mb-6 leading-tight">
            Forge Your Path with <br />
            <span className="neon-text-pink">Precision Tracking</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-fg-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
            Experience the future of attendance management. Powered by AI, designed for speed, and built for extraordinary organizations.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center justify-center gap-6">
            <button 
              onClick={() => navigate('/login')}
              className="btn-primary group flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32"
        >
          {[
            { icon: <Zap className="text-neon-blue" />, title: "Instant AI Logic", desc: "Our AI agents reason through complex spreadsheets to find gaps automatically." },
            { icon: <Shield className="text-neon-pink" />, title: "Enterprise Security", desc: "Military-grade encryption for your student data and session records." },
            { icon: <Globe className="text-neon-purple" />, title: "Real-time Sync", desc: "Seamless synchronization across all devices with zero latency." }
          ].map((feature, i) => (
            <div key={i} className="glass-card p-8 rounded-3xl neon-border group">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-fg-secondary text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Floating Elements Animation */}
      <div className="absolute top-1/4 left-10 w-24 h-24 border border-neon-blue/20 rounded-2xl rotate-12 animate-float pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-32 h-32 border border-neon-pink/20 rounded-full -rotate-12 animate-float [animation-delay:2s] pointer-events-none" />
    </div>
  );
};

export default Landing;
