"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  LayoutDashboard,
  Package,
  Users,
  FolderKanban,
  UserRoundPlus,
  BookUser,
  Image,
  Settings,
} from "lucide-react";
import { LogOutButton } from "@/lib/Logout";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "./ui/badge";
import { FeedbackDialog } from "./feedback-dialog";

const navItems = {
  admin: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Banner", href: "/dashboard/banner", icon: Image },
    { title: "Products", href: "/dashboard/products", icon: Package },
    { title: "Leads", href: "/dashboard/leads", icon: Users },
    {
      title: "Categories",
      href: "/dashboard/category-manage",
      icon: FolderKanban,
    },
    {
      title: "All Roles",
      href: "/dashboard/all-roles",
      icon: BookUser,
    },
    {
      title: "Create Role",
      href: "/dashboard/create-role",
      icon: UserRoundPlus,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ],

  manager: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Banner", href: "/dashboard/banner", icon: Image },
    { title: "Products", href: "/dashboard/products", icon: Package },
    { title: "Leads", href: "/dashboard/leads", icon: Users },
    {
      title: "Categories",
      href: "/dashboard/category-manage",
      icon: FolderKanban,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ],
  sales: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Leads", href: "/dashboard/leads", icon: Users },
  ],
  productmanager: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Products", href: "/dashboard/products", icon: Package },
    {
      title: "Categories",
      href: "/dashboard/category-manage",
      icon: FolderKanban,
    },
  ],
};

const roleDisplayNames = {
  admin: "Admin",
  manager: "Manager",
  sales: "Sales",
  productmanager: "Product Manager",
};

const roleColorMap = {
  admin: "bg-orange-500 text-white",
  manager: "bg-blue-500 text-white",
  sales: "bg-green-500 text-white",
  productmanager: "bg-purple-500 text-white",
};

export function Sidenav() {
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const pathname = usePathname();
  const { checkAuth } = useAuth();
  const router = useRouter();

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
      setRole(userData.role || "User");
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      setRole("User");
    } finally {
      setLoading(false);
    }
  }, [checkAuth, router]);

  useEffect(() => {
    getUserInfo();
  }, [getUserInfo]);

  const handleSheetClose = () => {
    setIsSheetOpen(false);
  };

  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed top-4 left-4 z-40 shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0 border-r">
          <MobileNav onClose={handleSheetClose} />
        </SheetContent>
      </Sheet>
      <nav className="hidden md:block fixed top-0 left-0 h-full w-60 border-r bg-background">
        <ScrollArea className="h-full py-6 pl-4 pr-2">
          <div className="mb-4 px-2">
            <Link
              href={"/dashboard"}
              className="text-2xl font-semibold tracking-tight text-[#036280]"
            >
              Xcel B2B
            </Link>
          </div>
          <div className="mb-4 px-2">
            {loading ? (
              <Skeleton className="h-4 w-24 bg-gray-300" />
            ) : (
              <p className="text-sm font-medium text-gray-600">
                <Badge
                  className={
                    roleColorMap[role.toLowerCase()] || "bg-gray-500 text-white"
                  }
                >
                  {roleDisplayNames[role.toLowerCase()] || "User"}
                </Badge>
              </p>
            )}
          </div>
          {loading ? <SkeletonNavItems /> : <SidenavItems />}
        </ScrollArea>
        <div className="absolute bottom-0 w-full p-4">
          <FeedbackDialog />
          <LogOutButton />
        </div>
      </nav>
    </>
  );

  function MobileNav({ onClose }) {
    return (
      <ScrollArea className="h-full py-6 pl-4 pr-2">
        <div className="mb-4 px-2">
          <Link
            href={"/dashboard"}
            className="text-2xl font-semibold tracking-tight text-[#036280]"
          >
            Xcel B2B
          </Link>
        </div>
        <div className="mb-4 px-2">
          {loading ? (
            <Skeleton className="h-4 w-24 bg-gray-300 rounded" />
          ) : (
            <p className="text-sm font-medium text-gray-600">
              Role:{" "}
              <Badge
                className={
                  roleColorMap[role.toLowerCase()] || "bg-gray-500 text-white"
                }
              >
                {roleDisplayNames[role.toLowerCase()] || "User"}
              </Badge>
            </p>
          )}
        </div>
        {loading ? <SkeletonNavItems /> : <SidenavItems onClose={onClose} />}
        <div className="absolute bottom-2 w-full -translate-x-1/2 left-1/2 px-3">
          <FeedbackDialog />
          <LogOutButton />
        </div>
      </ScrollArea>
    );
  }

  function SidenavItems({ onClose }) {
    const normalizedRole = role.toLowerCase().replace(/\s+/g, "");
    const items = navItems[normalizedRole] || navItems.admin;

    return (
      <div className="space-y-1">
        {items.map((item) => (
          <Link key={item.href} href={item.href} onClick={onClose}>
            <span
              className={cn(
                "group flex items-center rounded-md px-3 py-2 my-1 text-base  hover:bg-gray-200 hover:text-gray-200-foreground",
                pathname === item.href ? "bg-gray-200" : "transparent"
              )}
            >
              <item.icon className="mr-2 h-5 w-5" />
              <span>{item.title}</span>
            </span>
          </Link>
        ))}
      </div>
    );
  }

  function SkeletonNavItems() {
    return (
      <div className="space-y-1">
        {[...Array(5)].map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }
}
