import React from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import * as authApi from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef(null);
  userRef.current = user;

  // On first load, ask the server whether the cookie in the browser is still a valid login.
  useEffect(() => {
    let active = true;
    authApi
      .fetchCurrentUser()
      .then((currentUser) => active && setUser(currentUser))
      .catch(() => {}) // a 401 here simply means "not logged in"
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // http.js fires this event when any request is rejected with 401 (e.g. the session expired).
  useEffect(() => {
    const handleUnauthorized = () => {
      if (!userRef.current) return;
      setUser(null);
      toast.info('Your session has expired. Please log in again.');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (credentials) => {
    const loggedIn = await authApi.login(credentials);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const register = useCallback(async (details) => {
    const created = await authApi.register(details);
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: Boolean(user), isAdmin: user?.role === 'admin', login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
