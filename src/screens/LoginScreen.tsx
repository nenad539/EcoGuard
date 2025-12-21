import React, { useContext, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { NavigationContext } from "../App";
import { supabase } from "../supabase-client";
import {
  Shield,
  Leaf,
  Mail,
  Lock,
  User,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import "../styles/LoginScreen.css";

export function LoginScreen() {
  const { navigateTo } = useContext(NavigationContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Unesite email i lozinku");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error("Supabase login error:", error);
        alert(error.message || "Greška prilikom prijave");
        return;
      }

      navigateTo("home");
    } catch (err: any) {
      console.error("Unexpected login error:", err);
      alert(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail) {
      setResetError("Unesite email adresu");
      return;
    }

    if (!resetEmail.includes("@")) {
      setResetError("Unesite validnu email adresu");
      return;
    }

    setResetError("");
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("Password reset error:", error);
        setResetError(error.message || "Greška prilikom slanja reset linka");
        return;
      }

      setResetSent(true);
    } catch (err: any) {
      console.error("Unexpected reset error:", err);
      setResetError(err?.message || String(err));
    } finally {
      setResetLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setResetEmail("");
    setResetSent(false);
    setResetError("");
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

        {/* Login/Forgot Password form */}
        <div className="login-form-container">
          <AnimatePresence mode="wait">
            {!isForgotPassword ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
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
                        required
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
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="login-forgot-password"
                    onClick={() => setIsForgotPassword(true)}
                  >
                    Zaboravljena lozinka?
                  </button>

                  <button
                    type="submit"
                    className="login-submit-button"
                    disabled={loading}
                  >
                    {loading ? "Učitavanje..." : "Prijavi se"}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="forgot-password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {!resetSent ? (
                  <>
                    <div
                      className="login-back-button"
                      onClick={handleBackToLogin}
                    >
                      <ArrowLeft size={20} />
                      <span>Nazad na prijavu</span>
                    </div>

                    <h2 className="login-form-title">Zaboravljena lozinka</h2>
                    <p className="login-form-subtitle">
                      Unesite email adresu vašeg naloga. Poslaćemo vam link za
                      resetovanje lozinke.
                    </p>

                    <form
                      onSubmit={handleForgotPassword}
                      className="login-form"
                    >
                      <div className="login-field">
                        <label htmlFor="reset-email" className="login-label">
                          Email
                        </label>
                        <div className="login-input-container">
                          <Mail className="login-input-icon" />
                          <input
                            id="reset-email"
                            type="email"
                            value={resetEmail}
                            onChange={(e) => {
                              setResetEmail(e.target.value);
                              setResetError("");
                            }}
                            className="login-input"
                            placeholder="youremail@example.com"
                            required
                          />
                        </div>
                        {resetError && (
                          <div className="login-error-message">
                            {resetError}
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="login-submit-button"
                        disabled={resetLoading}
                      >
                        {resetLoading ? "Slanje..." : "Pošalji reset link"}
                      </button>
                    </form>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="login-reset-success"
                  >
                    <div className="login-success-icon">
                      <CheckCircle size={48} />
                    </div>
                    <h2 className="login-form-title">Link poslat!</h2>
                    <p className="login-form-subtitle">
                      Poslali smo link za resetovanje lozinke na adresu:
                      <br />
                      <strong>{resetEmail}</strong>
                    </p>
                    <p className="login-form-subtitle">
                      Proverite vaš inbox i pratite uputstva u email-u.
                    </p>
                    <button
                      onClick={handleBackToLogin}
                      className="login-submit-button"
                      style={{ marginTop: "2rem" }}
                    >
                      Nazad na prijavu
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!isForgotPassword && (
            <div className="login-register-link">
              <span className="login-register-text">Nemaš nalog? </span>
              <button
                onClick={() => navigateTo("register")}
                className="login-register-button"
              >
                Registruj se
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
