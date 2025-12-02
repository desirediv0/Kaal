"use client";

import React, { useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  UserPlus,
  Mail,
  Phone,
  MessageSquare,
  BookOpen,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const AddLead = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      message: "",
      phone: "",
      subject: "",
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const apiData = { ...data };
      if (!apiData.subject) {
        delete apiData.subject;
      }

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/leads`, apiData);

      toast({
        title: "Success",
        description: "Lead added successfully!",
      });
      reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add lead. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      event.target.tagName.toLowerCase() !== "textarea"
    ) {
      handleSubmit(onSubmit)();
    }
  };

  return (
    <div className="min-h-screen p-3">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Add New Lead</CardTitle>
            <CardDescription>
              Enter the details of the new lead below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="flex">
                    Name <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="relative">
                    <UserPlus className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      {...register("name", { required: "Name is required" })}
                      placeholder="John Doe"
                      className="pl-8"
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="flex">
                    Email <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /\S+@\S+\.\S+/,
                          message: "Invalid email address",
                        },
                      })}
                      placeholder="john@example.com"
                      className="pl-8"
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject (optional)</Label>
                  <div className="relative">
                    <BookOpen className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="subject"
                      {...register("subject")}
                      placeholder="Enter subject"
                      className="pl-8"
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      {...register("phone")}
                      placeholder="+1 (555) 123-4567"
                      className="pl-8"
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="message" className="flex">
                    Message <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="relative">
                    <MessageSquare className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="message"
                      {...register("message", {
                        required: "Message is required",
                      })}
                      placeholder="Enter lead details or notes here..."
                      className="pl-8 min-h-[100px]"
                    />
                  </div>
                  {errors.message && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.message.message}
                    </p>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => reset()}>
              Clear Form
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={loading || !isValid}
            >
              <Plus className="mr-2 h-4 w-4" />
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Lead...
                </>
              ) : (
                "Add Lead"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AddLead;
