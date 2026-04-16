import React from 'react';
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
import './styles/global.css';

function App() {
  return (
    <BrowserRouter>
      {/* Animated soothing background */}
      <FloatingBackground />
      
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
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
