import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Landing() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/onboarding');
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: 'var(--space-4)' }}>
      <motion.div 
        className="glass-panel" 
        style={{ width: '100%', maxWidth: '400px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
          <motion.h1 
            className="title-gradient floating" 
            style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}
          >
            IntuEat
          </motion.h1>
          <p style={{ color: 'var(--text-muted)' }}>Mindful eating, simplified.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {!isLogin && (
            <div>
              <label className="label">Name</label>
              <input type="text" className="input-field" placeholder="John Doe" required />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input type="email" className="input-field" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input-field" placeholder="••••••••" required />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 'var(--space-2)' }}>
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: 'var(--space-4) 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-medium)' }} />
          <span style={{ padding: '0 var(--space-2)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-medium)' }} />
        </div>

        <button 
          className="btn-secondary" 
          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-2)' }}
          onClick={() => navigate('/onboarding')}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </span>
        </p>
      </motion.div>
    </div>
  );
}
