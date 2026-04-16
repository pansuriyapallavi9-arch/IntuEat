import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ScanLine, Barcode, Clock, Droplets, Lightbulb, PieChart, LogOut, Sprout } from 'lucide-react';

export default function DashboardLayout() {
  const navigate = useNavigate();

  const navItems = [
    { name: 'Personal Info', path: 'personal-info', icon: User },
    { name: 'Meal Scanning', path: 'meal-scanning', icon: ScanLine },
    { name: 'Barcode Scanner', path: 'barcode-scanner', icon: Barcode },
    { name: 'Meal History', path: 'meal-history', icon: Clock },
    { name: 'Water Intake', path: 'water-intake', icon: Droplets },
    { name: 'Suggestions', path: 'suggestions', icon: Lightbulb },
    { name: 'Analytics', path: 'analytics', icon: PieChart },
  ];

  const sidebarVariants = {
    hidden: { x: -300 },
    visible: { x: 0, transition: { type: 'spring', stiffness: 100, staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const linkVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      
      {/* Sidebar */}
      <motion.aside 
        initial="hidden"
        animate="visible"
        variants={sidebarVariants}
        style={{ 
          width: '280px', 
          background: 'rgba(255, 255, 255, 0.7)', 
          backdropFilter: 'blur(30px)',
          borderRight: '1px solid rgba(108, 154, 106, 0.15)', 
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 30px rgba(108, 154, 106, 0.05)'
        }}
      >
        <div style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            style={{ width: '45px', height: '45px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(108, 154, 106, 0.3)' }}
          >
            <Sprout size={26} color="white" />
          </motion.div>
          <h2 className="title-gradient" style={{ fontSize: '2.2rem', margin: 0, letterSpacing: '-0.05em' }}>IntuEat</h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1, position: 'relative' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={{ textDecoration: 'none' }}
            >
              {({ isActive }) => (
                <motion.div
                  variants={linkVariants}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                    fontWeight: isActive ? '700' : '500',
                    transition: 'color 0.2s ease',
                    zIndex: 1
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activePill"
                      style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(108, 154, 106, 0.15) 0%, transparent 100%)', borderLeft: '4px solid var(--primary)', borderRadius: 'var(--radius-md)', zIndex: -1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon size={22} color={isActive ? 'var(--primary)' : 'currentColor'} />
                  {item.name}
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        <motion.button 
          whileHover={{ scale: 1.02, backgroundColor: 'var(--error)' }}
          whileTap={{ scale: 0.98 }}
          className="btn-secondary" 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'auto', border: '1px solid rgba(224, 108, 117, 0.3)', color: 'var(--text-muted)' }}
          onClick={() => navigate('/')}
        >
          <LogOut size={18} />
          Sign Out
        </motion.button>
      </motion.aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: 'var(--space-5)', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
