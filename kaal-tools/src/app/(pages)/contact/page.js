"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CiLocationOn } from "react-icons/ci";
import { CiMail } from "react-icons/ci";
import { PiPhoneThin } from "react-icons/pi";
import Wrapper from "@/app/_component/Wrapper";
import { submitContactForm } from "@/Api";

const contactMethods = [
  {
    icon: PiPhoneThin,
    title: "Phone",
    info: "+91 88001 99820",
  },
  {
    icon: CiMail,
    title: "Mail",
    info: "sales@kaaltools.com",
  },
  {
    icon: CiLocationOn,
    title: "Address",
    info: "Plot No.164, Udyog Vihar Phase-6, Gurugram - 122004, Haryana (India)",
  },
];

function ContactForm() {
  const searchParams = useSearchParams();
  const subject = searchParams.get("subject") || "NoSubject";
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => {
        setAlert({ show: false, type: '', message: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert.show]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.target);
      const formValues = Object.fromEntries(formData.entries());

      await submitContactForm({
        ...formValues,
        subject
      });

      setAlert({
        show: true,
        type: 'success',
        message: 'Message sent successfully!'
      });
      event.target.reset();
    } catch (error) {
      console.error(error);
      setAlert({
        show: true,
        type: 'error',
        message: error.message || "Error submitting form. Please try again later."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {alert.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${alert.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white animate-slide-in`}
          style={{
            animation: 'slideIn 0.5s ease-out forwards'
          }}>
          {alert.message}
        </div>
      )}
      <form
        className="bg-white border rounded-lg border-gray-200 py-8 md:px-16 px-8"
        onSubmit={handleSubmit}
      >


        <div className="flex flex-col pb-4 gap-2">
          <label htmlFor="name" className="text-xl">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            disabled={isLoading}
            className="border rounded-lg border-gray-200 py-2 px-3"
          />
        </div>

        <div className="flex flex-col pb-4 gap-2">
          <label htmlFor="email" className="text-xl">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            disabled={isLoading}
            className="border rounded-lg border-gray-200 py-2 px-3"
          />
        </div>

        <div className="flex flex-col pb-4 gap-2">
          <label htmlFor="phone" className="text-xl">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            disabled={isLoading}
            className="border rounded-lg border-gray-200 py-2 px-3"
          />
        </div>

        <div className="flex flex-col pb-4 gap-2">
          <label htmlFor="message" className="text-xl">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            required
            disabled={isLoading}
            className="border rounded-lg border-gray-200 p-3"
            rows={6}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-[var(--maincolor)] text-white text-xl py-2 px-4 rounded-lg transition-colors ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
            }`}
        >
          {isLoading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

export default function Component() {
  return (
    <Wrapper className="mb-6">
      <span className="w-full text-center">
        <h1 className="mb-12 text-4xl">Get in Touch</h1>
      </span>
      <div className="grid lg:grid-cols-2 grid-cols-1 gap-8">
        <section className="flex-col md:flex space-y-10">
          {contactMethods.map((items, index) => (
            <div key={index} className="flex gap-4">
              <span className="p-4 rounded-full bg-[var(--lightcolor)]">
                <items.icon color="var(--maincolor)" size={30} />
              </span>
              <span className="flex flex-col">
                <h1 className="text-xl">{items.title}</h1>
                <p>{items.info}</p>
              </span>
            </div>
          ))}
          <section>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3508.435461635643!2d76.9984648752815!3d28.43628667577246!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d170b3a384587%3A0xa68a9c5679f9008e!2sKAAL%20TOOLS!5e0!3m2!1sen!2sin!4v1751453682769!5m2!1sen!2sin"
              width="100%"
              height="310"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </section>
        </section>
        <section>
          <Suspense fallback={<div>Loading...</div>}>
            <ContactForm />
          </Suspense>
        </section>
      </div>
    </Wrapper>
  );
}