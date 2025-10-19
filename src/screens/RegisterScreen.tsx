import React, { useContext, useState } from 'react';
import { motion } from 'motion/react';
import { NavigationContext } from '../App';
import { Shield, Leaf, User, Mail, Lock, ArrowLeft } from 'lucide-react';
import '../styles/RegisterScreen.css';

export function RegisterScreen() {
  const { navigateTo } = useContext(NavigationContext);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo('home');
  };

  return (
    <div className="register-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="register-container"
      >
        {/* Back button */}
        <button
          onClick={() => navigateTo('login')}
          className="register-back-button"
        >
          <ArrowLeft className="w-5 h-5" />
          Nazad
        </button>

        {/* Logo */}
        <div className="register-logo">
          <div className="register-logo-container">
            <Shield className="register-logo-shield" strokeWidth={1.5} />
            <Leaf className="register-logo-leaf" />
          </div>
          <h1 className="register-logo-text">EcoGuard</h1>
        </div>

        {/* Register form */}
        <div className="register-form-container">
          <h2 className="register-form-title">Kreiraj nalog</h2>

          <form onSubmit={handleRegister} className="register-form">
            <div className="register-field">
              <label htmlFor="name" className="register-label">
                Ime
              </label>
              <div className="register-input-container">
                <User className="register-input-icon" />
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                  className="register-input"
                  placeholder="Vaše ime"
                />
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="email" className="register-label">
                Email
              </label>
              <div className="register-input-container">
                <Mail className="register-input-icon" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                  className="register-input"
                  placeholder="vas.email@primer.com"
                />
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="password" className="register-label">
                Lozinka
              </label>
              <div className="register-input-container">
                <Lock className="register-input-icon" />
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
                  className="register-input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="confirmPassword" className="register-label">
                Potvrda lozinke
              </label>
              <div className="register-input-container">
                <Lock className="register-input-icon" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="register-input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="register-checkbox-container">
              <input
                type="checkbox"
                id="terms"
                checked={formData.termsAccepted}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, termsAccepted: e.target.checked })
                }
                className="register-checkbox"
              />
              <label htmlFor="terms" className="register-checkbox-label">
                Prihvatam uslove korišćenja
              </label>
            </div>

            <button
              type="submit"
              className="register-submit-button"
            >
              Kreiraj nalog
            </button>
          </form>

          <div className="register-footer">
            <span className="register-footer-text">Već imaš nalog? </span>
            <button
              onClick={() => navigateTo('login')}
              className="register-footer-link"
            >
              Prijavi se
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
