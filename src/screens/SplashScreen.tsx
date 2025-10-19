import React from 'react';
import { motion } from 'motion/react';
import { Shield, Leaf } from 'lucide-react';
import '../styles/SplashScreen.css';

export function SplashScreen() {
  return (
    <div className="splash-screen">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="splash-logo-container"
      >
        {/* Logo */}
        <div className="splash-logo">
          <div className="splash-logo-icon">
            <Shield className="splash-shield" />
            <Leaf className="splash-leaf" />
          </div>
        </div>

        {/* Animated green glowing circle loader */}
        <motion.div
          className="splash-loader"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Glow effect */}
        <motion.div
          className="splash-glow"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="splash-title"
      >
        EcoGuard
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="splash-subtitle"
      >
        Čuvaj prirodu. Postani EcoGuard.
      </motion.p>
    </div>
  );
}
