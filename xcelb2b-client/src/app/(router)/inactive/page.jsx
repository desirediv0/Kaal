"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PhoneCall } from "lucide-react";

const Inactive = () => {
  const handleContact = () => {
    window.location.href = "tel:+919871228880";
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="XcelB2B Logo"
              width={200}
              height={100}
            />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-800">
            Account Inactive
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-xl text-gray-600 mb-6">
            We apologize, but your account is currently inactive.
          </p>
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
            <p className="font-bold">Are you the site owner?</p>
            <p>
              If you believe this is an error or you need to reactivate your
              account, please contact XcelB2B directly.
            </p>
          </div>
          <p className="text-lg text-gray-700 mb-4">
            XcelB2B is your trusted partner for B2B e-commerce solutions. We
            provide cutting-edge technology to streamline your business
            operations and boost your online presence.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col items-center">
          <Button
            onClick={handleContact}
            className="bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-6 rounded-md shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center"
          >
            <PhoneCall className="mr-2 h-5 w-5" />
            Contact XcelB2B
          </Button>
          <p className="mt-4 text-sm text-gray-500">Powered by XcelB2B</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Inactive;
