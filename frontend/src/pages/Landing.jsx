import React, { useContext, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserContext } from '../context/UserContext';

export default function Landing() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, register, isAuthenticated, user } = useContext(UserContext);

  if (isAuthenticated) {
    return <Navigate to={user?.profileCompleted ? '/dashboard' : '/onboarding'} replace />;
  }

  const handleChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const user = isLogin
        ? await login({ email: formData.email, password: formData.password })
        : await register(formData);

      navigate(user.profileCompleted ? '/dashboard' : '/onboarding');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
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
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" placeholder="John Doe" required={!isLogin} />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" placeholder="••••••••" required />
          </div>

          {error && (
            <div style={{ color: 'var(--error)', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 'var(--space-2)' }} disabled={submitting}>
            {submitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </span>
        </p>
      </motion.div>
    </div>
  );
}
