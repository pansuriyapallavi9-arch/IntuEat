import React, { createContext, useEffect, useMemo, useState } from 'react';

export const UserContext = createContext();

const USER_STORAGE_KEY = 'intueat_user';
const TOKEN_STORAGE_KEY = 'intueat_token';

const calculateMacrosFromProfile = (profile) => {
  const { age, height, weight, gender, goal } = profile || {};
  if (!age || !height || !weight) return null;

  let bmr = (10 * Number(weight)) + (6.25 * Number(height)) - (5 * Number(age));
  bmr = gender === 'male' ? bmr + 5 : bmr - 161;

  let dailyCalories = bmr * 1.375;
  if (goal === 'lose') dailyCalories -= 500;
  else if (goal === 'gain' || goal === 'gain_muscle') dailyCalories += 500;

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
    proteinPerc = 0.25;
    fatPerc = 0.35;
    carbsPerc = 0.40;
  } else if (goal === 'keto_diet') {
    proteinPerc = 0.20;
    fatPerc = 0.70;
    carbsPerc = 0.10;
  }

  return {
    calories: Math.round(dailyCalories),
    protein: Math.round((dailyCalories * proteinPerc) / 4),
    carbs: Math.round((dailyCalories * carbsPerc) / 4),
    fat: Math.round((dailyCalories * fatPerc) / 9),
    waterGoals: Math.round((Number(weight) * 0.033) * 4),
  };
};

const getTodayDateKey = () => new Date().toISOString().slice(0, 10);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '');
  const [authLoading, setAuthLoading] = useState(Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));

  useEffect(() => {
    if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_STORAGE_KEY);
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, [token]);

  const macros = useMemo(() => calculateMacrosFromProfile(user), [user]);
  const history = useMemo(() => user?.mealHistory || [], [user]);
  const waterGoal = macros?.waterGoals || 8;
  const todayWaterLog = useMemo(
    () => (user?.waterLogs || []).find((log) => log.dateKey === getTodayDateKey()) || { dateKey: getTodayDateKey(), glasses: 0, goal: waterGoal },
    [user, waterGoal]
  );

  useEffect(() => {
    const hydrateUser = async () => {
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Session expired');
        }

        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        setUser(null);
        setToken('');
      } finally {
        setAuthLoading(false);
      }
    };

    hydrateUser();
  }, [token]);

  const authRequest = async (path, body, method = 'POST') => {
    const response = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Authentication failed.');
    }

    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const authorizedRequest = async (path, options = {}) => {
    if (!token) throw new Error('You need to sign in first.');

    const response = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed.');
    }

    return data;
  };

  const register = (payload) => authRequest('/api/auth/register', payload);
  const login = (payload) => authRequest('/api/auth/login', payload);

  const logout = () => {
    setUser(null);
    setToken('');
  };

  const saveProfile = async (data) => {
    const payload = await authorizedRequest('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    setUser(payload.user);
    return payload.user;
  };

  const addMealToHistory = async (meal) => {
    const payload = await authorizedRequest('/api/user/meal-history', {
      method: 'POST',
      body: JSON.stringify(meal),
    });

    setUser((prev) => ({ ...(prev || {}), mealHistory: payload.mealHistory }));
    return payload.meal;
  };

  const updateWaterIntake = async ({ glasses, goal = waterGoal, dateKey = getTodayDateKey() }) => {
    const payload = await authorizedRequest('/api/user/water-intake', {
      method: 'PUT',
      body: JSON.stringify({ glasses, goal, dateKey }),
    });

    setUser((prev) => ({ ...(prev || {}), waterLogs: payload.waterLogs }));
    return payload.waterLogs;
  };

  const value = useMemo(
    () => ({
      user,
      token,
      macros,
      history,
      waterIntake: todayWaterLog,
      authLoading,
      isAuthenticated: Boolean(user && token),
      register,
      login,
      logout,
      saveProfile,
      setUser,
      addMealToHistory,
      updateWaterIntake,
    }),
    [user, token, macros, history, todayWaterLog, authLoading]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
