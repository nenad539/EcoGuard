import React, { useContext, useState } from 'react';
import { motion } from 'motion/react';
import { NavigationContext } from '../App';
import { supabase } from "../supabase-client";
import { Shield, Leaf, Mail, Lock, User } from 'lucide-react';
import '../styles/LoginScreen.css';

export function LoginScreen() {
  const { navigateTo } = useContext(NavigationContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert('Unesite email i lozinku');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error('Supabase login error:', error);
        alert(error.message || 'Greška prilikom prijave');
        return;
      }

     
      navigateTo('home');
    } catch (err: any) {
      console.error('Unexpected login error:', err);
      alert(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="login-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="login-container"
      >
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <Shield className="login-logo-shield" />
            <Leaf className="login-logo-leaf" />
          </div>
          <h1 className="login-logo-text">Grow With Us</h1>
        </div>

        {/* Login form */}
        <div className="login-form-container">
          <h2 className="login-form-title">Dobrodošli nazad</h2>

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-field">
              <label htmlFor="email" className="login-label">
                Email
              </label>
              <div className="login-input-container">
                <Mail className="login-input-icon" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                  placeholder="youremail@example.com"
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password" className="login-label">
                Lozinka
              </label>
              <div className="login-input-container">
                <Lock className="login-input-icon" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="button"
              className="login-forgot-password"
            >
              Zaboravljena lozinka?
            </button>

            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >
              {loading ? 'Učitavanje...' : 'Prijavi se'}
            </button>
          </form>

          <div className="login-register-link">
            <span className="login-register-text">Nemaš nalog? </span>
            <button
              onClick={() => navigateTo('register')}
              className="login-register-button"
            >
              Registruj se
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
