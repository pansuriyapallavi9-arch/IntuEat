import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Activity } from 'lucide-react';
import { UserContext } from '../../context/UserContext';

export default function DeficiencySuggestions() {
  const { history, user } = useContext(UserContext);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Example deficiencies array (this could be pulled from User profile eventually)
  const deficiencies = user?.deficiencies || ['Iron', 'Vitamin B12'];

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/agent/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deficiencies, history })
        });
        const data = await response.json();
        setSuggestions(data);
      } catch (err) {
        console.error('Failed to fetch ML suggestions', err);
        // Fallback for UI if server is unreachable
        setSuggestions([
          { title: "Connection Error", reason: "Agent is currently offline. Ensure backend is running." }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [history]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>AI Health Suggestions</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-5)' }}>Dynamic actionable insights based on your recent meals and known deficiencies ({deficiencies.join(', ')}).</p>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--primary)' }}>
          <Activity size={24} className="floating" /> Generating your personalized insights...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr)', gap: 'var(--space-4)' }}>
          {suggestions.map((sug, index) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: index * 0.1 }}
              key={index} 
              className="glass-panel" style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}
            >
              <div style={{ padding: 'var(--space-2)', background: 'var(--bg-glass)', borderRadius: '50%' }}>
                <Leaf color="var(--primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-2)' }}>{sug.title}</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{sug.reason}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
