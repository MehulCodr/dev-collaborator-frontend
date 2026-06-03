"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setAuthLoading(true);

      const response = await apiRequest("/auth/me");

      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      setUser(null);
      return null;
    } finally {
      setAuthLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password
      })
    });

    setUser(response.data.user);
    return response.data.user;
  };
  const register = async ({ name, email, password }) => {
    const response = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password
      })
    });

    setUser(response.data.user);
    return response.data.user;
  };
  const logout = async () => {
    try {
      await apiRequest("/auth/logout", {
        method: "POST"
      });
    } catch (error) {
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        checkAuth,
        login,
        logout,
        isAuthenticated: Boolean(user)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};