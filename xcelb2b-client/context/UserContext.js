"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const { checkAuth } = useAuth();

  const getUserInfo = useCallback(async () => {
    const isAuth = await checkAuth();
    if (!isAuth) {
      router.push("/");
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/user/get-user`
      );
      const userData = response?.data?.data;
      setUser({
        name: userData?.name || "User",
        email: userData?.email || "user@example.com",
      });
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      setUser({
        name: "User",
        email: "user@example.com",
      });
    }
  }, [checkAuth, router]);

  useEffect(() => {
    getUserInfo();
  }, [getUserInfo]);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
