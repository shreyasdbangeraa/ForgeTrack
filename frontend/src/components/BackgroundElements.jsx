import React from 'react';
import { motion } from 'framer-motion';

const BackgroundElements = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-[#050505]" />
      
      {/* Animated Blobs */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-neon-purple/20 rounded-full blur-[120px]"
      />
      
      <motion.div
        animate={{
          x: [0, -120, 0],
          y: [0, 100, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-neon-blue/20 rounded-full blur-[100px]"
      />
      
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, -150, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute -bottom-[10%] left-[20%] w-[60%] h-[60%] bg-neon-pink/10 rounded-full blur-[140px]"
      />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-dot-grid bg-[length:32px_32px] [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-20" />
    </div>
  );
};

export default BackgroundElements;
