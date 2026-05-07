import React, { useState, useEffect } from 'react';
import { motion, useSpring } from 'framer-motion';

const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // Smooth springs for the outer ring
  const springConfig = { damping: 20, stiffness: 250, mass: 0.5 };
  const cursorX = useSpring(0, springConfig);
  const cursorY = useSpring(0, springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e) => {
      if (
        e.target.tagName === 'BUTTON' ||
        e.target.tagName === 'A' ||
        e.target.closest('button') ||
        e.target.closest('a') ||
        e.target.getAttribute('role') === 'button'
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    
    // Add global style to hide default cursor
    document.documentElement.style.cursor = 'none';
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      if (getComputedStyle(el).cursor !== 'none') {
        el.style.cursor = 'none';
      }
    });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      document.documentElement.style.cursor = 'auto';
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[999999]">
      {/* Outer Glow Ring */}
      <motion.div
        className="absolute w-8 h-8 rounded-full border border-neon-blue/30"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          boxShadow: isHovering 
            ? '0 0 25px rgba(255, 0, 122, 0.4), inset 0 0 10px rgba(255, 0, 122, 0.2)' 
            : '0 0 15px rgba(0, 255, 255, 0.2)',
          borderColor: isHovering ? 'rgba(255, 0, 122, 0.6)' : 'rgba(0, 255, 255, 0.3)',
        }}
        animate={{
          scale: isHovering ? 2.2 : 1,
          rotate: isHovering ? 180 : 0,
        }}
        transition={{ type: 'spring', damping: 15 }}
      >
        {/* Animated segment in the ring */}
        <div className="absolute inset-0 rounded-full border-t-2 border-neon-pink opacity-50 animate-spin" style={{ animationDuration: '3s' }} />
      </motion.div>

      {/* Inner Glowing Dot */}
      <motion.div
        className="absolute w-2.5 h-2.5 bg-white rounded-full"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 15px #fff, 0 0 25px #9d00ff, 0 0-40px #9d00ff',
        }}
      />

      {/* Trailing Glow Particle */}
      <motion.div
        className="absolute w-4 h-4 bg-neon-purple/10 rounded-full blur-md"
        animate={{
          x: mousePosition.x,
          y: mousePosition.y,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 150, mass: 1 }}
        style={{ translateX: '-50%', translateY: '-50%' }}
      />
    </div>
  );
};

export default CustomCursor;
