import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService } from '../services/auth.service';
import { ROLES } from '../constants/roles';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await authService.getCurrentUser();
      if (res.data?.user || res.data) {
        setUser(res.data?.user || res.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = useCallback(async (credentials) => {
    const res = await authService.login(credentials);
    const loggedInUser = res.data?.user || res.data;
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const signup = useCallback(async (data) => {
    const res = await authService.signup(data);
    const signedUpUser = res.data?.user || res.data;
    setUser(signedUpUser);
    return signedUpUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const hasRole = useCallback((...allowedRoles) => {
    if (!user || !user.role) return false;
    return allowedRoles.includes(user.role);
  }, [user]);

  const isManagerOrAdmin = useMemo(
    () => user?.role === ROLES.ADMIN || user?.role === ROLES.INVENTORY_MANAGER,
    [user]
  );
  
  const isAdmin = useMemo(() => user?.role === ROLES.ADMIN, [user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      refreshUser: fetchCurrentUser,
      hasRole,
      isManagerOrAdmin,
      isAdmin,
    }),
    [user, loading, login, signup, logout, fetchCurrentUser, hasRole, isManagerOrAdmin, isAdmin]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
