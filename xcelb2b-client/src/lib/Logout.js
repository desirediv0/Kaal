"use client";
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

const logOutApiAction = async (checkAuth, router, toast) => {
  try {
    const isAuth = await checkAuth();
    if (!isAuth) {
      router.push("/");
      return;
    }
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/user/logout`
    );
    if (res.status === 200) {
      toast({
        title: "Logout successful",
        description: "You have been logged out successfully",
        status: "success",
      });
      router.push("/");
    }
  } catch (error) {
    console.error("Logout API action failed:", error);
    toast({
      title: "Logout failed",
      description: "Failed to logout",
      status: "error",
    });
  }
};

export const LogOutButton = ({ className }) => {
  const { logout, checkAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    await logOutApiAction(checkAuth, router, toast);
    await logout();
    checkAuth();
    router.push("/");
  };

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      className={`w-full flex items-center justify-center border-red-500 text-red-500 hover:bg-red-500 hover:text-white ${className}`}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>
  );
};
