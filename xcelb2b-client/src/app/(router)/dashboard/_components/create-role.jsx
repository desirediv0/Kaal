"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  UserPlus,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserCog,
  Users,
  Briefcase,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../../../../../context/AuthContext";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const Role = {
  Manager: "Manager",
  Sales: "Sales",
  ProductManager: "ProductManager",
};

const RoleDisplay = {
  Manager: "Manager",
  Sales: "Sales",
  ProductManager: "Product Manager",
};

const RoleDescriptions = {
  Manager: {
    icon: <UserCog className="h-6 w-6 text-blue-500" />,
    description:
      "Full control over the system, except for creating roles. Can manage all aspects of the application.",
  },
  Sales: {
    icon: <Users className="h-6 w-6 text-green-500" />,
    description:
      "Can manage leads and related tasks. No access to other system controls.",
  },
  ProductManager: {
    icon: <Briefcase className="h-6 w-6 text-purple-500" />,
    description:
      "Can control and use products and category pages only. Limited to product-related functions.",
  },
};

export default function CreateRolePage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm({ mode: "onChange" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [maxUsers, setMaxUsers] = useState(0);
  const { toast } = useToast();
  const router = useRouter();
  const { checkAuth } = useAuth();

  const selectedRole = watch("role");

  useEffect(() => {
    fetchMaxUsers();
  }, []);

  const fetchMaxUsers = async () => {
    setIsLoading(true);
    try {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/");
        return;
      }
      const response = await axios.get(`${apiUrl}/user/user-limit`);
      setMaxUsers(response.data.data.maxRole - 1);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch user limit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/");
        return;
      }

      const response = await axios.post(`${apiUrl}/user/create-role`, {
        ...data,
        role: Role[data.role],
      });
      toast({
        title: "Success",
        description: "Role created successfully",
      });
    } catch (error) {
      let errorMessage = "";

      if (error.response?.data) {
        const fullError = error.response.data;
        if (fullError.includes(`Cannot create more than ${maxUsers} users.`)) {
          errorMessage = `Error: Cannot create more than ${maxUsers} users.`;
        } else if (fullError.includes("User already exists")) {
          errorMessage = "Error: User already exists with this email";
        } else {
          errorMessage = "An error occurred while creating the role.";
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-3">
      <div className="max-w-7xl w-full space-y-8 mx-auto">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Create New Role
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Add a new user role to the system (
            <span className="font-bold text-red-600">Max {maxUsers} roles</span>
            )
          </p>
        </div>
        <Card className="mt-8 space-y-4 shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-lg font-medium text-gray-900">
              Role Details
            </CardTitle>
            <CardDescription>
              Choose a role and fill in the user details
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {Object.entries(RoleDescriptions).map(
                ([key, { icon, description }]) => (
                  <Card
                    key={key}
                    className="p-4 flex flex-col items-center text-center shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="bg-gray-100 rounded-full p-3 mb-2">
                      {icon}
                    </div>
                    <h3 className="font-semibold">{RoleDisplay[key]}</h3>
                    <p className="text-sm text-gray-600 mt-2">{description}</p>
                  </Card>
                )
              )}
            </div>
            <form
              className="space-y-6 bg-white p-6 rounded-lg shadow-xl"
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name
                </Label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <Input
                    id="name"
                    placeholder="Enter name"
                    className="pl-10 rounded-md"
                    {...register("name", { required: "Name is required" })}
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </Label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email"
                    className="pl-10 rounded-md"
                    {...register("email", { required: "Email is required" })}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    className="pl-10 pr-10 rounded-md"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters",
                      },
                      pattern: {
                        value:
                          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                        message:
                          "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700"
                >
                  Role
                </Label>
                <Select
                  onValueChange={(value) =>
                    setValue("role", value, { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="w-full rounded-md">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RoleDisplay).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full rounded-md"
                disabled={isLoading || !isValid || !selectedRole}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-5 w-5" />
                    Create Role
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
