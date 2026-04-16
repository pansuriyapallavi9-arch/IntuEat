import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('intueat_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [macros, setMacros] = useState(() => {
    const saved = localStorage.getItem('intueat_macros');
    return saved ? JSON.parse(saved) : null;
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('intueat_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (user) localStorage.setItem('intueat_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    if (macros) localStorage.setItem('intueat_macros', JSON.stringify(macros));
  }, [macros]);

  useEffect(() => {
    localStorage.setItem('intueat_history', JSON.stringify(history));
  }, [history]);

  const calculateMacros = (profile) => {
    const { age, height, weight, gender, goal } = profile;
    
    // Mifflin-St Jeor Equation to calculate Basal Metabolic Rate (BMR)
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr = gender === 'male' ? bmr + 5 : bmr - 161;

    // Daily Caloric needs assuming light activity (x 1.375)
    let dailyCalories = bmr * 1.375;

    // Adjust based on goal
    if (goal === 'lose') dailyCalories -= 500;
    else if (goal === 'gain' || goal === 'gain_muscle') dailyCalories += 500;
    // 'maintain' and 'improve_immunity' keep dailyCalories as is

    // WHO Macronutrients Split (approximate standard): 50% Carbs, 20% Protein, 30% Fat
    let proteinPerc = 0.20;
    let fatPerc = 0.30;
    let carbsPerc = 0.50;

    if (goal === 'gain' || goal === 'gain_muscle') {
       proteinPerc = 0.30;
       fatPerc = 0.25;
       carbsPerc = 0.45;
    } else if (goal === 'lose') {
       proteinPerc = 0.35;
       fatPerc = 0.30;
       carbsPerc = 0.35;
    } else if (goal === 'improve_immunity') {
       // Focus slightly more on balanced fats and proteins
       proteinPerc = 0.25;
       fatPerc = 0.35;
       carbsPerc = 0.40;
    } else if (goal === 'keto_diet') {
       proteinPerc = 0.20;
       fatPerc = 0.70;
       carbsPerc = 0.10;
    }

    const calcMacros = {
      calories: Math.round(dailyCalories),
      protein: Math.round((dailyCalories * proteinPerc) / 4), // 4 cals per gram
      carbs: Math.round((dailyCalories * carbsPerc) / 4),     // 4 cals per gram
      fat: Math.round((dailyCalories * fatPerc) / 9),         // 9 cals per gram
      waterGoals: Math.round((weight * 0.033) * 4) // Approx glasses (250ml per glass)
    };

    setMacros(calcMacros);
    return calcMacros;
  };

  const saveProfile = (data) => {
    setUser(data);
    calculateMacros(data);
  };

  const addMealToHistory = (meal) => {
    setHistory(prev => [{ id: Date.now(), ...meal }, ...prev]);
  };

  return (
    <UserContext.Provider value={{ user, macros, history, saveProfile, setUser, addMealToHistory }}>
      {children}
    </UserContext.Provider>
  );
};
