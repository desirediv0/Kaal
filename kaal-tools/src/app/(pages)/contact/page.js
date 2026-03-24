import ContactPageClient from "./ContactPageClient";

export const metadata = {
  title: "Contact Us | Kaal Tools - Engineering Tools & Industrial Supplies",
  description:
    "Contact Kaal Tools for engineering tools, machine tool accessories & industrial supplies. Phone: +91 88001 99820, Email: sales@kaaltools.com. Gurugram, Haryana.",
  openGraph: {
    title: "Contact Us | Kaal Tools",
    description:
      "Get in touch with Kaal Tools for premium engineering tools and industrial supplies.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | Kaal Tools",
    description:
      "Get in touch with Kaal Tools for premium engineering tools and industrial supplies.",
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
