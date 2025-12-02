"use client";

import React, { useState, useEffect } from "react";

const Setting = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 sm:p-8">
      <div
        className={`max-w-4xl w-full mx-auto bg-white shadow-lg rounded-xl p-8 transition-all duration-1000 ease-in-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <h1 className="text-4xl font-bold mb-6 text-gray-800 animate-fade-in">
          Personalize Your Experience
        </h1>
        <p className="text-xl text-gray-600 mb-8 animate-fade-in-delay">
          Tailor the app to your preferences and workflow.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingCard
            title="Profile"
            description="Update your personal information and preferences"
            icon="👤"
          />
          <SettingCard
            title="Notifications"
            description="Manage your alerts and communication preferences"
            icon="🔔"
          />
          <SettingCard
            title="Privacy"
            description="Control your data and visibility settings"
            icon="🔒"
          />
          <SettingCard
            title="Integrations"
            description="Connect with your favorite tools and services"
            icon="🔗"
          />
        </div>
        <div className="mt-12 bg-gray-50 p-6 rounded-lg shadow-inner">
          <h2 className="text-2xl font-semibold mb-3 text-gray-800">
            Coming Soon
          </h2>
          <p className="text-gray-600">
            We're working on exciting new features to enhance your experience.
            Stay tuned for updates!
          </p>
        </div>
      </div>
    </div>
  );
};

const SettingCard = ({ title, description, icon }) => (
  <div className="bg-white p-6 rounded-lg shadow-md transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2 text-gray-800">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default Setting;
