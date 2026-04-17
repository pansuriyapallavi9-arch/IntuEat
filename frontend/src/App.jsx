import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import DashboardLayout from './pages/DashboardLayout';
import PersonalInfo from './pages/dashboard/PersonalInfo';
import MealScanning from './pages/dashboard/MealScanning';
import BarcodeScanner from './pages/dashboard/BarcodeScanner';
import MealHistory from './pages/dashboard/MealHistory';
import WaterIntake from './pages/dashboard/WaterIntake';
import DeficiencySuggestions from './pages/dashboard/DeficiencySuggestions';
import Analytics from './pages/dashboard/Analytics';
import FloatingBackground from './components/FloatingBackground';
import { UserContext } from './context/UserContext';
import './styles/global.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useContext(UserContext);

  if (authLoading) {
    return <div className="flex-center" style={{ minHeight: '100vh', color: 'var(--text-muted)' }}>Loading your account...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function OnboardingRoute() {
  const { isAuthenticated, authLoading, user } = useContext(UserContext);

  if (authLoading) {
    return <div className="flex-center" style={{ minHeight: '100vh', color: 'var(--text-muted)' }}>Loading your account...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (user?.profileCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Onboarding />;
}

function App() {
  return (
    <BrowserRouter>
      {/* Animated soothing background */}
      <FloatingBackground />
      
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/onboarding" element={<OnboardingRoute />} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="analytics" />} />
          <Route path="personal-info" element={<PersonalInfo />} />
          <Route path="meal-scanning" element={<MealScanning />} />
          <Route path="barcode-scanner" element={<BarcodeScanner />} />
          <Route path="meal-history" element={<MealHistory />} />
          <Route path="water-intake" element={<WaterIntake />} />
          <Route path="suggestions" element={<DeficiencySuggestions />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
