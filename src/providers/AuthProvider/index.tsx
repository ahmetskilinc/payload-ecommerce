"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/payload-types";
import {
  login as loginAction,
  logout as logoutAction,
  signup as signupAction,
  checkAuth as checkAuthAction,
} from "@/actions/auth";
import { useCart } from "@/providers/CartProvider";

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (formData: FormData) => Promise<void>;
  logout: () => Promise<void>;
  signup: (formData: FormData) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { syncCartWithServer } = useCart();

  const checkAuth = useCallback(async () => {
    try {
      if (user === null) {
        const { user: authUser } = await checkAuthAction();
        setUser(authUser);
      }
    } catch (error: Error | unknown) {
      console.error("Error checking authentication:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      const { user: loggedInUser } = await loginAction(email, password);
      setUser(loggedInUser);

      // Sync cart after successful login
      try {
        await syncCartWithServer();
      } catch (error) {
        console.error("Failed to sync cart after login:", error);
      }
    } catch (error: Error | unknown) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutAction();
      setUser(null);
      router.push("/");
    } catch (error: Error | unknown) {
      console.error("Logout error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const firstName = formData.get("firstName") as string;
      const lastName = formData.get("lastName") as string;

      const { user: newUser } = await signupAction({
        email,
        password,
        firstName,
        lastName,
      });

      setUser(newUser);

      // Sync cart after successful signup
      try {
        await syncCartWithServer();
      } catch (error) {
        console.error("Failed to sync cart after signup:", error);
      }
    } catch (error: Error | unknown) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    setUser,
    login,
    logout,
    signup,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
};
